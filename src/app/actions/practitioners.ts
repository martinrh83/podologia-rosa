"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth";
import { listActivePractitioners } from "@/lib/db/practitioners";
import {
  formError,
  formValues,
  MESSAGES,
  parseForm,
  SAVED,
  type ActionState,
} from "@/lib/forms";
import { newPractitionerSchema, practitionerSchema, specialtySchema } from "@/lib/schemas";
import { shortName } from "@/lib/person-name";
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

/**
 * El lugar siguiente al último. Quien se suma, o vuelve de la baja, va al
 * final de la lista.
 *
 * Sin esto quedaba en 0, el valor por defecto de la columna, y aparecía
 * adelante de todas en el home, en /turnos y en la agenda.
 */
async function nextPractitionerOrder(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data } = await supabase
    .from("practitioners")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.display_order ?? 0) + 1;
}

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

  // La dirección usa el nombre corto, igual que el sitio: "rosa-heredia".
  const slug = slugify(shortName(firstName, lastName));

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
    display_order: await nextPractitionerOrder(supabase),
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
  const { error } = await supabase
    .from("practitioners")
    .update(active ? { active: false } : { active: true, display_order: await nextPractitionerOrder(supabase) })
    .eq("id", id);
  if (error) return formError(MESSAGES.saveFailed("el cambio"));

  revalidatePractitioners();
  return SAVED;
}

/**
 * Mover a alguien un lugar arriba o abajo en la lista.
 *
 * QUIÉN VA PRIMERO ES UNA DECISIÓN DEL CONSULTORIO
 *
 *   El orden se ve en todos lados: la sección "Profesionales" del home, la
 *   lista de /turnos, los filtros de Hoy y Mañana, la agenda y el alta de un
 *   turno. Hasta acá nadie podía cambiarlo: todas se daban de alta con el
 *   mismo `display_order` y quedaban alfabéticas por apellido, que no es un
 *   criterio que nadie haya elegido.
 *
 * El movimiento es entre activas, que son las que se ven. Cada vez que se
 * mueve una se renumeran todas de 1 en adelante: así se deshacen los empates
 * de las que quedaron en 0, y el orden guardado es el que se está viendo.
 */
export async function movePractitioner(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id) return formError(MESSAGES.notFound("al profesional"));

  const people = await listActivePractitioners();
  const from = people.findIndex((person) => person.id === id);
  const to = from + (direction === "up" ? -1 : 1);

  // Fuera de la lista: la pantalla que mandó esto ya no es la que hay.
  if (from === -1 || to < 0 || to >= people.length) return SAVED;

  const moved = [...people];
  [moved[from], moved[to]] = [moved[to], moved[from]];

  const supabase = createSupabaseAdminClient();
  const results = await Promise.all(
    moved.map((person, index) =>
      supabase.from("practitioners").update({ display_order: index + 1 }).eq("id", person.id),
    ),
  );

  if (results.some((result) => result.error)) return formError(MESSAGES.saveFailed("el orden"));

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
