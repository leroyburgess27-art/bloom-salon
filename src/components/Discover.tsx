"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BRAND_TAGLINE } from "@/lib/brand";
import type { TrendingProvider, ServiceCategoryRow } from "@/lib/db";

const CATEGORY_EMOJI: Record<string, string> = {
  hair: "💇",
  nails: "💅",
  brows: "✨",
  makeup: "💄",
  lashes: "👁️",
  waxing: "🍯",
  braiding: "🪢",
  barber: "💈",
  skincare: "🧴",
  facials: "🧖",
  shaving: "🪒",
  massage: "💆",
};

const CAPE_TOWN_AREAS = [
  "Sea Point", "Green Point", "Mouille Point", "City Bowl (CBD)", "Gardens", "Tamboerskloof",
  "Vredehoek", "Oranjezicht", "Bo-Kaap", "Woodstock", "Salt River", "Observatory",
  "Mowbray", "Rosebank", "Rondebosch", "Newlands", "Claremont", "Kenilworth",
  "Wynberg", "Plumstead", "Bishopscourt", "Constantia", "Tokai", "Bergvliet",
  "Camps Bay", "Clifton", "Bantry Bay", "Hout Bay", "Llandudno",
  "Muizenberg", "Kalk Bay", "Fish Hoek", "Noordhoek", "Simon's Town",
  "Pinelands", "Athlone", "Lansdowne", "Grassy Park", "Retreat", "Heathfield", "Lotus River", "Strandfontein", "Milnerton",
  "Table View", "Bloubergstrand", "Century City", "Parklands",
  "Bellville", "Durbanville", "Parow", "Goodwood", "Brackenfell", "Kuils River",
  "Khayelitsha", "Mitchells Plain", "Gugulethu", "Langa",
  "Atlantic Seaboard", "Southern Suburbs", "Northern Suburbs",
];

type Sort = "trending" | "rating" | "name";

function emojiFor(slug: string, name: string): string {
  return CATEGORY_EMOJI[slug] ?? CATEGORY_EMOJI[name.toLowerCase()] ?? "🌸";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Discover({
  providers,
  categories,
}: {
  providers: TrendingProvider[];
  categories: ServiceCategoryRow[];
}) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [treatments, setTreatments] = useState<string[]>([]);
  const [treatOpen, setTreatOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [mobileOnly, setMobileOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("trending");

  function toggleTreatment(name: string) {
    setTreatments((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  }
  function scrollToResults() {
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
  }

  const isFiltering = Boolean(query.trim() || area.trim() || treatments.length || mobileOnly);

  const areaMatches = useMemo(() => {
    const q = area.trim().toLowerCase();
    const base = q ? CAPE_TOWN_AREAS.filter((s) => s.toLowerCase().includes(q)) : CAPE_TOWN_AREAS;
    // hide if the input already exactly equals the only match
    if (base.length === 1 && base[0].toLowerCase() === q) return [];
    return base.slice(0, 8);
  }, [area]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const a = area.trim().toLowerCase();
    const list = providers.filter((p) => {
      const matchesName =
        !q || p.displayName.toLowerCase().includes(q) || (p.headline ?? "").toLowerCase().includes(q);
      const matchesArea = !a || (p.baseArea ?? "").toLowerCase().includes(a);
      const matchesTreat = treatments.length === 0 || p.categories.some((c) => treatments.includes(c));
      const matchesMobile = !mobileOnly || p.acceptsMobile;
      return matchesName && matchesArea && matchesTreat && matchesMobile;
    });
    if (sort === "rating") {
      list.sort((a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount);
    } else if (sort === "name") {
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return list;
  }, [providers, query, area, treatments, mobileOnly, sort]);

  function clearAll() {
    setQuery("");
    setArea("");
    setTreatments([]);
    setMobileOnly(false);
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

          {/* Search */}
          <div className="relative mt-6 rounded-2xl bg-white/90 p-2 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Provider search */}
              <div className="flex flex-1 items-center gap-2 px-3">
                <span className="text-gray-400">🔍</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search a provider"
                  className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                />
              </div>

              <div className="hidden w-px self-stretch bg-gray-200 sm:block" />

              {/* Treatments dropdown */}
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setTreatOpen((o) => !o)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                >
                  <span className="text-gray-400">🧖</span>
                  <span className={`flex-1 ${treatments.length ? "text-gray-900" : "text-gray-400"}`}>
                    {treatments.length ? `${treatments.length} treatment${treatments.length > 1 ? "s" : ""}` : "All treatments"}
                  </span>
                  <span className="text-gray-400">▾</span>
                </button>
                {treatOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setTreatOpen(false)} />
                    <div className="absolute left-0 top-full z-40 mt-1 max-h-72 w-64 overflow-y-auto rounded-xl border bg-white p-1 text-left shadow-lg">
                      {categories.map((c) => {
                        const sel = treatments.includes(c.name);
                        return (
                          <button
                            key={c.slug}
                            type="button"
                            onClick={() => toggleTreatment(c.name)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                              sel ? "bg-brand-light" : ""
                            }`}
                          >
                            <span className="text-lg">{emojiFor(c.slug, c.name)}</span>
                            <span className="flex-1">{c.name}</span>
                            {sel && <span className="text-brand">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="hidden w-px self-stretch bg-gray-200 sm:block" />

              {/* Area with suggestions */}
              <div className="relative flex flex-1 items-center gap-2 px-3">
                <span className="text-gray-400">📍</span>
                <input
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    setAreaOpen(true);
                  }}
                  onFocus={() => setAreaOpen(true)}
                  placeholder="Area (e.g. Sea Point)"
                  className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                />
                {areaOpen && areaMatches.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setAreaOpen(false)} />
                    <div className="absolute left-0 top-full z-40 mt-1 max-h-64 w-64 overflow-y-auto rounded-xl border bg-white p-1 text-left shadow-lg">
                      {areaMatches.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setArea(s);
                            setAreaOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <span className="text-gray-400">📍</span>
                          <span>{s}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={scrollToResults}
                className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-black"
              >
                Search
              </button>
            </div>

            {/* Selected treatment chips */}
            {treatments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 px-3 pb-1">
                {treatments.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-brand-light px-3 py-1 text-sm text-brand-dark">
                    {t}
                    <button onClick={() => toggleTreatment(t)} className="text-brand-dark/60 hover:text-brand-dark">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="mt-4 text-sm text-gray-600">Book direct · 0% commission — providers keep 100%.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: "🔎", title: "Find a pro", body: "Browse trusted local specialists by treatment and area." },
          { icon: "📅", title: "Book direct", body: "Pick a service and time. No middleman, no mark-up." },
          { icon: "🚗", title: "They come to you", body: "Mobile pros travel to your home — or visit their studio." },
        ].map((s) => (
          <div key={s.title} className="rounded-2xl border bg-white p-5">
            <div className="text-2xl">{s.icon}</div>
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

      {/* Results (only when actively searching) */}
      {isFiltering && (
        <section id="results">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">Results ({filtered.length})</h2>
            <button
              onClick={() => setMobileOnly((v) => !v)}
              className={`rounded-full border px-3 py-1 text-sm ${
                mobileOnly ? "border-brand bg-brand-light text-brand-dark" : "bg-white text-gray-600"
              }`}
            >
              🚗 Mobile only
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={clearAll} className="text-sm text-brand hover:underline">
                Clear
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-lg border bg-white px-2 py-1.5 text-sm"
                aria-label="Sort providers"
              >
                <option value="trending">Best match</option>
                <option value="rating">Top rated</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-gray-500">
              No providers match that search yet. Try a different treatment or area.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProviderCard key={p.businessId} p={p} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ProviderCard({ p }: { p: TrendingProvider }) {
  return (
    <Link
      href={`/p/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-40 w-full overflow-hidden bg-brand-light">
        {p.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.photoUrl}
            alt={p.displayName}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-brand">
            {initials(p.displayName)}
          </div>
        )}
        {p.acceptsMobile && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm">
            🚗 Mobile
          </span>
        )}
        {p.verificationLevel !== "none" && (
          <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white shadow-sm">
            ✓ {p.verificationLevel === "id" ? "ID verified" : "Verified"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{p.displayName}</h3>
          {p.ratingCount > 0 ? (
            <span className="shrink-0 text-sm font-medium text-gray-700">
              ★ {p.ratingAvg.toFixed(1)} <span className="text-gray-400">({p.ratingCount})</span>
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              New
            </span>
          )}
        </div>
        {p.headline && <p className="mt-0.5 text-sm text-gray-600">{p.headline}</p>}
        {p.baseArea && <p className="mt-1 text-xs text-gray-500">📍 {p.baseArea}</p>}
        {p.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.categories.map((c) => (
              <span key={c} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
