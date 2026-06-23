-- ============================================================================
-- Hair & Nail Salon Booking App — Database Schema (Postgres / Supabase)
-- Multi-tenant-ready: every domain table carries business_id.
-- Mobile-ready: mobile_enabled flag + service_areas exist but are unused in the
-- prototype (single salon, onsite only).
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists btree_gist;  -- for exclusion constraint on time ranges

-- ============================================================================
-- TENANT
-- ============================================================================
create table businesses (
    id          uuid primary key default uuid_generate_v4(),
    name        text not null,
    slug        text unique not null,
    address     text,
    lat         double precision,
    lng         double precision,
    timezone    text not null default 'Africa/Johannesburg',
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create table business_settings (
    business_id            uuid primary key references businesses(id) on delete cascade,
    mobile_enabled         boolean not null default false,           -- mobile add-on on/off
    payment_mode           text not null default 'upfront'           -- 'upfront' | 'confirm_first'
                           check (payment_mode in ('upfront','confirm_first')),
    -- enabled simulated payment methods shown at checkout (no single default)
    payment_methods        text[] not null default array['cash','card','qr','eft'],
    default_buffer_minutes int  not null default 10,                 -- cleanup between appts
    default_travel_minutes int  not null default 30,                 -- mobile travel estimate
    branding               jsonb not null default '{}'::jsonb,       -- colours, logo, fonts
    updated_at             timestamptz not null default now()
);

-- ============================================================================
-- CATALOG
-- ============================================================================
create table services (
    id               uuid primary key default uuid_generate_v4(),
    business_id      uuid not null references businesses(id) on delete cascade,
    name             text not null,
    description      text,
    category         text not null,                  -- 'Hair' | 'Nails' | ...
    duration_minutes int  not null check (duration_minutes > 0),
    price            numeric(10,2) not null check (price >= 0),
    photo_url        text,
    available_onsite boolean not null default true,
    available_mobile boolean not null default false,
    active           boolean not null default true,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);
create index on services (business_id, category) where active;

-- ============================================================================
-- STAFF / RESOURCES
-- ============================================================================
create table stylists (
    id            uuid primary key default uuid_generate_v4(),
    business_id   uuid not null references businesses(id) on delete cascade,
    name          text not null,
    bio           text,
    avatar_url    text,
    accepts_mobile boolean not null default false,
    active        boolean not null default true,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);
create index on stylists (business_id) where active;

-- which stylist can perform which service (many-to-many)
create table stylist_services (
    business_id uuid not null references businesses(id) on delete cascade,
    stylist_id  uuid not null references stylists(id) on delete cascade,
    service_id  uuid not null references services(id) on delete cascade,
    primary key (stylist_id, service_id)
);

-- recurring weekly availability per stylist
create table working_hours (
    id          uuid primary key default uuid_generate_v4(),
    business_id uuid not null references businesses(id) on delete cascade,
    stylist_id  uuid not null references stylists(id) on delete cascade,
    weekday     int  not null check (weekday between 0 and 6),  -- 0 = Sunday
    start_time  time not null,
    end_time    time not null,
    check (end_time > start_time)
);
create index on working_hours (business_id, stylist_id, weekday);

-- one-off blocks (leave, breaks)
create table time_off (
    id          uuid primary key default uuid_generate_v4(),
    business_id uuid not null references businesses(id) on delete cascade,
    stylist_id  uuid not null references stylists(id) on delete cascade,
    starts_at   timestamptz not null,
    ends_at     timestamptz not null,
    reason      text,
    check (ends_at > starts_at)
);

-- ============================================================================
-- MOBILE GEO-LOCK (unused in prototype; present for forward-compatibility)
-- ============================================================================
create table service_areas (
    id          uuid primary key default uuid_generate_v4(),
    business_id uuid not null references businesses(id) on delete cascade,
    name        text not null,
    type        text not null check (type in ('radius','postcodes')),
    center_lat  double precision,
    center_lng  double precision,
    radius_km   double precision,
    postcodes   text[]
);

-- ============================================================================
-- CLIENTS (also used for marketing — POPIA-aligned consent)
-- ============================================================================
create table clients (
    id                   uuid primary key default uuid_generate_v4(),
    business_id          uuid not null references businesses(id) on delete cascade,
    name                 text not null,
    email                text,
    phone                text,
    address              text,
    lat                  double precision,
    lng                  double precision,
    marketing_consent    boolean not null default false,
    marketing_consent_at timestamptz,
    created_at           timestamptz not null default now()
);
create index on clients (business_id, email);

-- ============================================================================
-- ORDERS & BOOKINGS
-- ============================================================================
create table orders (
    id          uuid primary key default uuid_generate_v4(),
    business_id uuid not null references businesses(id) on delete cascade,
    client_id   uuid references clients(id) on delete set null,
    total       numeric(10,2) not null default 0,
    status      text not null default 'pending'
                check (status in ('pending','paid','awaiting_confirmation','cancelled')),
    created_at  timestamptz not null default now()
);

create table bookings (
    id            uuid primary key default uuid_generate_v4(),
    business_id   uuid not null references businesses(id) on delete cascade,
    order_id      uuid references orders(id) on delete cascade,
    client_id     uuid references clients(id) on delete set null,
    service_id    uuid not null references services(id),
    stylist_id    uuid references stylists(id),
    service_mode  text not null default 'onsite' check (service_mode in ('onsite','mobile')),
    location_type text not null default 'salon'  check (location_type in ('salon','client')),
    address       text,
    lat           double precision,
    lng           double precision,
    starts_at     timestamptz not null,
    ends_at       timestamptz not null,
    status        text not null default 'pending'
                  check (status in ('pending','confirmed','completed','cancelled')),
    created_at    timestamptz not null default now(),
    check (ends_at > starts_at),
    -- prevent double-booking the same stylist over overlapping time ranges
    constraint no_overlap exclude using gist (
        stylist_id with =,
        tstzrange(starts_at, ends_at) with &&
    ) where (status <> 'cancelled')
);
create index on bookings (business_id, stylist_id, starts_at);

-- ============================================================================
-- PAYMENTS (simulated in prototype; real provider e.g. PayFast later)
-- ============================================================================
create table payments (
    id           uuid primary key default uuid_generate_v4(),
    business_id  uuid not null references businesses(id) on delete cascade,
    order_id     uuid not null references orders(id) on delete cascade,
    provider     text not null default 'simulated'
                 check (provider in ('simulated','payfast','peach','yoco')),
    method       text,                              -- 'cash' | 'card' | 'qr' | 'eft'
    provider_ref text,
    amount       numeric(10,2) not null,
    status       text not null default 'pending'
                 check (status in ('pending','succeeded','failed','refunded')),
    created_at   timestamptz not null default now()
);

-- ============================================================================
-- ROW-LEVEL SECURITY (multi-tenant isolation)
-- Enable RLS on every tenant table. Policies assume a JWT claim `business_id`
-- (set when auth is added in DEV). Documented here; refine when Supabase Auth
-- is wired up.
-- ============================================================================
alter table businesses        enable row level security;
alter table business_settings enable row level security;
alter table services          enable row level security;
alter table stylists          enable row level security;
alter table stylist_services  enable row level security;
alter table working_hours     enable row level security;
alter table time_off          enable row level security;
alter table service_areas     enable row level security;
alter table clients           enable row level security;
alter table orders            enable row level security;
alter table bookings          enable row level security;
alter table payments          enable row level security;

-- Example tenant-isolation policy (repeat per table once auth is in place):
-- create policy tenant_isolation on services
--   using (business_id = (auth.jwt() ->> 'business_id')::uuid);

-- ============================================================================
-- REMINDERS (added via migration create_reminders_table)
-- Appointment reminders, generated ~24h before each booking. Email goes live
-- with a provider key; WhatsApp is simulated until the Meta API is connected.
-- ============================================================================
create table reminders (
    id            uuid primary key default uuid_generate_v4(),
    business_id   uuid not null references businesses(id) on delete cascade,
    booking_id    uuid not null references bookings(id) on delete cascade,
    channel       text not null check (channel in ('email','whatsapp')),
    to_contact    text,
    message       text,
    scheduled_for timestamptz not null,
    status        text not null default 'scheduled'
                  check (status in ('scheduled','sent','simulated','failed')),
    sent_at       timestamptz,
    created_at    timestamptz not null default now(),
    unique (booking_id, channel)
);
create index on reminders (business_id, status, scheduled_for);
alter table reminders enable row level security;
