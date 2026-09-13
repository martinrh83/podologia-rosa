import "server-only";

import type { Location } from "@/lib/db/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Las sedes del consultorio.
 *
 * Nada de acá es sensible: son las direcciones que el paciente necesita para
 * saber adónde ir.
 */

export async function listActiveLocations(): Promise<Location[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("active", true)
    .order("display_order")
    .order("name");

  if (error) throw new Error(`No se pudieron leer las sedes: ${error.message}`);

  return (data ?? []) as Location[];
}

/** Todas, activas o no. Sólo para el panel. */
export async function listAllLocations(): Promise<Location[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("active", { ascending: false })
    .order("display_order");

  if (error) throw new Error(`No se pudieron leer las sedes: ${error.message}`);

  return (data ?? []) as Location[];
}
