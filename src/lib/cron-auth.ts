import "server-only";

import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Guard for /api/cron/*.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically when the
 * env var is set. These endpoints mutate real data and send real email, so they
 * are compared in constant time and refuse to run at all without a secret
 * configured — failing closed is the right default for a job nobody watches.
 */
export function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
