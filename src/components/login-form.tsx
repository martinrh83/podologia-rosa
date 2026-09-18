"use client";

import { useActionState } from "react";

import { login, type LoginState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/admin/buttons";
import { TextField } from "@/components/admin/fields";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(login, {} as LoginState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <TextField id="email" label="Email" type="email" required autoComplete="username" />
      <TextField
        id="password"
        label="Contraseña"
        type="password"
        required
        autoComplete="current-password"
      />

      <p aria-live="polite" className="text-[0.95rem] font-bold text-[color:var(--danger)]">
        {state.error ?? ""}
      </p>

      <SubmitButton block pendingLabel="Entrando…">
        Entrar
      </SubmitButton>
    </form>
  );
}
