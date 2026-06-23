"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { CartItem, PaymentMethod } from "./types";

export interface ClientDetails {
  name: string;
  email: string;
  phone: string;
  marketingConsent: boolean;
}

export interface PlacedOrder {
  ref: string;
  items: CartItem[];
  total: number;
  details: ClientDetails;
  method: PaymentMethod;
  paymentMode: "upfront" | "confirm_first";
  placedAt: string;
}

interface CartContextValue {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (index: number) => void;
  clear: () => void;
  total: number;
  lastOrder: PlacedOrder | null;
  placeOrder: (
    details: ClientDetails,
    method: PaymentMethod,
    paymentMode: "upfront" | "confirm_first",
  ) => PlacedOrder;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null);

  const add = (item: CartItem) => setItems((prev) => [...prev, item]);
  const remove = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));
  const clear = () => setItems([]);
  const total = items.reduce((sum, i) => sum + i.price, 0);

  // Records the order locally for the confirmation screen. Persistence to the
  // database happens separately in checkout via db.createOrder().
  function placeOrder(
    details: ClientDetails,
    method: PaymentMethod,
    paymentMode: "upfront" | "confirm_first",
  ): PlacedOrder {
    const order: PlacedOrder = {
      ref: "BLM-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      items,
      total,
      details,
      method,
      paymentMode,
      placedAt: new Date().toISOString(),
    };
    setLastOrder(order);
    setItems([]);
    return order;
  }

  return (
    <CartContext.Provider
      value={{ items, add, remove, clear, total, lastOrder, placeOrder }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
