"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { zar } from "@/lib/format";

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  qr: "QR / Scan to pay",
  eft: "Instant EFT",
};

export default function ConfirmationPage() {
  const { lastOrder } = useCart();

  if (!lastOrder) {
    return (
      <div className="text-center">
        <p>No recent booking found.</p>
        <Link href="/" className="mt-3 inline-block text-brand underline">
          Back to catalogue
        </Link>
      </div>
    );
  }

  const confirmed = lastOrder.paymentMode === "upfront";

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
        ✓
      </div>
      <h1 className="text-2xl font-bold">
        {confirmed ? "Booking confirmed!" : "Booking received!"}
      </h1>
      <p className="mt-2 text-gray-600">
        {confirmed
          ? "Your appointment is booked. We've noted your payment method."
          : "The salon will confirm shortly, then your payment will be collected."}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Reference <span className="font-mono font-semibold">{lastOrder.ref}</span>
      </p>

      <div className="mt-6 space-y-3 text-left">
        {lastOrder.items.map((item, i) => (
          <div key={i} className="rounded-xl border bg-white p-4">
            <div className="font-medium">{item.serviceName}</div>
            <div className="text-sm text-gray-600">with {item.stylistName}</div>
            <div className="text-sm text-gray-500">
              {new Date(item.startsAt).toLocaleString("en-ZA", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-light p-4 text-left">
        <div>
          <div className="text-sm text-gray-600">
            Payment: {METHOD_LABEL[lastOrder.method] ?? lastOrder.method}
          </div>
          <div className="text-sm text-gray-600">For: {lastOrder.details.name}</div>
        </div>
        <span className="text-lg font-bold">{zar(lastOrder.total)}</span>
      </div>

      <Link
        href="/"
        className="mt-8 inline-block rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark"
      >
        Book another
      </Link>
    </div>
  );
}
