# Provider Data Model — extending Bloom for "Service Providers"

**Date:** 23 June 2026
**Status:** Design draft v0.1 — for review before applying to the database
**Builds on:** `db/schema.sql` (Bloom). All additions are **additive** — nothing here changes
existing Bloom tables/queries, so the live deployment keeps working.

---

## 1. Design principles

1. **Generic "service provider", not "hairdresser".** The model never hard-codes hair/nails. A
   provider offers services in one or more **categories** drawn from an extensible lookup table.
   We seed **Hair** and **Nails** now; Skincare, Massage, Barbering, Makeup, Brows/Lashes, etc.
   are just new rows later — no schema change.
2. **A provider is a "business of one".** We reuse Bloom's `businesses` table and tag it with an
   `account_type`. An individual = one business whose single `stylist` is themselves.
3. **Trust is first-class.** Profiles, reviews, certifications and a verification ladder are core
   tables, not afterthoughts.
4. **POPIA-safe verification.** We never store ID documents. ID verification stores only an
   external KYC reference + result.
5. **Derive what you can.** The returning-customer metric and rating aggregates are computed
   (a SQL view) rather than duplicated, to avoid drift. (Can be cached later for directory perf.)
6. **Reuse the engine.** Bookings, slots, payments, reminders, `service_areas` and the mobile
   fields on `bookings` are reused as-is.

---

## 2. Account type (extend `businesses`)

```sql
alter table businesses add column account_type text not null default 'business'
  check (account_type in ('individual','business'));
alter table businesses add column plan text not null default 'free'
  check (plan in ('free','pro'));   -- flat-fee tiers; no commission, ever
```
- `individual` → the provider app (profile-centric, solo).
- `business` → Bloom (multi-staff salon).
- `plan` drives feature gating (free starter vs paid). Existing Bloom rows default to `business`
  / `free`, unaffected.

## 3. Extensible service taxonomy (new lookup)

```sql
create table service_categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,         -- "Hair", "Nails", later "Skincare", "Massage"…
  slug        text unique not null,  -- "hair", "nails"
  sort_order  int  not null default 0,
  active      boolean not null default true
);
```
- Seed only **Hair** and **Nails** for now.
- `services.category` (free text on Bloom) stays as-is for now to avoid breaking the live app; a
  later, optional migration can add `services.category_id → service_categories` and backfill.
- Directory filters ("show me Nail techs near me") query this table.

## 4. Provider profile (the public page)

One profile per provider account (keyed by `business_id`). For multi-staff salons, per-stylist
profiles are a future extension; for individuals, the business *is* the provider.

```sql
create table provider_profiles (
  business_id        uuid primary key references businesses(id) on delete cascade,
  slug               text unique not null,          -- public URL: /p/<slug>
  display_name       text not null,
  headline           text,                           -- "Mobile barber • Cape Town"
  bio                text,
  photo_url          text,                           -- clear photo of the provider
  years_experience   int,
  accepts_mobile     boolean not null default true,
  base_area          text,                           -- human label, e.g. "Southern Suburbs"
  base_lat           double precision,
  base_lng           double precision,
  verification_level text not null default 'none'
                     check (verification_level in ('none','profile','id')),
  is_listed          boolean not null default false, -- opt-in to the Phase-2 directory
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- what a provider does (drives directory filters); many-to-many
create table provider_categories (
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid not null references service_categories(id) on delete cascade,
  primary key (business_id, category_id)
);
```

## 5. Reviews (earned, with right-of-reply)

```sql
create table reviews (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  booking_id  uuid not null references bookings(id) on delete cascade,
  client_id   uuid references clients(id) on delete set null,
  stylist_id  uuid references stylists(id) on delete set null, -- who performed it
  rating      int  not null check (rating between 1 and 5),
  comment     text,
  reply       text,                       -- provider right-of-reply
  replied_at  timestamptz,
  status      text not null default 'published'
              check (status in ('published','hidden')),
  created_at  timestamptz not null default now(),
  unique (booking_id)                     -- one review per completed booking = earned, hard to fake
);
```
- Aggregate (avg + count) is **computed** from `reviews` (see §8), not stored on the profile.
- App rule: a review can only be created for a booking with `status = 'completed'` belonging to
  that client. Enforced in app code now; enforce in DB with a trigger/auth policy in the DEV phase.

## 6. Certifications

```sql
create table certifications (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  stylist_id  uuid references stylists(id) on delete cascade,
  title       text not null,              -- "Certified Colour Specialist"
  issuer      text,
  proof_url   text,                       -- uploaded cert image/pdf (Supabase Storage)
  status      text not null default 'pending'
              check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);
```

## 7. Verification ladder (POPIA-safe)

`provider_profiles.verification_level` is the displayed badge: `none → profile → id`.
The underlying checks are logged so the badge is auditable:

```sql
create table verification_checks (
  id           uuid primary key default uuid_generate_v4(),
  business_id  uuid not null references businesses(id) on delete cascade,
  type         text not null check (type in ('photo','bookings_threshold','certification','id_kyc')),
  status       text not null default 'pending'
               check (status in ('pending','passed','failed')),
  provider_ref text,        -- external KYC reference token ONLY (never an ID document)
  notes        text,
  created_at   timestamptz not null default now()
);
```
- **Profile Verified** = `photo` + `bookings_threshold` + an approved `certification` all `passed`.
- **ID Verified** = the above + an `id_kyc` check `passed`. ⚠️ The `id_kyc` row stores only the
  KYC provider's reference/result — **no ID images or numbers are ever stored by us** (POPIA).
- A small app/DB function recomputes `verification_level` whenever a check changes.

## 8. Derived metrics (a view, not a table)

```sql
create view provider_stats as
select
  b.id as business_id,
  coalesce(round(avg(r.rating)::numeric, 2), 0)            as rating_avg,
  count(r.id)                                              as rating_count,
  (select count(*) from (
      select bk.client_id
      from bookings bk
      where bk.business_id = b.id and bk.status = 'completed' and bk.client_id is not null
      group by bk.client_id
      having count(*) >= 2
   ) returning_clients)                                    as returning_clients
from businesses b
left join reviews r on r.business_id = b.id and r.status = 'published'
group by b.id;
```
- **Returning-customer count** = clients with ≥2 completed bookings — our strongest, least-fakeable
  trust signal, free from existing data.
- Cache into `provider_profiles` later if the directory needs the speed.

## 9. Mobile (reuse what exists)

No new tables needed:
- **`service_areas`** (already in schema) — the geo-lock; each provider defines radius or postcodes.
- **`bookings`** already has `service_mode`, `location_type`, `address`, `lat`, `lng`.
- **`business_settings.default_travel_minutes`** — travel buffer for slot generation.
- Optional later: per-area travel time, or a maps-API distance check.

## 10. Relationships (summary)

```
businesses (account_type, plan)
  ├─1:1 provider_profiles
  ├─*:* service_categories  (via provider_categories)
  ├─1:* certifications
  ├─1:* verification_checks
  ├─1:* reviews            (each tied 1:1 to a completed booking)
  └─ (existing) services, stylists, working_hours, service_areas, clients, orders, bookings, payments, reminders
provider_stats  = view over bookings + reviews
```

## 11. RLS (prototype → DEV)

Prototype (no auth yet): public **read** on `service_categories`, `provider_profiles` (where
`active`), `reviews` (where `published`), `certifications` (approved); permissive insert/update as
today. DEV phase: scope writes to the owning provider (`business_id = auth.jwt() business_id`),
and allow a `reviews` insert only when the JWT client owns a `completed` booking. Documented in
the migration.

## 12. Open questions

- Per-stylist profiles for multi-staff salons (later) vs per-business now (chosen).
- Should businesses (salons) also get public profiles + reviews, or only individuals? (Leaning:
  both can, reusing the same tables — a salon profile aggregates its stylists.)
- Caching `provider_stats` onto the profile for directory performance — when needed.
- Exact "bookings_threshold" number for Profile Verified (e.g. 5 completed) — set with test-user input.
- KYC provider choice for ID Verified (SA Home Affairs-backed options) — evaluate at that phase.
```
