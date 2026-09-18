/**
 * El título de una pantalla del panel.
 *
 * El mismo encabezado ancho con raya doble del home, pero a escala fija: en una
 * herramienta el título no tiene que crecer con la ventana, tiene que estar
 * siempre en el mismo lugar y del mismo tamaño.
 */
export function PageHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="border-b-[5px] border-double border-foreground pb-3 font-wide text-[1.75rem] font-extrabold leading-[1.05] tracking-[-0.025em] [text-wrap:balance] sm:text-[2.1rem]">
        {title}
      </h1>
      {children && (
        <p className="mt-3 max-w-[52ch] text-[1.05rem] leading-relaxed text-muted">{children}</p>
      )}
    </header>
  );
}

/** El título de una parte de la pantalla: «Agregar profesional», «Días que no se atiende». */
export function SectionHeading({
  children,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <Tag className="font-wide text-[1.3rem] font-extrabold leading-tight tracking-[-0.01em]">
      {children}
    </Tag>
  );
}
