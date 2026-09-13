/**
 * ¿Se pisan dos franjas horarias del mismo día?
 *
 * Vive acá y no adentro de la acción porque la parte que puede salir mal es
 * pura, y así se puede probar sin base de datos.
 *
 * LA TRAMPA
 *
 *   Postgres devuelve "08:00:00" y el formulario manda "08:00". Comparadas como
 *   texto sin recortar, `"12:00" < "12:00:00"` da VERDADERO —es un prefijo— y
 *   dos franjas que apenas se tocan pasarían por superpuestas. Por eso las dos
 *   puntas se normalizan a "HH:MM" antes de comparar.
 *
 * Media abierta, igual que el motor de horarios: una franja que termina 12:00 y
 * otra que empieza 12:00 no se pisan.
 */
export function shiftsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const hhmm = (value: string) => value.slice(0, 5);
  return hhmm(aStart) < hhmm(bEnd) && hhmm(aEnd) > hhmm(bStart);
}
