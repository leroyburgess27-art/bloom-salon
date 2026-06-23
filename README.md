# Bloom Hair & Nail Studio — Booking App (Prototype)

A working prototype of the hair & nail salon booking app. Single salon, **onsite only**
(mobile add-on is off), built on local seed data so it runs with no database setup.

See `ARCHITECTURE.md` for the full design and `MARKET_RESEARCH.md` for the market analysis.

## What works in this prototype

- Catalogue of Hair & Nail services (browse by category)
- Booking flow: pick a **service → stylist → date → available time slot**
- Real availability — slots come from each stylist's working hours minus existing bookings and buffers (open Tue–Sat, 09:00–17:00)
- Cart (add multiple services)
- **Simulated** checkout with guest details, POPIA marketing-consent checkbox, and **multiple payment options — Cash, Card, QR, Instant EFT (no default)**
- Confirmation screen with a booking reference

No real payment is taken. Mobile service, accounts, and reminders come later.

## Run it

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev
```

Then open http://localhost:3000

Other scripts: `npm run build` (production build), `npm run typecheck` (TypeScript check).

## Project structure

```
db/
  schema.sql        # Postgres/Supabase schema (multi-tenant, RLS, mobile-ready)
  seed.sql          # Demo salon data (matches the app's local seed)
src/
  app/              # Next.js App Router pages
    page.tsx        # Catalogue
    book/[serviceId]/  # Stylist + date + slot selection
    cart/           # Cart
    checkout/       # Guest details + payment method (simulated)
    confirmation/   # Booking confirmation
  components/
    Header.tsx
  lib/
    types.ts        # Domain types (mirror the SQL schema)
    seed.ts         # Local demo data
    repo.ts         # Data-access layer + availability engine (swap for Supabase later)
    cart.tsx        # Cart + order state (React context)
    format.ts       # ZAR currency / duration helpers
```

## Next steps (post-prototype)

- Wire the data layer (`src/lib/repo.ts`) to Supabase using `db/schema.sql`
- Client accounts (Supabase Auth) — currently guest checkout only
- Real payment via PayFast (behind a `PaymentProvider` interface)
- WhatsApp/email reminders
- Business calendar/admin view (FullCalendar)
- Enable the mobile add-on (geo-lock + travel-time scheduling)
