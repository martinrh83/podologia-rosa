import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The real authorisation boundary for /admin.
 *
 * `proxy.ts` also redirects unauthenticated visitors, but that is an optimistic
 * check on a cookie's presence — Next's own docs are explicit that proxy must
 * not be trusted for authorisation. Every admin page and action calls this,
 * which verifies the session against the Auth server rather than believing a
 * cookie.
 */
export async function requireStaff() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/admin/login");
  }

  return data.user;
}

/** Current user without redirecting — for rendering a sign-out button, etc. */
export async function getStaffUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
