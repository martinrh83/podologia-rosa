import { bookingSchema, CONSENT_REQUIRED_MESSAGE } from "@/lib/booking-schema";

/**
 * Los datos que completa el paciente en el formulario.
 *
 * Es el `bookingSchema` menos `startsAt`, que no se tipea: sale del horario que
 * eligió en el paso anterior.
 */
export type PatientForm = {
  patientFirstName: string;
  patientLastName: string;
  patientDni: string;
  patientCoverage: string;
  patientPhone: string;
  motivo: string;
  consent: boolean;
};

export type FieldName = keyof PatientForm;

/**
 * Los campos en el orden en que están en pantalla.
 *
 * El orden importa: al mandar el formulario se enfoca el primero que falle, y
 * "primero" tiene que ser el de más arriba, no el que quede primero al recorrer
 * un objeto.
 */
export const FIELD_ORDER: FieldName[] = [
  "patientFirstName",
  "patientLastName",
  "patientDni",
  "patientCoverage",
  "patientPhone",
  "motivo",
  "consent",
];

export const EMPTY_FORM: PatientForm = {
  patientFirstName: "",
  patientLastName: "",
  patientDni: "",
  patientCoverage: "",
  patientPhone: "",
  motivo: "",
  consent: false,
};

export type FieldErrors = Partial<Record<FieldName, string>>;

/**
 * Valida un campo con la misma regla que aplica el servidor.
 *
 * Acá está el punto de todo esto: las reglas no se reescriben para el cliente,
 * se leen del mismo `bookingSchema`. Si alguien mañana cambia el DNI a nueve
 * dígitos, no hay una segunda copia que se pueda quedar vieja.
 *
 * Validar de este lado es una comodidad, nunca la defensa: el servidor vuelve a
 * validar todo igual, y es el único que decide.
 */
export function validateField(field: FieldName, form: PatientForm): string | null {
  if (field === "consent") {
    return form.consent ? null : CONSENT_REQUIRED_MESSAGE;
  }

  const result = bookingSchema.shape[field].safeParse(form[field]);
  return result.success ? null : (result.error.issues[0]?.message ?? "Revisá este dato");
}

/** Valida el formulario entero. Se usa al mandarlo. */
export function validateForm(form: PatientForm): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of FIELD_ORDER) {
    const message = validateField(field, form);
    if (message) errors[field] = message;
  }

  return errors;
}

/** El campo de más arriba que tenga error, para mandarle el foco. */
export function firstInvalidField(errors: FieldErrors): FieldName | null {
  return FIELD_ORDER.find((field) => errors[field]) ?? null;
}
