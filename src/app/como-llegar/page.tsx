import type { Metadata } from "next";

import { getClinicSettings } from "@/lib/availability";
import { listActiveLocations } from "@/lib/db/locations";
import { whatsappLink } from "@/lib/format";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { WeeklyScheduleRow } from "@/lib/db/types";

export const metadata: Metadata = {
  title: "Cómo llegar",
  description: "Dirección, horarios de atención y cómo contactarnos.",
};

/**
 * Estática, y la reconstruye el panel.
 *
 * Esto no se renderiza por visita: son datos de catálogo que sólo cambian
 * cuando alguien edita el consultorio, y cada acción que los toca ya llama a
 * `revalidatePath()` sobre esta ruta — así que dar de baja a un profesional o
 * corregir un precio se ve en el acto, sin esperar un deploy.
 *
 * El `revalidate` es la red de seguridad para lo que entra por fuera de la app
 * (una corrección a mano en Studio, un script): sin él, un cambio que no pase
 * por una acción no se vería nunca.
 */
export const revalidate = 3600;

const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function ComoLlegarPage() {
  const supabase = createSupabaseAdminClient();

  const [settings, locations, scheduleResult] = await Promise.all([
    getClinicSettings(),
    listActiveLocations(),
    supabase.from("weekly_schedule").select("*").order("weekday").order("start_time"),
  ]);

  const schedule = (scheduleResult.data ?? []) as WeeklyScheduleRow[];

  // Los horarios se agrupan por día Y por sede: con dos direcciones, "sábado
  // 09:00 a 13:00" sin decir dónde no le sirve a nadie.
  //
  // Y se deduplican: esta página muestra cuándo abre el consultorio, no la
  // agenda de cada una. Si las dos atienden el sábado de 9 a 13, eso es UNA
  // franja del consultorio, no dos.
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Cómo llegar</h1>

      <ul className="mt-6 space-y-4">
        {locations.map((location) => (
          <li key={location.id} className="rounded-xl border border-border bg-surface p-5">
            {locations.length > 1 && (
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                {location.name}
              </p>
            )}
            <p className="mt-1 text-[1.05rem]">{location.address}</p>
            {location.map_url && (
              <a
                href={location.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-[0.95rem] text-accent underline"
              >
                Ver en el mapa
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

      <h2 className="mt-10 text-2xl font-semibold tracking-tight">Horarios</h2>
      <ul className="mt-4 space-y-2">
        {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
          const perLocation = byWeekday.get(weekday);
          if (!perLocation) return null;
          return (
            <li key={weekday} className="border-b border-border py-2">
              {[...perLocation.entries()].map(([location, shifts], index) => (
                <div key={location} className="flex justify-between gap-4">
                  <span>{index === 0 ? WEEKDAY_NAMES[weekday] : ""}</span>
                  <span className="text-right">
                    {locations.length > 1 && location && (
                      <span className="mr-2 text-[0.85rem] uppercase tracking-wide text-accent">
                        {location}
                      </span>
                    )}
                    <span className="tabular-nums text-muted">{[...shifts].sort().join(" y ")}</span>
                  </span>
                </div>
              ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
