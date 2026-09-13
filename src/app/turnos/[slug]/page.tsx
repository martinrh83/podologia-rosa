import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookingFlow, type BookingDay } from "@/components/booking-flow";
import { getAvailability } from "@/lib/availability";
import { listActiveLocations } from "@/lib/db/locations";
import { getPractitionerBySlug, practitionerName } from "@/lib/db/practitioners";
import { formatDay, formatShortDay, formatTime, toLocalDateKey } from "@/lib/format";

// Availability changes on every booking, so this page must never be cached.
export const dynamic = "force-dynamic";

/**
 * Outer bound on the query window. The real limit is `horizon_days`, which lives
 * in the database and is applied inside the slot engine — this only stops one
 * page render from asking for an unbounded range if Rosa sets a huge horizon.
 */
const MAX_WINDOW_DAYS = 60;

export async function generateMetadata({
  params,
}: PageProps<"/turnos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const practitioner = await getPractitionerBySlug(slug);

  if (!practitioner) return { title: "Profesional no encontrado" };

  const name = practitionerName(practitioner);

  return {
    title: `Turnos con ${name}`,
    description: `Mirá los horarios disponibles de ${name}${
      practitioner.title ? `, ${practitioner.title.toLowerCase()}` : ""
    }, y sacá tu turno online.`,
  };
}

export default async function AgendaProfesionalPage({ params }: PageProps<"/turnos/[slug]">) {
  const { slug } = await params;
  const practitioner = await getPractitionerBySlug(slug);

  // Un profesional dado de baja cae acá: el link que quedó en un WhatsApp viejo
  // deja de reservar en vez de seguir tomando turnos para quien ya no atiende.
  if (!practitioner) notFound();

  const now = new Date();
  const [{ slots, settings }, locations] = await Promise.all([
    getAvailability({
    practitionerId: practitioner.id,
    from: now,
    to: new Date(now.getTime() + MAX_WINDOW_DAYS * 86_400_000),
      audience: "public",
      now,
    }),
    listActiveLocations(),
  ]);

  // Group into days here rather than in the client component: it keeps the
  // browser bundle free of timezone formatting for dates it never re-derives.
  const byDay = new Map<string, BookingDay>();
  for (const slot of slots) {
    const key = toLocalDateKey(slot.start);
    const day = byDay.get(key) ?? {
      key,
      label: formatDay(slot.start),
      shortLabel: formatShortDay(slot.start),
      locationName: null,
      slots: [],
    };
    day.slots.push({
      startsAt: slot.start.toISOString(),
      label: formatTime(slot.start),
      locationId: slot.locationId,
    });
    byDay.set(key, day);
  }

  // El nombre de la sede sube al día cuando el día entero se atiende en una
  // sola, que es el caso normal. Si está partido queda en null y la sede pasa a
  // mostrarse en cada horario.
  const locationName = new Map(locations.map((location) => [location.id, location.name]));
  for (const day of byDay.values()) {
    const ids = new Set(day.slots.map((slot) => slot.locationId));
    day.locationName = ids.size === 1 ? (locationName.get([...ids][0]) ?? null) : null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sacar un turno</h1>
        <p className="mt-3 text-lg text-muted">
          Son dos pasos y no hace falta crear una cuenta. Cada turno dura{" "}
          {practitioner.slot_minutes} minutos.
        </p>
      </header>

      <BookingFlow
        locations={locations.map((location) => ({
          id: location.id,
          name: location.name,
          address: location.address,
        }))}
        practitioner={{
          id: practitioner.id,
          name: practitionerName(practitioner),
          title: practitioner.title,
        }}
        days={[...byDay.values()]}
        horizonDays={settings.horizon_days}
        clinicPhone={settings.phone}
        clinicWhatsapp={settings.whatsapp}
        clinicName={settings.clinic_name}
      />
    </div>
  );
}
