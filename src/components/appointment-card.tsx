import { updateStatus } from "@/app/actions/appointments";
import { buttonClass, TEXT_ACTION } from "@/components/admin/button-styles";
import { ConfirmAction, SubmitButton } from "@/components/admin/buttons";
import { CopyLink } from "@/components/copy-link";
import { COVERAGES } from "@/lib/booking-schema";
import type { Appointment, AppointmentWithPractitioner } from "@/lib/db/types";
import { formatDay, formatTime, whatsappLink } from "@/lib/format";

/**
 * El estado, dicho sólo cuando no es el de siempre. Casi todos los turnos del
 * día están reservados: repetir «Reservado» en cada fila era ruido que tapaba
 * a los que sí cambiaron.
 */
const STATUS: Partial<Record<Appointment["status"], { label: string; className: string }>> = {
  completed: { label: "Atendido", className: "text-[color:var(--success)]" },
  no_show: { label: "No vino", className: "text-foreground" },
  cancelled: { label: "Cancelado", className: "text-[color:var(--danger)]" },
};

type Props = {
  appointment: AppointmentWithPractitioner;
  /**
   * Nombrar a la profesional en la tarjeta. Se apaga cuando la lista ya está
   * filtrada por una sola: repetir el mismo nombre en cada fila es ruido.
   */
  showPractitioner?: boolean;
  /** Igual con la sede: sólo tiene sentido cuando hay más de una. */
  showLocation?: boolean;
  /** Renders the tap-to-send WhatsApp reminder — used on the "Mañana" screen. */
  reminderMessage?: string;
  /** Absolute base URL, so the cancel link Rosa sends works outside localhost. */
  siteUrl: string;
};

/**
 * Un turno de la lista del día.
 *
 * Es un renglón de la hoja y no una tarjeta blanca por turno: con diez turnos
 * eran diez planos blancos apilados. La hora manda, en el ancho de los
 * encabezados, porque es por lo que se busca un turno en la lista.
 */
export function AppointmentCard({
  appointment,
  reminderMessage,
  siteUrl,
  showPractitioner = true,
  showLocation = false,
}: Props) {
  const isCancelled = appointment.status === "cancelled";
  const time = formatTime(appointment.starts_at);
  const status = STATUS[appointment.status];
  const cancelUrl = `${siteUrl}/turnos/cancelar/${appointment.cancel_token}`;
  const fullName = `${appointment.patient_last_name}, ${appointment.patient_first_name}`;
  const coverage = COVERAGES.find((item) => item.value === appointment.patient_coverage)?.label;

  return (
    <li className="border-b border-border py-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p
          className={`font-wide text-[1.6rem] font-extrabold leading-none tracking-[-0.02em] tabular-nums ${
            isCancelled ? "text-muted line-through decoration-2" : ""
          }`}
        >
          {time}
        </p>
        {showPractitioner && appointment.practitioner && (
          <p className="font-bold text-accent">
            {appointment.practitioner.first_name} {appointment.practitioner.last_name}
          </p>
        )}
        {showLocation && appointment.location && (
          <p className="font-narrow text-sm font-bold uppercase tracking-[0.08em] text-muted">
            {appointment.location.name}
          </p>
        )}
        {status && (
          <p className={`ml-auto text-[0.95rem] font-bold ${status.className}`}>{status.label}</p>
        )}
      </div>

      {/* Apellido primero: es como se busca una ficha. */}
      <p className={`mt-2 text-[1.15rem] font-bold ${isCancelled ? "text-muted" : ""}`}>
        {fullName}
      </p>

      <p className="mt-0.5 text-[0.95rem] text-muted">
        DNI <span className="tabular-nums">{appointment.patient_dni || "—"}</span> · {coverage} ·{" "}
        <a
          href={`tel:${appointment.patient_phone}`}
          className="tabular-nums underline decoration-current underline-offset-4 hover:text-foreground"
        >
          {appointment.patient_phone}
        </a>
        {appointment.source === "admin" && " · cargado a mano"}
      </p>

      {appointment.motivo && (
        <p className="mt-3 max-w-[62ch] bg-surface-muted px-3.5 py-2.5 text-[0.95rem] leading-relaxed">
          {appointment.motivo}
        </p>
      )}

      {/*
        Todo lo que se hace con el turno, en una sola fila que se parte donde
        haga falta: primero hablarle al paciente, después marcar cómo terminó.
        Cancelar va último y como texto: es lo menos frecuente y lo único sin
        vuelta, así que no merece el peso de un botón más en cada fila.
      */}
      {!isCancelled && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {reminderMessage && (
            <a
              href={whatsappLink(appointment.patient_phone, reminderMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary", { size: "sm" })}
            >
              Recordar por WhatsApp
            </a>
          )}

          {/*
            Turnos sacados por la web: Rosa le confirma al paciente por WhatsApp.
            No hay confirmación automática, así que este botón es el único aviso
            que el paciente recibe de parte del consultorio.
          */}
          {appointment.source === "online" && (
            <a
              href={whatsappLink(
                appointment.patient_phone,
                `Hola ${appointment.patient_first_name}! Te confirmamos tu turno del ` +
                  `${formatDay(appointment.starts_at)} a las ${time}. ` +
                  `¡Te esperamos!`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("outline", { size: "sm" })}
            >
              Confirmar por WhatsApp
            </a>
          )}

          {appointment.status !== "completed" && (
            <StatusForm id={appointment.id} status="completed" label="Marcar atendido" />
          )}
          {appointment.status !== "no_show" && (
            <StatusForm id={appointment.id} status="no_show" label="No vino" />
          )}

          <ConfirmAction
            action={updateStatus}
            fields={{ id: appointment.id, status: "cancelled" }}
            label="Cancelar turno"
            question={`¿Cancelar el turno de las ${time}?`}
            confirmLabel="Sí, cancelar"
          />
        </div>
      )}

      {/*
        The patient sees this link once, on the confirmation screen, and there is
        no email to re-send it. When they lose it they call — so Rosa needs to be
        able to hand it back without asking anyone for help.
      */}
      {!isCancelled && (
        <details className="mt-3">
          <summary className={`cursor-pointer ${TEXT_ACTION}`}>
            Enlace para que cancele
          </summary>

          <div className="mt-2 space-y-3">
            <CopyLink href={cancelUrl} label="Copiar el enlace de este turno" />

            <a
              href={whatsappLink(
                appointment.patient_phone,
                `Hola ${appointment.patient_first_name}! Si necesitás cancelar tu turno del ` +
                  `${time}, entrá acá: ${cancelUrl}`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("ink", { size: "sm" })}
            >
              Mandarlo por WhatsApp
            </a>
          </div>
        </details>
      )}
    </li>
  );
}

function StatusForm({
  id,
  status,
  label,
}: {
  id: string;
  status: Appointment["status"];
  label: string;
}) {
  return (
    <form action={updateStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton variant="ink" size="sm" pendingLabel="Guardando…">
        {label}
      </SubmitButton>
    </form>
  );
}
