-- Que la RLS pregunte si sos del consultorio, no si tenés una cuenta.
--
-- EL AGUJERO
--
--   Las políticas decían `to authenticated using (true)`. En Supabase,
--   `authenticated` NO significa "del consultorio": significa "cualquiera con un
--   JWT válido de este proyecto". Y emitir ese JWT era un `curl` al endpoint
--   público de registro.
--
--   Verificado contra esta misma base antes de escribir esto:
--
--     POST /auth/v1/signup  con la clave pública   -> token de authenticated
--     GET  /rest/v1/appointments  con ese token    -> 200, todos los pacientes
--                                                     con nombre, DNI, teléfono
--                                                     y motivo (dato sensible)
--     PATCH /rest/v1/services                      -> 204, precio cambiado
--
--   La app en sí nunca filtró nada: el navegador no habla con Supabase, todo
--   pasa por el servidor con la service role key. Pero la RLS existe justamente
--   para el día que eso falle, y esta no defendía: la puerta de atrás estaba
--   abierta desde afuera.
--
-- EL ARREGLO
--
--   Ahora que `staff` existe, la política puede preguntar de verdad. Esta
--   migración es la que convierte a esa tabla en algo que la base consulta, en
--   vez de una fila que no lee nadie.
--
--   Va junto con `enable_signup = false` en config.toml. Las dos cosas: apagar
--   el registro sin arreglar la política la deja mintiendo igual, y si algún día
--   los pacientes tienen cuenta vuelve el mismo problema.

-- ---------------------------------------------------------------------------
-- ¿El que consulta es del consultorio?
--
-- `security definer` es obligatorio acá y no es un atajo: la función lee
-- `staff`, y `staff` tiene RLS que a su vez llama a esta función. Sin definer
-- se llamarían en círculo. Corriendo como dueña, saltea la RLS de esa lectura y
-- corta la recursión.
--
-- `search_path = ''` con todo calificado: una función definer con el search_path
-- abierto es la forma clásica de que alguien la engañe para ejecutar su propia
-- tabla `staff`.
-- ---------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff
    where auth_user_id = (select auth.uid()) and active
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- ---------------------------------------------------------------------------
-- Tablas con datos del consultorio: sólo el personal, ni leer ni escribir.
-- ---------------------------------------------------------------------------
drop policy "appointments staff only"     on appointments;
drop policy "weekly_schedule staff only"  on weekly_schedule;
drop policy "schedule_blocks staff only"  on schedule_blocks;
drop policy "staff readable by staff"     on staff;

create policy "appointments staff only" on appointments
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "weekly_schedule staff only" on weekly_schedule
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "schedule_blocks staff only" on schedule_blocks
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff staff only" on staff
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Tablas públicas: cualquiera las lee —son las que se muestran en el sitio—
-- pero escribirlas sigue siendo del personal.
--
-- Las políticas de lectura `for select using (true)` quedan como están.
-- ---------------------------------------------------------------------------
drop policy "clinic_settings writable by staff" on clinic_settings;
drop policy "services writable by staff"        on services;
drop policy "specialties writable by staff"     on specialties;
drop policy "practitioners writable by staff"   on practitioners;
drop policy "locations writable by staff"       on locations;

create policy "clinic_settings writable by staff" on clinic_settings
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "services writable by staff" on services
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "specialties writable by staff" on specialties
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "practitioners writable by staff" on practitioners
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "locations writable by staff" on locations
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
