# PlanKori — Product Specification

> **Single Source of Truth** — every implementation task references this document.

---

## 1. PRODUCT

PlanKori is an **AI-Powered Smart Event Management and Vendor Recommendation Platform**.

### Core Workflow

1. **Hosts** (wedding, birthday, corporate, engagement, etc.) describe an event in **natural language** or via a **step-by-step form**.
2. An **AI agent** extracts structured requirements from the description (budget, headcount, date, city, event type, theme, category preferences).
3. The AI generates **mood-board images** that match the extracted theme and preferences.
4. A **Smart Vendor Matchmaker** recommends **3 tiered vendor packages** — Economy, Standard, Premium — covering six service categories: `venue`, `catering`, `decoration`, `av_tech`, `photography`, `entertainment`.
5. Hosts can **swap individual vendors** within any package.
6. Hosts **send booking requests** to all vendors in the selected package.
7. After **ALL vendors in the selected package accept**, the host pays a **deposit** through a payment gateway.
8. **Vendors** manage their own service listings (pricing, portfolio, availability).
9. **Admins** manage the platform: user/vendor oversight, revenue tracking, payouts, and AI monitoring.

---

## 2. SCOPE LIMITS

The following are **out of scope**:

- Legal contract handling (the AI never signs contracts)
- Event-day tracking / live coordination
- AR / VR features
- Supply-chain automation

**Payment rules:**

- The AI **never pays** and **never signs contracts**.
- Payments are initiated **only** when the host clicks a "Pay" button.
- We **never store or touch card data** — all card handling is delegated to the payment gateway.

---

## 3. ROLES

| Role     | Description                                                        | Assignment                        |
| -------- | ------------------------------------------------------------------ | --------------------------------- |
| `host`   | Plans events, receives vendor recommendations, books, pays deposit | Self-registration                 |
| `vendor` | Creates service listings, responds to booking requests             | Self-registration                 |
| `admin`  | Full platform management, revenue, payouts, AI monitoring          | Manually assigned in the database |

---

## 4. CONSTANTS

All constants are **configurable via environment variables** with the defaults shown.

### Currency & Rates

| Constant           | Env Var              | Default | Notes                           |
| ------------------ | -------------------- | ------- | ------------------------------- |
| Currency           | _(hardcoded)_        | `BDT`   | Store money as **integer taka** |
| USD → BDT rate     | `USD_TO_BDT_RATE`    | `120`   |                                 |

### Business Rules

| Constant              | Env Var                        | Default | Notes                                                |
| --------------------- | ------------------------------ | ------- | ---------------------------------------------------- |
| Budget cap %          | `BUDGET_CAP_PERCENT`           | `105`   | A package total must **never** exceed 105 % of budget |
| Deposit %             | `DEPOSIT_PERCENT`              | `20`    | Deposit = 20 % of package total                      |
| Platform commission % | `PLATFORM_COMMISSION_PERCENT`  | `8`     | PlanKori keeps 8 % of each payment                   |
| New vendor boost days | `NEW_VENDOR_DAYS`              | `60`    | Fairness boost for vendors < 60 days old             |

### Tier Budget Targets (% of host's stated budget)

| Tier     | Target |
| -------- | ------ |
| Economy  | ~70 %  |
| Standard | ~90 %  |
| Premium  | up to 100 % |

### Scoring Formula

```
final_score = 0.55 * semantic_similarity
            + 0.20 * budget_fit
            + 0.15 * normalized_rating
            + 0.10 * fairness_boost
```

| Component            | Weight | Notes                                              |
| -------------------- | ------ | -------------------------------------------------- |
| `semantic_similarity`| 0.55   | Cosine similarity between event embedding & vendor embedding |
| `budget_fit`         | 0.20   | How well the vendor's price fits the tier's budget slice     |
| `normalized_rating`  | 0.15   | Vendor average rating scaled to [0, 1]                       |
| `fairness_boost`     | 0.10   | 1.0 for vendors registered < `NEW_VENDOR_DAYS` ago, else 0   |

### Embedding

| Constant       | Value |
| -------------- | ----- |
| `EMBEDDING_DIM`| `768` |

### Default Budget Split by Event Type

Weights **always sum to 100** after removing skipped categories and renormalizing.

| Category        | Wedding | Birthday | Corporate | Other (= Wedding) |
| --------------- | ------- | -------- | --------- | ------------------ |
| `venue`         | 30      | 25       | 30        | 30                 |
| `catering`      | 30      | 30       | 28        | 30                 |
| `decoration`    | 15      | 20       | 7         | 15                 |
| `photography`   | 10      | 8        | 5         | 10                 |
| `entertainment` | 8       | 12       | 8         | 8                  |
| `av_tech`       | 7       | 5        | 22        | 7                  |

---

## 5. ENUMS

### Service Categories

```
venue | catering | decoration | av_tech | photography | entertainment
```

### Event Status

```
draft | planned | booking_requested | confirmed | cancelled
```

### Booking Request Status

```
pending | accepted | declined
```

### Payment Type

```
deposit | balance | featured_fee
```

### Payment Status

```
pending | paid | failed | cancelled | refunded
```

### Payout Status

```
owed | paid
```

### Price Unit

```
flat | per_person | per_hour
```

---

## 6. AI MODES

Controlled by env var `AI_MODE`:

### `AI_MODE=live` — Gemini API

| Capability        | Implementation                              |
| ----------------- | ------------------------------------------- |
| Chat extraction   | Gemini LLM (`GEMINI_CHAT_MODEL`)            |
| Embeddings        | Gemini Embedding API (`GEMINI_EMBEDDING_MODEL`) |
| Image generation  | Gemini Image API (`GEMINI_IMAGE_MODEL`)     |

### `AI_MODE=demo` — Fully Local Fallbacks

| Capability        | Implementation                                                                 |
| ----------------- | ------------------------------------------------------------------------------ |
| Chat extraction   | Rule-based: regex for budget, headcount, date, city, event type; remainder → theme text |
| Embeddings        | Deterministic 768-dim hashed bag-of-words embedding, L2-normalized             |
| Image generation  | Seeded placeholder images (gradient / pattern-based)                           |
| Match reasons     | Template-based text ("Selected because …")                                     |

### Embedding Consistency

The whole app **must work end-to-end in both modes**. Because live and demo embeddings are incompatible:

- Each vendor row stores `embedding_source` (`'live'` | `'demo'`).
- The **seed / re-embed script** rebuilds all embeddings when the mode changes.
- Queries and vendor embeddings **must always use the same mode**.

### Model Names

| Env Var                 | Purpose          |
| ----------------------- | ---------------- |
| `GEMINI_CHAT_MODEL`     | LLM chat model   |
| `GEMINI_EMBEDDING_MODEL`| Embedding model  |
| `GEMINI_IMAGE_MODEL`    | Image generation |

---

## 7. PAYMENTS

Controlled by env var `PAYMENT_PROVIDER`:

| Value          | Behaviour                                                             |
| -------------- | --------------------------------------------------------------------- |
| `mock`         | In-memory mock gateway — always succeeds after a 1 s delay            |
| `sslcommerz`   | SSLCommerz integration, sandbox by default                            |

A **provider-agnostic interface** lives in `src/lib/payments/`. The interface exposes:

- `initPayment(params)` → redirect URL
- `validateIPN(body)` → validated payment result
- `refund(transactionId, amount)` → refund result

SSLCommerz runs in **sandbox** unless `SSLCOMMERZ_IS_LIVE=true`.

---

## 8. ROUTE MAP

### Public Routes

| Path              | Description               |
| ----------------- | ------------------------- |
| `/`               | Landing page              |
| `/login`          | Log in                    |
| `/signup`         | Sign up (host or vendor)  |
| `/privacy`        | Privacy policy            |
| `/terms`          | Terms of service          |
| `/refund-policy`  | Refund policy             |

### Host Routes (`/dashboard`)

| Path                                      | Description                                        |
| ----------------------------------------- | -------------------------------------------------- |
| `/dashboard`                              | Host dashboard home                                |
| `/dashboard/plan`                         | Start planning (natural-language or form)           |
| `/dashboard/events/new`                   | Create new event                                   |
| `/dashboard/events/[id]`                  | Event detail — tabs: Overview, Mood Board, Packages, Chat |
| `/dashboard/events/[id]/browse`           | Browse / swap vendors                              |
| `/dashboard/events/[id]/summary`          | Booking summary before payment                     |
| `/dashboard/payments`                     | Payment history                                    |
| `/dashboard/settings`                     | Account settings                                   |

### Vendor Routes (`/vendor`)

| Path                        | Description            |
| --------------------------- | ---------------------- |
| `/vendor/dashboard`         | Vendor dashboard home  |
| `/vendor/listings`          | All listings           |
| `/vendor/listings/new`      | Create new listing     |
| `/vendor/listings/[id]`     | Edit listing           |
| `/vendor/bookings`          | Booking requests       |
| `/vendor/earnings`          | Earnings & payouts     |

### Admin Routes (`/admin`)

| Path                | Description                |
| ------------------- | -------------------------- |
| `/admin`            | Admin dashboard            |
| `/admin/vendors`    | Manage vendors             |
| `/admin/ai`         | AI monitoring & controls   |
| `/admin/revenue`    | Revenue & payout tracking  |
| `/admin/demo-tools` | Seed data, reset, re-embed |

---

## 9. DEMO ACCOUNTS

Created by the **seed script** (`scripts/seed.ts`). Password for all: `Demo@12345`

### Admin

| Email                  | Name           |
| ---------------------- | -------------- |
| `admin@plankori.test`  | Admin          |

### Hosts

| Email                   | Name              |
| ----------------------- | ----------------- |
| `host1@plankori.test`   | Rahim Chowdhury   |
| `host2@plankori.test`   | Nusrat Jahan      |
| `host3@plankori.test`   | Tanvir Ahmed      |

### Vendors

| Email                      | Assigned Automatically |
| -------------------------- | ---------------------- |
| `vendor01@plankori.test`   | Yes                    |
| `vendor02@plankori.test`   | Yes                    |
| `vendor03@plankori.test`   | Yes                    |
| `vendor04@plankori.test`   | Yes                    |
| `vendor05@plankori.test`   | Yes                    |
| `vendor06@plankori.test`   | Yes                    |
| `vendor07@plankori.test`   | Yes                    |
| `vendor08@plankori.test`   | Yes                    |
| `vendor09@plankori.test`   | Yes                    |
| `vendor10@plankori.test`   | Yes                    |
| `vendor11@plankori.test`   | Yes                    |
| `vendor12@plankori.test`   | Yes                    |

The 12 vendor accounts cover all 6 categories (2 vendors per category) with varied pricing tiers and ratings, providing enough data for the recommendation engine to produce meaningful Economy / Standard / Premium packages.
