-- Borrar el tope de turnos activos por contacto.
--
-- En 0004 se había puesto en 0 —desactivado— dejando la columna y el código por
-- si alguna vez hacía falta volver a encenderlo sin desplegar. Esa promesa dejó
-- de ser cierta cuando entraron varios profesionales:
--
--   La cuenta era por TODO EL CONSULTORIO (`where patient_phone = ...`, sin
--   filtrar por profesional). Con una sola podóloga eso estaba bien. Con dos
--   disciplinas, un paciente que saca turno con la podóloga y con el kinesiólogo
--   gasta su cupo de 2 con dos reservas perfectamente legítimas, y recibe un
--   "ya tenés 2 turnos reservados" por hacer exactamente lo que el consultorio
--   quiere que haga.
--
-- O sea que la perilla seguía ahí, pero girarla habría hecho daño. Un valor de
-- configuración que nadie puede usar sin romper algo no es una opción: es una
-- trampa con un número al lado.
--
-- Se borra en vez de documentarse. El día que aparezca alguien abusando de la
-- agenda, el tope vuelve con la forma que ese caso pida —por consultorio o por
-- profesional— decidida con el problema a la vista y no adivinada dos años antes.
--
-- Mientras tanto la agenda sigue protegida por lo que sí funciona hoy: el tope
-- de 5 intentos por hora por IP (`rate_limit_hits`) y el horizonte de 15 días
-- del formulario público.

alter table clinic_settings drop column max_active_per_contact;

-- Existía sólo para esa cuenta: era el único lugar que filtraba por
-- `patient_phone`. Buscar el historial de un paciente, si alguna vez se agrega,
-- va por DNI, que ya tiene su propio índice y es el identificador fuerte.
drop index appointments_contact_idx;
