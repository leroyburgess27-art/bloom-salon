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
- ⬜ Onboard test user for real (her services/hours/area)
- ⬜ Let her run it ~1–2 weeks with real clients
- ⬜ Discovery interview (see `TEST_USER_DISCOVERY.md`) + capture usage feedback
- ⬜ Triage feedback into this roadmap

## Phase 2 — Post-pilot core improvements ⬜ (shaped by pilot feedback)
- 🅿️ **Standardised service catalogue + tagging** — replace provider free-text services with a
  curated master list grouped by category ("Hair & styling", "Nails", "Hair removal", …), Fresha
  "Treatments"-style. Provider selects from the list + sets their own price/duration. Cleaner data,
  better discovery filters, no duplicates. *(Raised 24 Jun; do after the test.)*
- 🅿️ **Onboarding UX pass** — review/redesign each `/join` step. *(Raised 24 Jun.)*
- ⬜ **Auth** (Supabase Auth) + tenant-scoped RLS — REQUIRED before onboarding a 2nd provider
  (studio is currently URL-keyed, RLS is permissive). Security hardening.
- ⬜ **Reviews capture** — client leaves a rating after a completed booking; show on profile.
- ⬜ **Studio editing** — edit services, availability, profile, photo upload (Supabase Storage).
- ⬜ **Deposits / real payments** — PayFast integration behind the existing PaymentProvider
  interface; deposit-to-secure-slot for no-show protection (provider keeps it).

## Phase 3 — Trust & growth ⬜
- ⬜ **Verification ladder** — Profile Verified (photo + bookings threshold + cert), then ID
  Verified via outsourced KYC (POPIA-safe: store only a result token, never ID documents).
- ⬜ **Directory / discovery** — browse providers by category + area, filter by Verified/rating.
  Launch only once provider density exists (avoid marketplace cold-start).
- ⬜ **Marketing to own clients** — rebooking nudges / campaigns to the consented client list.
- ⬜ **WhatsApp reminders live** — Meta WhatsApp Business API (per-message utility cost).

## Phase 4 — Scale / "business mode" ⬜
- ⬜ Subscription billing (flat fee) + plan gating (free vs pro).
- ⬜ Multi-staff salon tier (Bloom) + per-stylist profiles/reviews.
- ⬜ Onboard more salons + providers; expansion beyond Cape Town.
- ⬜ Native mobile app / PWA; analytics & reporting.

---

## Parked decisions & standing principles
- **Payments:** PayFast is the SA gateway target (Stripe not viable in SA). Simulated until Phase 2.
- **No commission, ever** — flat fee only. Messaging/processing costs are pass-through, only-when-used.
- **POPIA:** marketing only with consent; never store ID documents (use KYC provider).
- **Pricing (to validate w/ test user):** individual tier very low (~R49–R99?), free starter; anchor = Booklink R79.
- **Discovery model:** tools + presence first (provider brings own clients); directory is Phase 3.
- **Verified tick** is aspirational, transparent criteria — a goal providers climb toward.

## Small backlog / nice-to-haves
- Studio: week view, search/filter bookings, no-show marking.
- Public page: portfolio photos, share buttons.
- Reminder: configurable lead time; SMS option.
- Accessibility + full mobile polish pass.

---
*Keep this current. When we say "note that for later", it goes here.*
