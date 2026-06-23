// Async data-access layer. Uses Supabase when configured; otherwise falls back
// to the local seed/in-memory logic so the prototype still runs without keys.
import { supabase, supabaseEnabled, BUSINESS_ID } from "./supabaseClient";
import type { Service, Stylist, Slot, CartItem, PaymentMethod } from "./types";
import type { CalBooking } from "./store";
import * as repo from "./repo";
import * as store from "./store";
import { stylists as seedStylists } from "./seed";

const STEP_MINUTES = 30;

// ---- mappers ---------------------------------------------------------------
function mapService(r: any): Service {
  return {
    id: r.id,
    businessId: r.business_id,
    name: r.name,
    description: r.description ?? "",
    category: r.category,
    durationMinutes: r.duration_minutes,
    price: Number(r.price),
    availableOnsite: r.available_onsite,
    availableMobile: r.available_mobile,
    active: r.active,
  };
}
function mapStylist(r: any): Stylist {
  return {
    id: r.id,
    businessId: r.business_id,
    name: r.name,
    bio: r.bio ?? "",
    active: r.active,
  };
}

// ---- reads -----------------------------------------------------------------
export async function servicesByCategory(): Promise<{ category: string; items: Service[] }[]> {
  if (!supabaseEnabled || !supabase) return repo.getServicesByCategory();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", BUSINESS_ID)
    .eq("active", true)
    .eq("available_onsite", true)
    .order("category")
    .order("name");
  if (error) throw error;
  const items = (data ?? []).map(mapService);
  const cats = Array.from(new Set(items.map((s) => s.category)));
  return cats.map((category) => ({ category, items: items.filter((s) => s.category === category) }));
}

export async function service(id: string): Promise<Service | null> {
  if (!supabaseEnabled || !supabase) return repo.getService(id) ?? null;
  const { data, error } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapService(data) : null;
}

export async function stylistsForService(serviceId: string): Promise<Stylist[]> {
  if (!supabaseEnabled || !supabase) return repo.getStylistsForService(serviceId);
  const { data, error } = await supabase
    .from("stylist_services")
    .select("stylists(*)")
    .eq("service_id", serviceId);
  if (error) throw error;
  return (data ?? [])
    .map((row: any) => row.stylists)
    .filter((s: any) => s && s.active)
    .map(mapStylist);
}

export async function allStylists(): Promise<Stylist[]> {
  if (!supabaseEnabled || !supabase) return seedStylists.filter((s) => s.active);
  const { data, error } = await supabase
    .from("stylists")
    .select("*")
    .eq("business_id", BUSINESS_ID)
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []).map(mapStylist);
}

export async function availableSlots(
  serviceId: string,
  stylistId: string,
  dateISO: string,
): Promise<Slot[]> {
  if (!supabaseEnabled || !supabase) return repo.getAvailableSlots(serviceId, stylistId, dateISO);

  const svc = await service(serviceId);
  if (!svc) return [];
  const weekday = new Date(`${dateISO}T00:00:00`).getDay();

  const { data: wh } = await supabase
    .from("working_hours")
    .select("start_time,end_time")
    .eq("stylist_id", stylistId)
    .eq("weekday", weekday)
    .limit(1);
  if (!wh || wh.length === 0) return [];

  const { data: settings } = await supabase
    .from("business_settings")
    .select("default_buffer_minutes")
    .eq("business_id", BUSINESS_ID)
    .maybeSingle();
  const buffer = settings?.default_buffer_minutes ?? 10;

  const { data: bks } = await supabase
    .from("bookings")
    .select("starts_at,ends_at")
    .eq("stylist_id", stylistId)
    .neq("status", "cancelled")
    .gte("starts_at", `${dateISO}T00:00:00`)
    .lte("starts_at", `${dateISO}T23:59:59`);

  const busy = (bks ?? []).map((b: any) => ({
    start: new Date(b.starts_at),
    end: new Date(b.ends_at),
  }));

  const dayStart = new Date(`${dateISO}T${(wh[0] as any).start_time}`);
  const dayEnd = new Date(`${dateISO}T${(wh[0] as any).end_time}`);
  const now = new Date();
  const add = (d: Date, m: number) => new Date(d.getTime() + m * 60000);

  const slots: Slot[] = [];
  for (let t = new Date(dayStart); add(t, svc.durationMinutes) <= dayEnd; t = add(t, STEP_MINUTES)) {
    const start = new Date(t);
    const end = add(start, svc.durationMinutes);
    const overlaps = busy.some(
      (b) => start < add(b.end, buffer) && add(end, buffer) > b.start,
    );
    slots.push({ start: start.toISOString(), end: end.toISOString(), available: !overlaps && start > now });
  }
  return slots;
}

function mapBooking(r: any): CalBooking {
  return {
    id: r.id,
    stylistId: r.stylist_id,
    stylistName: r.stylists?.name ?? "Unknown",
    title: r.services?.name ?? "Booking",
    clientName: r.clients?.name ?? "Client",
    start: new Date(r.starts_at),
    end: new Date(r.ends_at),
    status: r.status === "pending" ? "pending" : "confirmed",
    price: r.services?.price ? Number(r.services.price) : 0,
    source: "app",
  };
}

const BOOKING_SELECT =
  "id, stylist_id, starts_at, ends_at, status, services(name, price), stylists(name), clients(name)";

export async function bookingsForDate(dateISO: string): Promise<CalBooking[]> {
  if (!supabaseEnabled || !supabase) return store.getBookingsForDate(dateISO);
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("business_id", BUSINESS_ID)
    .neq("status", "cancelled")
    .gte("starts_at", `${dateISO}T00:00:00`)
    .lte("starts_at", `${dateISO}T23:59:59`)
    .order("starts_at");
  if (error) throw error;
  return (data ?? []).map(mapBooking);
}

export async function upcomingBookings(limit = 6): Promise<CalBooking[]> {
  if (!supabaseEnabled || !supabase) return store.getUpcomingAppBookings(limit);
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("business_id", BUSINESS_ID)
    .neq("status", "cancelled")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapBooking);
}

// ---- writes ----------------------------------------------------------------
export async function createOrder(
  items: CartItem[],
  details: { name: string; email: string; phone: string; marketingConsent: boolean },
  method: PaymentMethod,
  paymentMode: "upfront" | "confirm_first",
): Promise<void> {
  if (!supabaseEnabled || !supabase) {
    store.addOrderBookings(items, details.name); // in-memory fallback
    return;
  }

  const total = items.reduce((sum, i) => sum + i.price, 0);

  const { data: client, error: ce } = await supabase
    .from("clients")
    .insert({
      business_id: BUSINESS_ID,
      name: details.name,
      email: details.email || null,
      phone: details.phone || null,
      marketing_consent: details.marketingConsent,
      marketing_consent_at: details.marketingConsent ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (ce) throw ce;

  const { data: order, error: oe } = await supabase
    .from("orders")
    .insert({
      business_id: BUSINESS_ID,
      client_id: client.id,
      total,
      status: paymentMode === "upfront" ? "paid" : "awaiting_confirmation",
    })
    .select("id")
    .single();
  if (oe) throw oe;

  const bookingStatus = paymentMode === "upfront" ? "confirmed" : "pending";
  const rows = items.map((i) => ({
    business_id: BUSINESS_ID,
    order_id: order.id,
    client_id: client.id,
    service_id: i.serviceId,
    stylist_id: i.stylistId,
    service_mode: "onsite",
    location_type: "salon",
    starts_at: i.startsAt,
    ends_at: i.endsAt,
    status: bookingStatus,
  }));
  const { error: be } = await supabase.from("bookings").insert(rows);
  if (be) throw be;

  const { error: pe } = await supabase.from("payments").insert({
    business_id: BUSINESS_ID,
    order_id: order.id,
    provider: "simulated",
    method,
    amount: total,
    status: paymentMode === "upfront" ? "succeeded" : "pending",
  });
  if (pe) throw pe;
}

export async function cancelBooking(id: string): Promise<void> {
  if (!supabaseEnabled || !supabase) {
    store.cancelBooking(id);
    return;
  }
  const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;
}

// Import is hoisted; placed here to keep the seed-fallback logic self-contained.
import { stylistServices as seedStylistServices, services as seedServices } from "./seed";

export interface StylistSummary extends Stylist {
  serviceCount: number;
  categories: string[];
}

// Stylists plus a summary of how many services they do and in which categories.
export async function stylistsWithSummary(): Promise<StylistSummary[]> {
  if (!supabaseEnabled || !supabase) {
    return seedStylists
      .filter((s) => s.active)
      .map((s) => {
        const ids = seedStylistServices
          .filter((ss) => ss.stylistId === s.id)
          .map((ss) => ss.serviceId);
        const categories = Array.from(
          new Set(seedServices.filter((sv) => ids.includes(sv.id)).map((sv) => sv.category)),
        );
        return { ...s, serviceCount: ids.length, categories };
      });
  }

  const { data, error } = await supabase
    .from("stylists")
    .select("*, stylist_services(services(category))")
    .eq("business_id", BUSINESS_ID)
    .eq("active", true)
    .order("name");
  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const links = row.stylist_services ?? [];
    const categories = Array.from(
      new Set(links.map((l: any) => l.services?.category).filter(Boolean)),
    ) as string[];
    return { ...mapStylist(row), serviceCount: links.length, categories };
  });
}
