-- ============================================================================
-- STAGE C — tighten RLS (owner-scoped). PREPARED, not yet applied.
-- MUST be applied only AFTER the new (RPC-based + auth) code is deployed,
-- otherwise the live site's old direct-insert booking path will break.
-- Also requires: each business has an owner (businesses.owner_id), and /admin
-- is auth-gated with the Bloom business assigned an owner.
-- ============================================================================

-- Helper: does the current logged-in user own this business?
create or replace function owns_business(p_business uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from businesses b
    where b.id = p_business and b.owner_id = auth.uid()
  );
$$;

-- Drop the permissive prototype policies ------------------------------------
drop policy if exists proto_read_businesses on businesses;
drop policy if exists proto_insert_businesses on businesses;
drop policy if exists proto_read_business_settings on business_settings;
drop policy if exists proto_insert_business_settings on business_settings;
drop policy if exists proto_read_services on services;
drop policy if exists proto_insert_services on services;
drop policy if exists proto_read_stylists on stylists;
drop policy if exists proto_insert_stylists on stylists;
drop policy if exists proto_read_stylist_services on stylist_services;
drop policy if exists proto_insert_stylist_services on stylist_services;
drop policy if exists proto_read_working_hours on working_hours;
drop policy if exists proto_insert_working_hours on working_hours;
drop policy if exists proto_read_time_off on time_off;
drop policy if exists proto_read_service_areas on service_areas;
drop policy if exists proto_read_clients on clients;
drop policy if exists proto_insert_clients on clients;
drop policy if exists proto_read_orders on orders;
drop policy if exists proto_insert_orders on orders;
drop policy if exists proto_update_orders on orders;
drop policy if exists proto_read_bookings on bookings;
drop policy if exists proto_insert_bookings on bookings;
drop policy if exists proto_update_bookings on bookings;
drop policy if exists proto_read_payments on payments;
drop policy if exists proto_insert_payments on payments;
drop policy if exists proto_read_reminders on reminders;
drop policy if exists proto_insert_reminders on reminders;
drop policy if exists proto_update_reminders on reminders;
drop policy if exists proto_read_service_categories on service_categories;
drop policy if exists proto_read_provider_profiles on provider_profiles;
drop policy if exists proto_write_provider_profiles on provider_profiles;
drop policy if exists proto_read_provider_categories on provider_categories;
drop policy if exists proto_write_provider_categories on provider_categories;
drop policy if exists proto_read_reviews on reviews;
drop policy if exists proto_write_reviews on reviews;
drop policy if exists proto_read_certifications on certifications;
drop policy if exists proto_write_certifications on certifications;
drop policy if exists proto_read_verification_checks on verification_checks;
drop policy if exists proto_write_verification_checks on verification_checks;

-- PUBLIC-READABLE catalog / profile (no PII) --------------------------------
create policy pub_read_service_categories on service_categories for select using (true);
create policy pub_read_businesses        on businesses        for select using (true);
create policy pub_read_provider_profiles on provider_profiles for select using (active);
create policy pub_read_services          on services          for select using (true);
create policy pub_read_stylists          on stylists          for select using (true);
create policy pub_read_stylist_services  on stylist_services  for select using (true);
create policy pub_read_working_hours     on working_hours     for select using (true);
create policy pub_read_service_areas     on service_areas     for select using (true);
create policy pub_read_provider_categories on provider_categories for select using (true);
create policy pub_read_reviews           on reviews           for select using (status = 'published');

-- OWNER-SCOPED writes on catalog/profile ------------------------------------
create policy own_businesses_ins on businesses for insert with check (owner_id = auth.uid());
create policy own_businesses_upd on businesses for update using (owner_id = auth.uid());
create policy own_settings_all   on business_settings for all using (owns_business(business_id)) with check (owns_business(business_id));
create policy own_services_all   on services for all using (owns_business(business_id)) with check (owns_business(business_id));
create policy own_stylists_all   on stylists for all using (owns_business(business_id)) with check (owns_business(business_id));
create policy own_stylistsvc_all on stylist_services for all using (owns_business(business_id)) with check (owns_business(business_id));
create policy own_hours_all      on working_hours for all using (owns_business(business_id)) with check (owns_business(business_id));
create policy own_areas_all      on service_areas for all using (owns_business(business_id)) with check (owns_business(business_id));
create policy own_provcat_all    on provider_categories for all using (owns_business(business_id)) with check (owns_business(business_id));
create policy own_profile_ins    on provider_profiles for insert with check (owns_business(business_id));
create policy own_profile_upd    on provider_profiles for update using (owns_business(business_id));
create policy own_certs_all      on certifications for all using (owns_business(business_id)) with check (owns_business(business_id));
create policy own_verif_all      on verification_checks for all using (owns_business(business_id)) with check (owns_business(business_id));
create policy own_reviews_upd    on reviews for update using (owns_business(business_id));

-- business_settings: owner reads (config). No public read needed.
create policy own_settings_read  on business_settings for select using (owns_business(business_id));

-- SENSITIVE tables: owner SELECT only; writes happen via SECURITY DEFINER RPCs
-- (create_public_booking) so no anon insert policies are needed.
create policy own_clients_read   on clients   for select using (owns_business(business_id));
create policy own_clients_write  on clients   for update using (owns_business(business_id));
create policy own_orders_read    on orders    for select using (owns_business(business_id));
create policy own_orders_write   on orders    for update using (owns_business(business_id));
create policy own_payments_read  on payments  for select using (owns_business(business_id));
create policy own_bookings_read  on bookings  for select using (owns_business(business_id));
create policy own_bookings_write on bookings  for update using (owns_business(business_id)) with check (owns_business(business_id));
create policy own_reminders_all  on reminders for all using (owns_business(business_id)) with check (owns_business(business_id));

-- NOTE: the cron reminder route (anonymous) won't pass these owner checks.
-- Follow-up: move the reminder engine to a SECURITY DEFINER function or run the
-- cron with the service-role key. (Provider app doesn't use cron reminders yet.)
