"use client";

import { useState } from "react";
import { getSettings, getBusiness } from "@/lib/repo";
import type { PaymentMethod } from "@/lib/types";

const ALL_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "qr", label: "QR / Scan to pay" },
  { id: "eft", label: "Instant EFT" },
];

export default function AdminSettings() {
  const business = getBusiness();
  const initial = getSettings();

  const [paymentMode, setPaymentMode] = useState(initial.paymentMode);
  const [methods, setMethods] = useState<PaymentMethod[]>(initial.paymentMethods);
  const [mobile, setMobile] = useState(initial.mobileEnabled);

  function toggleMethod(m: PaymentMethod) {
    setMethods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Settings</h1>
      <p className="mb-6 text-sm text-gray-500">
        {business.name} · {business.address}
      </p>

      <div className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800">
        Prototype: changes here are for demonstration and reset on reload. Persistence
        arrives when the database is connected.
      </div>

      {/* Payment timing */}
      <section className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-semibold">Payment timing</h2>
        <label className="flex items-center gap-2 py-1 text-sm">
          <input
            type="radio"
            checked={paymentMode === "upfront"}
            onChange={() => setPaymentMode("upfront")}
          />
          Pay upfront — client pays to confirm the booking
        </label>
        <label className="flex items-center gap-2 py-1 text-sm">
          <input
            type="radio"
            checked={paymentMode === "confirm_first"}
            onChange={() => setPaymentMode("confirm_first")}
          />
          Confirm first — salon confirms, then the client pays
        </label>
      </section>

      {/* Payment methods */}
      <section className="mt-4 rounded-xl border bg-white p-5">
        <h2 className="mb-1 font-semibold">Accepted payment methods</h2>
        <p className="mb-3 text-sm text-gray-500">
          Shown to clients at checkout. No single default — clients choose.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ALL_METHODS.map((m) => (
            <label key={m.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={methods.includes(m.id)}
                onChange={() => toggleMethod(m.id)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </section>

      {/* Mobile add-on */}
      <section className="mt-4 rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Mobile service add-on</h2>
            <p className="text-sm text-gray-500">
              Let stylists travel to clients (geo-locked). Off for this prototype.
            </p>
          </div>
          <button
            onClick={() => setMobile((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition ${
              mobile ? "bg-brand" : "bg-gray-300"
            }`}
            aria-label="Toggle mobile service"
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
                mobile ? "left-[1.45rem]" : "left-0.5"
              }`}
            />
          </button>
        </div>
        {mobile && (
          <p className="mt-3 rounded-md bg-brand-light px-3 py-2 text-sm text-brand-dark">
            When enabled, you&apos;d define service areas (geo-lock) and travel-time
            buffers. The booking flow and schema already support this — it&apos;s just
            switched off for the prototype.
          </p>
        )}
      </section>
    </div>
  );
}
