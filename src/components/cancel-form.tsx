"use client";

import { useActionState } from "react";

import { cancelTurno, type CancelState } from "@/app/actions/cancel";

const INITIAL: CancelState = { status: "idle" };

export function CancelForm({ token, clinicPhone }: { token: string; clinicPhone: string | null }) {
  const [state, formAction, isPending] = useActionState(cancelTurno, INITIAL);

  /*
    No hay rama de "cancelado" acá: la acción redirige a la misma página con
    `?listo=1` y el acuse lo muestra el servidor. Un estado de cliente no
    sobreviviría a ese render, y el que vuelve al enlace después tiene que ver
    lo mismo que vio al cancelar.
  */

  return (
    <form action={formAction} className="mt-10 border-t border-border pt-8">
      <input type="hidden" name="token" value={token} />

      <h2 className="font-wide text-[1.35rem] font-extrabold tracking-[-0.02em]">
        ¿No podés venir?
      </h2>
      <p className="mt-2 max-w-[52ch] leading-relaxed text-muted">
        Cancelá acá y el horario queda libre para otra persona. No se puede deshacer: si después
        querés volver, hay que sacar un turno nuevo.
      </p>

      {state.status === "error" && (
        <p role="alert" className="mt-4 text-[0.95rem] font-bold text-[color:var(--danger)]">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 w-full border-2 border-[color:var(--danger)] px-4 py-3.5 text-[1.05rem] font-bold text-[color:var(--danger)] transition-[background-color,color,transform] duration-100 hover:bg-[color:var(--danger)] hover:text-white active:translate-y-0.5 disabled:opacity-60"
      >
        {isPending ? "Cancelando…" : "Cancelar mi turno"}
      </button>

      {clinicPhone && (
        <p className="mt-4 text-[0.95rem] text-muted">
          ¿Preferís reprogramar? Llamanos al{" "}
          <a href={`tel:${clinicPhone}`} className="font-bold text-accent underline underline-offset-4">
            {clinicPhone}
          </a>{" "}
          y lo vemos.
        </p>
      )}
    </form>
  );
}
