import type { Metadata } from "next";

import { AppointmentCard } from "@/components/appointment-card";
import { getClinicSettings } from "@/lib/availability";
import { requireStaff } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { getAppointmentsForLocalDay } from "@/lib/db/appointments";
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
export default async function AdminTomorrowPage() {
  await requireStaff();

  const [appointments, settings] = await Promise.all([
    getAppointmentsForLocalDay(1),
    getClinicSettings(),
  ]);

  const tomorrow = localDayRange(new Date(), 1).start;
  const base = siteUrl();

  return (
    <div>
      <h2 className="mb-1 text-2xl font-semibold tracking-tight">
        {capitalizeFirst(formatDay(tomorrow))}
      </h2>
      <p className="mb-5 text-muted">
        {appointments.length === 0
          ? "No hay turnos para mañana."
          : "Tocá cada botón para mandar el recordatorio por WhatsApp."}
      </p>

      <ul className="space-y-3">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            siteUrl={base}
            reminderMessage={
              `Hola ${appointment.patient_first_name}! Te recordamos tu turno de mañana ` +
              `a las ${formatTime(appointment.starts_at)} en ${settings.clinic_name}. ` +
              `Si no podés venir, avisanos así lo liberamos. ¡Gracias!`
            }
          />
        ))}
      </ul>
    </div>
  );
}
