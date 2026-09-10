import type { Metadata } from "next";

import { BookingFlow, type BookingDay } from "@/components/booking-flow";
import { getAvailability } from "@/lib/availability";
import { formatDay, formatShortDay, formatTime, toLocalDateKey } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sacar un turno",
  description:
    "Elegí el día y el horario que te queden cómodos. No hace falta crear una cuenta ni llamar por teléfono.",
};

// Availability changes on every booking, so this page must never be cached.
export const dynamic = "force-dynamic";

/**
 * Outer bound on the query window. The real limit is `horizon_days`, which lives
 * in the database and is applied inside the slot engine — this only stops one
 * page render from asking for an unbounded range if Rosa sets a huge horizon.
 */
const MAX_WINDOW_DAYS = 60;

export default async function TurnosPage() {
  const now = new Date();
  const { slots, settings } = await getAvailability({
    from: now,
    to: new Date(now.getTime() + MAX_WINDOW_DAYS * 86_400_000),
    audience: "public",
    now,
  });

  // Group into days here rather than in the client component: it keeps the
  // browser bundle free of timezone formatting for dates it never re-derives.
  const byDay = new Map<string, BookingDay>();
  for (const slot of slots) {
    const key = toLocalDateKey(slot.start);
    const day = byDay.get(key) ?? {
      key,
      label: formatDay(slot.start),
      shortLabel: formatShortDay(slot.start),
      slots: [],
    };
    day.slots.push({ startsAt: slot.start.toISOString(), label: formatTime(slot.start) });
    byDay.set(key, day);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sacar un turno</h1>
        <p className="mt-3 text-lg text-muted">
          Elegí el día y el horario que te queden cómodos. Cada turno dura{" "}
          {settings.slot_minutes} minutos.
        </p>
      </header>

      <BookingFlow
        days={[...byDay.values()]}
        horizonDays={settings.horizon_days}
        clinicPhone={settings.phone}
      />
    </div>
  );
}
