# Supabase Setup — step by step

This connects the app to a real (persistent) database. It's free. You'll create a
project, run three SQL files, and paste two keys into a local file. ~10 minutes.

> You don't need to share any keys with me. They go into a local file on your
> machine (`.env.local`), which is git-ignored. When you're done, just tell me and
> I'll switch the app's data layer over to Supabase and we'll test together.

## 1. Create the project

1. Go to https://supabase.com and sign up (GitHub or email).
2. Click **New project**.
3. Name it e.g. `bloom-salon`. Choose a **database password** (save it somewhere).
4. Region: pick the closest — **EU (Frankfurt)** or **EU (London)** are usually
   best for South Africa. (There's no Africa region; closest latency wins.)
5. Click **Create new project** and wait ~2 minutes for it to provision.

## 2. Run the SQL (in order)

In the dashboard, open **SQL Editor** (left sidebar) → **New query**, then run each
file's contents in this order. Open each file from the `db/` folder, copy all of it,
paste, and click **Run**.

1. **`db/schema.sql`** — creates all the tables, constraints, and enables RLS.
2. **`db/seed.sql`** — inserts the demo salon, services, stylists, and hours.
3. **`db/policies.sql`** — adds the prototype access rules so the app can read/write.

After each one you should see "Success. No rows returned" (or similar). If a step
errors, stop and send me the message.

> Tip: you can verify by opening **Table Editor** — you should see `services` with
> 11 rows, `stylists` with 3, etc.

## 3. Get your keys

1. In the dashboard go to **Project Settings** (gear icon) → **API**.
2. Copy two values:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (a long string under "Project API keys")

## 4. Add the keys locally

1. In the project folder, copy `.env.local.example` to a new file named `.env.local`.
2. Paste your values:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_BUSINESS_ID=11111111-1111-1111-1111-111111111111
   ```

3. Install the new dependency and restart the dev server:

   ```bash
   npm install
   npm run dev
   ```

## 5. Tell me

Once the SQL has run and `.env.local` is filled in, let me know. I'll then convert
the data layer (`src/lib/repo.ts` and the bookings store) to read from and write to
Supabase, and we'll confirm a booking made on the storefront persists — visible on
the admin calendar even after a full page refresh.

---

### What changes after this

- Bookings, clients, orders and payments **persist** (no more reset on refresh).
- The catalogue, stylists and availability come from the database.
- The foundation is in place for the DEV phase: client accounts (Supabase Auth),
  real PayFast payments, and tenant-scoped security policies.

### A note on the permissive policies

`db/policies.sql` is deliberately open (anyone can read/write the demo business)
because the prototype has no login yet. That's fine for a local demo, **but we must
replace these with auth-scoped policies before any real launch.** It's noted in the
file and on our roadmap.
