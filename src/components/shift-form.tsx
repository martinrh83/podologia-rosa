"use client";

import { useActionState, useState } from "react";

import { addShift, type ScheduleState } from "@/app/actions/schedule";
import { WEEKDAYS } from "@/lib/weekdays";

const INITIAL: ScheduleState = { status: "idle" };

/**
 * Alta de una franja horaria.
 *
 * Los campos están controlados a propósito. React limpia un formulario no
 * controlado cuando la acción termina, sin distinguir si guardó o falló: con
 * inputs sueltos, un rechazo mostraba el error y de paso le borraba a Rosa lo
 * que acababa de cargar. Acá el estado es nuestro y se limpia sólo al guardar.
 */
export function ShiftForm({ practitionerId }: { practitionerId: string }) {
  const [state, formAction, isPending] = useActionState(addShift, INITIAL);

  const [weekday, setWeekday] = useState("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Ajustar el estado durante el render, no en un efecto: cuando llega un
  // resultado nuevo y fue exitoso, se vacían los campos. React lo resuelve
  // antes de pintar, sin el render en cascada que provoca un `useEffect`.
  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") {
      setStartTime("");
      setEndTime("");
    }
  }

  return (
    <form action={formAction} className="mt-4 rounded-xl border border-border bg-surface p-4">
      {/* De quién es la franja: lo define el selector de arriba de la pantalla. */}
      <input type="hidden" name="practitionerId" value={practitionerId} />

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="weekday" className="block text-sm font-medium">
            Día
          </label>
          <select
            id="weekday"
            name="weekday"
            value={weekday}
            onChange={(event) => setWeekday(event.target.value)}
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
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
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
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="mt-1 rounded-lg border border-border bg-background px-3 py-2.5"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Agregar"}
        </button>
      </div>

      <FormMessage state={state} saved="Listo, la franja ya está cargada." />
    </form>
  );
}

/** El resultado de la última acción. Vacío mientras no haya pasado nada. */
export function FormMessage({ state, saved }: { state: ScheduleState; saved: string }) {
  if (state.status === "error") {
    return (
      <p role="alert" className="mt-3 text-[0.95rem] text-[color:var(--danger)]">
        {state.message}
      </p>
    );
  }

  if (state.status === "saved") {
    return (
      <p role="status" className="mt-3 text-[0.95rem] text-[color:var(--success)]">
        {saved}
      </p>
    );
  }

  return null;
}
