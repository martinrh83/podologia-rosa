/**
 * El título de cada sección del home: ancho y en tinta, como el encabezado
 * impreso de un formulario, con la raya doble debajo que separa el encabezado
 * de los renglones.
 */
export function SectionHeading({
  children,
  lead,
}: {
  children: React.ReactNode;
  lead?: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="border-b-[5px] border-double border-foreground pb-4 font-wide text-[length:clamp(2rem,7vw,3.1rem)] font-extrabold leading-[1] tracking-[-0.025em]">
        {children}
      </h2>
      {lead && (
        <p className="mt-4 max-w-[52ch] text-[1.15rem] leading-relaxed text-muted sm:text-[1.2rem]">
          {lead}
        </p>
      )}
    </div>
  );
}
