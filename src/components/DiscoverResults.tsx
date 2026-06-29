"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SearchPill from "@/components/SearchPill";
import ProviderCard from "@/components/ProviderCard";
import TreatmentIcon from "@/components/TreatmentIcon";
import type { TrendingProvider, ServiceCategoryRow } from "@/lib/db";

type Sort = "trending" | "rating" | "name";

export default function DiscoverResults({
  providers,
  categories,
  initialQuery,
  initialArea,
  initialTreatments,
  initialMobile,
  initialSort,
}: {
  providers: TrendingProvider[];
  categories: ServiceCategoryRow[];
  initialQuery: string;
  initialArea: string;
  initialTreatments: string[];
  initialMobile: boolean;
  initialSort: Sort;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [area, setArea] = useState(initialArea);
  const [treatments, setTreatments] = useState<string[]>(initialTreatments);
  const [mobileOnly, setMobileOnly] = useState(initialMobile);
  const [sort, setSort] = useState<Sort>(initialSort);

  function toggleTreatment(name: string) {
    setTreatments((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  }
  function clearAll() {
    setQuery("");
    setArea("");
    setTreatments([]);
    setMobileOnly(false);
  }

  // Keep the URL shareable without re-running the server fetch.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (area.trim()) params.set("area", area.trim());
    if (treatments.length) params.set("t", treatments.join(","));
    if (mobileOnly) params.set("mobile", "1");
    if (sort !== "trending") params.set("sort", sort);
    const qs = params.toString();
    window.history.replaceState(null, "", `/discover${qs ? `?${qs}` : ""}`);
  }, [query, area, treatments, mobileOnly, sort]);

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
      list.sort((x, y) => y.ratingAvg - x.ratingAvg || y.ratingCount - x.ratingCount);
    } else if (sort === "name") {
      list.sort((x, y) => x.displayName.localeCompare(y.displayName));
    }
    return list;
  }, [providers, query, area, treatments, mobileOnly, sort]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm font-medium text-gray-500 hover:text-brand">← Home</Link>
        <h1 className="mt-2 text-2xl font-bold">Find a provider</h1>
      </div>

      <SearchPill
        query={query}
        setQuery={setQuery}
        area={area}
        setArea={setArea}
        treatments={treatments}
        toggleTreatment={toggleTreatment}
        categories={categories}
      />

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">
          {filtered.length} {filtered.length === 1 ? "provider" : "providers"}
        </h2>
        <button
          onClick={() => setMobileOnly((v) => !v)}
          className={`rounded-full border px-3 py-1 text-sm ${
            mobileOnly ? "border-brand bg-brand-light text-brand-dark" : "bg-white text-gray-600"
          }`}
        >
          <span className="inline-flex items-center gap-1"><TreatmentIcon name="van" className="h-4 w-4" /> Mobile only</span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={clearAll} className="text-sm text-brand hover:underline">Clear</button>
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
    </div>
  );
}
