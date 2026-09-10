import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre mí",
  description: "Conocé a Rosa y cómo trabaja en el consultorio.",
};

/**
 * Placeholder copy. Rosa should replace this with her own words, matrícula and
 * a photo of the consultorio before launch — generic filler on an "about" page
 * is worse for trust than a short honest paragraph.
 */
export default function SobreMiPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sobre mí</h1>

      <div className="mt-6 space-y-4 text-[1.05rem] leading-relaxed">
        <p>
          Soy Rosa, podóloga. Hace años que atiendo en el mismo consultorio, y en ese tiempo aprendí
          que la mayoría de los problemas de pies se resuelven mucho más fácil cuando se los mira a
          tiempo.
        </p>
        <p>
          Atiendo de a una persona por vez, sin apuro, con el tiempo suficiente para explicarte qué
          está pasando y qué podés hacer en tu casa.
        </p>
      </div>

      <p className="mt-8 rounded-xl border border-border bg-surface-muted p-4 text-sm text-muted">
        Rosa: reemplazá este texto por el tuyo, agregá tu número de matrícula y una foto del
        consultorio antes de publicar el sitio.
      </p>
    </div>
  );
}
