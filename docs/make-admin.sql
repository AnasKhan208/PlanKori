-- ==============================================================================
-- PlanKori Admin Promotion Helper
-- Use this snippet in the Supabase SQL editor to promote a user to 'admin'.
-- ==============================================================================

-- Promote by email (admin@plankori.test)
UPDATE public.profiles
SET role = 'admin'::public.user_role
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@plankori.test'
);

-- Verify the updated role
SELECT p.id, u.email, p.full_name, p.role, p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin';
