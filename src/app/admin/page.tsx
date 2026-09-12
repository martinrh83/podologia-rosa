import type { Metadata } from "next";

import { AppointmentCard } from "@/components/appointment-card";
import { PractitionerFilter } from "@/components/practitioner-filter";
import { requireStaff } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { getAppointmentsForLocalDay } from "@/lib/db/appointments";
import { listActivePractitioners } from "@/lib/db/practitioners";
import { capitalizeFirst, formatDay } from "@/lib/format";
import { localDayRange } from "@/lib/slots";

export const metadata: Metadata = {
  title: "Hoy",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminTodayPage({ searchParams }: PageProps<"/admin">) {
  await requireStaff();

  const params = await searchParams;
  const practitionerId = typeof params.profesional === "string" ? params.profesional : null;

  const [appointments, practitioners] = await Promise.all([
    getAppointmentsForLocalDay(0, { practitionerId }),
    listActivePractitioners(),
  ]);

  const base = siteUrl();
  const today = localDayRange(new Date()).start;

  return (
    <div>
      <h2 className="mb-1 text-2xl font-semibold tracking-tight">
        {capitalizeFirst(formatDay(today))}
      </h2>
      <p className="mb-5 text-muted">
        {appointments.length === 0
          ? "No hay turnos para hoy."
          : `${appointments.length} ${appointments.length === 1 ? "turno" : "turnos"}`}
      </p>

      <PractitionerFilter
        practitioners={practitioners}
        selected={practitionerId}
        basePath="/admin"
      />

      <ul className="space-y-3">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            siteUrl={base}
            // Ya filtrada por una sola: repetir su nombre en cada fila es ruido.
            showPractitioner={!practitionerId}
          />
        ))}
      </ul>
    </div>
  );
}
