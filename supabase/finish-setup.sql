-- Lanka Veya Travel — finish database setup
-- Paste into Supabase Dashboard → SQL Editor → New query → Run.
-- Project: lanka-veya-travel (cuhtgqciqkjazubootoq).
-- Everything else (tables, RLS policies, other procedures, seed content) is
-- already applied. Safe to run more than once.

-- 1) Privilege hardening (column-level vehicle privacy, append-only history/audit)
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke update on public.profiles from authenticated;
grant update (full_name, role, is_active) on public.profiles to authenticated;
revoke select on public.vehicles from anon;
grant select (id, name, category, passenger_capacity, luggage_capacity, amenities, description,
              pricing_method, base_rate, rate_currency, image_url, image_alt, gallery,
              availability_notes, is_active, is_public, sort_order)
  on public.vehicles to anon;
revoke insert, update, delete on public.booking_status_history from authenticated;
revoke update, delete on public.audit_logs from authenticated;
revoke all on function public.change_booking_status(uuid, public.booking_status, text, text, boolean) from public, anon;
grant execute on function public.change_booking_status(uuid, public.booking_status, text, text, boolean) to authenticated;
revoke all on function public.mark_quotation_sent(uuid) from public, anon;
grant execute on function public.mark_quotation_sent(uuid) to authenticated;
revoke all on function public.revise_quotation(uuid) from public, anon;
grant execute on function public.revise_quotation(uuid) to authenticated;
revoke all on function public.create_quotation(uuid, char) from public, anon;
grant execute on function public.create_quotation(uuid, char) to authenticated;
revoke all on function public.dashboard_metrics() from public, anon;
grant execute on function public.dashboard_metrics() to authenticated;
revoke all on function public.assignment_conflicts(uuid, uuid, date, date, uuid) from public, anon;
grant execute on function public.assignment_conflicts(uuid, uuid, date, date, uuid) to authenticated;

-- 2) Quotation draft editor procedure
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

-- 3) Tour CMS save procedure
create or replace function public.save_tour(p_id uuid, p_tour jsonb, p_days jsonb, p_destination_ids uuid[])
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  tid uuid := p_id;
  d jsonb;
  i int := 0;
begin
  if not public.is_staff() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if tid is null then
    insert into public.tours (slug, name) values (p_tour ->> 'slug', p_tour ->> 'name') returning id into tid;
  end if;

  update public.tours set
    slug = p_tour ->> 'slug',
    name = p_tour ->> 'name',
    short_description = p_tour ->> 'short_description',
    description = p_tour ->> 'description',
    categories = coalesce(array(select jsonb_array_elements_text(p_tour -> 'categories')), '{}'),
    duration_days = nullif(p_tour ->> 'duration_days', '')::int,
    duration_nights = nullif(p_tour ->> 'duration_nights', '')::int,
    traveler_types = coalesce(array(select jsonb_array_elements_text(p_tour -> 'traveler_types')), '{}'),
    vehicle_options = coalesce(array(select jsonb_array_elements_text(p_tour -> 'vehicle_options')), '{}'),
    max_group_size = nullif(p_tour ->> 'max_group_size', '')::int,
    price_mode = p_tour ->> 'price_mode',
    price_from = nullif(p_tour ->> 'price_from', '')::numeric,
    price_currency = nullif(p_tour ->> 'price_currency', ''),
    price_basis = nullif(p_tour ->> 'price_basis', ''),
    inclusions = coalesce(array(select jsonb_array_elements_text(p_tour -> 'inclusions')), '{}'),
    exclusions = coalesce(array(select jsonb_array_elements_text(p_tour -> 'exclusions')), '{}'),
    add_ons = coalesce(p_tour -> 'add_ons', '[]'::jsonb),
    cover_image_url = nullif(p_tour ->> 'cover_image_url', ''),
    cover_image_alt = nullif(p_tour ->> 'cover_image_alt', ''),
    image_credit = nullif(p_tour ->> 'image_credit', ''),
    gallery = coalesce(p_tour -> 'gallery', '[]'::jsonb),
    seo_title = nullif(p_tour ->> 'seo_title', ''),
    seo_description = nullif(p_tour ->> 'seo_description', ''),
    is_featured = coalesce((p_tour ->> 'is_featured')::boolean, false),
    status = (p_tour ->> 'status')::public.content_status,
    sort_order = coalesce(nullif(p_tour ->> 'sort_order', '')::int, 0)
  where id = tid;

  if not found then
    raise exception 'Tour not found' using errcode = 'P0002';
  end if;

  delete from public.tour_itinerary_days where tour_id = tid;
  for d in select * from jsonb_array_elements(coalesce(p_days, '[]'::jsonb)) loop
    i := i + 1;
    insert into public.tour_itinerary_days (tour_id, day_number, title, description, overnight)
    values (tid, i, d ->> 'title', nullif(d ->> 'description', ''), nullif(d ->> 'overnight', ''));
  end loop;

  delete from public.tour_destinations where tour_id = tid;
  insert into public.tour_destinations (tour_id, destination_id, position)
  select tid, dest_id, ord from unnest(coalesce(p_destination_ids, '{}')) with ordinality as x(dest_id, ord);

  return tid;
end $$;
revoke all on function public.save_tour(uuid, jsonb, jsonb, uuid[]) from public, anon;
grant execute on function public.save_tour(uuid, jsonb, jsonb, uuid[]) to authenticated;

-- 4) Check: should return 0 rows
select table_name, column_name from information_schema.column_privileges
 where grantee = 'anon' and table_schema = 'public' and table_name = 'vehicles'
   and privilege_type = 'SELECT' and column_name in ('registration_number', 'internal_notes');
