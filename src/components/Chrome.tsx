"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";

// Renders the storefront header for client pages, but not for /admin routes
// (the admin area has its own navigation).
export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
