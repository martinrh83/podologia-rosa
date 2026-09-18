/**
 * Una ficha de una lista del panel: una profesional, una sede, un precio.
 *
 * Es un renglón de la hoja y no una tarjeta blanca: con una tarjeta por ficha,
 * cada pantalla tenía cuatro o cinco planos blancos con campos blancos adentro.
 * Ahora lo blanco son sólo los campos, y las fichas se separan con el renglón.
 *
 * Lo dado de baja no se atenúa entero —los campos tienen que seguir leyéndose—:
 * se dice en la línea de abajo del nombre.
 */
export function RecordList({ children }: { children: React.ReactNode }) {
  // Sin raya propia arriba: la lista va justo debajo de la raya doble del
  // título, y dos rayas seguidas se leían como un renglón vacío.
  return <ul className="[&>li:first-child]:pt-0">{children}</ul>;
}

export function RecordRow({
  title,
  meta,
  inactive,
  action,
  heading: Heading = "h2",
  children,
}: {
  title: string;
  /** `h3` cuando la lista va agrupada bajo un `h2`, como los precios por especialidad. */
  heading?: "h2" | "h3";
  meta?: React.ReactNode;
  /** El motivo por el que no se ve, si está dado de baja. */
  inactive?: string;
  /** Dar de baja, volver a activar. Va a la derecha del nombre. */
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <li className="border-b border-border py-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
        <div className="min-w-0">
          <Heading
            className={`text-[1.3rem] font-bold leading-tight tracking-[-0.01em] ${
              inactive ? "text-muted line-through decoration-2" : ""
            }`}
          >
            {title}
          </Heading>
          {(meta || inactive) && (
            <p className="mt-1 text-[0.95rem] text-muted">
              {inactive && <strong className="font-bold text-foreground">{inactive}</strong>}
              {inactive && meta && " · "}
              {meta}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {children && <div className="mt-5">{children}</div>}
    </li>
  );
}
