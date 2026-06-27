-- ============================================================================
-- Provider model — extends Bloom for individual "service providers".
-- ADDITIVE ONLY: does not alter existing Bloom tables' behaviour, so the live
-- deployment keeps working. Safe to run once on the existing database.
-- See PROVIDER_DATA_MODEL.md for the design rationale.
-- ============================================================================

-- 1. Account type + plan on businesses ---------------------------------------
alter table businesses add column if not exists account_type text not null default 'business'
  check (account_type in ('individual','business'));
alter table businesses add column if not exists plan text not null default 'free'
  check (plan in ('free','pro'));

-- 2. Extensible service taxonomy ---------------------------------------------
create table if not exists service_categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text unique not null,
  sort_order int  not null default 0,
  active     boolean not null default true
);
insert into service_categories (name, slug, sort_order) values
  ('Hair', 'hair', 1),
  ('Nails', 'nails', 2)
on conflict (slug) do nothing;

-- 3. Provider profile ---------------------------------------------------------
create table if not exists provider_profiles (
  business_id        uuid primary key references businesses(id) on delete cascade,
  slug               text unique not null,
  display_name       text not null,
  headline           text,
  bio                text,
  photo_url          text,
  years_experience   int,
  accepts_mobile     boolean not null default true,
  base_area          text,
  base_lat           double precision,
  base_lng           double precision,
  verification_level text not null default 'none'
                     check (verification_level in ('none','profile','id')),
  is_listed          boolean not null default false,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists provider_categories (
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid not null references service_categories(id) on delete cascade,
  primary key (business_id, category_id)
);

-- 4. Reviews (one per completed booking = earned) ----------------------------
create table if not exists reviews (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  booking_id  uuid not null references bookings(id) on delete cascade,
  client_id   uuid references clients(id) on delete set null,
  stylist_id  uuid references stylists(id) on delete set null,
  rating      int  not null check (rating between 1 and 5),
  comment     text,
  reply       text,
  replied_at  timestamptz,
  status      text not null default 'published' check (status in ('published','hidden')),
  created_at  timestamptz not null default now(),
  unique (booking_id)
);
create index if not exists reviews_business_idx on reviews (business_id, status);

-- 5. Certifications -----------------------------------------------------------
create table if not exists certifications (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  stylist_id  uuid references stylists(id) on delete cascade,
  title       text not null,
  issuer      text,
  proof_url   text,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);

-- 6. Verification checks (POPIA-safe: id_kyc stores only an external ref) -----
create table if not exists verification_checks (
  id           uuid primary key default uuid_generate_v4(),
  business_id  uuid not null references businesses(id) on delete cascade,
  type         text not null check (type in ('photo','bookings_threshold','certification','id_kyc')),
  status       text not null default 'pending' check (status in ('pending','passed','failed')),
  provider_ref text,  -- external KYC reference/result token ONLY — never an ID document or number
  notes        text,
  created_at   timestamptz not null default now()
);

-- 7. Derived stats view (rating + returning customers) -----------------------
create or replace view provider_stats as
select
  b.id as business_id,
  coalesce(round(avg(r.rating)::numeric, 2), 0) as rating_avg,
  count(r.id) as rating_count,
  (
    select count(*) from (
      select bk.client_id
      from bookings bk
      where bk.business_id = b.id
        and bk.status = 'completed'
        and bk.client_id is not null
      group by bk.client_id
      having count(*) >= 2
    ) rc
  ) as returning_clients
from businesses b
left join reviews r on r.business_id = b.id and r.status = 'published'
group by b.id;

-- 8. RLS + prototype policies -------------------------------------------------
alter table service_categories   enable row level security;
alter table provider_profiles    enable row level security;
alter table provider_categories  enable row level security;
alter table reviews              enable row level security;
alter table certifications       enable row level security;
alter table verification_checks  enable row level security;

-- Prototype-permissive policies (mirror existing approach). Tighten with auth in DEV:
--   * provider tables: scope writes to business_id = auth.jwt() business_id
--   * reviews insert: only when the JWT client owns a 'completed' booking
create policy proto_read_service_categories   on service_categories   for select using (true);
create policy proto_read_provider_profiles    on provider_profiles    for select using (true);
create policy proto_write_provider_profiles   on provider_profiles    for all    using (true) with check (true);
create policy proto_read_provider_categories  on provider_categories  for select using (true);
create policy proto_write_provider_categories on provider_categories  for all    using (true) with check (true);
create policy proto_read_reviews              on reviews              for select using (true);
create policy proto_write_reviews             on reviews              for all    using (true) with check (true);
create policy proto_read_certifications       on certifications       for select using (true);
create policy proto_write_certifications      on certifications       for all    using (true) with check (true);
create policy proto_read_verification_checks  on verification_checks   for select using (true);
create policy proto_write_verification_checks on verification_checks   for all    using (true) with check (true);
