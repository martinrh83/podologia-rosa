/**
 * Un sello de goma: borde doble, versalitas angostas y tinta azul.
 *
 * Tinta plana, sin granito ni bordes corridos de mentira: el sello se reconoce
 * por su forma (el marco doble, el giro, las versalitas) y así el nombre que
 * lleva adentro se lee entero. `mix-blend-multiply` hace que la tinta se asiente
 * sobre lo que tiene abajo, como tinta de verdad, en vez de taparlo.
 *
 * Es HTML y no una imagen: el texto se lee, se traduce y se busca.
 *
 * `press` hace caer el sello una vez al cargar. Va sólo en el de la tarjeta del
 * hero: si cayeran todos, dejaría de ser un gesto y pasaría a ser decoración.
 */
export function Stamp({
  children,
  tilt = -6,
  press = false,
  className = "",
}: {
  children: React.ReactNode;
  /** Grados. Un sello nunca queda derecho. */
  tilt?: number;
  press?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`inline-block max-w-full text-accent mix-blend-multiply ${
        press ? "animate-[sellar_520ms_cubic-bezier(0.16,1,0.3,1)_380ms_both]" : ""
      } ${className}`}
      style={
        {
          "--sello-giro": `rotate(${tilt}deg)`,
          transform: `rotate(${tilt}deg)`,
        } as React.CSSProperties
      }
    >
      <div className="border-[3px] border-current p-[3px]">
        <div className="break-words border border-current px-3 py-1.5 text-center font-narrow uppercase leading-[1.05]">
          {children}
        </div>
      </div>
    </div>
  );
}
