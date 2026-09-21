import { InlineAction } from "@/components/admin/buttons";
import type { ActionState } from "@/lib/forms";

type MoveAction = (previous: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * «Subir» y «Bajar» para un renglón de una lista ordenable del panel.
 *
 * El orden de esas listas es el que se ve en el sitio y en toda la agenda. Se
 * mueve de a un lugar: son dos o tres renglones, y uno que sube o baja se
 * sigue con la vista. El primero no tiene «Subir» ni el último «Bajar», así el
 * botón que está nunca deja de hacer algo. Con uno solo no hay nada que
 * ordenar y no aparece ninguno.
 *
 * Los avisos no dicen «primera» ni «primero»: el nombre puede ser de una
 * persona o de una sede, y no sabemos de qué género.
 */
export function MoveButtons({
  action,
  id,
  name,
  index,
  count,
}: {
  action: MoveAction;
  id: string;
  /** Cómo se lo nombra en el aviso: «Rosa Heredia», «Sede Centro». */
  name: string;
  /** Su lugar actual, desde 0. */
  index: number;
  count: number;
}) {
  if (count < 2) return null;

  return (
    <div className="flex items-center gap-x-4">
      {index > 0 && (
        <InlineAction
          action={action}
          fields={{ id, direction: "up" }}
          success={index === 1 ? `${name} pasa al primer lugar.` : `${name} sube al lugar ${index}.`}
        >
          Subir
        </InlineAction>
      )}
      {index < count - 1 && (
        <InlineAction
          action={action}
          fields={{ id, direction: "down" }}
          success={`${name} baja al lugar ${index + 2}.`}
        >
          Bajar
        </InlineAction>
      )}
    </div>
  );
}
