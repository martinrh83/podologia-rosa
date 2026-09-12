import { NextResponse, type NextRequest } from "next/server";

import { getAvailability } from "@/lib/availability";

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
  if (!practitionerId) {
    return NextResponse.json({ error: "Falta el profesional." }, { status: 400 });
  }

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return NextResponse.json({ error: "Rango de fechas inválido." }, { status: 400 });
  }

  // Cap the window so one request cannot ask the engine to expand a decade.
  const MAX_WINDOW_DAYS = 60;
  if (to.getTime() - from.getTime() > MAX_WINDOW_DAYS * 86_400_000) {
    return NextResponse.json({ error: "Rango de fechas demasiado amplio." }, { status: 400 });
  }

  const { slots } = await getAvailability({ practitionerId, from, to, audience: "public" });

  return NextResponse.json({
    slots: slots.map((slot) => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
    })),
  });
}
