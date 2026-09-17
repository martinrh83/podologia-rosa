import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Counter, TurnoCard, type TurnoLine } from "@/components/booking/counter";
import { CancelForm } from "@/components/cancel-form";
import { getClinicSettings } from "@/lib/availability";
import { listActiveLocations } from "@/lib/db/locations";
import { getByToken } from "@/lib/booking";
import { getPractitionerById, practitionerName } from "@/lib/db/practitioners";
import { capitalizeFirst, formatCardDay, formatTime } from "@/lib/format";

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
export default async function CancelarPage({
  params,
  searchParams,
}: PageProps<"/turnos/cancelar/[token]">) {
  const { token } = await params;
  // `listo` la pone la acción de cancelar al volver: distingue al que acaba de
  // cancelar del que abre un enlace viejo.
  const { listo } = await searchParams;

  const [appointment, settings, locations] = await Promise.all([
    getByToken(token),
    getClinicSettings(),
    listActiveLocations(),
  ]);

  if (!appointment) notFound();

  const practitioner = appointment.practitioner_id
    ? await getPractitionerById(appointment.practitioner_id)
    : null;

  const isPast = new Date(appointment.starts_at) < new Date();
  const alreadyCancelled = appointment.status === "cancelled";

  // Once there is nothing left to cancel, the token stops being a key and
  // becomes just a string in someone's browser history or an old WhatsApp
  // message. Showing the patient's name forever after that serves no one, so
  // spent links reveal nothing.
  const spent = isPast || alreadyCancelled;

  if (spent) {
    const justCancelled = listo === "1" && alreadyCancelled;

    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-wide text-[length:clamp(1.75rem,6vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">
          {justCancelled ? "Listo, cancelamos tu turno" : "Este turno ya no está activo"}
        </h1>
        <p className="mt-4 text-[1.15rem] leading-relaxed text-muted">
          {justCancelled
            ? "Gracias por avisar: el horario ya quedó libre para otra persona. Si más adelante querés volver, sacás uno nuevo cuando te quede cómodo."
            : `${alreadyCancelled ? "Fue cancelado." : "Ya pasó."} Si querés reservar otro, elegí un horario nuevo.`}
        </p>
        <Link
          href="/turnos"
          className="mt-8 inline-block border-2 border-accent bg-accent px-6 py-3.5 text-[1.05rem] font-bold text-white transition-[background-color,transform] duration-100 hover:border-accent-hover hover:bg-accent-hover active:translate-y-0.5"
        >
          Sacar otro turno
        </Link>
      </div>
    );
  }

  const location = locations.find((row) => row.id === appointment.location_id);
  const lines: TurnoLine[] = [
    ...(practitioner
      ? [{ label: "Con", value: practitionerName(practitioner), note: practitioner.title }]
      : []),
    {
      label: "Día y hora",
      value: `${capitalizeFirst(formatCardDay(appointment.starts_at))} · ${formatTime(appointment.starts_at)}`,
      note: location
        ? `${locations.length > 1 ? `${location.name} · ` : ""}${location.address}`
        : null,
    },
    {
      label: "A nombre de",
      value: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
    },
  ];

  return (
    <Counter aside={<TurnoCard lines={lines} />}>
      <h1 className="font-wide text-[length:clamp(1.75rem,6vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">
        Tu turno
      </h1>
      <p className="mt-4 max-w-[52ch] text-[1.15rem] leading-relaxed text-muted">
        Este es el turno que guarda el enlace. Si podés venir, no hace falta que hagas nada.
      </p>

      <CancelForm token={token} clinicPhone={settings.phone} />
    </Counter>
  );
}
