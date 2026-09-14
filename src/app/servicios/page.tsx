import type { Metadata } from "next";
import Link from "next/link";

import { getActiveServices } from "@/lib/db/services";
import type { ServiceWithSpecialty } from "@/lib/db/types";
import { formatPrice } from "@/lib/format";

/**
 * La descripción sale de la base, no de una lista escrita a mano.
 *
 * Estaba fija —"Quiropodia, uñas encarnadas, pie diabético…"— y esa es
 * exactamente la clase de dato que envejece sin que nadie lo note: Rosa cambia
 * los servicios desde el panel y el resultado de Google sigue prometiendo
 * tratamientos que ya no se hacen.
 *
 * Se recorta a 155 caracteres, que es lo que Google muestra antes de cortar.
 */
export async function generateMetadata(): Promise<Metadata> {
  const services = await getActiveServices();
  const names = services.map((service) => service.name);

  const listado = names.join(", ");
  const description =
    listado.length > 155 ? `${listado.slice(0, 152).trimEnd()}…` : `${listado}.`;

  return {
    title: "Servicios y precios",
    description: names.length > 0 ? description : "Tratamientos y precios del consultorio.",
  };
}

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

export default async function ServiciosPage() {
  const services = await getActiveServices();

  // Agrupar sólo cuando hay más de una disciplina: con una sola, el título
  // repetiría lo que ya dice el sitio entero.
  const groups = new Map<string, ServiceWithSpecialty[]>();
  for (const service of services) {
    const key = service.specialty?.name ?? "Otros";
    groups.set(key, [...(groups.get(key) ?? []), service]);
  }
  const showHeadings = groups.size > 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Servicios</h1>
      <p className="mt-3 text-lg text-muted">
        Si no sabés cuál te corresponde, sacá turno igual y lo vemos juntas.
      </p>

      <div className="mt-8 space-y-8">
        {[...groups.entries()].map(([specialty, items]) => (
          <section key={specialty}>
            {showHeadings && (
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                {specialty}
              </h2>
            )}

            <ul className="space-y-5">
              {items.map((service) => (
                <li key={service.id} className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 className="text-xl font-medium">{service.name}</h3>
                    <p className="tabular-nums text-muted">
                      {formatPrice(service.price) ?? "Consultar"}
                    </p>
                  </div>
                  {service.description && <p className="mt-2 text-muted">{service.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted">
        Los precios pueden variar. Ante cualquier duda, consultanos antes del turno.
      </p>

      <Link
        href="/turnos"
        className="mt-8 inline-block rounded-lg bg-accent px-6 py-3.5 text-[1.05rem] font-medium text-white hover:bg-accent-hover"
      >
        Sacar un turno
      </Link>
    </div>
  );
}
