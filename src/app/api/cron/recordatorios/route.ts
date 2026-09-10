import { NextResponse, type NextRequest } from "next/server";

import { isAuthorizedCron } from "@/lib/cron-auth";
import { getClinicSettings } from "@/lib/availability";
import { sendPatientReminder } from "@/lib/email";
import { localDayRange } from "@/lib/slots";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Appointment } from "@/lib/db/types";

/**
 * Daily 24-hour reminders.
 *
 * Idempotent by construction: it only selects turnos where `reminder_sent_at` is
 * null, and stamps that column immediately after a successful send. A retry — or
 * an accidental second invocation — therefore sends nothing rather than mailing
 * every patient twice.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  // "Tomorrow" in Buenos Aires, not "now + 24h" — see localDayRange.
  const tomorrow = localDayRange(new Date(), 1);

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("status", "booked")
    .is("reminder_sent_at", null)
    .not("patient_email", "is", null)
    .gte("starts_at", tomorrow.start.toISOString())
    .lt("starts_at", tomorrow.end.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appointments = (data ?? []) as Appointment[];
  if (appointments.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 });
  }

  const settings = await getClinicSettings();
  let sent = 0;
  let failed = 0;

  for (const appointment of appointments) {
    const ok = await sendPatientReminder({ appointment, settings });

    if (ok) {
      // Stamped per appointment rather than in one batch at the end: if the job
      // dies halfway, the ones already emailed stay marked.
      await supabase
        .from("appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", appointment.id);
      sent += 1;
    } else {
      // Left unstamped on purpose, so tomorrow's run retries it.
      failed += 1;
    }
  }

  return NextResponse.json({ sent, failed });
}
