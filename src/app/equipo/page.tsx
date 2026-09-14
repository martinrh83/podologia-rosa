import type { Metadata } from "next";
import Link from "next/link";

import {
  listActivePractitioners,
  practitionerName,
} from "@/lib/db/practitioners";

export async function generateMetadata(): Promise<Metadata> {
  const practitioners = await listActivePractitioners();
  const names = practitioners.map((row) => practitionerName(row));

  return {
    title: "Equipo",
    description:
      names.length > 0
        ? `Conocé a ${names.join(", ")}, que atienden en el consultorio.`
        : "Conocé a las profesionales que atienden en el consultorio.",
  };
}

/**
 * Estática, y la reconstruye el panel.
 *
 * Esto no se renderiza por visita: son datos de catálogo que sólo cambian
 * cuando alguien edita el consultorio, y cada acción que los toca ya llama a
 * `revalidatePath()` sobre esta ruta — así que dar de baja a un profesional o
 * corregir un precio se ve en el acto, sin esperar un deploy.
 *
 * El `revalidate` es la red de seguridad para lo que entra por fuera de la app
 * (una corrección a mano en Studio, un script): sin él, un cambio que no pase
 * por una acción no se vería nunca.
 */
export const revalidate = 3600;

/**
 * Quiénes atienden.
 *
 * Reemplaza a /sobre-mi, que estaba escrita en primera persona para una sola
 * podóloga. Las biografías salen de la base (`practitioners.bio`) para que cada
 * una escriba la suya desde el panel sin pedirle nada a nadie.
 */
export default async function EquipoPage() {
  const practitioners = await listActivePractitioners();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Equipo
      </h1>
      <p className="mt-3 text-lg text-muted">
        Atendemos de a una persona por vez, sin apuro y con el tiempo suficiente
        para explicarte qué está pasando.
      </p>

      <ul className="mt-8 space-y-5">
        {practitioners.map((practitioner) => (
          <li
            key={practitioner.id}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <h2 className="text-xl font-medium">
              {practitionerName(practitioner)}
            </h2>
            <p className="mt-0.5 text-[0.95rem] text-muted">
              {practitioner.title ?? practitioner.specialty?.name}
            </p>

            {practitioner.bio && (
              <p className="mt-3 leading-relaxed text-muted">
                {practitioner.bio}
              </p>
            )}

            <Link
              href={`/turnos/${practitioner.slug}`}
              className="mt-4 inline-block rounded-lg border border-accent px-4 py-2.5 font-medium text-accent hover:bg-accent hover:text-white"
            >
              Sacar un turno con {practitioner.first_name}
            </Link>
          </li>
        ))}
      </ul>

      {practitioners.length > 0 && (
        <p className="mt-8 rounded-xl border border-border bg-surface-muted p-4 text-sm text-muted">
          Las biografías y las matrículas se cargan desde el panel, en
          Profesionales.
        </p>
      )}
    </div>
  );
}
