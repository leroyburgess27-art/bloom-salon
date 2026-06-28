# Product Roadmap — Service Provider Platform

**Owner:** Jake (BA/PM) · **Build:** Claude (Senior SWE)
**Last updated:** 24 June 2026
**Mission (non-negotiable):** *Don't be extractive, be empowering.* Low flat fee, providers keep
100% of earnings and own their clients. Built to benefit everyone — especially independent
providers in a high-unemployment market.

This is the central, living roadmap. Other docs: `MOBILE_PROVIDER_STRATEGY.md`,
`PROVIDER_DATA_MODEL.md`, `MARKET_RESEARCH.md`, `TEST_USER_DISCOVERY.md`, `ARCHITECTURE.md`,
`DEPLOY.md`.

---

## The two products (one codebase / DB)

1. **Bloom** — salon/business tier (multi-staff). Onsite demo built + deployed.
2. **Provider app** — individual "service providers" (hair, nails, → skincare, massage, barbering,
   makeup, brows/lashes…). Flat fee, profile-led, mobile-friendly. Pilot build done.

Same Supabase backend; `businesses.account_type` = `individual | business`.

---

## Status legend
✅ done · 🔄 in progress · ⬜ planned · 🅿️ parked (decided, scheduled for a later phase)

---

## Phase 0 — Foundations ✅ (done)
- ✅ Bloom onsite booking demo (catalogue → schedule → cart → simulated multi-payment → confirm)
- ✅ Supabase DB (multi-tenant-ready, RLS) + live data
- ✅ Admin back-office (dashboard, calendar w/ cancel, services, stylists, settings)
- ✅ Reminders engine (email live-capable via Resend key; WhatsApp simulated/stub) + daily cron
- ✅ Deployed to Vercel (GitHub auto-deploy): https://bloom-salon-tau.vercel.app
- ✅ Provider data model (profiles, reviews, certifications, verification ladder, service taxonomy)
- ✅ Provider pilot app: `/join` onboarding, `/p/[slug]` public profile + booking, `/studio/[id]` dashboard
- 🔄 "Mark booking completed" action (enables returning-clients stat + reviews)

## Phase 1 — Pilot with the test user 🔄 (current focus)
Goal: get our real mobile hairdresser using it live, learn from real usage + discovery chat.
- 🔄 Mark-completed action
- ⬜ Deploy provider app so she has a real URL (push current work)
- 🅿️ **Pre-pilot data housekeeping** *(do just before the pilot)* — wipe all test data: bookings, orders, payments, reviews, the demo/test provider accounts (Thandi/Aisha/Nadia/Leeann SP rows), and dupes. Then keep ONE test **client** named "Leeann"; Jake operates the **admin/provider** account "Leroy". Re-seed only what the live pilot needs (Abby).
- ⬜ Onboard test user for real (her services/hours/area)
- ⬜ Let her run it ~1–2 weeks with real clients
- ⬜ Discovery interview (see `TEST_USER_DISCOVERY.md`) + capture usage feedback
- ⬜ Triage feedback into this roadmap

## Phase 2 — Post-pilot core improvements ⬜ (shaped by pilot feedback)
- 🅿️ **Standardised service catalogue + tagging** — replace provider free-text services with a
  curated master list grouped by category ("Hair & styling", "Nails", "Hair removal", …), Fresha
  "Treatments"-style. Provider selects from the list + sets their own price/duration. Cleaner data,
  better discovery filters, no duplicates. *(Raised 24 Jun; do after the test.)* This is ALSO how we
  handle "I do waxing but not certain areas" — boundaries are expressed by which catalogue items are
  toggled on (absence = not offered), NOT a free-text "not available for" list. *(Decided 27 Jun.)*
  Interim: providers free-text only the services they offer; an optional moderated **"Good to know"**
  note (`provider_profiles.good_to_know`) covers soft caveats. Intimate services (e.g. intimate
  waxing) + in-home mobile → later gate behind ID-verified + a consent/policy.
- 🅿️ **Onboarding UX pass** — review/redesign each `/join` step. *(Raised 24 Jun.)*
- 🔄 **UX redesign (page-by-page)** — from a Figma direction, reskin every flow starting at the
  main page. *(Started 27 Jun.)* Done: **home** reframed as a client discovery surface — gradient
  hero, provider/treatment + area search, treatment-category filter, trending-providers grid.
  Brand text routed through a single `BRAND` constant (`src/lib/brand.ts`) so the parked name is a
  1-line swap. Added **Brows** + **Makeup** treatment categories.
  - `/join` onboarding (in progress): **account-first** (email+password before the wizard) + login
    link; individual-only (removed "business name"); **headline auto-composed** from categories +
    mobile + first service area (no free text); **Service areas** as a typed list (map/geo deferred);
    **"Who do you serve?"** Men/Women/Everyone (`provider_profiles.clientele`); expanded treatment
    categories: Hair, Nails, Brows, Makeup, Lashes, Waxing, Braiding, Barber, Skincare, Facials,
    Shaving. TODO: optional light headline personalisation (controlled "specialty" pick) — later;
    real photo upload (Storage); profanity blocklist on name/bio.
  - **Travel/buffer time between appointments** — SP-controlled selector (None/15/30/45 min, default
    None) on `/join` step 4, stored in `business_settings.default_buffer_minutes`. ✅ ENFORCED
    (27 Jun): the `public_busy_times` SECURITY-DEFINER function now expands each busy interval by the
    business's `default_buffer_minutes` (it can read business_settings despite RLS), so booking slots
    leave that gap automatically; the old hardcoded 10-min client buffer in `availableSlots` was
    removed. Verified: a 09:00–10:00 booking with a 10-min buffer returns as 08:50–10:10. NOTE:
    buffer is only settable at onboarding for now — exposing it in studio editing is part of the
    "Studio editing" item.
- ⬜ **Provider search** — home search filters listed providers client-side now; promote to a
  server-side search/`/discover` page (name, treatment, area) as provider count grows.
- ✅ **Auth** (Supabase email/password) + owner-scoped RLS — DONE & verified 27 Jun (anon blocked from client data; providers see only their own). Studio is session-based; /admin auth-gated.
- ✅ **Reviews capture** (28 Jun) — client rates after a completed booking at `/review/[bookingId]` (`submit_review` + `review_context` SECURITY-DEFINER fns; one earned review per booking). Shown on `/p`; provider gets an '⭐ Ask for review' WhatsApp link on completed bookings in studio; feeds `provider_stats` + Verified ladder. Reviewer **name** captured (prefilled from the booking's client) + each review labelled **first-time vs returning client** (computed at submit from the client's completed-booking count); both shown on `/p`.
- ✅ **Client identity & history** (28 Jun) — clients are de-duplicated by **normalised phone** per business (no client accounts/login — decided to keep guest booking frictionless). `create_public_booking` now reuses the existing client (was creating a new row per booking, which silently broke the returning-clients stat). Added `clients.phone_normalized` + `normalize_phone()`; merged legacy duplicate client rows. Studio now shows a **Booking history** (completed) section and a **'↩ Returning client'** badge (client with ≥2 non-cancelled bookings). Optional passwordless client login (phone OTP) is a possible *later* opt-in, never required.
- ⬜ **Studio editing** — edit services, availability, profile, photo upload (Supabase Storage).
- ⬜ **Deposits / real payments** — PayFast integration behind the existing PaymentProvider
  interface; deposit-to-secure-slot for no-show protection (provider keeps it).

## Phase 3 — Trust & growth ⬜
- ⬜ **Verification ladder** — Profile Verified (photo + bookings threshold + cert), then ID
  Verified via outsourced KYC (POPIA-safe: store only a result token, never ID documents).
- ⬜ **Directory / discovery** — browse providers by category + area, filter by Verified/rating.
  Launch only once provider density exists (avoid marketplace cold-start).
- ⬜ **Content moderation / safe listing** — reduce free-text risk: headline is auto-composed from
  categories (done 27 Jun, no typos/abuse); name + bio have length caps + (to add) a basic profanity
  blocklist on submit. New providers default `is_listed=false`, so they never appear in public
  discovery/trending until reviewed — gate public listing on the Verified step. Their own shared
  `/p/[slug]` link still works immediately. Non-extractive: work right away, enter the marketplace
  after a light check.
- ⬜ **Marketing to own clients** — rebooking nudges / campaigns to the consented client list.
- ⬜ **WhatsApp reminders live** — Meta WhatsApp Business API (per-message utility cost).

## Phase 4 — Scale / "business mode" ⬜
- ⬜ **Trending / featured providers as a tier perk** — the home "Trending providers" slots become a
  paid placement (pro-tier boost / featured), ranked fairly (rating + returning clients) for free
  tiers. *(Idea raised 27 Jun during home redesign — keep non-extractive: placement is opt-in, not
  pay-to-be-seen-at-all.)*
- ⬜ Subscription billing (flat fee) + plan gating (free vs pro).
- ⬜ Multi-staff salon tier (Bloom) + per-stylist profiles/reviews.
- ⬜ Onboard more salons + providers; expansion beyond Cape Town.
- ⬜ Native mobile app / PWA; analytics & reporting.

---

## Parked decisions & standing principles
- **Payments:** PayFast is the SA gateway target (Stripe not viable in SA). Simulated until Phase 2.
- **No commission, ever** — flat fee only. Messaging/processing costs are pass-through, only-when-used.
- **POPIA:** marketing only with consent; never store ID documents (use KYC provider).
- **Pricing & packaging (decided 27 Jun; price validate w/ pilot):** Freemium — generous **Free
  (Starter, R0 forever)** + one **Pro at ~R99/mo** (target). NO paywall in onboarding (finish free,
  upgrade later via a Plans screen; payment simulated now → PayFast recurring later). Compete on
  **outcomes + moat (marketplace discovery + reputation data)**, NOT feature count — explicitly
  rejected "out-number Booklink." Booklink (Tora Technologies, Cape Town) is the anchor: Free + **Pro
  R79** (unlimited services/bookings, payments via Yoco/Paystack/PayFast/iKhokha, WhatsApp+email
  reminders, Google Calendar, multi-service, multiple slots/day, group sessions, Meet links,
  storefront branding, remove-branding, up to 5 team + team permissions, priority support; also
  field-level POPIA encryption + Rebill SARS invoicing). We match the **solo-relevant** subset and add
  what they structurally lack. Fresha = cheaper $ but up to 20% new-client commission; Booksy ≈ R399+/mo.
  - **Free (R0):** shareable booking page, unlimited bookings, keep 100% + own clients, all
    treatments/services, **service areas + "comes to you" + travel buffer**, **public trust profile
    (reviews, returning-client count, Profile-Verified badge)**, basic studio (day + week view); listed in discovery
    once Verified.
  - **Pro (~R99):** everything in Free + payments/deposits (no-show protection), WhatsApp + email
    reminders, **featured/priority discovery placement**, **"On my way" + arrival alerts** (signature),
    **provider safety check-in / share-with-trusted-contact** (signature), ID-Verified fast-track,
    remove-branding + storefront colours, analytics, re-booking campaigns; parity later: Google
    Calendar sync, multi-service, multiple slots/day, group sessions, Meet links.
  - **Excluded from individual product** (future *business* tier): team members, team permissions.
  - Signature mobile features chosen from market research (SweepSouth en-route alerts; Urban Company
    tracking/safety; mobile-hairdresser travel fees): **safety check-in + "on my way"**. Travel/call-out
    fee + tips + 1-tap rebook = backlog (not committed). Positioning: "Everything Booklink does for solo
    providers — plus get discovered by new clients and stay safe on mobile jobs — flat R99, 0% commission."
- **Discovery model:** tools + presence first (provider brings own clients); directory is Phase 3.
- **Verified tick** is aspirational, transparent criteria — a goal providers climb toward.

## Small backlog / nice-to-haves
- Studio: ✅ week view (in Free, 27 Jun — Day/Week toggle, week agenda); search/filter 