# Hairdressing Services App — Architecture Specification

**Version:** 0.1 (Draft)
**Date:** 21 June 2026
**Status:** For review
**Author:** Jake + Claude

---

## 1. Overview

A demo e-commerce application for ordering **hair and nail** salon services. Clients browse a
catalog of services, add them to a cart, schedule a time, optionally choose a preferred
stylist, and check out. Two service modes are supported in the architecture:

- **Onsite** — the client visits the business location. *(Prototype focus.)*
- **Mobile** — a stylist travels to the client (a toggleable, geo-locked add-on). *(Built into
  the schema but switched OFF for the prototype; enabled later.)*

The product goal is to **optimise the scheduling process for the business** — saving them
time by keeping their calendar accurate and bookings conflict-free.

### Mission (guiding principle)

**"Don't be extractive, be empowering."** This product is built as a benefit for everyone
involved — especially individual stylists, many of whom work independently because formal
employment is scarce in South Africa. We reject extractive commission models (e.g. a
platform taking 20% of every booking). Instead we charge a **low flat fee** so stylists
**keep 100% of their revenue** and **own their client relationships**. Every future
cost/scaling decision must hold to this principle.

### Prototype scope (confirmed)

**Single salon, onsite only (mobile flag OFF), Hair + Nail catalog.** Core loop only:
browse catalog → pick stylist + slot → cart → **simulated** checkout showing multiple payment
options (**Cash, Card, QR, EFT — no default**) → confirmation. Schema is built mobile-ready
(feature flag + `service_areas`) but the mobile flow is not implemented yet. The wedge is a
**back-office + branded storefront** for salons/stylists with existing regulars — not a
marketplace — beating incumbents by being non-extractive and letting businesses market to
their own clients.

### Scope of this demo

| In scope (demo) | Out of scope (later) |
| --- | --- |
| Catalog browsing (onsite + mobile) | Live payment processing |
| Cart / add-to-service | SMS/WhatsApp reminders |
| Scheduling UI with real availability | Native mobile apps |
| Preferred-hairdresser selection | Multi-business onboarding UI |
| **Simulated** checkout + booking confirmation | Loyalty / rewards |
| Mobile geo-lock check + on/off feature flag | Reporting dashboards (beyond basics) |

---

## 2. Guiding Principles

1. **Low cost now, room to scale.** Use managed free/low tiers that scale to paid without
   re-architecting.
2. **Single business now, multi-tenant-ready.** Every table carries a `business_id`. We run
   for one salon today; onboarding a second salon later is data + config, not a rewrite.
3. **Scheduling is the core.** The booking/availability engine is the product's reason to
   exist and gets the most design attention.
4. **Payments are abstracted.** The demo simulates payment, but a `PaymentProvider` interface
   lets a real South African gateway drop in without touching the booking flow.
5. **Privacy by design.** Client data is used for marketing, so consent capture and a privacy
   policy are built in from the start.

---

## 3. Multi-Tenancy Model

**Definition:** one app, one codebase, one deployment, serving many separate businesses, with
each business's data isolated from the others. A user signed in to Salon A never sees Salon
B's services, staff, or bookings.

**Implementation:**

- A `business_id` foreign key on every domain table.
- **Row-Level Security (RLS)** in Postgres (via Supabase) enforces isolation at the database
  layer — not just in application code — so a query can never leak across tenants.
- Per-business configuration (feature flags, payment mode, branding) lives in a
  `business_settings` table.

For the demo we seed exactly one business, but nothing in the schema or code assumes only one
exists.

---

## 4. Technology Stack

| Layer | Choice | Why | Cost |
| --- | --- | --- | --- |
| Frontend / SSR | **Next.js (App Router) + React + TypeScript** | One framework for UI + API routes; great DX; deploys cheaply | Free–low |
| Styling | **Tailwind CSS** | Fast, consistent, no custom CSS sprawl | Free |
| Hosting | **Vercel** | Zero-config Next.js hosting; generous free tier; scales on demand | Free–usage |
| Database | **Supabase (Postgres)** | Managed Postgres + Auth + Storage + RLS in one; relational integrity for bookings | Free–low |
| Auth | **Supabase Auth** | Email/password + social; integrates with RLS | Included |
| File storage | **Supabase Storage** | Service photos, stylist avatars | Included |
| Payments (design target) | **Payfast** (primary) / **Peach Payments** (alt) | SA-local gateways; abstracted behind an interface; **simulated in demo** | Per-txn |

### Why not Stripe

Stripe has only limited/invite-only support in South Africa. We design against a local gateway
instead. **Payfast** is recommended as the primary target — most widely used in SA, zero
monthly fee, supports cards + Instant EFT + QR via one integration. **Peach Payments** is the
alternative if a more developer-friendly API or recurring/pan-African support is needed. The
final choice stays open because all payment logic sits behind a `PaymentProvider` interface.

---

## 5. Scheduling Engine (Core)

The engine answers one question well: *"Given a service, an optional stylist, and a date, what
time slots can actually be booked?"*

### Open-source building blocks

| Need | Library | License |
| --- | --- | --- |
| Date/time math, durations, buffers, timezone (`Africa/Johannesburg`) | **date-fns** + **date-fns-tz** | MIT |
| Business-side calendar grid (day/week, resource columns per stylist, drag-to-reschedule) | **FullCalendar** (or react-big-calendar) | MIT |
| Client slot picker | **Custom component** (small code over date-fns) | — |

> **Cal.com** (open-source booking platform) is capable but AGPL-licensed and heavy. We use it
> as a *reference* only, not as an embedded dependency, to avoid licensing strings and bloat.

### Availability algorithm (conceptual)

```
available_slots(service, stylist?, date) =
    working_hours(stylist, date)
      minus existing_bookings(stylist, date)
      minus buffers (cleanup/setup between appointments)
      minus (if mobile) travel_time blocks before & after each job
      stepped into slots of service.duration
```

- **Onsite:** straightforward subtraction of booked time + buffers from working hours.
- **Mobile:** each booking also consumes **travel time** to and from the client. A mobile job
  therefore blocks `travel + service + travel`, preventing a stylist being double-booked across
  town. (v1 can use a fixed travel-time estimate per service area; v2 can integrate a maps API.)

### Concurrency safety

Two clients must not grab the same slot. Booking creation runs in a transaction that
re-checks availability and writes the booking atomically (DB constraint / `SELECT ... FOR
UPDATE` or an exclusion constraint on overlapping ranges per stylist).

---

## 6. Data Model

All tables include `business_id` (FK → `businesses`), `created_at`, `updated_at`. RLS scopes
every row to its business.

### Core tables

**businesses** — the tenant.
`id, name, slug, address, lat, lng, timezone, created_at`

**business_settings** — per-business config & feature flags.
`business_id, mobile_enabled (bool), payment_mode ('upfront' | 'confirm_first'), default_buffer_minutes, default_travel_minutes, branding(json)`

**services** — the catalog.
`id, business_id, name, description, category, duration_minutes, price, photo_url, available_onsite (bool), available_mobile (bool), active (bool)`

**hairdressers** — staff/resources.
`id, business_id, name, bio, avatar_url, accepts_mobile (bool), active (bool)`

**hairdresser_services** — which stylist can perform which service (many-to-many).
`hairdresser_id, service_id`

**working_hours** — recurring availability per stylist.
`id, business_id, hairdresser_id, weekday (0–6), start_time, end_time`

**time_off** — one-off blocks (leave, breaks).
`id, business_id, hairdresser_id, starts_at, ends_at, reason`

**service_areas** — geofence for mobile (the geo-lock).
`id, business_id, name, type ('radius' | 'postcodes'), center_lat, center_lng, radius_km, postcodes(text[])`

**clients** — customer records (also used for marketing).
`id, business_id, name, email, phone, address, lat, lng, marketing_consent (bool), marketing_consent_at (timestamp), created_at`

**carts** / **cart_items** — pre-checkout selection.
`carts: id, business_id, client_id, status`
`cart_items: id, cart_id, service_id, hairdresser_id?, service_mode ('onsite'|'mobile'), scheduled_start, scheduled_end`

**bookings** — the hub. One confirmed appointment.
`id, business_id, client_id, service_id, hairdresser_id, service_mode, location_type, address?, lat?, lng?, starts_at, ends_at, status ('pending'|'confirmed'|'completed'|'cancelled'), order_id`

**orders** — groups bookings from one checkout.
`id, business_id, client_id, total, status ('pending'|'paid'|'awaiting_confirmation'|'cancelled'), created_at`

**payments** — payment attempts/records (simulated in demo).
`id, business_id, order_id, provider ('simulated'|'payfast'|'peach'), provider_ref, amount, status ('pending'|'succeeded'|'failed'|'refunded'), created_at`

### Entity relationships (summary)

```
businesses 1──* services
businesses 1──* hairdressers
businesses 1──* service_areas
businesses 1──* clients
hairdressers *──* services        (via hairdresser_services)
hairdressers 1──* working_hours
clients      1──* orders
orders       1──* bookings
orders       1──1 payment(s)
bookings     *──1 service, hairdresser
```

---

## 7. Booking & Payment Flow

```
Browse catalog ─► Add service to cart ─► (choose mode: onsite / mobile)
   │
   ├─ if mobile: capture client address ─► GEO-LOCK CHECK against service_areas
   │      └─ outside area? block & explain
   │
   ▼
Pick stylist (optional) ─► Engine shows real available slots ─► select slot
   │
   ▼
Checkout
   ├─ payment_mode = 'upfront'        ─► simulate payment ─► order 'paid'      ─► booking 'confirmed'
   └─ payment_mode = 'confirm_first'  ─► order 'awaiting_confirmation' ─► business confirms ─► client pays ─► 'confirmed'
   │
   ▼
Confirmation screen (+ record for marketing if consent given)
```

### Payment abstraction

```ts
interface PaymentProvider {
  createPayment(order): Promise<{ providerRef, redirectUrl? }>
  verifyPayment(providerRef): Promise<PaymentStatus>
}
// Demo ships a SimulatedProvider. PayfastProvider / PeachProvider implement the same interface later.
```

---

## 8. Mobile Service: Feature Flag & Geo-Lock

- **On/off:** `business_settings.mobile_enabled`. When `false`, mobile options are hidden
  everywhere and the geo-check is skipped — mobile becomes a sellable add-on the business can
  enable later.
- **Geo-lock:** at checkout, a mobile booking validates the client's location against the
  business's `service_areas`:
  - `radius` type → is the client within `radius_km` of `center`?
  - `postcodes` type → is the client's postcode in the allowed list?
  - Outside the area → booking blocked with a clear message.

---

## 9. Privacy & Marketing Consent

- `clients.marketing_consent` + `marketing_consent_at` capture explicit, timestamped opt-in.
- Marketing use only for consented clients.
- A privacy policy and clear consent checkbox at signup/checkout (POPIA-aligned, since this is
  South Africa).
- Right to be forgotten: deletion cascades client PII.

---

## 10. Roadmap (Build Order)

1. **Project scaffold** — Next.js + Tailwind + Supabase client.
2. **Schema + seed data** — tables, RLS, one business, ~8 services, 3 stylists, working hours, one service area.
3. **Catalog browsing** — list/detail, onsite + mobile badges.
4. **Cart** — add/remove services, pick mode.
5. **Scheduling UI** — stylist selection + real available-slot picker.
6. **Simulated checkout** — both payment modes; create order + bookings.
7. **Mobile geo-lock + feature flag** — service-area check; on/off toggle.
8. **Business calendar view** — FullCalendar grid of bookings.

---

## 11. Open Questions / To Confirm

- Payment gateway: confirm **Payfast** as primary target (vs Peach).
- Travel time: fixed estimate per service area for v1, or maps-API integration sooner?
- Auth: do clients need accounts, or guest checkout with email only for the demo?
- Default `payment_mode` for the seeded demo business: `upfront` or `confirm_first`?

---

*This is a living document and will evolve as requirements change.*
