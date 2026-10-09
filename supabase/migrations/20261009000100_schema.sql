-- Lanka Veya Travel — core schema
-- Quote-first booking model: requests -> quotations -> owner-confirmed bookings.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('owner', 'admin', 'staff');

create type public.booking_status as enum (
  'NEW_INQUIRY', 'CONTACTED', 'QUOTATION_SENT', 'AWAITING_CUSTOMER_CONFIRMATION',
  'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
);

create type public.quotation_status as enum ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'REVISED');

create type public.service_type as enum (
  'TOUR', 'AIRPORT_TRANSFER', 'HOTEL_TRANSFER', 'POINT_TO_POINT', 'DAY_HIRE',
  'MULTI_DAY_CHAUFFEUR', 'PRIVATE_SIGHTSEEING', 'CUSTOM_ITINERARY', 'OTHER'
);

create type public.content_status as enum ('draft', 'published', 'archived');

create type public.pricing_method as enum ('FIXED', 'PER_KM', 'PER_DAY', 'PER_HOUR', 'PER_PERSON', 'CUSTOM_QUOTE');

create type public.inquiry_status as enum ('NEW', 'IN_REVIEW', 'FOLLOW_UP', 'CONVERTED', 'CLOSED', 'SPAM');

create type public.vehicle_category as enum ('CAR', 'SEDAN', 'SUV', 'VAN', 'MINIBUS', 'COACH', 'OTHER');

create type public.assignment_status as enum ('PROVISIONAL', 'CONFIRMED', 'RELEASED');

create type public.delivery_status as enum ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Human-readable, non-sequential reference, e.g. LVT-7KQ2-M9XD.
-- Crockford-style alphabet: no 0/O, 1/I/L, U to avoid misreading over the phone.
create or replace function public.new_reference(prefix text default 'LVT') returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  bytes bytea := extensions.gen_random_bytes(8);
  out text := '';
  i int;
begin
  for i in 0..7 loop
    out := out || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
    if i = 3 then out := out || '-'; end if;
  end loop;
  return prefix || '-' || out;
end $$;

-- ---------------------------------------------------------------------------
-- Staff profiles (linked to Supabase Auth users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'staff',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- New auth users get an INACTIVE staff profile. An owner must activate them.
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', null))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active and role in ('owner', 'admin')
  )
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active and role = 'owner')
$$;

-- Nobody can change their own role or activation; only owners can change others.
create or replace function public.guard_profile_privileges() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    return new; -- service role / migrations (bootstrap script)
  end if;
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    if not public.is_owner() then
      raise exception 'Only an owner can change roles or activation' using errcode = '42501';
    end if;
    if new.id = auth.uid() then
      raise exception 'You cannot change your own role or activation' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ---------------------------------------------------------------------------
-- Currencies and settings
-- ---------------------------------------------------------------------------
create table public.currencies (
  code char(3) primary key check (code ~ '^[A-Z]{3}$'),
  name text not null,
  symbol text,
  decimals smallint not null default 2 check (decimals between 0 and 4),
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order int not null default 0
);
create unique index currencies_one_default on public.currencies (is_default) where is_default;

create table public.site_settings (
  key text primary key check (key ~ '^[a-z_]+$'),
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default extensions.gen_random_uuid(),
  full_name text not null check (length(full_name) between 1 and 160),
  email extensions.citext check (email is null or length(email) <= 254),
  phone text check (phone is null or length(phone) <= 40),
  phone_normalized text check (phone_normalized is null or phone_normalized ~ '^\+?[0-9]{6,20}$'),
  country text,
  preferred_contact text check (preferred_contact in ('email', 'whatsapp', 'phone')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_contact_present check (email is not null or phone_normalized is not null)
);
create unique index customers_email_unique on public.customers (email) where email is not null;
create index customers_phone_idx on public.customers (phone_normalized);
create index customers_name_idx on public.customers using gin (to_tsvector('simple', full_name));
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Destinations & tours (CMS)
-- ---------------------------------------------------------------------------
create table public.destinations (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  locale text not null default 'en',
  name text not null,
  region text,
  summary text,
  description text,
  highlights text[] not null default '{}',
  suggested_stay text,
  best_time text,
  transport_notes text,
  cover_image_url text,
  cover_image_alt text,
  image_credit text,
  gallery jsonb not null default '[]'::jsonb check (jsonb_typeof(gallery) = 'array'),
  seo_title text check (seo_title is null or length(seo_title) <= 70),
  seo_description text check (seo_description is null or length(seo_description) <= 170),
  status public.content_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index destinations_status_idx on public.destinations (status, sort_order);
create trigger destinations_updated_at before update on public.destinations
  for each row execute function public.set_updated_at();

create table public.tours (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  locale text not null default 'en',
  name text not null,
  short_description text,
  description text,
  categories text[] not null default '{}' check (
    categories <@ array['cultural', 'wildlife', 'beach', 'hill-country', 'scenic-train', 'hiking',
                        'family', 'honeymoon', 'day-trip', 'round-tour', 'adventure']::text[]
  ),
  duration_days int check (duration_days is null or duration_days between 1 and 60),
  duration_nights int check (duration_nights is null or duration_nights between 0 and 60),
  traveler_types text[] not null default '{}',
  vehicle_options text[] not null default '{}',
  max_group_size int check (max_group_size is null or max_group_size > 0),
  price_mode text not null default 'QUOTE_ONLY' check (price_mode in ('QUOTE_ONLY', 'INDICATIVE')),
  price_from numeric(12, 2) check (price_from is null or price_from >= 0),
  price_currency char(3) references public.currencies (code),
  price_basis text check (price_basis is null or price_basis in ('per_person', 'per_group', 'per_vehicle')),
  inclusions text[] not null default '{}',
  exclusions text[] not null default '{}',
  add_ons jsonb not null default '[]'::jsonb check (jsonb_typeof(add_ons) = 'array'),
  cover_image_url text,
  cover_image_alt text,
  image_credit text,
  gallery jsonb not null default '[]'::jsonb check (jsonb_typeof(gallery) = 'array'),
  seo_title text check (seo_title is null or length(seo_title) <= 70),
  seo_description text check (seo_description is null or length(seo_description) <= 170),
  is_featured boolean not null default false,
  status public.content_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tours_indicative_price check (
    price_mode = 'QUOTE_ONLY' or (price_from is not null and price_currency is not null and price_basis is not null)
  )
);
create index tours_status_idx on public.tours (status, is_featured, sort_order);
create index tours_categories_idx on public.tours using gin (categories);
create trigger tours_updated_at before update on public.tours
  for each row execute function public.set_updated_at();

create table public.tour_destinations (
  tour_id uuid not null references public.tours (id) on delete cascade,
  destination_id uuid not null references public.destinations (id) on delete cascade,
  position int not null default 0,
  primary key (tour_id, destination_id)
);
create index tour_destinations_dest_idx on public.tour_destinations (destination_id);

create table public.tour_itinerary_days (
  id uuid primary key default extensions.gen_random_uuid(),
  tour_id uuid not null references public.tours (id) on delete cascade,
  day_number int not null check (day_number between 1 and 60),
  title text not null,
  description text,
  overnight text,
  unique (tour_id, day_number)
);

-- ---------------------------------------------------------------------------
-- Fleet & drivers
-- ---------------------------------------------------------------------------
create table public.vehicles (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  category public.vehicle_category not null,
  passenger_capacity int not null check (passenger_capacity between 1 and 80),
  luggage_capacity int check (luggage_capacity is null or luggage_capacity between 0 and 80),
  amenities text[] not null default '{}',
  description text,
  pricing_method public.pricing_method not null default 'CUSTOM_QUOTE',
  base_rate numeric(12, 2) check (base_rate is null or base_rate >= 0),
  rate_currency char(3) references public.currencies (code),
  image_url text,
  image_alt text,
  gallery jsonb not null default '[]'::jsonb check (jsonb_typeof(gallery) = 'array'),
  availability_notes text,
  is_active boolean not null default true,
  is_public boolean not null default false,
  sort_order int not null default 0,
  -- internal only (column privileges hide these from anonymous visitors)
  registration_number text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_rate_currency check (base_rate is null or rate_currency is not null)
);
create trigger vehicles_updated_at before update on public.vehicles
  for each row execute function public.set_updated_at();

create table public.vehicle_unavailability (
  id uuid primary key default extensions.gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  reason text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index vehicle_unavailability_idx on public.vehicle_unavailability (vehicle_id, starts_on, ends_on);

create table public.drivers (
  id uuid primary key default extensions.gen_random_uuid(),
  full_name text not null,
  phone text,
  email extensions.citext,
  languages text[] not null default '{}',
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger drivers_updated_at before update on public.drivers
  for each row execute function public.set_updated_at();

-- Sensitive driver data: owners/admins only.
create table public.driver_private (
  driver_id uuid primary key references public.drivers (id) on delete cascade,
  license_number text,
  license_expiry date,
  emergency_contact text,
  updated_at timestamptz not null default now()
);
create trigger driver_private_updated_at before update on public.driver_private
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Pricing
-- ---------------------------------------------------------------------------
create table public.pricing_rules (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  service_type public.service_type,
  vehicle_category public.vehicle_category,
  method public.pricing_method not null,
  rate numeric(12, 2) check (rate is null or rate >= 0),
  currency char(3) not null references public.currencies (code),
  minimum_charge numeric(12, 2) check (minimum_charge is null or minimum_charge >= 0),
  notes text,
  is_active boolean not null default true,
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pricing_rules_rate_required check (method = 'CUSTOM_QUOTE' or rate is not null),
  constraint pricing_rules_validity check (valid_to is null or valid_from is null or valid_to >= valid_from)
);
create trigger pricing_rules_updated_at before update on public.pricing_rules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Custom trip requests & contact submissions
-- ---------------------------------------------------------------------------
create table public.trip_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  reference text not null unique default public.new_reference('LVT-T'),
  submission_key uuid unique,
  customer_id uuid references public.customers (id) on delete set null,
  full_name text not null,
  email extensions.citext not null,
  phone text not null,
  arrival_date date not null,
  departure_date date not null,
  start_location text,
  destinations text[] not null default '{}',
  adults int not null check (adults between 1 and 60),
  children int not null default 0 check (children between 0 and 60),
  accommodation text,
  activities text[] not null default '{}',
  transport_preference text,
  budget_min numeric(12, 2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(12, 2) check (budget_max is null or budget_max >= 0),
  budget_currency char(3),
  special_requirements text,
  notes text,
  consent_privacy boolean not null check (consent_privacy),
  consent_at timestamptz not null default now(),
  status public.inquiry_status not null default 'NEW',
  owner_id uuid references public.profiles (id) on delete set null,
  follow_up_at timestamptz,
  converted_booking_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (departure_date >= arrival_date),
  check (budget_max is null or budget_min is null or budget_max >= budget_min)
);
create index trip_requests_status_idx on public.trip_requests (status, created_at desc);
create trigger trip_requests_updated_at before update on public.trip_requests
  for each row execute function public.set_updated_at();

create table public.contact_submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  reference text not null unique default public.new_reference('LVT-C'),
  submission_key uuid unique,
  customer_id uuid references public.customers (id) on delete set null,
  full_name text not null,
  email extensions.citext not null,
  phone text,
  subject text,
  message text not null check (length(message) <= 5000),
  consent_privacy boolean not null check (consent_privacy),
  status public.inquiry_status not null default 'NEW',
  owner_id uuid references public.profiles (id) on delete set null,
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contact_submissions_status_idx on public.contact_submissions (status, created_at desc);
create trigger contact_submissions_updated_at before update on public.contact_submissions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Bookings (requests become bookings; status != confirmed until owner acts)
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default extensions.gen_random_uuid(),
  reference text not null unique default public.new_reference('LVT'),
  submission_key uuid unique,
  customer_id uuid not null references public.customers (id) on delete restrict,
  service_type public.service_type not null,
  tour_id uuid references public.tours (id) on delete set null,
  trip_request_id uuid references public.trip_requests (id) on delete set null,
  status public.booking_status not null default 'NEW_INQUIRY',
  source text not null default 'website' check (source in ('website', 'trip_request', 'whatsapp', 'email', 'phone', 'manual')),
  pickup_location text,
  dropoff_location text,
  start_date date,
  start_time time,
  end_date date,
  flight_number text,
  adults int not null default 1 check (adults between 0 and 80),
  children int not null default 0 check (children between 0 and 80),
  luggage_count int check (luggage_count is null or luggage_count between 0 and 200),
  vehicle_preference text,
  requirements text,
  consent_privacy boolean not null default false,
  consent_at timestamptz,
  owner_id uuid references public.profiles (id) on delete set null,
  follow_up_at timestamptz,
  cancellation_reason text,
  availability_checked_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles (id) on delete set null,
  final_amount numeric(12, 2) check (final_amount is null or final_amount >= 0),
  final_currency char(3) references public.currencies (code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date),
  check (adults + children >= 1),
  check (final_amount is null or final_currency is not null)
);
alter table public.trip_requests
  add constraint trip_requests_converted_fk foreign key (converted_booking_id) references public.bookings (id) on delete set null;
create index bookings_status_idx on public.bookings (status, start_date);
create index bookings_customer_idx on public.bookings (customer_id);
create index bookings_created_idx on public.bookings (created_at desc);
create index bookings_follow_up_idx on public.bookings (follow_up_at) where follow_up_at is not null;
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

create table public.booking_status_history (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  from_status public.booking_status,
  to_status public.booking_status not null,
  note text,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);
create index booking_status_history_idx on public.booking_status_history (booking_id, changed_at);

-- Allowed transitions (mirrors src/lib/booking/status.ts — keep in sync; tested).
create or replace function public.booking_transition_allowed(from_s public.booking_status, to_s public.booking_status)
returns boolean language sql immutable set search_path = '' as $$
  select case from_s
    when 'NEW_INQUIRY' then to_s in ('CONTACTED', 'QUOTATION_SENT', 'CANCELLED')
    when 'CONTACTED' then to_s in ('QUOTATION_SENT', 'CANCELLED')
    when 'QUOTATION_SENT' then to_s in ('CONTACTED', 'AWAITING_CUSTOMER_CONFIRMATION', 'CONFIRMED', 'CANCELLED')
    when 'AWAITING_CUSTOMER_CONFIRMATION' then to_s in ('QUOTATION_SENT', 'CONFIRMED', 'CANCELLED')
    when 'CONFIRMED' then to_s in ('IN_PROGRESS', 'CANCELLED')
    when 'IN_PROGRESS' then to_s in ('COMPLETED', 'CANCELLED')
    when 'CANCELLED' then to_s in ('CONTACTED')
    else false
  end
$$;

create or replace function public.guard_booking_status() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    -- Every booking starts as an unconfirmed request; confirmation is always a later, explicit step.
    if new.status not in ('NEW_INQUIRY', 'CONTACTED') then
      new.status := 'NEW_INQUIRY';
    end if;
    new.confirmed_at := null;
    new.confirmed_by := null;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not public.booking_transition_allowed(old.status, new.status) then
      raise exception 'Booking cannot move from % to %', old.status, new.status using errcode = '23514';
    end if;
    if new.status = 'CONFIRMED' then
      if new.confirmed_by is null or new.availability_checked_at is null then
        raise exception 'Confirming a booking requires the owner and an availability check' using errcode = '23514';
      end if;
      if not exists (select 1 from public.quotations q where q.booking_id = new.id and q.status = 'ACCEPTED') then
        raise exception 'Record the customer''s quotation acceptance before confirming' using errcode = '23514';
      end if;
      new.confirmed_at := now();
    end if;
    if new.status = 'CANCELLED' and coalesce(trim(new.cancellation_reason), '') = '' then
      raise exception 'A cancellation reason is required' using errcode = '23514';
    end if;
  elsif new.confirmed_at is distinct from old.confirmed_at then
    new.confirmed_at := old.confirmed_at; -- not editable directly
  end if;
  return new;
end $$;
create trigger bookings_guard_status before insert or update on public.bookings
  for each row execute function public.guard_booking_status();

create or replace function public.log_booking_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_status_history (booking_id, from_status, to_status, note, changed_by)
    values (new.id, null, new.status, 'Request received', auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.booking_status_history (booking_id, from_status, to_status, note, changed_by)
    values (new.id, old.status, new.status,
            nullif(current_setting('app.status_note', true), ''), auth.uid());
  end if;
  return null;
end $$;
create trigger bookings_log_status after insert or update of status on public.bookings
  for each row execute function public.log_booking_status();

-- ---------------------------------------------------------------------------
-- Quotations
-- ---------------------------------------------------------------------------
create table public.quotations (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  version int not null check (version >= 1),
  reference text not null unique,
  status public.quotation_status not null default 'DRAFT',
  currency char(3) not null references public.currencies (code),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount_label text,
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  inclusions text[] not null default '{}',
  exclusions text[] not null default '{}',
  valid_until date,
  owner_notes text,
  customer_terms text,
  supersedes_id uuid references public.quotations (id) on delete set null,
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, version),
  check (discount_amount <= subtotal),
  check (total = subtotal - discount_amount)
);
create index quotations_status_idx on public.quotations (status);
create trigger quotations_updated_at before update on public.quotations
  for each row execute function public.set_updated_at();

create table public.quotation_line_items (
  id uuid primary key default extensions.gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  position int not null default 0,
  description text not null check (length(description) between 1 and 500),
  pricing_rule_id uuid references public.pricing_rules (id) on delete set null,
  quantity numeric(10, 2) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);
create index quotation_line_items_idx on public.quotation_line_items (quotation_id, position);

create or replace function public.quotation_transition_allowed(from_s public.quotation_status, to_s public.quotation_status)
returns boolean language sql immutable set search_path = '' as $$
  select case from_s
    when 'DRAFT' then to_s in ('SENT', 'REVISED')
    when 'SENT' then to_s in ('ACCEPTED', 'REJECTED', 'EXPIRED', 'REVISED')
    when 'ACCEPTED' then to_s in ('REVISED')
    when 'REJECTED' then to_s in ('REVISED')
    when 'EXPIRED' then to_s in ('REVISED')
    else false
  end
$$;

create or replace function public.guard_quotation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status
       and not public.quotation_transition_allowed(old.status, new.status) then
      raise exception 'Quotation cannot move from % to %', old.status, new.status using errcode = '23514';
    end if;
    -- Once sent, the commercial content is frozen: revise instead.
    if old.status <> 'DRAFT' and (
         new.currency is distinct from old.currency or new.subtotal is distinct from old.subtotal
      or new.discount_amount is distinct from old.discount_amount or new.total is distinct from old.total
      or new.inclusions is distinct from old.inclusions or new.exclusions is distinct from old.exclusions
      or new.customer_terms is distinct from old.customer_terms or new.valid_until is distinct from old.valid_until) then
      raise exception 'A sent quotation cannot be edited. Create a revision instead.' using errcode = '23514';
    end if;
    if new.status = 'SENT' and old.status <> 'SENT' then new.sent_at := coalesce(new.sent_at, now()); end if;
    if new.status = 'ACCEPTED' and old.status <> 'ACCEPTED' then new.accepted_at := now(); end if;
    if new.status = 'REJECTED' and old.status <> 'REJECTED' then new.rejected_at := now(); end if;
  end if;
  return new;
end $$;
create trigger quotations_guard before update on public.quotations
  for each row execute function public.guard_quotation();

-- Line items are only editable while the parent quotation is a draft.
create or replace function public.guard_line_items() returns trigger
language plpgsql set search_path = '' as $$
declare
  q_status public.quotation_status;
begin
  select status into q_status from public.quotations
   where id = coalesce(new.quotation_id, old.quotation_id);
  if q_status is not null and q_status <> 'DRAFT' then
    raise exception 'Line items can only change on a draft quotation' using errcode = '23514';
  end if;
  return coalesce(new, old);
end $$;
create trigger quotation_line_items_guard before insert or update or delete on public.quotation_line_items
  for each row execute function public.guard_line_items();

-- ---------------------------------------------------------------------------
-- Driver & vehicle assignments with conflict detection
-- ---------------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  driver_id uuid references public.drivers (id) on delete set null,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  starts_on date not null,
  ends_on date not null,
  status public.assignment_status not null default 'PROVISIONAL',
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  check (driver_id is not null or vehicle_id is not null)
);
create index assignments_vehicle_idx on public.assignments (vehicle_id, starts_on, ends_on) where status <> 'RELEASED';
create index assignments_driver_idx on public.assignments (driver_id, starts_on, ends_on) where status <> 'RELEASED';
create index assignments_booking_idx on public.assignments (booking_id);
create trigger assignments_updated_at before update on public.assignments
  for each row execute function public.set_updated_at();

-- Returns clashing assignments / unavailability windows for a driver or vehicle.
create or replace function public.assignment_conflicts(
  p_vehicle_id uuid, p_driver_id uuid, p_starts date, p_ends date, p_exclude uuid default null
) returns table (kind text, booking_reference text, starts_on date, ends_on date, detail text)
language sql stable security invoker set search_path = '' as $$
  select 'vehicle', b.reference, a.starts_on, a.ends_on, a.status::text
    from public.assignments a join public.bookings b on b.id = a.booking_id
   where p_vehicle_id is not null and a.vehicle_id = p_vehicle_id and a.status <> 'RELEASED'
     and (p_exclude is null or a.id <> p_exclude)
     and b.status not in ('CANCELLED', 'COMPLETED')
     and daterange(a.starts_on, a.ends_on, '[]') && daterange(p_starts, p_ends, '[]')
  union all
  select 'driver', b.reference, a.starts_on, a.ends_on, a.status::text
    from public.assignments a join public.bookings b on b.id = a.booking_id
   where p_driver_id is not null and a.driver_id = p_driver_id and a.status <> 'RELEASED'
     and (p_exclude is null or a.id <> p_exclude)
     and b.status not in ('CANCELLED', 'COMPLETED')
     and daterange(a.starts_on, a.ends_on, '[]') && daterange(p_starts, p_ends, '[]')
  union all
  select 'vehicle_unavailable', null, u.starts_on, u.ends_on, u.reason
    from public.vehicle_unavailability u
   where p_vehicle_id is not null and u.vehicle_id = p_vehicle_id
     and daterange(u.starts_on, u.ends_on, '[]') && daterange(p_starts, p_ends, '[]')
$$;

-- ---------------------------------------------------------------------------
-- Internal notes (bookings, trip requests, contact submissions, customers)
-- ---------------------------------------------------------------------------
create table public.internal_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete cascade,
  trip_request_id uuid references public.trip_requests (id) on delete cascade,
  contact_submission_id uuid references public.contact_submissions (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete cascade,
  body text not null check (length(body) between 1 and 5000),
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (num_nonnulls(booking_id, trip_request_id, contact_submission_id, customer_id) = 1)
);
create index internal_notes_booking_idx on public.internal_notes (booking_id);
create index internal_notes_trip_idx on public.internal_notes (trip_request_id);
create index internal_notes_contact_idx on public.internal_notes (contact_submission_id);
create index internal_notes_customer_idx on public.internal_notes (customer_id);

-- ---------------------------------------------------------------------------
-- Website content: FAQs and genuine testimonials
-- ---------------------------------------------------------------------------
create table public.faqs (
  id uuid primary key default extensions.gen_random_uuid(),
  locale text not null default 'en',
  question text not null,
  answer text not null,
  category text,
  show_on_home boolean not null default false,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger faqs_updated_at before update on public.faqs
  for each row execute function public.set_updated_at();

-- Only genuine customer feedback. Source + date are required so each entry is traceable.
create table public.testimonials (
  id uuid primary key default extensions.gen_random_uuid(),
  author_name text not null,
  author_location text,
  body text not null check (length(body) <= 1500),
  source text not null check (source in ('direct', 'tripadvisor', 'google', 'facebook', 'other')),
  source_url text,
  received_on date not null,
  verified_by uuid references public.profiles (id) on delete set null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit log, notification deliveries, form throttling
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text,
  changes jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create table public.notification_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  channel text not null default 'email' check (channel in ('email')),
  template text not null,
  recipient text not null,
  subject text,
  reply_to text,
  body_text text,
  body_html text,
  related_type text,
  related_id uuid,
  status public.delivery_status not null default 'PENDING',
  provider_message_id text,
  error text,
  attempts int not null default 0,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now()
);
create index notification_deliveries_status_idx on public.notification_deliveries (status, created_at desc);

create table public.form_attempts (
  id bigint generated always as identity primary key,
  form text not null,
  client_hash text not null,
  created_at timestamptz not null default now()
);
create index form_attempts_idx on public.form_attempts (form, client_hash, created_at desc);

-- Returns true and records the attempt when under the limit.
create or replace function public.consume_form_attempt(p_form text, p_client_hash text, p_limit int, p_window interval)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  recent int;
begin
  delete from public.form_attempts where created_at < now() - interval '2 days';
  select count(*) into recent from public.form_attempts
   where form = p_form and client_hash = p_client_hash and created_at > now() - p_window;
  if recent >= p_limit then
    return false;
  end if;
  insert into public.form_attempts (form, client_hash) values (p_form, p_client_hash);
  return true;
end $$;
revoke all on function public.consume_form_attempt(text, text, int, interval) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Customer de-duplication: match by email first, then normalized phone.
-- Called only by the server (service role) after validation.
-- ---------------------------------------------------------------------------
create or replace function public.upsert_customer(
  p_full_name text, p_email text, p_phone text, p_phone_normalized text, p_country text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  cid uuid;
begin
  if p_email is not null then
    select id into cid from public.customers where email = p_email::extensions.citext;
  end if;
  -- Phone matches only when emails don't conflict (a shared family phone
  -- with a different email is treated as a different traveller).
  if cid is null and p_phone_normalized is not null then
    select id into cid from public.customers
     where phone_normalized = p_phone_normalized
       and (p_email is null or email is null)
     order by created_at limit 1;
  end if;
  if cid is null then
    insert into public.customers (full_name, email, phone, phone_normalized, country)
    values (p_full_name, p_email, p_phone, p_phone_normalized, p_country)
    on conflict (email) where email is not null do update set updated_at = now()
    returning id into cid;
  else
    update public.customers set
      email = coalesce(email, p_email::extensions.citext),
      phone = coalesce(phone, p_phone),
      phone_normalized = coalesce(phone_normalized, p_phone_normalized),
      country = coalesce(country, p_country)
    where id = cid;
  end if;
  return cid;
end $$;
revoke all on function public.upsert_customer(text, text, text, text, text) from public, anon, authenticated;
