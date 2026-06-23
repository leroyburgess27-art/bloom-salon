// In-memory bookings store for the prototype. Lets client checkouts show up on
// the admin calendar within a running session. Resets on full page reload.
// In the DEV phase this is replaced by Supabase reads/writes.
import { stylists, seededBusyByWeekday } from "./seed";
import type { CartItem } from "./types";

export interface CalBooking {
  id: string;
  stylistId: string;
  stylistName: string;
  title: string;
  clientName: string;
  start: Date;
  end: Date;
  status: "confirmed" | "pending";
  price: number;
  source: "seed" | "app";
}

// Bookings created by client checkouts during this session.
const appBookings: CalBooking[] = [];
// Seeded (recurring) bookings cancelled by the admin, by generated id.
const cancelledSeedIds = new Set<string>();

function stylistName(id: string): string {
  return stylists.find((s) => s.id === id)?.name ?? "Unknown";
}

export function addOrderBookings(items: CartItem[], clientName: string): void {
  for (const item of items) {
    appBookings.push({
      id: "b-" + Math.random().toString(36).slice(2, 9),
      stylistId: item.stylistId,
      stylistName: item.stylistName,
      title: item.serviceName,
      clientName,
      start: new Date(item.startsAt),
      end: new Date(item.endsAt),
      status: "confirmed",
      price: item.price,
      source: "app",
    });
  }
}

// Cancel a booking. App bookings are removed; recurring seeded bookings are
// suppressed for that occurrence.
export function cancelBooking(id: string): void {
  if (id.startsWith("seed-")) {
    cancelledSeedIds.add(id);
    return;
  }
  const i = appBookings.findIndex((b) => b.id === id);
  if (i !== -1) appBookings.splice(i, 1);
}

// All bookings for a given calendar day: real app bookings on that day, plus the
// recurring seeded "busy" blocks that fall on that weekday.
export function getBookingsForDate(dateISO: string): CalBooking[] {
  const dayStart = new Date(`${dateISO}T00:00:00`);
  const dayEnd = new Date(`${dateISO}T23:59:59`);
  const weekday = dayStart.getDay();

  const fromApp = appBookings.filter(
    (b) => b.start >= dayStart && b.start <= dayEnd,
  );

  const fromSeed: CalBooking[] = seededBusyByWeekday
    .filter((b) => b.weekday === weekday)
    .map((b): CalBooking => ({
      id: `seed-${dateISO}-${b.stylistId}-${b.start}`,
      stylistId: b.stylistId,
      stylistName: stylistName(b.stylistId),
      title: "Booked",
      clientName: "Existing client",
      start: new Date(`${dateISO}T${b.start}:00`),
      end: new Date(`${dateISO}T${b.end}:00`),
      status: "confirmed",
      price: 0,
      source: "seed",
    }))
    .filter((b) => !cancelledSeedIds.has(b.id));

  return [...fromSeed, ...fromApp].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}

export function getUpcomingAppBookings(limit = 5): CalBooking[] {
  const now = new Date();
  return appBookings
    .filter((b) => b.start >= now)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, limit);
}

export function getAppBookingCount(): number {
  return appBookings.length;
}
