import { CLINIC_TZ } from "@/lib/slots";

/**
 * Presentation helpers. Every formatter pins both the locale (es-AR) and the
 * timezone explicitly — relying on the runtime's defaults would render turnos in
 * UTC on the server and in the visitor's own zone in the browser, which is
 * exactly how a booking confirmation ends up showing the wrong hour.
 */

const LOCALE = "es-AR";

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: CLINIC_TZ,
});

const dayFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: CLINIC_TZ,
});

const fullFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: CLINIC_TZ,
});

const shortDayFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "short",
  day: "numeric",
  timeZone: CLINIC_TZ,
});

/** "14:30" */
export function formatTime(value: Date | string): string {
  return timeFormatter.format(new Date(value));
}

/** "jueves, 10 de septiembre" */
export function formatDay(value: Date | string): string {
  return dayFormatter.format(new Date(value));
}

/** "jue, 10" — for compact day tabs. */
export function formatShortDay(value: Date | string): string {
  return shortDayFormatter.format(new Date(value));
}

/** "jueves, 10 de septiembre de 2026, 14:30" */
export function formatFull(value: Date | string): string {
  return fullFormatter.format(new Date(value));
}

/** "2026-09-10" in clinic-local time — the key used for grouping and URLs. */
export function toLocalDateKey(value: Date | string): string {
  // en-CA gives ISO-ordered parts, which sidesteps manual zero-padding.
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: CLINIC_TZ,
  }).format(new Date(value));
}

/** "$ 15.000" — Argentine peso, no decimals (they are noise at these amounts). */
export function formatPrice(value: number | null): string | null {
  if (value === null) return null;

  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Build a wa.me link with a pre-filled message.
 *
 * This is the reminder channel that actually gets read in Argentina: Rosa taps
 * through tomorrow's list once a day and the message arrives from her own number,
 * with no WhatsApp Business API, no template approval and no per-message fee.
 */
export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
