import { whatsappLink } from "@/lib/format";
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

export type Franja = { weekday: number; start_time: string; end_time: string; location_id: string };

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
 *   Va a ser una imagen estática, diseñada una vez y servida desde nuestro
 *   dominio: sin JavaScript de terceros, sin cookies y sin que ningún proveedor
 *   de mapas se entere de quién visita el sitio. El home sigue siendo 100%
 *   server component.
 *
 *   Se descarta el iframe de Google —le cuenta cada visita a Google antes de
 *   que nadie acepte nada, y tenemos página de privacidad— y también Leaflet,
 *   que resolvería el estilo pero cuesta un componente cliente y ~45 KB para
 *   algo que en un teléfono se toca una vez para abrir la app de mapas.
 *
 *   Mientras no exista la imagen, la sección funciona igual: dirección, el link
 *   "Ver en el mapa" que ya se edita desde el panel, contacto y horarios.
 *
 *   Con más de una sede esto pide un campo en `locations` en vez de un archivo
 *   commiteado. Hoy hay una.
 */
export function ComoLlegar({
  settings,
  locations,
  schedule,
}: {
  settings: ClinicSettings;
  locations: Location[];
  schedule: Franja[];
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

  const varias = locations.length > 1;

  return (
    <section id="como-llegar" className="scroll-mt-8 border-y border-border bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">Cómo llegar</h2>

        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <div>
            <ul className="space-y-4">
              {locations.map((location) => (
                <li key={location.id}>
                  {varias && (
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
                      className="mt-2 inline-block rounded-lg border border-accent px-4 py-2.5 text-[0.95rem] font-medium text-accent hover:bg-accent hover:text-white"
                    >
                      Cómo llegar en Google Maps
                    </a>
                  )}
                </li>
              ))}
            </ul>

            {settings.phone && (
              <p className="mt-5 text-[1.05rem]">
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
                          {varias && location && (
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
