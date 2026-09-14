-- Sacarle `is_staff()` a los anónimos.
--
-- Postgres le da EXECUTE a `PUBLIC` por defecto a toda función nueva, y de ahí
-- lo hereda `anon`. Como la función es `security definer` y vive en `public`,
-- que es un schema expuesto, PostgREST la publica como endpoint:
--
--     POST /rest/v1/rpc/is_staff   ->  200  false
--
-- Lo marcó `db advisors` contra el proyecto de la nube, no contra el local: el
-- lint de funciones expuestas sólo corre allá. Vale la pena anotarlo — hay
-- hallazgos que el stack local no muestra.
--
-- QUÉ TAN GRAVE ERA
--
--   Poco: la función no toma argumentos y devuelve un booleano sobre quien
--   llama. Un anónimo nunca es staff, y un logueado se entera de algo que ya
--   sabe por si le carga el panel. No hay forma de preguntar por otro.
--
--   Pero un endpoint RPC que no tiene por qué existir es superficie, y el
--   `grant` que lo creaba fue el default de Postgres, no una decisión. Esto lo
--   vuelve una decisión.
--
-- LO QUE NO SE HACE ACÁ
--
--   El manual diría mover la función a un schema no expuesto, que además
--   silenciaría el warning que queda para `authenticated`. Implicaría
--   reescribir las 19 policies —la superficie más delicada del proyecto— para
--   tapar un booleano sobre uno mismo. El riesgo de la operación es mayor que
--   el del hallazgo, así que se deja.
--
--   Si algún día `is_staff()` pasa a aceptar argumentos o a devolver algo de
--   otra persona, esa cuenta cambia y hay que mudarla.

-- A `anon` explícitamente, y no sólo a `PUBLIC`.
--
-- El primer intento fue `revoke ... from public` y no hizo nada: Supabase no
-- da este permiso por herencia de PUBLIC sino con un grant explícito por rol,
-- vía `alter default privileges ... grant execute on functions to anon,
-- authenticated, service_role`. Revocarle a PUBLIC no toca un grant explícito.
--
-- Se revoca igual a PUBLIC, por si en algún entorno el default sí viene de ahí.
revoke execute on function public.is_staff() from public;
revoke execute on function public.is_staff() from anon;

-- El grant de 0011 sigue en pie y es el que necesitan las policies: la
-- expresión de una policy la evalúa el rol que consulta, así que `authenticated`
-- tiene que poder ejecutarla. Se repite acá por si alguien lee sólo este
-- archivo y cree que la revocación las rompe.
grant execute on function public.is_staff() to authenticated;
