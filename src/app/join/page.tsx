"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  listServiceCategories,
  createProvider,
  type ServiceCategoryRow,
  type NewServiceInput,
} from "@/lib/db";
import { BRAND } from "@/lib/brand";

const WEEKDAYS = [
  { n: 1, label: "Mon" },
  { n: 2, label: "Tue" },
  { n: 3, label: "Wed" },
  { n: 4, label: "Thu" },
  { n: 5, label: "Fri" },
  { n: 6, label: "Sat" },
  { n: 0, label: "Sun" },
];

// Quick presets for the availability step.
const DAY_PRESETS: { label: string; days: number[] }[] = [
  { label: "Tue–Sat", days: [2, 3, 4, 5, 6] },
  { label: "Mon–Fri", days: [1, 2, 3, 4, 5] },
  { label: "Weekends", days: [6, 0] },
  { label: "Every day", days: [1, 2, 3, 4, 5, 6, 0] },
];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Build a clean, consistent headline from the provider's chosen categories,
// mobile flag and area — instead of free text (avoids typos / inappropriate text).
function composeHeadline(cats: string[], mobile: boolean, area: string): string {
  const list = cats.length ? cats.map((c) => c.toLowerCase()) : ["self-care"];
  const phrase =
    list.length === 1
      ? list[0]
      : `${list.slice(0, -1).join(", ")} & ${list[list.length - 1]}`;
  const head = `${mobile ? "Mobile " : ""}${phrase} specialist`;
  const title = head.charAt(0).toUpperCase() + head.slice(1);
  return area.trim() ? `${title} · ${area.trim()}` : title;
}

export default function JoinPage() {
  const { user, loading: authLoading, signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<ServiceCategoryRow[]>([]);

  // Step 0 — account (only shown when not logged in)
  const [accEmail, setAccEmail] = useState("");
  const [accPassword, setAccPassword] = useState("");
  const [accBusy, setAccBusy] = useState(false);
  const [accError, setAccError] = useState<string | null>(null);

  // Step 1 — about
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState("");
  const [acceptsMobile, setAcceptsMobile] = useState(true);
  const [clientele, setClientele] = useState<"men" | "women" | "all">("all");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [goodToKnow, setGoodToKnow] = useState("");

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
  const [bufferMinutes, setBufferMinutes] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ slug: string; businessId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    listServiceCategories().then(setCategories);
  }, []);

  // Default the public contact email to the account email.
  useEffect(() => {
    const em = user?.email;
    if (em) setEmail((prev) => prev || em);
  }, [user]);

  async function createAccount() {
    if (!accEmail.trim() || accPassword.length < 6) {
      setAccError("Enter an email and a password of at least 6 characters.");
      return;
    }
    setAccBusy(true);
    setAccError(null);
    const { error } = await signUp(accEmail.trim(), accPassword);
    if (error) {
      setAccError(error);
      setAccBusy(false);
    }
    // On success, the auth listener sets `user` and the wizard renders.
  }

  const categoryNames = categories.length
    ? categories.map((c) => c.name)
    : ["Hair", "Nails"];

  const selectedCategoryNames = categories
    .filter((c) => categorySlugs.includes(c.slug))
    .map((c) => c.name);
  const computedHeadline = composeHeadline(selectedCategoryNames, acceptsMobile, areas[0] ?? "");

  const availabilitySummary = DAY_ORDER.filter((n) => weekdays.includes(n))
    .map((n) => WEEKDAYS.find((d) => d.n === n)?.label)
    .join(", ");

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
  function addArea() {
    const v = areaInput.trim();
    if (!v) return;
    setAreas((prev) => (prev.some((a) => a.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]));
    setAreaInput("");
  }
  function removeArea(a: string) {
    setAreas((prev) => prev.filter((x) => x !== a));
  }

  const step1Valid = displayName.trim() && phone.trim();
  const step2Valid = categorySlugs.length > 0;
  const step3Valid = services.length > 0 && services.every((s) => s.name.trim() && s.durationMinutes > 0);
  const step4Valid = weekdays.length > 0 && startTime < endTime;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await createProvider({
        displayName: displayName.trim(),
        headline: computedHeadline,
        bio: bio.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        baseArea: areas.length ? areas.join(", ") : undefined,
        acceptsMobile,
        clientele,
        goodToKnow: goodToKnow.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        categorySlugs: categorySlugs.length ? categorySlugs : ["hair"],
        services: services.map((s) => ({ ...s, price: Number(s.price) || 0 })),
        weekdays,
        startTime,
        endTime,
        bufferMinutes,
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
    const url = `${base}/p/${done.slug}`;
    const shareText = `Book your appointment with me on ${BRAND}: ${url}`;
    const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    async function copyLink() {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* clipboard unavailable */
      }
    }

    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
        <h1 className="text-2xl font-bold">You&apos;re all set, {displayName}!</h1>
        <p className="mt-2 text-gray-600">Your booking page is live. Share this link with your clients:</p>

        <div className="mt-4 flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2">
          <span className="flex-1 truncate text-left font-mono text-sm">{url}</span>
          <button
            onClick={copyLink}
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-brand shadow-sm hover:bg-gray-50"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-medium text-white hover:bg-[#1da851]"
          >
            <span aria-hidden>💬</span> Share on WhatsApp
          </a>
          <a href={`/p/${done.slug}`} className="rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark">
            View my public page
          </a>
          <a href="/studio" className="rounded-xl border px-6 py-3 font-medium">
            Go to my dashboard
          </a>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Tip: pin this link to your WhatsApp status and social bios so clients can always book you.
        </p>
      </div>
    );
  }

  if (authLoading) {
    return <div className="mx-auto max-w-md px-4 py-12 text-center text-gray-500">Loading…</div>;
  }

  // Account-first: create (or log in to) an account before building the page.
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-brand">
            {BRAND}
          </Link>
          <span className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Log in
            </Link>
          </span>
        </div>

        <h1 className="text-2xl font-bold">Create your provider account</h1>
        <p className="mt-1 text-sm text-gray-600">
          Set up a free account, then build your booking page — about two minutes. No commission, ever
          — you keep 100% of what you earn.
        </p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            type="email"
            placeholder="Email"
            value={accEmail}
            onChange={(e) => setAccEmail(e.target.value)}
          />
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            type="password"
            placeholder="Password (at least 6 characters)"
            value={accPassword}
            onChange={(e) => setAccPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createAccount()}
          />
          {accError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{accError}</p>
          )}
          <button
            onClick={createAccount}
            disabled={accBusy}
            className="w-full rounded-xl bg-brand px-4 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {accBusy ? "Creating account…" : "Create account & continue"}
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          By continuing you agree to handle client data responsibly (POPIA).
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-brand">
          {BRAND}
        </Link>
        <span className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </span>
      </div>

      <h1 className="text-2xl font-bold">Set up your booking page</h1>
      <p className="mt-1 text-sm text-gray-500">Step {step} of 5</p>
      <div className="mt-2 mb-6 h-1.5 w-full rounded bg-gray-100">
        <div className="h-1.5 rounded bg-brand transition-all" style={{ width: `${(step / 5) * 100}%` }} />
      </div>

      {step === 1 && (
        <section className="space-y-3">
          <h2 className="font-semibold">About you</h2>
          <Field label="Your name *">
            <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Lerato Mokoena" maxLength={60} />
          </Field>
          <Field label="About you (bio)">
            <textarea className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A few lines about your experience and style." maxLength={300} />
          </Field>
          <Field label="Photo link (optional — uploads coming soon)">
            <input className="input" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Service areas (where you travel / are based)">
            <div className="flex gap-2">
              <input
                className="input"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addArea();
                  }
                }}
                placeholder="e.g. Sea Point — type and press Enter"
              />
              <button
                type="button"
                onClick={addArea}
                className="shrink-0 rounded-lg border px-3 text-sm font-medium"
              >
                Add
              </button>
            </div>
            {areas.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {areas.map((a) => (
                  <span
                    key={a}
                    className="flex items-center gap-1 rounded-full bg-brand-light px-3 py-1 text-sm text-brand-dark"
                  >
                    {a}
                    <button type="button" onClick={() => removeArea(a)} className="text-brand-dark/60 hover:text-brand-dark">
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
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
          <h2 className="font-semibold">Who do you serve?</h2>
          <div className="flex gap-2">
            {([
              ["all", "Everyone"],
              ["women", "Women"],
              ["men", "Men"],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setClientele(val)}
                className={`rounded-full border px-4 py-2 text-sm ${
                  clientele === val ? "border-brand bg-brand-light text-brand-dark" : "bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <h2 className="pt-2 font-semibold">What do you do?</h2>
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
          {selectedCategoryNames.length > 0 ? (
            <p className="text-sm text-gray-500">
              Your headline will read:{" "}
              <span className="font-medium text-brand-dark">{computedHeadline}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">Pick at least one to continue.</p>
          )}
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

          <Field label="Good to know (optional)">
            <textarea
              className="input"
              rows={2}
              value={goodToKnow}
              onChange={(e) => setGoodToKnow(e.target.value)}
              placeholder="Any boundaries or notes for clients — e.g. Adults only · No intimate waxing · Daylight home visits"
              maxLength={200}
            />
          </Field>
          <p className="text-xs text-gray-400">
            Tip: you only list the services you offer — anything not listed simply isn&apos;t bookable.
          </p>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold">When are you available?</h2>
            <p className="text-sm text-gray-500">Pick your working days and hours. You can fine-tune anytime in your studio.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {DAY_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setWeekdays(p.days)}
                className="rounded-full border px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-brand hover:text-brand"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <button
                key={d.n}
                onClick={() => toggleWeekday(d.n)}
                className={`h-11 w-12 rounded-lg border text-sm ${
                  weekdays.includes(d.n) ? "border-brand bg-brand-light font-medium text-brand-dark" : "bg-white"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start"><input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></Field>
            <Field label="End"><input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Travel time between appointments</p>
            <div className="flex flex-wrap gap-2">
              {[0, 15, 30, 45].map((m) => (
                <button
                  key={m}
                  onClick={() => setBufferMinutes(m)}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    bufferMinutes === m ? "border-brand bg-brand-light text-brand-dark" : "bg-white"
                  }`}
                >
                  {m === 0 ? "None" : `${m} min`}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {acceptsMobile
                ? "We'll leave this gap around your bookings so you have time to pack up and travel."
                : "We'll leave this gap around your bookings for setup and cleanup."}
            </p>
          </div>

          {step4Valid ? (
            <p className="rounded-lg bg-brand-light px-3 py-2 text-sm text-brand-dark">
              Bookable {availabilitySummary} · {startTime}–{endTime}
            </p>
          ) : (
            <p className="text-sm text-red-600">Pick at least one day, and make sure the end time is after the start.</p>
          )}
        </section>
      )}

      {step === 5 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Review your page</h2>
          <p className="text-sm text-gray-500">Check it looks right — you can edit anything later in your studio.</p>

          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-3">
              {photoUrl.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-lg font-bold text-brand">
                  {initials(displayName)}
                </div>
              )}
              <div>
                <div className="font-semibold">{displayName || "Your name"}</div>
                <div className="text-sm text-gray-600">{computedHeadline}</div>
              </div>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Service areas" value={areas.length ? areas.join(", ") : "—"} />
              <Row label="Works" value={acceptsMobile ? "Mobile — travels to clients" : "Clients come to them"} />
              <Row label="Serves" value={clientele === "all" ? "Everyone" : clientele === "men" ? "Men" : "Women"} />
              <Row label="Treatments" value={selectedCategoryNames.length ? selectedCategoryNames.join(", ") : "—"} />
              <Row label="Available" value={`${availabilitySummary || "—"} · ${startTime}–${endTime}`} />
              {bufferMinutes > 0 && <Row label="Travel time" value={`${bufferMinutes} min between bookings`} />}
            </dl>

            <div className="mt-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">Services</div>
              <ul className="mt-1 divide-y">
                {services.map((s, i) => (
                  <li key={i} className="flex items-center justify-between py-1.5 text-sm">
                    <span>
                      {s.name || "Unnamed service"}{" "}
                      <span className="text-gray-400">· {s.durationMinutes} min</span>
                    </span>
                    <span className="font-medium">{s.price ? `R${s.price}` : "—"}</span>
                  </li>
                ))}
              </ul>
            </div>

            {goodToKnow.trim() && (
              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">Good to know</div>
                <p className="mt-1 text-sm text-gray-600">{goodToKnow}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">
            You can share your booking link straight away. Your page appears in public discovery once
            it&apos;s reviewed.
          </p>

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
            disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid) || (step === 3 && !step3Valid) || (step === 4 && !step4Valid)}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-800">{value}</dd>
    </div>
  );
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
