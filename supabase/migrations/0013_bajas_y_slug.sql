-- Dos huecos del catálogo.
--
-- specialties.active
--
--   Es la única de las cuatro tablas de catálogo que no lo tiene: locations,
--   practitioners y services sí. Sin él, una disciplina que se deja de ofrecer
--   no tiene salida: borrarla la bloquea la FK desde profesionales y servicios,
--   y dejarla la sigue mostrando en la página de precios.
--
-- practitioners.slug
--
--   Era `text not null unique` y nada más. La app lo genera con `slugify()`,
--   pero la base aceptaba "Rosa Gómez" con espacios y mayúsculas: un insert a
--   mano desde Studio dejaba una URL rota y nadie se enteraba hasta que alguien
--   la abría.
--
--   Acá un CHECK es seguro, a diferencia del que se descartó para `patient_dni`:
--   ese habría roto el cron de retención, que escribe '' al anonimizar. Nada en
--   la app escribe un slug que no salga de `slugify()`.

alter table specialties add column active boolean not null default true;

create index specialties_active_order_idx on specialties (active, display_order);

alter table practitioners
  add constraint practitioners_slug_format check (slug ~ '^[a-z0-9-]+$');
