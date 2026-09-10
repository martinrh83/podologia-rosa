import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ACTIVE_STATUSES, type ClinicSettings } from "@/lib/db/types";
import { CLINIC_TZ, generateSlots, type Slot } from "@/lib/slots";

/** Fallbacks so the site still renders before Rosa has configured anything. */
const DEFAULT_SETTINGS = {
  slot_minutes: 45,
  horizon_days: 15,
  max_active_per_contact: 2,
} satisfies Pick<ClinicSettings, "slot_minutes" | "horizon_days" | "max_active_per_contact">;

export async function getClinicSettings(): Promise<ClinicSettings> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("clinic_settings").select("*").limit(1).single();

  if (error || !data) {
    throw new Error(`clinic_settings is unreadable: ${error?.message ?? "no row"}`);
  }

  return data as ClinicSettings;
}

export type AvailabilityOptions = {
  from: Date;
  to: Date;
  /**
   * `"public"` applies the booking horizon and a minimum lead time.
   * `"admin"` lifts both, so Rosa can enter a turno for any date while the
   * patient is standing in front of her.
   */
  audience: "public" | "admin";
  now?: Date;
};

/**
 * Load the schedule, blocks and taken slots for a window and compute what is free.
 *
 * All the actual logic lives in the pure `generateSlots`; this is only the I/O
 * around it, which is why the interesting cases are unit-tested rather than
 * needing a database.
 */
export async function getAvailability({
  from,
  to,
  audience,
  now = new Date(),
}: AvailabilityOptions): Promise<{ slots: Slot[]; settings: ClinicSettings }> {
  const supabase = createSupabaseAdminClient();

  const [settingsResult, scheduleResult, blocksResult, takenResult] = await Promise.all([
    supabase.from("clinic_settings").select("*").limit(1).single(),
    supabase.from("weekly_schedule").select("weekday, start_time, end_time"),
    // Any block that overlaps the window at all.
    supabase
      .from("schedule_blocks")
      .select("starts_at, ends_at")
      .lt("starts_at", to.toISOString())
      .gt("ends_at", from.toISOString()),
    supabase
      .from("appointments")
      .select("starts_at")
      .in("status", ACTIVE_STATUSES)
      .gte("starts_at", from.toISOString())
      .lt("starts_at", to.toISOString()),
  ]);

  const firstError =
    settingsResult.error ?? scheduleResult.error ?? blocksResult.error ?? takenResult.error;
  if (firstError) {
    throw new Error(`Failed to load availability: ${firstError.message}`);
  }

  const settings = { ...DEFAULT_SETTINGS, ...(settingsResult.data ?? {}) } as ClinicSettings;

  const slots = generateSlots({
    from,
    to,
    weeklySchedule: scheduleResult.data ?? [],
    blocks: blocksResult.data ?? [],
    taken: (takenResult.data ?? []).map((row) => row.starts_at),
    slotMinutes: settings.slot_minutes,
    now,
    horizonDays: audience === "admin" ? null : settings.horizon_days,
    // Half an hour of lead time: a turno starting in five minutes helps nobody.
    minLeadMinutes: audience === "admin" ? 0 : 30,
  });

  return { slots, settings };
}

/**
 * Whether a specific instant is genuinely bookable right now.
 *
 * The booking endpoint must re-check this server-side: the client's slot list
 * may be seconds stale, and nothing stops someone posting an arbitrary time.
 */
export async function isSlotBookable(
  startsAt: Date,
  audience: "public" | "admin",
  now: Date = new Date(),
): Promise<boolean> {
  const { slots } = await getAvailability({
    from: new Date(startsAt.getTime() - 1),
    to: new Date(startsAt.getTime() + 1),
    audience,
    now,
  });

  return slots.some((slot) => slot.start.getTime() === startsAt.getTime());
}

export { CLINIC_TZ };
