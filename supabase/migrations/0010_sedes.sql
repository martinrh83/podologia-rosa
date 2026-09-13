-- Dos sedes.
--
-- El consultorio pasa a atender en dos direcciones: de lunes a viernes en una y
-- los sábados en la otra, con las dos profesionales en ambas. Cada sede tiene
-- dos boxes, así que las dos pueden atender a la misma hora en cualquiera.
--
-- LA SEDE VA EN LA FRANJA, NO EN EL PROFESIONAL
--
--   Si estuviera en `practitioners`, Rosa tendría que ser dos filas para poder
--   atender en las dos sedes, y todo lo que la referencia —turnos, slug, agenda—
--   se partiría en dos. En `weekly_schedule` es una fila más, que es lo que esa
--   tabla ya sabía hacer para las franjas partidas del mediodía.
--
-- EL ÍNDICE ÚNICO NO CAMBIA
--
--   `unique (practitioner_id, starts_at)` sigue diciendo "Rosa no puede tener
--   dos turnos a las 9:00", que entre sedes es exactamente lo que hace falta:
--   nadie está en dos lugares a la vez. Agregarle `location_id` parecería lo
--   prolijo y sería un error: permitiría que Rosa esté en las dos a las 9:00.
--
--   Lo que NO cubre —igual que antes— es que dos profesionales se pisen en el
--   mismo box. Hoy no hace falta: hay dos boxes en cada sede.

-- ---------------------------------------------------------------------------
-- locations — dónde se atiende.
--
-- `active` por el mismo motivo que en `practitioners`: una sede que cierra sale
-- del sitio, pero los turnos que pasaron ahí la siguen referenciando y borrarla
-- rompería el historial.
-- ---------------------------------------------------------------------------
create table locations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  address       text not null,
  map_url       text,
  display_order integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index locations_active_order_idx on locations (active, display_order);

-- La sede que ya existía implícita, con los datos que estaban en clinic_settings.
insert into locations (name, address, map_url, display_order)
select
  'Consultorio',
  coalesce(address, 'Completar con la dirección real, Salta'),
  map_url,
  1
from clinic_settings limit 1;

-- ---------------------------------------------------------------------------
-- weekly_schedule — la sede vive acá.
-- ---------------------------------------------------------------------------
alter table weekly_schedule add column location_id uuid references locations (id) on delete cascade;

update weekly_schedule set location_id = (select id from locations order by display_order limit 1);

alter table weekly_schedule alter column location_id set not null;

drop index weekly_schedule_practitioner_idx;
create index weekly_schedule_practitioner_idx
  on weekly_schedule (practitioner_id, weekday, start_time);
create index weekly_schedule_location_idx on weekly_schedule (location_id);

-- ---------------------------------------------------------------------------
-- appointments — dónde fue el turno, guardado al reservar.
--
-- No se deriva de la franja a propósito: si el año que viene el sábado pasa a
-- ser en la otra sede, los turnos de este año tienen que seguir diciendo dónde
-- ocurrieron de verdad.
-- ---------------------------------------------------------------------------
alter table appointments add column location_id uuid references locations (id);

update appointments set location_id = (select id from locations order by display_order limit 1);

alter table appointments alter column location_id set not null;

create index appointments_location_idx on appointments (location_id, starts_at);

-- ---------------------------------------------------------------------------
-- schedule_blocks — dos columnas nullables, cuatro significados.
--
--   location   practitioner
--     null        null        feriado: no abre nada
--     Norte       null        esa sede no abre ese día
--     null        Rosa        vacaciones de Rosa, en las dos sedes
--     Norte       Rosa        Rosa no va a Norte ese día; Bea sí
--
-- Lo que ya estaba cargado era del consultorio entero, así que se queda en null
-- sin backfill.
-- ---------------------------------------------------------------------------
alter table schedule_blocks add column location_id uuid references locations (id) on delete cascade;

create index schedule_blocks_location_idx on schedule_blocks (location_id, starts_at);

-- ---------------------------------------------------------------------------
-- clinic_settings — pierde la dirección y el mapa.
--
-- Se queda con lo que sigue siendo uno solo: el nombre del negocio, la política
-- de horizonte y el número por el que atiende el secretario, que es el mismo
-- para las dos sedes.
-- ---------------------------------------------------------------------------
alter table clinic_settings drop column address;
alter table clinic_settings drop column map_url;

-- ---------------------------------------------------------------------------
-- RLS — las sedes son públicas: se muestran en el sitio.
-- ---------------------------------------------------------------------------
alter table locations enable row level security;

create policy "locations readable by all"
  on locations for select using (true);
create policy "locations writable by staff"
  on locations for all to authenticated using (true) with check (true);
