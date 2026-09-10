import { NextResponse, type NextRequest } from "next/server";

import { getClinicSettings } from "@/lib/availability";
import { createBooking } from "@/lib/booking";
import { bookingSchema } from "@/lib/booking-schema";
import { sendPatientConfirmation, sendStaffNotification } from "@/lib/email";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Public booking endpoint.
 *
 * Unauthenticated by design — patients do not have accounts — so this handler is
 * the only thing standing between the open internet and Rosa's calendar. It
 * re-validates everything: the payload shape, the request rate, the slot's
 * availability, the booking horizon and the per-contact cap. Nothing the client
 * sends is taken on trust.
 */
export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Revisá los datos del formulario." },
      { status: 400 },
    );
  }

  const rate = await checkRateLimit("booking", clientIp(request), {
    limit: 5,
    windowMinutes: 60,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en un rato o escribinos." },
      { status: 429 },
    );
  }

  const result = await createBooking(parsed.data, { audience: "public" });

  if (!result.ok) {
    // A lost race is a conflict, not a client error: the request was valid, the
    // world just changed underneath it. The UI uses this to refresh the slots.
    const status = result.reason === "slot_taken" ? 409 : 400;
    return NextResponse.json({ error: result.message, reason: result.reason }, { status });
  }

  // The turno is committed. Email is best-effort from here on: a mail failure
  // must not turn a real booking into an error the patient sees.
  const settings = await getClinicSettings();
  await Promise.allSettled([
    sendPatientConfirmation({ appointment: result.appointment, settings }),
    sendStaffNotification({ appointment: result.appointment, settings }),
  ]);

  return NextResponse.json(
    {
      id: result.appointment.id,
      startsAt: result.appointment.starts_at,
      cancelToken: result.appointment.cancel_token,
    },
    { status: 201 },
  );
}
