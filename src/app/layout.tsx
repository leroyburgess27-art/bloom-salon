import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import Chrome from "@/components/Chrome";

export const metadata: Metadata = {
  title: "Bloom Hair & Nail Studio",
  description: "Book hair and nail appointments online.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Chrome>{children}</Chrome>
        </CartProvider>
      </body>
    </html>
  );
}
