"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { BRAND } from "@/lib/brand";

export default function Header() {
  const { items } = useCart();

  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-brand">
          {BRAND}
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/join" className="text-sm font-medium text-gray-600 hover:text-brand">
            For providers
          </Link>
          <Link
            href="/cart"
            className="relative rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Cart
            {items.length > 0 && (
              <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand">
                {items.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
