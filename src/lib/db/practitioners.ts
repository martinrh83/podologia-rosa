import "server-only";

import type { Practitioner, PractitionerWithSpecialty, Specialty } from "@/lib/db/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Los profesionales del consultorio.
 *
 * Nada de acá es sensible: son los datos que el paciente ve al elegir con quién
 * atenderse, así que se pueden usar tanto en el sitio público como en el panel.
 */

const WITH_SPECIALTY = "*, specialty:specialties(name)";

/** Los que se pueden elegir al sacar turno, en el orden en que se muestran. */
export async function listActivePractitioners(): Promise<PractitionerWithSpecialty[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("practitioners")
    .select(WITH_SPECIALTY)
    .eq("active", true)
    .order("display_order")
    .order("last_name");

  if (error) throw new Error(`No se pudieron leer los profesionales: ${error.message}`);

  return (data ?? []) as unknown as PractitionerWithSpecialty[];
}

/** Todos, activos o no. Sólo para el panel: un inactivo no debe llegar al público. */
export async function listAllPractitioners(): Promise<PractitionerWithSpecialty[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("practitioners")
    .select(WITH_SPECIALTY)
    .order("active", { ascending: false })
    .order("display_order");

  if (error) throw new Error(`No se pudieron leer los profesionales: ${error.message}`);

  return (data ?? []) as unknown as PractitionerWithSpecialty[];
}

/**
 * Un profesional por su slug, sólo si está activo.
 *
 * El filtro por `active` es lo que hace que dar de baja a alguien saque su
 * agenda de circulación: el link que quedó en un WhatsApp viejo deja de reservar
 * en vez de seguir tomando turnos para alguien que ya no atiende.
 */
export async function getPractitionerBySlug(
  slug: string,
): Promise<PractitionerWithSpecialty | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("practitioners")
    .select(WITH_SPECIALTY)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer el profesional: ${error.message}`);

  return (data as unknown as PractitionerWithSpecialty) ?? null;
}

/** Todas, activas o no. Para el panel. */
export async function listSpecialties(): Promise<Specialty[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("specialties")
    .select("*")
    .order("active", { ascending: false })
    .order("display_order")
    .order("name");

  if (error) throw new Error(`No se pudieron leer las especialidades: ${error.message}`);

  return (data ?? []) as Specialty[];
}

/** Las que se pueden elegir al dar de alta a alguien. */
export async function listActiveSpecialties(): Promise<Specialty[]> {
  return (await listSpecialties()).filter((specialty) => specialty.active);
}

/** "Ana Gómez" — como se lo nombra al paciente. */
export function practitionerName(practitioner: Pick<Practitioner, "first_name" | "last_name">) {
  return `${practitioner.first_name} ${practitioner.last_name}`.trim();
}
