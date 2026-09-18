/**
 * Los campos del panel.
 *
 * Son los mismos del formulario público: rótulo en versalita angosta, campo
 * blanco de 2px sobre la cartulina, esquinas vivas. Antes cada formulario del
 * panel tenía su propio `Field` —había tres— y la misma cadena de clases
 * repetida en unos treinta inputs, cada uno con su variante mínima.
 *
 * Sirven controlados o no: lo que no es propio del campo (`value`,
 * `defaultValue`, `onChange`, `required`…) pasa derecho al elemento.
 */

export const FIELD =
  "w-full border-2 border-border bg-surface px-3.5 py-3 text-[1.05rem]";

/**
 * El `<select>` nativo no respeta el alto de línea y quedaba 6px más bajo que
 * los campos de texto de al lado. Se le fija el alto que ellos ya tienen.
 */
export const SELECT = `${FIELD} h-[3.31rem]`;

const LABEL = "block font-narrow text-sm font-bold uppercase tracking-[0.1em] text-muted";

type Common = {
  label: string;
  hint?: string;
  /** Se dice en el rótulo, en redonda y minúscula, como en el sitio. */
  optional?: boolean;
  className?: string;
};

export function Label({
  htmlFor,
  optional,
  children,
}: {
  htmlFor?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={LABEL}>
      {children}
      {optional && <span className="font-normal normal-case"> (opcional)</span>}
    </label>
  );
}

/** El rótulo de un grupo de opciones. Mismo estilo que `Label`, pero `legend`. */
export function Legend({ children }: { children: React.ReactNode }) {
  return <legend className={LABEL}>{children}</legend>;
}

function Hint({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1.5 text-[0.95rem] text-muted">
      {children}
    </p>
  );
}

export function TextField({
  label,
  hint,
  optional,
  className = "",
  id,
  ...input
}: Common & { id: string } & Omit<React.ComponentProps<"input">, "id" | "className">) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <input
        id={id}
        name={id}
        aria-describedby={hintId}
        {...input}
        className={`mt-2 ${FIELD} ${input.type === "number" ? "tabular-nums" : ""}`}
      />
      {hint && hintId && <Hint id={hintId}>{hint}</Hint>}
    </div>
  );
}

export function SelectField({
  label,
  hint,
  optional,
  className = "",
  id,
  children,
  ...select
}: Common & { id: string } & Omit<React.ComponentProps<"select">, "id" | "className">) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <select id={id} name={id} aria-describedby={hintId} {...select} className={`mt-2 ${SELECT}`}>
        {children}
      </select>
      {hint && hintId && <Hint id={hintId}>{hint}</Hint>}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  optional,
  className = "",
  id,
  ...textarea
}: Common & { id: string } & Omit<React.ComponentProps<"textarea">, "id" | "className">) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <textarea
        id={id}
        name={id}
        aria-describedby={hintId}
        {...textarea}
        className={`mt-2 ${FIELD}`}
      />
      {hint && hintId && <Hint id={hintId}>{hint}</Hint>}
    </div>
  );
}

/**
 * Un precio: el campo numérico con el signo impreso adelante.
 *
 * El `$` va dentro del borde y no en el rótulo: así se lee como la cifra que
 * es, y el número queda alineado igual en todas las filas.
 */
export function MoneyField({
  label,
  className = "",
  id,
  ...input
}: Omit<Common, "hint" | "optional"> & { id: string } & Omit<
    React.ComponentProps<"input">,
    "id" | "className" | "type"
  >) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-2">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[1.05rem] text-muted"
        >
          $
        </span>
        <input
          id={id}
          name={id}
          type="number"
          min="0"
          inputMode="numeric"
          {...input}
          className={`${FIELD} pl-8 tabular-nums`}
        />
      </div>
    </div>
  );
}

/**
 * Opción única en bloques con la casilla cuadrada: la obra social.
 *
 * Igual a la del formulario público. Elegida, el borde y el texto pasan a tinta
 * de sello; la casilla se tilda en birome.
 */
export function OptionGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <Legend>{legend}</Legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex min-h-12 cursor-pointer items-center gap-3 border-2 bg-surface px-4 py-3 text-[1.05rem] font-bold transition-colors ${
              value === option.value
                ? "border-accent text-accent"
                : "border-border hover:border-accent"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              required
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="casilla"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
