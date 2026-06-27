import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import Chrome from "@/components/Chrome";
import { BRAND, BRAND_TAGLINE } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND} — ${BRAND_TAGLINE}`,
  description:
    "Book independent, mobile self-care providers — hair, nails, brows and makeup — across Cape Town.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <Chrome>{children}</Chrome>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
