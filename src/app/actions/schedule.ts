"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth";
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
  revalidatePath("/como-llegar");
}

export type ScheduleState = { status: "idle" | "saved" | "error"; message?: string };

/**
 * Add one shift. Two rows on the same weekday express a split shift.
 *
 * Cada rechazo dice por qué. Antes todos hacían `return` en silencio: el
 * formulario se vaciaba, la página se recargaba igual y la franja no aparecía,
 * sin una sola palabra de explicación.
 */
export async function addShift(
  _previous: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  await requireStaff();

  const practitionerId = String(formData.get("practitionerId") ?? "");
  const weekday = Number(formData.get("weekday"));
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (!practitionerId) {
    return { status: "error", message: "Elegí de quién es la franja." };
  }

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return { status: "error", message: "Elegí un día de la semana." };
  }

  if (!startTime || !endTime) {
    return { status: "error", message: "Completá la hora de inicio y la de fin." };
  }

  if (endTime <= startTime) {
    // El caso que más pasa: cargar "de 8 a 12" y que el 12 quede en medianoche.
    // La franja terminaría antes de empezar, y el check de la base la rechaza.
    return {
      status: "error",
      message:
        "La hora de fin tiene que ser posterior a la de inicio. Ojo que el mediodía son las 12:00 y la medianoche las 00:00.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("weekly_schedule")
    .insert({ practitioner_id: practitionerId, weekday, start_time: startTime, end_time: endTime });

  if (error) {
    return { status: "error", message: "No pudimos guardar la franja. Probá de nuevo." };
  }

  revalidateSchedule();
  return { status: "saved" };
}

export async function removeShift(formData: FormData): Promise<void> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createSupabaseAdminClient();
  await supabase.from("weekly_schedule").delete().eq("id", id);

  revalidateSchedule();
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
  _previous: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  await requireStaff();

  const fromKey = String(formData.get("from") ?? "");
  const toKey = String(formData.get("to") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  // Vacío significa "todo el consultorio": el feriado que no es de nadie en
  // particular y aplica también a quien entre después.
  const practitionerId = String(formData.get("practitionerId") ?? "") || null;

  if (!fromKey || !toKey) {
    return { status: "error", message: "Completá las dos fechas." };
  }

  let start: Date;
  let end: Date;

  try {
    start = localDayRangeFromKey(fromKey).start;
    // `end` of the last day, so an inclusive date range behaves as written.
    end = localDayRangeFromKey(toKey).end;
  } catch {
    return { status: "error", message: "Revisá las fechas." };
  }

  if (end <= start) {
    return { status: "error", message: "La fecha de fin no puede ser anterior a la de inicio." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("schedule_blocks").insert({
    practitioner_id: practitionerId,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    reason: reason || null,
  });

  if (error) {
    return { status: "error", message: "No pudimos guardar el cierre. Probá de nuevo." };
  }

  revalidateSchedule();
  return { status: "saved" };
}

export async function removeBlock(formData: FormData): Promise<void> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createSupabaseAdminClient();
  await supabase.from("schedule_blocks").delete().eq("id", id);

  revalidateSchedule();
}

/** Update a service's name and price. Prices live in the DB because of inflation. */
export async function updateService(formData: FormData): Promise<void> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const rawPrice = String(formData.get("price") ?? "").trim();

  if (!id || !name) return;

  const price = rawPrice === "" ? null : Number(rawPrice);
  if (price !== null && (Number.isNaN(price) || price < 0)) return;

  const supabase = createSupabaseAdminClient();
  await supabase.from("services").update({ name, price }).eq("id", id);

  revalidatePath("/admin/servicios");
  revalidatePath("/servicios");
  revalidatePath("/");
}

export async function toggleService(formData: FormData): Promise<void> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;

  const supabase = createSupabaseAdminClient();
  await supabase.from("services").update({ active: !active }).eq("id", id);

  revalidatePath("/admin/servicios");
  revalidatePath("/servicios");
  revalidatePath("/");
}
