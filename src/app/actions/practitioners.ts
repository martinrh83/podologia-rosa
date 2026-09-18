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
import { newPractitionerSchema, practitionerSchema, specialtySchema } from "@/lib/schemas";
import { RESERVED_SLUGS, slugify } from "@/lib/slug";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Alta y edición de profesionales y especialidades.
 *
 * Es lo que hace que sumar a alguien al consultorio no sea un deploy — el mismo
 * criterio que ya rige los horarios y los precios.
 */

function revalidatePractitioners() {
  // `/sitemap.xml` también: lista una URL por profesional, así que dar de alta
  // o de baja a alguien lo cambia. Ahora que no se renderiza por visita, si no
  // se invalida acá Google sigue viendo la lista vieja.
  for (const path of ["/", "/turnos", "/sitemap.xml", "/admin/profesionales", "/admin/agenda"]) {
    revalidatePath(path);
  }
}

const PRACTITIONER_FIELDS = ["firstName", "lastName", "title", "slotMinutes"] as const;

export async function createPractitioner(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const parsed = parseForm(
    newPractitionerSchema,
    formValues(formData, [...PRACTITIONER_FIELDS, "specialtyId"]),
  );
  if (!parsed.ok) return parsed.state;
  const { firstName, lastName, title, slotMinutes, specialtyId } = parsed.data;

  const slug = slugify(`${firstName} ${lastName}`);

  if (!slug || RESERVED_SLUGS.has(slug)) {
    return {
      status: "error",
      fieldErrors: { lastName: "Con ese nombre no se puede armar su dirección web" },
    };
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
        fieldErrors: { lastName: "Ya hay alguien con ese nombre. Agregá el segundo apellido" },
      };
    }
    return formError(MESSAGES.saveFailed("el profesional"));
  }

  revalidatePractitioners();
  return SAVED;
}

/**
 * Editar los datos de un profesional.
 *
 * El slug NO se toca: es parte de una URL que la gente ya compartió por WhatsApp
 * y que Google indexó. Corregir un apellido mal escrito no debería romper el link
 * que el consultorio mandó la semana pasada.
 */
export async function updatePractitioner(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return formError(MESSAGES.notFound("al profesional"));

  const parsed = parseForm(practitionerSchema, formValues(formData, PRACTITIONER_FIELDS));
  if (!parsed.ok) return parsed.state;
  const { firstName, lastName, title, slotMinutes } = parsed.data;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("practitioners")
    .update({
      first_name: firstName,
      last_name: lastName,
      title: title || null,
      slot_minutes: slotMinutes,
    })
    .eq("id", id);

  if (error) return formError(MESSAGES.saveFailed("los cambios"));

  revalidatePractitioners();
  return SAVED;
}

/**
 * Dar de baja o volver a activar.
 *
 * Nunca se borra: los turnos pasados apuntan a esta fila, y borrarla rompería el
 * historial y la retención. Inactivo desaparece del sitio y de la agenda.
 */
export async function togglePractitioner(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return formError(MESSAGES.notFound("al profesional"));

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("practitioners").update({ active: !active }).eq("id", id);
  if (error) return formError(MESSAGES.saveFailed("el cambio"));

  revalidatePractitioners();
  return SAVED;
}

/**
 * Dar de baja o reactivar una especialidad.
 *
 * Nunca se borra: la referencian profesionales y servicios. Inactiva sale del
 * alta de profesionales y esconde sus tratamientos del sitio.
 */
export async function toggleSpecialty(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return formError(MESSAGES.notFound("la especialidad"));

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("specialties").update({ active: !active }).eq("id", id);
  if (error) return formError(MESSAGES.saveFailed("el cambio"));

  revalidatePath("/admin/especialidades");
  revalidatePath("/turnos");
  return SAVED;
}

export async function createSpecialty(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const parsed = parseForm(specialtySchema, formValues(formData, ["name"]));
  if (!parsed.ok) return parsed.state;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("specialties").insert({ name: parsed.data.name });

  if (error) {
    if (error.code === "23505") {
      return { status: "error", fieldErrors: { name: "Esa especialidad ya está cargada" } };
    }
    return formError(MESSAGES.saveFailed("la especialidad"));
  }

  revalidatePath("/admin/especialidades");
  revalidatePath("/turnos");
  return SAVED;
}
