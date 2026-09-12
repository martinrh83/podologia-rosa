-- Varios profesionales en el mismo consultorio.
--
-- Hasta acá el sistema era de una sola persona: los horarios, los bloqueos y los
-- turnos no tenían dueño, y la restricción de exclusión prohibía dos turnos
-- superpuestos EN TODO EL CONSULTORIO. Ahora atienden dos podólogas en paralelo,
-- cada una con su box, así que dos turnos a las 9:00 son lo normal y no un error.
--
-- Orden de la migración: extensión, tablas nuevas, columnas nullable, backfill,
-- not null, y recién al final la restricción. Cambiarlo de orden la rompe.

-- Necesaria para comparar uuid por igualdad dentro de un índice gist. Sin esto,
-- `practitioner_id with =` falla con un error que no dice lo que pasa.
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- specialties — la disciplina de cada profesional.
--
-- Hoy tiene una sola fila y todos apuntan a ella. Existe igual porque el día que
-- entre kinesiología la página de turnos y la de precios tienen que agrupar, y
-- con texto libre un "Podologia" sin tilde cargado un martes crea un grupo nuevo.
-- ---------------------------------------------------------------------------
create table specialties (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- staff — quién puede entrar al panel.
--
-- Deliberadamente separada de `practitioners`, porque son dos cosas distintas:
-- el secretario entra al sistema y no atiende pacientes, y una profesional que
-- no usa la computadora atiende pacientes y no entra. Meter al secretario en
-- `practitioners` con un `bookable = false` dejaría una mentira en el nombre de
-- la tabla, y la primera consulta que se olvide del filtro lo publica en la
-- página donde el paciente elige con quién atenderse.
-- ---------------------------------------------------------------------------
create table staff (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  full_name    text not null,
  role         text not null default 'practitioner'
               check (role in ('admin', 'practitioner')),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- practitioners — a quién se le puede sacar turno.
--
-- `staff_id` es nullable en los dos sentidos a propósito: hoy las profesionales
-- no tienen cuenta (el secretario administra por ellas) y el secretario no tiene
-- fila acá. Cuando alguna se vaya, la fila se marca `active = false` y no se
-- borra nunca: los turnos pasados la referencian.
-- ---------------------------------------------------------------------------
create table practitioners (
  id            uuid primary key default gen_random_uuid(),
  staff_id      uuid unique references staff (id) on delete set null,
  specialty_id  uuid not null references specialties (id),
  -- Parte de una URL que se comparte por WhatsApp y que Google indexa: se genera
  -- al dar de alta y no se regenera si después cambia el nombre.
  slug          text not null unique,
  first_name    text not null,
  last_name     text not null,
  title         text,
  bio           text,
  slot_minutes  integer not null default 60 check (slot_minutes > 0),
  active        boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create index practitioners_active_order_idx on practitioners (active, display_order);

-- ---------------------------------------------------------------------------
-- Bootstrap: la especialidad y la profesional que ya existían implícitas.
--
-- Hace falta antes del backfill, porque las columnas que siguen terminan siendo
-- not null y necesitan a quién apuntar. El apellido y la matrícula quedan como
-- marcador: se completan desde el panel, igual que la dirección del consultorio.
-- La segunda profesional se da de alta desde /admin/profesionales, que es el
-- camino que van a usar de verdad.
-- ---------------------------------------------------------------------------
insert into specialties (name, display_order) values ('Podología', 1);

insert into practitioners (specialty_id, slug, first_name, last_name, title, slot_minutes, display_order)
select
  (select id from specialties where name = 'Podología'),
  'rosa',
  'Rosa',
  'Completar',
  'Podóloga',
  -- La duración que tenía el consultorio entero pasa a ser la de ella.
  (select slot_minutes from clinic_settings limit 1),
  1;

-- ---------------------------------------------------------------------------
-- weekly_schedule — las franjas pasan a ser de alguien.
-- ---------------------------------------------------------------------------
alter table weekly_schedule add column practitioner_id uuid references practitioners (id) on delete cascade;

update weekly_schedule set practitioner_id = (select id from practitioners order by display_order limit 1);

alter table weekly_schedule alter column practitioner_id set not null;

drop index weekly_schedule_weekday_idx;
create index weekly_schedule_practitioner_idx on weekly_schedule (practitioner_id, weekday, start_time);

-- ---------------------------------------------------------------------------
-- schedule_blocks — nullable a propósito.
--
-- Con id es el bloqueo de esa persona (sus vacaciones). En null cierra el
-- consultorio entero: un feriado, una fumigación. Un solo concepto cubre los dos
-- casos, y lo que ya estaba cargado era justamente del consultorio, así que se
-- queda en null sin backfill.
-- ---------------------------------------------------------------------------
alter table schedule_blocks add column practitioner_id uuid references practitioners (id) on delete cascade;

create index schedule_blocks_practitioner_idx on schedule_blocks (practitioner_id, starts_at);

-- ---------------------------------------------------------------------------
-- appointments — de quién es el turno.
-- ---------------------------------------------------------------------------
alter table appointments add column practitioner_id uuid references practitioners (id);

update appointments set practitioner_id = (select id from practitioners order by display_order limit 1);

alter table appointments alter column practitioner_id set not null;

create index appointments_practitioner_idx on appointments (practitioner_id, starts_at);

-- ---------------------------------------------------------------------------
-- LA restricción, ahora por profesional.
--
-- Es lo único de esta migración que un deploy no arregla si queda mal, porque se
-- rompe con datos ya guardados: si permite de más, la sobreventa ya ocurrió para
-- cuando alguien la nota.
--
-- Lo que sigue prohibiendo: que una misma profesional tenga dos turnos activos
-- que se pisen. Lo que ahora permite: que las dos atiendan a la misma hora, cada
-- una en su box.
-- ---------------------------------------------------------------------------
alter table appointments drop constraint appointments_no_overlap;

alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (
    practitioner_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status <> 'cancelled');

-- ---------------------------------------------------------------------------
-- services — los precios cuelgan de la disciplina, no del consultorio.
--
-- Hoy todos apuntan a Podología y /servicios se ve igual. El día que entre otra
-- disciplina la página agrupa sola y no hay precios que repartir a mano.
-- ---------------------------------------------------------------------------
alter table services add column specialty_id uuid references specialties (id);

update services set specialty_id = (select id from specialties order by display_order limit 1);

alter table services alter column specialty_id set not null;

-- ---------------------------------------------------------------------------
-- clinic_settings — pierde la duración del turno.
--
-- Se queda con lo que sí es del consultorio: el horizonte de reserva, el tope por
-- contacto, y los datos de contacto. La duración ahora es de cada profesional.
-- ---------------------------------------------------------------------------
alter table clinic_settings drop column slot_minutes;

-- ---------------------------------------------------------------------------
-- RLS
--
-- Especialidades y profesionales se muestran en el sitio público, así que anon
-- puede leerlas. `staff` no: es la tabla de quién tiene acceso, y no hay ninguna
-- página pública que necesite saberlo. Sin política para anon, no hay acceso.
-- ---------------------------------------------------------------------------
alter table specialties   enable row level security;
alter table practitioners enable row level security;
alter table staff         enable row level security;

create policy "specialties readable by all"
  on specialties for select using (true);
create policy "practitioners readable by all"
  on practitioners for select using (true);

create policy "specialties writable by staff"
  on specialties for all to authenticated using (true) with check (true);
create policy "practitioners writable by staff"
  on practitioners for all to authenticated using (true) with check (true);
create policy "staff readable by staff"
  on staff for all to authenticated using (true) with check (true);
