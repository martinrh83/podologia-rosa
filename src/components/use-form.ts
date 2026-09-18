import { useState } from "react";
import type { z } from "zod";

import { fieldErrorsOf, type ActionState, type FieldErrors } from "@/lib/forms";

/**
 * El comportamiento de un formulario, igual en todo el sitio.
 *
 *  - Castigar tarde: el error de un campo aparece cuando se lo da por
 *    terminado (al salir de él), no mientras se escribe. Marcar «Ingresá el
 *    nombre» cuando alguien va por la «M» de María es retarlo por no haber
 *    terminado.
 *  - Premiar temprano: una vez marcado, el campo se revalida en cada tecla, y
 *    el error se va apenas se corrige.
 *  - Al mandar se valida todo. Si algo falla no se manda, y el foco va al
 *    primer campo con error: en el teléfono, si no, el error puede quedar
 *    fuera de pantalla y parece que el botón no hizo nada.
 *  - Lo que devuelve el servidor manda: sus errores de campo se muestran en
 *    los campos, con el mismo texto que habría puesto el navegador, porque el
 *    schema es el mismo.
 *
 * Validar acá es una comodidad; el servidor vuelve a validar todo igual.
 */
export function useForm<V extends Record<string, unknown>>(
  schema: z.ZodType,
  initial: V,
  state?: ActionState,
) {
  type Field = keyof V & string;

  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});

  // Cada respuesta nueva del servidor trae sus errores, o limpia los viejos.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    setErrors((state?.fieldErrors as FieldErrors<Field> | undefined) ?? {});
  }

  function check(next: V): FieldErrors<Field> {
    const result = schema.safeParse(next);
    return result.success ? {} : fieldErrorsOf<Field>(result.error);
  }

  function set<K extends Field>(field: K, value: V[K]) {
    update({ [field]: value } as unknown as Partial<V>);
  }

  /** Cambia varios campos juntos, cuando uno arrastra a otro. */
  function update(patch: Partial<V>) {
    const next = { ...values, ...patch };
    setValues(next);
    const marked = (Object.keys(patch) as Field[]).filter((field) => errors[field]);
    if (marked.length > 0) {
      const found = check(next);
      setErrors((current) => ({
        ...current,
        ...Object.fromEntries(marked.map((field) => [field, found[field]])),
      }));
    }
  }

  function blur(field: Field) {
    setErrors((current) => ({ ...current, [field]: check(values)[field] }));
  }

  /** Para el `onSubmit` del form: frena el envío si algo no pasa. */
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const found = check(values);
    if (Object.keys(found).length === 0) return;

    event.preventDefault();
    setErrors(found);

    // El primero en el orden de la pantalla, no el primero del objeto.
    const first = Array.from(event.currentTarget.elements).find(
      (element) => (element as HTMLInputElement).name in found,
    );
    (first as HTMLElement | undefined)?.focus();
  }

  /** Vuelve a empezar: después de guardar un alta, el formulario queda vacío. */
  function reset(next: V = initial) {
    setValues(next);
    setErrors({});
  }

  /** Las props de un campo de texto: valor, cambio, salida y error. */
  function field<K extends Field>(name: K) {
    return {
      name,
      value: values[name] as string,
      error: errors[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        set(name, event.target.value as V[K]),
      onBlur: () => blur(name),
    };
  }

  return { values, errors, set, update, blur, onSubmit, reset, field };
}
