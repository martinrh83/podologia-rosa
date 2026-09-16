import Link from "next/link";

import type { ScheduleRow } from "@/components/home/directions";
import type { ClinicSettings, Location } from "@/lib/db/types";
import { whatsappLink } from "@/lib/format";
import { summarizeWeek } from "@/lib/week-summary";

/**
 * La promesa a la izquierda, la ficha práctica a la derecha.
 *
 * La ficha contesta lo que alguien se pregunta antes de reservar —¿me queda
 * cerca?, ¿cuándo atienden?, ¿me cubre la obra social?— y es UN bloque con
 * filas, no tarjetas sueltas: tres datos cortos en tres cajas competirían con
 * "Sacar turno", que es lo único que tiene que ganar la mirada.
 *
 * Dirección y días salen de la base, igual que en "Cómo llegar": las dos
 * muestran el mismo dato en la misma página y no pueden contradecirse. Las
 * obras sociales van fijas porque no hay dónde cargarlas en el panel — y con
 * nombre: "trabajamos con obras sociales" a secas le promete cobertura a
 * alguien de una que no se atiende.
 *
 * Los días van como resumen de la semana y no como "hoy atendemos": acá se
 * reserva para otro día, y un dato que no depende de la fecha no envejece con
 * el `revalidate` de la página.
 */
export function Hero({
  settings,
  locations,
  schedule,
}: {
  settings: ClinicSettings;
  locations: Location[];
  schedule: ScheduleRow[];
}) {
  const week = summarizeWeek(schedule);

  return (
    <section className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-14">
      <div>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Cuidamos tus pies,
          <br />
          <span className="text-accent">sin vueltas.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Consultorio de podología. Sacá tu turno online en menos de un minuto: sin llamar, sin
          esperar, y sin crear ninguna cuenta.
        </p>

        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          <Link
            href="/turnos"
            className="rounded-lg bg-accent px-6 py-3.5 text-center text-[1.05rem] font-medium text-white hover:bg-accent-hover"
          >
            Sacar turno
          </Link>
          {settings.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="rounded-lg border border-border bg-surface px-6 py-3.5 text-center text-[1.05rem] hover:border-accent"
            >
              Llamar al consultorio
            </a>
          )}
          {settings.whatsapp && (
            <a
              href={whatsappLink(
                settings.whatsapp,
                `Hola! Quería consultar por un turno en ${settings.clinic_name}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border bg-surface px-6 py-3.5 text-center text-[1.05rem] hover:border-accent"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {/*
        Filas apiladas en el teléfono, tres columnas en tablet —apiladas ocupaban
        media pantalla para tres datos cortos— y de nuevo filas cuando pasa a
        ser la columna de la derecha.
      */}
      <dl className="grid divide-y divide-border rounded-xl border border-border bg-surface sm:auto-cols-fr sm:grid-flow-col sm:divide-x sm:divide-y-0 lg:grid-flow-row lg:divide-x-0 lg:divide-y">
        {locations.length > 0 && (
          <div className="px-5 py-4">
            <dt className="text-sm text-muted">Dónde</dt>
            {locations.length === 1 ? (
              <dd className="mt-1">
                {/* "En pleno centro" es de ESTA sede: con una segunda, dejaría de ser cierto. */}
                <p className="text-[1.05rem] font-medium">En pleno centro de Salta Capital</p>
                <p className="mt-0.5 text-muted">{locations[0].address}</p>
              </dd>
            ) : (
              locations.map((location) => (
                <dd key={location.id} className="mt-1">
                  <p className="text-[1.05rem] font-medium">{location.name}</p>
                  <p className="mt-0.5 text-muted">{location.address}</p>
                </dd>
              ))
            )}
          </div>
        )}

        {week && (
          <div className="px-5 py-4">
            <dt className="text-sm text-muted">Cuándo</dt>
            <dd className="mt-1">
              <p className="text-[1.05rem] font-medium">{week.days}</p>
              {week.hours ? (
                <p className="mt-0.5 text-muted">{week.hours}</p>
              ) : (
                <a href="#directions" className="mt-0.5 inline-block text-accent underline">
                  Ver horarios
                </a>
              )}
            </dd>
          </div>
        )}

        <div className="px-5 py-4">
          <dt className="text-sm text-muted">Obras sociales</dt>
          <dd className="mt-1 text-[1.05rem] font-medium">IPS y OSUNSa</dd>
        </div>
      </dl>
    </section>
  );
}
