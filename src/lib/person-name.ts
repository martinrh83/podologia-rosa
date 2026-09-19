/**
 * Cómo se nombra a una persona en el sitio: el primer nombre y el primer
 * apellido.
 *
 * En el panel se carga el nombre completo, como figura en el documento ("Rosa
 * Beatriz", "Heredia Montaño"), porque es el dato de la persona. Pero el sitio
 * la nombra como la nombra el consultorio: "Rosa Heredia". El nombre completo
 * en la tarjeta del home, en la lista de turnos y en el recordatorio de
 * WhatsApp ocupa dos renglones y suena a formulario.
 *
 * Las excepciones son las dos pantallas donde alguien elige con quién se va a
 * atender, y quiere leer quién es: el sello de la ficha en "Profesionales" del
 * home (en dos renglones, nombres y apellidos) y la lista de /turnos.
 *
 * Los compuestos de dos palabras que se dicen juntos —"María José", "De la
 * Cruz"— quedan cortados. Se acepta: quien los tiene puede cargar el nombre
 * como quiere que se lo llame, y esto sólo elige la primera palabra.
 */

/** La primera palabra: "Rosa Beatriz" -> "Rosa". */
export function firstWord(value: string): string {
  return value.trim().split(/\s+/)[0] ?? "";
}

/** El nombre completo, como se carga en el panel: "Rosa Beatriz Heredia Montaño". */
export function fullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

/**
 * Un nombre que no entra al cuerpo de los demás: más de trece caracteres en
 * alguno de los dos campos. Es lo que entra cómodo en el sello más angosto, el
 * del teléfono, sin que la letra toque el marco.
 */
export function isLongName(person: { first_name: string; last_name: string }): boolean {
  return Math.max(person.first_name.trim().length, person.last_name.trim().length) > 13;
}

/** "Rosa Beatriz" + "Heredia Montaño" -> "Rosa Heredia". */
export function shortName(firstName: string, lastName: string): string {
  return `${firstWord(firstName)} ${firstWord(lastName)}`.trim();
}
