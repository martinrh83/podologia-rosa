import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import type { Staff } from "@/lib/db/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StaffSession = { user: User; staff: Staff };

/**
 * Quién está usando el panel, o null.
 *
 * Son dos preguntas distintas y hay que hacer las dos:
 *
 *  1. ¿Hay sesión válida? — `getUser()`, que la verifica contra el Auth server
 *     en vez de creerle a una cookie.
 *  2. ¿Esa persona trabaja acá? — la fila de `staff`, activa.
 *
 * Existir en `auth.users` no es ser del consultorio. Son tablas separadas
 * justamente porque responden cosas distintas, y saltear la segunda convertía a
 * cualquier usuario de Auth en administrador: se verificó que uno sin fila en
 * `staff` leía nombre, DNI, teléfono y motivo de cada paciente, y podía
 * editar precios.
 *
 * La consulta va por el cliente con la cookie —no por el service-role— a
 * propósito: así la pasa la policy `is_staff()` de la base, y la regla queda
 * escrita una sola vez, en Postgres. Si alguien mañana se saltea esta función,
 * RLS lo sigue frenando.
 */
export async function getStaffSession(): Promise<StaffSession | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("auth_user_id", data.user.id)
    .eq("active", true)
    .maybeSingle();

  // Sin fila activa no hay panel. Cubre al que nunca fue del consultorio y al
  // que se dio de baja: `active = false` ahora cierra la puerta, que era lo que
  // esa columna prometía y no cumplía.
  if (!staff) return null;

  return { user: data.user, staff: staff as Staff };
}

/**
 * El borde de autorización de /admin. Todas las páginas y acciones pasan por acá.
 *
 * `proxy.ts` también redirige, pero eso es un chequeo optimista sobre la
 * presencia de una cookie — la propia documentación de Next avisa que proxy no
 * sirve como autorización.
 */
export async function requireStaff(): Promise<StaffSession> {
  const session = await getStaffSession();

  if (!session) redirect("/admin/login?error=sin-acceso");

  return session;
}
