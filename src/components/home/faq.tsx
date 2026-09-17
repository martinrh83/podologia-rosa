import { FAQ } from "@/lib/faq";

/**
 * Preguntas frecuentes. El contenido vive en `src/lib/faq.ts`.
 *
 * En escritorio, el título a la izquierda y las preguntas a la derecha, en las
 * mismas dos columnas que Profesionales y Cómo llegar. Con un ancho máximo sobre
 * la lista terminaba a mitad de la sección, sin coincidir con ningún borde del
 * resto del home; en su columna las respuestas ya quedan en ~65 caracteres por
 * línea. Recién desde `lg`: entre 640 y 1024 px la columna de las respuestas
 * quedaba en unos 300 px.
 */
export function Faq() {
  if (FAQ.length === 0) return null;

  return (
    <section id="faq" className="scroll-mt-20">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-14 lg:grid-cols-2">
        <h2 className="text-2xl font-semibold tracking-tight">Preguntas frecuentes</h2>

        {/*
          <details> y no un acordeón en JavaScript: el navegador ya sabe hacer
          esto, funciona sin hidratar, y el buscador lee el contenido igual
          aunque esté plegado.
        */}
        <div className="divide-y divide-border border-y border-border">
          {FAQ.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.05rem] font-medium">
                {item.question}
                {/*
                  SVG y no un "+" de texto: el glifo medía 17 px y, rotado a
                  "×", quedaba en unos 8 px. Poca señal de que la fila se abre.
                */}
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="size-5 shrink-0 text-accent transition-transform group-open:rotate-45 motion-reduce:transition-none"
                >
                  <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
