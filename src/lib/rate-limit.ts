import "server-only";

import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Client IP as seen through Vercel's proxy.
 *
 * `x-forwarded-for` is a comma-separated chain; the left-most entry is the
 * original client. It is spoofable in general, but on Vercel the platform
 * rewrites it, so it is trustworthy enough for a throttle.
 */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Hash the IP with the deploy secret so the table never stores a raw address.
 * Not reversible, still stable enough to count against.
 */
function bucketKey(scope: string, value: string): string {
  const salt = process.env.CRON_SECRET ?? "podologia-rosa";
  return `${scope}:${createHash("sha256").update(`${salt}:${value}`).digest("hex").slice(0, 32)}`;
}

export type RateLimitResult = { allowed: boolean; remaining: number };

/**
 * Fixed-window counter backed by Postgres.
 *
 * Fails **open**: if the rate-limit table is unreachable we let the booking
 * through rather than block a real patient over telemetry. The per-contact cap
 * and the unique slot index are the guards that actually protect the calendar.
 */
export async function checkRateLimit(
  scope: string,
  value: string,
  { limit, windowMinutes }: { limit: number; windowMinutes: number },
): Promise<RateLimitResult> {
  const supabase = createSupabaseAdminClient();
  const bucket = bucketKey(scope, value);
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { count, error } = await supabase
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .gte("created_at", since);

  if (error) return { allowed: true, remaining: limit };

  const used = count ?? 0;
  if (used >= limit) return { allowed: false, remaining: 0 };

  await supabase.from("rate_limit_hits").insert({ bucket });

  return { allowed: true, remaining: limit - used - 1 };
}
