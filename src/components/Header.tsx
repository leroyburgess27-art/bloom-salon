"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { getBusiness } from "@/lib/repo";

export default function Header() {
  const { items } = useCart();
  const business = getBusiness();

  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-lg font-bold text-brand">{business.name}</span>
          <span className="text-xs text-gray-500">{business.address}</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-brand">
            Admin
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
