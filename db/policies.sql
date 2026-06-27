-- ============================================================================
-- PROTOTYPE RLS POLICIES
-- The prototype has no authentication yet (it uses the public anon key), so
-- these policies are intentionally permissive: anyone can read the catalogue
-- and create bookings for the single demo business.
--
-- ⚠️  DEV PHASE: replace these with auth-scoped, tenant-isolated policies
--     (e.g. business_id = auth.jwt() ->> 'business_id') once Supabase Auth is
--     wired up. Do NOT ship these permissive policies to production.
-- ============================================================================

-- Public READ for everything the storefront + admin need to display ----------
create policy proto_read_businesses        on businesses        for select using (true);
create policy proto_read_business_settings on business_settings for select using (true);
create policy proto_read_services          on services          for select using (true);
create policy proto_read_stylists          on stylists          for select using (true);
create policy proto_read_stylist_services  on stylist_services  for select using (true);
create policy proto_read_working_hours     on working_hours     for select using (true);
create policy proto_read_time_off          on time_off          for select using (true);
create policy proto_read_service_areas     on service_areas     for select using (true);
create policy proto_read_clients           on clients           for select using (true);
create policy proto_read_orders            on orders            for select using (true);
create policy proto_read_bookings          on bookings          for select using (true);
create policy proto_read_payments          on payments          for select using (true);

-- Public WRITE for the booking flow (guest checkout) -------------------------
create policy proto_insert_clients   on clients   for insert with check (true);
create policy proto_insert_orders    on orders    for insert with check (true);
create policy proto_insert_bookings  on bookings  for insert with check (true);
create policy proto_insert_payments  on payments  for insert with check (true);

-- Allow updating/cancelling bookings & orders from the admin -----------------
create policy proto_update_bookings on bookings for update using (true) with check (true);
create policy proto_update_orders   on orders   for update using (true) with check (true);

-- Reminders (added with the reminders table migration) -----------------------
create policy proto_read_reminders   on reminders for select using (true);
create policy proto_insert_reminders on reminders for insert with check (true);
create policy proto_update_reminders on reminders for update using (true) with check (true);

-- Provider onboarding writes (added with provider_onboarding_write_policies migration) ----
create policy proto_insert_businesses        on businesses        for insert with check (true);
create policy proto_insert_business_settings on business_settings for insert with check (true);
create policy proto_insert_stylists          on stylists          for insert with check (true);
create policy proto_insert_stylist_services  on stylist_services  for insert with check (true);
create policy proto_insert_working_hours     on working_hours     for insert with check (true);
create policy proto_insert_services          on services          for insert with check (true);
