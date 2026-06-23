"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bookingsForDate, upcomingBookings } from "@/lib/db";
import type { CalBooking } from "@/lib/store";
import { zar } from "@/lib/format";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminDashboard() {
  const today = todayISO();
  const [todays, setTodays] = useState<CalBooking[]>([]);
  const [upcoming, setUpcoming] = useState<CalBooking[]>([]);

  useEffect(() => {
    bookingsForDate(today).then(setTodays);
    upcomingBookings(6).then(setUpcoming);
  }, [today]);

  const revenueToday = todays.reduce((sum, b) => sum + b.price, 0);

  const todayLabel = new Date(`${today}T00:00:00`).toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">{todayLabel}</p>
        </div>
        <Link href="/admin/calendar" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          Open calendar
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Appointments today" value={String(todays.length)} />
        <Kpi label="Revenue today" value={zar(revenueToday)} />
        <Kpi label="Upcoming bookings" value={String(upcoming.length)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold">Today&apos;s schedule</h2>
          {todays.length === 0 ? (
            <p className="text-sm text-gray-500">No appointments today (open Tue–Sat).</p>
          ) : (
            <ul className="divide-y">
              {todays.map((b) => (
                <li key={b.id} className="flex justify-between py-2 text-sm">
                  <span>
                    {b.start.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    <span className="font-medium">{b.title}</span>
                  </span>
                  <span className="text-gray-500">{b.stylistName}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold">Upcoming bookings</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">
              None yet. Make a booking on the storefront to see it here.
            </p>
          ) : (
            <ul className="divide-y">
              {upcoming.map((b) => (
                <li key={b.id} className="flex justify-between py-2 text-sm">
                  <span>
                    <span className="font-medium">{b.title}</span> — {b.clientName}
                  </span>
                  <span className="text-gray-500">
                    {b.start.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}{" "}
                    {b.start.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
