"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { cancelByToken } from "@/lib/booking";
import { formError, type ActionState } from "@/lib/forms";

/** Un enlace roto o viejo. El paciente no puede recargar su camino: se le dice a quién llamar. */
const NOT_FOUND =
  "No encontramos ese turno, o ya estaba cancelado. Si necesitás ayuda, llamanos al consultorio.";

/**
 * Release a turno.
 *
 * Deliberately a POST-only action rather than something that runs on page load:
 * link previewers routinely prefetch URLs, and a GET-triggered cancellation
 * would quietly destroy turnos nobody meant to cancel.
 *
 * Rosa is not notified — there is no email. She sees the freed slot in the
 * admin, which for a clinic this size is soon enough.
 */
export async function cancelTurno(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return formError(NOT_FOUND);

  const result = await cancelByToken(token);
  if (!result.ok) return formError(NOT_FOUND);

  revalidatePath("/turnos");
  revalidatePath("/admin");

  /*
    La página se vuelve a renderizar en el servidor apenas termina la acción, y
    para entonces el turno ya está cancelado: sin esta marca el paciente cae en
    "este turno ya no está activo", que es lo que ve alguien que abre un enlace
    viejo, no un acuse de lo que acaba de hacer.
  */
  redirect(`/turnos/cancelar/${token}?listo=1`);
}
