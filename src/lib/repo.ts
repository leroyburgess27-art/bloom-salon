// Data-access layer. Reads from the local seed today; swap these function
// bodies for Supabase queries in the DEV phase without touching the UI.
import {
  business,
  businessSettings,
  services,
  stylists,
  stylistServices,
  workingHours,
  seededBusyByWeekday,
} from "./seed";
import type { Service, Stylist, Slot } from "./types";

const STEP_MINUTES = 30; // slot grid

export function getBusiness() {
  return business;
}

export function getSettings() {
  return businessSettings;
}

export function getServices(): Service[] {
  return services.filter((s) => s.active && s.availableOnsite);
}

export function getServicesByCategory(): { category: string; items: Service[] }[] {
  const cats = Array.from(new Set(getServices().map((s) => s.category)));
  return cats.map((category) => ({
    category,
    items: getServices().filter((s) => s.category === category),
  }));
}

export function getService(id: string): Service | undefined {
  return getServices().find((s) => s.id === id);
}

export function getStylist(id: string): Stylist | undefined {
  return stylists.find((s) => s.id === id && s.active);
}

export function getStylistsForService(serviceId: string): Stylist[] {
  const ids = stylistServices
    .filter((ss) => ss.serviceId === serviceId)
    .map((ss) => ss.stylistId);
  return stylists.filter((s) => s.active && ids.includes(s.id));
}

// ---------------------------------------------------------------------------
// Availability: generate bookable slots for a service + stylist on a date.
// Onsite only. Mirrors the conceptual algorithm in ARCHITECTURE.md §5.
// ---------------------------------------------------------------------------
export function getAvailableSlots(
  serviceId: string,
  stylistId: string,
  dateISO: string, // "yyyy-mm-dd"
): Slot[] {
  const service = getService(serviceId);
  if (!service) return [];

  const date = new Date(`${dateISO}T00:00:00`);
  const weekday = date.getDay(); // 0 = Sunday

  const hours = workingHours.find(
    (w) => w.stylistId === stylistId && w.weekday === weekday,
  );
  if (!hours) return []; // stylist not working that day

  const buffer = businessSettings.defaultBufferMinutes;
  const busy = seededBusyByWeekday
    .filter((b) => b.stylistId === stylistId && b.weekday === weekday)
    .map((b) => ({
      start: toDate(dateISO, b.start),
      end: toDate(dateISO, b.end),
    }));

  const dayStart = toDate(dateISO, hours.startTime);
  const dayEnd = toDate(dateISO, hours.endTime);
  const now = new Date();

  const slots: Slot[] = [];
  for (
    let t = new Date(dayStart);
    addMinutes(t, service.durationMinutes) <= dayEnd;
    t = addMinutes(t, STEP_MINUTES)
  ) {
    const start = new Date(t);
    const end = addMinutes(start, service.durationMinutes);

    const overlapsBusy = busy.some(
      (b) =>
        start < addMinutes(b.end, buffer) && addMinutes(end, buffer) > b.start,
    );
    const inPast = start <= now;

    slots.push({
      start: start.toISOString(),
      end: end.toISOString(),
      available: !overlapsBusy && !inPast,
    });
  }
  return slots;
}

function toDate(dateISO: string, hhmm: string): Date {
  return new Date(`${dateISO}T${hhmm}:00`);
}

function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60000);
}
