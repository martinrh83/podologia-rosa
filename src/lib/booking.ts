import "server-only";

import { findBookableSlot, getAvailability, PractitionerNotFound } from "@/lib/availability";
import { CONSENT_REQUIRED_MESSAGE, type BookingInput } from "@/lib/booking-schema";
import type { Appointment } from "@/lib/db/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * How a double-booking surfaces from Postgres.
 *
 * `23505` es el caso normal: el índice único de 0008 rechaza un segundo turno
 * con la misma hora de inicio para la misma profesional. `23P01` se queda
 * porque es lo que devolvería la restricción de exclusión de 0003/0006 si
 * alguna vez se vuelve a ella — y porque una base que todavía no corrió 0008
 * la tiene puesta.
 */
const OVERLAP_CODES = ["23P01", "23505"];

export { bookingSchema, normalizePhone, type BookingInput } from "@/lib/booking-schema";

export type BookingFailure =
  | { ok: false; reason: "slot_taken"; message: string }
  | { ok: false; reason: "slot_unavailable"; message: string }
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
      message: CONSENT_REQUIRED_MESSAGE,
    };
  }

  const supabase = createSupabaseAdminClient();

  // La sede sale del horario que el motor considera reservable, no de lo que
  // mande el cliente: es la agenda la que decide dónde se atiende ese día.
  //
  // El id del profesional también viene del cliente, así que puede apuntar a
  // alguien que se dio de baja entre que se cargó la página y se mandó el
  // formulario. Eso es una petición que no se puede cumplir, no una falla:
  // dejarlo propagar daba un 500.
  let slot;
  try {
    slot = await findBookableSlot(input.practitionerId, startsAt, audience);
  } catch (error) {
    if (error instanceof PractitionerNotFound) {
      return {
        ok: false,
        reason: "slot_unavailable",
        message: "Ese profesional ya no está tomando turnos. Elegí otro, por favor.",
      };
    }
    throw error;
  }

  if (!slot) {
    return {
      ok: false,
      reason: "slot_unavailable",
      message: "Ese horario ya no está disponible. Elegí otro, por favor.",
    };
  }

  const { practitioner } = await getAvailability({
    practitionerId: input.practitionerId,
    from: startsAt,
    to: new Date(startsAt.getTime() + 1),
    audience,
  });

  const endsAt = new Date(startsAt.getTime() + practitioner.slot_minutes * 60_000);

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      practitioner_id: input.practitionerId,
      location_id: slot.locationId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "booked",
      source: audience === "admin" ? "admin" : "online",
      patient_first_name: input.patientFirstName,
      patient_last_name: input.patientLastName,
      patient_dni: input.patientDni,
      patient_coverage: input.patientCoverage,
      patient_phone: input.patientPhone,
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
