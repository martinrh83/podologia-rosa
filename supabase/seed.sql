-- Datos de desarrollo. NO se aplica en la nube.
--
-- `supabase db reset` corre este archivo después de las migraciones; `db push`
-- no lo toca. Por eso la contraseña de acá es inofensiva: vive en una base que
-- sólo existe en tu máquina, igual que el `postgres:postgres` de la cadena de
-- conexión que imprime `supabase status`.
--
--   El usuario del panel en la nube se crea a mano en el dashboard, con una
--   contraseña de verdad, y `enable_signup = false` impide que se cree ningún
--   otro. Nada de este archivo llega hasta allá.
--
-- POR QUÉ EXISTE
--
--   Hasta ahora el usuario del panel se creaba a mano una vez y no estaba
--   escrito en ningún lado. Cada `db reset` lo borraba y dejaba el entorno local
--   sin forma de entrar a /admin, con la fila de `staff` apuntando a un usuario
--   que ya no existía. Un reset tiene que dejar el entorno usable; si no, deja
--   de usarse y las migraciones se prueban de a poco en vez de desde cero.
--
-- Idempotente, como el resto de los seeds: correrlo dos veces no duplica nada.

-- Credenciales locales: rosa@example.com / rosa1234
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  -- Estas cuatro son nulables en la tabla pero NO para GoTrue, que las lee
  -- como texto no-nulo. Dejarlas en null hace que el login devuelva 500
  -- «Database error querying schema», que no se parece en nada a la causa.
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'rosa@example.com',
  -- bcrypt, que es lo que espera GoTrue al validar el login
  crypt('rosa1234', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  '', '', '', ''
where not exists (select 1 from auth.users where email = 'rosa@example.com');

-- Sin la identidad, GoTrue encuentra el usuario pero no el método de acceso y
-- el login falla con "Invalid login credentials", que despista bastante.
insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  now(), now(), now()
from auth.users u
where u.email = 'rosa@example.com'
  and not exists (
    select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
  );

-- Y enlazarlo con la fila que crea 0007. Sin esto el login anda pero
-- `requireStaff()` no lo reconoce, que es exactamente lo que tiene que pasar
-- con un usuario de Auth que no trabaja acá.
update staff
set auth_user_id = (select id from auth.users where email = 'rosa@example.com')
where full_name = 'Secretaría'
  and auth_user_id is null;

-- ---------------------------------------------------------------------------
-- Catálogo de servicios para desarrollar.
--
-- Lo borró la migración 0016 porque era contenido inventado viviendo en una
-- migración, y así llegaba a producción. Acá sí corresponde: `db reset` lo
-- repone en local y `db push` no lo toca. Ojo: /admin/servicios edita nombre y
-- precio y activa o desactiva, pero no crea servicios ni edita descripciones.
--
-- Los cuatro tratamientos que ofrece el consultorio. Las descripciones son un
-- borrador para desarrollo: las reales se escriben desde el panel.
--
-- Sin precios: no se publican en el sitio, y un número escrito en un archivo
-- del repo está mal a los dos meses con la inflación — que es exactamente la
-- razón por la que los precios viven en la base y hay una pantalla para
-- editarlos.
--
-- Idempotente, como el resto: sólo siembra si la tabla está vacía.
-- `specialty_id` es NOT NULL desde 0006: los servicios cuelgan de una
-- disciplina, no del consultorio. Se resuelve por nombre en vez de hardcodear
-- un uuid, que cambia en cada base.
insert into services (name, description, price, display_order, specialty_id)
select s.name, s.description, s.price, s.display_order,
       (select id from specialties where name = 'Podología')
from (values
  ('Consulta general', 'Revisión completa de tus pies y atención de lo que necesiten en el momento.', null::numeric, 1),
  ('Onicocriptosis',   'Uña encarnada: alivio del dolor y la inflamación, y seguimiento hasta que crezca bien.', null::numeric, 2),
  ('Pie diabético',    'Control y cuidado preventivo para personas con diabetes.', null::numeric, 3),
  ('Ortonixia',        'Corrección de la curvatura de uñas que se encarnan una y otra vez.', null::numeric, 4)
) as s(name, description, price, display_order)
where not exists (select 1 from services);
