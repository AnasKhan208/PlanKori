# PlanKori — Agent Rules

> These rules govern all AI-assisted development on this codebase.

## First Step — Always

Read `docs/SPEC.md` before writing any code. It is the single source of truth.

## Code Standards

- **Strict TypeScript** — `strict: true` in `tsconfig.json`. No `any` unless explicitly justified with a comment.
- **Zod validation** on every API route — validate request body, query params, and route params before processing.
- **Server-side only** for AI and payment calls — never import `@google/genai`, Supabase service-role client, or payment SDKs in client components.
- **Never expose secrets** — `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `SSLCOMMERZ_STORE_PASSWORD` must never appear in client bundles. Use `src/lib/config.ts` for server-only env access.

## Quality Gates

Every task must end with **all three passing**:

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # next build
```

## Git Discipline

- Commit after each completed task with a clear, descriptive message.
- Keep commits atomic — one logical change per commit.

## Scope Control

- **Never add features from outside `docs/SPEC.md`.**
- If a feature seems needed but isn't in the spec, propose it as a spec amendment first.

## Architecture Rules

- Use the App Router (`src/app/`) — no Pages Router.
- API routes live in `src/app/api/`.
- Shared logic lives in `src/lib/` — organized by domain (`ai/`, `recommender/`, `payments/`, `supabase/`, `validators/`, `utils/`).
- Types live in `src/types/`.
- UI components live in `src/components/`.
- Database migrations live in `supabase/migrations/`.
- Seed scripts live in `scripts/`.
- Test data lives in `data/`.

## AI Mode Awareness

- Always check `AI_MODE` from `src/lib/config.ts` before calling AI functions.
- Live mode → Gemini API; Demo mode → local fallbacks.
- Never mix embedding sources — vendor embeddings and query embeddings must use the same mode.

## Payment Safety

- Payment flows go through the provider-agnostic interface in `src/lib/payments/`.
- Never bypass the payment interface to call SSLCommerz directly.
- Always validate IPN callbacks server-side before updating payment status.
