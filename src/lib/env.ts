import "server-only";

import { z } from "zod";

/**
 * Server-side environment.
 *
 * Parsed lazily rather than at module load: `next build` imports modules without
 * the runtime secrets present, and failing the build over a missing RESEND_API_KEY
 * is not the behaviour we want. Each accessor validates only what it needs, at the
 * moment it needs it, so a misconfigured deploy fails loudly on the affected
 * request instead of silently sending nothing.
 */

/** Turn a zod failure into something a human can act on. */
function explain(missing: string[]): never {
  throw new Error(
    `Faltan variables de entorno: ${missing.join(", ")}. ` +
      `Copiá .env.example a .env.local y completá los valores del proyecto de Supabase. ` +
      `Ver supabase/README.md.`,
  );
}

const publicSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(1),
});

/**
 * Credentials for the cookie-scoped client used by /admin.
 *
 * Deliberately does *not* require the service-role key: that client never uses
 * it, and demanding it here would make admin sign-in fail over an unrelated
 * missing secret.
 */
export function supabasePublicEnv() {
  const parsed = publicSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    explain(
      parsed.error.issues.map((issue) =>
        issue.path[0] === "url" ? "NEXT_PUBLIC_SUPABASE_URL" : "SUPABASE_PUBLISHABLE_KEY",
      ),
    );
  }

  return parsed.data;
}

/** Credentials for the service-role client, which bypasses RLS. */
export function supabaseServiceEnv() {
  const { url } = supabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) explain(["SUPABASE_SERVICE_ROLE_KEY"]);

  return { url, serviceRoleKey };
}

/**
 * Absolute base URL, used by the sitemap and robots.txt.
 *
 * Order matters:
 *  1. `NEXT_PUBLIC_SITE_URL` — set this once a custom domain exists.
 *  2. `VERCEL_PROJECT_PRODUCTION_URL` — the project's stable production domain
 *     (`podologia-rosa.vercel.app`). Correct default before a custom domain.
 *  3. `VERCEL_URL` — the URL of *this specific deployment*, which changes on
 *     every push. Only a last resort for previews; a cancel link built from it
 *     would pin the patient to a stale deployment.
 */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "http://localhost:3000";
}
