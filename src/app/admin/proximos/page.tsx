import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass, TEXT_ACTION } from "@/components/admin/button-styles";
import { PageHeading, SectionHeading } from "@/components/admin/page-heading";
import { AppointmentCard } from "@/components/appointment-card";
import { FIELD, Label } from "@/components/fields";
import { Notice } from "@/components/notice";
import { PractitionerFilter } from "@/components/practitioner-filter";
import { requireStaff } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { getUpcomingAppointments } from "@/lib/db/appointments";
import { listActiveLocations } from "@/lib/db/locations";
import { listActivePractitioners } from "@/lib/db/practitioners";
import { capitalizeFirst, formatDay, formatShortDay, toLocalDateKey } from "@/lib/format";
import { localDayRange } from "@/lib/slots";
import { groupByLocalDay, sanitizeSearch } from "@/lib/upcoming";

export const metadata: Metadata = {
  title: "Próximos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Todos los turnos que vienen, día por día.
 *
 * Responde lo que Hoy y Mañana no: cómo viene la semana, qué hay el jueves, y
 * cuándo es el turno de alguien de quien no se sabe la fecha. Empieza hoy, y no
 * pasado mañana, para que buscar a alguien que viene mañana no dé vacío.
 *
 * La búsqueda es un formulario GET, como el filtro son links: cada búsqueda es
 * una URL, y no hace falta JavaScript en el cliente.
 */
export default async function AdminUpcomingPage({ searchParams }: PageProps<"/admin/proximos">) {
  await requireStaff();

  const params = await searchParams;
  const practitionerId = typeof params.profesional === "string" ? params.profesional : null;
  const search = sanitizeSearch(params.q);

  const [appointments, practitioners, locations] = await Promise.all([
    getUpcomingAppointments({ practitionerId, search }),
    listActivePractitioners(),
    listActiveLocations(),
  ]);

  const base = siteUrl();
  const now = new Date();
  const todayKey = toLocalDateKey(now);
  // «Hoy lunes, 21 de septiembre», como se dice: el día relativo va en la frase
  // y no en una etiqueta aparte.
  const relative = new Map([
    [todayKey, "Hoy"],
    [toLocalDateKey(localDayRange(now, 1).start), "Mañana"],
  ]);
  const days = groupByLocalDay(appointments);
  const clearHref = practitionerId
    ? `/admin/proximos?profesional=${practitionerId}`
    : "/admin/proximos";

  return (
    <div>
      <PageHeading title="Próximos" />

      <form action="/admin/proximos" role="search" className="mb-6">
        {practitionerId && <input type="hidden" name="profesional" value={practitionerId} />}
        <Label htmlFor="q">Buscar paciente</Label>
        <div className="mt-2 flex gap-2">
          {/*
            Texto y no `type="search"`: Safari le redondea las esquinas y Chrome
            le agrega una cruz propia. La tecla del teclado dice «Buscar» igual.
          */}
          <input
            id="q"
            name="q"
            type="text"
            enterKeyHint="search"
            defaultValue={search ?? ""}
            placeholder="Apellido o teléfono"
            autoComplete="off"
            className={`${FIELD} min-w-0 flex-1 border-border`}
          />
          <button type="submit" className={buttonClass("ink")}>
            Buscar
          </button>
        </div>
      </form>

      <PractitionerFilter
        practitioners={practitioners}
        selected={practitionerId}
        basePath="/admin/proximos"
        keep={search ? { q: search } : {}}
      />

      {/*
        El índice de días: la forma de las próximas semanas sin bajar, y un
        toque para ir al jueves. Las mismas fichas de día de la reserva, que
        acá son enlaces a cada día de la lista. Con búsqueda no va: la lista ya
        es corta.
      */}
      {!search && days.length > 1 && (
        <nav aria-labelledby="ir-al-dia" className="mb-8">
          {/* Rótulo del grupo, como el «Día» de la reserva: sin él, estas fichas
              se confundían con las del filtro, que están justo arriba. */}
          <p id="ir-al-dia" className="font-narrow text-sm font-bold uppercase tracking-[0.1em] text-muted">
            Ir al día
          </p>
          <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {days.map((day) => (
              <li key={day.dayKey}>
                <a
                  href={`#dia-${day.dayKey}`}
                  className="block border-2 border-border bg-surface px-2 py-2.5 text-center transition-[border-color,transform] duration-100 hover:border-accent active:translate-y-0.5"
                >
                  <span className="block font-narrow text-[0.95rem] font-bold uppercase tracking-[0.08em]">
                    {relative.get(day.dayKey) ??
                      capitalizeFirst(formatShortDay(day.appointments[0].starts_at))}
                  </span>
                  <span className="block text-[0.8rem] text-muted">
                    {day.appointments.length} {day.appointments.length === 1 ? "turno" : "turnos"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {search && appointments.length > 0 && (
        <p className="mb-6 flex flex-wrap items-center gap-x-4 text-[0.95rem] text-muted">
          <span>
            {appointments.length} {appointments.length === 1 ? "turno" : "turnos"} para «{search}»
          </span>
          <Link href={clearHref} className={TEXT_ACTION}>
            Limpiar la búsqueda
          </Link>
        </p>
      )}

      {appointments.length === 0 ? (
        search ? (
          <Notice tone="muted" title={`No hay turnos próximos para «${search}»`}>
            Probá sólo con el apellido, o con el teléfono. O{" "}
            <Link href={clearHref} className="font-bold text-accent underline underline-offset-4">
              limpiá la búsqueda
            </Link>{" "}
            para ver todos.
          </Notice>
        ) : (
          <Notice tone="muted" title="No hay turnos próximos">
            Los que se reserven por la web o cargues en{" "}
            <Link href="/admin/nuevo" className="font-bold text-accent underline underline-offset-4">
              Nuevo turno
            </Link>{" "}
            aparecen acá.
          </Notice>
        )
      ) : (
        // Una raya de 2px abre cada día, como las secciones de Agenda; el primero
        // no la lleva porque la raya doble del título ya lo abre. El último
        // turno de cada día pierde su renglón, que si no quedaba pegado a esa
        // raya: dos líneas en un centímetro.
        <div className="space-y-10">
          {days.map((day, index) => (
            <section
              key={day.dayKey}
              id={`dia-${day.dayKey}`}
              aria-labelledby={`dia-${day.dayKey}-titulo`}
              // Que el encabezado fijo del sitio no tape el día al saltar a él.
              className={`scroll-mt-20 ${index > 0 ? "border-t-2 border-foreground pt-6" : ""}`}
            >
              <SectionHeading id={`dia-${day.dayKey}-titulo`}>
                {relative.has(day.dayKey)
                  ? `${relative.get(day.dayKey)} ${formatDay(day.appointments[0].starts_at)}`
                  : capitalizeFirst(formatDay(day.appointments[0].starts_at))}
              </SectionHeading>
              <ul className="mt-1 [&>li:last-child]:border-b-0 [&>li:last-child]:pb-0">
                {day.appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    siteUrl={base}
                    showPractitioner={!practitionerId}
                    showLocation={locations.length > 1}
                    withDay
                    showOutcome={day.dayKey === todayKey}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
