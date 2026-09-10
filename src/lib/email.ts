import "server-only";

import { Resend } from "resend";

import { emailEnv, siteUrl } from "@/lib/env";
import { formatFull } from "@/lib/format";
import type { Appointment, ClinicSettings } from "@/lib/db/types";

/**
 * Transactional email.
 *
 * Every send is best-effort and can never throw. By the time these are called
 * the turno is already committed, so a mail failure must not surface as a failed
 * booking or a failed cancellation — telling a patient "no pudimos cancelar"
 * after we already cancelled is worse than sending no mail at all.
 *
 * Reading the environment happens *inside* the try for the same reason: an
 * unconfigured Resend account is a degraded feature, not a broken booking flow.
 */

export function cancelUrl(token: string): string {
  return `${siteUrl()}/turnos/cancelar/${token}`;
}

type Message = { to: string; subject: string; html: string };
type EmailEnv = ReturnType<typeof emailEnv>;

/** Build and send, swallowing every failure. Returns whether it actually went out. */
async function deliver(build: (env: EmailEnv) => Message | null): Promise<boolean> {
  try {
    const env = emailEnv();
    const message = build(env);
    if (!message) return false;

    await new Resend(env.apiKey).emails.send({ from: env.from, ...message });
    return true;
  } catch (error) {
    console.error("[email] send failed", error);
    return false;
  }
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

function cancelButton(token: string): string {
  return `<p style="margin:0 0 20px;">
      <a href="${cancelUrl(token)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;">Cancelar mi turno</a>
    </p>`;
}

type SendArgs = { appointment: Appointment; settings: ClinicSettings };

/** Confirmation to the patient, carrying the cancel link. */
export function sendPatientConfirmation({ appointment, settings }: SendArgs): Promise<boolean> {
  return deliver(() => {
    if (!appointment.patient_email) return null;

    const body = `
      ${detailRow("Cuándo", formatFull(appointment.starts_at))}
      ${settings.address ? detailRow("Dónde", settings.address) : ""}
      <p style="margin:20px 0 8px;font-size:15px;line-height:1.5;">Si no podés venir, avisanos con tiempo así el turno queda libre para otra persona:</p>
      ${cancelButton(appointment.cancel_token)}
      <p style="margin:0;font-size:13px;color:#78716c;line-height:1.5;">Guardá este mail: el enlace es la única forma de cancelar online.${
        settings.phone ? ` También podés llamarnos al ${settings.phone}.` : ""
      }</p>`;

    return {
      to: appointment.patient_email,
      subject: `Turno confirmado — ${formatFull(appointment.starts_at)}`,
      html: layout(`Hola ${appointment.patient_name}, tu turno está confirmado`, body),
    };
  });
}

/** Heads-up to Rosa so she is not refreshing the admin to spot new turnos. */
export function sendStaffNotification({ appointment }: SendArgs): Promise<boolean> {
  return deliver((env) => ({
    to: env.adminEmail,
    subject: `Nuevo turno: ${appointment.patient_name} — ${formatFull(appointment.starts_at)}`,
    html: layout(
      "Nuevo turno reservado",
      `
      ${detailRow("Cuándo", formatFull(appointment.starts_at))}
      ${detailRow("Paciente", appointment.patient_name)}
      ${detailRow("Teléfono", appointment.patient_phone)}
      ${appointment.patient_email ? detailRow("Email", appointment.patient_email) : ""}
      ${appointment.motivo ? detailRow("Motivo", appointment.motivo) : ""}`,
    ),
  }));
}

/** Told to Rosa when a patient releases a slot via their cancel link. */
export function sendStaffCancellation({ appointment }: SendArgs): Promise<boolean> {
  return deliver((env) => ({
    to: env.adminEmail,
    subject: `Turno cancelado: ${appointment.patient_name} — ${formatFull(appointment.starts_at)}`,
    html: layout(
      "Un turno fue cancelado",
      `
      ${detailRow("Cuándo", formatFull(appointment.starts_at))}
      ${detailRow("Paciente", appointment.patient_name)}
      ${detailRow("Teléfono", appointment.patient_phone)}
      <p style="margin:16px 0 0;font-size:15px;">El horario volvió a quedar disponible.</p>`,
    ),
  }));
}

/**
 * 24-hour reminder, sent by the daily cron.
 *
 * The returned boolean is load-bearing: the cron only stamps `reminder_sent_at`
 * when this is true, so a failed send is retried tomorrow rather than silently
 * marked as delivered.
 */
export function sendPatientReminder({ appointment, settings }: SendArgs): Promise<boolean> {
  return deliver(() => {
    if (!appointment.patient_email) return null;

    const body = `
      ${detailRow("Cuándo", formatFull(appointment.starts_at))}
      ${settings.address ? detailRow("Dónde", settings.address) : ""}
      <p style="margin:20px 0 8px;font-size:15px;line-height:1.5;">¿No podés venir? Cancelá acá para liberar el horario:</p>
      ${cancelButton(appointment.cancel_token)}`;

    return {
      to: appointment.patient_email,
      subject: "Recordatorio: tu turno es mañana",
      html: layout(`${appointment.patient_name}, te esperamos mañana`, body),
    };
  });
}
