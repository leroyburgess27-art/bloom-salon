"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  getMyBusiness,
  getProviderForEdit,
  updateProviderProfile,
  updateAvailability,
  saveService,
  removeService,
  type ProviderEditData,
  type ProviderEditService,
} from "@/lib/db";

const WEEKDAYS = [
  { n: 1, label: "Mon" },
  { n: 2, label: "Tue" },
  { n: 3, label: "Wed" },
  { n: 4, label: "Thu" },
  { n: 5, label: "Fri" },
  { n: 6, label: "Sat" },
  { n: 0, label: "Sun" },
];

type EditService = ProviderEditService & { _new?: boolean };

export default function StudioEditPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [biz, setBiz] = useState<{ businessId: string; slug: string } | null>(null);
  const [data, setData] = useState<ProviderEditData | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState("");
  const [acceptsMobile, setAcceptsMobile] = useState(true);
  const [clientele, setClientele] = useState<"men" | "women" | "all">("all");
  const [goodToKnow, setGoodToKnow] = useState("");

  // Services
  const [services, setServices] = useState<EditService[]>([]);

  // Availability
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [bufferMinutes, setBufferMinutes] = useState(0);

  const [msg, setMsg] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

  const hydrate = useCallback((d: ProviderEditData) => {
    setData(d);
    setBio(d.bio ?? "");
    setPhotoUrl(d.photoUrl ?? "");
    setAreas(d.baseArea ? d.baseArea.split(",").map((a) => a.trim()).filter(Boolean) : []);
    setAcceptsMobile(d.acceptsMobile);
    setClientele(d.clientele);
    setGoodToKnow(d.goodToKnow ?? "");
    setServices(d.services);
    setWeekdays(d.weekdays);
    setStartTime(d.startTime);
    setEndTime(d.endTime);
    setBufferMinutes(d.bufferMinutes);
  }, []);

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
      setBiz({ businessId: b.businessId, slug: b.slug });
      getProviderForEdit(b.businessId).then((d) => {
        if (d) hydrate(d);
        setLoading(false);
      });
    });
  }, [authLoading, user, router, hydrate]);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(null), 2500);
  }
  async function reload() {
    if (!biz) return;
    const d = await getProviderForEdit(biz.businessId);
    if (d) hydrate(d);
  }

  async function saveProfile() {
    if (!biz) return;
    setSavingProfile(true);
    try {
      await updateProviderProfile(biz.businessId, {
        bio: bio.trim() || null,
        photoUrl: photoUrl.trim() || null,
        baseArea: areas.length ? areas.join(", ") : null,
        acceptsMobile,
        clientele,
        goodToKnow: goodToKnow.trim() || null,
      });
      flash("Profile saved.");
    } catch {
      flash("Couldn't save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveAvailability() {
    if (!biz || !data?.stylistId) return;
    setSavingAvail(true);
    try {
      await updateAvailability(biz.businessId, data.stylistId, weekdays, startTime, endTime, bufferMinutes);
      flash("Availability saved.");
    } catch {
      flash("Couldn't save availability.");
    } finally {
      setSavingAvail(false);
    }
  }

  async function saveOneService(i: number) {
    if (!biz) return;
    const s = services[i];
    if (!s.name.trim() || s.durationMinutes <= 0) {
      flash("Service needs a name and duration.");
      return;
    }
    try {
      await saveService(biz.businessId, data?.stylistId ?? null, {
        id: s._new ? undefined : s.id,
        name: s.name.trim(),
        category: s.category,
        durationMinutes: s.durationMinutes,
        price: Number(s.price) || 0,
        acceptsMobile,
      });
      await reload();
      flash("Service saved.");
    } catch {
      flash("Couldn't save service.");
    }
  }
  async function deleteOneService(i: number) {
    const s = services[i];
    if (s._new) {
      setServices((prev) => prev.filter((_, idx) => idx !== i));
      return;
    }
    if (!confirm("Remove this service?")) return;
    try {
      await removeService(s.id);
      await reload();
    } catch {
      flash("Couldn't remove service.");
    }
  }
  function updateSvc(i: number, patch: Partial<EditService>) {
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addSvc() {
    const cat = data?.categoryNames[0] ?? "Hair";
    setServices((prev) => [...prev, { id: `new-${Date.now()}`, name: "", category: cat, durationMinutes: 60, price: 0, _new: true }]);
  }

  function toggleWeekday(n: number) {
    setWeekdays((prev) => (prev.includes(n) ? prev.filter((d) => d !== n) : [...prev, n]));
  }
  function addArea() {
    const v = areaInput.trim();
    if (!v) return;
    setAreas((prev) => (prev.some((a) => a.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]));
    setAreaInput("");
  }

  if (authLoading || loading || !biz || !data) {
    return <div className="p-10 text-center text-gray-500">Loading…</div>;
  }

  const categoryNames = data.categoryNames.length ? data.categoryNames : ["Hair", "Nails"];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-dark text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <a href="/studio" className="text-sm text-white/80 hover:text-white">← Studio</a>
          <span className="ml-2 text-lg font-bold">Edit your page</span>
          <a href={`/p/${biz.slug}`} className="ml-auto text-sm text-white/80 underline hover:text-white">
            View public page →
          </a>
        </div>
      </header>

      {msg && (
        <div className="sticky top-0 z-10 bg-brand-light px-4 py-2 text-center text-sm text-brand-dark">{msg}</div>
      )}

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Profile */}
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-1 text-lg font-bold">Profile</h2>
          <p className="mb-4 text-xs text-gray-500">
            Headline is auto-generated from your treatments{data.headline ? `: “${data.headline}”` : ""}.
          </p>
          <div className="space-y-3">
            <Field label="Photo link (optional)">
              <input className="inp" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="About you (bio)">
              <textarea className="inp" rows={3} maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>
            <Field label="Service areas">
              <div className="flex gap-2">
                <input
                  className="inp"
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addArea();
                    }
                  }}
                  placeholder="e.g. Sea Point — Enter to add"
                />
                <button type="button" onClick={addArea} className="shrink-0 rounded-lg border px-3 text-sm font-medium">Add</button>
              </div>
              {areas.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {areas.map((a) => (
                    <span key={a} className="flex items-center gap-1 rounded-full bg-brand-light px-3 py-1 text-sm text-brand-dark">
                      {a}
                      <button type="button" onClick={() => setAreas((prev) => prev.filter((x) => x !== a))} className="text-brand-dark/60 hover:text-brand-dark">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Who do you serve?">
              <div className="flex gap-2">
                {([["all", "Everyone"], ["women", "Women"], ["men", "Men"]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setClientele(val)}
                    className={`rounded-full border px-4 py-2 text-sm ${clientele === val ? "border-brand bg-brand-light text-brand-dark" : "bg-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Good to know (optional)">
              <textarea className="inp" rows={2} maxLength={200} value={goodToKnow} onChange={(e) => setGoodToKnow(e.target.value)} placeholder="e.g. Adults only · No intimate waxing" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={acceptsMobile} onChange={(e) => setAcceptsMobile(e.target.checked)} />
              I travel to clients (mobile service)
            </label>
          </div>
          <button onClick={saveProfile} disabled={savingProfile} className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50">
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </section>

        {/* Services */}
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-lg font-bold">Services &amp; prices</h2>
          <div className="space-y-3">
            {services.map((s, i) => (
              <div key={s.id} className="rounded-xl border p-3">
                <input className="inp mb-2" placeholder="Service name" value={s.name} onChange={(e) => updateSvc(i, { name: e.target.value })} />
                <div className="grid grid-cols-3 gap-2">
                  <select className="inp" value={s.category} onChange={(e) => updateSvc(i, { category: e.target.value })}>
                    {categoryNames.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <input className="inp" type="number" min={5} step={5} value={s.durationMinutes} onChange={(e) => updateSvc(i, { durationMinutes: Number(e.target.value) })} placeholder="mins" />
                  <input className="inp" type="number" min={0} value={s.price} onChange={(e) => updateSvc(i, { price: Number(e.target.value) })} placeholder="R price" />
                </div>
                <div className="mt-2 flex items-center gap-4">
                  <button onClick={() => saveOneService(i)} className="text-xs font-medium text-brand hover:underline">Save</button>
                  <button onClick={() => deleteOneService(i)} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addSvc} className="mt-3 rounded-lg border px-4 py-2 text-sm font-medium">+ Add a service</button>
        </section>

        {/* Availability */}
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-lg font-bold">Availability</h2>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <button key={d.n} onClick={() => toggleWeekday(d.n)} className={`h-11 w-12 rounded-lg border text-sm ${weekdays.includes(d.n) ? "border-brand bg-brand-light font-medium text-brand-dark" : "bg-white"}`}>
                {d.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Start"><input className="inp" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></Field>
            <Field label="End"><input className="inp" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></Field>
          </div>
          <div className="mt-3">
            <p className="mb-2 text-sm font-medium text-gray-700">Travel time between appointments</p>
            <div className="flex flex-wrap gap-2">
              {[0, 15, 30, 45].map((m) => (
                <button key={m} onClick={() => setBufferMinutes(m)} className={`rounded-full border px-4 py-2 text-sm ${bufferMinutes === m ? "border-brand bg-brand-light text-brand-dark" : "bg-white"}`}>
                  {m === 0 ? "None" : `${m} min`}
                </button>
              ))}
            </div>
          </div>
          <button onClick={saveAvailability} disabled={savingAvail || weekdays.length === 0 || startTime >= endTime} className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50">
            {savingAvail ? "Saving…" : "Save availability"}
          </button>
        </section>
      </div>

      <style jsx>{`
        :global(.inp) {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
