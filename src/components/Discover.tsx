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
  massage: "💆",
  barber: "💈",
  skincare: "🧖",
};

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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileOnly, setMobileOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("trending");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const a = area.trim().toLowerCase();
    const list = providers.filter((p) => {
      const hay = `${p.displayName} ${p.headline ?? ""} ${p.categories.join(" ")}`.toLowerCase();
      const matchesQuery = !q || hay.includes(q);
      const matchesArea = !a || (p.baseArea ?? "").toLowerCase().includes(a);
      const matchesCat = !activeCategory || p.categories.includes(activeCategory);
      const matchesMobile = !mobileOnly || p.acceptsMobile;
      return matchesQuery && matchesArea && matchesCat && matchesMobile;
    });
    if (sort === "rating") {
      list.sort((a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount);
    } else if (sort === "name") {
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return list;
  }, [providers, query, area, activeCategory, mobileOnly, sort]);

  const isFiltering = Boolean(query.trim() || area.trim() || activeCategory || mobileOnly);

  function clearAll() {
    setQuery("");
    setArea("");
    setActiveCategory(null);
    setMobileOnly(false);
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-violet-200 via-purple-100 to-pink-100">
        <div className="px-6 py-10 sm:px-10 sm:py-14">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            {BRAND_TAGLINE}
          </h1>
          <p className="mt-3 max-w-xl text-base text-gray-700 sm:text-lg">
            Independent hair, nail, brow &amp; makeup specialists across Cape Town — book direct, keep it personal.
          </p>

          {/* Search */}
          <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-white/90 p-2 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:rounded-full">
            <div className="flex flex-1 items-center gap-2 px-3">
              <span className="text-gray-400">🔍</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a provider or treatment"
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
              />
            </div>
            <div className="hidden w-px self-stretch bg-gray-200 sm:block" />
            <div className="flex flex-1 items-center gap-2 px-3">
              <span className="text-gray-400">📍</span>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Area (e.g. Sea Point)"
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
              />
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-black"
            >
              Search
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {providers.length} provider{providers.length === 1 ? "" : "s"} ready to book · 0% commission, they keep 100%
          </p>
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

      {/* Categories */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Browse treatments</h2>
        <div className="flex gap-5 overflow-x-auto pb-2">
          <CategoryChip label="All" emoji="🌿" active={!activeCategory} onClick={() => setActiveCategory(null)} />
          {categories.map((c) => (
            <CategoryChip
              key={c.slug}
              label={c.name}
              emoji={emojiFor(c.slug, c.name)}
              active={activeCategory === c.name}
              onClick={() => setActiveCategory(activeCategory === c.name ? null : c.name)}
            />
          ))}
        </div>
      </section>

      {/* Trending / results */}
      <section id="results">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">
            {isFiltering ? `Results (${filtered.length})` : "Trending providers"}
          </h2>
          <button
            onClick={() => setMobileOnly((v) => !v)}
            className={`rounded-full border px-3 py-1 text-sm ${
              mobileOnly ? "border-brand bg-brand-light text-brand-dark" : "bg-white text-gray-600"
            }`}
          >
            🚗 Mobile only
          </button>
          <div className="ml-auto flex items-center gap-2">
            {isFiltering && (
              <button onClick={clearAll} className="text-sm text-brand hover:underline">
                Clear
              </button>
            )}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-lg border bg-white px-2 py-1.5 text-sm"
              aria-label="Sort providers"
            >
              <option value="trending">Trending</option>
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
    </div>
  );
}

function CategoryChip({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex shrink-0 flex-col items-center gap-2">
      <span
        className={`flex h-[72px] w-[72px] items-center justify-center rounded-full text-2xl transition ${
          active ? "bg-brand text-white ring-2 ring-brand ring-offset-2" : "bg-brand-light"
        }`}
      >
        {emoji}
      </span>
      <span className={`text-sm ${active ? "font-semibold text-brand-dark" : "text-gray-700"}`}>{label}</span>
    </button>
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
