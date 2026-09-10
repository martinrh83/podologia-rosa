import type { Metadata } from "next";

import { addBlock, addShift, removeBlock, removeShift } from "@/app/actions/schedule";
import { requireStaff } from "@/lib/auth";
import type { ScheduleBlock, WeeklyScheduleRow } from "@/lib/db/types";
import { formatDay } from "@/lib/format";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const WEEKDAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export default async function AgendaPage() {
  await requireStaff();

  const supabase = createSupabaseAdminClient();
  const [scheduleResult, blocksResult] = await Promise.all([
    supabase.from("weekly_schedule").select("*").order("weekday").order("start_time"),
    supabase
      .from("schedule_blocks")
      .select("*")
      // Past closures are noise; only what still affects availability.
      .gte("ends_at", new Date().toISOString())
      .order("starts_at"),
  ]);

  const schedule = (scheduleResult.data ?? []) as WeeklyScheduleRow[];
  const blocks = (blocksResult.data ?? []) as ScheduleBlock[];

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Horarios de atención</h2>
        <p className="mt-1 text-muted">
          Si atendés mañana y tarde, cargá dos franjas para el mismo día.
        </p>

        <ul className="mt-5 space-y-2">
          {schedule.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <span>
                <strong>{WEEKDAYS.find((day) => day.value === row.weekday)?.label}</strong>{" "}
                <span className="tabular-nums text-muted">
                  {row.start_time.slice(0, 5)} a {row.end_time.slice(0, 5)}
                </span>
              </span>
              <form action={removeShift}>
                <input type="hidden" name="id" value={row.id} />
                <button type="submit" className="text-sm text-muted hover:text-[color:var(--danger)]">
                  Quitar
                </button>
              </form>
            </li>
          ))}
          {schedule.length === 0 && (
            <li className="rounded-lg border border-border bg-surface-muted p-4 text-muted">
              Todavía no cargaste horarios, así que nadie puede sacar turno.
            </li>
          )}
        </ul>

        <form
          action={addShift}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
        >
          <div>
            <label htmlFor="weekday" className="block text-sm font-medium">
              Día
            </label>
            <select
              id="weekday"
              name="weekday"
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2.5"
            >
              {WEEKDAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium">
              Desde
            </label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              required
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2.5"
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium">
              Hasta
            </label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              required
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2.5"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover"
          >
            Agregar
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Días que no atendés</h2>
        <p className="mt-1 text-muted">Vacaciones, feriados, o cualquier día suelto.</p>

        <ul className="mt-5 space-y-2">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <span>
                <span className="capitalize">{formatDay(block.starts_at)}</span>
                {" — "}
                {/* ends_at is the exclusive midnight after the last day. */}
                <span className="capitalize">
                  {formatDay(new Date(new Date(block.ends_at).getTime() - 1))}
                </span>
                {block.reason && <span className="text-muted"> · {block.reason}</span>}
              </span>
              <form action={removeBlock}>
                <input type="hidden" name="id" value={block.id} />
                <button type="submit" className="text-sm text-muted hover:text-[color:var(--danger)]">
                  Quitar
                </button>
              </form>
            </li>
          ))}
          {blocks.length === 0 && (
            <li className="rounded-lg border border-border bg-surface-muted p-4 text-muted">
              No hay cierres cargados.
            </li>
          )}
        </ul>

        <form
          action={addBlock}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
        >
          <div>
            <label htmlFor="from" className="block text-sm font-medium">
              Desde
            </label>
            <input
              id="from"
              name="from"
              type="date"
              required
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2.5"
            />
          </div>
          <div>
            <label htmlFor="to" className="block text-sm font-medium">
              Hasta <span className="font-normal text-muted">(incluido)</span>
            </label>
            <input
              id="to"
              name="to"
              type="date"
              required
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2.5"
            />
          </div>
          <div className="grow">
            <label htmlFor="reason" className="block text-sm font-medium">
              Motivo <span className="font-normal text-muted">(opcional)</span>
            </label>
            <input
              id="reason"
              name="reason"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover"
          >
            Bloquear
          </button>
        </form>

        <p className="mt-3 text-sm text-muted">
          Bloquear un rango no cancela los turnos que ya estaban reservados ahí. Revisá la agenda de
          esos días y avisales vos.
        </p>
      </section>
    </div>
  );
}
