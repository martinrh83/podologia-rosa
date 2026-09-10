-- Datos del paciente que Rosa realmente necesita: nombre y apellido separados,
-- DNI, y obra social.

-- ---------------------------------------------------------------------------
-- Nombre y apellido separados
--
-- Estaban en un solo campo. Separarlos importa para buscar por apellido, que es
-- como se ordena una ficha, y para dirigirse al paciente por el nombre solo.
-- ---------------------------------------------------------------------------
alter table appointments add column patient_first_name text;
alter table appointments add column patient_last_name  text;

-- Backfill: lo que había antes del primer espacio es el nombre, el resto el
-- apellido. Aproximado, pero sólo aplica a los turnos de prueba.
update appointments set
  patient_first_name = coalesce(nullif(split_part(patient_name, ' ', 1), ''), patient_name),
  patient_last_name  = coalesce(
    nullif(trim(substring(patient_name from coalesce(nullif(position(' ' in patient_name), 0), length(patient_name) + 1))), ''),
    ''
  );

alter table appointments alter column patient_first_name set not null;
alter table appointments alter column patient_last_name  set not null;
alter table appointments drop column patient_name;

-- ---------------------------------------------------------------------------
-- DNI
--
-- Se guarda sólo en dígitos, normalizado, para que "20.123.456" y "20123456"
-- sean el mismo paciente. Es un identificador nacional fuerte: sube el impacto
-- de una filtración, así que nunca sale a anon y lo borra el cron de retención
-- junto con el resto de los datos de contacto.
-- ---------------------------------------------------------------------------
alter table appointments add column patient_dni text not null default '';
alter table appointments alter column patient_dni drop default;

create index appointments_dni_idx on appointments (patient_dni);

-- ---------------------------------------------------------------------------
-- Obra social
--
-- No es un dato de salud: no dice nada sobre el estado del paciente, sólo cómo
-- se factura la consulta. Se guarda como enum porque son tres opciones fijas y
-- así la base rechaza cualquier otra cosa.
-- ---------------------------------------------------------------------------
create type patient_coverage as enum ('ips', 'osunsa', 'particular');

alter table appointments add column patient_coverage patient_coverage not null default 'particular';
alter table appointments alter column patient_coverage drop default;
