"use client";

import { useActionState, useState } from "react";

import { addBlock, type ScheduleState } from "@/app/actions/schedule";
import { FormMessage } from "@/components/shift-form";

const INITIAL: ScheduleState = { status: "idle" };

/** Alta de un cierre. Controlado por el mismo motivo que [ShiftForm]. */
export function BlockForm() {
  const [state, formAction, isPending] = useActionState(addBlock, INITIAL);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");

  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") {
      setFrom("");
      setTo("");
      setReason("");
    }
  }

  return (
    <form action={formAction} className="mt-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="from" className="block text-sm font-medium">
            Desde
          </label>
          <input
            id="from"
            name="from"
            type="date"
            required
            value={from}
            onChange={(event) => setFrom(event.target.value)}
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
            value={to}
            onChange={(event) => setTo(event.target.value)}
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
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Bloquear"}
        </button>
      </div>

      <FormMessage state={state} saved="Listo, esos días ya no se pueden reservar." />
    </form>
  );
}
