import Link from "next/link";

import { practitionerName } from "@/lib/db/practitioners";
import type { PractitionerWithSpecialty } from "@/lib/db/types";

type Props = {
  practitioners: PractitionerWithSpecialty[];
  /** El id elegido, o null para "todas". */
  selected: string | null;
  /** La ruta sobre la que se arma el link: /admin, /admin/manana. */
  basePath: string;
  /**
   * Si se ofrece "Todas". En la agenda no: los horarios son de una persona, y
   * editar "los de todas a la vez" no significa nada.
   */
  allowAll?: boolean;
};

/**
 * Filtro por profesional de las pantallas del día.
 *
 * Links y no un `<select>`: cada filtro es una URL que se puede compartir y a la
 * que el navegador vuelve con el botón de atrás, y no necesita una gota de
 * JavaScript en el cliente.
 *
 * Con un solo profesional no se muestra: un filtro con una sola opción es ruido.
 */
export function PractitionerFilter({
  practitioners,
  selected,
  basePath,
  allowAll = true,
}: Props) {
  if (practitioners.length < 2) return null;

  const options = [
    ...(allowAll ? [{ id: null as string | null, label: "Todas" }] : []),
    ...practitioners.map((row) => ({ id: row.id as string | null, label: practitionerName(row) })),
  ];

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = option.id === selected;
        return (
          <Link
            key={option.id ?? "todas"}
            href={option.id ? `${basePath}?profesional=${option.id}` : basePath}
            aria-current={isSelected ? "page" : undefined}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              isSelected
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface hover:border-accent"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
