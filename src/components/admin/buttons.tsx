"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  buttonClass,
  REMOVE_ACTION,
  TEXT_ACTION,
  type ButtonVariant,
} from "@/components/admin/button-styles";
import { IDLE, type ActionState } from "@/lib/forms";

/** Una acción de un solo botón: sin campos, con un resultado que puede fallar. */
type ServerAction = (previous: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * El botón que envía el formulario en el que está, y avisa mientras tanto.
 *
 * Con `useFormStatus` y no con el `isPending` de cada formulario: así sirve
 * igual en un form con `useActionState` que en uno que llama a la acción
 * derecho, y ninguno tiene que pasarle nada.
 */
export function SubmitButton({
  children,
  pendingLabel = "Guardando…",
  variant = "primary",
  size,
  block,
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  block?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonClass(variant, { size, block })} ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

function Hidden({ fields }: { fields: Record<string, string> }) {
  return Object.entries(fields).map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={value} />
  ));
}

function PendingText({ children, pending }: { children: React.ReactNode; pending: string }) {
  const status = useFormStatus();
  return status.pending ? pending : children;
}

/**
 * El error de una acción de un botón, al lado del botón.
 *
 * Un aviso entero arriba sería desproporcionado para un «Marcar atendido»: es
 * la misma letra roja en negrita que el error de un campo, en el mismo renglón
 * de lo que falló.
 */
function InlineError({ state }: { state: ActionState }) {
  const message = state.status === "error" ? state.message : "";
  // El margen va sólo con texto: vacío, un `gap` del contenedor lo haría
  // ocupar lugar y correría los enlaces alineados a la derecha.
  return (
    <p
      aria-live="polite"
      className={`text-[0.95rem] font-bold text-[color:var(--danger)] ${message ? "ml-3" : ""}`}
    >
      {message}
    </p>
  );
}

/** Un botón que hace una sola cosa, como cambiar el estado de un turno. */
export function ActionButton({
  action,
  fields,
  children,
  variant = "ink",
}: {
  action: ServerAction;
  fields: Record<string, string>;
  children: React.ReactNode;
  variant?: ButtonVariant;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-y-1">
      <Hidden fields={fields} />
      <SubmitButton variant={variant} size="sm">
        {children}
      </SubmitButton>
      <InlineError state={state} />
    </form>
  );
}

/**
 * Una acción de un toque que no necesita confirmación: volver a activar, volver
 * a mostrar. Va como enlace de texto.
 */
export function InlineAction({
  action,
  fields,
  children,
}: {
  action: ServerAction;
  fields: Record<string, string>;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <form action={formAction} className="flex flex-wrap items-center justify-end">
      <Hidden fields={fields} />
      <button type="submit" className={TEXT_ACTION}>
        <PendingText pending="Guardando…">{children}</PendingText>
      </button>
      <InlineError state={state} />
    </form>
  );
}

/**
 * Una acción que pide confirmación antes de hacerse.
 *
 * EN LÍNEA Y NO EN UN MODAL
 *
 *   El panel se usa desde el teléfono, con una mano y un paciente enfrente: un
 *   toque de más en «Cancelar turno» cancelaba para siempre, sin preguntar. El
 *   primer toque ahora sólo cambia el botón por la pregunta, en el mismo lugar,
 *   y el segundo hace la acción. Un modal taparía justo el turno del que se
 *   está hablando.
 *
 *   La confirmación toma el foco al aparecer, para que con teclado el Enter
 *   siguiente sea el que confirma, y Escape vuelve atrás y devuelve el foco al
 *   botón original. Si la acción falla, la pregunta sigue ahí con el error al
 *   lado, para reintentar sin volver a empezar.
 */
export function ConfirmAction({
  action,
  fields,
  label,
  question,
  confirmLabel,
}: {
  action: ServerAction;
  fields: Record<string, string>;
  label: string;
  question: string;
  confirmLabel: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const [asking, setAsking] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Sólo se devuelve el foco al volver de la pregunta, no al montar.
  const wasAsking = useRef(false);

  useEffect(() => {
    if (asking) confirmRef.current?.focus();
    else if (wasAsking.current) triggerRef.current?.focus();
    wasAsking.current = asking;
  }, [asking]);

  if (!asking) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setAsking(true)}
        className={REMOVE_ACTION}
      >
        {label}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={question}
      onKeyDown={(event) => {
        if (event.key === "Escape") setAsking(false);
      }}
      className="flex flex-wrap items-center gap-x-3 gap-y-2"
    >
      <p className="text-[0.95rem] font-bold">{question}</p>
      <form action={formAction}>
        <Hidden fields={fields} />
        <button ref={confirmRef} type="submit" className={buttonClass("danger", { size: "sm" })}>
          <PendingText pending="Un momento…">{confirmLabel}</PendingText>
        </button>
      </form>
      <button type="button" onClick={() => setAsking(false)} className={TEXT_ACTION}>
        No
      </button>
      <InlineError state={state} />
    </div>
  );
}
