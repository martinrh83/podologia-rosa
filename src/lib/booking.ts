import "server-only";

import { getAvailability, isSlotBookable } from "@/lib/availability";
import type { BookingInput } from "@/lib/booking-schema";
import { ACTIVE_STATUSES, type Appointment } from "@/lib/db/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * How a double-booking surfaces from Postgres.
 *
 * `23P01` is the exclusion constraint rejecting an overlap — the normal case.
 * `23505` is kept because older databases may still carry the unique index on
 * `starts_at` that migration 0003 replaces.
 */
const OVERLAP_CODES = ["23P01", "23505"];

export { bookingSchema, normalizePhone, type BookingInput } from "@/lib/booking-schema";

export type BookingFailure =
  | { ok: false; reason: "slot_taken"; message: string }
  | { ok: false; reason: "slot_unavailable"; message: string }
  | { ok: false; reason: "contact_limit"; message: string }
  | { ok: false; reason: "consent_required"; message: string }
  | { ok: false; reason: "error"; message: string };

export type BookingResult = { ok: true; appointment: Appointment } | BookingFailure;

/**
 * Create a turno.
 *
 * Everything here is re-validated server-side. The slot the client posts is
 * never trusted: the list it came from may be seconds stale, and the request may
 * not have come from the form at all.
 */
export async function createBooking(
  input: BookingInput,
  { audience }: { audience: "public" | "admin" },
): Promise<BookingResult> {
  const startsAt = new Date(input.startsAt);

  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, reason: "slot_unavailable", message: "Ese horario no es válido." };
  }

  // Consent is only meaningful when the patient gives it themselves. When Rosa
  // takes a booking by phone she is the one entering it, so the checkbox does
  // not apply and no consent timestamp is recorded.
  if (audience === "public" && !input.consent) {
    return {
      ok: false,
      reason: "consent_required",
      message: "Necesitamos tu consentimiento para guardar tus datos.",
    };
  }

  const supabase = createSupabaseAdminClient();

  const bookable = await isSlotBookable(startsAt, audience);
  if (!bookable) {
    return {
      ok: false,
      reason: "slot_unavailable",
      message: "Ese horario ya no está disponible. Elegí otro, por favor.",
    };
  }

  const { settings } = await getAvailability({
    from: startsAt,
    to: new Date(startsAt.getTime() + 1),
    audience,
  });

  // Cap active future turnos per contact. Applies to the public form only —
  // Rosa is not rate-limited against her own calendar.
  if (audience === "public") {
    const { count, error: countError } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("patient_phone", input.patientPhone)
      .in("status", ACTIVE_STATUSES)
      .gte("starts_at", new Date().toISOString());

    if (!countError && (count ?? 0) >= settings.max_active_per_contact) {
      return {
        ok: false,
        reason: "contact_limit",
        message: `Ya tenés ${count} turnos reservados. Si necesitás otro, escribinos.`,
      };
    }
  }

  const endsAt = new Date(startsAt.getTime() + settings.slot_minutes * 60_000);

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "booked",
      source: audience === "admin" ? "admin" : "online",
      patient_name: input.patientName,
      patient_phone: input.patientPhone,
      patient_email: input.patientEmail || null,
      motivo: input.motivo || null,
      consent_at: audience === "public" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) {
    // The database refused an overlap: someone took this time between our
    // availability check and this insert. This is the race working as designed.
    if (OVERLAP_CODES.includes(error.code ?? "")) {
      return {
        ok: false,
        reason: "slot_taken",
        message: "Alguien acaba de tomar ese turno. Elegí otro horario, por favor.",
      };
    }

    return { ok: false, reason: "error", message: "No pudimos guardar el turno." };
  }

  return { ok: true, appointment: data as Appointment };
}

/** Release a turno by its cancel token. Idempotent: cancelling twice is fine. */
export async function cancelByToken(
  token: string,
): Promise<{ ok: true; appointment: Appointment } | { ok: false; reason: "not_found" }> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("cancel_token", token)
    .in("status", ["booked"])
    .select("*")
    .single();

  if (error || !data) {
    // Either the token is wrong or the turno was already cancelled. Look it up
    // so an already-cancelled turno still shows a friendly page.
    const { data: existing } = await supabase
      .from("appointments")
      .select("*")
      .eq("cancel_token", token)
      .single();

    if (existing) return { ok: true, appointment: existing as Appointment };
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, appointment: data as Appointment };
}

/** Look up a turno by its cancel token without changing it. */
export async function getByToken(token: string): Promise<Appointment | null> {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("cancel_token", token)
    .maybeSingle();

  return (data as Appointment | null) ?? null;
}
