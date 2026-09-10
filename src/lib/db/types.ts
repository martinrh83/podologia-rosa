/**
 * Hand-written row types mirroring supabase/migrations/0001_init.sql.
 *
 * Once the Supabase project exists these can be replaced with generated types
 * (`supabase gen types typescript`). Until then these are the contract, and any
 * schema change must be reflected here.
 */

export type AppointmentStatus = "booked" | "cancelled" | "completed" | "no_show";
export type AppointmentSource = "online" | "admin";
export type PatientCoverage = "ips" | "osunsa" | "particular";

export type ClinicSettings = {
  id: boolean;
  slot_minutes: number;
  horizon_days: number;
  max_active_per_contact: number;
  clinic_name: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  map_url: string | null;
  updated_at: string;
};

export type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  display_order: number;
  active: boolean;
  created_at: string;
};

export type WeeklyScheduleRow = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  created_at: string;
};

export type ScheduleBlock = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  patient_first_name: string;
  patient_last_name: string;
  /** Sólo dígitos. Identificador nacional fuerte: nunca sale a anon. */
  patient_dni: string;
  patient_coverage: PatientCoverage;
  patient_phone: string;
  patient_email: string | null;
  /** Dato sensible (Ley 25.326 art. 2). Staff-only, purged 30 days after the turno. */
  motivo: string | null;
  consent_at: string | null;
  cancel_token: string;
  reminder_sent_at: string | null;
  anonymized_at: string | null;
  created_at: string;
  cancelled_at: string | null;
};

/**
 * Columns that are safe to surface on a public page — deliberately excludes
 * `motivo`, and anything identifying another patient.
 */
export const PUBLIC_APPOINTMENT_COLUMNS = "id, starts_at, ends_at, status" as const;

/** Statuses that still occupy a slot. Mirrors the partial unique index. */
export const ACTIVE_STATUSES: AppointmentStatus[] = ["booked", "completed", "no_show"];
