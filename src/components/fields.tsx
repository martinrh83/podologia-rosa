/**
 * Los campos de formulario de todo el sitio: la reserva, cancelar, el ingreso y
 * el panel.
 *
 * Rótulo en versalita angosta, campo blanco de 2px sobre la cartulina, esquinas
 * vivas. El panel tenía tres `Field` propios y la reserva otro; ahora hay uno, y
 * todos marcan los errores igual: el borde pasa a rojo de aviso y el mensaje va
 * debajo del campo, en negrita. El color nunca va solo, siempre hay texto.
 *
 * Sirven controlados o no: lo que no es propio del campo (`value`, `onChange`,
 * `onBlur`, `required`…) pasa derecho al elemento.
 */

export const FIELD = "w-full border-2 bg-surface px-3.5 py-3 text-[1.05rem]";

/**
 * El `<select>` nativo no respeta el alto de línea y quedaba 6px más bajo que
 * los campos de texto de al lado. Se le fija el alto que ellos ya tienen.
 */
export const SELECT = `${FIELD} h-[3.31rem]`;

const LABEL = "block font-narrow text-sm font-bold uppercase tracking-[0.1em] text-muted";

function border(error?: string) {
  return error ? "border-[color:var(--danger)]" : "border-border";
}

type Common = {
  label: string;
  hint?: string;
  /** Se dice en el rótulo, en redonda y minúscula. */
  optional?: boolean;
  /** El error de este campo. Vacío o ausente, no hay. */
  error?: string;
  className?: string;
};

/** Los ids que describen el campo: primero la ayuda, después el error. */
function describedBy(id: string, hint?: string) {
  return [hint ? `${id}-hint` : null, `${id}-error`].filter(Boolean).join(" ");
}

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

/**
 * El error de un campo.
 *
 * Siempre está en el DOM, aunque esté vacío: una región `aria-live` tiene que
 * existir *antes* de que aparezca el texto, si no el lector de pantalla no
 * anuncia nada. Eso cubre el caso de quien se va del campo con un error y
 * nunca lo ve.
 */
export function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p
      id={id}
      aria-live="polite"
      className={`text-[0.95rem] font-bold text-[color:var(--danger)] ${message ? "mt-1.5" : ""}`}
    >
      {message ?? ""}
    </p>
  );
}

export function TextField({
  label,
  hint,
  optional,
  error,
  className = "",
  id,
  ...input
}: Common & { id: string } & Omit<React.ComponentProps<"input">, "id" | "className">) {
  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <input
        id={id}
        name={id}
        aria-describedby={describedBy(id, hint)}
        aria-invalid={error ? true : undefined}
        {...input}
        className={`mt-2 ${FIELD} ${border(error)} ${input.type === "number" ? "tabular-nums" : ""}`}
      />
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function SelectField({
  label,
  hint,
  optional,
  error,
  className = "",
  id,
  children,
  ...select
}: Common & { id: string } & Omit<React.ComponentProps<"select">, "id" | "className">) {
  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <select
        id={id}
        name={id}
        aria-describedby={describedBy(id, hint)}
        aria-invalid={error ? true : undefined}
        {...select}
        className={`mt-2 ${SELECT} ${border(error)}`}
      >
        {children}
      </select>
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function TextArea({
  label,
  hint,
  optional,
  error,
  className = "",
  id,
  ...textarea
}: Common & { id: string } & Omit<React.ComponentProps<"textarea">, "id" | "className">) {
  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <textarea
        id={id}
        name={id}
        aria-describedby={describedBy(id, hint)}
        aria-invalid={error ? true : undefined}
        {...textarea}
        className={`mt-2 ${FIELD} ${border(error)}`}
      />
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
      <FieldError id={`${id}-error`} message={error} />
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
  error,
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
          inputMode="decimal"
          aria-describedby={`${id}-error`}
          aria-invalid={error ? true : undefined}
          {...input}
          className={`${FIELD} ${border(error)} pl-8 tabular-nums`}
        />
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/**
 * Opción única en bloques con la casilla cuadrada: la obra social.
 *
 * Elegida, el borde y el texto pasan a tinta de sello; la casilla se tilda en
 * birome. El primer radio lleva `id`: es al que se le manda el foco si hay que
 * elegir y no se eligió.
 */
export function OptionGroup<T extends string>({
  id,
  legend,
  name,
  options,
  value,
  error,
  onChange,
}: {
  id: string;
  legend: React.ReactNode;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T | "";
  error?: string;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset
      aria-describedby={`${id}-error`}
      aria-invalid={error ? true : undefined}
    >
      <Legend>{legend}</Legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {options.map((option, index) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-3 border-2 bg-surface px-4 py-3.5 text-[1.05rem] font-bold transition-colors ${
              value === option.value
                ? "border-accent text-accent"
                : error
                  ? "border-[color:var(--danger)] hover:border-accent"
                  : "border-border hover:border-accent"
            }`}
          >
            <input
              id={index === 0 ? id : undefined}
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
      <FieldError id={`${id}-error`} message={error} />
    </fieldset>
  );
}
