"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth";
import { RESERVED_SLUGS, slugify } from "@/lib/slug";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Alta y edición de profesionales y especialidades.
 *
 * Es lo que hace que sumar a alguien al consultorio no sea un deploy — el mismo
 * criterio que ya rige los horarios y los precios.
 */

export type PractitionerState = { status: "idle" | "saved" | "error"; message?: string };

function revalidatePractitioners() {
  for (const path of ["/", "/turnos", "/equipo", "/admin/profesionales", "/admin/agenda"]) {
    revalidatePath(path);
  }
}

export async function createPractitioner(
  _previous: PractitionerState,
  formData: FormData,
): Promise<PractitionerState> {
  await requireStaff();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const specialtyId = String(formData.get("specialtyId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const slotMinutes = Number(formData.get("slotMinutes"));

  if (firstName.length < 2 || lastName.length < 2) {
    return { status: "error", message: "Completá el nombre y el apellido." };
  }

  if (!specialtyId) {
    return { status: "error", message: "Elegí una especialidad." };
  }

  if (!Number.isInteger(slotMinutes) || slotMinutes <= 0) {
    return { status: "error", message: "La duración del turno tiene que ser un número de minutos." };
  }

  const slug = slugify(`${firstName} ${lastName}`);

  if (!slug || RESERVED_SLUGS.has(slug)) {
    return { status: "error", message: "Ese nombre no se puede usar como dirección web." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("practitioners").insert({
    first_name: firstName,
    last_name: lastName,
    specialty_id: specialtyId,
    title: title || null,
    slot_minutes: slotMinutes,
    slug,
  });

  if (error) {
    // El slug es único: dos "Ana Gómez" chocan acá.
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Ya hay alguien con ese nombre. Agregá el segundo apellido para diferenciarlos.",
      };
    }
    return { status: "error", message: "No pudimos guardar el profesional." };
  }

  revalidatePractitioners();
  return { status: "saved" };
}

/**
 * Editar los datos de un profesional.
 *
 * El slug NO se toca: es parte de una URL que la gente ya compartió por WhatsApp
 * y que Google indexó. Corregir un apellido mal escrito no debería romper el link
 * que el consultorio mandó la semana pasada.
 */
export async function updatePractitioner(formData: FormData): Promise<void> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slotMinutes = Number(formData.get("slotMinutes"));

  if (!id || firstName.length < 2 || lastName.length < 2) return;
  if (!Number.isInteger(slotMinutes) || slotMinutes <= 0) return;

  const supabase = createSupabaseAdminClient();
  await supabase
    .from("practitioners")
    .update({
      first_name: firstName,
      last_name: lastName,
      title: title || null,
      slot_minutes: slotMinutes,
    })
    .eq("id", id);

  revalidatePractitioners();
}

/**
 * Dar de baja o volver a activar.
 *
 * Nunca se borra: los turnos pasados apuntan a esta fila, y borrarla rompería el
 * historial y la retención. Inactivo desaparece del sitio y de la agenda.
 */
export async function togglePractitioner(formData: FormData): Promise<void> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;

  const supabase = createSupabaseAdminClient();
  await supabase.from("practitioners").update({ active: !active }).eq("id", id);

  revalidatePractitioners();
}

/**
 * Dar de baja o reactivar una especialidad.
 *
 * Nunca se borra: la referencian profesionales y servicios. Inactiva sale del
 * alta de profesionales y esconde sus precios del sitio.
 */
export async function toggleSpecialty(formData: FormData): Promise<void> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;

  const supabase = createSupabaseAdminClient();
  await supabase.from("specialties").update({ active: !active }).eq("id", id);

  revalidatePath("/admin/especialidades");
  revalidatePath("/servicios");
  revalidatePath("/turnos");
}

export async function createSpecialty(
  _previous: PractitionerState,
  formData: FormData,
): Promise<PractitionerState> {
  await requireStaff();

  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 3) {
    return { status: "error", message: "Escribí el nombre de la especialidad." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("specialties").insert({ name });

  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "Esa especialidad ya está cargada." };
    }
    return { status: "error", message: "No pudimos guardar la especialidad." };
  }

  revalidatePath("/admin/especialidades");
  revalidatePath("/servicios");
  revalidatePath("/turnos");
  return { status: "saved" };
}
