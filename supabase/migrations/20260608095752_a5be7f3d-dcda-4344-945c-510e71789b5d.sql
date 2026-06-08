
-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  venue TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  organizer_name TEXT,
  organizer_contact TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_starts_at ON public.events(starts_at);

GRANT SELECT ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published events" ON public.events
  FOR SELECT USING (status = 'published');

-- TICKET CATEGORIES
CREATE TABLE public.ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_pesewas BIGINT NOT NULL CHECK (price_pesewas >= 0),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  sold_count INTEGER NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  sale_starts_at TIMESTAMPTZ,
  sale_ends_at TIMESTAMPTZ,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ticket_categories_event ON public.ticket_categories(event_id);

GRANT SELECT ON public.ticket_categories TO anon, authenticated;
GRANT ALL ON public.ticket_categories TO service_role;
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visible categories of published events" ON public.ticket_categories
  FOR SELECT USING (
    is_visible = true
    AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.status = 'published')
  );

-- COUPONS
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value BIGINT NOT NULL CHECK (discount_value >= 0),
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  subtotal_pesewas BIGINT NOT NULL DEFAULT 0,
  discount_pesewas BIGINT NOT NULL DEFAULT 0,
  fee_pesewas BIGINT NOT NULL DEFAULT 0,
  total_pesewas BIGINT NOT NULL DEFAULT 0,
  coupon_id UUID REFERENCES public.coupons(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled')),
  paystack_reference TEXT,
  paystack_access_code TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_email ON public.orders(buyer_email);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_event ON public.orders(event_id);

GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- Guests can create their order (server validates)
CREATE POLICY "Anyone can insert order" ON public.orders
  FOR INSERT WITH CHECK (true);
-- No public read; lookup uses server function with admin client

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_category_id UUID NOT NULL REFERENCES public.ticket_categories(id) ON DELETE RESTRICT,
  ticket_name TEXT NOT NULL,
  unit_price_pesewas BIGINT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- TICKETS
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  ticket_category_id UUID NOT NULL REFERENCES public.ticket_categories(id) ON DELETE RESTRICT,
  ticket_code TEXT NOT NULL UNIQUE,
  qr_payload TEXT NOT NULL UNIQUE,
  attendee_name TEXT,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','used','revoked')),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tickets_order ON public.tickets(order_id);
CREATE INDEX idx_tickets_event ON public.tickets(event_id);

GRANT SELECT ON public.tickets TO anon, authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
-- Public can look up a ticket by id (acts like a share token since id is a uuid)
CREATE POLICY "Anyone can view a ticket by id" ON public.tickets
  FOR SELECT USING (true);

-- TICKET SCANS
CREATE TABLE public.ticket_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  result TEXT NOT NULL CHECK (result IN ('valid','already_used','invalid')),
  scanned_by TEXT
);
GRANT SELECT ON public.ticket_scans TO authenticated;
GRANT ALL ON public.ticket_scans TO service_role;
ALTER TABLE public.ticket_scans ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tk_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.tk_set_updated_at();
CREATE TRIGGER trg_ticket_categories_updated BEFORE UPDATE ON public.ticket_categories
  FOR EACH ROW EXECUTE FUNCTION public.tk_set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tk_set_updated_at();

-- Keep sold_count in sync with issued tickets
CREATE OR REPLACE FUNCTION public.tk_sync_sold_count()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ticket_categories
      SET sold_count = sold_count + 1
      WHERE id = NEW.ticket_category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ticket_categories
      SET sold_count = GREATEST(sold_count - 1, 0)
      WHERE id = OLD.ticket_category_id;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_tickets_sync_sold AFTER INSERT OR DELETE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.tk_sync_sold_count();
