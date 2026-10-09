-- Row Level Security for every table in the exposed `public` schema,
-- plus the transactional procedures the owner portal uses.
--
-- Model:
--   anon           -> read published website content only. No inserts: public
--                     forms are validated on the server and written with the
--                     service role (never exposed to the browser).
--   authenticated  -> must have an ACTIVE profile (is_staff()) to see anything
--                     private. Owners/admins manage settings, pricing, users.
--   service_role   -> bypasses RLS; used only in server-side code.

alter table public.profiles enable row level security;
alter table public.currencies enable row level security;
alter table public.site_settings enable row level security;
alter table public.customers enable row level security;
alter table public.destinations enable row level security;
alter table public.tours enable row level security;
alter table public.tour_destinations enable row level security;
alter table public.tour_itinerary_days enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_unavailability enable row level security;
alter table public.drivers enable row level security;
alter table public.driver_private enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.trip_requests enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_line_items enable row level security;
alter table public.assignments enable row level security;
alter table public.internal_notes enable row level security;
alter table public.faqs enable row level security;
alter table public.testimonials enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.form_attempts enable row level security;

-- Belt and braces: anonymous visitors get no write privileges at all.
revoke insert, update, delete, truncate on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_owner on public.profiles for update to authenticated
  using (public.is_owner()) with check (public.is_owner());
-- Column-level: a user may only edit their display name; role/is_active are
-- additionally guarded by the profiles_guard trigger.
revoke update on public.profiles from authenticated;
grant update (full_name, role, is_active) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Public website content
-- ---------------------------------------------------------------------------
create policy currencies_read on public.currencies for select to anon, authenticated using (true);
create policy currencies_write on public.currencies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy settings_read on public.site_settings for select to anon, authenticated
  using (is_public or public.is_staff());
create policy settings_write on public.site_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy destinations_read on public.destinations for select to anon, authenticated
  using (status = 'published' or public.is_staff());
create policy destinations_write on public.destinations for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy tours_read on public.tours for select to anon, authenticated
  using (status = 'published' or public.is_staff());
create policy tours_write on public.tours for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy tour_destinations_read on public.tour_destinations for select to anon, authenticated
  using (
    public.is_staff() or (
      exists (select 1 from public.tours t where t.id = tour_id and t.status = 'published')
      and exists (select 1 from public.destinations d where d.id = destination_id and d.status = 'published')
    )
  );
create policy tour_destinations_write on public.tour_destinations for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy itinerary_read on public.tour_itinerary_days for select to anon, authenticated
  using (public.is_staff() or exists (select 1 from public.tours t where t.id = tour_id and t.status = 'published'));
create policy itinerary_write on public.tour_itinerary_days for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy faqs_read on public.faqs for select to anon, authenticated
  using (is_published or public.is_staff());
create policy faqs_write on public.faqs for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy testimonials_read on public.testimonials for select to anon, authenticated
  using (is_published or public.is_staff());
create policy testimonials_write on public.testimonials for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Vehicles: visitors see active, public vehicles and only non-internal columns.
create policy vehicles_read on public.vehicles for select to anon, authenticated
  using ((is_active and is_public) or public.is_staff());
create policy vehicles_write on public.vehicles for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
revoke select on public.vehicles from anon;
grant select (id, name, category, passenger_capacity, luggage_capacity, amenities, description,
              pricing_method, base_rate, rate_currency, image_url, image_alt, gallery,
              availability_notes, is_active, is_public, sort_order)
  on public.vehicles to anon;

-- ---------------------------------------------------------------------------
-- Private operational data: active staff only
-- ---------------------------------------------------------------------------
create policy vehicle_unavailability_staff on public.vehicle_unavailability for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy drivers_staff on public.drivers for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy driver_private_admin on public.driver_private for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy pricing_read on public.pricing_rules for select to authenticated using (public.is_staff());
create policy pricing_write on public.pricing_rules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy customers_staff on public.customers for select to authenticated using (public.is_staff());
create policy customers_insert on public.customers for insert to authenticated with check (public.is_staff());
create policy customers_update on public.customers for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy customers_delete on public.customers for delete to authenticated using (public.is_admin());

create policy trip_requests_staff on public.trip_requests for select to authenticated using (public.is_staff());
create policy trip_requests_update on public.trip_requests for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy trip_requests_delete on public.trip_requests for delete to authenticated using (public.is_admin());

create policy contact_staff on public.contact_submissions for select to authenticated using (public.is_staff());
create policy contact_update on public.contact_submissions for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy contact_delete on public.contact_submissions for delete to authenticated using (public.is_admin());

create policy bookings_select on public.bookings for select to authenticated using (public.is_staff());
create policy bookings_insert on public.bookings for insert to authenticated with check (public.is_staff());
create policy bookings_update on public.bookings for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy bookings_delete on public.bookings for delete to authenticated using (public.is_admin());

-- History rows are written only by the security-definer trigger.
create policy booking_history_select on public.booking_status_history for select to authenticated
  using (public.is_staff());
revoke insert, update, delete on public.booking_status_history from authenticated;

create policy quotations_staff on public.quotations for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy quotation_items_staff on public.quotation_line_items for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy assignments_staff on public.assignments for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy notes_select on public.internal_notes for select to authenticated using (public.is_staff());
create policy notes_insert on public.internal_notes for insert to authenticated
  with check (public.is_staff() and author_id = auth.uid());
create policy notes_delete on public.internal_notes for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- Audit log is append-only.
create policy audit_select on public.audit_logs for select to authenticated using (public.is_admin());
create policy audit_insert on public.audit_logs for insert to authenticated
  with check (public.is_staff() and actor_id = auth.uid());
revoke update, delete on public.audit_logs from authenticated;

create policy deliveries_select on public.notification_deliveries for select to authenticated
  using (public.is_staff());
-- form_attempts: no policies -> no access except the service role.

-- ---------------------------------------------------------------------------
-- Procedures used by the owner portal (SECURITY INVOKER: RLS still applies)
-- ---------------------------------------------------------------------------

-- Moves a booking through its lifecycle with a note in the history.
create or replace function public.change_booking_status(
  p_booking_id uuid,
  p_to public.booking_status,
  p_note text default null,
  p_cancellation_reason text default null,
  p_availability_checked boolean default false
) returns public.bookings
language plpgsql security invoker set search_path = '' as $$
declare
  b public.bookings;
  q public.quotations;
begin
  if not public.is_staff() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  perform set_config('app.status_note', coalesce(p_note, ''), true);

  if p_to = 'CONFIRMED' then
    if not public.is_admin() then
      raise exception 'Only the owner or an admin can confirm a booking' using errcode = '42501';
    end if;
    if not coalesce(p_availability_checked, false) then
      raise exception 'Confirm that vehicle and driver availability has been checked' using errcode = '23514';
    end if;
    select * into q from public.quotations
     where booking_id = p_booking_id and status = 'ACCEPTED'
     order by version desc limit 1;
    update public.bookings set
      status = p_to,
      confirmed_by = auth.uid(),
      availability_checked_at = now(),
      final_amount = q.total,
      final_currency = q.currency
    where id = p_booking_id
    returning * into b;
  elsif p_to = 'CANCELLED' then
    update public.bookings set status = p_to, cancellation_reason = p_cancellation_reason
     where id = p_booking_id returning * into b;
    update public.assignments set status = 'RELEASED' where booking_id = p_booking_id;
  else
    update public.bookings set status = p_to where id = p_booking_id returning * into b;
    if p_to = 'IN_PROGRESS' or p_to = 'COMPLETED' then
      update public.assignments set status = 'CONFIRMED'
       where booking_id = p_booking_id and status = 'PROVISIONAL';
    end if;
  end if;

  if b.id is null then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  return b;
end $$;
revoke all on function public.change_booking_status(uuid, public.booking_status, text, text, boolean) from public, anon;
grant execute on function public.change_booking_status(uuid, public.booking_status, text, text, boolean) to authenticated;

-- Marks a draft quotation as sent and advances the booking.
create or replace function public.mark_quotation_sent(p_quotation_id uuid) returns public.quotations
language plpgsql security invoker set search_path = '' as $$
declare
  q public.quotations;
  b_status public.booking_status;
begin
  if not public.is_staff() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select * into q from public.quotations where id = p_quotation_id for update;
  if q.id is null then raise exception 'Quotation not found' using errcode = 'P0002'; end if;
  if q.status <> 'DRAFT' then raise exception 'Only a draft can be sent' using errcode = '23514'; end if;
  if q.total <= 0 or not exists (select 1 from public.quotation_line_items where quotation_id = q.id) then
    raise exception 'Add at least one priced line item before sending' using errcode = '23514';
  end if;

  update public.quotations set status = 'SENT' where id = q.id returning * into q;

  select status into b_status from public.bookings where id = q.booking_id;
  if b_status in ('NEW_INQUIRY', 'CONTACTED', 'AWAITING_CUSTOMER_CONFIRMATION') then
    perform set_config('app.status_note', 'Quotation ' || q.reference || ' sent', true);
    update public.bookings set status = 'QUOTATION_SENT' where id = q.booking_id;
  end if;
  return q;
end $$;
revoke all on function public.mark_quotation_sent(uuid) from public, anon;
grant execute on function public.mark_quotation_sent(uuid) to authenticated;

-- Creates a new DRAFT version from an existing quotation and marks the old one REVISED.
create or replace function public.revise_quotation(p_quotation_id uuid) returns public.quotations
language plpgsql security invoker set search_path = '' as $$
declare
  old_q public.quotations;
  new_q public.quotations;
  next_version int;
  b_ref text;
begin
  if not public.is_staff() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select * into old_q from public.quotations where id = p_quotation_id for update;
  if old_q.id is null then raise exception 'Quotation not found' using errcode = 'P0002'; end if;
  if old_q.status = 'REVISED' then raise exception 'This quotation was already revised' using errcode = '23514'; end if;

  select coalesce(max(version), 0) + 1 into next_version from public.quotations where booking_id = old_q.booking_id;
  select reference into b_ref from public.bookings where id = old_q.booking_id;

  update public.quotations set status = 'REVISED' where id = old_q.id;

  insert into public.quotations (booking_id, version, reference, status, currency, subtotal, discount_label,
    discount_amount, total, inclusions, exclusions, valid_until, owner_notes, customer_terms, supersedes_id, created_by)
  values (old_q.booking_id, next_version, b_ref || '-Q' || next_version, 'DRAFT', old_q.currency, old_q.subtotal,
    old_q.discount_label, old_q.discount_amount, old_q.total, old_q.inclusions, old_q.exclusions, old_q.valid_until,
    old_q.owner_notes, old_q.customer_terms, old_q.id, auth.uid())
  returning * into new_q;

  insert into public.quotation_line_items (quotation_id, position, description, pricing_rule_id, quantity, unit_price, line_total)
  select new_q.id, position, description, pricing_rule_id, quantity, unit_price, line_total
    from public.quotation_line_items where quotation_id = old_q.id;

  return new_q;
end $$;
revoke all on function public.revise_quotation(uuid) from public, anon;
grant execute on function public.revise_quotation(uuid) to authenticated;

-- Replaces a draft's line items and totals atomically. Totals are calculated
-- by the server (src/lib/pricing/quotation.ts) and re-verified here.
create or replace function public.save_quotation_draft(
  p_quotation_id uuid,
  p_currency char(3),
  p_items jsonb,
  p_discount_label text,
  p_discount_amount numeric,
  p_inclusions text[],
  p_exclusions text[],
  p_valid_until date,
  p_owner_notes text,
  p_customer_terms text
) returns public.quotations
language plpgsql security invoker set search_path = '' as $$
declare
  q public.quotations;
  item jsonb;
  pos int := 0;
  sub numeric(12, 2) := 0;
  line numeric(12, 2);
begin
  if not public.is_staff() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select * into q from public.quotations where id = p_quotation_id for update;
  if q.id is null then raise exception 'Quotation not found' using errcode = 'P0002'; end if;
  if q.status <> 'DRAFT' then raise exception 'Only a draft can be edited' using errcode = '23514'; end if;

  delete from public.quotation_line_items where quotation_id = q.id;
  for item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    line := round((item ->> 'quantity')::numeric * (item ->> 'unit_price')::numeric, 2);
    insert into public.quotation_line_items (quotation_id, position, description, pricing_rule_id, quantity, unit_price, line_total)
    values (q.id, pos, item ->> 'description', nullif(item ->> 'pricing_rule_id', '')::uuid,
            (item ->> 'quantity')::numeric, (item ->> 'unit_price')::numeric, line);
    sub := sub + line;
    pos := pos + 1;
  end loop;

  if coalesce(p_discount_amount, 0) > sub then
    raise exception 'Discount cannot exceed the subtotal' using errcode = '23514';
  end if;

  update public.quotations set
    currency = p_currency,
    subtotal = sub,
    discount_label = nullif(trim(p_discount_label), ''),
    discount_amount = coalesce(p_discount_amount, 0),
    total = sub - coalesce(p_discount_amount, 0),
    inclusions = coalesce(p_inclusions, '{}'),
    exclusions = coalesce(p_exclusions, '{}'),
    valid_until = p_valid_until,
    owner_notes = p_owner_notes,
    customer_terms = p_customer_terms
  where id = q.id
  returning * into q;
  return q;
end $$;
revoke all on function public.save_quotation_draft(uuid, char, jsonb, text, numeric, text[], text[], date, text, text) from public, anon;
grant execute on function public.save_quotation_draft(uuid, char, jsonb, text, numeric, text[], text[], date, text, text) to authenticated;

-- Creates the first draft (or next version when none is open) for a booking.
create or replace function public.create_quotation(p_booking_id uuid, p_currency char(3)) returns public.quotations
language plpgsql security invoker set search_path = '' as $$
declare
  q public.quotations;
  next_version int;
  b_ref text;
begin
  if not public.is_staff() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if exists (select 1 from public.quotations where booking_id = p_booking_id and status in ('DRAFT', 'SENT', 'ACCEPTED')) then
    raise exception 'This booking already has an open quotation. Revise it instead.' using errcode = '23514';
  end if;
  select reference into b_ref from public.bookings where id = p_booking_id;
  if b_ref is null then raise exception 'Booking not found' using errcode = 'P0002'; end if;
  select coalesce(max(version), 0) + 1 into next_version from public.quotations where booking_id = p_booking_id;
  insert into public.quotations (booking_id, version, reference, currency, created_by)
  values (p_booking_id, next_version, b_ref || '-Q' || next_version, p_currency, auth.uid())
  returning * into q;
  return q;
end $$;
revoke all on function public.create_quotation(uuid, char) from public, anon;
grant execute on function public.create_quotation(uuid, char) to authenticated;

-- Dashboard metrics computed in the database from real records only.
create or replace function public.dashboard_metrics() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  result jsonb;
begin
  if not public.is_staff() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'new_inquiries', (select count(*) from public.bookings where status = 'NEW_INQUIRY')
                     + (select count(*) from public.trip_requests where status = 'NEW')
                     + (select count(*) from public.contact_submissions where status = 'NEW'),
    'pending_quotations', (select count(*) from public.quotations where status in ('DRAFT', 'SENT')),
    'confirmed_bookings', (select count(*) from public.bookings where status = 'CONFIRMED'),
    'upcoming_trips', (select count(*) from public.bookings
                        where status in ('CONFIRMED', 'IN_PROGRESS') and start_date >= current_date),
    'completed_trips', (select count(*) from public.bookings where status = 'COMPLETED'),
    'quotes_decided', (select count(*) from public.quotations where status in ('ACCEPTED', 'REJECTED', 'EXPIRED')),
    'quotes_accepted', (select count(*) from public.quotations where status = 'ACCEPTED'),
    'revenue', coalesce((
      select jsonb_agg(jsonb_build_object('currency', final_currency, 'amount', total) order by final_currency)
        from (select final_currency, sum(final_amount) as total from public.bookings
               where status in ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED') and final_amount is not null
               group by final_currency) r), '[]'::jsonb),
    'monthly', coalesce((
      select jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'), 'requests', req, 'confirmed', conf) order by m)
        from (
          select gs as m,
                 (select count(*) from public.bookings b where date_trunc('month', b.created_at) = gs) as req,
                 (select count(*) from public.bookings b where b.confirmed_at is not null
                     and date_trunc('month', b.confirmed_at) = gs) as conf
            from generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') gs
        ) months), '[]'::jsonb)
  ) into result;
  return result;
end $$;
revoke all on function public.dashboard_metrics() from public, anon;
grant execute on function public.dashboard_metrics() to authenticated;

revoke all on function public.assignment_conflicts(uuid, uuid, date, date, uuid) from public, anon;
grant execute on function public.assignment_conflicts(uuid, uuid, date, date, uuid) to authenticated;

-- Note: is_staff()/is_admin()/is_owner() stay executable by anon because the
-- public read policies call them; for anon they simply return false.
