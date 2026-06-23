"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { createOrder } from "@/lib/db";
import { getSettings } from "@/lib/repo";
import { zar } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

const METHOD_LABELS: Record<PaymentMethod, { label: string; hint: string }> = {
  cash: { label: "Cash", hint: "Pay in person" },
  card: { label: "Card", hint: "Debit / credit" },
  qr: { label: "QR / Scan to pay", hint: "SnapScan, Zapper" },
  eft: { label: "Instant EFT", hint: "Pay by bank" },
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, placeOrder } = useCart();
  const settings = getSettings();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center">
        <p>Your cart is empty.</p>
        <Link href="/" className="mt-3 inline-block text-brand underline">
          Browse services
        </Link>
      </div>
    );
  }

  const canSubmit = name.trim() && phone.trim() && method;

  async function submit() {
    if (!canSubmit || !method) return;
    setProcessing(true);
    setError(null);
    const details = { name, email, phone, marketingConsent: consent };
    try {
      // Persist to the database (simulated payment — no real gateway call).
      await createOrder(items, details, method, settings.paymentMode);
      placeOrder(details, method, settings.paymentMode); // local confirmation view
      router.push("/confirmation");
    } catch (e) {
      console.error(e);
      setProcessing(false);
      setError(
        "Sorry — we couldn't complete that booking. The time may have just been taken. Please go back and pick another slot.",
      );
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <section className="mb-8 rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Your details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Full name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
          <input
            placeholder="Phone *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border px-3 py-2 sm:col-span-2"
          />
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I agree to receive offers and reminders from Bloom Hair &amp; Nail Studio.
            (POPIA consent — optional.)
          </span>
        </label>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-5">
        <h2 className="mb-1 font-semibold">Payment method</h2>
        <p className="mb-4 text-sm text-gray-500">
          {settings.paymentMode === "upfront"
            ? "Pay now to confirm your booking."
            : "The salon will confirm your booking, then you pay."}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {settings.paymentMethods.map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`rounded-xl border px-3 py-4 text-center ${
                method === m ? "border-brand bg-brand-light" : "bg-white"
              }`}
            >
              <div className="font-medium">{METHOD_LABELS[m].label}</div>
              <div className="text-xs text-gray-500">{METHOD_LABELS[m].hint}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6 flex items-center justify-between rounded-xl bg-brand-light p-5">
        <span className="font-semibold">Total to pay</span>
        <span className="text-xl font-bold">{zar(total)}</span>
      </section>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={!canSubmit || processing}
        className="w-full rounded-xl bg-brand px-4 py-3 font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {processing ? "Processing…" : "Pay & confirm (simulated)"}
      </button>
      <p className="mt-3 text-center text-xs text-gray-400">
        Prototype — no real payment is taken.
      </p>
    </div>
  );
}
