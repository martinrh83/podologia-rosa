import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CancelForm } from "@/components/cancel-form";
import { getClinicSettings } from "@/lib/availability";
import { getByToken } from "@/lib/booking";
import { capitalizeFirst, formatFull } from "@/lib/format";

export const metadata: Metadata = {
  title: "Cancelar turno",
  // Nothing here should ever reach a search index: the URL is the credential.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The cancel page.
 *
 * This is what makes anonymous booking workable: the token in the URL *is* the
 * credential, which is why it is an unguessable UUID, the page is noindex, and
 * cancelling requires a POST rather than happening on page load — an email
 * client prefetching the link must not cancel someone's turno.
 */
export default async function CancelarPage({ params }: PageProps<"/turnos/cancelar/[token]">) {
  const { token } = await params;

  const [appointment, settings] = await Promise.all([getByToken(token), getClinicSettings()]);

  if (!appointment) notFound();

  const isPast = new Date(appointment.starts_at) < new Date();
  const alreadyCancelled = appointment.status === "cancelled";

  // Once there is nothing left to cancel, the token stops being a key and
  // becomes just a string in someone's browser history or an old WhatsApp
  // message. Showing the patient's name forever after that serves no one, so
  // spent links reveal nothing.
  const spent = isPast || alreadyCancelled;

  if (spent) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Este turno ya no está activo</h1>
        <p className="mt-4 text-[1.05rem] text-muted">
          {alreadyCancelled ? "Fue cancelado." : "Ya pasó."} Si querés reservar otro,{" "}
          <a href="/turnos" className="text-accent underline">
            elegí un nuevo horario
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tu turno</h1>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <p className="text-lg">{capitalizeFirst(formatFull(appointment.starts_at))}</p>
        <p className="mt-1 text-muted">A nombre de {appointment.patient_first_name} {appointment.patient_last_name}</p>
        {settings.address && <p className="mt-3 text-[0.95rem] text-muted">{settings.address}</p>}
      </div>

      <CancelForm token={token} clinicPhone={settings.phone} />
    </div>
  );
}
