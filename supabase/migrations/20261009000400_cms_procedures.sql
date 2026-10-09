-- Saves a tour, its itinerary days and destination links in one transaction.
-- SECURITY INVOKER: the caller's RLS policies (active staff) apply.
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
