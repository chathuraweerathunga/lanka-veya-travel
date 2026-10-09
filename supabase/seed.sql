-- Production-safe starter content for Lanka Veya Travel.
-- Contains only: configured business details from the brief, currencies
-- (no exchange rates), factual destination guides, and FAQs consistent with
-- the quote-first model. No tours, vehicles, prices, reviews or testimonials
-- are invented here — the owner adds real ones in the portal.
-- Safe to re-run: uses ON CONFLICT DO NOTHING.

insert into public.currencies (code, name, symbol, decimals, is_active, is_default, sort_order) values
  ('LKR', 'Sri Lankan rupee', 'Rs', 2, true, true, 0),
  ('USD', 'US dollar', '$', 2, true, false, 1),
  ('EUR', 'Euro', '€', 2, true, false, 2),
  ('GBP', 'Pound sterling', '£', 2, false, false, 3),
  ('AUD', 'Australian dollar', 'A$', 2, false, false, 4)
on conflict (code) do nothing;

insert into public.site_settings (key, value, is_public) values
('business', jsonb_build_object(
  'name', 'Lanka Veya Travel',
  'tagline', 'Discover Sri Lanka. Travel Your Way.',
  'positioning', 'Private tours, airport transfers and chauffeur-driven journeys across Sri Lanka, planned around you.',
  'email', 'lankaveyatravel@gmail.com',
  'whatsapp', '94776205149',
  'whatsapp_display', '+94 77 620 5149',
  'phone', '',
  'address', '',
  'response_time_note', '',
  'domain', 'lankaveyatravel.com'
), true),
('hero', jsonb_build_object(
  'headline', 'Discover Sri Lanka. Travel Your Way.',
  'subheading', 'Private tours, airport transfers and chauffeur-driven journeys, shaped around your dates, pace and interests.',
  'image_url', 'https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9',
  'image_alt', 'A blue train crossing the Nine Arches Bridge near Ella, surrounded by forest',
  'image_credit', 'Photo: Hendrik Cornelissen / Unsplash'
), true),
('social', jsonb_build_object('facebook', '', 'instagram', '', 'tiktok', '', 'youtube', ''), true),
('platforms', jsonb_build_object(
  'tripadvisor_url', '', 'tripadvisor_review_url', '',
  'google_business_url', '', 'google_review_url', '', 'google_maps_url', '',
  'booking_com_url', '', 'viator_url', '', 'getyourguide_url', ''
), true),
('seo', jsonb_build_object(
  'default_title', 'Lanka Veya Travel — Sri Lanka private tours & transfers',
  'default_description', 'Sri Lanka private tours, customised holidays, Colombo airport transfers and private drivers. Tell us your plans and we will prepare a personal quotation.',
  'og_image_url', 'https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9'
), true),
('currency', jsonb_build_object('default', 'LKR', 'display', jsonb_build_array('LKR', 'USD', 'EUR')), true),
('footer', jsonb_build_object(
  'about', 'Lanka Veya Travel plans private journeys across Sri Lanka: tours, transfers and drivers, arranged personally and confirmed only once every detail is agreed.'
), true),
('analytics', jsonb_build_object('plausible_domain', '', 'ga_measurement_id', ''), true),
('notifications', jsonb_build_object(
  'notify_email', 'lankaveyatravel@gmail.com',
  'enabled', true
), false)
on conflict (key) do nothing;

-- Destination guides. Photography: Unsplash licence (free to use, credit given).
insert into public.destinations (slug, name, region, summary, description, highlights, suggested_stay, best_time, transport_notes, cover_image_url, cover_image_alt, image_credit, status, sort_order) values
('colombo', 'Colombo', 'Western Province',
 'Sri Lanka''s commercial capital: colonial streets, temples, markets and a long ocean promenade.',
 'Most journeys begin or end near Colombo. Beyond the business district you will find Galle Face Green at sunset, the Pettah markets, Gangaramaya Temple, Independence Square and a growing restaurant scene. It works well as a first or final night before or after a flight.',
 array['Galle Face Green', 'Pettah markets', 'Gangaramaya Temple', 'Independence Memorial Hall', 'Lotus Tower'],
 '1 night', 'Year-round; the south-west monsoon brings rain roughly May to September.',
 'Bandaranaike International Airport (CMB) is about an hour''s drive north, depending on traffic.',
 'https://images.unsplash.com/photo-1623595289196-007a22dd8560', 'A train on tracks leading toward the Lotus Tower in Colombo at golden hour', 'Photo: Tharoushan Kandarajah / Unsplash', 'published', 1),
('kandy', 'Kandy', 'Central Province',
 'The hill capital of the last Sinhalese kings, home to the Temple of the Sacred Tooth Relic.',
 'Set around a lake and ringed by hills, Kandy is the cultural heart of the island. Visit the Temple of the Sacred Tooth Relic, walk the Royal Botanic Gardens at Peradeniya, and see a traditional dance performance. It is a natural stop between the Cultural Triangle and the tea country.',
 array['Temple of the Sacred Tooth Relic', 'Royal Botanic Gardens, Peradeniya', 'Kandy Lake', 'Kandyan dance performance'],
 '1–2 nights', 'Year-round; the Esala Perahera festival usually falls in July or August.',
 'Around 3–4 hours by road from the airport; also on the scenic railway toward Nuwara Eliya and Ella.',
 'https://images.unsplash.com/photo-1665849050332-8d5d7e59afb6', 'A white building with a gold roof beside the Temple of the Tooth in Kandy', 'Photo: Chathura Anuradha Subasinghe / Unsplash', 'published', 2),
('sigiriya', 'Sigiriya', 'Cultural Triangle',
 'A fifth-century rock fortress rising some 200 metres above the plains.',
 'Climb past the frescoes and the Lion Gate to the summit gardens of Sigiriya, or watch it from neighbouring Pidurangala at sunrise. The area makes an excellent base for Dambulla, Polonnaruwa, Minneriya safaris and village experiences.',
 array['Sigiriya Rock Fortress', 'Pidurangala Rock', 'Minneriya and Kaudulla national parks', 'Polonnaruwa ancient city'],
 '2–3 nights', 'Generally driest from January to September; climb early to avoid the heat.',
 'Roughly 4 hours from the airport; well placed for day trips across the Cultural Triangle.',
 'https://images.unsplash.com/photo-1612862862126-865765df2ded', 'Aerial view of the Sigiriya rock fortress rising above dense green forest', 'Photo: Dylan Shaw / Unsplash', 'published', 3),
('dambulla', 'Dambulla', 'Cultural Triangle',
 'Cave temples filled with Buddhist murals and statues, a short drive from Sigiriya.',
 'The Dambulla cave temple complex holds five sanctuaries painted with murals and lined with Buddha statues, reached by a walk up the rock. Combine it with Sigiriya on the same day or on the way between Kandy and the north.',
 array['Dambulla Cave Temple', 'Golden Temple', 'Local produce market'],
 'Half day (usually combined with Sigiriya)', 'Year-round.',
 'About 30 minutes from Sigiriya and 2–3 hours from Kandy.',
 'https://images.unsplash.com/photo-1656497107500-a2bc32cbe7d4', 'A large statue in front of the temple building at Dambulla', 'Photo: Secret Travel Guide / Unsplash', 'published', 4),
('ella', 'Ella', 'Uva Province',
 'A laid-back hill-country village of tea slopes, waterfalls and the Nine Arches Bridge.',
 'Ella is a favourite for gentle hikes and big views: Little Adam''s Peak, Ella Rock, Ravana Falls and the Nine Arches Bridge. Many travellers arrive by the scenic train from Kandy or Nuwara Eliya, with their driver meeting them at the station.',
 array['Nine Arches Bridge', 'Little Adam''s Peak', 'Ella Rock', 'Ravana Falls', 'Scenic train journey'],
 '2 nights', 'Pleasant most of the year; mornings are clearest.',
 'A natural link between the hill country and Yala or the south coast.',
 'https://images.unsplash.com/photo-1578519050142-afb511e518de', 'A train crossing a bridge through the forest near Ella', 'Photo: Anton Lecock / Unsplash', 'published', 5),
('nuwara-eliya', 'Nuwara Eliya', 'Central Province',
 'Cool-climate tea country with colonial bungalows, gardens and rolling estates.',
 'At around 1,800 metres, Nuwara Eliya is noticeably cooler than the coast. Visit a working tea factory, walk Gregory Lake and Hakgala Botanical Garden, or start early for Horton Plains and World''s End.',
 array['Tea factory visits', 'Horton Plains and World''s End', 'Hakgala Botanical Garden', 'Gregory Lake'],
 '1–2 nights', 'Year-round; bring a warm layer for evenings.',
 'Winding mountain roads — allow extra time. Nanu Oya station serves the scenic railway.',
 'https://images.unsplash.com/photo-1708338914870-797de586672d', 'A lush green hillside covered in trees in the Nuwara Eliya region', 'Photo: Juho S / Unsplash', 'published', 6),
('galle', 'Galle', 'Southern Province',
 'A walled fort town of ramparts, lanes, galleries and a lighthouse on the sea.',
 'Galle Fort is a UNESCO World Heritage Site with Dutch-era ramparts, boutique shops and cafés. Walk the walls at sunset, then explore the beaches and cinnamon country nearby.',
 array['Galle Fort ramparts', 'Galle lighthouse', 'Dutch Reformed Church', 'Nearby beaches'],
 '1–2 nights', 'Best from roughly November to April on the south-west coast.',
 'About 2 hours from Colombo on the Southern Expressway.',
 'https://images.unsplash.com/photo-1568843240915-b512cc9b4415', 'The white lighthouse at Galle Fort', 'Photo: Shainee Fernando / Unsplash', 'published', 7),
('mirissa', 'Mirissa', 'Southern Province',
 'A crescent bay of palms and surf, known for seasonal whale watching.',
 'Mirissa combines a relaxed beach with seasonal whale-watching departures, Coconut Tree Hill viewpoints and easy access to Weligama and Galle.',
 array['Whale watching (seasonal)', 'Coconut Tree Hill', 'Secret Beach', 'Sunset at the bay'],
 '2–3 nights', 'Roughly November to April for calmer seas and whale season.',
 'Around 30–45 minutes from Galle.',
 'https://images.unsplash.com/photo-1580910527739-556eb89f9d65', 'Palm trees along the beach shore at Mirissa', 'Photo: Dinuka Lankaloka / Unsplash', 'published', 8),
('weligama', 'Weligama', 'Southern Province',
 'A wide, gentle bay that suits beginner surfers, with stilt fishermen nearby.',
 'Weligama''s long sandy bay has soft beginner waves and plenty of surf schools. Nearby you can see the traditional stilt fishermen at Koggala and Ahangama.',
 array['Beginner surf lessons', 'Stilt fishermen', 'Taprobane Island viewpoint'],
 '2 nights', 'Roughly November to April.',
 'Between Galle and Mirissa on the south coast.',
 'https://images.unsplash.com/photo-1519566335946-e6f65f0f4fdf', 'Stilt fishermen on wooden poles in the shallow coastal waters of Sri Lanka', 'Photo: Daniel Klein / Unsplash', 'published', 9),
('yala', 'Yala', 'Southern & Uva Provinces',
 'Sri Lanka''s best-known national park, with leopards, elephants and birdlife.',
 'Yala''s scrub, lagoons and rock outcrops are home to leopards, elephants, sloth bears, crocodiles and hundreds of bird species. Jeep safaris run in the early morning and afternoon; parts of the park may close for a period each year, usually around September and October.',
 array['Jeep safari', 'Leopards and elephants', 'Birdlife at the lagoons'],
 '1–2 nights', 'Usually February to July for wildlife viewing.',
 'Tissamaharama is the usual base; around 2.5 hours from Ella.',
 'https://images.unsplash.com/photo-1621847473222-d85c022cbf07', 'A leopard standing in water in Yala National Park', 'Photo: Udara Karunarathna / Unsplash', 'published', 10),
('trincomalee', 'Trincomalee', 'Eastern Province',
 'A deep natural harbour, Hindu temples and quiet east-coast beaches.',
 'Trincomalee pairs history with beach time: Koneswaram Temple on Swami Rock, Nilaveli and Uppuveli beaches, and snorkelling trips to Pigeon Island.',
 array['Koneswaram Temple', 'Nilaveli and Uppuveli beaches', 'Pigeon Island snorkelling'],
 '2–3 nights', 'Roughly May to September, when the east coast is at its best.',
 'Around 2.5 hours from Sigiriya.',
 'https://images.unsplash.com/photo-1558446791-ac5fec3caddf', 'A Buddha statue near a white building in Trincomalee', 'Photo: Nadun Ranasinghe / Unsplash', 'published', 11),
('bentota', 'Bentota', 'Southern Province',
 'Golden beaches, a river estuary and calm resort days on the south-west coast.',
 'Bentota is known for wide beaches, river safaris on the Bentota Ganga, water sports and nearby gardens such as Brief Garden and Lunuganga.',
 array['Bentota beach', 'River safari', 'Water sports', 'Lunuganga and Brief Garden'],
 '2–3 nights', 'Roughly November to April.',
 'Around 1.5 hours from Colombo; an easy final stop before an evening flight.',
 'https://images.unsplash.com/photo-1725389606195-56df8d956d13', 'Palm trees blowing in the wind beside the beach at Bentota', 'Photo: Bacpacman / Unsplash', 'published', 12),
('arugam-bay', 'Arugam Bay', 'Eastern Province',
 'A world-known surf point and village with lagoons and wildlife nearby.',
 'Arugam Bay draws surfers from around the world in season, and non-surfers come for the relaxed village, Kumana National Park and lagoon safaris.',
 array['Main Point surf break', 'Kumana National Park', 'Pottuvil lagoon'],
 '2–4 nights', 'Roughly May to October.',
 'Around 3 hours from Ella.',
 'https://images.unsplash.com/photo-1552055568-f8c4fb8c6320', 'Aerial view of fishing boats on the shore at Arugam Bay', 'Photo: Tomáš Malík / Unsplash', 'published', 13)
on conflict (slug) do nothing;

-- FAQs have no natural key, so they are only seeded into an empty table.
insert into public.faqs (question, answer, category, show_on_home, is_published, sort_order)
select * from (values
('How does booking work?',
 'Send us a request with your dates, group size and what you would like to do. We review it, check availability and send you a personal quotation. Your trip is confirmed only after you accept the quotation and we confirm it with you by WhatsApp or email.',
 'Booking', true, true, 1),
('Is my trip confirmed when I submit the form?',
 'No. Submitting a request does not confirm a booking or reserve a vehicle. We will contact you to discuss the details and send a quotation. Confirmation always comes from us directly.',
 'Booking', true, true, 2),
('Can you arrange airport pickups?',
 'Yes. Tell us your flight details, arrival time, number of passengers and luggage, and we will quote for a private transfer to your hotel or first destination.',
 'Transport', true, true, 3),
('Can I change the itinerary?',
 'Our tours are a starting point. We are happy to adjust destinations, pace and duration and will quote for your version of the trip.',
 'Tours', true, true, 4),
('Which currency are prices quoted in?',
 'Each quotation states its currency clearly. Any conversions shown elsewhere are indicative only and are not used for your final price.',
 'Pricing', false, true, 5),
('How do I pay?',
 'We do not take online payments on this website. Payment arrangements are agreed with you directly once your quotation has been accepted.',
 'Pricing', false, true, 6),
('What is your cancellation policy?',
 'Cancellation terms depend on the services in your trip and are stated in your quotation. Please also read our cancellation policy page.',
 'Booking', false, true, 7),
('How can I contact you quickly?',
 'WhatsApp is usually the quickest way to reach us. You can also email us or use the contact form.',
 'Contact', false, true, 8)
) as v(question, answer, category, show_on_home, is_published, sort_order)
where not exists (select 1 from public.faqs);
