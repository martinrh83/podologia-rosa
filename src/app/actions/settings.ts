"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth";
import { normalizePhone } from "@/lib/booking-schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SettingsState = { status: "idle" | "saved" | "error"; message?: string };

/**
 * Datos de contacto del consultorio.
 *
 * Deliberadamente NO incluye la duración del turno ni el horizonte de reserva:
 * cambiar esos valores altera el significado de cada horario futuro, y un
 * descuido ahí se nota recién cuando un paciente llega a un turno que no
 * existe. Se siguen cambiando en la base, a propósito.
 */
export async function updateClinicSettings(
  _previous: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireStaff();

  const clinicName = String(formData.get("clinicName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const mapUrl = String(formData.get("mapUrl") ?? "").trim();

  if (clinicName.length < 2) {
    return { status: "error", message: "El nombre del consultorio no puede quedar vacío." };
  }

  if (mapUrl && !/^https?:\/\//i.test(mapUrl)) {
    return { status: "error", message: "El enlace del mapa tiene que empezar con https://" };
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("clinic_settings")
    .update({
      clinic_name: clinicName,
      address: address || null,
      // El teléfono se muestra tal cual lo escribe Rosa: es texto para leer.
      phone: phone || null,
      // El de WhatsApp, en cambio, lo consume wa.me, así que se guarda
      // normalizado. Si no, "387 15 555-4444" abre un chat con un número que
      // no existe.
      whatsapp: whatsapp ? normalizePhone(whatsapp) : null,
      map_url: mapUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) {
    return { status: "error", message: "No pudimos guardar los cambios." };
  }

  // Todas las páginas que muestran estos datos.
  for (const path of ["/", "/como-llegar", "/turnos", "/privacidad", "/admin/consultorio"]) {
    revalidatePath(path);
  }

  return { status: "saved" };
}
