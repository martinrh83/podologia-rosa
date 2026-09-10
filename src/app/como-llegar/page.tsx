import type { Metadata } from "next";

import { getClinicSettings } from "@/lib/availability";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { WeeklyScheduleRow } from "@/lib/db/types";

export const metadata: Metadata = {
  title: "Cómo llegar",
  description: "Dirección, horarios de atención y cómo contactarnos.",
};

export const dynamic = "force-dynamic";

const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function ComoLlegarPage() {
  const supabase = createSupabaseAdminClient();

  const [settings, scheduleResult] = await Promise.all([
    getClinicSettings(),
    supabase.from("weekly_schedule").select("*").order("weekday").order("start_time"),
  ]);

  const schedule = (scheduleResult.data ?? []) as WeeklyScheduleRow[];

  // Group shifts per weekday so a split shift reads as "09:00-13:00 y 16:00-20:00".
  const byWeekday = new Map<number, string[]>();
  for (const row of schedule) {
    const shifts = byWeekday.get(row.weekday) ?? [];
    shifts.push(`${row.start_time.slice(0, 5)} a ${row.end_time.slice(0, 5)}`);
    byWeekday.set(row.weekday, shifts);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Cómo llegar</h1>

      <div className="mt-6 space-y-2 text-[1.05rem]">
        {settings.address && <p>{settings.address}</p>}
        {settings.phone && (
          <p>
            <a href={`tel:${settings.phone}`} className="text-accent underline">
              {settings.phone}
            </a>
          </p>
        )}
      </div>

      {settings.map_url && (
        <a
          href={settings.map_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-lg border border-border bg-surface px-5 py-3 hover:border-accent"
        >
          Ver en el mapa
        </a>
      )}

      <h2 className="mt-10 text-2xl font-semibold tracking-tight">Horarios</h2>
      <ul className="mt-4 space-y-2">
        {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
          const shifts = byWeekday.get(weekday);
          if (!shifts) return null;
          return (
            <li key={weekday} className="flex justify-between border-b border-border py-2">
              <span>{WEEKDAY_NAMES[weekday]}</span>
              <span className="tabular-nums text-muted">{shifts.join(" y ")}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
