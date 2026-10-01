INSERT INTO public.events (slug, name, description, venue, starts_at, ends_at, organizer_name, status, is_featured, category) VALUES
('afrobeats-live-accra', 'Afrobeats Live: Accra Night', 'A high-energy night of Afrobeats, highlife and amapiano with live performances from top Ghanaian artists.', 'Grand Arena, Accra International Conference Centre', now() + interval '21 days', now() + interval '21 days' + interval '5 hours', 'Pulse Events GH', 'published', true, 'Music'),
('accra-tech-summit-2026', 'Accra Tech Summit 2026', 'Two days of talks, workshops and networking with founders, engineers and investors shaping Africa''s tech scene.', 'Kempinski Hotel Gold Coast City, Accra', now() + interval '35 days', now() + interval '36 days', 'TechHub Africa', 'published', true, 'Conference'),
('taste-of-accra-food-fest', 'Taste of Accra Food Festival', 'Street food, jollof battles, live cooking demos and music — a full day celebrating Ghanaian cuisine.', 'Independence Square, Accra', now() + interval '14 days', now() + interval '14 days' + interval '8 hours', 'Foodie GH', 'published', false, 'Food & Drink'),
('kumasi-comedy-night', 'Kumasi Comedy Night', 'An evening of stand-up comedy featuring Ghana''s funniest acts.', 'Golden Bean Hotel, Kumasi', now() + interval '28 days', now() + interval '28 days' + interval '3 hours', 'Laugh GH', 'draft', false, 'Comedy');

INSERT INTO public.ticket_categories (event_id, name, description, price_pesewas, quantity, sort_order)
SELECT e.id, c.name, c.description, c.price_pesewas, c.quantity, c.sort_order
FROM public.events e
JOIN (VALUES
  ('afrobeats-live-accra', 'Early Bird', 'Limited early bird general admission', 15000, 100, 0),
  ('afrobeats-live-accra', 'Regular', 'General admission', 25000, 400, 1),
  ('afrobeats-live-accra', 'VIP', 'Front section + lounge access', 60000, 80, 2),
  ('accra-tech-summit-2026', 'Student', 'Valid student ID required', 10000, 150, 0),
  ('accra-tech-summit-2026', 'Standard', 'Full 2-day access', 35000, 300, 1),
  ('accra-tech-summit-2026', 'Corporate', '2-day access + VIP networking dinner', 90000, 60, 2),
  ('taste-of-accra-food-fest', 'General', 'Entry + 3 tasting tokens', 8000, 500, 0),
  ('taste-of-accra-food-fest', 'Family Pack', 'Entry for 4 + 12 tasting tokens', 28000, 120, 1),
  ('kumasi-comedy-night', 'Regular', 'General seating', 12000, 200, 0),
  ('kumasi-comedy-night', 'VIP Table', 'Table of 4 near the stage', 60000, 25, 1)
) AS c(slug, name, description, price_pesewas, quantity, sort_order)
ON e.slug = c.slug;

INSERT INTO public.coupons (event_id, code, discount_type, discount_value, max_uses, is_active)
SELECT id, 'WELCOME10', 'percent', 10, 100, true
FROM public.events WHERE slug = 'afrobeats-live-accra';