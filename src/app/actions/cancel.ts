"use server";

import { revalidatePath } from "next/cache";

import { getClinicSettings } from "@/lib/availability";
import { cancelByToken } from "@/lib/booking";
import { sendStaffCancellation } from "@/lib/email";

export type CancelState = { status: "idle" | "cancelled" | "error"; message?: string };

/**
 * Release a turno.
 *
 * Deliberately a POST-only action rather than something that runs on page load:
 * email clients and link previewers routinely prefetch URLs, and a GET-triggered
 * cancellation would quietly destroy turnos nobody meant to cancel.
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

  const settings = await getClinicSettings();
  await sendStaffCancellation({ appointment: result.appointment, settings });

  revalidatePath("/turnos");

  return { status: "cancelled" };
}
