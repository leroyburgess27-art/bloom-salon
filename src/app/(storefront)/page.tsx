import Link from "next/link";
import { trendingProviders, listServiceCategories } from "@/lib/db";
import Discover from "@/components/Discover";
import { BRAND } from "@/lib/brand";

export const revalidate = 0; // always fetch fresh providers

export default async function HomePage() {
  const [providers, categories] = await Promise.all([
    trendingProviders(),
    listServiceCategories(),
  ]);

  return (
    <div className="space-y-12">
      <Discover providers={providers} categories={categories} />

      {/* For providers */}
      <section className="overflow-hidden rounded-3xl bg-brand-dark px-6 py-10 text-white sm:px-10">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold">Are you a hair, nail or beauty pro?</h2>
          <p className="mt-2 text-white/80">
            Get your own booking page in minutes. Keep 100% of what you earn, own your client list, and
            let clients book you directly — no commission, ever.
          </p>
          <Link
            href="/join"
            className="mt-5 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-brand-dark hover:bg-gray-100"
          >
            Create your free page
          </Link>
        </div>
      </section>

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
            <Link href="/join" className="hover:text-brand">For providers</Link>
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
