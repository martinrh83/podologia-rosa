"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth";
import { listActiveLocations } from "@/lib/db/locations";
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

/**
 * El lugar siguiente al último. Una sede nueva, o una que vuelve de la baja,
 * va al final de la lista.
 *
 * Sin esto quedaba en 0, el valor por defecto de la columna, y se ponía
 * adelante de todas: así llegó San José a aparecer antes que Centro.
 */
async function nextLocationOrder(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data } = await supabase
    .from("locations")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.display_order ?? 0) + 1;
}

export async function createLocation(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const parsed = parseForm(locationSchema, formValues(formData, LOCATION_FIELDS));
  if (!parsed.ok) return parsed.state;
  const { name, address, mapUrl } = parsed.data;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("locations").insert({
    name,
    address,
    map_url: mapUrl || null,
    display_order: await nextLocationOrder(supabase),
  });

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
  const { error } = await supabase
    .from("locations")
    .update(active ? { active: false } : { active: true, display_order: await nextLocationOrder(supabase) })
    .eq("id", id);
  if (error) return formError(MESSAGES.saveFailed("el cambio"));

  revalidateLocations();
  return SAVED;
}

/**
 * Mover una sede un lugar arriba o abajo.
 *
 * La primera es la que se lee primero en todos lados: Cómo llegar, la tarjeta
 * del home, la agenda y los horarios. Se renumeran todas de 1 en adelante, así
 * el orden guardado es exactamente el que se ve.
 */
export async function moveLocation(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id) return formError(MESSAGES.notFound("la sede"));

  const locations = await listActiveLocations();
  const from = locations.findIndex((location) => location.id === id);
  const to = from + (direction === "up" ? -1 : 1);

  // Fuera de la lista: la pantalla que mandó esto ya no es la que hay.
  if (from === -1 || to < 0 || to >= locations.length) return SAVED;

  const moved = [...locations];
  [moved[from], moved[to]] = [moved[to], moved[from]];

  const supabase = createSupabaseAdminClient();
  const results = await Promise.all(
    moved.map((location, index) =>
      supabase.from("locations").update({ display_order: index + 1 }).eq("id", location.id),
    ),
  );
  if (results.some((result) => result.error)) return formError(MESSAGES.saveFailed("el orden"));

  revalidateLocations();
  return SAVED;
}
