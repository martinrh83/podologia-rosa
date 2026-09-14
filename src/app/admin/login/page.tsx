import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/admin";

  // Llega acá quien tenía sesión válida pero ya no está en `staff` — el caso
  // real es el de alguien dado de baja con la sesión todavía abierta. Sin este
  // aviso, el panel se limitaba a rebotarlo al login una y otra vez sin decir
  // por qué.
  const sinAcceso = params.error === "sin-acceso";

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Panel de turnos</h1>

      {sinAcceso && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-muted"
        >
          Tu usuario ya no tiene acceso al panel. Si es un error, hablá con el consultorio.
        </p>
      )}

      <LoginForm next={next} />
    </div>
  );
}
