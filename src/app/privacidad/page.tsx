import type { Metadata } from "next";

import { getClinicSettings } from "@/lib/availability";

export const metadata: Metadata = {
  title: "Privacidad y datos personales",
  description: "Qué datos guardamos, para qué, por cuánto tiempo y cómo pedir que los borremos.",
};

export const dynamic = "force-dynamic";

/**
 * Privacy notice.
 *
 * The consent checkbox on the booking form links here, so this page has to
 * describe what the code actually does — the retention windows below are the
 * ones enforced by /api/cron/retencion. If those change, change this too.
 */
export default async function PrivacidadPage() {
  const settings = await getClinicSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Privacidad y datos personales
      </h1>

      <div className="mt-6 space-y-6 text-[1.05rem] leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold">Qué guardamos</h2>
          <p className="mt-2">
            Cuando sacás un turno guardamos tu nombre y apellido, tu DNI, tu obra social y tu
            teléfono. Si completás el campo <em>motivo de la consulta</em>, guardamos también ese
            texto. No pedimos email.
          </p>
          <p className="mt-2">
            El motivo de la consulta es un <strong>dato sensible</strong> según el artículo 2 de la
            Ley 25.326. Por eso el campo es opcional, te pedimos autorización expresa antes de
            guardarlo, y solo puede verlo {settings.clinic_name}.
          </p>
          <p className="mt-2">
            El DNI lo usamos únicamente para identificarte en la ficha y para facturar según tu
            obra social. Nunca sale de acá.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Para qué los usamos</h2>
          <p className="mt-2">
            Únicamente para gestionar tu turno y poder avisarte por teléfono si surge algún cambio.
            No enviamos correos, no los usamos para publicidad, no los vendemos y no los
            compartimos con terceros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Cuánto tiempo</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>El motivo de la consulta se borra automáticamente 30 días después del turno.</li>
            <li>
              Tus datos se anonimizan automáticamente a los 12 meses: queda el registro del turno,
              sin tu nombre, sin tu DNI y sin tu teléfono.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Tus derechos</h2>
          <p className="mt-2">
            Podés pedirnos en cualquier momento que te mostremos, corrijamos o borremos tus datos.
            {settings.phone && (
              <>
                {" "}
                Escribinos o llamanos al{" "}
                <a href={`tel:${settings.phone}`} className="text-accent underline">
                  {settings.phone}
                </a>
                .
              </>
            )}
          </p>
          <p className="mt-2 text-[0.95rem] text-muted">
            La Agencia de Acceso a la Información Pública es el órgano de control de la Ley 25.326 y
            atiende las denuncias de quienes vean afectados sus derechos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Cancelar un turno</h2>
          <p className="mt-2">
            Al terminar de reservar te mostramos un enlace propio para cancelar. Ese enlace es
            privado: cualquiera que lo tenga puede cancelar ese turno, así que guardalo y no lo
            compartas. Si lo perdés, llamanos y lo cancelamos nosotros.
          </p>
        </section>
      </div>
    </div>
  );
}
