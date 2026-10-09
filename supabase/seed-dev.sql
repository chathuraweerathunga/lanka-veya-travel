-- DEVELOPMENT-ONLY sample data. Never load this into production.
-- Sample tours/vehicles/pricing exist so pages and the portal can be exercised
-- locally. Names say "(sample)" where they could be mistaken for real inventory.

insert into public.tours (slug, name, short_description, description, categories, duration_days, duration_nights,
  traveler_types, vehicle_options, max_group_size, price_mode, inclusions, exclusions, add_ons,
  cover_image_url, cover_image_alt, image_credit, seo_title, seo_description, is_featured, status, sort_order)
values
('cultural-triangle-and-hill-country', 'Cultural Triangle & Hill Country',
 'Rock fortresses, cave temples, Kandy and the tea hills at an unhurried pace.',
 'A classic first journey through Sri Lanka''s ancient cities and cool tea country, with a private driver throughout. Every day can be adjusted to your interests and pace.',
 array['cultural', 'hill-country', 'scenic-train', 'round-tour'], 7, 6,
 array['Couples', 'Families', 'First-time visitors'], array['Sedan', 'SUV', 'Van'], 12, 'QUOTE_ONLY',
 array['Private vehicle with English-speaking driver', 'Fuel, parking and highway tolls', 'Airport pickup and drop-off'],
 array['International flights', 'Entrance tickets', 'Meals unless stated', 'Personal expenses'],
 '[{"name":"Scenic train tickets","description":"Reserved seats where available"},{"name":"Jeep safari at Minneriya","description":"Seasonal"}]'::jsonb,
 'https://images.unsplash.com/photo-1580794749460-76f97b7180d8', 'A path leading toward the Sigiriya rock fortress under a blue sky', 'Photo: Shashank Hudkar / Unsplash',
 'Cultural Triangle & Hill Country private tour', 'A 7-day private Sri Lanka tour through Sigiriya, Dambulla, Kandy, Nuwara Eliya and Ella with your own driver.',
 true, 'published', 1),
('south-coast-beaches-and-yala', 'South Coast Beaches & Yala',
 'Galle Fort, palm-lined bays and a leopard safari in Yala.',
 'Slow days on the south coast combined with an early-morning safari in Yala National Park.',
 array['beach', 'wildlife'], 6, 5,
 array['Couples', 'Honeymooners', 'Families'], array['Sedan', 'SUV'], 8, 'QUOTE_ONLY',
 array['Private vehicle with driver', 'Fuel, parking and tolls'],
 array['Safari jeep and park fees', 'Accommodation unless arranged', 'Meals'],
 '[]'::jsonb,
 'https://images.unsplash.com/photo-1580910527739-556eb89f9d65', 'Palm trees on the beach at Mirissa', 'Photo: Dinuka Lankaloka / Unsplash',
 'South coast beaches & Yala safari private tour', 'Six days between Galle, Mirissa and Yala with a private driver, planned around you.',
 true, 'published', 2),
('kandy-to-ella-train-with-luggage-transfer', 'Kandy to Ella by Train',
 'Ride the famous hill-country railway while your driver carries your luggage by road.',
 'One of the world''s most scenic train journeys, with your driver meeting you at Ella station.',
 array['scenic-train', 'day-trip', 'hill-country'], 1, 0,
 array['Solo travellers', 'Couples', 'Friends'], array['Sedan', 'Van'], 6, 'QUOTE_ONLY',
 array['Drop-off at Kandy or Peradeniya station', 'Luggage transfer and pickup at Ella'],
 array['Train tickets unless requested', 'Meals'],
 '[]'::jsonb,
 'https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9', 'A blue train crossing the Nine Arches Bridge in Ella', 'Photo: Hendrik Cornelissen / Unsplash',
 'Kandy to Ella scenic train with luggage transfer', 'Take the Kandy–Ella train while your driver transfers your luggage and meets you at the station.',
 true, 'published', 3)
on conflict (slug) do nothing;

insert into public.tour_destinations (tour_id, destination_id, position)
select t.id, d.id, x.pos from (values
  ('cultural-triangle-and-hill-country', 'sigiriya', 1), ('cultural-triangle-and-hill-country', 'dambulla', 2),
  ('cultural-triangle-and-hill-country', 'kandy', 3), ('cultural-triangle-and-hill-country', 'nuwara-eliya', 4),
  ('cultural-triangle-and-hill-country', 'ella', 5),
  ('south-coast-beaches-and-yala', 'galle', 1), ('south-coast-beaches-and-yala', 'mirissa', 2),
  ('south-coast-beaches-and-yala', 'yala', 3),
  ('kandy-to-ella-train-with-luggage-transfer', 'kandy', 1), ('kandy-to-ella-train-with-luggage-transfer', 'ella', 2)
) as x(tour_slug, dest_slug, pos)
join public.tours t on t.slug = x.tour_slug
join public.destinations d on d.slug = x.dest_slug
on conflict do nothing;

insert into public.tour_itinerary_days (tour_id, day_number, title, description, overnight)
select t.id, x.day, x.title, x.descr, x.overnight from (values
  ('cultural-triangle-and-hill-country', 1, 'Arrival and drive to Sigiriya', 'Meet your driver at the airport and travel north to the Cultural Triangle.', 'Sigiriya'),
  ('cultural-triangle-and-hill-country', 2, 'Sigiriya and Pidurangala', 'An early climb of the rock fortress, with the afternoon free or a village visit.', 'Sigiriya'),
  ('cultural-triangle-and-hill-country', 3, 'Dambulla to Kandy', 'Visit the cave temples, then continue to Kandy for the evening.', 'Kandy'),
  ('cultural-triangle-and-hill-country', 4, 'Kandy', 'Temple of the Tooth, the botanical gardens and the lake.', 'Kandy'),
  ('cultural-triangle-and-hill-country', 5, 'Tea country', 'Drive into the hills with a tea factory stop on the way to Nuwara Eliya.', 'Nuwara Eliya'),
  ('cultural-triangle-and-hill-country', 6, 'Train to Ella', 'Scenic train to Ella while your driver brings the luggage.', 'Ella'),
  ('cultural-triangle-and-hill-country', 7, 'Departure', 'Transfer to the airport or extend to the south coast.', null),
  ('south-coast-beaches-and-yala', 1, 'Galle Fort', 'Drive down the coast and walk the ramparts at sunset.', 'Galle'),
  ('south-coast-beaches-and-yala', 2, 'Beaches of the south', 'Time at Unawatuna, Weligama and Mirissa.', 'Mirissa'),
  ('south-coast-beaches-and-yala', 3, 'Mirissa', 'An optional whale-watching morning in season.', 'Mirissa'),
  ('south-coast-beaches-and-yala', 4, 'To Yala', 'Afternoon drive east toward Tissamaharama.', 'Tissamaharama'),
  ('south-coast-beaches-and-yala', 5, 'Yala safari', 'Early jeep safari, then return west.', 'South coast'),
  ('south-coast-beaches-and-yala', 6, 'Departure', 'Transfer to Colombo or the airport.', null),
  ('kandy-to-ella-train-with-luggage-transfer', 1, 'Kandy to Ella', 'Station drop-off, the train through the tea country and pickup at Ella.', null)
) as x(tour_slug, day, title, descr, overnight)
join public.tours t on t.slug = x.tour_slug
on conflict do nothing;

insert into public.vehicles (name, category, passenger_capacity, luggage_capacity, amenities, description,
  pricing_method, availability_notes, is_active, is_public, sort_order, registration_number, internal_notes)
values
('Sedan (sample)', 'SEDAN', 3, 2, array['Air conditioning', 'Bottled water'], 'Development sample vehicle.', 'PER_DAY', null, true, true, 1, 'DEV-0001', 'Development sample'),
('Van (sample)', 'VAN', 8, 8, array['Air conditioning', 'Reclining seats'], 'Development sample vehicle.', 'PER_DAY', null, true, true, 2, 'DEV-0002', 'Development sample');

insert into public.drivers (full_name, phone, languages, is_active, notes) values
('Sample Driver', '+94 70 000 0000', array['English', 'Sinhala'], true, 'Development sample');

insert into public.pricing_rules (name, service_type, vehicle_category, method, rate, currency, minimum_charge, notes) values
('Airport transfer — sedan (sample)', 'AIRPORT_TRANSFER', 'SEDAN', 'PER_KM', 120.00, 'LKR', 5000.00, 'Development sample rate'),
('Day hire — van (sample)', 'DAY_HIRE', 'VAN', 'PER_DAY', 25000.00, 'LKR', null, 'Development sample rate');
