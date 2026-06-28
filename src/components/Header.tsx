"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

export default function Header() {
  const { items } = useCart();
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function logout() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-brand">
          {BRAND}
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/studio" className="text-sm font-medium text-gray-600 hover:text-brand">
                My studio
              </Link>
              <button onClick={logout} className="text-sm text-gray-500 hover:text-brand">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand">
                Log in
              </Link>
              <Link
                href="/join"
                className="hidden text-sm font-medium text-gray-600 hover:text-brand sm:inline"
              >
                Become a Service Provider
              </Link>
            </>
          )}
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
