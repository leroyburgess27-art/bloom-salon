"use client";

import { useCallback, useEffect, useState } from "react";
import { listReminders, runReminderEngine, type ReminderRow } from "@/lib/reminders";

export default function AdminReminders() {
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setReminders(await listReminders());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runNow() {
    setRunning(true);
    setNote(null);
    try {
      const { generated, sent } = await runReminderEngine();
      setNote(`Generated ${generated} new reminder(s), sent ${sent} due reminder(s).`);
      await load();
    } catch (e) {
      console.error(e);
      setNote("Something went wrong running the engine — check the console.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reminders</h1>
          <p className="text-sm text-gray-500">
            Appointment reminders, 24h before. Email goes live with a provider key; WhatsApp is simulated for now.
          </p>
        </div>
        <button
          onClick={runNow}
          disabled={running}
          className="ml-auto rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {running ? "Running…" : "Run reminders now"}
        </button>
      </div>

      {note && (
        <p className="mb-4 rounded-lg bg-brand-light px-4 py-2 text-sm text-brand-dark">{note}</p>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 font-medium">To</th>
              <th className="px-4 py-2 font-medium">Appointment</th>
              <th className="px-4 py-2 font-medium">Send at</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reminders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  {loading ? "Loading…" : "No reminders yet. Make a booking, then click “Run reminders now”."}
                </td>
              </tr>
            ) : (
              reminders.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 capitalize">{r.channel}</td>
                  <td className="px-4 py-2">{r.toContact ?? "—"}</td>
                  <td className="px-4 py-2">
                    <div>{r.serviceName ?? "—"} · {r.clientName ?? "—"}</div>
                    <div className="text-xs text-gray-500">
                      {r.startsAt
                        ? r.startsAt.toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {r.scheduledFor.toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={r.status} channel={r.channel} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        “Simulated” means the message was prepared and logged but not actually sent — no cost, no provider needed.
        Email becomes real when a Resend API key is configured on the server; WhatsApp when the Meta Business API is connected.
      </p>
    </div>
  );
}

function StatusBadge({ status, channel }: { status: string; channel: string }) {
  const label =
    status === "simulated"
      ? `Simulated${channel === "whatsapp" ? " (WhatsApp)" : ""}`
      : status.charAt(0).toUpperCase() + status.slice(1);
  const cls =
    status === "sent"
      ? "bg-green-100 text-green-700"
      : status === "failed"
      ? "bg-red-100 text-red-700"
      : status === "scheduled"
      ? "bg-gray-100 text-gray-600"
      : "bg-amber-100 text-amber-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
}
