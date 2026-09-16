import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: true },
};

/**
 * El 404 del sitio.
 *
 * Sin este archivo, Next sirve el suyo: «This page could not be found», en
 * inglés, dentro de un documento que declara `lang="es-AR"`. Un paciente que
 * abre un link viejo no entiende qué pasó ni tiene adónde ir.
 *
 * Sin datos de la base a propósito: es la página que responde a cualquier URL
 * inventada, incluidas las de los bots, y no hay razón para que cada una de
 * ésas cueste una consulta.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">Error 404</p>

      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        No encontramos esta página
      </h1>

      <p className="mt-3 text-lg text-muted">
        Puede que el enlace esté viejo o que la dirección tenga un error de tipeo.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/turnos"
          className="rounded-lg bg-accent px-5 py-3 font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Sacar turno
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-border bg-surface px-5 py-3 font-medium transition-colors hover:border-accent"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
