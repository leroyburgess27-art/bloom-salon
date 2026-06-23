// Domain types — mirror db/schema.sql. The prototype uses the local seed, but
// these shapes match Postgres so we can swap in Supabase without churn.

export type PaymentMethod = "cash" | "card" | "qr" | "eft";

export interface Business {
  id: string;
  name: string;
  slug: string;
  address: string;
  timezone: string;
}

export interface BusinessSettings {
  businessId: string;
  mobileEnabled: boolean;
  paymentMode: "upfront" | "confirm_first";
  paymentMethods: PaymentMethod[];
  defaultBufferMinutes: number;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string;
  category: string; // "Hair" | "Nails"
  durationMinutes: number;
  price: number;
  availableOnsite: boolean;
  availableMobile: boolean;
  active: boolean;
}

export interface Stylist {
  id: string;
  businessId: string;
  name: string;
  bio: string;
  active: boolean;
}

export interface WorkingHours {
  stylistId: string;
  weekday: number; // 0 = Sunday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

export interface SeededBooking {
  stylistId: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
}

export interface Slot {
  start: string; // ISO
  end: string; // ISO
  available: boolean;
}

export interface CartItem {
  serviceId: string;
  serviceName: string;
  category: string;
  price: number;
  durationMinutes: number;
  stylistId: string;
  stylistName: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
}
