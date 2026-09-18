import type { Metadata } from "next";

import { PageHeading } from "@/components/admin/page-heading";
import { AppointmentCard } from "@/components/appointment-card";
import { Notice } from "@/components/notice";
import { PractitionerFilter } from "@/components/practitioner-filter";
import { requireStaff } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { getAppointmentsForLocalDay } from "@/lib/db/appointments";
import { listActiveLocations } from "@/lib/db/locations";
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

  const [appointments, practitioners, locations] = await Promise.all([
    getAppointmentsForLocalDay(0, { practitionerId }),
    listActivePractitioners(),
    listActiveLocations(),
  ]);

  const base = siteUrl();
  const today = localDayRange(new Date()).start;

  return (
    <div>
      <PageHeading title={capitalizeFirst(formatDay(today))} />

      <PractitionerFilter
        practitioners={practitioners}
        selected={practitionerId}
        basePath="/admin"
      />

      {appointments.length === 0 ? (
        <Notice tone="muted" title="No hay turnos para hoy" />
      ) : (
        <ul className="[&>li:first-child]:pt-0">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              siteUrl={base}
              // Ya filtrada por una sola: repetir su nombre en cada fila es ruido.
              showPractitioner={!practitionerId}
              showLocation={locations.length > 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
