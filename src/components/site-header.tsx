"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/logo";

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
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Mientras el scroll va hacia una sección elegida en el menú, el resaltado
  // queda fijo en ella. Ver `pinSection`.
  const pinned = useRef(false);
  const pinTimer = useRef(0);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Cambiar de página cierra el menú y apaga el resaltado. Sin esto el menú
  // queda abierto sobre la página nueva —el componente no se desmonta al
  // navegar— y el resaltado de la última sección vista sigue encendido en
  // /turnos, donde no hay ninguna sección.
  //
  // Va durante el render y no en un `useEffect`, que sería lo intuitivo: la
  // regla `react-hooks/set-state-in-effect` lo prohíbe porque encadena un
  // render de más. Ajustar el estado mientras se renderiza es el patrón que
  // React documenta para esto, y el que ya usa el resto del proyecto.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
    setActiveId(null);
  }

  /**
   * Qué sección se está mirando: la última cuyo borde de arriba ya pasó un
   * tercio de la pantalla.
   *
   * Era un `IntersectionObserver` con una franja del 45% al 55% de la pantalla,
   * y tenía un borde geométrico: en pantallas altas la franja arrancaba tocando
   * la primera sección. A 1920x1080 el hero termina en 592px y la franja llega
   * a 594, así que el menú resaltaba "Tratamientos" sin haber scrolleado nada.
   * Un observer sólo avisa cuando algo entra o sale, así que no alcanzaba con
   * filtrar por posición en el aviso: la sección ya adentro no volvía a avisar.
   *
   * Un tercio y no la mitad: al elegir una sección del menú, su borde queda
   * pegado abajo del encabezado, y con la mitad una sección corta como
   * "Profesionales" dejaba pasar a la siguiente y el menú resaltaba otra. Y
   * arriba de todo —el hero, que no es una sección del menú— no se resalta
   * nada aunque la pantalla sea tan alta que la primera sección ya se vea.
   * Son cuatro `getBoundingClientRect()` por frame como mucho.
   *
   * La excepción es el fondo de la página. La última sección es corta y con el
   * scroll al máximo su borde puede no llegar nunca a la mitad: sin esto,
   * "Preguntas frecuentes" no podría resaltarse. Si no hay más para bajar y se
   * ve, gana ella.
   *
   * Lo que la posición no puede resolver es una sección elegida desde el menú
   * que no llega a subir porque la página se termina: "Cómo llegar" y
   * "Preguntas frecuentes" dejan la pantalla exactamente en el mismo lugar, el
   * fondo. Para eso está `pinSection`: mientras dura ese scroll, manda lo que
   * se eligió.
   *
   * Sólo corre donde hay secciones. En /turnos o /privacidad no encuentra
   * ninguna y no resalta nada, que es lo correcto.
   */
  useEffect(() => {
    const ids = nav.map((item) => item.href.split("#")[1]).filter(Boolean);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    // Sin secciones que observar no hay nada que hacer. Apagar el resaltado no
    // hace falta acá: de eso se encarga el ajuste durante el render de arriba,
    // que es además el único momento en que puede cambiar la página.
    if (sections.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      const last = sections[sections.length - 1];
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      if (atBottom && last.getBoundingClientRect().top < window.innerHeight) {
        setActiveId(last.id);
        return;
      }
      if (window.scrollY < 1) {
        setActiveId(null);
        return;
      }
      const current = sections.findLast((section) => section.getBoundingClientRect().top <= line);
      setActiveId(current?.id ?? null);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onScroll = () => {
      // Con una sección fijada, cada evento de scroll corre la liberación a
      // 150ms: se suelta cuando el scroll deslizante termina, sin recalcular,
      // y el próximo scroll de la persona vuelve a mandar.
      if (pinned.current) {
        window.clearTimeout(pinTimer.current);
        pinTimer.current = window.setTimeout(() => (pinned.current = false), 150);
        return;
      }
      schedule();
    };

    // El primer cálculo también va por `requestAnimationFrame`: llamar a
    // `update()` acá mismo sería un setState síncrono dentro del efecto, que
    // `react-hooks/set-state-in-effect` prohíbe.
    schedule();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
    };
  }, [nav, pathname]);

  /**
   * Lleva a la sección elegida y la deja resaltada hasta que ese scroll termina.
   *
   * EL SCROLL LO HACEMOS NOSOTROS, A PROPÓSITO
   *
   *   Tocar "Profesionales" estando ya en `/#team` no navega: la URL no cambia,
   *   así que el router no hace nada y el navegador tampoco vuelve a saltar al
   *   ancla. En la práctica, el que scrollea por el home y vuelve a tocar la
   *   misma sección del menú ve que el link "no anda". Por eso movemos nosotros
   *   la página con `scrollIntoView`, que además respeta el
   *   `scroll-behavior: smooth` y la preferencia de movimiento reducido.
   *
   *   El `Link` sigue haciendo lo suyo: actualiza la URL, que es lo que permite
   *   compartir `/#team`.
   *
   * Si el link lleva a otra página (el menú desde /turnos apunta a `/#team`) la
   * sección no está en este documento: no hay nada que mover ni que fijar, y de
   * la navegación se encarga el `Link`. El segundo de gracia cubre el caso en
   * que no hay scroll —la sección ya estaba en su lugar— y entonces nunca
   * llegaría el evento que la suelta.
   */
  function pinSection(href: string) {
    const id = href.split("#")[1];
    const section = id ? document.getElementById(id) : null;
    if (!section) return;
    section.scrollIntoView({ block: "start" });
    setActiveId(id);
    pinned.current = true;
    window.clearTimeout(pinTimer.current);
    pinTimer.current = window.setTimeout(() => (pinned.current = false), 1000);
  }

  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-x-2 px-4 py-3 sm:gap-x-6 sm:px-6">
        {/*
          El nombre va como el encabezado impreso de la tarjeta: versalitas
          angostas, en tinta. El isotipo, en la tinta del sello.
        */}
        <Link
          href="/"
          className="flex min-h-11 min-w-0 items-center gap-2 whitespace-nowrap font-narrow text-[0.95rem] max-[359px]:gap-1.5 max-[359px]:text-[0.85rem] font-extrabold uppercase tracking-[0.06em] sm:text-[1.15rem]"
        >
          <Logo className="h-7 w-auto shrink-0 text-accent max-[359px]:h-6 sm:h-8" />
          {/*
            Debajo de 390 px el nombre en una línea no entra al lado del botón:
            se apila en dos, como un logo impreso, en vez de cortarse o
            esconderse.
          */}
          <span className="max-[389px]:w-min max-[389px]:whitespace-normal max-[389px]:leading-[0.95]">
            Podología Mitre
          </span>
        </Link>

        {/* Escritorio */}
        <nav aria-label="Principal" className="ml-auto hidden items-center gap-x-6 lg:flex">
          {nav.map((item) => {
            const id = item.href.split("#")[1];
            const isActive = Boolean(id) && id === activeId;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => pinSection(item.href)}
                aria-current={isActive ? "true" : undefined}
                // El hover se ve igual que la sección en la que uno está: el
                // menú muestra de una sola forma "acá vas" y "acá estás".
                className={`text-[0.95rem] font-medium underline-offset-[6px] transition-colors hover:text-accent hover:underline hover:decoration-2 ${
                  isActive ? "text-accent underline decoration-2" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* El sello: se hunde un píxel al apretarlo. */}
        <Link
          href="/turnos"
          className="ml-auto flex min-h-11 items-center whitespace-nowrap border-2 border-accent bg-accent px-3 text-[0.9rem] max-[359px]:px-2.5 max-[359px]:text-[0.85rem] font-bold text-white transition-[background-color,transform] duration-100 hover:border-accent-hover hover:bg-accent-hover active:translate-y-0.5 active:scale-[0.985] sm:px-4 sm:text-[0.95rem] lg:ml-0"
        >
          Sacar turno
        </Link>

        {/* Teléfono */}
        {nav.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="-mr-2.5 grid size-11 shrink-0 place-items-center text-foreground lg:hidden"
          >
            {/* Dos barras que se cruzan al abrir: una sola forma, sin íconos. */}
            <span className="relative block h-4 w-6" aria-hidden>
              <span
                className={`absolute left-0 block h-0.5 w-6 bg-current transition-transform ${
                  open ? "top-1.5 rotate-45" : "top-0.5"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-6 bg-current transition-transform ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        )}
      </div>

      {open && nav.length > 0 && (
        <nav id="mobile-menu" aria-label="Principal" className="border-t border-border lg:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-1 sm:px-6">
            {nav.map((item) => {
              const id = item.href.split("#")[1];
              const isActive = Boolean(id) && id === activeId;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      pinSection(item.href);
                    }}
                    aria-current={isActive ? "true" : undefined}
                    className={`block border-b border-border py-3.5 text-[1.05rem] font-medium underline-offset-[6px] last:border-0 hover:text-accent hover:underline hover:decoration-2 ${
                      isActive ? "text-accent underline decoration-2" : "text-foreground"
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
