import { NextResponse, type NextRequest } from "next/server";

import { createBooking } from "@/lib/booking";
import { bookingSchema } from "@/lib/booking-schema";
import { fieldErrorsOf, MESSAGES } from "@/lib/forms";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Public booking endpoint.
 *
 * Unauthenticated by design — patients do not have accounts — so this handler is
 * the only thing standing between the open internet and Rosa's calendar. It
 * re-validates everything: the payload shape, the request rate, the slot's
 * availability, the booking horizon and the per-contact cap. Nothing the client
 * sends is taken on trust.
 *
 * Sends no email: the clinic has no verified domain, so the confirmation lives
 * on screen and the cancel link is handed to the patient there.
 */
export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: MESSAGES.checkFields }, { status: 400 });
  }

  // Los errores van por campo, con el mismo texto que el formulario muestra al
  // validar del lado del navegador: el schema es el mismo. El formulario los
  // pone en cada campo; `error` queda para quien no los sepa leer.
  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: MESSAGES.checkFields, fieldErrors: fieldErrorsOf(parsed.error) },
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

  return NextResponse.json(
    {
      id: result.appointment.id,
      startsAt: result.appointment.starts_at,
      // The patient's only route back to this turno. With no email to carry it,
      // the confirmation screen shows it and tells them to keep it.
      cancelToken: result.appointment.cancel_token,
    },
    { status: 201 },
  );
}
