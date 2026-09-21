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
import { blockSchema, newServiceSchema, serviceSchema, shiftSchema } from "@/lib/schemas";
import { shiftsOverlap } from "@/lib/shifts";
import { localDayRangeFromKey } from "@/lib/slots";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Schedule editing.
 *
 * These are the actions that make Rosa independent: hours, holidays and prices
 * all change from her phone, so a schedule change is never a code change.
 */

function revalidateSchedule() {
  revalidatePath("/admin/agenda");
  revalidatePath("/turnos");
}

/**
 * Add one shift. Two rows on the same weekday express a split shift.
 *
 * Cada rechazo dice por qué, y en el campo que hay que corregir. Las reglas de
 * forma están en `shiftSchema`; acá queda la que necesita la base: que no se
 * pise con otra franja del mismo día.
 */
export async function addShift(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const parsed = parseForm(
    shiftSchema,
    formValues(formData, ["practitionerId", "locationId", "weekday", "startTime", "endTime"]),
  );
  if (!parsed.ok) return parsed.state;
  const { practitionerId, locationId, startTime, endTime } = parsed.data;
  const weekday = Number(parsed.data.weekday);

  const supabase = createSupabaseAdminClient();

  // Nadie puede estar en dos lugares a la vez, ni atender dos veces la misma
  // hora en el mismo lugar. La base no lo impide —eso sería otra restricción de
  // exclusión— así que se chequea acá, que es donde se puede explicar cuál es la
  // franja que estorba.
  //
  // Sin filtrar por sede a propósito: dos franjas que se pisan en sedes
  // distintas son peores, no mejores.
  const { data: existing } = await supabase
    .from("weekly_schedule")
    .select("start_time, end_time, location_id")
    .eq("practitioner_id", practitionerId)
    .eq("weekday", weekday);

  const clash = (existing ?? []).find((row) =>
    shiftsOverlap(startTime, endTime, row.start_time, row.end_time),
  );

  if (clash) {
    return {
      status: "error",
      fieldErrors: {
        startTime:
          `Se pisa con la franja de ${clash.start_time.slice(0, 5)} a ` +
          `${clash.end_time.slice(0, 5)} que ya tiene ese día`,
      },
    };
  }

  const { error } = await supabase.from("weekly_schedule").insert({
    practitioner_id: practitionerId,
    location_id: locationId,
    weekday,
    start_time: startTime,
    end_time: endTime,
  });

  if (error) return formError(MESSAGES.saveFailed("la franja"));

  revalidateSchedule();
  return SAVED;
}

export async function removeShift(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return formError(MESSAGES.notFound("la franja"));

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("weekly_schedule").delete().eq("id", id);
  if (error) return formError(MESSAGES.saveFailed("el cambio"));

  revalidateSchedule();
  return SAVED;
}

/**
 * Block a range of days — the vacation case.
 *
 * Takes bare dates and expands them to clinic-local midnight boundaries, so
 * "del 1 al 21 de agosto" blocks all of the 21st rather than stopping at its
 * start. Existing turnos inside the range are left alone on purpose: Rosa needs
 * to see and call those people, not have them silently vanish.
 */
export async function addBlock(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const parsed = parseForm(
    blockSchema,
    formValues(formData, ["practitionerId", "locationId", "from", "to", "reason"]),
  );
  if (!parsed.ok) return parsed.state;
  const { from, to, reason } = parsed.data;
  // Vacío significa "todos": el feriado que no es de nadie en particular y
  // aplica también a quien entre después. Lo mismo con la sede.
  const practitionerId = parsed.data.practitionerId || null;
  const locationId = parsed.data.locationId || null;

  let start: Date;
  let end: Date;

  try {
    start = localDayRangeFromKey(from).start;
    // `end` of the last day, so an inclusive date range behaves as written.
    end = localDayRangeFromKey(to).end;
  } catch {
    return { status: "error", fieldErrors: { from: "Ingresá una fecha válida" } };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("schedule_blocks").insert({
    practitioner_id: practitionerId,
    location_id: locationId,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    reason: reason || null,
  });

  if (error) return formError(MESSAGES.saveFailed("el cierre"));

  revalidateSchedule();
  return SAVED;
}

export async function removeBlock(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return formError(MESSAGES.notFound("el cierre"));

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("schedule_blocks").delete().eq("id", id);
  if (error) return formError(MESSAGES.saveFailed("el cambio"));

  revalidateSchedule();
  return SAVED;
}

/**
 * Sumar un tratamiento a la lista.
 *
 * El precio es de referencia interna y no se publica: el sitio muestra sólo el
 * nombre. Va último, y desde ahí se lo puede ocultar como a cualquier otro.
 */
export async function createService(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const parsed = parseForm(
    newServiceSchema,
    formValues(formData, ["name", "price", "specialtyId", "description"]),
  );
  if (!parsed.ok) return parsed.state;
  const { name, specialtyId, description } = parsed.data;
  const price = parsed.data.price === "" ? null : Number(parsed.data.price);

  const supabase = createSupabaseAdminClient();

  // Último de la lista: el orden lo fija quien carga, agregando en el orden en
  // que quiere que se lean.
  const { data: last } = await supabase
    .from("services")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("services").insert({
    name,
    price,
    description: description || null,
    specialty_id: specialtyId,
    display_order: (last?.display_order ?? 0) + 1,
  });

  if (error) return formError(MESSAGES.saveFailed("el tratamiento"));

  revalidatePath("/admin/servicios");
  revalidatePath("/");
  return SAVED;
}

/** Update a service's name and price. Prices live in the DB because of inflation. */
export async function updateService(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return formError(MESSAGES.notFound("el servicio"));

  const parsed = parseForm(serviceSchema, formValues(formData, ["name", "price", "description"]));
  if (!parsed.ok) return parsed.state;
  const { name, description } = parsed.data;
  const price = parsed.data.price === "" ? null : Number(parsed.data.price);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("services")
    .update({ name, price, description: description || null })
    .eq("id", id);

  if (error) return formError(MESSAGES.saveFailed("los cambios"));

  revalidatePath("/admin/servicios");
  revalidatePath("/");
  return SAVED;
}

export async function toggleService(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return formError(MESSAGES.notFound("el servicio"));

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("services").update({ active: !active }).eq("id", id);
  if (error) return formError(MESSAGES.saveFailed("el cambio"));

  revalidatePath("/admin/servicios");
  revalidatePath("/");
  return SAVED;
}
