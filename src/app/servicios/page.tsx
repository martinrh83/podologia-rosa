import type { Metadata } from "next";
import Link from "next/link";

import { getActiveServices } from "@/lib/db/services";
import type { ServiceWithSpecialty } from "@/lib/db/types";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Servicios y precios",
  description:
    "Quiropodia, uñas encarnadas, pie diabético, verrugas plantares y estudio de la pisada.",
};

export const dynamic = "force-dynamic";

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
