"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth";
import { normalizePhone } from "@/lib/booking-schema";
import { formError, formValues, MESSAGES, parseForm, SAVED, type ActionState } from "@/lib/forms";
import { settingsSchema } from "@/lib/schemas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Datos de contacto del consultorio.
 *
 * La dirección y el mapa ya no están acá: se mudaron a `locations` en 0010,
 * porque hay más de una sede. Se editan en /admin/sedes.
 *
 * Deliberadamente NO incluye la duración del turno ni el horizonte de reserva:
 * cambiar esos valores altera el significado de cada horario futuro, y un
 * descuido ahí se nota recién cuando un paciente llega a un turno que no
 * existe. Se siguen cambiando en la base, a propósito.
 */
export async function updateClinicSettings(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const parsed = parseForm(settingsSchema, formValues(formData, ["clinicName", "phone", "whatsapp"]));
  if (!parsed.ok) return parsed.state;
  const { clinicName, phone, whatsapp } = parsed.data;

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("clinic_settings")
    .update({
      clinic_name: clinicName,
      // El teléfono se muestra tal cual lo escribe Rosa: es texto para leer.
      phone: phone || null,
      // El de WhatsApp, en cambio, lo consume wa.me, así que se guarda
      // normalizado. Si no, "387 15 555-4444" abre un chat con un número que
      // no existe.
      whatsapp: whatsapp ? normalizePhone(whatsapp) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return formError(MESSAGES.saveFailed("los cambios"));

  // Todas las páginas que muestran estos datos.
  for (const path of ["/", "/turnos", "/privacidad", "/admin/consultorio"]) {
    revalidatePath(path);
  }

  return SAVED;
}
