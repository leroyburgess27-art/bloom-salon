"use client";

import { useCallback, useEffect, useState } from "react";
import { allStylists, bookingsForDate, cancelBooking } from "@/lib/db";
import type { CalBooking } from "@/lib/store";
import type { Stylist } from "@/lib/types";
import { zar } from "@/lib/format";

const OPEN_HOUR = 9;
const CLOSE_HOUR = 17;
const HOUR_PX = 64;
const TOTAL_MIN = (CLOSE_HOUR - OPEN_HOUR) * 60;
const HEIGHT = (CLOSE_HOUR - OPEN_HOUR) * HOUR_PX;

function defaultOpenDateISO(): string {
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const wd = d.getDay();
    if (wd >= 2 && wd <= 6) break;
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

function minutesFromOpen(date: Date): number {
  return (date.getHours() - OPEN_HOUR) * 60 + date.getMinutes();
}

function timeLabel(d: Date): string {
  return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

export default function CalendarPage() {
  const [date, setDate] = useState<string>(defaultOpenDateISO());
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [selected, setSelected] = useState<CalBooking | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    allStylists().then(setStylists);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await bookingsForDate(date);
    setBookings(data);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const byStylist = (id: string) => bookings.filter((b) => b.stylistId === id);

  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function shiftDay(delta: number) {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  }

  async function doCancel() {
    if (!selected) return;
    await cancelBooking(selected.id);
    setSelected(null);
    await load();
  }

  const hours = Array.from({ length: CLOSE_HOUR - OPEN_HOUR + 1 }, (_, i) => OPEN_HOUR + i);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Calendar</h1>
        {loading && <span className="text-sm text-gray-400">Loading…</span>}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => shiftDay(-1)} className="rounded-lg border bg-white px-3 py-1.5 text-sm">←</button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-sm"
          />
          <button onClick={() => shiftDay(1)} className="rounded-lg border bg-white px-3 py-1.5 text-sm">→</button>
        </div>
      </div>
      <p className="mb-4 text-sm text-gray-500">{dateLabel}</p>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <div className="flex min-w-[640px]">
          <div className="w-16 shrink-0 border-r">
            <div className="h-10 border-b" />
            <div className="relative" style={{ height: HEIGHT }}>
              {hours.map((h, i) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 -translate-y-2 pr-2 text-right text-xs text-gray-400"
                  style={{ top: i * HOUR_PX }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>
          </div>

          {stylists.map((st) => (
            <div key={st.id} className="flex-1 border-r last:border-r-0">
              <div className="flex h-10 items-center justify-center border-b text-sm font-medium">
                {st.name}
              </div>
              <div className="relative" style={{ height: HEIGHT }}>
                {hours.map((h, i) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-b border-gray-100"
                    style={{ top: i * HOUR_PX }}
                  />
                ))}
                {byStylist(st.id).map((b) => (
                  <BookingBlock key={b.id} b={b} onClick={() => setSelected(b)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Open Tue–Sat, 09:00–17:00. Click any booking to view details or cancel it.
      </p>

      {selected && (
        <BookingModal booking={selected} onClose={() => setSelected(null)} onCancel={doCancel} />
      )}
    </div>
  );
}

function BookingBlock({ b, onClick }: { b: CalBooking; onClick: () => void }) {
  const top = (minutesFromOpen(b.start) / TOTAL_MIN) * HEIGHT;
  const height = ((b.end.getTime() - b.start.getTime()) / 60000 / TOTAL_MIN) * HEIGHT;

  return (
    <button
      onClick={onClick}
      className="absolute left-1 right-1 overflow-hidden rounded-md border border-brand-dark bg-brand px-2 py-1 text-left text-xs text-white transition hover:ring-2 hover:ring-brand/50"
      style={{ top, height: Math.max(height, 18) }}
      title={`${b.title} — ${b.clientName}`}
    >
      <div className="font-medium leading-tight">{b.title}</div>
      <div className="leading-tight opacity-90">
        {timeLabel(b.start)}
        {b.price > 0 ? ` · ${zar(b.price)}` : ""}
      </div>
      <div className="truncate leading-tight opacity-80">{b.clientName}</div>
    </button>
  );
}

function BookingModal({
  booking,
  onClose,
  onCancel,
}: {
  booking: CalBooking;
  onClose: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold">{booking.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Client" value={booking.clientName} />
          <Row label="Stylist" value={booking.stylistName} />
          <Row
            label="When"
            value={`${booking.start.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}, ${timeLabel(booking.start)}–${timeLabel(booking.end)}`}
          />
          {booking.price > 0 && <Row label="Price" value={zar(booking.price)} />}
          <Row label="Status" value={booking.status === "pending" ? "Awaiting confirmation" : "Confirmed"} />
        </dl>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium">
            Close
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Cancel booking
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
