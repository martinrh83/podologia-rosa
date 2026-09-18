"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logout } from "@/app/actions/auth";
import { REMOVE_ACTION } from "@/components/admin/button-styles";

/** Lo de todos los días: arriba, grande, al alcance del pulgar. */
const DAY = [
  { href: "/admin", label: "Hoy" },
  { href: "/admin/manana", label: "Mañana" },
  { href: "/admin/nuevo", label: "Nuevo turno" },
];

/** Lo que se toca de vez en cuando. */
const SETTINGS = [
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/profesionales", label: "Profesionales" },
  { href: "/admin/especialidades", label: "Especialidades" },
  { href: "/admin/sedes", label: "Sedes" },
  { href: "/admin/servicios", label: "Precios" },
  { href: "/admin/consultorio", label: "Consultorio" },
];

/**
 * El menú del panel, en dos filas.
 *
 * Eran ocho botones iguales que en el teléfono se envolvían en tres filas, sin
 * marcar en cuál estabas. Ahora se separa lo de todos los días —hoy, mañana,
 * cargar un turno— de la configuración, que se toca una vez por semana.
 *
 * La primera fila son tres pestañas del mismo ancho; la activa, llena en tinta
 * de sello. La segunda es una línea de enlaces, con el activo en sello y
 * subrayado, como el menú del sitio. Especialidades antes no estaba: sólo se llegaba desde un enlace
 * en Profesionales.
 */
export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav aria-label="Panel" className="mb-8">
      <ul className="grid grid-cols-3 gap-2">
        {DAY.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center justify-center whitespace-nowrap border-2 px-1.5 text-center text-[0.9rem] font-bold leading-tight transition-[background-color,border-color,transform] duration-100 active:translate-y-0.5 active:scale-[0.985] sm:text-[1.05rem] ${
                  active
                    ? "border-accent bg-accent text-white"
                    : "border-foreground hover:bg-surface"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/*
        En el teléfono la fila se parte en dos en vez de correrse con el dedo:
        una fila que se corre esconde justo las pantallas que menos se visitan,
        y «Salir» terminaba tapando la mitad de «Especialidades».
      */}
      <ul className="mt-2 flex flex-wrap items-center gap-x-5 border-b-2 border-foreground">
        {SETTINGS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center whitespace-nowrap text-[0.95rem] font-medium underline-offset-[6px] transition-colors hover:text-accent hover:underline hover:decoration-2 ${
                  active ? "text-accent underline decoration-2" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="ml-auto">
          <form action={logout}>
            {/* El relleno agranda el área de toque; el margen negativo lo deja donde estaba. */}
            <button type="submit" className={`-mx-3 px-3 ${REMOVE_ACTION}`}>
              Salir
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
