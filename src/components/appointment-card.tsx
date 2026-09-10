import { updateStatus } from "@/app/actions/appointments";
import type { Appointment } from "@/lib/db/types";
import { formatTime, whatsappLink } from "@/lib/format";

const STATUS_LABEL: Record<Appointment["status"], string> = {
  booked: "Reservado",
  completed: "Atendido",
  no_show: "No vino",
  cancelled: "Cancelado",
};

type Props = {
  appointment: Appointment;
  /** Renders the tap-to-send WhatsApp reminder — used on the "Mañana" screen. */
  reminderMessage?: string;
};

export function AppointmentCard({ appointment, reminderMessage }: Props) {
  const isCancelled = appointment.status === "cancelled";

  return (
    <li
      className={`rounded-xl border border-border bg-surface p-4 ${isCancelled ? "opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-xl font-semibold tabular-nums">{formatTime(appointment.starts_at)}</p>
        <span className="text-sm text-muted">
          {STATUS_LABEL[appointment.status]}
          {appointment.source === "admin" && " · cargado a mano"}
        </span>
      </div>

      <p className="mt-1 text-[1.05rem]">{appointment.patient_name}</p>

      <p className="mt-0.5 text-[0.95rem] text-muted">
        <a href={`tel:${appointment.patient_phone}`} className="hover:text-foreground">
          {appointment.patient_phone}
        </a>
      </p>

      {appointment.motivo && (
        <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-[0.95rem]">
          {appointment.motivo}
        </p>
      )}

      {reminderMessage && !isCancelled && (
        <a
          href={whatsappLink(appointment.patient_phone, reminderMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-lg bg-accent px-4 py-2.5 text-[0.95rem] font-medium text-white hover:bg-accent-hover"
        >
          Recordar por WhatsApp
        </a>
      )}

      {!isCancelled && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(["completed", "no_show", "cancelled"] as const)
            .filter((status) => status !== appointment.status)
            .map((status) => (
              <form key={status} action={updateStatus}>
                <input type="hidden" name="id" value={appointment.id} />
                <input type="hidden" name="status" value={status} />
                <button
                  type="submit"
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:border-accent hover:text-foreground"
                >
                  {STATUS_LABEL[status]}
                </button>
              </form>
            ))}
        </div>
      )}
    </li>
  );
}
