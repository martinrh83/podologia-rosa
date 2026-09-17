import { SectionHeading } from "@/components/home/section-heading";
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
 * caracteres por línea; 60ch las deja en un largo de lectura.
 *
 * La letra chica del dorso: renglones finos a tamaño de lectura, debajo del
 * encabezado impreso.
 */
export function Faq() {
  if (FAQ.length === 0) return null;

  return (
    <section id="faq" className="scroll-mt-7">
      <div aria-hidden className="perforado h-1.5" />
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20">
        <SectionHeading>Preguntas frecuentes</SectionHeading>

        {/*
          <details> y no un acordeón en JavaScript: el navegador ya sabe hacer
          esto, funciona sin hidratar, y el buscador lee el contenido igual
          aunque esté plegado.
        */}
        <div className="mt-2 border-b border-border">
          {FAQ.map((item) => (
            <details key={item.question} className="group border-t border-border first:border-t-0">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-[1.05rem] font-semibold leading-snug transition-colors hover:text-accent">
                {item.question}
                {/*
                  SVG y no un "+" de texto: el glifo medía 17 px y, rotado a
                  "×", quedaba en unos 8 px. Poca señal de que la fila se abre.
                */}
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="size-5 shrink-0 text-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-45 motion-reduce:transition-none"
                >
                  <path d="M10 2.5v15M2.5 10h15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
                </svg>
              </summary>
              <p className="-mt-1 max-w-[62ch] pb-5 leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
