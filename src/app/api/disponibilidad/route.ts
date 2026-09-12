import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getAvailability, PractitionerNotFound } from "@/lib/availability";

/**
 * Free slots for a window, used by the booking form when the visitor changes day.
 *
 * Returns start instants only — never patient data, never which patient holds a
 * taken slot. "Busy" is expressed purely by absence.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const practitionerId = searchParams.get("profesional") ?? "";
  const from = new Date(searchParams.get("from") ?? "");
  const to = new Date(searchParams.get("to") ?? "");

  // No existe "la disponibilidad del consultorio": cada profesional tiene su
  // agenda y su duración de turno.
  //
  // Se valida la forma antes de tocar la base: un id que no es un uuid hace que
  // Postgres rechace la comparación y eso salía como un 500, que es decirle al
  // cliente "me rompí" cuando lo que pasó es que preguntó mal.
  if (!z.uuid().safeParse(practitionerId).success) {
    return NextResponse.json({ error: "Falta el profesional o no es válido." }, { status: 400 });
  }

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return NextResponse.json({ error: "Rango de fechas inválido." }, { status: 400 });
  }

  // Cap the window so one request cannot ask the engine to expand a decade.
  const MAX_WINDOW_DAYS = 60;
  if (to.getTime() - from.getTime() > MAX_WINDOW_DAYS * 86_400_000) {
    return NextResponse.json({ error: "Rango de fechas demasiado amplio." }, { status: 400 });
  }

  let slots;
  try {
    ({ slots } = await getAvailability({ practitionerId, from, to, audience: "public" }));
  } catch (error) {
    // Un id que no corresponde a nadie es una petición mal formada, no una falla
    // del servidor. Antes cualquiera de los dos casos daba 500.
    if (error instanceof PractitionerNotFound) {
      return NextResponse.json({ error: "Ese profesional no existe." }, { status: 404 });
    }
    throw error;
  }

  return NextResponse.json({
    slots: slots.map((slot) => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
    })),
  });
}
