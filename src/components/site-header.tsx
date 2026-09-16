"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type NavItem = { href: string; label: string };

/**
 * El encabezado del sitio.
 *
 * Es el único componente cliente de las páginas públicas, y paga ese costo por
 * tres cosas que no se pueden hacer sin JavaScript:
 *
 *  1. El menú desplegable en pantallas chicas. Sin él, los cuatro links
 *     envolvían en cuatro filas y el encabezado medía 193px en un iPhone — casi
 *     un cuarto de la pantalla antes de que empiece el contenido. Medido, no
 *     estimado.
 *
 *  2. Que ese menú se cierre al elegir una sección. Un `<details>` con CSS
 *     haría el desplegable sin JavaScript, pero quedaría abierto tapando la
 *     página justo cuando el scroll lleva a la sección elegida.
 *
 *  3. Resaltar la sección que se está mirando.
 *
 * Y una vez que es cliente, hacerlo pegajoso tiene sentido: en un sitio de una
 * sola página, poder saltar entre secciones sin volver arriba es la mitad de la
 * gracia.
 */
export function SiteHeader({ nav }: { nav: NavItem[] }) {
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState<string | null>(null);
  const pathname = usePathname();
  const [ultimoPath, setUltimoPath] = useState(pathname);

  // Cambiar de página cierra el menú y apaga el resaltado. Sin esto el menú
  // queda abierto sobre la página nueva —el componente no se desmonta al
  // navegar— y el resaltado de la última sección vista sigue encendido en
  // /turnos, donde no hay ninguna sección.
  //
  // Va durante el render y no en un `useEffect`, que sería lo intuitivo: la
  // regla `react-hooks/set-state-in-effect` lo prohíbe porque encadena un
  // render de más. Ajustar el estado mientras se renderiza es el patrón que
  // React documenta para esto, y el que ya usa el resto del proyecto.
  if (pathname !== ultimoPath) {
    setUltimoPath(pathname);
    setAbierto(false);
    setActiva(null);
  }

  /**
   * Qué sección se está mirando.
   *
   * `rootMargin` recorta la ventana de observación a una franja del medio de la
   * pantalla: sin eso, dos secciones visibles a la vez se pelean el resaltado y
   * el menú titila mientras uno scrollea.
   *
   * Sólo corre donde hay secciones que observar. En /turnos o /privacidad no
   * encuentra ninguna y no resalta nada, que es lo correcto.
   */
  useEffect(() => {
    const ids = nav.map((item) => item.href.split("#")[1]).filter(Boolean);
    const secciones = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    // Sin secciones que observar no hay nada que hacer. Apagar el resaltado no
    // hace falta acá: de eso se encarga el ajuste durante el render de arriba,
    // que es además el único momento en que puede cambiar la página.
    if (secciones.length === 0) return;

    // Se lleva la cuenta de TODAS las que están en la franja, no sólo de la
    // última que entró. Dos cosas dependen de esto:
    //
    //   - Arriba de todo —el hero, que no es una sección del menú— no hay
    //     ninguna en la franja y no se resalta nada. Marcando sólo al entrar,
    //     quedaba pegado el último valor y el menú resaltaba "Cómo llegar"
    //     estando en el tope de la página.
    //   - Si dos se superponen gana la ÚLTIMA en orden del documento, que es la
    //     que uno está entrando al bajar.
    //
    // Lo segundo no es un detalle teórico: la última sección es corta y queda
    // cerca del fondo, así que con el scroll al máximo la franja toca a las dos
    // últimas a la vez. Eligiendo la primera, "Preguntas" no podía resaltarse
    // nunca — no había forma de scrollear lo suficiente.
    const dentro = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) dentro.add(entry.target.id);
          else dentro.delete(entry.target.id);
        }
        const ultima = [...secciones].reverse().find((seccion) => dentro.has(seccion.id));
        setActiva(ultima?.id ?? null);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    for (const seccion of secciones) observer.observe(seccion);
    return () => observer.disconnect();
  }, [nav, pathname]);

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-x-3 px-4 py-3.5 sm:gap-x-6">
        <Link href="/" className="whitespace-nowrap text-lg font-semibold tracking-tight">
          Podología <span className="text-accent">Rosa</span>
        </Link>

        {/* Escritorio */}
        <nav aria-label="Principal" className="ml-auto hidden items-center gap-x-5 md:flex">
          {nav.map((item) => {
            const id = item.href.split("#")[1];
            const esActiva = Boolean(id) && id === activa;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={esActiva ? "true" : undefined}
                className={
                  esActiva
                    ? "text-[0.95rem] font-medium text-accent"
                    : "text-[0.95rem] text-muted transition-colors hover:text-foreground"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/*
          Dos etiquetas, no una: a 390px "Sacar un turno" envolvía a dos líneas
          y estiraba el encabezado a 100px. Medido, no supuesto.
        */}
        <Link
          href="/turnos"
          className="ml-auto whitespace-nowrap rounded-lg bg-accent px-4 py-2.5 text-[0.95rem] font-medium text-white transition-colors hover:bg-accent-hover md:ml-0"
        >
          <span className="sm:hidden">Sacar turno</span>
          <span className="hidden sm:inline">Sacar un turno</span>
        </Link>

        {/* Teléfono */}
        {nav.length > 0 && (
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            className="-mr-2 rounded-lg p-2 text-foreground md:hidden"
          >
            {/* Dos barras que se cruzan al abrir: una sola forma, sin íconos. */}
            <span className="relative block h-4 w-6" aria-hidden>
              <span
                className={`absolute left-0 block h-0.5 w-6 bg-current transition-transform ${
                  abierto ? "top-1.5 rotate-45" : "top-0.5"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-6 bg-current transition-transform ${
                  abierto ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        )}
      </div>

      {abierto && nav.length > 0 && (
        <nav
          id="menu-movil"
          aria-label="Principal"
          className="border-t border-border md:hidden"
        >
          <ul className="mx-auto max-w-5xl px-4 py-2">
            {nav.map((item) => {
              const id = item.href.split("#")[1];
              const esActiva = Boolean(id) && id === activa;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setAbierto(false)}
                    aria-current={esActiva ? "true" : undefined}
                    className={`block border-b border-border py-3 text-[1.05rem] last:border-0 ${
                      esActiva ? "font-medium text-accent" : "text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
