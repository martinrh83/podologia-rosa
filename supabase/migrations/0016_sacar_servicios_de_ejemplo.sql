-- Sacar el catálogo de servicios que insertó 0002.
--
-- POR QUÉ ESTABA MAL QUE ESTUVIERA AHÍ
--
--   `0002_seed.sql` es una migración, y `db push` corre migraciones. Así que
--   esos cinco servicios con sus precios llegaron a producción igual que una
--   tabla o un índice, sin que nadie lo decidiera.
--
--   El archivo mezcla dos cosas que no son lo mismo:
--
--     - La fila de `clinic_settings`, que la app no puede no tener:
--       `getClinicSettings()` tira excepción si no existe. Eso sí es parte del
--       contrato del esquema y se queda.
--
--     - Contenido: profesionales, sedes, precios, franjas. Eso lo edita el
--       consultorio desde el panel, y no tiene por qué existir en un entorno
--       nuevo. Los precios son el caso más claro: con la inflación, un número
--       escrito en una migración está mal a los dos meses y se sigue
--       insertando para siempre en cada base que se cree.
--
-- POR QUÉ SÓLO LOS SERVICIOS
--
--   De todo lo que sembró 0002, esto es lo único inventado. Las siete franjas
--   son los horarios reales de Rosa y la sede existe; les falta corregir el
--   apellido, el nombre y la dirección, que es trabajo de panel y no de
--   migración.
--
--   No hay forma de que una migración distinga sola un dato de ejemplo de uno
--   real cuando se parecen —«Quiropodia» es una prestación de verdad, y esos
--   horarios son horarios plausibles—. Por eso la lista va explícita acá abajo
--   en lugar de un `delete from services` a secas: se borra lo que se sabe que
--   es ejemplo, no todo lo que haya.
--
-- EL FILTRO
--
--   Se exige que coincidan nombre Y precio. Si alguien ya corrigió un precio
--   desde el panel, esa fila dejó de ser el ejemplo y sobrevive. Un borrado
--   que corre sin preguntar tiene que poder distinguir eso.

delete from services s
using (values
  ('Quiropodia',           15000::numeric),
  ('Uñas encarnadas',      18000::numeric),
  ('Pie diabético',        20000::numeric),
  ('Verrugas plantares',   18000::numeric),
  ('Estudio de la pisada', 25000::numeric)
) as ejemplo(name, price)
where s.name = ejemplo.name
  and s.price = ejemplo.price;
