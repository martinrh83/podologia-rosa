import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ACTIVE_STATUSES, type ClinicSettings, type Practitioner } from "@/lib/db/types";
import { CLINIC_TZ, generateSlots, type Slot } from "@/lib/slots";

/** Fallbacks so the site still renders before Rosa has configured anything. */
const DEFAULT_SETTINGS = {
  horizon_days: 15,
} satisfies Pick<ClinicSettings, "horizon_days">;

export async function getClinicSettings(): Promise<ClinicSettings> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("clinic_settings").select("*").limit(1).single();

  if (error || !data) {
    throw new Error(`clinic_settings is unreadable: ${error?.message ?? "no row"}`);
  }

  return data as ClinicSettings;
}

/** Se pidió la agenda de alguien que no existe, o que ya no está. */
export class PractitionerNotFound extends Error {
  constructor(id: string) {
    super(`No existe el profesional ${id}`);
    this.name = "PractitionerNotFound";
  }
}

export type AvailabilityOptions = {
  /**
   * De quién es la agenda que se consulta.
   *
   * Obligatorio: no existe "la disponibilidad del consultorio". Cada profesional
   * tiene sus franjas, sus bloqueos y su duración de turno, y el paciente elige
   * con quién antes de ver un solo horario.
   */
  practitionerId: string;
  from: Date;
  to: Date;
  /**
   * `"public"` applies the booking horizon and a minimum lead time.
   * `"admin"` lifts both, so Rosa can enter a turno for any date while the
   * patient is standing in front of her.
   */
  audience: "public" | "admin";
  now?: Date;
};

/**
 * Load the schedule, blocks and taken slots for a window and compute what is free.
 *
 * All the actual logic lives in the pure `generateSlots`; this is only the I/O
 * around it, which is why the interesting cases are unit-tested rather than
 * needing a database.
 */
export async function getAvailability({
  practitionerId,
  from,
  to,
  audience,
  now = new Date(),
}: AvailabilityOptions): Promise<{
  slots: Slot[];
  settings: ClinicSettings;
  practitioner: Practitioner;
}> {
  const supabase = createSupabaseAdminClient();

  const [
    settingsResult,
    practitionerResult,
    scheduleResult,
    activeLocationsResult,
    blocksResult,
    takenResult,
  ] = await Promise.all([
      supabase.from("clinic_settings").select("*").limit(1).single(),
      // `active` acá y no en cada página: éste es el único lugar por el que
      // pasan todas. Un profesional dado de baja es, para el que pregunta,
      // indistinguible de uno que no existe — que además es lo deseable.
      supabase
        .from("practitioners")
        .select("*")
        .eq("id", practitionerId)
        .eq("active", true)
        .maybeSingle(),
      supabase
        .from("weekly_schedule")
        .select("weekday, start_time, end_time, location_id")
        .eq("practitioner_id", practitionerId),
      // Las sedes activas, para descartar las franjas de una que cerró.
      supabase.from("locations").select("id").eq("active", true),
      // Todos los cierres que pisan la ventana, de quien sea.
      //
      // Se filtran después en memoria en vez de armar un `.or()` con el id
      // interpolado: son un puñado de filas —vacaciones y feriados— y una
      // cadena de filtro construida con texto que viene de afuera es la clase
      // de cosa que hoy no se puede explotar y mañana sí.
      supabase
        .from("schedule_blocks")
        .select("starts_at, ends_at, practitioner_id, location_id")
        .lt("starts_at", to.toISOString())
        .gt("ends_at", from.toISOString()),
      supabase
        .from("appointments")
        .select("starts_at, ends_at")
        .eq("practitioner_id", practitionerId)
        .in("status", ACTIVE_STATUSES)
        .lt("starts_at", to.toISOString())
        .gt("ends_at", from.toISOString()),
    ]);

  const firstError =
    settingsResult.error ??
    practitionerResult.error ??
    scheduleResult.error ??
    activeLocationsResult.error ??
    blocksResult.error ??
    takenResult.error;
  if (firstError) {
    throw new Error(`Failed to load availability: ${firstError.message}`);
  }

  const settings = { ...DEFAULT_SETTINGS, ...(settingsResult.data ?? {}) } as ClinicSettings;
  const practitioner = practitionerResult.data as Practitioner | null;

  if (!practitioner) {
    throw new PractitionerNotFound(practitionerId);
  }

  // Los del consultorio (practitioner_id null) valen para todos, incluido quien
  // entre después de que se cargaran.
  const blocks = (blocksResult.data ?? []).filter(
    (block) => block.practitioner_id === null || block.practitioner_id === practitionerId,
  );

  // Una sede dada de baja deja de ofrecer horarios. Sin esto, sus franjas
  // seguían generando turnos que después la página no sabía ubicar: el paciente
  // reservaba en un consultorio cerrado y la confirmación no decía adónde ir.
  const openLocations = new Set((activeLocationsResult.data ?? []).map((row) => row.id));
  const weeklySchedule = (scheduleResult.data ?? []).filter((shift) =>
    openLocations.has(shift.location_id),
  );

  const slots = generateSlots({
    from,
    to,
    weeklySchedule,
    blocks,
    taken: takenResult.data ?? [],
    // La duración sale del profesional; el horizonte sigue siendo una política
    // del consultorio, igual para todos.
    slotMinutes: practitioner.slot_minutes,
    now,
    horizonDays: audience === "admin" ? null : settings.horizon_days,
  });

  return { slots, settings, practitioner };
}

/**
 * El horario pedido, si de verdad se puede reservar ahora mismo.
 *
 * Devuelve el slot y no un booleano porque el que reserva necesita la sede, y
 * la sede la decide la agenda, no el cliente: quien manda el formulario podría
 * mandar cualquier cosa.
 *
 * El endpoint tiene que volver a preguntarlo del lado del servidor: la lista
 * que vio el paciente puede tener segundos de atraso.
 */
export async function findBookableSlot(
  practitionerId: string,
  startsAt: Date,
  audience: "public" | "admin",
  now: Date = new Date(),
): Promise<Slot | null> {
  const { slots } = await getAvailability({
    practitionerId,
    from: new Date(startsAt.getTime() - 1),
    to: new Date(startsAt.getTime() + 1),
    audience,
    now,
  });

  return slots.find((slot) => slot.start.getTime() === startsAt.getTime()) ?? null;
}

export { CLINIC_TZ };
