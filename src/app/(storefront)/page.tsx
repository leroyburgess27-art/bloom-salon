import Link from "next/link";
import { listServiceCategories } from "@/lib/db";
import Discover from "@/components/Discover";
import { BRAND } from "@/lib/brand";

export const revalidate = 0; // always fetch fresh providers

export default async function HomePage() {
  const categories = await listServiceCategories();

  return (
    <div className="space-y-12">
      <Discover categories={categories} />

      {/* Footer */}
      <footer className="border-t pt-8 text-sm text-gray-500">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-extrabold text-brand">{BRAND}</div>
            <p className="mt-1 max-w-xs">
              Book independent, mobile self-care providers across Cape Town.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/for-providers" className="hover:text-brand">How it works</Link>
            <Link href="/join" className="hover:text-brand">Become a Service Provider</Link>
            <Link href="/login" className="hover:text-brand">Provider log in</Link>
          </nav>
        </div>
        <p className="mt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} {BRAND}. Your data is handled with consent — POPIA-aligned.
        </p>
      </footer>
    </div>
  );
}
