import { toast } from "sonner";

import type { ActionState } from "@/lib/forms";

type Action = (previous: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Envuelve una acción para que, si sale bien, lo confirme con un toast.
 *
 * El toast sale cuando vuelve la respuesta, no en el render que viene después,
 * a propósito: al cancelar un turno o dar de baja a alguien, la misma respuesta
 * trae la página nueva, el renglón desaparece, y un componente que esperara a
 * volver a renderizarse ya no estaría ahí para avisar.
 *
 * El texto dice qué cambió («Sede Centro guardada.»), así que puede armarse con
 * lo que se mandó. Sólo los éxitos: los errores van en el campo o en el aviso
 * arriba del botón, donde se arreglan y no desaparecen solos.
 */
export function withToast(action: Action, message: string | ((formData: FormData) => string)) {
  return async (previous: ActionState, formData: FormData) => {
    const result = await action(previous, formData);
    if (result.status === "saved") {
      toast.success(typeof message === "function" ? message(formData) : message);
    }
    return result;
  };
}

/** Lo que se mandó en un campo, sin espacios de más. */
export function sent(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}
