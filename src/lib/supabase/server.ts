import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabasePublicEnv } from "@/lib/env";

/**
 * Request-scoped Supabase client carrying Rosa's session cookie.
 *
 * Used for everything under /admin. Subject to RLS, so it can only ever see what
 * an authenticated staff user is allowed to see.
 *
 * Must be created per request — the client emits the no-store cache headers only
 * on its first cookie write, so a shared instance would leave later responses
 * cacheable with a session cookie attached.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = supabasePublicEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. Safe to swallow: proxy.ts has
          // already refreshed the session for this request.
        }
      },
    },
  });
}
