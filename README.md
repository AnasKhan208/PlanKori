# PlanKori — AI-Powered Smart Event Management Platform

PlanKori is an AI-powered smart event management and vendor recommendation platform tailored for Bangladesh. It leverages Gemini LLM and pgvector embeddings to match event requirements with vendor packages across Economy, Standard, and Premium tiers.

---

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env.local` and set your Supabase credentials:

```bash
cp .env.example .env.local
```

### 2. Run Database Migrations

You can run migrations using either the **Supabase Dashboard SQL Editor** or the **Supabase CLI**.

#### Option A: Supabase Dashboard SQL Editor (Recommended)
Navigate to your Supabase project's **SQL Editor** and execute the migration files located in `supabase/migrations/` in numerical order:

1. `supabase/migrations/00001_initial_schema.sql`
   - Enables `uuid-ossp` and `vector` extensions.
   - Creates enums and all 11 core tables (`profiles`, `vendors`, `events`, `packages`, `package_items`, `mood_boards`, `chat_messages`, `booking_requests`, `payments`, `vendor_payouts`, `ai_logs`).
   - Sets up indexes (including HNSW cosine index on `vendors.embedding`) and `updated_at` triggers.

2. `supabase/migrations/00002_functions_and_triggers.sql`
   - Helper function `is_admin()`.
   - Vector similarity search function `match_vendors(...)`.
   - `handle_new_user()` trigger on `auth.users` to automatically populate `profiles` on signup.
   - `protect_profile_role()` trigger to prevent non-admins from modifying user roles.

3. `supabase/migrations/00003_rls_policies.sql`
   - Enables Row Level Security (RLS) on all 11 tables.
   - Configures granular access control for hosts, vendors, and admins.
   - Restricts `payments`, `vendor_payouts`, and `ai_logs` writes exclusively to the service role.

4. `supabase/migrations/00004_storage_buckets.sql`
   - Creates public storage buckets `vendor-portfolios` and `mood-boards`.
   - Establishes storage RLS policies ensuring users can only upload and manage files inside their designated folder (`<user_id>/*`).

#### Option B: Supabase CLI
If using the local Supabase CLI:

```bash
supabase db reset
# Or link to hosted project and push
supabase link --project-ref <your-project-ref>
supabase db push
```

---

## Important Manual Step: Disable Email Confirmation for Local Dev / Demos

For local development and seamless demo testing:

1. Open your **Supabase Dashboard**.
2. Navigate to **Authentication** > **Providers** > **Email**.
3. Toggle **Confirm email** to **OFF** (Disabled).
4. Save the configuration.

> **Note:** Disabling email confirmation allows newly registered test hosts and vendors to log in immediately without waiting for confirmation emails.

---

## Promoting a User to Admin

To grant administrator privileges to a user, run the SQL script in `docs/make-admin.sql` via the Supabase SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin'::public.user_role
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@plankori.test'
);
```

---

## Development Quality Gates

Before committing any changes, ensure all quality gates pass:

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript check (tsc --noEmit)
npm run build       # Next.js production build
```
