import { Notice } from "@/components/notice";
import type { ActionState } from "@/lib/forms";

/**
 * El error del formulario entero: el que no es de ningún campo.
 *
 * La red que se cortó, la base que no respondió, la contraseña que no coincide.
 * Va siempre en el mismo lugar, arriba del botón que lo produjo, y con el
 * mismo aviso en todo el sitio. Los errores de un campo van en el campo.
 */
export function FormAlert({ state }: { state?: ActionState }) {
  if (state?.status !== "error" || !state.message) return null;
  return <Notice tone="danger" title={state.message} />;
}
