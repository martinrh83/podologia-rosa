import "server-only";

import { Resend } from "resend";

import { emailEnv, siteUrl } from "@/lib/env";
import { formatFull } from "@/lib/format";
import type { Appointment, ClinicSettings } from "@/lib/db/types";

/**
 * Transactional email.
 *
 * Every send is best-effort: a failure here must never fail the booking. The
 * turno is already committed by the time we get called, and telling a patient
 * "no pudimos reservar" because Resend had a bad minute would be a lie that
 * costs Rosa a real appointment. Failures are logged and swallowed.
 */

function resend() {
  return new Resend(emailEnv().apiKey);
}

export function cancelUrl(token: string): string {
  return `${siteUrl()}/turnos/cancelar/${token}`;
}

/** Minimal, high-contrast HTML. Email clients are hostile to anything clever. */
function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="es-AR">
  <body style="margin:0;padding:24px;background:#f6f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;">
      <tr><td>
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;">${title}</h1>
        ${body}
      </td></tr>
    </table>
  </body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<p style="margin:0 0 6px;font-size:15px;line-height:1.5;"><strong>${label}:</strong> ${value}</p>`;
}

type SendArgs = { appointment: Appointment; settings: ClinicSettings };

/** Confirmation to the patient, carrying the cancel link. */
export async function sendPatientConfirmation({ appointment, settings }: SendArgs): Promise<void> {
  if (!appointment.patient_email) return;

  const { from } = emailEnv();
  const url = cancelUrl(appointment.cancel_token);

  const body = `
    ${detailRow("Cuándo", formatFull(appointment.starts_at))}
    ${settings.address ? detailRow("Dónde", settings.address) : ""}
    <p style="margin:20px 0 8px;font-size:15px;line-height:1.5;">Si no podés venir, avisanos con tiempo así el turno queda libre para otra persona:</p>
    <p style="margin:0 0 20px;">
      <a href="${url}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;">Cancelar mi turno</a>
    </p>
    <p style="margin:0;font-size:13px;color:#78716c;line-height:1.5;">Guardá este mail: el enlace es la única forma de cancelar online.${
      settings.phone ? ` También podés llamarnos al ${settings.phone}.` : ""
    }</p>`;

  try {
    await resend().emails.send({
      from,
      to: appointment.patient_email,
      subject: `Turno confirmado — ${formatFull(appointment.starts_at)}`,
      html: layout(`Hola ${appointment.patient_name}, tu turno está confirmado`, body),
    });
  } catch (error) {
    console.error("[email] patient confirmation failed", error);
  }
}

/** Heads-up to Rosa so she is not refreshing the admin to spot new turnos. */
export async function sendStaffNotification({ appointment }: SendArgs): Promise<void> {
  const { from, adminEmail } = emailEnv();

  const body = `
    ${detailRow("Cuándo", formatFull(appointment.starts_at))}
    ${detailRow("Paciente", appointment.patient_name)}
    ${detailRow("Teléfono", appointment.patient_phone)}
    ${appointment.patient_email ? detailRow("Email", appointment.patient_email) : ""}
    ${appointment.motivo ? detailRow("Motivo", appointment.motivo) : ""}`;

  try {
    await resend().emails.send({
      from,
      to: adminEmail,
      subject: `Nuevo turno: ${appointment.patient_name} — ${formatFull(appointment.starts_at)}`,
      html: layout("Nuevo turno reservado", body),
    });
  } catch (error) {
    console.error("[email] staff notification failed", error);
  }
}

/** Told to Rosa when a patient releases a slot via their cancel link. */
export async function sendStaffCancellation({ appointment }: SendArgs): Promise<void> {
  const { from, adminEmail } = emailEnv();

  const body = `
    ${detailRow("Cuándo", formatFull(appointment.starts_at))}
    ${detailRow("Paciente", appointment.patient_name)}
    ${detailRow("Teléfono", appointment.patient_phone)}
    <p style="margin:16px 0 0;font-size:15px;">El horario volvió a quedar disponible.</p>`;

  try {
    await resend().emails.send({
      from,
      to: adminEmail,
      subject: `Turno cancelado: ${appointment.patient_name} — ${formatFull(appointment.starts_at)}`,
      html: layout("Un turno fue cancelado", body),
    });
  } catch (error) {
    console.error("[email] staff cancellation failed", error);
  }
}

/** 24-hour reminder. Sent by the daily cron, which marks reminder_sent_at. */
export async function sendPatientReminder({ appointment, settings }: SendArgs): Promise<boolean> {
  if (!appointment.patient_email) return false;

  const { from } = emailEnv();
  const url = cancelUrl(appointment.cancel_token);

  const body = `
    ${detailRow("Cuándo", formatFull(appointment.starts_at))}
    ${settings.address ? detailRow("Dónde", settings.address) : ""}
    <p style="margin:20px 0 8px;font-size:15px;line-height:1.5;">¿No podés venir? Cancelá acá para liberar el horario:</p>
    <p style="margin:0;">
      <a href="${url}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;">Cancelar mi turno</a>
    </p>`;

  try {
    await resend().emails.send({
      from,
      to: appointment.patient_email,
      subject: `Recordatorio: tu turno es mañana`,
      html: layout(`${appointment.patient_name}, te esperamos mañana`, body),
    });
    return true;
  } catch (error) {
    console.error("[email] reminder failed", error);
    return false;
  }
}
