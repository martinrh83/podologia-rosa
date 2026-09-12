import type { Metadata } from "next";
import Link from "next/link";

import { removeBlock, removeShift } from "@/app/actions/schedule";
import { BlockForm } from "@/components/block-form";
import { PractitionerFilter } from "@/components/practitioner-filter";
import { ShiftForm } from "@/components/shift-form";
import { requireStaff } from "@/lib/auth";
import { listActivePractitioners, practitionerName } from "@/lib/db/practitioners";
import type { ScheduleBlock, WeeklyScheduleRow } from "@/lib/db/types";
import { capitalizeFirst, formatDay } from "@/lib/format";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { weekdayLabel } from "@/lib/weekdays";

export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AgendaPage({ searchParams }: PageProps<"/admin/agenda">) {
  await requireStaff();

  const params = await searchParams;
  const practitioners = await listActivePractitioners();

  // Los horarios se editan de a un profesional: son SUS horas. Los cierres, en
  // cambio, se listan todos juntos, porque los del consultorio afectan a las dos
  // y hay que verlos sin cambiar de vista.
  const requested = typeof params.profesional === "string" ? params.profesional : null;
  const practitioner =
    practitioners.find((row) => row.id === requested) ?? practitioners[0] ?? null;

  const supabase = createSupabaseAdminClient();
  const [scheduleResult, blocksResult] = await Promise.all([
    practitioner
      ? supabase
          .from("weekly_schedule")
          .select("*")
          .eq("practitioner_id", practitioner.id)
          .order("weekday")
          .order("start_time")
      : Promise.resolve({ data: [] }),
    supabase
      .from("schedule_blocks")
      .select("*")
      // Past closures are noise; only what still affects availability.
      .gte("ends_at", new Date().toISOString())
      .order("starts_at"),
  ]);

  const schedule = (scheduleResult.data ?? []) as WeeklyScheduleRow[];
  const blocks = (blocksResult.data ?? []) as ScheduleBlock[];
  const nameById = new Map(practitioners.map((row) => [row.id, practitionerName(row)]));

  if (!practitioner) {
    return (
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Agenda</h2>
        <p className="mt-3 text-muted">
          Primero hay que cargar un profesional.{" "}
          <Link href="/admin/profesionales" className="text-accent underline">
            Cargá el primero
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Horarios de atención</h2>
        <p className="mt-1 text-muted">
          Si atiende mañana y tarde, cargá dos franjas para el mismo día.
        </p>

        <div className="mt-4">
          <PractitionerFilter
            practitioners={practitioners}
            selected={practitioner.id}
            basePath="/admin/agenda"
            allowAll={false}
          />
        </div>

        <ul className="mt-2 space-y-2">
          {schedule.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <span>
                <strong>{weekdayLabel(row.weekday)}</strong>{" "}
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
              {practitionerName(practitioner)} no tiene horarios cargados, así que nadie puede
              sacarle turno.
            </li>
          )}
        </ul>

        <ShiftForm practitionerId={practitioner.id} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Días que no se atiende</h2>
        <p className="mt-1 text-muted">
          Vacaciones, feriados, o cualquier día suelto. Los del consultorio valen para todas.
        </p>

        <ul className="mt-5 space-y-2">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <span>
                <span className="font-medium">
                  {block.practitioner_id
                    ? (nameById.get(block.practitioner_id) ?? "—")
                    : "Todo el consultorio"}
                </span>
                {" · "}
                {capitalizeFirst(formatDay(block.starts_at))}
                {" — "}
                {/* ends_at is the exclusive midnight after the last day. */}
                {capitalizeFirst(formatDay(new Date(new Date(block.ends_at).getTime() - 1)))}
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

        <BlockForm
          practitioners={practitioners.map((row) => ({
            id: row.id,
            name: practitionerName(row),
          }))}
        />

        <p className="mt-3 text-sm text-muted">
          Bloquear un rango no cancela los turnos que ya estaban reservados ahí. Revisá la agenda de
          esos días y avisales vos.
        </p>
      </section>
    </div>
  );
}
