-- Dos cosas que dejó el camino recorrido, las dos señaladas por `supabase db advisors`.
--
-- btree_gist
--
--   La instaló 0006 para la exclusion constraint particionada por profesional:
--   gist no sabe comparar uuid por igualdad sin ella. En 0008 esa constraint se
--   reemplazó por un índice único parcial, que hace lo mismo para el caso real
--   —dos turnos que arrancan a la misma hora— y es más barato.
--
--   Desde entonces la extensión no la usa nadie: cero constraints de exclusión
--   en el esquema, cero objetos que dependan de ella. Queda como el único
--   hallazgo del advisor de seguridad («extensión en el schema public»), y la
--   respuesta no es moverla de schema sino que no debería estar.
--
-- Las policies `for all`
--
--   Cinco tablas de catálogo tienen dos policies permisivas para el mismo rol y
--   la misma acción: «readable by all» (select, para todos) y «writable by
--   staff», que es `for all` y por lo tanto también cubre select. Postgres tiene
--   que evaluar las dos en cada lectura de un usuario logueado.
--
--   Se parten en insert / update / delete, que es lo que de verdad querían
--   decir. El select de esas tablas queda gobernado por una sola policy.
--
--   De paso, `is_staff()` pasa a ir envuelta en un subselect. Es `stable`, así
--   que envuelta Postgres la evalúa una vez por consulta (InitPlan) en lugar de
--   una vez por fila. Es el patrón que Supabase documenta para `auth.uid()` y
--   vale igual para cualquier función estable en una policy.
--
--   Ojo con `update`: al partir un `for all` hay que escribir `with check`
--   además de `using`. Sin él, la policy dejaría de validar la fila resultante.

drop extension btree_gist;

-- appointments · schedule_blocks · staff · weekly_schedule
--
-- Éstas no tienen lectura pública, así que no hay solapamiento que arreglar:
-- sólo se reescriben para envolver la función.
drop policy "appointments staff only" on appointments;
create policy "appointments staff only" on appointments
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop policy "schedule_blocks staff only" on schedule_blocks;
create policy "schedule_blocks staff only" on schedule_blocks
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop policy "staff staff only" on staff;
create policy "staff staff only" on staff
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop policy "weekly_schedule staff only" on weekly_schedule;
create policy "weekly_schedule staff only" on weekly_schedule
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- clinic_settings · locations · practitioners · services · specialties
--
-- Acá sí: el `for all` se parte para que el select lo resuelva una sola policy.
do $$
declare
  t text;
begin
  foreach t in array array['clinic_settings', 'locations', 'practitioners', 'services', 'specialties']
  loop
    execute format('drop policy %I on %I', t || ' writable by staff', t);

    execute format(
      'create policy %I on %I for insert to authenticated with check ((select public.is_staff()))',
      t || ' insertable by staff', t);

    execute format(
      'create policy %I on %I for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()))',
      t || ' updatable by staff', t);

    execute format(
      'create policy %I on %I for delete to authenticated using ((select public.is_staff()))',
      t || ' deletable by staff', t);
  end loop;
end $$;
