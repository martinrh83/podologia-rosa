import { z } from "zod";

import { normalizePhone } from "@/lib/booking-schema";

/**
 * Los schemas de los formularios del panel y del ingreso.
 *
 * Los usan las acciones del servidor y los formularios del navegador, así que
 * cada regla y cada mensaje están escritos una sola vez. Cómo se escribe un
 * mensaje está en `lib/forms.ts`. La reserva pública tiene el suyo en
 * `booking-schema.ts`.
 *
 * Todo entra como texto, que es lo que manda un formulario: los números y las
 * fechas se interpretan acá.
 */

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Opcional: vacío vale, y si hay algo tiene que cumplir la regla. */
const optionalText = (max: number) =>
  z.string().trim().max(max, `No puede superar los ${max} caracteres`);

/** Un id elegido de una lista, o vacío cuando la opción es «todos». */
const optionalId = z.union([z.literal(""), z.uuid("Elegí una opción de la lista")]);

// ————— Profesionales y especialidades —————

const practitionerFields = {
  firstName: z.string().trim().min(2, "Ingresá el nombre").max(60, "Es demasiado largo"),
  lastName: z.string().trim().min(2, "Ingresá el apellido").max(60, "Es demasiado largo"),
  title: optionalText(80),
  slotMinutes: z
    .string()
    .trim()
    .min(1, "Ingresá la duración en minutos")
    .transform(Number)
    .pipe(
      z
        .number("Ingresá la duración en minutos")
        .int("Ingresá minutos enteros")
        .min(5, "Tiene que ser de 5 minutos o más")
        .max(480, "Tiene que ser de 8 horas o menos"),
    ),
};

export const newPractitionerSchema = z.object({
  ...practitionerFields,
  specialtyId: z.uuid("Elegí una especialidad"),
});

/** Editar no cambia la especialidad: el alta la fija y el slug no se toca. */
export const practitionerSchema = z.object(practitionerFields);

export const specialtySchema = z.object({
  name: z.string().trim().min(3, "Ingresá el nombre de la especialidad").max(60, "Es demasiado largo"),
});

// ————— Sedes —————

export const locationSchema = z.object({
  name: z.string().trim().min(2, "Ingresá un nombre corto, como Centro").max(40, "Es demasiado largo"),
  address: z.string().trim().min(5, "Ingresá la dirección").max(120, "Es demasiado larga"),
  mapUrl: z.union([
    z.literal(""),
    z.url({ protocol: /^https?$/, error: "Pegá un enlace que empiece con https://" }),
  ]),
});

// ————— Precios —————

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Ingresá el nombre").max(80, "Es demasiado largo"),
  // Vacío es «sin precio cargado». Si hay algo, un número positivo con hasta
  // dos decimales, que es lo que guarda la columna (numeric(12, 2)) y lo que
  // manda el campo numérico: «$ 12.000» tipeado a mano no es un número.
  price: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d+(\.\d{1,2})?$/.test(value),
      "Ingresá el precio en números, sin puntos ni signos",
    ),
});

// ————— Agenda —————

/**
 * Las horas de una franja: en punto, de 8 a 23.
 *
 * Se eligen de una lista en vez de tipearse. El campo de hora del navegador
 * obligaba a buscar entre 60 minutos y a elegir AM o PM, y el «de 8 a 12»
 * terminaba con el 12 en medianoche.
 */
export const SHIFT_HOURS = Array.from({ length: 16 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);

export const shiftSchema = z
  .object({
    practitionerId: z.uuid("Elegí de quién es la franja"),
    locationId: z.uuid("Elegí la sede"),
    weekday: z.string().regex(/^[0-6]$/, "Elegí un día de la semana"),
    startTime: z.enum(SHIFT_HOURS.slice(0, -1), "Elegí la hora de inicio"),
    endTime: z.enum(SHIFT_HOURS.slice(1), "Elegí la hora de fin"),
  })
  // La lista de «Hasta» ya ofrece sólo horas posteriores; esto cubre lo que
  // llegue al servidor por otro lado, antes de que lo rechace la base.
  .refine((shift) => shift.endTime > shift.startTime, {
    path: ["endTime"],
    error: "Tiene que ser después de la hora de inicio",
  });

export const blockSchema = z
  .object({
    practitionerId: optionalId,
    locationId: optionalId,
    from: z.string().regex(DATE_KEY, "Ingresá la fecha de inicio"),
    to: z.string().regex(DATE_KEY, "Ingresá la fecha de fin"),
    reason: optionalText(120),
  })
  // Las claves son AAAA-MM-DD, así que compararlas como texto ordena bien.
  .refine((block) => block.to >= block.from, {
    path: ["to"],
    error: "No puede ser anterior a la fecha de inicio",
  });

// ————— Consultorio —————

export const settingsSchema = z.object({
  clinicName: z.string().trim().min(2, "Ingresá el nombre del consultorio").max(80, "Es demasiado largo"),
  phone: optionalText(40),
  whatsapp: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || normalizePhone(value).length >= 10,
      "Ingresá el número con característica, como 387 555-4444",
    ),
});

// ————— Ingreso al panel —————

export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email("Ingresá un email válido")),
  password: z.string().min(1, "Ingresá la contraseña"),
});
