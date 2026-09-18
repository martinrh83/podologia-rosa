"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth";
import { createBooking } from "@/lib/booking";
import { adminBookingSchema } from "@/lib/booking-schema";
import { setAppointmentStatus } from "@/lib/db/appointments";
import type { Appointment } from "@/lib/db/types";
import { formError, MESSAGES, parseForm, SAVED, type ActionState } from "@/lib/forms";

const ALLOWED: Appointment["status"][] = ["booked", "cancelled", "completed", "no_show"];

/** Change a turno's status from the admin. Re-verifies the session every time. */
export async function updateStatus(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as Appointment["status"];

  if (!id || !ALLOWED.includes(status)) return formError(MESSAGES.notFound("el turno"));

  try {
    await setAppointmentStatus(id, status);
  } catch {
    return formError(MESSAGES.saveFailed("el cambio"));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/manana");
  revalidatePath("/turnos");
  return SAVED;
}

/**
 * Rosa entering a turno taken by phone or at the door.
 *
 * Goes through the same createBooking path as the public form — same table, same
 * unique index — so an online visitor immediately stops seeing that slot. That
 * shared path is the whole point: a separate admin write is how a booking system
 * ends up double-booking its own practitioner.
 *
 * `audience: "admin"` lifts the 15-day horizon and the per-contact cap, which is
 * what makes "te espero en un mes" work.
 */
export async function createAdminBooking(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const practitionerId = String(formData.get("practitionerId") ?? "");
  const fecha = String(formData.get("fecha") ?? "");

  // El schema del panel: las mismas reglas que la reserva pública, con los
  // mensajes dichos por la recepción («Ingresá el nombre», no «tu nombre»).
  const parsed = parseForm(adminBookingSchema, {
    practitionerId,
    startsAt: String(formData.get("startsAt") ?? ""),
    patientFirstName: String(formData.get("patientFirstName") ?? ""),
    patientLastName: String(formData.get("patientLastName") ?? ""),
    patientDni: String(formData.get("patientDni") ?? ""),
    patientCoverage: String(formData.get("patientCoverage") ?? "particular"),
    patientPhone: String(formData.get("patientPhone") ?? ""),
    motivo: String(formData.get("motivo") ?? ""),
    consent: true,
  });

  // Un error vuelve como estado y no como redirección: antes volvía a la
  // página con el mensaje en la URL y el formulario vacío, y con el paciente
  // esperando del otro lado del mostrador había que tipear todo de nuevo.
  if (!parsed.ok) return parsed.state;

  const result = await createBooking(parsed.data, { audience: "admin" });

  if (!result.ok) {
    // Que el horario se haya ocupado es un problema del horario, no del
    // formulario: se marca en la grilla, donde hay que elegir otro.
    if (result.reason === "slot_taken" || result.reason === "slot_unavailable") {
      return { status: "error", fieldErrors: { startsAt: result.message } };
    }
    return formError(result.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/manana");
  revalidatePath("/turnos");

  // De vuelta al mismo profesional y al mismo día, con el aviso de que quedó:
  // el turno puede ser para dentro de un mes y en «Hoy» no aparecería. Va la
  // hora y no el paciente: un nombre en la URL queda en el historial.
  const params = new URLSearchParams({ guardado: parsed.data.startsAt });
  if (practitionerId) params.set("profesional", practitionerId);
  if (fecha) params.set("fecha", fecha);
  redirect(`/admin/nuevo?${params}`);
}
