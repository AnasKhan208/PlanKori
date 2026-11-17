-- ==============================================================================
-- PlanKori Database Migration 00003: Row Level Security (RLS)
-- Enables RLS on all tables and configures precise access policies
-- ==============================================================================

-- 1. Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- 2. PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles viewable by self or admin" ON public.profiles;
CREATE POLICY "Profiles viewable by self or admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles updatable by self or admin" ON public.profiles;
CREATE POLICY "Profiles updatable by self or admin"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles insertable by self or admin" ON public.profiles;
CREATE POLICY "Profiles insertable by self or admin"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- 3. VENDORS POLICIES
DROP POLICY IF EXISTS "Vendors readable by public if active, or owner/admin" ON public.vendors;
CREATE POLICY "Vendors readable by public if active, or owner/admin"
  ON public.vendors FOR SELECT
  USING (is_active = true OR auth.uid() = owner_id OR public.is_admin());

DROP POLICY IF EXISTS "Vendors insertable by owner or admin" ON public.vendors;
CREATE POLICY "Vendors insertable by owner or admin"
  ON public.vendors FOR INSERT
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

DROP POLICY IF EXISTS "Vendors updatable by owner or admin" ON public.vendors;
CREATE POLICY "Vendors updatable by owner or admin"
  ON public.vendors FOR UPDATE
  USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

DROP POLICY IF EXISTS "Vendors deletable by owner or admin" ON public.vendors;
CREATE POLICY "Vendors deletable by owner or admin"
  ON public.vendors FOR DELETE
  USING (auth.uid() = owner_id OR public.is_admin());

-- 4. EVENTS POLICIES
DROP POLICY IF EXISTS "Events readable by host or admin" ON public.events;
CREATE POLICY "Events readable by host or admin"
  ON public.events FOR SELECT
  USING (auth.uid() = host_id OR public.is_admin());

DROP POLICY IF EXISTS "Events insertable by host or admin" ON public.events;
CREATE POLICY "Events insertable by host or admin"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = host_id OR public.is_admin());

DROP POLICY IF EXISTS "Events updatable by host or admin" ON public.events;
CREATE POLICY "Events updatable by host or admin"
  ON public.events FOR UPDATE
  USING (auth.uid() = host_id OR public.is_admin())
  WITH CHECK (auth.uid() = host_id OR public.is_admin());

DROP POLICY IF EXISTS "Events deletable by host or admin" ON public.events;
CREATE POLICY "Events deletable by host or admin"
  ON public.events FOR DELETE
  USING (auth.uid() = host_id OR public.is_admin());

-- 5. PACKAGES POLICIES
DROP POLICY IF EXISTS "Packages readable by event host or admin" ON public.packages;
CREATE POLICY "Packages readable by event host or admin"
  ON public.packages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = packages.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Packages insertable by event host or admin" ON public.packages;
CREATE POLICY "Packages insertable by event host or admin"
  ON public.packages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = packages.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Packages updatable by event host or admin" ON public.packages;
CREATE POLICY "Packages updatable by event host or admin"
  ON public.packages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = packages.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = packages.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Packages deletable by event host or admin" ON public.packages;
CREATE POLICY "Packages deletable by event host or admin"
  ON public.packages FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = packages.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  );

-- 6. PACKAGE ITEMS POLICIES
DROP POLICY IF EXISTS "Package items readable by event host or admin" ON public.package_items;
CREATE POLICY "Package items readable by event host or admin"
  ON public.package_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.events e ON e.id = p.event_id
      WHERE p.id = package_items.package_id AND e.host_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Package items insertable by event host or admin" ON public.package_items;
CREATE POLICY "Package items insertable by event host or admin"
  ON public.package_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.events e ON e.id = p.event_id
      WHERE p.id = package_items.package_id AND e.host_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Package items updatable by event host or admin" ON public.package_items;
CREATE POLICY "Package items updatable by event host or admin"
  ON public.package_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.events e ON e.id = p.event_id
      WHERE p.id = package_items.package_id AND e.host_id = auth.uid()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.events e ON e.id = p.event_id
      WHERE p.id = package_items.package_id AND e.host_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Package items deletable by event host or admin" ON public.package_items;
CREATE POLICY "Package items deletable by event host or admin"
  ON public.package_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.packages p
      JOIN public.events e ON e.id = p.event_id
      WHERE p.id = package_items.package_id AND e.host_id = auth.uid()
    )
    OR public.is_admin()
  );

-- 7. MOOD BOARDS POLICIES
DROP POLICY IF EXISTS "Mood boards readable by event host or admin" ON public.mood_boards;
CREATE POLICY "Mood boards readable by event host or admin"
  ON public.mood_boards FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = mood_boards.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Mood boards insertable by event host or admin" ON public.mood_boards;
CREATE POLICY "Mood boards insertable by event host or admin"
  ON public.mood_boards FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = mood_boards.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Mood boards updatable by event host or admin" ON public.mood_boards;
CREATE POLICY "Mood boards updatable by event host or admin"
  ON public.mood_boards FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = mood_boards.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = mood_boards.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Mood boards deletable by event host or admin" ON public.mood_boards;
CREATE POLICY "Mood boards deletable by event host or admin"
  ON public.mood_boards FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = mood_boards.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  );

-- 8. CHAT MESSAGES POLICIES
DROP POLICY IF EXISTS "Chat messages readable by event host or admin" ON public.chat_messages;
CREATE POLICY "Chat messages readable by event host or admin"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = chat_messages.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Chat messages insertable by event host or admin" ON public.chat_messages;
CREATE POLICY "Chat messages insertable by event host or admin"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = chat_messages.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Chat messages updatable by event host or admin" ON public.chat_messages;
CREATE POLICY "Chat messages updatable by event host or admin"
  ON public.chat_messages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = chat_messages.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = chat_messages.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Chat messages deletable by event host or admin" ON public.chat_messages;
CREATE POLICY "Chat messages deletable by event host or admin"
  ON public.chat_messages FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = chat_messages.event_id AND e.host_id = auth.uid())
    OR public.is_admin()
  );

-- 9. BOOKING REQUESTS POLICIES
DROP POLICY IF EXISTS "Booking requests readable by host, vendor owner, or admin" ON public.booking_requests;
CREATE POLICY "Booking requests readable by host, vendor owner, or admin"
  ON public.booking_requests FOR SELECT
  USING (
    (EXISTS (SELECT 1 FROM public.events e WHERE e.id = booking_requests.event_id AND e.host_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = booking_requests.vendor_id AND v.owner_id = auth.uid()))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Booking requests insertable by event host or admin" ON public.booking_requests;
CREATE POLICY "Booking requests insertable by event host or admin"
  ON public.booking_requests FOR INSERT
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.events e WHERE e.id = booking_requests.event_id AND e.host_id = auth.uid()))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Booking requests updatable by vendor owner or admin" ON public.booking_requests;
CREATE POLICY "Booking requests updatable by vendor owner or admin"
  ON public.booking_requests FOR UPDATE
  USING (
    (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = booking_requests.vendor_id AND v.owner_id = auth.uid()))
    OR public.is_admin()
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = booking_requests.vendor_id AND v.owner_id = auth.uid()))
    OR public.is_admin()
  );

-- Enforce that vendors may only update status and responded_at
CREATE OR REPLACE FUNCTION public.protect_booking_request_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.id <> OLD.id
       OR NEW.event_id <> OLD.event_id
       OR NEW.package_id <> OLD.package_id
       OR NEW.vendor_id <> OLD.vendor_id
       OR NEW.package_item_id <> OLD.package_item_id
       OR NEW.created_at <> OLD.created_at THEN
      RAISE EXCEPTION 'Vendors may only update status and responded_at on booking requests.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_booking_request_update ON public.booking_requests;
CREATE TRIGGER tr_protect_booking_request_update
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.protect_booking_request_update();

-- 10. PAYMENTS POLICIES
-- Readable by host or admin; ONLY service role may insert/update/delete (no client write policies)
DROP POLICY IF EXISTS "Payments readable by host or admin" ON public.payments;
CREATE POLICY "Payments readable by host or admin"
  ON public.payments FOR SELECT
  USING (auth.uid() = host_id OR public.is_admin());

-- 11. VENDOR PAYOUTS POLICIES
-- Readable by vendor owner or admin; ONLY service role may insert/update/delete (no client write policies)
DROP POLICY IF EXISTS "Vendor payouts readable by vendor owner or admin" ON public.vendor_payouts;
CREATE POLICY "Vendor payouts readable by vendor owner or admin"
  ON public.vendor_payouts FOR SELECT
  USING (
    (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_payouts.vendor_id AND v.owner_id = auth.uid()))
    OR public.is_admin()
  );

-- 12. AI LOGS POLICIES
-- Readable ONLY by admin; ONLY service role may insert/update/delete (no client write policies)
DROP POLICY IF EXISTS "AI logs readable by admin" ON public.ai_logs;
CREATE POLICY "AI logs readable by admin"
  ON public.ai_logs FOR SELECT
  USING (public.is_admin());
