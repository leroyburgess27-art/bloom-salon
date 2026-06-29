import type { CSSProperties } from "react";

// Custom two-tone line icons (purple stroke = currentColor, pink accents).
// Keyed by category slug, plus the three home-page "how it works" steps.
const P: Record<string, JSX.Element> = {
  hair: (
    <>
      <path d="M4 9a4 4 0 0 1 4-4h6l5-2v12l-5-2h-1.5l-1.2 4H8l1.2-4H8a4 4 0 0 1-4-4Z" />
      <circle cx="9" cy="9" r="1.3" style={{ stroke: "#a78bfa" }} />
    </>
  ),
  nails: (
    <>
      <rect x="8.5" y="9" width="7" height="11" rx="1.5" />
      <path d="M10.5 9V6.5h3V9" />
      <rect x="10.5" y="3" width="3" height="2.2" rx=".5" />
      <path d="M8.5 14h7" style={{ stroke: "#a78bfa" }} />
    </>
  ),
  brows: (
    <>
      <path d="M4 13c2.5-3.5 13.5-3.5 16 0" />
      <path d="M6 11.5 5 9M9.5 10 9 7.5M14.5 10l.5-2.5M18 11.5l1-2.5" />
      <path d="M19.4 4.4l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" style={{ stroke: "#a78bfa" }} />
    </>
  ),
  makeup: (
    <>
      <path d="M9 12l1-5h4l1 5" style={{ stroke: "#a78bfa" }} />
      <rect x="8.5" y="12" width="7" height="8" rx="1" />
      <path d="M10 7h4" />
    </>
  ),
  lashes: (
    <>
      <path d="M3 13c3-5 15-5 18 0" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M5.5 9 4.5 6.5M9 7.5 8.5 5M12 7V4.3M15 7.5l.5-2.5M18.5 9l1-2.5" style={{ stroke: "#a78bfa" }} />
    </>
  ),
  waxing: (
    <>
      <path d="M6 10.5h11v6a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 6 16.5z" />
      <path d="M5 10.5h13" />
      <path d="M6 13h11" style={{ stroke: "#a78bfa" }} />
      <path d="M15 10.5 19 5" />
    </>
  ),
  braiding: (
    <>
      <path d="M9 3c0 3 6 3 6 6s-6 3-6 6 6 3 6 6" />
      <path d="M15 3c0 3-6 3-6 6s6 3 6 6-6 3-6 6" style={{ stroke: "#a78bfa" }} />
    </>
  ),
  barber: (
    <>
      <rect x="9" y="3.5" width="6" height="14" rx="3" />
      <path d="M9.5 7l5-2.5M9.5 11l5-2.5M9.5 15l5-2.5" style={{ stroke: "#a78bfa" }} />
      <path d="M10 17.5v3h4v-3" />
    </>
  ),
  skincare: (
    <>
      <rect x="8" y="9" width="8" height="11" rx="2" />
      <path d="M10 9V6h4v3" />
      <path d="M11 4h2" />
      <path d="M12 13v4" style={{ stroke: "#a78bfa" }} />
    </>
  ),
  facials: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 9.5h17" />
      <ellipse cx="8.5" cy="13" rx="1.6" ry="1.2" style={{ stroke: "#a78bfa" }} />
      <ellipse cx="15.5" cy="13" rx="1.6" ry="1.2" style={{ stroke: "#a78bfa" }} />
      <path d="M10 16.5c1.2 1 2.8 1 4 0" />
    </>
  ),
  shaving: (
    <>
      <path d="M4 20l8-8" />
      <path d="M11 13l5-5 3 3-5 5z" />
      <path d="M12.5 11.5l3 3" style={{ stroke: "#a78bfa" }} />
    </>
  ),
  massage: (
    <>
      <ellipse cx="12" cy="8" rx="5" ry="2" />
      <ellipse cx="12" cy="12" rx="6.5" ry="2.3" style={{ stroke: "#a78bfa" }} />
      <ellipse cx="12" cy="16" rx="5" ry="2" />
    </>
  ),
  // Home "how it works" steps
  find: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
      <path d="M10.5 7.3a2 2 0 0 1 2 2c0 1.5-2 3.4-2 3.4s-2-1.9-2-3.4a2 2 0 0 1 2-2z" style={{ stroke: "#a78bfa" }} />
      <circle cx="10.5" cy="9.4" r=".6" style={{ stroke: "#a78bfa" }} />
    </>
  ),
  book: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9.5h16M8 3v4M16 3v4" />
      <path d="M9 14l2.2 2.2L15.5 12" style={{ stroke: "#a78bfa" }} />
    </>
  ),
  come: (
    <>
      <path d="M2.5 7.5h11v8h-11z" />
      <path d="M13.5 10h3.5l3 3v2.5h-6.5z" />
      <path d="M14.5 11h2.3l1.7 1.7h-4z" style={{ stroke: "#a78bfa" }} />
      <circle cx="7" cy="17" r="1.7" />
      <circle cx="17.5" cy="17" r="1.7" />
    </>
  ),
  // UI chrome (single tone — inherit currentColor)
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16 21 21" />
    </>
  ),
  sparkles: (
    <>
      <path d="M10 3l1.3 3.4L15 7.7l-3.7 1.3L10 12.4 8.7 9 5 7.7l3.7-1.3z" />
      <path d="M17.5 13l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10z" />
      <circle cx="12" cy="11" r="2.2" />
    </>
  ),
  van: (
    <>
      <path d="M2.5 7.5h11v8h-11z" />
      <path d="M13.5 10h3.5l3 3v2.5h-6.5z" />
      <circle cx="7" cy="17" r="1.7" />
      <circle cx="17.5" cy="17" r="1.7" />
    </>
  ),
  fallback: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" style={{ stroke: "#a78bfa" }} />
    </>
  ),
};

export default function TreatmentIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  const inner = P[name] ?? P[name.toLowerCase()] ?? P.fallback;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {inner}
    </svg>
  );
}
