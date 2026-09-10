import Link from "next/link";

import { getClinicSettings } from "@/lib/availability";
import { getActiveServices } from "@/lib/db/services";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, services] = await Promise.all([getClinicSettings(), getActiveServices()]);

  /**
   * LocalBusiness structured data. This is how Rosa turns up for
   * "podóloga <ciudad>" — the main reason the site is server-rendered at all.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: settings.clinic_name,
    medicalSpecialty: "Podiatric",
    ...(settings.address && { address: { "@type": "PostalAddress", streetAddress: settings.address } }),
    ...(settings.phone && { telephone: settings.phone }),
    areaServed: "AR",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Cuidamos tus pies,
          <br />
          <span className="text-accent">sin vueltas.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Consultorio de podología. Sacá tu turno online en menos de un minuto: sin llamar, sin
          esperar, y sin crear ninguna cuenta.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/turnos"
            className="rounded-lg bg-accent px-6 py-3.5 text-[1.05rem] font-medium text-white hover:bg-accent-hover"
          >
            Sacar un turno
          </Link>
          {settings.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="rounded-lg border border-border bg-surface px-6 py-3.5 text-[1.05rem] hover:border-accent"
            >
              Llamar al consultorio
            </a>
          )}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="text-2xl font-semibold tracking-tight">Tratamientos</h2>

          <ul className="mt-6 space-y-4">
            {services.map((service) => {
              const price = formatPrice(service.price);
              return (
                <li
                  key={service.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border pb-4 last:border-0"
                >
                  <div>
                    <p className="text-[1.05rem] font-medium">{service.name}</p>
                    {service.description && (
                      <p className="mt-0.5 text-[0.95rem] text-muted">{service.description}</p>
                    )}
                  </div>
                  <p className="tabular-nums text-muted">{price ?? "Consultar"}</p>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 text-sm text-muted">
            Todos los turnos duran {settings.slot_minutes} minutos.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Cómo funciona</h2>
        <ol className="mt-5 space-y-3 text-[1.05rem]">
          <li className="flex gap-3">
            <span className="font-semibold text-accent">1.</span>
            Elegís el día y el horario que te queden cómodos.
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-accent">2.</span>
            Dejás tu nombre y un teléfono. Nada más.
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-accent">3.</span>
            Te llega la confirmación y, si no podés venir, cancelás con un clic.
          </li>
        </ol>
      </section>
    </>
  );
}
