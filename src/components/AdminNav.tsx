"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/reminders", label: "Reminders" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/stylists", label: "Stylists" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-gray-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <span className="mr-2 font-bold">Bloom · Admin</span>
        <nav className="flex flex-wrap gap-1">
          {LINKS.map((l) => {
            const active =
              l.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  active ? "bg-white text-gray-900" : "hover:bg-gray-700"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          className="ml-auto text-sm text-gray-300 underline hover:text-white"
        >
          View storefront →
        </Link>
      </div>
    </header>
  );
}
