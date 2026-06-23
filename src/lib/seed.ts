// Local seed data — mirrors db/seed.sql. Single salon, Hair + Nail, onsite only.
import type {
  Business,
  BusinessSettings,
  Service,
  Stylist,
  WorkingHours,
  SeededBooking,
} from "./types";

export const business: Business = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Bloom Hair & Nail Studio",
  slug: "bloom-studio",
  address: "12 Main Road, Claremont, Cape Town",
  timezone: "Africa/Johannesburg",
};

export const businessSettings: BusinessSettings = {
  businessId: business.id,
  mobileEnabled: false, // prototype: mobile add-on OFF
  paymentMode: "upfront",
  paymentMethods: ["cash", "card", "qr", "eft"], // no default — all shown
  defaultBufferMinutes: 10,
};

export const stylists: Stylist[] = [
  { id: "s1", businessId: business.id, name: "Naledi M.", bio: "Senior hair stylist — cuts, colour & treatments.", active: true },
  { id: "s2", businessId: business.id, name: "Thandi K.", bio: "Braids, weaves & natural hair specialist.", active: true },
  { id: "s3", businessId: business.id, name: "Aisha P.", bio: "Nail technician — gel, acrylic & nail art.", active: true },
];

export const services: Service[] = [
  // Hair
  svc("h1", "Ladies Cut & Blow-dry", "Wash, cut and professional blow-dry.", "Hair", 60, 320),
  svc("h2", "Gents Cut", "Classic or modern cut and style.", "Hair", 30, 180),
  svc("h3", "Full Colour", "Single-process all-over colour.", "Hair", 120, 650),
  svc("h4", "Highlights", "Foil highlights with toner.", "Hair", 150, 890),
  svc("h5", "Knotless Braids", "Protective knotless box braids.", "Hair", 240, 750),
  svc("h6", "Deep Conditioning Treatment", "Repairing mask and scalp treatment.", "Hair", 45, 250),
  // Nails
  svc("n1", "Gel Overlay", "Gel overlay on natural nails.", "Nails", 60, 280),
  svc("n2", "Acrylic Full Set", "Full set of acrylic nails.", "Nails", 90, 420),
  svc("n3", "Classic Manicure", "File, shape, cuticle care and polish.", "Nails", 45, 200),
  svc("n4", "Pedicure & Polish", "Soak, scrub, cuticle care and polish.", "Nails", 60, 260),
  svc("n5", "Nail Art (per nail)", "Custom hand-painted nail art.", "Nails", 15, 40),
];

function svc(
  id: string,
  name: string,
  description: string,
  category: string,
  durationMinutes: number,
  price: number,
): Service {
  return {
    id,
    businessId: business.id,
    name,
    description,
    category,
    durationMinutes,
    price,
    availableOnsite: true,
    availableMobile: false,
    active: true,
  };
}

// Which stylist can perform which service.
// Naledi (s1) & Thandi (s2) = all Hair; Aisha (s3) = all Nails.
export const stylistServices: { stylistId: string; serviceId: string }[] = [
  ...services.filter((s) => s.category === "Hair").flatMap((s) => [
    { stylistId: "s1", serviceId: s.id },
    { stylistId: "s2", serviceId: s.id },
  ]),
  ...services.filter((s) => s.category === "Nails").map((s) => ({ stylistId: "s3", serviceId: s.id })),
];

// Working hours: Tue–Sat (weekday 2..6), 09:00–17:00 for every stylist.
export const workingHours: WorkingHours[] = stylists.flatMap((st) =>
  [2, 3, 4, 5, 6].map((weekday) => ({
    stylistId: st.id,
    weekday,
    startTime: "09:00",
    endTime: "17:00",
  })),
);

// A few pre-existing bookings so some slots show as taken in the demo.
// Times are local salon time; resolved against the chosen date at runtime.
export const seededBusyByWeekday: { stylistId: string; weekday: number; start: string; end: string }[] = [
  { stylistId: "s1", weekday: 2, start: "10:00", end: "11:00" }, // Tue
  { stylistId: "s1", weekday: 3, start: "13:00", end: "15:00" }, // Wed
  { stylistId: "s3", weekday: 4, start: "09:00", end: "10:30" }, // Thu
];

// Placeholder for already-confirmed absolute bookings (none in fresh prototype).
export const seededBookings: SeededBooking[] = [];
