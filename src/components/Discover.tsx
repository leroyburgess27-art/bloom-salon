"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND_TAGLINE } from "@/lib/brand";
import type { ServiceCategoryRow } from "@/lib/db";
import TreatmentIcon from "@/components/TreatmentIcon";
import SearchPill from "@/components/SearchPill";

export default function Discover({
  categories,
}: {
  categories: ServiceCategoryRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [treatments, setTreatments] = useState<string[]>([]);

  function toggleTreatment(name: string) {
    setTreatments((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  }

  function search() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (area.trim()) params.set("area", area.trim());
    if (treatments.length) params.set("t", treatments.join(","));
    router.push(`/discover${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-r from-violet-200 via-purple-100 to-pink-100">
        <div className="px-6 py-10 sm:px-10 sm:py-14">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            {BRAND_TAGLINE}
          </h1>
          <p className="mt-3 max-w-xl text-base text-gray-700 sm:text-lg">
            Independent hair, nail, brow &amp; makeup specialists across Cape Town — book direct, keep it personal.
          </p>

          <div className="mt-6">
            <SearchPill
              query={query}
              setQuery={setQuery}
              area={area}
              setArea={setArea}
              treatments={treatments}
              toggleTreatment={toggleTreatment}
              categories={categories}
              onSearch={search}
              showButton
            />
          </div>

          <p className="mt-4 text-sm text-gray-600">Book direct · 0% commission — providers keep 100%.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: "find", title: "Find a pro", body: "Browse trusted local specialists by treatment and area." },
          { icon: "book", title: "Book direct", body: "Pick a service and time. No middleman, no mark-up." },
          { icon: "come", title: "They come to you", body: "Mobile pros travel to your home — or visit their studio." },
        ].map((s) => (
          <div key={s.title} className="rounded-2xl border bg-white p-5">
            <TreatmentIcon name={s.icon} className="h-8 w-8 text-brand" />
            <h3 className="mt-2 font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{s.body}</p>
          </div>
        ))}
      </section>

      {/* Provider spotlight */}
      <section className="rounded-3xl bg-brand-dark px-6 py-10 text-white sm:px-10 sm:py-12">
        <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Are you a self-care pro?</h2>
            <p className="mt-3 text-white/80">
              Get your own booking page in minutes. Keep 100% of what you earn, own your client list, and let
              clients book you directly.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link
                href="/join"
                className="inline-block rounded-xl bg-white px-6 py-3 font-semibold text-brand-dark hover:bg-gray-100"
              >
                Become a Service Provider
              </Link>
              <Link href="/for-providers" className="text-sm font-medium text-white/90 underline hover:text-white">
                See how it works →
              </Link>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-white/90">
            <li className="flex items-center gap-2"><span className="text-green-300">✓</span> Keep 100% — 0% commission, ever</li>
            <li className="flex items-center gap-2"><span className="text-green-300">✓</span> Your clients stay yours</li>
            <li className="flex items-center gap-2"><span className="text-green-300">✓</span> Mobile-friendly — set the areas you travel to</li>
            <li className="flex items-center gap-2"><span className="text-green-300">✓</span> Free to start, low flat fee to grow</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
