"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { zar, duration } from "@/lib/format";

export default function CartPage() {
  const router = useRouter();
  const { items, remove, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/" className="mt-4 inline-block text-brand underline">
          Browse services
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Your cart</h1>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border bg-white p-4">
            <div>
              <div className="font-medium">{item.serviceName}</div>
              <div className="text-sm text-gray-600">
                with {item.stylistName} · {duration(item.durationMinutes)}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(item.startsAt).toLocaleString("en-ZA", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{zar(item.price)}</span>
              <button
                onClick={() => remove(i)}
                className="text-sm text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-lg font-bold">{zar(total)}</span>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-xl border px-4 py-3 text-center font-medium">
          Add more
        </Link>
        <button
          onClick={() => router.push("/checkout")}
          className="flex-1 rounded-xl bg-brand px-4 py-3 font-medium text-white hover:bg-brand-dark"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
