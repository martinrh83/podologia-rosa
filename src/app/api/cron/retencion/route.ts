import { NextResponse, type NextRequest } from "next/server";

import { isAuthorizedCron } from "@/lib/cron-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const DAY_MS = 86_400_000;

/**
 * Nightly data-retention job — the mitigation that makes collecting `motivo`
 * defensible under Ley 25.326.
 *
 *  1. `motivo` (a dato sensible) is purged 30 days after the turno.
 *  2. Contact details are anonymised after 12 months; the row survives so Rosa
 *     keeps her appointment history and statistics.
 *  3. Rate-limit rows are swept, since they only matter for an hour.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const now = Date.now();

  const motivoCutoff = new Date(now - 30 * DAY_MS).toISOString();
  const anonymiseCutoff = new Date(now - 365 * DAY_MS).toISOString();
  const rateLimitCutoff = new Date(now - DAY_MS).toISOString();

  const { data: purged, error: purgeError } = await supabase
    .from("appointments")
    .update({ motivo: null })
    .lt("starts_at", motivoCutoff)
    .not("motivo", "is", null)
    .select("id");

  const { data: anonymised, error: anonymiseError } = await supabase
    .from("appointments")
    .update({
      patient_first_name: "Paciente",
      patient_last_name: "anonimizado",
      // El DNI es lo más sensible que guardamos: se va con el resto.
      patient_dni: "",
      patient_phone: "",
      motivo: null,
      anonymized_at: new Date().toISOString(),
    })
    .lt("starts_at", anonymiseCutoff)
    .is("anonymized_at", null)
    .select("id");

  const { error: sweepError } = await supabase
    .from("rate_limit_hits")
    .delete()
    .lt("created_at", rateLimitCutoff);

  const firstError = purgeError ?? anonymiseError ?? sweepError;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    motivoPurged: purged?.length ?? 0,
    anonymised: anonymised?.length ?? 0,
  });
}
