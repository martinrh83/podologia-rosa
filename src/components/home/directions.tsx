import Image from "next/image";

import { whatsappLink } from "@/lib/format";
import { mapForAddress } from "@/lib/maps";
import type { ClinicSettings, Location } from "@/lib/db/types";

const WEEKDAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export type ScheduleRow = { weekday: number; start_time: string; end_time: string; location_id: string };

/**
 * Dónde queda, cómo contactarlos y cuándo atienden.
 *
 * Era `/como-llegar`. Los horarios NO están escritos acá: salen de
 * `weekly_schedule`, o sea de la agenda real de cada profesional. Por eso este
 * dato vive en una sola parte del sitio y no en el texto de las preguntas
 * frecuentes: el día que Rosa reorganice la semana desde el panel, esto se
 * actualiza solo y un texto fijo habría quedado mintiendo.
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
export function Directions({
  settings,
  locations,
  schedule,
}: {
  settings: ClinicSettings;
  locations: Location[];
  schedule: ScheduleRow[];
}) {
  // Agrupar por día y por sede: dos profesionales que atienden la misma franja
  // en la misma sede son UNA franja del consultorio, no dos.
  const nameById = new Map(locations.map((location) => [location.id, location.name]));
  const byWeekday = new Map<number, Map<string, Set<string>>>();
  for (const row of schedule) {
    const perLocation = byWeekday.get(row.weekday) ?? new Map<string, Set<string>>();
    const key = nameById.get(row.location_id) ?? "";
    const shifts = perLocation.get(key) ?? new Set<string>();
    shifts.add(`${row.start_time.slice(0, 5)} a ${row.end_time.slice(0, 5)}`);
    perLocation.set(key, shifts);
    byWeekday.set(row.weekday, perLocation);
  }

  const hasManyLocations = locations.length > 1;

  return (
    <section id="directions" className="scroll-mt-20 border-y border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">Cómo llegar</h2>

        <ul className={`mt-6 grid gap-6 ${hasManyLocations ? "sm:grid-cols-2" : "sm:max-w-[calc(50%-0.75rem)]"}`}>
          {locations.map((location) => {
            const map = mapForAddress(location.address);
            return (
              <li
                key={location.id}
                className="flex flex-col rounded-xl border border-border bg-background"
              >
                {map && <LocationMapImage map={map} href={location.map_url} />}
                <div className="p-5">
                  {hasManyLocations && (
                    <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                      {location.name}
                    </p>
                  )}
                  <p className="text-[1.05rem]">{location.address}</p>
                  {location.map_url && (
                    <a
                      href={location.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block rounded-lg border border-accent px-4 py-2.5 text-[0.95rem] font-medium text-accent hover:bg-accent hover:text-white"
                    >
                      Cómo llegar en Google Maps
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            {settings.phone && (
              <p className="text-[1.05rem]">
                <a href={`tel:${settings.phone}`} className="text-accent underline">
                  {settings.phone}
                </a>
              </p>
            )}

            {settings.whatsapp && (
              <p className="mt-2 text-[1.05rem]">
                <a
                  href={whatsappLink(
                    settings.whatsapp,
                    `Hola! Quería consultar por un turno en ${settings.clinic_name}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  Escribinos por WhatsApp
                </a>
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Horarios</h3>
            <ul className="mt-3">
              {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
                const perLocation = byWeekday.get(weekday);
                if (!perLocation) return null;
                return (
                  <li key={weekday} className="border-b border-border py-2 last:border-0">
                    {[...perLocation.entries()].map(([location, shifts], index) => (
                      <div key={location} className="flex justify-between gap-4">
                        <span>{index === 0 ? WEEKDAY_NAMES[weekday] : ""}</span>
                        <span className="text-right">
                          {hasManyLocations && location && (
                            <span className="mr-2 text-[0.85rem] uppercase tracking-wide text-accent">
                              {location}
                            </span>
                          )}
                          <span className="tabular-nums text-muted">
                            {[...shifts].sort().join(" y ")}
                          </span>
                        </span>
                      </div>
                    ))}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Tocar el mapa hace lo mismo que el botón: abre Google Maps. Sin `map_url`, el
 * mapa queda como imagen suelta.
 */
function LocationMapImage({
  map,
  href,
}: {
  map: { src: string; alt: string };
  href: string | null;
}) {
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
