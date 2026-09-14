import Link from "next/link";

import { logout } from "@/app/actions/auth";
import { getStaffSession } from "@/lib/auth";

const TABS = [
  { href: "/admin", label: "Hoy" },
  { href: "/admin/manana", label: "Mañana" },
  { href: "/admin/nuevo", label: "Nuevo turno" },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/profesionales", label: "Profesionales" },
  { href: "/admin/sedes", label: "Sedes" },
  { href: "/admin/servicios", label: "Precios" },
  { href: "/admin/consultorio", label: "Consultorio" },
];

/**
 * Admin shell. Mobile-first on purpose: Rosa uses this on her phone, often
 * one-handed, with a patient standing in front of her.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getStaffSession();

  // The login page renders inside this layout too, so the chrome is only shown
  // once there is a session. Un usuario de Auth sin fila en `staff` cae acá
  // igual que uno deslogueado: no ve ni las pestañas del panel.
  if (!session) return <>{children}</>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Panel de turnos</h1>
        <form action={logout}>
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            Salir
          </button>
        </form>
      </div>

      <nav aria-label="Secciones" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-lg border border-border bg-surface px-4 py-2.5 text-[0.95rem] hover:border-accent"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
