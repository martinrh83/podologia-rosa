import type { ActionState } from "@/app/actions/state";

/**
 * Lo que respondió la última acción de un formulario.
 *
 * El párrafo está siempre, vacío mientras no pase nada: una región `aria-live`
 * tiene que existir antes de que aparezca el texto, si no el lector de pantalla
 * no anuncia nada. Reemplaza a `FormMessage`, `Result` y la versión en línea de
 * las sedes, que eran el mismo párrafo tres veces.
 *
 * `hidden` lo vacía sin sacarlo del DOM: una ficha lo usa para no seguir
 * diciendo «Guardado» mientras ya se está editando otra cosa.
 */
export function ActionResult({
  state,
  saved,
  hidden = false,
}: {
  state: ActionState;
  saved: string;
  hidden?: boolean;
}) {
  const show = !hidden && state.status !== "idle";

  return (
    <p
      aria-live="polite"
      className={`text-[0.95rem] font-bold ${
        state.status === "error" ? "text-[color:var(--danger)]" : "text-[color:var(--success)]"
      }`}
    >
      {show ? (state.status === "error" ? state.message : saved) : ""}
    </p>
  );
}
