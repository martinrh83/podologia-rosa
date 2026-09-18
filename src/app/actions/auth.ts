"use server";

import { redirect } from "next/navigation";

import { formError, formValues, parseForm, type ActionState } from "@/lib/forms";
import { loginSchema } from "@/lib/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const WRONG_CREDENTIALS = "El email o la contraseña no coinciden. Revisalos y probá de nuevo.";

/**
 * Sign Rosa in. There is no public sign-up: her user is created by hand in the
 * Supabase dashboard and sign-ups are disabled there, so this is the only door.
 *
 * Aun así la puerta comprueba las dos cosas —contraseña y fila en `staff`—
 * porque "sign-ups disabled" es un toggle del dashboard, no una garantía del
 * código: si alguien lo activa, esto sigue sin dejar entrar a nadie.
 */
export async function login(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(loginSchema, formValues(formData, ["email", "password"]));
  if (!parsed.ok) return parsed.state;
  const { email, password } = parsed.data;
  const next = String(formData.get("next") ?? "/admin");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Deliberately vague: distinguishing "wrong password" from "no such user"
    // tells an attacker which emails exist. Y por eso va como error del
    // formulario y no en un campo: marcar la contraseña diría que el email existe.
    return formError(WRONG_CREDENTIALS);
  }

  // La contraseña era correcta, pero eso sólo prueba que el usuario existe en
  // Auth. El panel es de quien está en `staff`, activo.
  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", data.user.id)
    .eq("active", true)
    .maybeSingle();

  if (!staff) {
    // Sin esto quedaba una sesión válida dando vueltas: `requireStaff()` la
    // frena en cada página, pero dejarla abierta no tiene ningún propósito.
    await supabase.auth.signOut();
    // Mismo mensaje que arriba, por lo mismo: decir "tu usuario no tiene
    // acceso" confirma que ese email existe.
    return formError(WRONG_CREDENTIALS);
  }

  // Only redirect to our own paths — never to whatever ?next= contained.
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
