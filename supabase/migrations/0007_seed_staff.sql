-- La cuenta que administra el consultorio.
--
-- Por ahora hay una sola y es la del secretario, con rol `admin`: administra los
-- turnos de las dos profesionales, sus horarios y sus bloqueos. Las profesionales
-- todavía no tienen cuenta propia, y por eso el panel no filtra por persona como
-- frontera de seguridad — el filtro que sí existe es una comodidad para mirar.
--
-- El día que cada una tenga su usuario, esto es una fila más con
-- role = 'practitioner' y su `staff_id` apuntado desde `practitioners`.

-- Se engancha al usuario de Supabase que ya exista. En un entorno nuevo todavía
-- no hay ninguno —se crea a mano desde el dashboard, igual que decía el plan
-- original— y entonces la fila queda sin vincular hasta que se lo asocie.
insert into staff (auth_user_id, full_name, role)
select
  (select id from auth.users order by created_at limit 1),
  'Secretaría',
  'admin'
where not exists (select 1 from staff);
