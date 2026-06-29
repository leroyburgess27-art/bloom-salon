"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TreatmentIcon from "@/components/TreatmentIcon";
import type { ServiceCategoryRow } from "@/lib/db";

export const CAPE_TOWN_AREAS = [
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

export default function SearchPill({
  query,
  setQuery,
  area,
  setArea,
  treatments,
  toggleTreatment,
  categories,
  onSearch,
  showButton = false,
  buttonLabel = "Search",
}: {
  query: string;
  setQuery: (v: string) => void;
  area: string;
  setArea: (v: string) => void;
  treatments: string[];
  toggleTreatment: (name: string) => void;
  categories: ServiceCategoryRow[];
  onSearch?: () => void;
  showButton?: boolean;
  buttonLabel?: string;
}) {
  const [treatOpen, setTreatOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const treatRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!treatOpen && !areaOpen) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (treatRef.current && !treatRef.current.contains(t)) setTreatOpen(false);
      if (areaRef.current && !areaRef.current.contains(t)) setAreaOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [treatOpen, areaOpen]);

  const areaMatches = useMemo(() => {
    const q = area.trim().toLowerCase();
    const base = q ? CAPE_TOWN_AREAS.filter((s) => s.toLowerCase().includes(q)) : CAPE_TOWN_AREAS;
    if (base.length === 1 && base[0].toLowerCase() === q) return [];
    return base.slice(0, 8);
  }, [area]);

  return (
    <div className="relative rounded-2xl bg-white/90 p-2 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Provider search */}
        <div className="flex flex-1 items-center gap-2 px-3">
          <TreatmentIcon name="search" className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
            placeholder="Search a provider"
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="hidden w-px self-stretch bg-gray-200 sm:block" />

        {/* Treatments dropdown */}
        <div ref={treatRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => setTreatOpen((o) => !o)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
          >
            <TreatmentIcon name="sparkles" className="h-4 w-4 shrink-0 text-gray-400" />
            <span className={`flex-1 ${treatments.length ? "text-gray-900" : "text-gray-400"}`}>
              {treatments.length ? `${treatments.length} treatment${treatments.length > 1 ? "s" : ""}` : "All treatments"}
            </span>
            <span className="text-gray-400">▾</span>
          </button>
          {treatOpen && (
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
                    <TreatmentIcon name={c.slug} className="h-5 w-5 shrink-0 text-brand" />
                    <span className="flex-1">{c.name}</span>
                    {sel && <span className="text-brand">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden w-px self-stretch bg-gray-200 sm:block" />

        {/* Area with suggestions */}
        <div ref={areaRef} className="relative flex flex-1 items-center gap-2 px-3">
          <TreatmentIcon name="pin" className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setAreaOpen(true);
            }}
            onFocus={() => setAreaOpen(true)}
            onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
            placeholder="Area (e.g. Sea Point)"
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
          />
          {areaOpen && areaMatches.length > 0 && (
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
                  <TreatmentIcon name="pin" className="h-4 w-4 shrink-0 text-gray-400" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {showButton && (
          <button
            type="button"
            onClick={() => onSearch?.()}
            className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-black"
          >
            {buttonLabel}
          </button>
        )}
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
  );
}
