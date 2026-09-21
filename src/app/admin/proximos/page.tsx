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
import { capitalizeFirst, formatDay, toLocalDateKey } from "@/lib/format";
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
  const dayTag = new Map([
    [toLocalDateKey(now), "Hoy"],
    [toLocalDateKey(localDayRange(now, 1).start), "Mañana"],
  ]);
  const days = groupByLocalDay(appointments);
  const clearHref = practitionerId
    ? `/admin/proximos?profesional=${practitionerId}`
    : "/admin/proximos";

  return (
    <div>
      <PageHeading title="Próximos" />

      <form action="/admin/proximos" className="mb-6">
        {practitionerId && <input type="hidden" name="profesional" value={practitionerId} />}
        <Label htmlFor="q">Buscar paciente</Label>
        <div className="mt-2 flex gap-2">
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={search ?? ""}
            placeholder="Apellido, nombre o teléfono"
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

      {search && appointments.length > 0 && (
        <p className="mb-6 flex flex-wrap items-center gap-x-4 text-[0.95rem] text-muted">
          <span>
            {appointments.length} {appointments.length === 1 ? "turno" : "turnos"} para «{search}»
          </span>
          <Link href={clearHref} className={TEXT_ACTION}>
            Limpiar
          </Link>
        </p>
      )}

      {appointments.length === 0 ? (
        search ? (
          <Notice tone="muted" title={`No hay turnos próximos para «${search}»`}>
            Probá sólo con el apellido, o con el teléfono.{" "}
            <Link href={clearHref} className="font-bold text-accent underline underline-offset-4">
              Ver todos
            </Link>
            .
          </Notice>
        ) : (
          <Notice tone="muted" title="No hay turnos próximos" />
        )
      ) : (
        <div className="space-y-10">
          {days.map((day) => (
            <section key={day.dayKey}>
              <div className="flex items-baseline gap-3 border-b-2 border-foreground pb-2">
                <SectionHeading>
                  {capitalizeFirst(formatDay(day.appointments[0].starts_at))}
                </SectionHeading>
                {dayTag.has(day.dayKey) && (
                  <span className="font-narrow text-sm font-bold uppercase tracking-[0.08em] text-accent">
                    {dayTag.get(day.dayKey)}
                  </span>
                )}
              </div>
              <ul>
                {day.appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    siteUrl={base}
                    showPractitioner={!practitionerId}
                    showLocation={locations.length > 1}
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
