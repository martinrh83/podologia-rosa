import "server-only";

import type { Appointment } from "@/lib/db/types";
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
  { includeCancelled = false } = {},
): Promise<Appointment[]> {
  const supabase = createSupabaseAdminClient();
  const range = localDayRange(new Date(), offsetDays);

  let query = supabase
    .from("appointments")
    .select("*")
    .gte("starts_at", range.start.toISOString())
    .lt("starts_at", range.end.toISOString())
    .order("starts_at", { ascending: true });

  if (!includeCancelled) {
    query = query.neq("status", "cancelled");
  }

  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron leer los turnos: ${error.message}`);

  return (data ?? []) as Appointment[];
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
