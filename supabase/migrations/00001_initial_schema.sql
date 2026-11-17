-- ==============================================================================
-- PlanKori Database Migration 00001: Initial Schema
-- Tables: profiles, vendors, events, packages, package_items, mood_boards,
--         chat_messages, booking_requests, payments, vendor_payouts, ai_logs
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Create Enums
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('host', 'vendor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.service_category AS ENUM (
    'venue',
    'catering',
    'decoration',
    'av_tech',
    'photography',
    'entertainment'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.price_unit AS ENUM ('flat', 'per_person', 'per_hour');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.package_tier AS ENUM ('economy', 'standard', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM (
    'draft',
    'planned',
    'booking_requested',
    'confirmed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_request_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_type AS ENUM ('deposit', 'balance', 'featured_fee');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payout_status AS ENUM ('owed', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.chat_role AS ENUM ('user', 'assistant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Trigger function to maintain updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Tables

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role public.user_role NOT NULL DEFAULT 'host',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- VENDORS
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  category public.service_category NOT NULL,
  description text,
  location_city text NOT NULL,
  base_price integer NOT NULL,
  price_unit public.price_unit NOT NULL DEFAULT 'flat',
  min_capacity integer,
  max_capacity integer, -- null = no limit
  tags text[] NOT NULL DEFAULT '{}',
  themes text[] NOT NULL DEFAULT '{}',
  dietary_options text[] NOT NULL DEFAULT '{}',
  portfolio_image_urls text[] NOT NULL DEFAULT '{}',
  rating numeric(2,1),
  review_count integer NOT NULL DEFAULT 0,
  is_new boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  featured_until timestamptz,
  embedding vector(768),
  embedding_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_type text NOT NULL,
  event_date date,
  location_city text NOT NULL,
  budget integer NOT NULL,
  headcount integer NOT NULL,
  theme_description text,
  dietary_needs text[] NOT NULL DEFAULT '{}',
  must_have_categories text[] NOT NULL DEFAULT '{}',
  status public.event_status NOT NULL DEFAULT 'draft',
  extracted_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PACKAGES
CREATE TABLE IF NOT EXISTS public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tier public.package_tier NOT NULL,
  total_cost integer NOT NULL,
  budget_used_percent numeric(5,2) NOT NULL,
  is_selected boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PACKAGE ITEMS
CREATE TABLE IF NOT EXISTS public.package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  category public.service_category NOT NULL,
  estimated_cost integer NOT NULL,
  match_score numeric(4,3),
  match_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- MOOD BOARDS
CREATE TABLE IF NOT EXISTS public.mood_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  image_url text NOT NULL,
  is_placeholder boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  role public.chat_role NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- BOOKING REQUESTS
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  package_item_id uuid NOT NULL REFERENCES public.package_items(id) ON DELETE CASCADE,
  status public.booking_request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'BDT',
  type public.payment_type NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  provider text NOT NULL,
  provider_tran_id text UNIQUE,
  provider_val_id text,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

-- VENDOR PAYOUTS
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  gross_amount integer NOT NULL,
  commission_amount integer NOT NULL,
  net_amount integer NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'owed',
  paid_at timestamptz,
  reference_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI LOGS
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  feature text NOT NULL,
  mode text NOT NULL,
  latency_ms integer NOT NULL,
  success boolean NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create Sensible Indexes

-- Foreign keys
CREATE INDEX IF NOT EXISTS idx_vendors_owner_id ON public.vendors(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_host_id ON public.events(host_id);
CREATE INDEX IF NOT EXISTS idx_packages_event_id ON public.packages(event_id);
CREATE INDEX IF NOT EXISTS idx_package_items_package_id ON public.package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_package_items_vendor_id ON public.package_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_mood_boards_event_id ON public.mood_boards(event_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_event_id ON public.chat_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_event_id ON public.booking_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_package_id ON public.booking_requests(package_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_vendor_id ON public.booking_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_package_item_id ON public.booking_requests(package_item_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_package_id ON public.payments(package_id);
CREATE INDEX IF NOT EXISTS idx_payments_host_id ON public.payments(host_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON public.vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_payment_id ON public.vendor_payouts(payment_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON public.ai_logs(user_id);

-- Filter & Search Indexes
CREATE INDEX IF NOT EXISTS idx_vendors_category_city_active ON public.vendors (category, location_city, is_active);
CREATE INDEX IF NOT EXISTS idx_payments_provider_tran_id ON public.payments (provider_tran_id);

-- HNSW Cosine Index for pgvector
CREATE INDEX IF NOT EXISTS idx_vendors_embedding_cosine ON public.vendors USING hnsw (embedding vector_cosine_ops);

-- 6. Updated_at Triggers
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_vendors_updated_at ON public.vendors;
CREATE TRIGGER tr_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_events_updated_at ON public.events;
CREATE TRIGGER tr_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_packages_updated_at ON public.packages;
CREATE TRIGGER tr_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
