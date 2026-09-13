import "server-only";

import type { Appointment, AppointmentWithPractitioner } from "@/lib/db/types";
import { localDayRange } from "@/lib/slots";
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
