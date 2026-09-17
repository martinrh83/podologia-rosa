"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { cancelByToken } from "@/lib/booking";

export type CancelState = { status: "idle" | "cancelled" | "error"; message?: string };

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
  _previous: CancelState,
  formData: FormData,
): Promise<CancelState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { status: "error", message: "Enlace inválido." };

  const result = await cancelByToken(token);

  if (!result.ok) {
    return { status: "error", message: "No encontramos ese turno." };
  }

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
