"use client";

import { useEffect, useState } from "react";
import {
  listServiceCategories,
  createProvider,
  type ServiceCategoryRow,
  type NewServiceInput,
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

export default function JoinPage() {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<ServiceCategoryRow[]>([]);

  // Step 1 — about
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [baseArea, setBaseArea] = useState("");
  const [acceptsMobile, setAcceptsMobile] = useState(true);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Step 2 — categories
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);

  // Step 3 — services
  const [services, setServices] = useState<NewServiceInput[]>([
    { name: "", category: "Hair", durationMinutes: 60, price: 0 },
  ]);

  // Step 4 — availability
  const [weekdays, setWeekdays] = useState<number[]>([2, 3, 4, 5, 6]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ slug: string; businessId: string } | null>(null);

  useEffect(() => {
    listServiceCategories().then(setCategories);
  }, []);

  const categoryNames = categories.length
    ? categories.map((c) => c.name)
    : ["Hair", "Nails"];

  function toggleCategory(slug: string) {
    setCategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }
  function toggleWeekday(n: number) {
    setWeekdays((prev) =>
      prev.includes(n) ? prev.filter((d) => d !== n) : [...prev, n],
    );
  }
  function updateService(i: number, patch: Partial<NewServiceInput>) {
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addService() {
    setServices((prev) => [
      ...prev,
      { name: "", category: categoryNames[0] ?? "Hair", durationMinutes: 60, price: 0 },
    ]);
  }
  function removeService(i: number) {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
  }

  const step1Valid = displayName.trim() && phone.trim();
  const step3Valid = services.length > 0 && services.every((s) => s.name.trim() && s.durationMinutes > 0);
  const step4Valid = weekdays.length > 0 && startTime < endTime;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await createProvider({
        displayName: displayName.trim(),
        headline: headline.trim() || undefined,
        bio: bio.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        baseArea: baseArea.trim() || undefined,
        acceptsMobile,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        categorySlugs: categorySlugs.length ? categorySlugs : ["hair"],
        services: services.map((s) => ({ ...s, price: Number(s.price) || 0 })),
        weekdays,
        startTime,
        endTime,
      });
      setDone(result);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Something went wrong creating your profile.");
      setSubmitting(false);
    }
  }

  if (done) {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
        <h1 className="text-2xl font-bold">You&apos;re all set, {displayName}!</h1>
        <p className="mt-2 text-gray-600">Your booking page is live. Share this link with your clients:</p>
        <div className="mt-4 rounded-lg border bg-gray-50 px-4 py-3 font-mono text-sm break-all">
          {base}/p/{done.slug}
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <a href={`/p/${done.slug}`} className="rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark">
            View my public page
          </a>
          <a href={`/studio/${done.businessId}`} className="rounded-xl border px-6 py-3 font-medium">
            Go to my dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Set up your booking page</h1>
      <p className="mt-1 text-sm text-gray-500">Step {step} of 5</p>
      <div className="mt-2 mb-6 h-1.5 w-full rounded bg-gray-100">
        <div className="h-1.5 rounded bg-brand transition-all" style={{ width: `${(step / 5) * 100}%` }} />
      </div>

      {step === 1 && (
        <section className="space-y-3">
          <h2 className="font-semibold">About you</h2>
          <Field label="Your name / business name *">
            <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Lerato — Mobile Hair" />
          </Field>
          <Field label="Headline">
            <input className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Mobile hairstylist • Cape Town" />
          </Field>
          <Field label="About you (bio)">
            <textarea className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A few lines about your experience and style." />
          </Field>
          <Field label="Photo URL (optional for now)">
            <input className="input" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Area you're based in">
            <input className="input" value={baseArea} onChange={(e) => setBaseArea(e.target.value)} placeholder="e.g. Southern Suburbs, Cape Town" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone *">
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Email">
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={acceptsMobile} onChange={(e) => setAcceptsMobile(e.target.checked)} />
            I travel to clients (mobile service)
          </label>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-3">
          <h2 className="font-semibold">What do you do?</h2>
          <p className="text-sm text-gray-500">Pick the categories you work in.</p>
          <div className="flex flex-wrap gap-2">
            {(categories.length ? categories : [{ id: "hair", name: "Hair", slug: "hair" }, { id: "nails", name: "Nails", slug: "nails" }]).map((c) => (
              <button
                key={c.slug}
                onClick={() => toggleCategory(c.slug)}
                className={`rounded-full border px-4 py-2 text-sm ${categorySlugs.includes(c.slug) ? "border-brand bg-brand-light text-brand-dark" : "bg-white"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Your services</h2>
          <p className="text-sm text-gray-500">Add the services clients can book, with price and how long they take.</p>
          {services.map((s, i) => (
            <div key={i} className="rounded-xl border bg-white p-3">
              <input className="input mb-2" placeholder="Service name (e.g. Ladies Cut)" value={s.name} onChange={(e) => updateService(i, { name: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <select className="input" value={s.category} onChange={(e) => updateService(i, { category: e.target.value })}>
                  {categoryNames.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <input className="input" type="number" min={5} step={5} value={s.durationMinutes} onChange={(e) => updateService(i, { durationMinutes: Number(e.target.value) })} placeholder="mins" />
                <input className="input" type="number" min={0} value={s.price} onChange={(e) => updateService(i, { price: Number(e.target.value) })} placeholder="R price" />
              </div>
              {services.length > 1 && (
                <button onClick={() => removeService(i)} className="mt-2 text-xs text-red-500 hover:underline">Remove</button>
              )}
            </div>
          ))}
          <button onClick={addService} className="rounded-lg border px-4 py-2 text-sm font-medium">+ Add another service</button>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-3">
          <h2 className="font-semibold">When are you available?</h2>
          <p className="text-sm text-gray-500">Pick your working days and hours. You can fine-tune later.</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <button key={d.n} onClick={() => toggleWeekday(d.n)} className={`rounded-lg border px-3 py-2 text-sm ${weekdays.includes(d.n) ? "border-brand bg-brand-light text-brand-dark" : "bg-white"}`}>
                {d.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start"><input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></Field>
            <Field label="End"><input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></Field>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Review</h2>
          <ul className="rounded-xl border bg-white p-4 text-sm">
            <li><b>{displayName}</b> — {headline || "no headline"}</li>
            <li className="text-gray-600">{baseArea || "area not set"} · {acceptsMobile ? "Mobile" : "Onsite only"}</li>
            <li className="mt-2">{services.length} service(s), {weekdays.length} working day(s)</li>
          </ul>
          {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        </section>
      )}

      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <button onClick={() => setStep((s) => s - 1)} className="rounded-xl border px-5 py-3 font-medium">Back</button>
        )}
        {step < 5 && (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={(step === 1 && !step1Valid) || (step === 3 && !step3Valid) || (step === 4 && !step4Valid)}
            className="ml-auto rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-40"
          >
            Next
          </button>
        )}
        {step === 5 && (
          <button onClick={submit} disabled={submitting} className="ml-auto rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
            {submitting ? "Creating…" : "Create my page"}
          </button>
        )}
      </div>

      <style jsx>{`
        :global(.input) {
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
