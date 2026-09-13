-- Sacar lo que quedó de features que ya no existen.
--
-- COLUMNAS
--
--   `patient_email` no la escribe nadie: el email salió del formulario cuando se
--   decidió no comprar un dominio, y nunca volvió. No está en `bookingSchema`,
--   no está en ningún formulario, y el único código que la mencionaba era el
--   cron de retención poniéndola en null — anonimizando algo que siempre estuvo
--   vacío. Es superficie de datos personales que no guarda datos.
--
--   `reminder_sent_at` existía para que el cron de recordatorios por mail fuera
--   idempotente. Ese cron se borró junto con los emails; hoy el recordatorio es
--   un botón de WhatsApp que el secretario toca.
--
-- ÍNDICES
--
--   Ninguna consulta de la app filtra por estas columnas. Los tres se crearon
--   imaginando pantallas que no existen: "ver la agenda de una sede", "buscar el
--   historial de un paciente por DNI". Cada uno se paga en cada insert.
--
--   Si algún día esas pantallas aparecen, el índice se crea en ese momento, con
--   la consulta real a la vista para saber qué columnas y en qué orden.

alter table appointments drop column patient_email;
alter table appointments drop column reminder_sent_at;

drop index appointments_location_idx;
drop index appointments_dni_idx;
drop index weekly_schedule_location_idx;
