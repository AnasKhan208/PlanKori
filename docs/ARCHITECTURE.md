# PlanKori Architecture

> Reference architecture for the AI-Powered Smart Event Management and Vendor Recommendation Platform.
> See [docs/SPEC.md](../docs/SPEC.md) for the full product specification.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Browser["Browser (Client)"]
        UI["Next.js React UI<br/>App Router + RSC"]
    end

    subgraph NextServer["Next.js Server"]
        API["API Routes<br/>(Gateway Layer)"]
        MW["Middleware<br/>Auth · Rate Limit"]
        ZOD["Zod Validation"]
    end

    subgraph AIEngine["AI Engine Modules"]
        EA["Event Architect<br/>(src/lib/ai/extractor)"]
        SVM["Smart Vendor Matchmaker<br/>(src/lib/recommender)"]
        TV["Theme Visualizer<br/>(src/lib/ai/image)"]
    end

    subgraph External["External Services"]
        GLLM["Gemini LLM"]
        GEMB["Gemini Embeddings"]
        GIMG["Gemini Image Gen"]
        SSLC["SSLCommerz"]
    end

    subgraph Supabase["Supabase"]
        PG["Postgres + pgvector"]
        AUTH["Auth"]
        STORE["Storage (images)"]
    end

    UI -->|"HTTPS"| MW
    MW -->|"Session refresh"| AUTH
    MW --> API
    API --> ZOD
    ZOD --> EA
    ZOD --> SVM
    ZOD --> TV
    ZOD -->|"Payment init"| SSLC

    EA -->|"live mode"| GLLM
    EA -->|"demo mode<br/>regex fallback"| PG
    SVM -->|"embedding query"| GEMB
    SVM -->|"pgvector<br/>similarity search"| PG
    TV -->|"live mode"| GIMG
    TV -->|"demo mode<br/>placeholder"| STORE

    API --> PG
    API --> AUTH
    API --> STORE
```

---

## Main Flow — Sequence Diagram

```mermaid
sequenceDiagram
    actor H as Host
    participant UI as Next.js UI
    participant API as API Routes
    participant EA as Event Architect
    participant LLM as Gemini LLM
    participant DB as Postgres + pgvector
    participant TV as Theme Visualizer
    participant IMG as Gemini Image
    participant SVM as Vendor Matchmaker
    participant EMB as Gemini Embeddings
    participant V as Vendor(s)
    participant PAY as Payment Gateway

    H->>UI: Describe event (NL or form)
    UI->>API: POST /api/events/extract
    API->>EA: extractRequirements(prompt)
    EA->>LLM: generateContent(prompt)
    LLM-->>EA: structured JSON
    EA-->>API: EventRequirements

    alt Missing info
        API-->>UI: follow-up questions
        H->>UI: answers
        UI->>API: POST /api/events/extract (refined)
        API->>EA: re-extract
    end

    API->>DB: INSERT event (draft)
    API-->>UI: event created

    H->>UI: Request mood board
    UI->>API: POST /api/events/[id]/moodboard
    API->>TV: generateMoodBoard(theme)
    TV->>IMG: generate images
    IMG-->>TV: image URLs
    TV-->>API: MoodBoard
    API-->>UI: mood board images

    H->>UI: Request vendor packages
    UI->>API: POST /api/events/[id]/recommend
    API->>SVM: recommend(requirements)
    SVM->>EMB: embedContent(event description)
    EMB-->>SVM: event embedding (768-dim)
    SVM->>DB: pgvector similarity search
    DB-->>SVM: candidate vendors
    SVM->>SVM: budget optimization + scoring
    Note over SVM: final_score = 0.55·sim + 0.20·budget + 0.15·rating + 0.10·fairness
    SVM->>SVM: build 3 tiers (Economy ~70%, Standard ~90%, Premium ≤100%)
    SVM-->>API: 3 PackageTiers
    API-->>UI: packages displayed

    H->>UI: Swap vendor in package
    UI->>API: PUT /api/events/[id]/packages
    API-->>UI: updated package

    H->>UI: Send booking requests
    UI->>API: POST /api/events/[id]/book
    API->>DB: create booking_requests (pending)
    API->>V: notify vendors

    loop Each vendor responds
        V->>API: POST /api/bookings/[id]/respond
        API->>DB: update booking_request status
    end

    Note over API: ALL vendors accepted?

    API-->>UI: All accepted — enable payment

    H->>UI: Click "Pay Deposit"
    UI->>API: POST /api/payments/init
    API->>PAY: initPayment(deposit amount)
    PAY-->>H: redirect to gateway
    H->>PAY: complete payment
    PAY->>API: IPN callback
    API->>DB: record payment + payout ledger
    API-->>UI: payment confirmed
```

---

## Entity-Relationship Diagram

> **Placeholder** — will be completed after the database schema migration is created.

```mermaid
erDiagram
    USERS ||--o{ EVENTS : creates
    USERS ||--o{ VENDOR_LISTINGS : owns
    EVENTS ||--o{ MOOD_BOARDS : has
    EVENTS ||--o{ EVENT_PACKAGES : has
    EVENT_PACKAGES ||--|{ PACKAGE_ITEMS : contains
    PACKAGE_ITEMS }o--|| VENDOR_LISTINGS : references
    EVENTS ||--o{ BOOKING_REQUESTS : generates
    BOOKING_REQUESTS }o--|| VENDOR_LISTINGS : targets
    EVENTS ||--o{ PAYMENTS : receives
    PAYMENTS ||--o{ PAYOUTS : splits_into
    USERS {
        uuid id PK
        string email
        string full_name
        enum role
        timestamp created_at
    }
    EVENTS {
        uuid id PK
        uuid host_id FK
        enum event_type
        enum status
        int budget
        jsonb requirements
        vector embedding
    }
    VENDOR_LISTINGS {
        uuid id PK
        uuid vendor_id FK
        enum category
        int base_price
        enum price_unit
        float rating
        vector embedding
        string embedding_source
    }
```

---

## Layer Responsibilities

| Layer                   | Responsibility                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| **UI (React RSC + Client)** | Rendering, form inputs, real-time chat, responsive layout. No direct DB or AI access.       |
| **Middleware**          | Session refresh, route protection, rate limiting. Runs on every matched request.                 |
| **API Routes**          | Gateway: Zod validation, auth checks, orchestration. Calls AI engine and DB.                     |
| **AI Engine**           | Event Architect (extraction), Theme Visualizer (images), Vendor Matchmaker (recommendations).    |
| **Supabase**            | Postgres (data + pgvector), Auth (JWT sessions), Storage (images).                               |
| **External Services**   | Gemini API (LLM, embeddings, images), SSLCommerz (payments).                                     |

---

## AI Technique → Implementation File Map

| Technique                     | File(s)                                       | Status      |
| ----------------------------- | --------------------------------------------- | ----------- |
| LLM chat extraction           | `src/lib/ai/extractor.ts`                     | Planned     |
| LLM demo fallback (regex)     | `src/lib/ai/demo-extractor.ts`                | Planned     |
| Semantic embeddings (live)     | `src/lib/ai/embeddings.ts`                    | Planned     |
| Semantic embeddings (demo)    | `src/lib/ai/demo-embeddings.ts`               | Planned     |
| Text-to-image (live)          | `src/lib/ai/image.ts`                         | Planned     |
| Text-to-image (demo)          | `src/lib/ai/demo-image.ts`                    | Planned     |
| pgvector similarity search    | `src/lib/recommender/search.ts`               | Planned     |
| Scoring & ranking             | `src/lib/recommender/scoring.ts`              | Planned     |
| Budget optimization / tiers   | `src/lib/recommender/tiers.ts`                | Planned     |
| AI mode router                | `src/lib/ai/index.ts`                         | Planned     |

---

## Design Decisions

### Why Next.js full-stack?

- **Single deployment** on Vercel: UI, API routes, middleware, ISR — one repo, one deploy.
- **React Server Components** reduce client JS bundle; server-only AI/payment code never reaches the browser.
- **App Router** provides nested layouts, loading states, and streaming for the complex dashboard UX.

### Why pgvector?

- Supabase Postgres natively supports `pgvector` — no separate vector DB needed.
- Vendor embeddings (768-dim) are stored alongside relational data, enabling **hybrid queries** (vector similarity + budget range + category filter) in a single SQL statement.
- Scales to thousands of vendors without additional infrastructure.

### How the 5 % Budget Cap Is Enforced

1. `BUDGET_CAP_PERCENT` defaults to 105.
2. During package assembly (`src/lib/recommender/tiers.ts`), the total price of all vendors in a tier is compared against `budget × (BUDGET_CAP_PERCENT / 100)`.
3. If the total exceeds the cap, the most expensive vendor in the least-critical category is replaced with a cheaper alternative.
4. The cap is re-checked after every vendor swap.
5. The API route **rejects** any package submission that violates the cap.

### How Fairness Is Implemented

- Vendors registered within `NEW_VENDOR_DAYS` (default 60) receive a `fairness_boost` of 1.0 in the scoring formula.
- This gives new vendors a 10 % score advantage (`0.10 × 1.0`) to help them compete against established vendors with more reviews.
- After the boost period expires, the fairness component drops to 0, and the vendor competes on merit alone.
- The admin dashboard (`/admin/ai`) shows fairness metrics and can adjust `NEW_VENDOR_DAYS`.

---

## Security & Privacy Notes

1. **Server-only secrets**: Gemini API key, Supabase service role key, SSLCommerz credentials are **never** exposed to the client. They are read only in API routes and server utilities via `src/lib/config.ts`.
2. **Row-Level Security (RLS)**: Supabase RLS policies ensure hosts see only their own events, vendors see only their own listings and bookings, and admins have full access.
3. **No card data**: PlanKori never receives, stores, or processes card numbers. The host is redirected to the payment gateway's hosted page.
4. **Input validation**: Every API route validates request bodies with Zod schemas before processing.
5. **Auth middleware**: The Next.js middleware refreshes Supabase auth tokens and redirects unauthenticated users away from protected routes.
6. **Rate limiting**: API routes that call the Gemini API are rate-limited to prevent abuse and cost overruns.
7. **Embedding isolation**: Live and demo embeddings are never mixed. The `embedding_source` column ensures queries match the correct embedding space.
8. **CSRF protection**: Supabase Auth uses `httpOnly` cookies with `SameSite=Lax`, and payment IPNs are validated server-side.
