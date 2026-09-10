import type { Metadata } from "next";

import { AppointmentCard } from "@/components/appointment-card";
import { requireStaff } from "@/lib/auth";
import { getAppointmentsForLocalDay } from "@/lib/db/appointments";
import { formatDay } from "@/lib/format";
import { localDayRange } from "@/lib/slots";

export const metadata: Metadata = {
  title: "Hoy",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminTodayPage() {
  await requireStaff();

  const appointments = await getAppointmentsForLocalDay(0);
  const today = localDayRange(new Date()).start;

  return (
    <div>
      <h2 className="mb-1 text-2xl font-semibold capitalize tracking-tight">
        {formatDay(today)}
      </h2>
      <p className="mb-5 text-muted">
        {appointments.length === 0
          ? "No hay turnos para hoy."
          : `${appointments.length} ${appointments.length === 1 ? "turno" : "turnos"}`}
      </p>

      <ul className="space-y-3">
        {appointments.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
      </ul>
    </div>
  );
}
