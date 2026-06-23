-- ============================================================================
-- Seed data — one demo salon (Hair & Nail), onsite only, mobile OFF.
-- Fixed UUIDs so the app's local seed and the DB stay in sync.
-- Re-runnable: clears the demo business first (cascade removes its child rows).
-- ============================================================================

-- Clean slate for this demo business (cascades to all related tables) --------
delete from businesses where id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Business -------------------------------------------------------------------
insert into businesses (id, name, slug, address, lat, lng) values
  ('11111111-1111-1111-1111-111111111111',
   'Bloom Hair & Nail Studio', 'bloom-studio',
   '12 Main Road, Claremont, Cape Town', -33.9846, 18.4665);

insert into business_settings (business_id, mobile_enabled, payment_mode, payment_methods, default_buffer_minutes)
values
  ('11111111-1111-1111-1111-111111111111', false, 'upfront',
   array['cash','card','qr','eft'], 10);

-- Stylists -------------------------------------------------------------------
insert into stylists (id, business_id, name, bio, active) values
  ('22222222-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Naledi M.','Senior hair stylist — cuts, colour & treatments.', true),
  ('22222222-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Thandi K.','Braids, weaves & natural hair specialist.', true),
  ('22222222-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Aisha P.','Nail technician — gel, acrylic & nail art.', true);

-- Services (Hair) ------------------------------------------------------------
insert into services (id, business_id, name, description, category, duration_minutes, price) values
  ('33333333-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Ladies Cut & Blow-dry','Wash, cut and professional blow-dry.','Hair',60,320.00),
  ('33333333-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Gents Cut','Classic or modern cut and style.','Hair',30,180.00),
  ('33333333-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Full Colour','Single-process all-over colour.','Hair',120,650.00),
  ('33333333-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Highlights','Foil highlights with toner.','Hair',150,890.00),
  ('33333333-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Knotless Braids','Protective knotless box braids.','Hair',240,750.00),
  ('33333333-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','Deep Conditioning Treatment','Repairing mask and scalp treatment.','Hair',45,250.00);

-- Services (Nails) -----------------------------------------------------------
insert into services (id, business_id, name, description, category, duration_minutes, price) values
  ('33333333-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','Gel Overlay','Gel overlay on natural nails.','Nails',60,280.00),
  ('33333333-0000-0000-0000-000000000008','11111111-1111-1111-1111-111111111111','Acrylic Full Set','Full set of acrylic nails.','Nails',90,420.00),
  ('33333333-0000-0000-0000-000000000009','11111111-1111-1111-1111-111111111111','Classic Manicure','File, shape, cuticle care and polish.','Nails',45,200.00),
  ('33333333-0000-0000-0000-000000000010','11111111-1111-1111-1111-111111111111','Pedicure & Polish','Soak, scrub, cuticle care and polish.','Nails',60,260.00),
  ('33333333-0000-0000-0000-000000000011','11111111-1111-1111-1111-111111111111','Nail Art (per nail)','Custom hand-painted nail art.','Nails',15,40.00);

-- Stylist <-> service capability --------------------------------------------
-- Naledi & Thandi do hair; Aisha does nails. (Literals cast to uuid for the UNION.)
insert into stylist_services (business_id, stylist_id, service_id)
select '11111111-1111-1111-1111-111111111111'::uuid, s.id, sv.id
from stylists s
join services sv on sv.business_id = s.business_id
where s.id in ('22222222-0000-0000-0000-000000000001'::uuid,'22222222-0000-0000-0000-000000000002'::uuid)
  and sv.category = 'Hair'
union all
select '11111111-1111-1111-1111-111111111111'::uuid,'22222222-0000-0000-0000-000000000003'::uuid, sv.id
from services sv
where sv.business_id = '11111111-1111-1111-1111-111111111111'::uuid and sv.category = 'Nails';

-- Working hours: Tue–Sat 09:00–17:00 for all stylists (weekday 2..6) ---------
insert into working_hours (business_id, stylist_id, weekday, start_time, end_time)
select '11111111-1111-1111-1111-111111111111'::uuid, s.id, d.weekday, time '09:00', time '17:00'
from stylists s
cross join (values (2),(3),(4),(5),(6)) as d(weekday)
where s.business_id = '11111111-1111-1111-1111-111111111111'::uuid;
