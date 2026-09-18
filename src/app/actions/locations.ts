"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth";
import {
  formError,
  formValues,
  MESSAGES,
  parseForm,
  SAVED,
  type ActionState,
} from "@/lib/forms";
import { locationSchema } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Alta y edición de sedes.
 *
 * Mismo criterio que con los profesionales y los precios: abrir una sede nueva
 * no debería ser un deploy.
 */

function revalidateLocations() {
  for (const path of ["/", "/turnos", "/admin/sedes", "/admin/agenda"]) {
    revalidatePath(path);
  }
}

const LOCATION_FIELDS = ["name", "address", "mapUrl"] as const;

export async function createLocation(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const parsed = parseForm(locationSchema, formValues(formData, LOCATION_FIELDS));
  if (!parsed.ok) return parsed.state;
  const { name, address, mapUrl } = parsed.data;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("locations")
    .insert({ name, address, map_url: mapUrl || null });

  if (error) return formError(MESSAGES.saveFailed("la sede"));

  revalidateLocations();
  return SAVED;
}

export async function updateLocation(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return formError(MESSAGES.notFound("la sede"));

  const parsed = parseForm(locationSchema, formValues(formData, LOCATION_FIELDS));
  if (!parsed.ok) return parsed.state;
  const { name, address, mapUrl } = parsed.data;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("locations")
    .update({ name, address, map_url: mapUrl || null })
    .eq("id", id);

  if (error) return formError(MESSAGES.saveFailed("los cambios"));

  revalidateLocations();
  return SAVED;
}

/**
 * Dar de baja o reactivar una sede.
 *
 * Nunca se borra: los turnos que pasaron ahí la referencian, y borrarla se
 * llevaría puesto el historial. Inactiva sale del sitio y de los formularios,
 * pero las franjas y los turnos viejos siguen apuntando a ella.
 */
export async function toggleLocation(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return formError(MESSAGES.notFound("la sede"));

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("locations").update({ active: !active }).eq("id", id);
  if (error) return formError(MESSAGES.saveFailed("el cambio"));

  revalidateLocations();
  return SAVED;
}
