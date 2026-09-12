"use client";

import Link from "next/link";
import { useActionState } from "react";

import { cancelTurno, type CancelState } from "@/app/actions/cancel";

const INITIAL: CancelState = { status: "idle" };

export function CancelForm({ token, clinicPhone }: { token: string; clinicPhone: string | null }) {
  const [state, formAction, isPending] = useActionState(cancelTurno, INITIAL);

  if (state.status === "cancelled") {
    return (
      <div role="status" className="mt-6 rounded-xl border border-border bg-surface-muted p-5">
        <p className="font-medium">Tu turno fue cancelado.</p>
        <p className="mt-1 text-[0.95rem] text-muted">
          Gracias por avisar — el horario ya quedó libre para otra persona.{" "}
          <Link href="/turnos" className="text-accent underline">
            Reservar otro turno
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6">
      <input type="hidden" name="token" value={token} />

      <p className="text-[1.05rem]">
        ¿No podés venir? Cancelá acá y el horario queda libre para otra persona.
      </p>

      {state.status === "error" && (
        <p role="alert" className="mt-3 text-[0.95rem] text-[color:var(--danger)]">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded-lg border border-[color:var(--danger)] px-4 py-3.5 text-[1.05rem] font-medium text-[color:var(--danger)] transition-colors hover:bg-[color:var(--danger)] hover:text-white disabled:opacity-60"
      >
        {isPending ? "Cancelando…" : "Cancelar mi turno"}
      </button>

      {clinicPhone && (
        <p className="mt-3 text-sm text-muted">
          ¿Preferís reprogramar? Escribinos al {clinicPhone} y lo vemos.
        </p>
      )}
    </form>
  );
}
