import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";

import { listActivePractitioners } from "@/lib/db/practitioners";
import { getActiveServices } from "@/lib/db/services";

import "./globals.css";

const geist = Geist({
  variable: "--font-sans-stack",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Podología Rosa — Turnos online",
    template: "%s | Podología Rosa",
  },
  description:
    "Consultorio de podología. Sacá tu turno online en menos de un minuto, sin llamar ni crear una cuenta.",
  // es-AR so search engines and screen readers get the right variety of Spanish.
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Podología Rosa",
  },
};

/**
 * El menú apunta a secciones del home, no a páginas.
 *
 * Tratamientos, quién atiende y cómo llegar eran tres páginas con poco
 * contenido cada una, y el home ya repetía parte. Como secciones de una sola
 * página el sitio se lee de corrido y el camino al turno es más corto.
 *
 * Los href van con `/` adelante a propósito: desde /turnos o /privacidad un
 * `#tratamientos` pelado no llevaría a ningún lado.
 *
 * `/turnos` sigue siendo página — es el embudo, y cada profesional tiene su
 * propia URL para que una búsqueda por nombre caiga donde se saca el turno.
 */
type Seccion = { href: string; label: string; /** Cuándo tiene sentido ofrecerla. */ existe?: "servicios" | "profesionales" };

const NAV: Seccion[] = [
  { href: "/#tratamientos", label: "Tratamientos", existe: "servicios" },
  { href: "/#equipo", label: "Quién te atiende", existe: "profesionales" },
  { href: "/#como-llegar", label: "Cómo llegar" },
  { href: "/#preguntas", label: "Preguntas" },
];

/**
 * Un ancla a una sección que no existe no lleva a ningún lado, así que el menú
 * se arma con lo que el home realmente va a renderizar.
 *
 * Tratamientos y "quién te atiende" desaparecen si no hay nada cargado — y
 * producción estuvo exactamente así, sin servicios, después de que 0016 borrara
 * el catálogo de ejemplo.
 *
 * Cuesta dos consultas, que en las páginas públicas se pagan una vez por
 * revalidación porque son estáticas, y en el home son gratis: Next deduplica
 * las mismas consultas dentro de un render y la página ya las hace.
 */
async function navVisible() {
  const [services, practitioners] = await Promise.all([
    getActiveServices(),
    listActivePractitioners(),
  ]);

  return NAV.filter((item) => {
    if (item.existe === "servicios") return services.length > 0;
    if (item.existe === "profesionales") return practitioners.length > 0;
    return true;
  });
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nav = await navVisible();

  return (
    <html lang="es-AR" className={`${geist.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Podología <span className="text-accent">Rosa</span>
            </Link>

            <nav aria-label="Principal" className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[0.95rem] text-muted transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/turnos"
              className="ml-auto rounded-lg bg-accent px-4 py-2.5 text-[0.95rem] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Sacar un turno
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-16 border-t border-border bg-surface">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Podología Rosa</p>
            <Link href="/privacidad" className="hover:text-foreground">
              Privacidad y datos personales
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
