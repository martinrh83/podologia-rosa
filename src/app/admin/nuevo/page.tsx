import type { Metadata } from "next";
import Link from "next/link";

import { createAdminBooking } from "@/app/actions/appointments";
import { getAvailability } from "@/lib/availability";
import { COVERAGES } from "@/lib/booking-schema";
import { requireStaff } from "@/lib/auth";
import { formatTime, toLocalDateKey } from "@/lib/format";
import { localDayRangeFromKey } from "@/lib/slots";

export const metadata: Metadata = {
  title: "Nuevo turno",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Manual booking for phone and walk-in patients.
 *
 * No booking horizon here (audience: "admin"), so Rosa can put someone in two
 * months out while they are standing in front of her — the routine-chiropody
 * rebooking that the public 15-day cap deliberately blocks.
 */
export default async function AdminNewPage({ searchParams }: PageProps<"/admin/nuevo">) {
  await requireStaff();

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const dateKey = typeof params.fecha === "string" ? params.fecha : toLocalDateKey(new Date());

  let slots: { value: string; label: string }[] = [];
  let dateError: string | null = null;

  try {
    const range = localDayRangeFromKey(dateKey);
    const availability = await getAvailability({
      from: range.start,
      to: range.end,
      audience: "admin",
    });
    slots = availability.slots.map((slot) => ({
      value: slot.start.toISOString(),
      label: formatTime(slot.start),
    }));
  } catch {
    dateError = "Esa fecha no es válida.";
  }

  return (
    <div>
      <h2 className="mb-1 text-2xl font-semibold tracking-tight">Nuevo turno</h2>
      <p className="mb-5 text-muted">Para turnos que te piden por teléfono o en el consultorio.</p>

      {/* GET form so picking a date is a plain navigation — no client JS needed. */}
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="fecha" className="block text-[0.95rem] font-medium">
            Fecha
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={dateKey}
            className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2.5"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-border bg-surface px-4 py-2.5 hover:border-accent"
        >
          Ver horarios
        </button>
      </form>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/5 p-4">
          {error}
        </p>
      )}

      {dateError ? (
        <p className="text-muted">{dateError}</p>
      ) : slots.length === 0 ? (
        <p className="text-muted">
          No quedan horarios libres ese día. Probá otra fecha, o revisá{" "}
          <Link href="/admin" className="text-accent underline">
            la agenda
          </Link>
          .
        </p>
      ) : (
        <form action={createAdminBooking} className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <div>
            <label htmlFor="startsAt" className="block text-[0.95rem] font-medium">
              Horario
            </label>
            <select
              id="startsAt"
              name="startsAt"
              required
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-3 text-[1.05rem]"
            >
              {slots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="patientFirstName" className="block text-[0.95rem] font-medium">
                Nombre
              </label>
              <input
                id="patientFirstName"
                name="patientFirstName"
                required
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-3 text-[1.05rem]"
              />
            </div>
            <div>
              <label htmlFor="patientLastName" className="block text-[0.95rem] font-medium">
                Apellido
              </label>
              <input
                id="patientLastName"
                name="patientLastName"
                required
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-3 text-[1.05rem]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="patientDni" className="block text-[0.95rem] font-medium">
                DNI
              </label>
              <input
                id="patientDni"
                name="patientDni"
                required
                inputMode="numeric"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-3 text-[1.05rem]"
              />
            </div>
            <div>
              <label htmlFor="patientCoverage" className="block text-[0.95rem] font-medium">
                Obra social
              </label>
              <select
                id="patientCoverage"
                name="patientCoverage"
                required
                defaultValue="particular"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-3 text-[1.05rem]"
              >
                {COVERAGES.map((coverage) => (
                  <option key={coverage.value} value={coverage.value}>
                    {coverage.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="patientPhone" className="block text-[0.95rem] font-medium">
              Teléfono
            </label>
            <input
              id="patientPhone"
              name="patientPhone"
              type="tel"
              required
              inputMode="tel"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-3 text-[1.05rem]"
            />
          </div>

          <div>
            <label htmlFor="motivo" className="block text-[0.95rem] font-medium">
              Motivo <span className="font-normal text-muted">(opcional)</span>
            </label>
            <textarea
              id="motivo"
              name="motivo"
              rows={2}
              maxLength={500}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-accent px-4 py-3.5 text-[1.05rem] font-medium text-white hover:bg-accent-hover"
          >
            Guardar turno
          </button>
        </form>
      )}
    </div>
  );
}
