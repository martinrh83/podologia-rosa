import type { Metadata } from "next";

import { PageHeading } from "@/components/admin/page-heading";
import { AppointmentCard } from "@/components/appointment-card";
import { Notice } from "@/components/notice";
import { PractitionerFilter } from "@/components/practitioner-filter";
import { getClinicSettings } from "@/lib/availability";
import { requireStaff } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { getAppointmentsForLocalDay } from "@/lib/db/appointments";
import { listActiveLocations } from "@/lib/db/locations";
import { listActivePractitioners, practitionerName } from "@/lib/db/practitioners";
import { capitalizeFirst, formatDay, formatTime } from "@/lib/format";
import { localDayRange } from "@/lib/slots";

export const metadata: Metadata = {
  title: "Mañana",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Tomorrow's list, built for one job: Rosa taps down it once a day sending
 * WhatsApp reminders.
 *
 * This is the reminder channel that actually gets read in Argentina. The message
 * goes from her own number, so there is no WhatsApp Business API, no template
 * approval and no per-message fee — the automated email is the backup, not the
 * primary.
 */
export default async function AdminTomorrowPage({ searchParams }: PageProps<"/admin/manana">) {
  await requireStaff();

  const params = await searchParams;
  const practitionerId = typeof params.profesional === "string" ? params.profesional : null;

  const [appointments, settings, practitioners, locations] = await Promise.all([
    getAppointmentsForLocalDay(1, { practitionerId }),
    getClinicSettings(),
    listActivePractitioners(),
    listActiveLocations(),
  ]);

  const tomorrow = localDayRange(new Date(), 1).start;
  const base = siteUrl();

  return (
    <div>
      <PageHeading title={capitalizeFirst(formatDay(tomorrow))} />

      <PractitionerFilter
        practitioners={practitioners}
        selected={practitionerId}
        basePath="/admin/manana"
      />

      {appointments.length === 0 ? (
        <Notice tone="muted" title="No hay turnos para mañana" />
      ) : (
        <ul className="[&>li:first-child]:pt-0">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              siteUrl={base}
              showPractitioner={!practitionerId}
              showLocation={locations.length > 1}
              reminderMessage={
                `Hola ${appointment.patient_first_name}! Te recordamos tu turno de mañana ` +
                `a las ${formatTime(appointment.starts_at)}` +
                // Con dos agendas, saber con quién es el turno importa tanto como
                // la hora: el paciente eligió a una de las dos.
                (appointment.practitioner
                  ? ` con ${practitionerName(appointment.practitioner)}`
                  : "") +
                ` en ${settings.clinic_name}` +
                (locations.length > 1 && appointment.location
                  ? ` (sede ${appointment.location.name})`
                  : "") +
                `. ` +
                `Si no podés venir, avisanos así lo liberamos. ¡Gracias!`
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
