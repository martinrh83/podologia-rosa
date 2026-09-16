import { FAQ } from "@/lib/faq";

/** Preguntas frecuentes. El contenido vive en `src/lib/faq.ts`. */
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
        <div className="mt-6 max-w-3xl divide-y divide-border border-y border-border">
          {FAQ.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.05rem] font-medium">
                {item.question}
                <span
                  aria-hidden
                  className="shrink-0 text-accent transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
