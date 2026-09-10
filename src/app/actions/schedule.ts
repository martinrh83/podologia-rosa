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

/** Add one shift. Two rows on the same weekday express a split shift. */
export async function addShift(formData: FormData): Promise<void> {
  await requireStaff();

  const weekday = Number(formData.get("weekday"));
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return;
  if (!startTime || !endTime || endTime <= startTime) return;

  const supabase = createSupabaseAdminClient();
  await supabase
    .from("weekly_schedule")
    .insert({ weekday, start_time: startTime, end_time: endTime });

  revalidateSchedule();
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
export async function addBlock(formData: FormData): Promise<void> {
  await requireStaff();

  const fromKey = String(formData.get("from") ?? "");
  const toKey = String(formData.get("to") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!fromKey || !toKey) return;

  try {
    const start = localDayRangeFromKey(fromKey).start;
    // `end` of the last day, so an inclusive date range behaves as written.
    const end = localDayRangeFromKey(toKey).end;
    if (end <= start) return;

    const supabase = createSupabaseAdminClient();
    await supabase.from("schedule_blocks").insert({
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      reason: reason || null,
    });
  } catch {
    return;
  }

  revalidateSchedule();
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
