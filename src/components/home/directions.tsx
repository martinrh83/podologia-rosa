import Image from "next/image";

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
 */
export function Directions({ locations }: { locations: Location[] }) {
  const hasManyLocations = locations.length > 1;

  return (
    <section id="directions" className="scroll-mt-20 border-y border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">Cómo llegar</h2>

        <ul
          className={`mt-6 grid gap-6 ${hasManyLocations ? "sm:grid-cols-2" : "sm:max-w-[calc(50%-0.75rem)]"}`}
        >
          {locations.map((location) => {
            const map = mapForAddress(location.address);
            return (
              <li
                key={location.id}
                className="flex flex-col rounded-xl border border-border bg-background"
              >
                {map && <LocationMapImage map={map} href={location.map_url} />}

                {/* flex-1 + mt-auto: los botones quedan alineados aunque una dirección ocupe dos líneas. */}
                <div className="flex flex-1 flex-col p-5">
                  {hasManyLocations && (
                    <h3 className="text-lg font-semibold tracking-tight">{location.name}</h3>
                  )}
                  <p className="text-[1.05rem] text-muted">{location.address}</p>

                  {location.map_url && (
                    <div className="mt-auto pt-5">
                      <a
                        href={location.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-lg border border-accent px-4 py-2.5 text-[0.95rem] font-medium text-accent hover:bg-accent hover:text-white"
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
      className="h-auto w-full border-b border-border"
    />
  );
  if (!href) return image;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {image}
    </a>
  );
}
