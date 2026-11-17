-- ==============================================================================
-- PlanKori Vendor Verification Queries
-- Run these queries in the Supabase SQL Editor to verify seed data integrity
-- ==============================================================================

-- 1. Total vendors count (Must be 84)
SELECT count(*) AS total_vendors FROM public.vendors;

-- 2. Distribution by City (Dhaka: 36, Chittagong: 24, Sylhet: 24)
SELECT location_city, count(*) AS count
FROM public.vendors
GROUP BY location_city
ORDER BY count DESC;

-- 3. Category count per city (Dhaka: 6 each, Chittagong: 4 each, Sylhet: 4 each)
SELECT location_city, category, count(*) AS count
FROM public.vendors
GROUP BY location_city, category
ORDER BY location_city, category;

-- 4. New vendors count (~25% to 30%, i.e. 21-25 vendors)
SELECT is_new, count(*) AS count
FROM public.vendors
GROUP BY is_new;

-- 5. Guaranteed Scenario 1: Test match_vendors for Sylhet with 150 headcount
-- Using a Sylhet rustic vendor's embedding as the query vector
SELECT
  business_name,
  category,
  base_price,
  price_unit,
  min_capacity,
  max_capacity,
  is_new,
  round(similarity::numeric, 4) AS similarity
FROM public.match_vendors(
  (SELECT embedding FROM public.vendors WHERE seed_key = 'sylhet-venue-1'),
  NULL,
  'Sylhet',
  150,
  8
);
