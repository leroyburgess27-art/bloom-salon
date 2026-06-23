"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { service as fetchService, stylistsForService, availableSlots } from "@/lib/db";
import { zar, duration } from "@/lib/format";
import { useCart } from "@/lib/cart";
import type { Service, Stylist, Slot } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookPage({ params }: { params: { serviceId: string } }) {
  const router = useRouter();
  const { add } = useCart();

  const [service, setService] = useState<Service | null>(null);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [stylistId, setStylistId] = useState<string>("");
  const [date, setDate] = useState<string>(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<{ start: string; end: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [svc, sty] = await Promise.all([
        fetchService(params.serviceId),
        stylistsForService(params.serviceId),
      ]);
      if (!active) return;
      setService(svc);
      setStylists(sty);
      setStylistId(sty[0]?.id ?? "");
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [params.serviceId]);

  useEffect(() => {
    if (!stylistId) return;
    let active = true;
    setLoadingSlots(true);
    setSelected(null);
    (async () => {
      const s = await availableSlots(params.serviceId, stylistId, date);
      if (!active) return;
      setSlots(s);
      setLoadingSlots(false);
    })();
    return () => {
      active = false;
    };
  }, [params.serviceId, stylistId, date]);

  if (loading) {
    return <p className="text-gray-500">Loading…</p>;
  }

  if (!service) {
    return (
      <div>
        <p>Service not found.</p>
        <Link href="/" className="text-brand underline">Back to catalogue</Link>
      </div>
    );
  }

  const stylist = stylists.find((s) => s.id === stylistId);

  function addToCart() {
    if (!service || !stylist || !selected) return;
    add({
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      price: service.price,
      durationMinutes: service.durationMinutes,
      stylistId: stylist.id,
      stylistName: stylist.name,
      startsAt: selected.start,
      endsAt: selected.end,
    });
    router.push("/cart");
  }

  return (
    <div>
      <Link href="/" className="text-sm text-brand underline">← Back to catalogue</Link>

      <h1 className="mt-3 text-2xl font-bold">{service.name}</h1>
      <p className="text-gray-600">{service.description}</p>
      <p className="mt-1 text-sm text-gray-500">
        {duration(service.durationMinutes)} · {zar(service.price)}
      </p>

      <h2 className="mt-8 mb-3 text-lg font-semibold">1. Choose your stylist</h2>
      <div className="flex flex-wrap gap-3">
        {stylists.map((s) => (
          <button
            key={s.id}
            onClick={() => setStylistId(s.id)}
            className={`rounded-xl border px-4 py-3 text-left ${
              stylistId === s.id ? "border-brand bg-brand-light" : "bg-white"
            }`}
          >
            <div className="font-medium">{s.name}</div>
            <div className="max-w-[14rem] text-xs text-gray-500">{s.bio}</div>
          </button>
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">2. Choose a date</h2>
      <input
        type="date"
        value={date}
        min={todayISO()}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border px-3 py-2"
      />

      <h2 className="mt-8 mb-3 text-lg font-semibold">3. Choose a time</h2>
      {loadingSlots ? (
        <p className="text-gray-500">Loading times…</p>
      ) : slots.length === 0 ? (
        <p className="text-gray-500">No availability that day — the studio is closed (open Tue–Sat).</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {slots.map((slot) => {
            const label = new Date(slot.start).toLocaleTimeString("en-ZA", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const isSelected = selected?.start === slot.start;
            return (
              <button
                key={slot.start}
                disabled={!slot.available}
                onClick={() => setSelected({ start: slot.start, end: slot.end })}
                className={`rounded-lg border px-2 py-2 text-sm ${
                  !slot.available
                    ? "cursor-not-allowed bg-gray-100 text-gray-300 line-through"
                    : isSelected
                    ? "border-brand bg-brand text-white"
                    : "bg-white hover:border-brand"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={addToCart}
        disabled={!selected}
        className="mt-8 w-full rounded-xl bg-brand px-4 py-3 font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        Add to cart
      </button>
    </div>
  );
}
