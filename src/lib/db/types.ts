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

/** Quién puede entrar al panel. Ver 0006: separada de `Practitioner` a propósito. */
export type Staff = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  role: "admin" | "practitioner";
  active: boolean;
  created_at: string;
};

export type Specialty = {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
};

/** A quién se le puede sacar turno. Las agendas y los turnos cuelgan de acá. */
export type Practitioner = {
  id: string;
  staff_id: string | null;
  specialty_id: string;
  /** Parte de /turnos/[slug]. Estable: no se regenera si cambia el nombre. */
  slug: string;
  first_name: string;
  last_name: string;
  title: string | null;
  bio: string | null;
  /** La duración del turno es de cada profesional, no del consultorio. */
  slot_minutes: number;
  active: boolean;
  display_order: number;
  created_at: string;
};

/** Un profesional con el nombre de su especialidad ya resuelto. */
export type PractitionerWithSpecialty = Practitioner & { specialty: { name: string } };

export type ClinicSettings = {
  id: boolean;
  horizon_days: number;
  clinic_name: string;
  phone: string | null;
  whatsapp: string | null;
  updated_at: string;
};

/** Dónde se atiende. La dirección y el mapa viven acá desde 0010. */
export type Location = {
  id: string;
  name: string;
  address: string;
  map_url: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
};

export type Service = {
  id: string;
  specialty_id: string;
  name: string;
  description: string | null;
  price: number | null;
  display_order: number;
  active: boolean;
  created_at: string;
};

export type WeeklyScheduleRow = {
  id: string;
  practitioner_id: string;
  /** La sede va en la franja: el mismo profesional atiende en las dos. */
  location_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  created_at: string;
};

export type ScheduleBlock = {
  id: string;
  /** En null aplica a todos los profesionales. Ver 0006. */
  practitioner_id: string | null;
  /** En null cierra todas las sedes. Con id, sólo esa. Ver 0010. */
  location_id: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  practitioner_id: string;
  /** Dónde fue. Se guarda al reservar, no se deriva de la franja. */
  location_id: string;
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

/** Un servicio con su especialidad, para agrupar el listado de precios. */
export type ServiceWithSpecialty = Service & {
  specialty: { name: string; display_order: number } | null;
};

/** Un turno con el nombre de su profesional ya resuelto, para el panel. */
export type AppointmentWithPractitioner = Appointment & {
  practitioner: { first_name: string; last_name: string } | null;
  location: { name: string } | null;
};

/**
 * Columns that are safe to surface on a public page — deliberately excludes
 * `motivo`, and anything identifying another patient.
 */
export const PUBLIC_APPOINTMENT_COLUMNS = "id, starts_at, ends_at, status" as const;

/** Statuses that still occupy a slot. Mirrors the partial unique index. */
export const ACTIVE_STATUSES: AppointmentStatus[] = ["booked", "completed", "no_show"];
