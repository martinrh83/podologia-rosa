import type { Metadata } from "next";
import Link from "next/link";

import { AdminBookingForm, type AdminSlot } from "@/components/admin/booking-form";
import { PageHeading } from "@/components/admin/page-heading";
import { Notice } from "@/components/notice";
import { SlotFilters } from "@/components/slot-filters";
import { getAvailability } from "@/lib/availability";
import { listActiveLocations } from "@/lib/db/locations";
import { listActivePractitioners, practitionerName } from "@/lib/db/practitioners";
import { requireStaff } from "@/lib/auth";
import { formatDay, formatTime, toLocalDateKey } from "@/lib/format";
import { localDayRangeFromKey } from "@/lib/slots";

export const metadata: Metadata = {
  title: "Nuevo turno",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Manual booking for phone and walk-in patients.
 *
 * No booking horizon here (audience: "admin"), so Rosa can put someone in two
 * months out while they are standing in front of her — the routine-chiropody
 * rebooking that the public 15-day cap deliberately blocks.
 */
export default async function AdminNewPage({ searchParams }: PageProps<"/admin/nuevo">) {
  await requireStaff();

  const params = await searchParams;
  // La hora del turno recién guardado. Sólo la hora: el paciente no va en la URL.
  const savedAt = typeof params.guardado === "string" ? new Date(params.guardado) : null;
  const saved = savedAt && !Number.isNaN(savedAt.getTime()) ? savedAt : null;
  const dateKey = typeof params.fecha === "string" ? params.fecha : toLocalDateKey(new Date());

  const [practitioners, locations] = await Promise.all([
    listActivePractitioners(),
    listActiveLocations(),
  ]);
  const locationName = new Map(locations.map((row) => [row.id, row.name]));

  // El profesional define qué horarios existen —su agenda, su duración— así que
  // se elige antes que la fecha, no después.
  const requested = typeof params.profesional === "string" ? params.profesional : null;
  const practitioner =
    practitioners.find((row) => row.id === requested) ?? practitioners[0] ?? null;

  let slots: AdminSlot[] = [];
  let dateError: string | null = null;

  if (practitioner) {
    try {
      const range = localDayRangeFromKey(dateKey);
      const availability = await getAvailability({
        practitionerId: practitioner.id,
        from: range.start,
        to: range.end,
        audience: "admin",
      });
      slots = availability.slots.map((slot) => ({
        value: slot.start.toISOString(),
        time: formatTime(slot.start),
        // La sede va en la ficha: el secretario tiene que saber dónde está
        // citando al paciente, y ese día puede estar partido entre las dos.
        location: locations.length > 1 ? locationName.get(slot.locationId) : undefined,
      }));
    } catch {
      dateError = "Esa fecha no es válida.";
    }
  }

  return (
    <div>
      <PageHeading title="Nuevo turno" />

      {saved && (
        <div className="mb-6">
          <Notice tone="success" title="Turno guardado">
            Para el {formatDay(saved)} a las {formatTime(saved)}. Ya no se ofrece online.
          </Notice>
        </div>
      )}

      <SlotFilters
        practitioners={practitioners.map((row) => ({ id: row.id, name: practitionerName(row) }))}
        practitionerId={practitioner?.id ?? ""}
        dateKey={dateKey}
      />

      {!practitioner ? (
        <Notice tone="muted" title="Todavía no hay profesionales">
          Cargá la primera en{" "}
          <Link href="/admin/profesionales" className="font-bold text-accent underline underline-offset-4">
            Profesionales
          </Link>
          .
        </Notice>
      ) : dateError ? (
        <Notice tone="danger" title={dateError}>
          Elegí otra fecha en el calendario.
        </Notice>
      ) : slots.length === 0 ? (
        <Notice tone="muted" title="No quedan horarios libres ese día">
          Probá otra fecha, o revisá los horarios y cierres en{" "}
          <Link href="/admin/agenda" className="font-bold text-accent underline underline-offset-4">
            Agenda
          </Link>
          .
        </Notice>
      ) : (
        // La clave vuelve a armar el formulario vacío después de guardar, listo
        // para la próxima llamada. Entre día y día, en cambio, lo escrito queda.
        <AdminBookingForm
          key={saved?.toISOString() ?? "nuevo"}
          practitionerId={practitioner.id}
          dateKey={dateKey}
          slots={slots}
        />
      )}
    </div>
  );
}
