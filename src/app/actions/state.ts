/**
 * El resultado de una acción del panel, tal como lo recibe `useActionState`.
 *
 * Era un tipo por archivo —`ScheduleState`, `PractitionerState`,
 * `LocationState`, `SettingsState`— con la misma forma exacta. Uno solo deja
 * que el mismo `ActionResult` muestre la respuesta de cualquier formulario.
 *
 * Vive fuera de los archivos `"use server"` porque esos sólo pueden exportar
 * funciones async, y `IDLE` es un valor.
 */
export type ActionState = { status: "idle" | "saved" | "error"; message?: string };

export const IDLE: ActionState = { status: "idle" };
