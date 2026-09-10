"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth";
import { createBooking } from "@/lib/booking";
import { bookingSchema } from "@/lib/booking-schema";
import { setAppointmentStatus } from "@/lib/db/appointments";
import type { Appointment } from "@/lib/db/types";

const ALLOWED: Appointment["status"][] = ["booked", "cancelled", "completed", "no_show"];

/** Change a turno's status from the admin. Re-verifies the session every time. */
export async function updateStatus(formData: FormData): Promise<void> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as Appointment["status"];

  if (!id || !ALLOWED.includes(status)) return;

  await setAppointmentStatus(id, status);

  revalidatePath("/admin");
  revalidatePath("/admin/manana");
  revalidatePath("/turnos");
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
export async function createAdminBooking(formData: FormData): Promise<void> {
  await requireStaff();

  const parsed = bookingSchema.safeParse({
    startsAt: String(formData.get("startsAt") ?? ""),
    patientFirstName: String(formData.get("patientFirstName") ?? ""),
    patientLastName: String(formData.get("patientLastName") ?? ""),
    patientDni: String(formData.get("patientDni") ?? ""),
    patientCoverage: String(formData.get("patientCoverage") ?? "particular"),
    patientPhone: String(formData.get("patientPhone") ?? ""),
    motivo: String(formData.get("motivo") ?? ""),
    consent: true,
  });

  if (!parsed.success) {
    redirect(`/admin/nuevo?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const result = await createBooking(parsed.data, { audience: "admin" });

  if (!result.ok) {
    redirect(`/admin/nuevo?error=${encodeURIComponent(result.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/turnos");
  redirect("/admin?creado=1");
}
