import Image from "next/image";

import { Address } from "@/components/home/address";
import { SectionHeading } from "@/components/home/section-heading";

import { mapForAddress, type LocationMap } from "@/lib/maps";
import type { Location } from "@/lib/db/types";

export type ScheduleRow = { weekday: number; start_time: string; end_time: string; location_id: string };

/**
 * Dónde queda cada sede: una tarjeta por sede, con su mapa.
 *
 * Era `/como-llegar`.
 *
 * SIN HORARIOS
 *
 *   Estuvieron, primero como tabla y después dentro de cada tarjeta, y salieron:
 *   esta sección contesta cómo llegar. Cuándo atienden lo resume el hero, y los
 *   horarios reales se ven al sacar turno.
 *
 * SIN TELÉFONO NI WHATSAPP
 *
 *   Están en el hero como botones, que dicen qué hacen. Acá eran dos links
 *   sueltos debajo de las tarjetas, con el número en crudo.
 *
 * EL MAPA
 *
 *   Un SVG por sede en `public/maps/`, generado una vez con datos de
 *   OpenStreetMap por `scripts/generate-maps.mjs` y servido desde nuestro
 *   dominio: sin JavaScript de terceros, sin cookies y sin que ningún proveedor
 *   de mapas se entere de quién visita el sitio. El home sigue siendo 100%
 *   server component.
 *
 *   Se descarta el iframe de Google —le cuenta cada visita a Google antes de
 *   que nadie acepte nada, y tenemos página de privacidad—, también Leaflet,
 *   que cuesta un componente cliente y ~45 KB para algo que en un teléfono se
 *   toca una vez para abrir la app de mapas, y las imágenes de Snazzy Maps:
 *   son mapas de Google, y sus condiciones no permiten servirlas desde acá.
 *
 *   Va como archivo y no escrito dentro del componente para que no viaje en el
 *   HTML de cada visita: el navegador lo pide recién cerca de la sección y lo
 *   guarda en caché. `<Image>` sirve un `.svg` tal cual, sin optimizarlo.
 *
 *   Cada mapa se busca por la dirección de la sede (`src/lib/maps.ts`). Una
 *   sede sin mapa —nueva, o que se mudó— muestra su tarjeta igual, sin él.
 *
 * EL CROQUIS DEL DORSO
 *
 *   Cada sede es una tarjeta blanca de filete negro, sin sombra, con el croquis impreso arriba, como el que
 *   traen en el dorso las tarjetas de consultorio, y la dirección con la altura
 *   en rojo de numerador: es el número que se busca en la puerta.
 */
export function Directions({ locations }: { locations: Location[] }) {
  const hasManyLocations = locations.length > 1;

  return (
    <section id="directions" className="scroll-mt-20">
      <div aria-hidden className="perforado h-1.5" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading>Cómo llegar</SectionHeading>

        <ul
          className={`mt-10 grid gap-8 sm:gap-12 ${hasManyLocations ? "sm:grid-cols-2" : "sm:max-w-[calc(50%-1.5rem)]"}`}
        >
          {locations.map((location) => {
            const map = mapForAddress(location.address);
            return (
              <li
                key={location.id}
                className="flex flex-col border border-foreground bg-surface"
              >
                {map && <LocationMapImage map={map} href={location.map_url} />}

                {/* flex-1 + mt-auto: los botones quedan alineados aunque una dirección ocupe dos líneas. */}
                <div className="flex flex-1 flex-col px-5 pb-6 pt-5 sm:px-7">
                  {/*
                    La dirección es el título de la tarjeta; el nombre de la sede
                    va debajo, en la misma línea que la ciudad, y no como rótulo
                    suelto encima.
                  */}
                  <h3 className="font-wide text-[length:clamp(1.35rem,4.5vw,1.6rem)] font-extrabold leading-tight tracking-[-0.02em]">
                    <Address address={location.address} />
                  </h3>
                  <p className="mt-1 text-muted">
                    {hasManyLocations && (
                      <span className="font-bold text-foreground">Sede {location.name} · </span>
                    )}
                    Salta Capital
                  </p>

                  {location.map_url && (
                    <div className="mt-auto pt-6">
                      <a
                        href={location.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block border-2 border-foreground px-5 py-3 font-bold transition-[background-color,color,transform] duration-100 hover:bg-foreground hover:text-surface active:translate-y-0.5 active:scale-[0.985]"
                      >
                        Abrir en Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/**
 * Tocar el mapa hace lo mismo que el botón: abre Google Maps. Sin `map_url`, el
 * mapa queda como imagen suelta.
 */
function LocationMapImage({ map, href }: { map: LocationMap; href: string | null }) {
  const image = (
    <Image
      src={map.src}
      alt={map.alt}
      width={600}
      height={400}
      sizes="(min-width: 640px) 50vw, 100vw"
      className="h-auto w-full border-b-[5px] border-double border-foreground"
    />
  );
  if (!href) return image;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {image}
    </a>
  );
}
