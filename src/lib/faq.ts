/**
 * Las preguntas frecuentes.
 *
 * EN EL CÓDIGO Y NO EN LA BASE, a diferencia de casi todo lo demás del sitio.
 *
 * El criterio del proyecto no es "todo editable" sino: datos operativos en la
 * base, prosa en el código. Los precios cambian con la inflación, los horarios
 * cuando Rosa reorganiza la semana, un profesional se da de alta un martes —
 * eso no puede depender de un deploy. Un FAQ es texto, igual que el titular del
 * home o la política de privacidad, que tampoco son editables y nadie lo
 * discutió.
 *
 * Además: escribir una respuesta buena es redacción, no carga de datos; y el
 * texto que pasa por un PR lo lee alguien antes de publicarse, cosa que un
 * textarea del panel no garantiza. Para un consultorio diciendo cosas sobre
 * tratamientos, eso importa.
 *
 * Se da vuelta si algún día Rosa pide cambios seguido, o si cada especialidad
 * necesita el suyo. Eso se sabe por la frecuencia real, no adivinando.
 *
 * NADA DE HORARIOS ACÁ. Los horarios salen de `weekly_schedule` y se muestran
 * en "Cómo llegar". Un texto fijo sobre datos que cambian es una mentira con
 * fecha de vencimiento.
 */
export type FaqItem = { question: string; answer: string };

export const FAQ: FaqItem[] = [
  {
    question: "¿Cómo cancelo si no puedo ir?",
    answer:
      "Cuando terminás de reservar te mostramos un enlace en pantalla: ése es tu turno. " +
      "Desde ahí lo cancelás en un clic. Sacale una captura o mandátelo por WhatsApp, " +
      "porque no enviamos mails y es la única forma de cancelarlo vos misma. Si lo " +
      "perdiste, llamanos y lo cancelamos nosotras. Avisar libera el horario para otra " +
      "persona, así que se agradece.",
  },
];
