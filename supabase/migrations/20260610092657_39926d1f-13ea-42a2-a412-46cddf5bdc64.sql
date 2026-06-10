DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view visible categories of published events" ON public.ticket_categories;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can insert order" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can view a ticket by id" ON public.tickets;

REVOKE ALL ON public.events FROM anon, authenticated;
REVOKE ALL ON public.ticket_categories FROM anon, authenticated;
REVOKE ALL ON public.coupons FROM anon, authenticated;
REVOKE ALL ON public.orders FROM anon, authenticated;
REVOKE ALL ON public.order_items FROM anon, authenticated;
REVOKE ALL ON public.tickets FROM anon, authenticated;
REVOKE ALL ON public.ticket_scans FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT SELECT ON public.tickets TO authenticated;
GRANT SELECT ON public.ticket_scans TO authenticated;

GRANT ALL ON public.events TO service_role;
GRANT ALL ON public.ticket_categories TO service_role;
GRANT ALL ON public.coupons TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.tickets TO service_role;
GRANT ALL ON public.ticket_scans TO service_role;