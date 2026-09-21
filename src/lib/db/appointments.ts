import "server-only";

import type { Appointment, AppointmentWithPractitioner } from "@/lib/db/types";
import { localDayRange } from "@/lib/slots";
import { searchPattern } from "@/lib/upcoming";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Staff-side appointment queries.
 *
 * Callers must have passed requireStaff() first — these return patient contact
 * details and `motivo`, which no public code path may ever touch.
 */

export async function getAppointmentsForLocalDay(
  offsetDays: number,
  {
    includeCancelled = false,
    practitionerId = null,
  }: { includeCancelled?: boolean; practitionerId?: string | null } = {},
): Promise<AppointmentWithPractitioner[]> {
  const supabase = createSupabaseAdminClient();
  const range = localDayRange(new Date(), offsetDays);

  let query = supabase
    .from("appointments")
    .select("*, practitioner:practitioners(first_name, last_name), location:locations(name)")
    .gte("starts_at", range.start.toISOString())
    .lt("starts_at", range.end.toISOString())
    // Los turnos de las dos profesionales se mezclan ordenados por hora: la
    // pregunta que el secretario hace todo el día es "quién llega ahora", no
    // "qué tiene Ana". Para eso está el filtro.
    .order("starts_at", { ascending: true });

  if (!includeCancelled) {
    query = query.neq("status", "cancelled");
  }

  // El filtro es una comodidad para mirar, no una frontera de seguridad: hoy hay
  // una sola cuenta y ve todo el consultorio. Cuando cada profesional tenga la
  // suya, esto pasa a aplicarse desde el actor y no desde la query string.
  if (practitionerId) {
    query = query.eq("practitioner_id", practitionerId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron leer los turnos: ${error.message}`);

  return (data ?? []) as unknown as AppointmentWithPractitioner[];
}

/**
 * Todos los turnos desde hoy, para la pantalla Próximos.
 *
 * Desde el comienzo del día y no desde ahora: los de la mañana siguen en la
 * lista, marcados como atendidos o no vino. Sin tope de fecha: son pocos, y la
 * lista se lee entera.
 *
 * `search` llega ya limpio de `sanitizeSearch`. Cada palabra tiene que aparecer
 * en el nombre, el apellido o el teléfono, así «maria gomez» encuentra a
 * «Gómez, María».
 */
export async function getUpcomingAppointments({
  practitionerId = null,
  search = null,
}: { practitionerId?: string | null; search?: string | null } = {}): Promise<
  AppointmentWithPractitioner[]
> {
  const supabase = createSupabaseAdminClient();
  const today = localDayRange(new Date());

  let query = supabase
    .from("appointments")
    .select("*, practitioner:practitioners(first_name, last_name), location:locations(name)")
    .gte("starts_at", today.start.toISOString())
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });

  if (practitionerId) {
    query = query.eq("practitioner_id", practitionerId);
  }

  for (const word of search?.split(" ") ?? []) {
    // Entre comillas: los corchetes de la expresión no tienen que confundir a
    // PostgREST al partir el filtro.
    const pattern = `"${searchPattern(word)}"`;
    query = query.or(
      `patient_first_name.imatch.${pattern},patient_last_name.imatch.${pattern},patient_phone.imatch.${pattern}`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron leer los turnos: ${error.message}`);

  return (data ?? []) as unknown as AppointmentWithPractitioner[];
}

export async function setAppointmentStatus(
  id: string,
  status: Appointment["status"],
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("appointments")
    .update({
      status,
      cancelled_at: status === "cancelled" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw new Error(`No se pudo actualizar el turno: ${error.message}`);
}
