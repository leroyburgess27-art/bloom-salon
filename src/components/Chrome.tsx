"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/join") ||
    pathname?.startsWith("/p/") ||
    pathname?.startsWith("/studio") ||
    pathname?.startsWith("/review/") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup");

  if (bare) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
