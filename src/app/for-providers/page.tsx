import Link from "next/link";
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `For providers — ${BRAND}`,
  description: "How it works for independent self-care providers: your own booking page, keep 100%, own your clients. Free to start.",
};

function Cta({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/join"
      className={`inline-block rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark ${className}`}
    >
      Become a Service Provider
    </Link>
  );
}

export default function ForProvidersPage() {
  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-violet-200 via-purple-100 to-pink-100 px-6 py-12 sm:px-10 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-dark">For service providers</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl">
          Your own booking page. Keep 100%. Own your clients.
        </h1>
        <p className="mt-4 max-w-xl text-base text-gray-700 sm:text-lg">
          {BRAND} is built for independent hair, nail, brow, makeup &amp; beauty pros — especially those who travel to
          their clients. No commission, ever. Just a simple page clients can book in seconds.
        </p>
        <div className="mt-6">
          <Cta />
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-6 text-2xl font-bold">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { n: "1", title: "Set up your page", body: "Add your services, prices, hours and the areas you travel to. Takes a few minutes." },
            { n: "2", title: "Share your link", body: "Send your booking link on WhatsApp, Instagram or your status. Clients book in seconds — no app, no account." },
            { n: "3", title: "Get booked & build your name", body: "Manage your day, message clients, mark jobs done, and collect reviews that grow your reputation." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border bg-white p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light font-bold text-brand-dark">
                {s.n}
              </div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why it's different */}
      <section className="rounded-3xl bg-brand-dark px-6 py-10 text-white sm:px-10">
        <h2 className="text-2xl font-bold">Built to empower you — not take a cut</h2>
        <p className="mt-2 max-w-2xl text-white/80">
          Most platforms take 20% of your earnings or a slice of every new client. We don&apos;t. You keep everything
          you earn and your clients are always yours.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["0% commission, ever", "A simple flat fee — never a cut of your work."],
            ["Your clients stay yours", "Their details and history belong to you, not us."],
            ["Mobile-first", "Set the areas you travel to; clients see “comes to you.”"],
            ["Trust that's earned", "Real reviews, returning-client counts and a Verified badge."],
          ].map(([t, b]) => (
            <div key={t} className="flex gap-3">
              <span className="text-green-300">✓</span>
              <div>
                <div className="font-semibold">{t}</div>
                <div className="text-sm text-white/75">{b}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h2 className="mb-2 text-2xl font-bold">Simple pricing</h2>
        <p className="mb-6 text-gray-600">Start free. Upgrade to Pro when you want to grow — no commission either way.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border bg-white p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-bold">Free</h3>
              <div className="text-2xl font-extrabold">R0<span className="text-sm font-normal text-gray-400">/forever</span></div>
            </div>
            <p className="mt-1 text-sm text-gray-500">Everything you need to get booked. Available now.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {[
                "Your own booking page + shareable link",
                "Unlimited bookings — keep 100%, own your clients",
                "All treatments, service areas, mobile or in-studio",
                "Day / week / history views + booking management",
                "Reviews & returning-client recognition",
                "Listed in discovery once verified",
              ].map((f) => (
                <li key={f} className="flex gap-2"><span className="text-brand">✓</span>{f}</li>
              ))}
            </ul>
            <div className="mt-6">
              <Cta className="w-full text-center" />
            </div>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-2xl border-2 border-brand bg-white p-6">
            <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
              Coming soon
            </span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-bold">Pro</h3>
              <div className="text-2xl font-extrabold">R99<span className="text-sm font-normal text-gray-400">/month</span></div>
            </div>
            <p className="mt-1 text-sm text-gray-500">Everything in Free, plus tools to grow. Rolling out soon.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {[
                "Take deposits & online payments (cut no-shows)",
                "Automatic WhatsApp & email reminders",
                "Featured placement in discovery",
                "“On my way” updates + safety check-in",
                "Faster ID-verification & custom branding",
                "Earnings & returning-client analytics",
              ].map((f) => (
                <li key={f} className="flex gap-2"><span className="text-brand">✓</span>{f}</li>
              ))}
            </ul>
            <p className="mt-6 text-center text-sm text-gray-400">Start free today — upgrade to Pro when it launches.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-6 text-2xl font-bold">Questions</h2>
        <div className="space-y-3">
          {[
            ["What does it cost?", "Free to start, forever. Pro will be R99/month when it launches — and there's never any commission on your bookings."],
            ["Do you take a commission?", "No. 0% commission, ever. You keep 100% of what you charge."],
            ["Who owns my clients?", "You do. Their contact details and booking history are yours — we never charge you to reach your own clients."],
            ["Do my clients need an account?", "No. They book in seconds from your shared link — no app and no sign-up."],
            ["I travel to my clients — does that work?", "Yes. Set the areas you travel to and your page shows “comes to you,” with travel time built into your schedule."],
            ["Where is this available?", "We're starting in Cape Town for the pilot, then expanding."],
          ].map(([q, a]) => (
            <div key={q} className="rounded-xl border bg-white p-4">
              <div className="font-semibold">{q}</div>
              <p className="mt-1 text-sm text-gray-600">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-3xl border bg-white px-6 py-10 text-center sm:px-10">
        <h2 className="text-2xl font-bold">Ready to get booked?</h2>
        <p className="mt-2 text-gray-600">Set up your free page in a few minutes.</p>
        <div className="mt-6">
          <Cta />
        </div>
      </section>
    </div>
  );
}
