import Link from "next/link";
import TreatmentIcon from "@/components/TreatmentIcon";
import { zar } from "@/lib/format";
import type { TrendingProvider } from "@/lib/db";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProviderCard({ p }: { p: TrendingProvider }) {
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
            <span className="inline-flex items-center gap-1"><TreatmentIcon name="van" className="h-3.5 w-3.5" /> Mobile</span>
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
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {p.baseArea && (
            <span className="flex items-center gap-1">
              <TreatmentIcon name="pin" className="h-3.5 w-3.5" /> {p.baseArea}
            </span>
          )}
          {p.priceFrom != null && <span>from {zar(p.priceFrom)}</span>}
        </div>
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
