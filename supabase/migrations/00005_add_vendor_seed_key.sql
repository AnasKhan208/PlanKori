-- ==============================================================================
-- PlanKori Database Migration 00005: Add seed_key to vendors
-- Adds a unique seed_key column to vendors for idempotent seeding and upsert
-- ==============================================================================

ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS seed_key text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_vendors_seed_key ON public.vendors(seed_key);
