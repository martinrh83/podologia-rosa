import type { Metadata } from "next";
import Link from "next/link";

import { getClinicSettings } from "@/lib/availability";
import { getActiveServices } from "@/lib/db/services";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Servicios y precios",
  description:
    "Quiropodia, uñas encarnadas, pie diabético, verrugas plantares y estudio de la pisada.",
};

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  const [services, settings] = await Promise.all([getActiveServices(), getClinicSettings()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Servicios</h1>
      <p className="mt-3 text-lg text-muted">
        Cada turno dura {settings.slot_minutes} minutos. Si no sabés cuál te corresponde, sacá turno
        igual y lo vemos juntas.
      </p>

      <ul className="mt-8 space-y-5">
        {services.map((service) => (
          <li key={service.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2 className="text-xl font-medium">{service.name}</h2>
              <p className="tabular-nums text-muted">{formatPrice(service.price) ?? "Consultar"}</p>
            </div>
            {service.description && <p className="mt-2 text-muted">{service.description}</p>}
          </li>
        ))}
      </ul>

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
