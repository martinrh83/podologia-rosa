import type { Metadata } from "next";
import Link from "next/link";

import { removeBlock, removeShift } from "@/app/actions/schedule";
import { ConfirmAction } from "@/components/admin/buttons";
import { PageHeading, SectionHeading } from "@/components/admin/page-heading";
import { BlockForm } from "@/components/block-form";
import { Notice } from "@/components/notice";
import { PractitionerFilter } from "@/components/practitioner-filter";
import { ShiftForm } from "@/components/shift-form";
import { requireStaff } from "@/lib/auth";
import { listActiveLocations } from "@/lib/db/locations";
import { listActivePractitioners, practitionerName } from "@/lib/db/practitioners";
import type { ScheduleBlock, WeeklyScheduleRow } from "@/lib/db/types";
import { capitalizeFirst, formatDay, toLocalDateKey } from "@/lib/format";
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
  const [practitioners, locations] = await Promise.all([
    listActivePractitioners(),
    listActiveLocations(),
  ]);
  const locationOptions = locations.map((row) => ({ id: row.id, name: row.name }));
  const locationName = new Map(locations.map((row) => [row.id, row.name]));

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
        <PageHeading title="Agenda" />
        <Notice tone="muted" title="Todavía no hay profesionales">
          Los horarios son de cada una. Cargá la primera en{" "}
          <Link href="/admin/profesionales" className="font-bold text-accent underline underline-offset-4">
            Profesionales
          </Link>
          .
        </Notice>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <section>
        <PageHeading title="Horarios de atención" />

        <PractitionerFilter
          practitioners={practitioners}
          selected={practitioner.id}
          basePath="/admin/agenda"
          allowAll={false}
        />

        {schedule.length === 0 ? (
          <Notice tone="muted" title={`${practitionerName(practitioner)} no tiene horarios`}>
            Así nadie puede sacarle turno. Cargá la primera franja acá abajo.
          </Notice>
        ) : (
          <ul>
            {schedule.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border py-3"
              >
                <p className="flex flex-wrap items-baseline gap-x-3">
                  <strong className="w-24 font-bold">{weekdayLabel(row.weekday)}</strong>
                  <span className="tabular-nums">
                    {row.start_time.slice(0, 5)} a {row.end_time.slice(0, 5)}
                  </span>
                  {locations.length > 1 && (
                    <span className="font-narrow text-sm font-bold uppercase tracking-[0.08em] text-accent">
                      {locationName.get(row.location_id)}
                    </span>
                  )}
                </p>
                <ConfirmAction
                  action={removeShift}
                  fields={{ id: row.id }}
                  label="Quitar"
                  question="¿Quitar esta franja?"
                  confirmLabel="Sí, quitar"
                />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <SectionHeading>Agregar franja</SectionHeading>
          <div className="mt-5">
            <ShiftForm practitionerId={practitioner.id} locations={locationOptions} />
          </div>
        </div>
      </section>

      <section className="border-t-2 border-foreground pt-6">
        <SectionHeading>Días que no se atiende</SectionHeading>

        {blocks.length === 0 ? (
          <p className="mt-5 text-muted">No hay cierres cargados.</p>
        ) : (
          <ul className="mt-3">
            {blocks.map((block) => {
              // ends_at is the exclusive midnight after the last day.
              const lastDay = new Date(new Date(block.ends_at).getTime() - 1);
              const sameDay = toLocalDateKey(block.starts_at) === toLocalDateKey(lastDay);

              return (
                <li
                  key={block.id}
                  className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-border py-3.5"
                >
                  <div className="min-w-0">
                    <p className="font-bold">
                      {capitalizeFirst(formatDay(block.starts_at))}
                      {!sameDay && <> al {formatDay(lastDay)}</>}
                    </p>
                    <p className="mt-0.5 text-[0.95rem] text-muted">
                      {block.practitioner_id
                        ? (nameById.get(block.practitioner_id) ?? "—")
                        : "Todos los profesionales"}
                      {locations.length > 1 &&
                        ` · ${block.location_id ? locationName.get(block.location_id) : "todas las sedes"}`}
                      {block.reason && ` · ${block.reason}`}
                    </p>
                  </div>
                  <ConfirmAction
                    action={removeBlock}
                    fields={{ id: block.id }}
                    label="Quitar"
                    question="¿Volver a abrir esos días?"
                    confirmLabel="Sí, quitar"
                  />
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-10">
          <SectionHeading as="h3">Cerrar días</SectionHeading>
          <div className="mt-5">
            <BlockForm
              practitioners={practitioners.map((row) => ({
                id: row.id,
                name: practitionerName(row),
              }))}
              locations={locationOptions}
            />
          </div>
          <p className="mt-4 max-w-[52ch] text-[0.95rem] leading-relaxed text-muted">
            Cerrar un rango no cancela los turnos que ya estaban reservados ahí. Revisá la agenda
            de esos días y avisales vos.
          </p>
        </div>
      </section>
    </div>
  );
}
