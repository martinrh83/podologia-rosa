import "server-only";

import { createClient } from "@supabase/supabase-js";

import { supabaseServiceEnv } from "@/lib/env";

/**
 * Service-role Supabase client. Bypasses RLS entirely.
 *
 * This is what the public booking flow runs on: patients have no session, so the
 * server acts on their behalf after validating the request itself. Every call
 * site is therefore responsible for its own authorisation — never hand this
 * client a filter that came from user input without checking it first.
 *
 * Never import this into a Client Component; `server-only` will fail the build
 * if anyone tries.
 */
export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = supabaseServiceEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
