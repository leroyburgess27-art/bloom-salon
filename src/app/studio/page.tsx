"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  getMyBusiness,
  studioBookingsForDate,
  cancelBooking,
  markBookingCompleted,
  type StudioBooking,
} from "@/lib/db";
import { zar } from "@/lib/format";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function StudioPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [biz, setBiz] = useState<{ businessId: string; displayName: string; slug: string } | null>(null);
  const [resolving, setResolving] = useState(true);
  const [date, setDate] = useState(todayISO());
  const [bookings, setBookings] = useState<StudioBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auth gate + resolve the logged-in user's business.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    getMyBusiness(user.id).then((b) => {
      if (!b) {
        router.replace("/join");
        return;
      }
      setBiz(b);
      setResolving(false);
    });
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!biz) return;
    setLoading(true);
    setBookings(await studioBookingsForDate(biz.businessId, date));
    setLoading(false);
  }, [biz, date]);

  useEffect(() => {
    load();
  }, [load]);

  function shiftDay(delta: number) {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  }
  async function doCancel(id: string) {
    if (!confirm("Cancel this booking?")) return;
    await cancelBooking(id);
    await load();
  }
  async function doComplete(id: string) {
    await markBookingCompleted(id);
    await load();
  }

  if (authLoading || resolving || !biz) {
    return <div className="p-10 text-center text-gray-500">Loading…</div>;
  }

  const bookingUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${biz.slug}` : "";
  function copyLink() {
    navigator.clipboard?.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const revenue = bookings.reduce((sum, b) => sum + b.price, 0);
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-gray-900 text-white">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-2 px-4 py-3">
          <span className="font-bold">{biz.displayName}</span>
          <span className="text-xs text-gray-400">Studio</span>
          <a href={`/p/${biz.slug}`} className="ml-auto text-sm text-gray-300 underline hover:text-white">
            View public page →
          </a>
          <button onClick={() => { signOut(); router.replace("/login"); }} className="text-sm text-gray-400 hover:text-white">
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 rounded-xl border bg-white p-4">
          <div className="text-sm font-medium">Your booking link</div>
          <p className="text-xs text-gray-500">Share this with clients so they can book you.</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 truncate rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs">{bookingUrl}</div>
            <button onClick={copyLink} className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <h1 className="text-lg font-bold">Your day</h1>
          {loading && <span className="text-xs text-gray-400">Loading…</span>}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => shiftDay(-1)} className="rounded-lg border bg-white px-3 py-1.5 text-sm">←</button>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border px-3 py-1.5 text-sm" />
            <button onClick={() => shiftDay(1)} className="rounded-lg border bg-white px-3 py-1.5 text-sm">→</button>
          </div>
        </div>
        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
          <span>{dateLabel}</span>
          <span>{bookings.length} booking(s) · {completedCount} done · {zar(revenue)}</span>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
            No bookings this day. Share your link to get booked.
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const done = b.status === "completed";
              return (
                <div key={b.id} className={`rounded-xl border p-4 ${done ? "bg-gray-50" : "bg-white"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className={`font-semibold ${done ? "text-gray-400 line-through" : ""}`}>
                        {b.start.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                        {"–"}
                        {b.end.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}
                        {b.title}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {b.clientName}{b.clientPhone ? ` · ${b.clientPhone}` : ""}
                      </div>
                      {b.serviceMode === "mobile" && (
                        <div className="mt-1 text-sm text-brand-dark">🚗 Mobile{b.address ? ` — ${b.address}` : ""}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{zar(b.price)}</div>
                      <span className={`text-xs ${done ? "text-gray-500" : b.status === "pending" ? "text-amber-600" : "text-green-600"}`}>
                        {done ? "Completed" : b.status === "pending" ? "Awaiting confirmation" : "Confirmed"}
                      </span>
                    </div>
                  </div>
                  {!done && (
                    <div className="mt-3 flex justify-end gap-4">
                      <button onClick={() => doComplete(b.id)} className="text-xs font-medium text-green-600 hover:underline">Mark done</button>
                      <button onClick={() => doCancel(b.id)} className="text-xs text-red-500 hover:underline">Cancel booking</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
