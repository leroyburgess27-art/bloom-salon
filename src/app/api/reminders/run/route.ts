import { NextResponse } from "next/server";
import { runReminderEngine } from "@/lib/reminders";

export const dynamic = "force-dynamic";

// Triggered on a schedule (e.g. Vercel Cron) to generate and send due reminders.
// When RESEND_API_KEY is set on the server, email reminders are sent for real.
export async function GET() {
  try {
    const result = await runReminderEngine();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("reminder engine failed", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
