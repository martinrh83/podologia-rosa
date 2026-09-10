"use client";

import { useActionState } from "react";

import { login, type LoginState } from "@/app/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(login, {} as LoginState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email" className="block text-[0.95rem] font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-[0.95rem] font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-[0.95rem] text-[color:var(--danger)]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-4 py-3 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
