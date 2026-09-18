"use client";

import { useActionState } from "react";

import { login } from "@/app/actions/auth";
import { SubmitButton } from "@/components/admin/buttons";
import { TextField } from "@/components/fields";
import { FormAlert } from "@/components/form-alert";
import { useForm } from "@/components/use-form";
import { IDLE } from "@/lib/forms";
import { loginSchema } from "@/lib/schemas";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(login, IDLE);
  const form = useForm(loginSchema, { email: "", password: "" }, state);

  return (
    <form action={formAction} onSubmit={form.onSubmit} noValidate className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <TextField
        id="email"
        label="Email"
        type="email"
        required
        autoComplete="username"
        {...form.field("email")}
      />
      <TextField
        id="password"
        label="Contraseña"
        type="password"
        required
        autoComplete="current-password"
        {...form.field("password")}
      />

      <FormAlert state={state} />

      <SubmitButton block pendingLabel="Entrando…">
        Entrar
      </SubmitButton>
    </form>
  );
}
