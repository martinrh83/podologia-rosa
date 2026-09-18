import type { Metadata } from "next";

import { PageHeading } from "@/components/admin/page-heading";
import { LoginForm } from "@/components/login-form";
import { Notice } from "@/components/notice";

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
    <div className="mx-auto max-w-sm px-4 pb-16 pt-12 sm:pt-16">
      <PageHeading title="Panel de turnos" />

      {sinAcceso && (
        <div className="mb-6">
          <Notice tone="muted" title="Tu usuario ya no tiene acceso">
            Si es un error, hablá con el consultorio.
          </Notice>
        </div>
      )}

      <LoginForm next={next} />
    </div>
  );
}
