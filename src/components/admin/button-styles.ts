/**
 * Los botones del panel, con el mismo oficio que en el sitio.
 *
 * - `primary`: bloque en tinta de sello. Uno por vista: la acción que cierra la
 *   pantalla («Guardar turno», «Agregar profesional», «Recordar por WhatsApp»).
 * - `outline`: contorno de sello, que se llena al pasar el mouse. El «Guardar»
 *   de cada ficha de una lista, donde un bloque lleno por fila sería un muro.
 * - `ink`: contorno en tinta, para lo secundario (cambiar el estado de un
 *   turno, copiar un enlace).
 * - `danger`: contorno en rojo de aviso, sólo para confirmar lo que no tiene
 *   vuelta atrás. El rojo nunca es relleno de un botón.
 *
 * Todos con borde de 2px, así el relleno y el contorno miden igual, y todos se
 * hunden al apretarlos como un sello.
 *
 * Es un módulo aparte y no parte de `buttons.tsx` porque ése es de cliente, y
 * un string exportado desde un módulo de cliente le llega a un componente de
 * servidor como referencia, no como texto.
 */
export type ButtonVariant = "primary" | "outline" | "ink" | "danger";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover",
  outline: "border-accent text-accent hover:bg-accent hover:text-white",
  ink: "border-foreground text-foreground hover:bg-foreground hover:text-white",
  danger:
    "border-[color:var(--danger)] text-[color:var(--danger)] hover:bg-[color:var(--danger)] hover:text-white",
};

export function buttonClass(
  variant: ButtonVariant,
  { size = "md", block = false }: { size?: "sm" | "md"; block?: boolean } = {},
) {
  const sizing =
    size === "sm" ? "min-h-10 px-3.5 py-1.5 text-[0.95rem]" : "min-h-12 px-5 py-2.5 text-[1.05rem]";

  return [
    "inline-flex items-center justify-center border-2 text-center font-bold",
    "transition-[background-color,border-color,color,transform] duration-100",
    "active:translate-y-0.5 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-60",
    sizing,
    block ? "w-full" : "",
    VARIANT[variant],
  ].join(" ");
}

/**
 * Un enlace de texto: para lo que no merece el peso de un botón (quitar una
 * franja, dar de baja). Tinta suave subrayada en color renglón, como el
 * «Cambiar» del mostrador.
 */
export const TEXT_ACTION =
  "min-h-10 text-[0.95rem] text-muted underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground";
