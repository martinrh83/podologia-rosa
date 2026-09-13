import "server-only";

import type { ServiceWithSpecialty } from "@/lib/db/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Active services in display order. Prices live in the DB so inflation is Rosa's to fix. */
export async function getActiveServices(): Promise<ServiceWithSpecialty[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("services")
    .select("*, specialty:specialties(name, display_order, active)")
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) throw new Error(`No se pudieron leer los servicios: ${error.message}`);

  // Dar de baja una disciplina esconde sus precios: si no se ofrece, publicar
  // lo que costaba es una invitación a un llamado incómodo.
  return ((data ?? []) as unknown as ServiceWithSpecialty[]).filter(
    (service) => service.specialty?.active !== false,
  );
}
