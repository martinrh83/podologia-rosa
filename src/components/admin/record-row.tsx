/**
 * Una ficha de una lista del panel: una profesional, una sede, un precio.
 *
 * Es un renglón de la hoja y no una tarjeta blanca: con una tarjeta por ficha,
 * cada pantalla tenía cuatro o cinco planos blancos con campos blancos adentro.
 * Ahora lo blanco son sólo los campos, y las fichas se separan con el renglón.
 *
 * La lista es sólo de lo que está en uso. Lo dado de baja va aparte, en
 * `InactiveList`.
 */
export function RecordList({ children }: { children: React.ReactNode }) {
  // Cada renglón lleva su raya arriba y el primero no: las rayas separan una
  // ficha de la otra, nunca cierran. Debajo del título ya está su raya doble,
  // y al final lo que sigue —lo dado de baja, el alta— trae la suya. Con rayas
  // abajo se juntaban tres en pocos centímetros.
  return <ul className="[&>li:first-child]:border-t-0 [&>li:first-child]:pt-0">{children}</ul>;
}

export function RecordRow({
  title,
  meta,
  action,
  heading: Heading = "h2",
  children,
}: {
  title: string;
  /** `h3` cuando la lista va agrupada bajo un `h2`, como los precios por especialidad. */
  heading?: "h2" | "h3";
  meta?: React.ReactNode;
  /** Dar de baja u ocultar. Va a la derecha del nombre. */
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <li className="border-t border-border py-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
        <div className="min-w-0">
          <Heading className="text-[1.3rem] font-bold leading-tight tracking-[-0.01em]">
            {title}
          </Heading>
          {meta && <p className="mt-1 text-[0.95rem] text-muted">{meta}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {children && <div className="mt-5">{children}</div>}
    </li>
  );
}

/**
 * Lo dado de baja, plegado al final de la lista.
 *
 * NO SE BORRA, PERO TAMPOCO ESTORBA
 *
 *   Una profesional que se fue, una sede cerrada o un tratamiento que ya no se
 *   hace no se borran: los turnos pasados apuntan a ellos, y el historial tiene
 *   que quedar entero. Pero mezclados con lo activo, y con sus campos para
 *   editar, se iban acumulando entre lo que sí se usa todos los días.
 *
 *   Acá quedan fuera del camino y a un toque: un `<details>` cerrado que dice
 *   cuántos hay, y adentro un renglón por cada uno, con el nombre y la forma de
 *   volver. Sin campos: no hay nada que editar en algo que no está en uso. Si
 *   se reactiva, vuelve arriba con sus campos, igual que estaba.
 *
 * Con el mismo `<details>` y la misma cruz que las preguntas frecuentes. Si no
 * hay nada dado de baja, no se muestra. Lleva una sola raya, arriba, como un
 * renglón más de la lista: abajo la cierra lo que venga después.
 */
export function InactiveList({
  label,
  count,
  children,
}: {
  /** «De baja», «Ocultos». */
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;

  return (
    <details className="group border-t border-border">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-3 text-[1.05rem] font-bold transition-colors hover:text-accent">
        <span>
          {label} <span className="font-normal tabular-nums text-muted">({count})</span>
        </span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="size-5 shrink-0 text-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-45 motion-reduce:transition-none"
        >
          <path d="M10 2.5v15M2.5 10h15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
        </svg>
      </summary>
      <ul>{children}</ul>
    </details>
  );
}

/** Un renglón de lo dado de baja: el nombre, un dato para reconocerlo y cómo volver. */
export function InactiveRow({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-6 border-t border-border py-2">
      <p className="min-w-0 py-1.5">
        <span className="font-bold">{title}</span>
        {meta && <span className="text-[0.95rem] text-muted"> · {meta}</span>}
      </p>
      <div className="shrink-0">{action}</div>
    </li>
  );
}
