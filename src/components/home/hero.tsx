import Link from "next/link";

import type { ScheduleRow } from "@/components/home/directions";
import { Address } from "@/components/home/address";
import { Stamp } from "@/components/home/stamp";
import { Logo } from "@/components/logo";
import type { ClinicSettings, Location, PractitionerWithSpecialty } from "@/lib/db/types";
import { whatsappLink } from "@/lib/format";
import { summarizeWeek } from "@/lib/week-summary";

/**
 * La promesa a la izquierda; a la derecha, la tarjetita de turno ya casi
 * completa.
 *
 * LA TARJETA NO ES UN DIBUJO: ES LA FICHA
 *
 *   Contesta lo que alguien se pregunta antes de reservar —con quién, qué días,
 *   a qué hora, dónde, si le toman la obra social— y lo contesta con datos de la
 *   base, escritos en birome sobre los renglones. Lo único que le falta a la
 *   tarjeta es el día y la hora exactos, que es justo lo que se elige al tocar
 *   "Sacar turno".
 *
 *   Es una lista de definición de verdad: los rótulos impresos son `dt` y lo
 *   escrito a mano es `dd`. El sello es decorativo; lo que dice ya está en la
 *   bajada.
 *
 * Dónde y obras sociales van en el talón, del otro lado del troquel: son los
 * datos que uno se guarda. Las obras sociales van fijas y con nombre porque no
 * hay dónde cargarlas en el panel, y "trabajamos con obras sociales" a secas le
 * promete cobertura a alguien de una que no se atiende.
 *
 * Los días van como resumen de la semana y no como "hoy atendemos": acá se
 * reserva para otro día, y un dato que no depende de la fecha no envejece con
 * el `revalidate` de la página.
 */
export function Hero({
  settings,
  locations,
  schedule,
  practitioners,
}: {
  settings: ClinicSettings;
  locations: Location[];
  schedule: ScheduleRow[];
  practitioners: PractitionerWithSpecialty[];
}) {
  const week = summarizeWeek(schedule);
  const who = whoAttends(practitioners);
  const hasBothContacts = Boolean(settings.phone && settings.whatsapp);
  const secondaryButton = `border-2 border-foreground px-5 py-3.5 text-center text-[1.05rem] font-bold transition-[background-color,transform] duration-100 hover:bg-surface active:translate-y-0.5 active:scale-[0.985] ${
    hasBothContacts ? "" : "col-span-2"
  }`;

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:gap-10 xl:grid-cols-[minmax(0,1fr)_28rem] xl:gap-16 lg:pb-24 lg:pt-20">
      <div>
        {/*
          Impreso lo primero, escrito a mano lo segundo: "sin vueltas." es lo
          que alguien le agregó en birome a la tarjeta. Dos líneas siempre, así
          la mano no queda colgando en una línea sola con media frase impresa.
        */}
        <h1 className="font-wide text-[length:clamp(2.35rem,10.5vw,5.5rem)] lg:text-[length:clamp(3.5rem,6.2vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em] [text-wrap:balance]">
          <span className="block">Cuidamos tus pies,</span>
          <span className="mt-1 block -rotate-2 font-hand text-[1.12em] font-bold leading-[1] tracking-normal text-birome [font-variation-settings:normal] sm:mt-2">
            sin vueltas.
          </span>
        </h1>

        <p className="mt-7 max-w-[40ch] text-[1.15rem] leading-relaxed sm:text-[1.3rem]">
          Consultorio de podología en Salta. Sacá tu turno online en menos de un minuto: sin
          llamar, sin esperar y sin crear ninguna cuenta.
        </p>

        {/*
          En el teléfono, "Sacar turno" ocupa todo el ancho y las dos
          alternativas van lado a lado. Si sólo hay una, ocupa el ancho entero.
        */}
        <div className="mt-9 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <Link
            href="/turnos"
            className="col-span-2 border-2 border-accent bg-accent px-7 py-3.5 text-center text-[1.15rem] font-bold text-white transition-[background-color,transform] duration-100 hover:border-accent-hover hover:bg-accent-hover active:translate-y-0.5 active:scale-[0.985]"
          >
            Sacar turno
          </Link>
          {settings.phone && (
            <a href={`tel:${settings.phone}`} className={secondaryButton}>
              {/* Corto en el teléfono y en la columna angosta del hero de 1024 a 1280, donde el largo mandaba WhatsApp a otra fila. */}
              <span className="sm:hidden lg:inline xl:hidden">Llamar</span>
              <span className="hidden sm:inline lg:hidden xl:inline">Llamar al consultorio</span>
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
              className={secondaryButton}
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>

      <TurnoCard week={week} who={who} locations={locations} />
    </section>
  );
}

function TurnoCard({
  week,
  who,
  locations,
}: {
  week: ReturnType<typeof summarizeWeek>;
  who: string | null;
  locations: Location[];
}) {
  return (
    // Apoyada sobre el mostrador: apenas girada y con la sombra corta de una
    // cartulina, que es la única sombra del sitio.
    <div className="relative mx-auto w-full max-w-[28rem] -rotate-1 bg-surface shadow-[0_1px_1px_rgb(25_29_39/0.08),0_14px_28px_-12px_rgb(25_29_39/0.35)] lg:-rotate-2">
      <div className="px-5 pb-5 pt-4 sm:px-7 sm:pt-5">
        <div className="flex items-center justify-between gap-4 border-b-[5px] border-double border-foreground pb-3">
          <p className="flex items-center gap-2 font-narrow text-[1.05rem] font-extrabold uppercase tracking-[0.06em]">
            <Logo className="h-6 w-auto text-accent" />
            Podología Mitre
          </p>
          <p className="font-narrow text-sm font-bold uppercase tracking-[0.12em] text-numerador">
            Turno
          </p>
        </div>

        <dl className="mt-2">
          {who && <CardLine label="Con">{who}</CardLine>}
          {week && (
            <>
              <CardLine label="Días">{week.days}</CardLine>
              <CardLine label="Horario">{week.hours}</CardLine>
            </>
          )}
          {/* El renglón que falta es lo que se elige online. */}
          <div className="flex items-end gap-3 border-b border-border pb-1 pt-4">
            <dt className="shrink-0 font-narrow text-sm font-semibold uppercase tracking-[0.1em] text-muted">
              Día y hora
            </dt>
            <dd className="min-h-[2.1rem] flex-1 text-right font-hand text-[1.05rem] leading-[2.1rem] text-muted">
              los elegís vos
            </dd>
          </div>
        </dl>
      </div>

      {/* El troquel, con las muescas de los costados en el color de la cartulina. */}
      <div aria-hidden className="relative h-5">
        <div className="perforado absolute inset-x-4 top-1/2 h-1.5 -translate-y-1/2" />
        <span className="absolute -left-2.5 top-0 size-5 rounded-full bg-background" />
        <span className="absolute -right-2.5 top-0 size-5 rounded-full bg-background" />
      </div>

      {/*
        Abajo del talón queda lugar libre para el sello donde la tarjeta es
        angosta (el teléfono, y la columna de 25rem entre 1024 y 1280): ahí, al
        lado de los datos, taparía las sedes o la obra social.
      */}
      <dl className="grid gap-4 px-5 pb-24 pt-2 sm:px-7 sm:pb-6 sm:pr-44 lg:pb-24 lg:pr-7 xl:pb-6 xl:pr-44">
        {locations.length > 0 && (
          <div>
            <dt className="font-narrow text-sm font-semibold uppercase tracking-[0.1em] text-muted">
              {locations.length === 1 ? "Dónde" : "Sedes"}
            </dt>
            {locations.map((location) => (
              <dd key={location.id} className="mt-1 text-[1.05rem] leading-snug">
                {locations.length > 1 && <span className="font-bold">{location.name}: </span>}
                <Address address={location.address} />
              </dd>
            ))}
          </div>
        )}
        <div>
          <dt className="font-narrow text-sm font-semibold uppercase tracking-[0.1em] text-muted">
            Obras sociales
          </dt>
          <dd className="mt-1 text-[1.05rem] font-bold">IPS y OSUNSa</dd>
        </div>
      </dl>

      <Stamp
        press
        tilt={-9}
        className="pointer-events-none absolute bottom-5 right-4 sm:bottom-7 sm:right-3"
      >
        <span aria-hidden className="block text-[1.35rem] font-black tracking-[0.04em]">
          Turno online
        </span>
        <span aria-hidden className="block text-[0.72rem] font-bold tracking-[0.14em]">
          Sin llamar · sin cuenta
        </span>
      </Stamp>
    </div>
  );
}

function CardLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-3 border-b border-border pb-1 pt-4">
      <dt className="shrink-0 font-narrow text-sm font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-right font-hand text-[1.45rem] font-bold leading-[2.1rem] text-birome">
        {children}
      </dd>
    </div>
  );
}

/**
 * "Rosa o Bea": con quién te podés atender, por nombre de pila. Con más de tres
 * la línea no entra en el renglón, y se dice sin nombres.
 */
function whoAttends(practitioners: PractitionerWithSpecialty[]): string | null {
  const names = practitioners.map((practitioner) => practitioner.first_name);
  if (names.length === 0) return null;
  if (names.length > 3) return "la que elijas";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} o ${names[names.length - 1]}`;
}
