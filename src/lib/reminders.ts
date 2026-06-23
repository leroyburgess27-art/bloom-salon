// Reminder engine. Generates appointment reminders for upcoming bookings and
// "sends" them. Email goes live when RESEND_API_KEY is set (server-side only);
// WhatsApp is stubbed/simulated until the Meta WhatsApp Business API is wired up.
import { supabase, supabaseEnabled, BUSINESS_ID } from "./supabaseClient";

export interface ReminderRow {
  id: string;
  channel: "email" | "whatsapp";
  toContact: string | null;
  message: string | null;
  scheduledFor: Date;
  status: "scheduled" | "sent" | "simulated" | "failed";
  sentAt: Date | null;
  clientName: string | null;
  serviceName: string | null;
  startsAt: Date | null;
}

const WINDOW_DAYS = 7; // generate reminders for bookings within this horizon
const LEAD_HOURS = 24; // remind this long before the appointment

function buildMessage(
  client: string,
  service: string,
  stylist: string,
  start: Date,
): string {
  const when = start.toLocaleString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Hi ${client}, a reminder of your ${service} with ${stylist} at Bloom Hair & Nail Studio on ${when}. Reply to reschedule. See you soon!`;
}

// 1) Create reminder rows for upcoming bookings that don't have them yet.
export async function generateDueReminders(): Promise<number> {
  if (!supabaseEnabled || !supabase) return 0;

  const now = new Date();
  const horizon = new Date(now.getTime() + WINDOW_DAYS * 86400000);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, starts_at, services(name), stylists(name), clients(name, email, phone)")
    .eq("business_id", BUSINESS_ID)
    .neq("status", "cancelled")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", horizon.toISOString());
  if (error) throw error;
  if (!bookings || bookings.length === 0) return 0;

  const ids = bookings.map((b: any) => b.id);
  const { data: existing } = await supabase
    .from("reminders")
    .select("booking_id, channel")
    .in("booking_id", ids);
  const have = new Set((existing ?? []).map((e: any) => `${e.booking_id}:${e.channel}`));

  const rows: any[] = [];
  for (const b of bookings as any[]) {
    const start = new Date(b.starts_at);
    const scheduledFor = new Date(start.getTime() - LEAD_HOURS * 3600000).toISOString();
    const message = buildMessage(
      b.clients?.name ?? "there",
      b.services?.name ?? "appointment",
      b.stylists?.name ?? "our team",
      start,
    );
    if (b.clients?.email && !have.has(`${b.id}:email`)) {
      rows.push({
        business_id: BUSINESS_ID, booking_id: b.id, channel: "email",
        to_contact: b.clients.email, message, scheduled_for: scheduledFor, status: "scheduled",
      });
    }
    if (b.clients?.phone && !have.has(`${b.id}:whatsapp`)) {
      rows.push({
        business_id: BUSINESS_ID, booking_id: b.id, channel: "whatsapp",
        to_contact: b.clients.phone, message, scheduled_for: scheduledFor, status: "scheduled",
      });
    }
  }

  if (rows.length === 0) return 0;
  const { error: insErr } = await supabase.from("reminders").insert(rows);
  if (insErr) throw insErr;
  return rows.length;
}

// Email sender — real via Resend when a server-side key is present, else simulated.
async function sendEmail(to: string, message: string): Promise<"sent" | "simulated" | "failed"> {
  const key = process.env.RESEND_API_KEY; // server-side only; undefined in the browser
  if (!key) return "simulated";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Bloom Studio <reminders@bloomstudio.example>",
        to,
        subject: "Appointment reminder — Bloom Hair & Nail Studio",
        text: message,
      }),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

// 2) "Send" all scheduled reminders that are now due.
export async function sendDueReminders(): Promise<number> {
  if (!supabaseEnabled || !supabase) return 0;
  const now = new Date();

  const { data: due, error } = await supabase
    .from("reminders")
    .select("id, channel, to_contact, message")
    .eq("business_id", BUSINESS_ID)
    .eq("status", "scheduled")
    .lte("scheduled_for", now.toISOString());
  if (error) throw error;
  if (!due || due.length === 0) return 0;

  let sent = 0;
  for (const r of due as any[]) {
    let status: "sent" | "simulated" | "failed" = "simulated";
    if (r.channel === "email" && r.to_contact) {
      status = await sendEmail(r.to_contact, r.message ?? "");
    }
    // WhatsApp stays simulated until the Meta WhatsApp Business API is connected.
    await supabase
      .from("reminders")
      .update({ status, sent_at: new Date().toISOString() })
      .eq("id", r.id);
    if (status !== "failed") sent++;
  }
  return sent;
}

// Convenience: generate + send in one pass (used by the admin button and cron).
export async function runReminderEngine(): Promise<{ generated: number; sent: number }> {
  const generated = await generateDueReminders();
  const sent = await sendDueReminders();
  return { generated, sent };
}

export async function listReminders(limit = 50): Promise<ReminderRow[]> {
  if (!supabaseEnabled || !supabase) return [];
  const { data, error } = await supabase
    .from("reminders")
    .select("id, channel, to_contact, message, scheduled_for, status, sent_at, bookings(starts_at, services(name), clients(name))")
    .eq("business_id", BUSINESS_ID)
    .order("scheduled_for", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    channel: r.channel,
    toContact: r.to_contact,
    message: r.message,
    scheduledFor: new Date(r.scheduled_for),
    status: r.status,
    sentAt: r.sent_at ? new Date(r.sent_at) : null,
    clientName: r.bookings?.clients?.name ?? null,
    serviceName: r.bookings?.services?.name ?? null,
    startsAt: r.bookings?.starts_at ? new Date(r.bookings.starts_at) : null,
  }));
}
