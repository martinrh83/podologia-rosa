import { FAQ } from "@/lib/faq";

/**
 * Preguntas frecuentes. El contenido vive en `src/lib/faq.ts`.
 *
 * El título arriba y las filas de preguntas a todo el ancho, de borde a borde
 * como el resto de las secciones. Con un ancho máximo sobre la lista, las
 * líneas terminaban a mitad de la sección sin coincidir con ningún borde del
 * home. Probamos el título en una columna a la izquierda y las preguntas a la
 * derecha: dejaba media sección vacía debajo del título.
 *
 * Lo único angosto es el texto de cada respuesta: a todo el ancho serían ~120
 * caracteres por línea. 34rem da ~75 (40rem daba 88).
 */
export function Faq() {
  if (FAQ.length === 0) return null;

  return (
    <section id="faq" className="scroll-mt-20">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">Preguntas frecuentes</h2>

        {/*
          <details> y no un acordeón en JavaScript: el navegador ya sabe hacer
          esto, funciona sin hidratar, y el buscador lee el contenido igual
          aunque esté plegado.
        */}
        <div className="mt-6 divide-y divide-border border-y border-border">
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
              <p className="mt-3 max-w-[34rem] leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
