"use client";

import { useEffect, useMemo, useState } from "react";
import { getProviderBySlug, availableSlots, createOrder, type ProviderPublic } from "@/lib/db";
import type { Service, Slot } from "@/lib/types";
import { zar, duration } from "@/lib/format";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ProviderPage({ params }: { params: { slug: string } }) {
  const [provider, setProvider] = useState<ProviderPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Service | null>(null);

  useEffect(() => {
    getProviderBySlug(params.slug)
      .then(setProvider)
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading…</div>;
  if (!provider)
    return <div className="p-10 text-center text-gray-500">Provider not found.</div>;

  const initials = provider.displayName.charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {/* Profile header */}
      <div className="flex items-start gap-4">
        {provider.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={provider.photoUrl} alt={provider.displayName} className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-light text-2xl font-bold text-brand">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{provider.displayName}</h1>
            {provider.verificationLevel !== "none" && (
              <span title="Verified" className="text-brand">✔</span>
            )}
          </div>
          {provider.headline && <p className="text-sm text-gray-600">{provider.headline}</p>}
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
            {provider.baseArea && <span>📍 {provider.baseArea}</span>}
            {provider.acceptsMobile && <span className="rounded-full bg-brand-light px-2 py-0.5 text-brand-dark">Mobile</span>}
          </div>
        </div>
      </div>

      {/* Trust signals */}
      <div className="mt-4 flex gap-3 text-center text-sm">
        <Stat label="Rating" value={provider.stats.ratingCount ? `★ ${provider.stats.ratingAvg}` : "New"} sub={provider.stats.ratingCount ? `${provider.stats.ratingCount} reviews` : "no reviews yet"} />
        <Stat label="Returning clients" value={String(provider.stats.returningClients)} sub="who rebook" />
        <Stat label="Status" value={provider.verificationLevel === "none" ? "Unverified" : "Verified"} sub="profile" />
      </div>

      {provider.bio && <p className="mt-4 whitespace-pre-line text-sm text-gray-700">{provider.bio}</p>}

      {/* Services */}
      <h2 className="mt-8 mb-3 text-lg font-semibold">Book a service</h2>
      {provider.servicesByCategory.length === 0 && (
        <p className="text-sm text-gray-500">No services listed yet.</p>
      )}
      {provider.servicesByCategory.map((group) => (
        <div key={group.category} className="mb-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">{group.category}</h3>
          <div className="space-y-2">
            {group.items.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="flex w-full items-center justify-between rounded-xl border bg-white p-4 text-left hover:border-brand"
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">{duration(s.durationMinutes)} · {zar(s.price)}</div>
                </div>
                <span className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white">Book</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <BookingModal
          provider={provider}
          service={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex-1 rounded-xl border bg-white p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-base font-bold">{value}</div>
      <div className="text-[11px] text-gray-400">{sub}</div>
    </div>
  );
}

function BookingModal({
  provider,
  service,
  onClose,
}: {
  provider: ProviderPublic;
  service: Service;
  onClose: () => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState<{ start: string; end: string } | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState(false);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider.stylistId) return;
    let active = true;
    setLoadingSlots(true);
    setSlot(null);
    availableSlots(service.id, provider.stylistId, date).then((s) => {
      if (active) {
        setSlots(s);
        setLoadingSlots(false);
      }
    });
    return () => {
      active = false;
    };
  }, [service.id, provider.stylistId, date]);

  const canSubmit = name.trim() && phone.trim() && slot && (!mobile || address.trim());

  async function submit() {
    if (!canSubmit || !slot || !provider.stylistId) return;
    setSubmitting(true);
    setError(null);
    try {
      await createOrder(
        [{
          serviceId: service.id,
          serviceName: service.name,
          category: service.category,
          price: service.price,
          durationMinutes: service.durationMinutes,
          stylistId: provider.stylistId,
          stylistName: provider.displayName,
          startsAt: slot.start,
          endsAt: slot.end,
        }],
        { name, email: "", phone, marketingConsent: false },
        "cash",
        "upfront",
        provider.businessId,
        mobile ? "mobile" : "onsite",
        mobile ? address : undefined,
      );
      setDone(true);
    } catch (e: any) {
      console.error(e);
      setError("Couldn't complete that booking — the time may have just been taken. Try another.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl">✓</div>
            <h2 className="text-lg font-bold">Booking confirmed!</h2>
            <p className="mt-1 text-sm text-gray-600">
              {service.name} with {provider.displayName} on{" "}
              {new Date(slot!.start).toLocaleString("en-ZA", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.
            </p>
            <button onClick={onClose} className="mt-5 rounded-xl bg-brand px-6 py-2.5 font-medium text-white">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{service.name}</h2>
                <p className="text-sm text-gray-500">{duration(service.durationMinutes)} · {zar(service.price)}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <label className="mt-4 block text-sm font-medium">Date</label>
            <input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />

            <label className="mt-4 block text-sm font-medium">Time</label>
            {loadingSlots ? (
              <p className="mt-1 text-sm text-gray-500">Loading times…</p>
            ) : slots.length === 0 ? (
              <p className="mt-1 text-sm text-gray-500">Not available that day.</p>
            ) : (
              <div className="mt-1 grid grid-cols-4 gap-2">
                {slots.map((s) => {
                  const label = new Date(s.start).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
                  const sel = slot?.start === s.start;
                  return (
                    <button key={s.start} disabled={!s.available} onClick={() => setSlot({ start: s.start, end: s.end })}
                      className={`rounded-lg border px-1 py-2 text-sm ${!s.available ? "cursor-not-allowed bg-gray-100 text-gray-300 line-through" : sel ? "border-brand bg-brand text-white" : "bg-white hover:border-brand"}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <input placeholder="Your name *" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
              <input placeholder="Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
            </div>

            {provider.acceptsMobile && (
              <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={mobile} onChange={(e) => setMobile(e.target.checked)} />
                I&apos;d like {provider.displayName} to come to me (mobile)
              </label>
            )}
            {mobile && (
              <input placeholder="Your address *" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" />
            )}

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button onClick={submit} disabled={!canSubmit || submitting}
              className="mt-5 w-full rounded-xl bg-brand px-4 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-40">
              {submitting ? "Booking…" : "Confirm booking"}
            </button>
            <p className="mt-2 text-center text-xs text-gray-400">Pay {provider.displayName} in person. No payment taken online.</p>
          </>
        )}
      </div>
    </div>
  );
}
