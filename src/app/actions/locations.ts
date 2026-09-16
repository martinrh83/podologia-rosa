"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Alta y edición de sedes.
 *
 * Mismo criterio que con los profesionales y los precios: abrir una sede nueva
 * no debería ser un deploy.
 */

export type LocationState = { status: "idle" | "saved" | "error"; message?: string };

function revalidateLocations() {
  for (const path of ["/", "/turnos", "/admin/sedes", "/admin/agenda"]) {
    revalidatePath(path);
  }
}

export async function createLocation(
  _previous: LocationState,
  formData: FormData,
): Promise<LocationState> {
  await requireStaff();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const mapUrl = String(formData.get("mapUrl") ?? "").trim();

  if (name.length < 2) {
    return { status: "error", message: "Poné un nombre para distinguirla. Ej: Centro." };
  }

  if (address.length < 5) {
    return { status: "error", message: "Completá la dirección." };
  }

  if (mapUrl && !/^https?:\/\//i.test(mapUrl)) {
    return { status: "error", message: "El enlace del mapa tiene que empezar con https://" };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("locations")
    .insert({ name, address, map_url: mapUrl || null });

  if (error) {
    return { status: "error", message: "No pudimos guardar la sede." };
  }

  revalidateLocations();
  return { status: "saved" };
}

export async function updateLocation(formData: FormData): Promise<void> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const mapUrl = String(formData.get("mapUrl") ?? "").trim();

  if (!id || name.length < 2 || address.length < 5) return;
  if (mapUrl && !/^https?:\/\//i.test(mapUrl)) return;

  const supabase = createSupabaseAdminClient();
  await supabase
    .from("locations")
    .update({ name, address, map_url: mapUrl || null })
    .eq("id", id);

  revalidateLocations();
}

/**
 * Dar de baja o reactivar una sede.
 *
 * Nunca se borra: los turnos que pasaron ahí la referencian, y borrarla se
 * llevaría puesto el historial. Inactiva sale del sitio y de los formularios,
 * pero las franjas y los turnos viejos siguen apuntando a ella.
 */
export async function toggleLocation(formData: FormData): Promise<void> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;

  const supabase = createSupabaseAdminClient();
  await supabase.from("locations").update({ active: !active }).eq("id", id);

  revalidateLocations();
}
