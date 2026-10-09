-- Database-level tests for RLS and booking/quotation guards.
-- Run against a LOCAL database only: psql -v ON_ERROR_STOP=1 -f supabase/tests/rls_and_workflow.sql
-- Everything runs inside a transaction that is rolled back.
begin;

create or replace function pg_temp.expect_error(sql text, label text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    raise notice 'PASS (blocked): % -> %', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL: % was allowed', label;
end $$;

create or replace function pg_temp.expect_count(sql text, expected int, label text) returns void language plpgsql as $$
declare n int;
begin
  execute 'select count(*) from (' || sql || ') s' into n;
  if n <> expected then raise exception 'FAIL: % expected % rows, got %', label, expected, n; end if;
  raise notice 'PASS: % (% rows)', label, n;
end $$;

-- Fixtures (as superuser)
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'staff@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'inactive@test.local', 'authenticated', 'authenticated');
update public.profiles set role = 'owner', is_active = true where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles set role = 'staff', is_active = true where id = '00000000-0000-0000-0000-0000000000a2';

select public.upsert_customer('Test Guest', 'guest@example.com', '+44 7700 900999', '+447700900999') as cid \gset
-- dedupe by email and by phone
select pg_temp.expect_count($$select 1 where public.upsert_customer('Test Guest', 'GUEST@example.com', null, null) = '$$ || :'cid' || $$'$$, 1, 'customer dedupe by email (case-insensitive)');
select pg_temp.expect_count($$select 1 where public.upsert_customer('T G', null, '0044 7700', '+447700900999') = '$$ || :'cid' || $$'$$, 1, 'customer dedupe by phone');
select pg_temp.expect_count($$select 1 where public.upsert_customer('Other Person', 'other.person@example.com', null, '+447700900999') <> '$$ || :'cid' || $$'$$, 1, 'same phone but different email is a separate customer');

insert into public.bookings (customer_id, service_type, status, start_date, adults, consent_privacy, consent_at)
values (:'cid', 'AIRPORT_TRANSFER', 'CONFIRMED', current_date + 30, 2, true, now())
returning id as bid, status as initial_status \gset
select pg_temp.expect_count($$select 1 where '$$ || :'initial_status' || $$' = 'NEW_INQUIRY'$$, 1, 'insert cannot start as CONFIRMED');
insert into public.internal_notes (booking_id, body) values (:'bid', 'Private note');
insert into public.trip_requests (full_name, email, phone, arrival_date, departure_date, adults, consent_privacy)
values ('Trip Person', 'trip@example.com', '+1 555 0100', current_date + 10, current_date + 20, 2, true);

-- Expected counts, taken as superuser (tests must work on any dataset).
select (select count(*) from public.destinations where status = 'published') as n_dest,
       (select count(*) from public.tours where status = 'published') as n_tours,
       (select count(*) from public.vehicles where is_active and is_public) as n_vehicles,
       (select count(*) from public.bookings) as n_bookings,
       (select count(*) from public.internal_notes) as n_notes,
       (select count(*) from public.audit_logs) as n_audit \gset

-- ---------------- anon ----------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select pg_temp.expect_count('select * from public.destinations', :n_dest, 'anon reads only published destinations');
select pg_temp.expect_count('select * from public.tours', :n_tours, 'anon reads only published tours');
select pg_temp.expect_count('select * from public.customers', 0, 'anon cannot read customers');
select pg_temp.expect_count('select * from public.bookings', 0, 'anon cannot read bookings');
select pg_temp.expect_count('select * from public.internal_notes', 0, 'anon cannot read notes');
select pg_temp.expect_count('select * from public.trip_requests', 0, 'anon cannot read trip requests');
select pg_temp.expect_count('select * from public.pricing_rules', 0, 'anon cannot read pricing');
select pg_temp.expect_count($$select * from public.site_settings where key = 'notifications'$$, 0, 'anon cannot read private settings');
select pg_temp.expect_count('select id, name from public.vehicles', :n_vehicles, 'anon reads only active public vehicles');
select pg_temp.expect_error('select registration_number from public.vehicles', 'anon reading vehicle registration');
select pg_temp.expect_error($$insert into public.bookings (customer_id, service_type) values ('$$ || :'cid' || $$', 'TOUR')$$, 'anon inserting booking');
select pg_temp.expect_error($$update public.tours set name = 'x'$$, 'anon updating tours');
select pg_temp.expect_error($$update public.profiles set role = 'owner'$$, 'anon escalating role');
select pg_temp.expect_error($$select public.upsert_customer('x', 'x@x.com', null, null)$$, 'anon calling upsert_customer');
select pg_temp.expect_error($$select public.consume_form_attempt('x', 'y', 5, '1 hour')$$, 'anon calling rate limiter');
select pg_temp.expect_error($$select public.dashboard_metrics()$$, 'anon reading metrics');
reset role;

-- ---------------- inactive authenticated user ----------------
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-0000000000a3"}', true);
select pg_temp.expect_count('select * from public.bookings', 0, 'inactive user cannot read bookings');
select pg_temp.expect_count('select * from public.customers', 0, 'inactive user cannot read customers');
select pg_temp.expect_error($$update public.profiles set role = 'owner', is_active = true where id = auth.uid()$$, 'inactive user self-escalation');
select pg_temp.expect_count($$select * from public.tours where status <> 'published'$$, 0, 'inactive user sees no drafts');
reset role;

-- ---------------- active staff ----------------
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-0000000000a2"}', true);
select pg_temp.expect_count('select * from public.bookings', :n_bookings, 'staff reads all bookings');
select pg_temp.expect_count('select * from public.internal_notes', :n_notes, 'staff reads notes');
select pg_temp.expect_error($$update public.profiles set role = 'owner' where id = auth.uid()$$, 'staff self-promotion');
update public.site_settings set value = '{}' where key = 'business';
select pg_temp.expect_count($$select 1 from public.site_settings where key = 'business' and value ? 'name'$$, 1, 'staff cannot edit settings (admin only)');
select pg_temp.expect_count($$select * from public.site_settings where key='notifications'$$, 1, 'staff reads private settings');
select pg_temp.expect_error($$insert into public.audit_logs (actor_id, action, entity_type) values ('00000000-0000-0000-0000-0000000000a1', 'x', 'y')$$, 'staff forging audit actor');
insert into public.audit_logs (actor_id, action, entity_type) values (auth.uid(), 'test', 'booking');
select pg_temp.expect_count('select * from public.audit_logs', 0, 'staff cannot read audit log (admin only)');
select pg_temp.expect_count('select * from public.driver_private', 0, 'staff cannot read driver licences');

-- Booking workflow guards
select pg_temp.expect_error($$select public.change_booking_status('$$ || :'bid' || $$', 'COMPLETED')$$, 'skip NEW_INQUIRY -> COMPLETED');
select public.change_booking_status(:'bid', 'CONTACTED', 'Called guest on WhatsApp');
select (public.create_quotation(:'bid', 'LKR')).id as qid \gset
select pg_temp.expect_error($$select public.mark_quotation_sent('$$ || :'qid' || $$')$$, 'sending empty quotation');
select public.save_quotation_draft(:'qid', 'LKR',
  '[{"description":"Airport transfer, sedan","quantity":1,"unit_price":"15000.50"},{"description":"Extra stop","quantity":2,"unit_price":"1250.25"}]'::jsonb,
  'Repeat guest', 500, array['Fuel'], array['Tips'], current_date + 14, 'internal', 'Terms');
select pg_temp.expect_count($$select 1 from public.quotations where id = '$$ || :'qid' || $$' and subtotal = 17501.00 and total = 17001.00$$, 1, 'quotation totals computed in DB');
select public.mark_quotation_sent(:'qid');
select pg_temp.expect_count($$select 1 from public.bookings where id = '$$ || :'bid' || $$' and status = 'QUOTATION_SENT'$$, 1, 'sending quotation advances booking');
select pg_temp.expect_error($$update public.quotations set total = 1 where id = '$$ || :'qid' || $$'$$, 'editing a sent quotation');
select pg_temp.expect_error($$insert into public.quotation_line_items (quotation_id, description, quantity, unit_price, line_total) values ('$$ || :'qid' || $$', 'x', 1, 1, 1)$$, 'adding items to sent quotation');
select pg_temp.expect_error($$select public.change_booking_status('$$ || :'bid' || $$', 'CONFIRMED', null, null, true)$$, 'confirm before customer acceptance');
update public.quotations set status = 'ACCEPTED' where id = :'qid';
select pg_temp.expect_error($$select public.change_booking_status('$$ || :'bid' || $$', 'CONFIRMED', null, null, false)$$, 'confirm without availability check');
select pg_temp.expect_error($$select public.change_booking_status('$$ || :'bid' || $$', 'CONFIRMED', null, null, true)$$, 'staff (non-admin) confirming');
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-0000000000a1"}', true);
select public.change_booking_status(:'bid', 'CONFIRMED', 'Vehicle and driver checked', null, true);
select pg_temp.expect_count($$select 1 from public.bookings where id = '$$ || :'bid' || $$' and status = 'CONFIRMED' and final_amount = 17001.00 and final_currency = 'LKR' and confirmed_by = auth.uid()$$, 1, 'owner-confirmed booking records amount and actor');
update public.bookings set confirmed_at = now() - interval '1 year' where id = :'bid';
select pg_temp.expect_count($$select 1 from public.bookings where id = '$$ || :'bid' || $$' and confirmed_at > now() - interval '1 day'$$, 1, 'confirmed_at cannot be back-dated');
select pg_temp.expect_error($$select public.change_booking_status('$$ || :'bid' || $$', 'CANCELLED', null, '  ')$$, 'cancel without reason');
select pg_temp.expect_count($$select * from public.booking_status_history where booking_id = '$$ || :'bid' || $$'$$, 4, 'status history recorded');
select pg_temp.expect_count($$select * from public.booking_status_history where booking_id = '$$ || :'bid' || $$' and to_status = 'CONTACTED' and note = 'Called guest on WhatsApp' and changed_by = '00000000-0000-0000-0000-0000000000a2'$$, 1, 'history keeps note and actor');

-- Revision creates a new draft with copied items
select (public.revise_quotation(:'qid')).id as q2 \gset
select pg_temp.expect_count($$select 1 from public.quotations where id = '$$ || :'q2' || $$' and status = 'DRAFT' and version = 2 and total = 17001.00$$, 1, 'revision copies totals into v2 draft');
select pg_temp.expect_count($$select * from public.quotation_line_items where quotation_id = '$$ || :'q2' || $$'$$, 2, 'revision copies line items');

-- Assignment conflicts
insert into public.vehicles (name, category, passenger_capacity) values ('Test van', 'VAN', 8) returning id as vid \gset
insert into public.assignments (booking_id, vehicle_id, starts_on, ends_on) values (:'bid', :'vid', current_date + 30, current_date + 32);
select pg_temp.expect_count($$select * from public.assignment_conflicts('$$ || :'vid' || $$', null, current_date + 31, current_date + 35)$$, 1, 'overlapping vehicle assignment detected');
select pg_temp.expect_count($$select * from public.assignment_conflicts('$$ || :'vid' || $$', null, current_date + 33, current_date + 35)$$, 0, 'non-overlapping dates are free');
reset role;

-- ---------------- owner ----------------
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-0000000000a1"}', true);
update public.site_settings set value = value || '{"phone":"+94 77 620 5149"}' where key = 'business';
select pg_temp.expect_count('select * from public.audit_logs', :n_audit + 1, 'owner reads audit log');
update public.profiles set is_active = true where id = '00000000-0000-0000-0000-0000000000a3';
select pg_temp.expect_error($$update public.profiles set role = 'staff' where id = auth.uid()$$, 'owner demoting self');
select pg_temp.expect_count($$select 1 where (public.dashboard_metrics() ->> 'confirmed_bookings')::int = (select count(*) from public.bookings where status = 'CONFIRMED')$$, 1, 'dashboard metrics match real rows');
reset role;

-- Rate limiter (service role path)
select pg_temp.expect_count($$select 1 where public.consume_form_attempt('t', 'h', 2, '1 hour') and public.consume_form_attempt('t', 'h', 2, '1 hour') and not public.consume_form_attempt('t', 'h', 2, '1 hour')$$, 1, 'rate limiter blocks third attempt');

select 'ALL DATABASE TESTS PASSED' as result;
rollback;
