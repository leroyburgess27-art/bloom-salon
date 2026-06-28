// Async data-access layer. Uses Supabase when configured; otherwise falls back
// to the local seed/in-memory logic so the prototype still runs without keys.
import { supabase, supabaseEnabled, BUSINESS_ID } from "./supabaseClient";
import type { Service, Stylist, Slot, CartItem, PaymentMethod } from "./types";
import type { CalBooking } from "./store";
import * as repo from "./repo";
import * as store from "./store";
import {
  stylists as seedStylists,
  stylistServices as seedStylistServices,
  services as seedServices,
} from "./seed";

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
export async function servicesByCategory(
  businessId: string = BUSINESS_ID,
): Promise<{ category: string; items: Service[] }[]> {
  if (!supabaseEnabled || !supabase) return repo.getServicesByCategory();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
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

  const { data: bks } = await supabase.rpc("public_busy_times", { p_stylist: stylistId, p_date: dateISO });

  // Busy intervals already include the provider's travel/buffer time — it's
  // applied server-side in public_busy_times — so we test plain overlap here.
  const busy: { start: Date; end: Date }[] = (bks ?? []).map((b: any) => ({ start: new Date(b.starts_at), end: new Date(b.ends_at) }));

  const dayStart = new Date(`${dateISO}T${(wh[0] as any).start_time}`);
  const dayEnd = new Date(`${dateISO}T${(wh[0] as any).end_time}`);
  const now = new Date();
  const add = (d: Date, m: number) => new Date(d.getTime() + m * 60000);

  const slots: Slot[] = [];
  for (let t = new Date(dayStart); add(t, svc.durationMinutes) <= dayEnd; t = add(t, STEP_MINUTES)) {
    const start = new Date(t);
    const end = add(start, svc.durationMinutes);
    const overlaps = busy.some((b) => start < b.end && end > b.start);
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

export async function bookingsForDate(
  dateISO: string,
  businessId: string = BUSINESS_ID,
): Promise<CalBooking[]> {
  if (!supabaseEnabled || !supabase) return store.getBookingsForDate(dateISO);
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .gte("starts_at", `${dateISO}T00:00:00`)
    .lte("starts_at", `${dateISO}T23:59:59`)
    .order("starts_at");
  if (error) throw error;
  return (data ?? []).map(mapBooking);
}

export async function upcomingBookings(
  limit = 6,
  businessId: string = BUSINESS_ID,
): Promise<CalBooking[]> {
  if (!supabaseEnabled || !supabase) return store.getUpcomingAppBookings(limit);
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("business_id", businessId)
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
  businessId: string = BUSINESS_ID,
  serviceMode: "onsite" | "mobile" = "onsite",
  address?: string,
): Promise<void> {
  if (!supabaseEnabled || !supabase) {
    store.addOrderBookings(items, details.name);
    return;
  }

  const { error } = await supabase.rpc("create_public_booking", {
    p_business: businessId,
    p_client: {
      name: details.name,
      email: details.email || "",
      phone: details.phone || "",
      address: address || "",
      marketing_consent: details.marketingConsent,
    },
    p_items: items.map((i) => ({
      service_id: i.serviceId,
      stylist_id: i.stylistId,
      starts_at: i.startsAt,
      ends_at: i.endsAt,
      price: i.price,
      service_mode: serviceMode,
      address: serviceMode === "mobile" ? address || "" : "",
    })),
    p_payment: { method, payment_mode: paymentMode },
  });
  if (error) throw error;
}

export async function cancelBooking(id: string): Promise<void> {
  if (!supabaseEnabled || !supabase) {
    store.cancelBooking(id);
    return;
  }
  const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;
}

// ---- admin: stylists with summary ------------------------------------------
export interface StylistSummary extends Stylist {
  serviceCount: number;
  categories: string[];
}

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

// ===========================================================================
// PROVIDER ONBOARDING (individual "service providers")
// ===========================================================================
export interface ServiceCategoryRow {
  id: string;
  name: string;
  slug: string;
}

export async function listServiceCategories(): Promise<ServiceCategoryRow[]> {
  if (!supabaseEnabled || !supabase) {
    return [
      { id: "hair", name: "Hair", slug: "hair" },
      { id: "nails", name: "Nails", slug: "nails" },
    ];
  }
  const { data, error } = await supabase
    .from("service_categories")
    .select("id, name, slug")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export interface NewServiceInput {
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
}

export interface ProviderInput {
  displayName: string;
  headline?: string;
  bio?: string;
  photoUrl?: string;
  baseArea?: string;
  acceptsMobile: boolean;
  clientele?: "men" | "women" | "all";
  goodToKnow?: string;
  email?: string;
  phone?: string;
  categorySlugs: string[];
  services: NewServiceInput[];
  weekdays: number[];
  startTime: string;
  endTime: string;
  bufferMinutes?: number;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "provider"
  );
}

export async function createProvider(
  input: ProviderInput,
): Promise<{ businessId: string; slug: string }> {
  if (!supabaseEnabled || !supabase) throw new Error("Database not configured");
  const slug = `${slugify(input.displayName)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: authData } = await supabase.auth.getUser();
  const ownerId = authData?.user?.id ?? null;
  if (!ownerId) throw new Error("Please log in or sign up before creating your page.");

  const { data: biz, error: bizErr } = await supabase
    .from("businesses")
    .insert({
      name: input.displayName,
      slug,
      account_type: "individual",
      owner_id: ownerId,
      plan: "free",
      address: input.baseArea ?? null,
      timezone: "Africa/Johannesburg",
    })
    .select("id")
    .single();
  if (bizErr) throw bizErr;
  const businessId = biz.id as string;

  const { error: setErr } = await supabase.from("business_settings").insert({
    business_id: businessId,
    mobile_enabled: input.acceptsMobile,
    payment_mode: "upfront",
    payment_methods: ["cash", "card", "qr", "eft"],
    default_buffer_minutes: input.bufferMinutes ?? 0,
  });
  if (setErr) throw setErr;

  const { data: sty, error: styErr } = await supabase
    .from("stylists")
    .insert({
      business_id: businessId,
      name: input.displayName,
      bio: input.headline ?? null,
      accepts_mobile: input.acceptsMobile,
      active: true,
    })
    .select("id")
    .single();
  if (styErr) throw styErr;
  const stylistId = sty.id as string;

  const { error: profErr } = await supabase.from("provider_profiles").insert({
    business_id: businessId,
    slug,
    display_name: input.displayName,
    headline: input.headline ?? null,
    bio: input.bio ?? null,
    photo_url: input.photoUrl ?? null,
    accepts_mobile: input.acceptsMobile,
    base_area: input.baseArea ?? null,
    clientele: input.clientele ?? "all",
    good_to_know: input.goodToKnow ?? null,
    verification_level: "none",
    is_listed: false,
    active: true,
  });
  if (profErr) throw profErr;

  if (input.categorySlugs.length) {
    const { data: cats } = await supabase
      .from("service_categories")
      .select("id, slug")
      .in("slug", input.categorySlugs);
    const rows = (cats ?? []).map((c: any) => ({ business_id: businessId, category_id: c.id }));
    if (rows.length) await supabase.from("provider_categories").insert(rows);
  }

  if (input.services.length) {
    const { data: createdServices, error: svcErr } = await supabase
      .from("services")
      .insert(
        input.services.map((s) => ({
          business_id: businessId,
          name: s.name,
          description: "",
          category: s.category,
          duration_minutes: s.durationMinutes,
          price: s.price,
          available_onsite: true,
          available_mobile: input.acceptsMobile,
          active: true,
        })),
      )
      .select("id");
    if (svcErr) throw svcErr;
    const links = (createdServices ?? []).map((s: any) => ({
      business_id: businessId,
      stylist_id: stylistId,
      service_id: s.id,
    }));
    if (links.length) await supabase.from("stylist_services").insert(links);
  }

  if (input.weekdays.length) {
    const wh = input.weekdays.map((weekday) => ({
      business_id: businessId,
      stylist_id: stylistId,
      weekday,
      start_time: input.startTime,
      end_time: input.endTime,
    }));
    const { error: whErr } = await supabase.from("working_hours").insert(wh);
    if (whErr) throw whErr;
  }

  return { businessId, slug };
}

// ===========================================================================
// PUBLIC PROVIDER PROFILE
// ===========================================================================
export interface ProviderPublic {
  businessId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  baseArea: string | null;
  acceptsMobile: boolean;
  clientele: "men" | "women" | "all";
  goodToKnow: string | null;
  verificationLevel: "none" | "profile" | "id";
  stylistId: string | null;
  servicesByCategory: { category: string; items: Service[] }[];
  stats: { ratingAvg: number; ratingCount: number; returningClients: number };
}

export async function getProviderBySlug(slug: string): Promise<ProviderPublic | null> {
  if (!supabaseEnabled || !supabase) return null;

  const { data: profile, error } = await supabase
    .from("provider_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const businessId = (profile as any).business_id as string;

  const [{ data: svc }, { data: sty }, { data: stat }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("category")
      .order("name"),
    supabase
      .from("stylists")
      .select("id")
      .eq("business_id", businessId)
      .eq("active", true)
      .limit(1),
    supabase.from("provider_stats").select("*").eq("business_id", businessId).maybeSingle(),
  ]);

  const items = (svc ?? []).map(mapService);
  const cats = Array.from(new Set(items.map((s) => s.category)));
  const servicesByCategory = cats.map((category) => ({
    category,
    items: items.filter((s) => s.category === category),
  }));

  return {
    businessId,
    slug,
    displayName: (profile as any).display_name,
    headline: (profile as any).headline,
    bio: (profile as any).bio,
    photoUrl: (profile as any).photo_url,
    baseArea: (profile as any).base_area,
    acceptsMobile: (profile as any).accepts_mobile,
    clientele: ((profile as any).clientele ?? "all") as "men" | "women" | "all",
    goodToKnow: (profile as any).good_to_know ?? null,
    verificationLevel: (profile as any).verification_level,
    stylistId: sty && sty.length ? (sty[0] as any).id : null,
    servicesByCategory,
    stats: {
      ratingAvg: stat ? Number((stat as any).rating_avg) : 0,
      ratingCount: stat ? Number((stat as any).rating_count) : 0,
      returningClients: stat ? Number((stat as any).returning_clients) : 0,
    },
  };
}


// ===========================================================================
// DISCOVERY (public home: trending / listed providers)
// ===========================================================================
export interface TrendingProvider {
  businessId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  baseArea: string | null;
  photoUrl: string | null;
  acceptsMobile: boolean;
  verificationLevel: "none" | "profile" | "id";
  categories: string[];
  ratingAvg: number;
  ratingCount: number;
  returningClients: number;
}

export async function trendingProviders(limit = 12): Promise<TrendingProvider[]> {
  if (!supabaseEnabled || !supabase) return [];

  const { data: profiles, error } = await supabase
    .from("provider_profiles")
    .select(
      "business_id, slug, display_name, headline, base_area, photo_url, accepts_mobile, verification_level",
    )
    .eq("active", true)
    .eq("is_listed", true);
  if (error) throw error;
  const rows = (profiles ?? []) as any[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.business_id);
  const [{ data: stats }, { data: links }, { data: cats }] = await Promise.all([
    supabase.from("provider_stats").select("*").in("business_id", ids),
    supabase.from("provider_categories").select("business_id, category_id").in("business_id", ids),
    supabase.from("service_categories").select("id, name"),
  ]);

  const statById = new Map((stats ?? []).map((s: any) => [s.business_id, s]));
  const catNameById = new Map((cats ?? []).map((c: any) => [c.id, c.name as string]));
  const catsByBiz = new Map<string, string[]>();
  for (const l of (links ?? []) as any[]) {
    const name = catNameById.get(l.category_id);
    if (!name) continue;
    const arr = catsByBiz.get(l.business_id) ?? [];
    arr.push(name);
    catsByBiz.set(l.business_id, arr);
  }

  const list: TrendingProvider[] = rows.map((r) => {
    const st = statById.get(r.business_id) as any;
    return {
      businessId: r.business_id,
      slug: r.slug,
      displayName: r.display_name,
      headline: r.headline,
      baseArea: r.base_area,
      photoUrl: r.photo_url,
      acceptsMobile: r.accepts_mobile,
      verificationLevel: r.verification_level,
      categories: catsByBiz.get(r.business_id) ?? [],
      ratingAvg: st ? Number(st.rating_avg) : 0,
      ratingCount: st ? Number(st.rating_count) : 0,
      returningClients: st ? Number(st.returning_clients) : 0,
    };
  });

  list.sort(
    (a, b) =>
      b.ratingAvg - a.ratingAvg ||
      b.returningClients - a.returningClients ||
      b.ratingCount - a.ratingCount ||
      a.displayName.localeCompare(b.displayName),
  );
  return list.slice(0, limit);
}

// ===========================================================================
// PROVIDER STUDIO (their own management view, scoped by business id)
// ===========================================================================
export async function getProviderById(
  businessId: string,
): Promise<{ businessId: string; displayName: string; slug: string; acceptsMobile: boolean } | null> {
  if (!supabaseEnabled || !supabase) return null;
  const { data, error } = await supabase
    .from("provider_profiles")
    .select("display_name, slug, accepts_mobile")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    businessId,
    displayName: (data as any).display_name,
    slug: (data as any).slug,
    acceptsMobile: (data as any).accepts_mobile,
  };
}

export interface StudioBooking {
  id: string;
  title: string;
  clientName: string;
  clientPhone: string | null;
  start: Date;
  end: Date;
  status: "confirmed" | "pending" | "completed";
  price: number;
  serviceMode: string;
  address: string | null;
}

export async function studioBookingsForDate(
  businessId: string,
  dateISO: string,
): Promise<StudioBooking[]> {
  if (!supabaseEnabled || !supabase) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("id, starts_at, ends_at, status, service_mode, address, services(name, price), clients(name, phone)")
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .gte("starts_at", `${dateISO}T00:00:00`)
    .lte("starts_at", `${dateISO}T23:59:59`)
    .order("starts_at");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.services?.name ?? "Booking",
    clientName: r.clients?.name ?? "Client",
    clientPhone: r.clients?.phone ?? null,
    start: new Date(r.starts_at),
    end: new Date(r.ends_at),
    status: (r.status as StudioBooking["status"]) ?? "confirmed",
    price: r.services?.price ? Number(r.services.price) : 0,
    serviceMode: r.service_mode ?? "onsite",
    address: r.address ?? null,
  }));
}

export async function studioUpcomingBookings(
  businessId: string,
  limit = 5,
): Promise<StudioBooking[]> {
  if (!supabaseEnabled || !supabase) return [];
  const nowISO = new Date().toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, starts_at, ends_at, status, service_mode, address, services(name, price), clients(name, phone)")
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .gte("starts_at", nowISO)
    .order("starts_at")
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.services?.name ?? "Booking",
    clientName: r.clients?.name ?? "Client",
    clientPhone: r.clients?.phone ?? null,
    start: new Date(r.starts_at),
    end: new Date(r.ends_at),
    status: (r.status as StudioBooking["status"]) ?? "confirmed",
    price: r.services?.price ? Number(r.services.price) : 0,
    serviceMode: r.service_mode ?? "onsite",
    address: r.address ?? null,
  }));
}

export async function studioBookingsForRange(
  businessId: string,
  startISO: string,
  endISO: string,
): Promise<StudioBooking[]> {
  if (!supabaseEnabled || !supabase) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("id, starts_at, ends_at, status, service_mode, address, services(name, price), clients(name, phone)")
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .gte("starts_at", `${startISO}T00:00:00`)
    .lte("starts_at", `${endISO}T23:59:59`)
    .order("starts_at");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.services?.name ?? "Booking",
    clientName: r.clients?.name ?? "Client",
    clientPhone: r.clients?.phone ?? null,
    start: new Date(r.starts_at),
    end: new Date(r.ends_at),
    status: (r.status as StudioBooking["status"]) ?? "confirmed",
    price: r.services?.price ? Number(r.services.price) : 0,
    serviceMode: r.service_mode ?? "onsite",
    address: r.address ?? null,
  }));
}

export async function markBookingCompleted(id: string): Promise<void> {
  if (!supabaseEnabled || !supabase) return;
  const { error } = await supabase.from("bookings").update({ status: "completed" }).eq("id", id);
  if (error) throw error;
}

export async function getMyBusiness(
  ownerId: string,
): Promise<{ businessId: string; displayName: string; slug: string } | null> {
  if (!supabaseEnabled || !supabase) return null;
  const { data, error } = await supabase
    .from("businesses")
    .select("id, provider_profiles(display_name, slug)")
    .eq("owner_id", ownerId)
    .eq("account_type", "individual")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const prof = (data as any).provider_profiles;
  const p = Array.isArray(prof) ? prof[0] : prof;
  return {
    businessId: (data as any).id,
    displayName: p?.display_name ?? "My studio",
    slug: p?.slug ?? "",
  };
}
