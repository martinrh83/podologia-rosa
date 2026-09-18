import type { ActionState } from "@/lib/forms";

/**
 * El «listo» de un formulario del panel, al lado de su botón.
 *
 * Sólo el éxito: los errores de campo van en el campo y el del formulario en
 * `FormAlert`, arriba del botón, igual que en el resto del sitio.
 *
 * El párrafo está siempre, vacío mientras no pase nada: una región `aria-live`
 * tiene que existir antes de que aparezca el texto, si no el lector de pantalla
 * no anuncia nada. `hidden` lo vacía sin sacarlo del DOM: una ficha lo usa para
 * no seguir diciendo «Guardado» mientras ya se está editando otra cosa.
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
  return (
    <p aria-live="polite" className="text-[0.95rem] font-bold text-[color:var(--success)]">
      {!hidden && state.status === "saved" ? saved : ""}
    </p>
  );
}
