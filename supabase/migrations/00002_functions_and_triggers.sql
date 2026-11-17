-- ==============================================================================
-- PlanKori Database Migration 00002: Functions & Triggers
-- - Helper: is_admin()
-- - Function: match_vendors(...)
-- - Trigger: handle_new_user() on auth.users
-- - Trigger: protect_profile_role() on public.profiles
-- ==============================================================================

-- 1. Helper Function: is_admin() (SECURITY DEFINER to prevent policy recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::public.user_role
  );
$$;

-- 2. Function: match_vendors(...)
CREATE OR REPLACE FUNCTION public.match_vendors(
  query_embedding vector(768),
  p_category text,
  p_city text,
  p_headcount integer DEFAULT NULL,
  match_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  business_name text,
  category public.service_category,
  description text,
  location_city text,
  base_price integer,
  price_unit public.price_unit,
  min_capacity integer,
  max_capacity integer,
  tags text[],
  themes text[],
  dietary_options text[],
  portfolio_image_urls text[],
  rating numeric(2,1),
  review_count integer,
  is_new boolean,
  is_active boolean,
  is_featured boolean,
  featured_until timestamptz,
  embedding vector(768),
  embedding_source text,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.owner_id,
    v.business_name,
    v.category,
    v.description,
    v.location_city,
    v.base_price,
    v.price_unit,
    v.min_capacity,
    v.max_capacity,
    v.tags,
    v.themes,
    v.dietary_options,
    v.portfolio_image_urls,
    v.rating,
    v.review_count,
    v.is_new,
    v.is_active,
    v.is_featured,
    v.featured_until,
    v.embedding,
    v.embedding_source,
    v.created_at,
    v.updated_at,
    (1 - (v.embedding <=> query_embedding))::float AS similarity
  FROM public.vendors v
  WHERE v.is_active = true
    AND (p_category IS NULL OR v.category::text = p_category)
    AND (p_city IS NULL OR lower(v.location_city) = lower(p_city))
    AND (
      p_headcount IS NULL OR (
        CASE
          WHEN v.category = 'venue'::public.service_category THEN
            (COALESCE(v.min_capacity, 0) <= p_headcount AND (v.max_capacity IS NULL OR v.max_capacity >= p_headcount))
          ELSE
            ((v.min_capacity IS NULL OR v.min_capacity <= p_headcount) AND (v.max_capacity IS NULL OR v.max_capacity >= p_headcount))
        END
      )
    )
  ORDER BY v.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- 3. Trigger Function: handle_new_user() on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_raw_role text;
BEGIN
  v_raw_role := lower(COALESCE(new.raw_user_meta_data->>'role', 'host'));
  -- Enforce host or vendor only; never admin from signup metadata
  IF v_raw_role = 'vendor' THEN
    v_role := 'vendor'::public.user_role;
  ELSE
    v_role := 'host'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    v_role,
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, profiles.phone);

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Trigger Function: protect_profile_role() to prevent users from altering their role
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only administrators can change a user role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();
