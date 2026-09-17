import { Logo } from "@/components/logo";
import { Stamp } from "@/components/stamp";

/**
 * El mostrador: las piezas que comparten los tres pasos de sacar un turno, la
 * confirmación y la cancelación.
 *
 * De un lado el turno que se está armando —la misma tarjeta del home, con los
 * renglones todavía en blanco— y del otro una sola pregunta por vez. Nadie
 * tiene que acordarse de lo que eligió ni volver atrás a ciegas para mirarlo.
 *
 * Todo esto es servidor: no hay estado ni eventos. `BookingFlow` es cliente y
 * las usa igual, que es justamente la idea de tenerlas acá afuera.
 */

/** Los tres pasos del mostrador, iguales en las tres pantallas. */
export const PASOS = ["Elegir con quién", "Elegir día y horario", "Dejar tus datos"];

/** Un renglón de la tarjeta. Sin `value` queda el renglón vacío, por completar. */
export type TurnoLine = {
  label: string;
  value?: string | null;
  /** Lo que dice el renglón mientras está vacío. La tarjeta habla, no pone un guión. */
  placeholder?: string;
  /** Debajo del valor, en letra chica: la sede, el título de la profesional. */
  note?: string | null;
};

/**
 * La columna fija con la tarjeta y la pregunta al lado.
 *
 * En el teléfono no hay dos columnas: la tarjeta se reduce a una tira fija
 * arriba (`TurnoStrip`) y la pregunta ocupa la pantalla. La tira va pegada
 * debajo del encabezado del sitio, que mide 3.5rem.
 */
export function Counter({ aside, children }: { aside: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[21rem_minmax(0,1fr)] lg:gap-14 lg:pb-24">
      <div className="lg:sticky lg:top-24 lg:self-start">{aside}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * La tarjeta del turno, con sus renglones.
 *
 * Es la misma pieza que el home muestra en el hero: el paciente ya la vio, y
 * acá es la suya. Lo que eligió va escrito en birome; lo que falta, en blanco.
 */
export function TurnoCard({
  lines,
  stamp,
  children,
  className = "",
}: {
  lines: TurnoLine[];
  /** El sello que cae sobre la tarjeta cuando el turno ya está resuelto. */
  stamp?: { text: string; hint?: string; tone?: "accent" | "danger" };
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative -rotate-1 bg-surface shadow-[0_1px_1px_rgb(25_29_39/0.08),0_14px_28px_-12px_rgb(25_29_39/0.35)] ${className}`}
    >
      <div className={`px-5 pt-4 sm:px-6 sm:pt-5 ${stamp ? "pb-16" : "pb-5"}`}>
        <div className="flex items-center justify-between gap-4 border-b-[5px] border-double border-foreground pb-3">
          <p className="flex items-center gap-2 font-narrow text-[1rem] font-extrabold uppercase tracking-[0.06em]">
            <Logo className="h-5 w-auto text-accent" />
            Podología Mitre
          </p>
          <p className="font-narrow text-sm font-bold uppercase tracking-[0.12em] text-numerador">
            Turno
          </p>
        </div>

        <dl>
          {lines.map((line) => (
            <div key={line.label} className="border-b border-border pb-1.5 pt-3.5">
              {/* items-start: con un valor de dos líneas, el rótulo se queda arriba y no baja. */}
              <div className="flex items-start gap-3">
                <dt className="shrink-0 pt-1 font-narrow text-sm font-semibold uppercase tracking-[0.1em] text-muted">
                  {line.label}
                </dt>
                <dd
                  className={`min-h-[1.9rem] min-w-0 flex-1 text-right font-hand leading-[1.9rem] ${
                    line.value
                      ? "text-[1.25rem] font-bold text-birome"
                      : "text-[1rem] text-muted"
                  }`}
                >
                  {line.value ?? line.placeholder ?? "por completar"}
                </dd>
              </div>
              {line.note && (
                <p className="pt-0.5 text-right text-[0.9rem] leading-snug text-muted">{line.note}</p>
              )}
            </div>
          ))}
        </dl>

        {children}
      </div>

      {stamp && (
        <Stamp
          press
          tilt={-8}
          className={`pointer-events-none absolute bottom-3 right-4 ${
            stamp.tone === "danger" ? "text-[color:var(--danger)]" : ""
          }`}
        >
          <span className="block text-[1.2rem] font-black tracking-[0.04em]">{stamp.text}</span>
          {stamp.hint && (
            <span className="block text-[0.7rem] font-bold tracking-[0.14em]">{stamp.hint}</span>
          )}
        </Stamp>
      )}
    </div>
  );
}

/**
 * La tarjeta en el teléfono: una tira fija con lo que ya se eligió.
 *
 * La tarjeta entera ahí arriba se comería media pantalla justo cuando hay que
 * elegir un horario. Los renglones sin completar no entran: en la tira sólo va
 * lo decidido, que es lo que uno necesita tener a mano.
 */
export function TurnoStrip({
  lines,
  action,
}: {
  lines: TurnoLine[];
  /** La salida para corregir lo ya elegido, cuando la tarjeta no está a la vista. */
  action?: { label: string; onClick: () => void };
}) {
  const filled = lines.filter((line) => line.value);
  if (filled.length === 0) return null;

  return (
    <div className="sticky top-[3.4rem] z-30 -mx-4 mb-6 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
      <dl className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        {filled.map((line) => (
          <div key={line.label} className="flex items-baseline gap-2">
            <dt className="font-narrow text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted">
              {line.label}
            </dt>
            <dd className="font-hand text-[1.05rem] font-bold text-birome">{line.value}</dd>
          </div>
        ))}
      </dl>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="-my-2 shrink-0 py-2.5 text-[0.95rem] text-muted underline decoration-border underline-offset-4 active:text-foreground"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/** Lo que falta para terminar, debajo de la tarjeta. Sólo en escritorio. */
export function Pendientes({ items, current }: { items: string[]; current: number }) {
  return (
    <ol className="mt-8 hidden space-y-2 lg:block">
      {items.map((item, index) => (
        <li
          key={item}
          aria-current={index === current ? "step" : undefined}
          className={`flex gap-3 text-[0.95rem] ${
            index === current ? "font-bold text-foreground" : "text-muted"
          }`}
        >
          <span className="font-narrow tabular-nums">{index + 1}.</span>
          <span className={index < current ? "line-through decoration-muted" : ""}>{item}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * El encabezado de la pregunta.
 *
 * Sin antetítulo: el paso no va en versalitas encima del título —eso es
 * justamente lo que el sistema no hace— sino dentro de la línea de abajo, que
 * es texto que se lee, y en la lista de pendientes al costado.
 */
export function StepHeading({
  step,
  of,
  children,
  lead,
  headingRef,
  as = "h1",
}: {
  step: number;
  of: number;
  children: React.ReactNode;
  lead?: React.ReactNode;
  headingRef?: React.Ref<HTMLHeadingElement>;
  as?: "h1" | "h2";
}) {
  const Heading = as;
  return (
    <div>
      <Heading
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        className="font-wide text-[length:clamp(1.75rem,6vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.025em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        {children}
      </Heading>
      <p className="mt-3 max-w-[52ch] text-[1.1rem] leading-relaxed text-muted">
        <strong className="font-bold text-foreground">
          Paso {step} de {of}.
        </strong>{" "}
        {lead}
      </p>
    </div>
  );
}

/** Un aviso: neutro, de error o de que algo salió bien. */
export function Notice({
  tone,
  title,
  children,
}: {
  tone: "muted" | "danger" | "success";
  title: string;
  children?: React.ReactNode;
}) {
  const toneClass = {
    muted: "border-border bg-surface-muted",
    danger: "border-[color:var(--danger)] bg-[color:var(--danger)]/5",
    success: "border-[color:var(--success)] bg-[color:var(--success)]/5",
  }[tone];

  return (
    <div role="status" className={`border-2 p-5 ${toneClass}`}>
      <p className="text-[1.15rem] font-bold">{title}</p>
      {children && <div className="mt-1.5 leading-relaxed text-muted">{children}</div>}
    </div>
  );
}
