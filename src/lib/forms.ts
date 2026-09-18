import { z } from "zod";

/**
 * Validación y errores de formulario, iguales en todo el sitio.
 *
 * Cada formulario —la reserva, cancelar, entrar al panel y todos los del panel—
 * tiene su schema de Zod, y el mismo schema valida en el navegador (para avisar
 * al toque) y en el servidor (que es el único que decide). Las reglas no se
 * escriben dos veces, así que no hay una copia que se pueda quedar vieja.
 *
 * CÓMO SE ESCRIBE UN MENSAJE
 *
 *   - Error de un campo: qué hacer, en voseo y sin punto final. «Ingresá el
 *     apellido», «Elegí la sede», «Ingresá un DNI válido». Va debajo del campo.
 *   - Error del formulario (no es de ningún campo: la red, la base, una
 *     contraseña que no coincide): una oración completa que dice qué pasó y qué
 *     hacer, con punto. «No pudimos guardar la sede. Probá de nuevo.» Va en un
 *     aviso arriba del botón.
 *   - El sitio le habla al paciente de «tu»; el panel habla del paciente en
 *     tercera persona, porque quien escribe es la recepción.
 *
 * Este módulo no es `server-only` a propósito: lo importan los dos lados.
 */

export type FieldErrors<F extends string = string> = Partial<Record<F, string>>;

/** El resultado de una acción, tal como lo recibe `useActionState`. */
export type ActionState<F extends string = string> = {
  status: "idle" | "saved" | "error";
  /** Error del formulario entero, o el aviso de éxito si hace falta uno propio. */
  message?: string;
  /** Errores de campos, con el mismo texto que el navegador habría mostrado. */
  fieldErrors?: FieldErrors<F>;
};

export const IDLE: ActionState = { status: "idle" };

/** Los mensajes que no son de ningún campo y se repiten en varios formularios. */
export const MESSAGES = {
  connection: "No pudimos conectarnos. Revisá tu conexión y probá de nuevo.",
  /** «No pudimos guardar la sede. Probá de nuevo.» */
  saveFailed: (what: string) => `No pudimos guardar ${what}. Probá de nuevo.`,
  /** Lo que se editaba ya no existe, o la página quedó vieja. */
  notFound: (what: string) => `No encontramos ${what}. Recargá la página.`,
  /** Cuando algo falla y no hay un campo mejor al que atribuírselo. */
  checkFields: "Revisá los datos marcados.",
} as const;

/**
 * El primer error de cada campo.
 *
 * Zod puede devolver varios por campo («muy corto» y «formato inválido»); se
 * muestra uno solo, el primero, que es el más básico.
 */
export function fieldErrorsOf<F extends string = string>(error: z.ZodError): FieldErrors<F> {
  const { fieldErrors } = z.flattenError(error);
  const first: FieldErrors<F> = {};
  for (const [field, messages] of Object.entries(fieldErrors) as [F, string[] | undefined][]) {
    if (messages?.[0]) first[field] = messages[0];
  }
  return first;
}

/**
 * Valida y devuelve los datos limpios, o el estado de error listo para mandar
 * de vuelta al formulario.
 */
export function parseForm<S extends z.ZodType>(
  schema: S,
  values: unknown,
): { ok: true; data: z.infer<S> } | { ok: false; state: ActionState } {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, state: { status: "error", fieldErrors: fieldErrorsOf(result.error) } };
}

/** Los campos de un `FormData` como texto, que es lo que esperan los schemas. */
export function formValues<K extends string>(formData: FormData, keys: readonly K[]) {
  return Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "")])) as Record<
    K,
    string
  >;
}

/** Un error del formulario entero. */
export function formError(message: string): ActionState {
  return { status: "error", message };
}

export const SAVED: ActionState = { status: "saved" };
