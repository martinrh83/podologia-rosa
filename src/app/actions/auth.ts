"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

/**
 * Sign Rosa in. There is no public sign-up: her user is created by hand in the
 * Supabase dashboard and sign-ups are disabled there, so this is the only door.
 *
 * Aun así la puerta comprueba las dos cosas —contraseña y fila en `staff`—
 * porque "sign-ups disabled" es un toggle del dashboard, no una garantía del
 * código: si alguien lo activa, esto sigue sin dejar entrar a nadie.
 */
export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "Completá email y contraseña." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Deliberately vague: distinguishing "wrong password" from "no such user"
    // tells an attacker which emails exist.
    return { error: "Email o contraseña incorrectos." };
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
    return { error: "Email o contraseña incorrectos." };
  }

  // Only redirect to our own paths — never to whatever ?next= contained.
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
