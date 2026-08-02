# Klone — Visual Implementation Platform

> Turn plain task descriptions into **reviewable, visual implementations** — a coding agent (Claude, Cursor, any MCP client) fetches curated component designs through the **Klone MCP server**, composes them into a self-contained HTML document, and saves it under the user's account. The web app then previews, edits, and manages those implementations.

---

## Table of Contents

1. [What is Klone?](#what-is-klone)
2. [System Architecture](#system-architecture)
3. [The Core Flow (end to end)](#the-core-flow)
4. [Workspace Layout](#workspace-layout)
5. [MCP Server Deep Dive](#mcp-server-deep-dive)
   - [Request Lifecycle](#request-lifecycle)
   - [Authentication](#authentication)
   - [Tool Reference](#tool-reference)
   - [Component Library](#component-library)
6. [Data Model](#data-model)
7. [Security Model](#security-model)
8. [Running Locally](#running-locally)
9. [Testing with Postman](#testing-with-postman)
10. [Deploying](#deploying)

---

## What is Klone?

Klone is a **visual implementation platform**. Instead of a coding agent just describing what it built, Klone lets the agent produce a *real, rendered design* that a human can open, preview, and iterate on.

The one-sentence flow:

```
You (IDE / agent) ──ask──▶ Klone MCP ──gives──▶ component designs (HTML/CSS)
                                                    │
You (agent) ──compose + save──▶ Klone MCP ──writes──▶ Supabase (visual_implementations)
                                                    │
You (human) ──open──▶ Web app ──reads──▶ your saved implementations ──▶ preview / edit
```

**Three surfaces:**

| Surface | Who uses it | What it does |
|---|---|---|
| **Klone MCP** (`apps/mcp`) | Coding agents & IDEs | Exposes 9 tools: discover component designs, fetch kits, and CRUD saved visual implementations |
| **Klone Web** (`apps/web`) | End users | Template gallery, HTML preview/editor (Figma-style canvas), PDF export |
| **Klone Admin** (`apps/admin`) | Content managers | Manage `categories → sub_categories → components` (DB-driven, for the future dynamic library) |

---

## System Architecture

```mermaid
flowchart TB
    subgraph Clients["Clients"]
        IDE["Coding Agent / IDE\n(Claude, Cursor, VS Code)"]
        POSTMAN["Postman / curl"]
        WEB["Klone Web (Next.js)"]
        ADMIN["Klone Admin (Next.js)"]
    end

    subgraph MCP["Klone MCP Server — Cloudflare Worker (apps/mcp)"]
        direction TB
        AUTH["JWT Auth\n(extractToken → validateJWT via JWKS)"]
        H["MCP Handler\n(JSON-RPC 2.0)"]
        T["9 Tools\n(registerTools)"]
        LIB["Component Library\n(10 hardcoded designs)"]
        AUTH --> H --> T
        T --> LIB
    end

    subgraph DB["Supabase (drwchrxljcokigkecbow)"]
        VI[("visual_implementations\n(user-owned)")]
        CAT[("categories")]
        SC[("sub_categories")]
        COMP[("components")]
    end

    IDE -->|"HTTP /mcp  Bearer JWT"| AUTH
    POSTMAN -->|"HTTP /mcp  Bearer JWT"| AUTH
    MCP -->|"Supabase JS client\n(signed with user JWT)"| VI
    ADMIN -->|"server client (RLS)"| CAT
    ADMIN -->|"server client (RLS)"| SC
    ADMIN -->|"server client (RLS)"| COMP
    WEB -->|"server client (RLS)"| VI

    style MCP fill:#4f46e5,color:#fff
    style DB fill:#3ecf8e,color:#111
```

**Key architectural decisions:**

- **One MCP server, two data sources** — component *designs* are hardcoded in the worker (fast, no DB round-trip); *implementations* are persisted per-user in Supabase. The library can later be swapped for the `components` table without changing the tool surface.
- **JSON over SSE** — `createMcpHandler(server, { enableJsonResponse: true })` makes the worker reply with plain JSON-RPC responses, so it works equally well from MCP clients, curl, and Postman.
- **User-scoped writes** — every request is authenticated with a Supabase JWT; the server signs its Supabase client with that same token so RLS enforces "users manage own implementations".

---

## The Core Flow

```mermaid
sequenceDiagram
    autonumber
    participant Agent as Coding Agent (MCP client)
    participant MCP as Klone MCP Worker
    participant Lib as Component Library (in-memory)
    participant SB as Supabase

    Agent->>MCP: initialize (JSON-RPC handshake)
    MCP-->>Agent: serverInfo { klone-mcp 1.0.0 }

    Agent->>MCP: tools/list
    MCP-->>Agent: 9 tool schemas

    Agent->>MCP: get_component_kit(purpose: "landing page w/ hero, pricing, testimonials")
    MCP->>Lib: searchComponents(purpose, max=3)
    Lib-->>MCP: hero-center, pricing-tiers, testimonial-card (scored)
    MCP-->>Agent: kit text (designs + assembly instructions)

    Agent->>Agent: Compose ONE self-contained HTML doc

    Agent->>MCP: create_visual_implementation(title, html_code, source_component_ids, ...)
    MCP->>SB: INSERT INTO visual_implementations (user_id = JWT.sub) ... RETURNING
    SB-->>MCP: row (id: 0f14f398-…)
    MCP-->>Agent: { saved: true, implementation }

    Agent->>MCP: list_visual_implementations / get / update / delete
    MCP->>SB: SELECT/UPDATE/DELETE ... WHERE user_id = JWT.sub
    SB-->>MCP: scoped results
    MCP-->>Agent: JSON result
```

---

## Workspace Layout

```mermaid
flowchart LR
    ROOT["klone (Turborepo / pnpm workspace)"] --> APPS["apps/"]
    ROOT --> PKGS["packages/"]
    ROOT --> DOCS["docs/"]

    APPS --> MCPAPP["apps/mcp — Cloudflare Worker MCP server"]
    APPS --> WEB["apps/web — end-user preview app"]
    APPS --> ADMIN["apps/admin — content manager"]

    MCPAPP --> M1["src/index.ts — fetch handler + JWT gate"]
    MCPAPP --> M2["src/auth.ts — extractToken + validateJWT (jose + JWKS)"]
    MCPAPP --> M3["src/supabase.ts — createClient with user token"]
    MCPAPP --> M4["src/tools.ts — registerTools (9 tools)"]
    MCPAPP --> M5["src/component-library.ts — 10 designs + scoring"]
    MCPAPP --> M6["wrangler.jsonc — env bindings, port 8789"]

    ADMIN --> A1["supabase/migrations/0001_init.sql — categories → sub_categories → components"]
    ADMIN --> A2["supabase/migrations/0002_visual_implementations.sql — user-owned designs"]
    DOCS --> P1["docs/postman/klone-mcp.postman_collection.json — 12 ready requests"]

    PKGS --> UIP["packages/ui — shared shadcn-style components"]
    PKGS --> TSC["packages/typescript-config"]
    PKGS --> ESL["packages/eslint-config"]
```

---

## MCP Server Deep Dive

### Request Lifecycle

```mermaid
flowchart TD
    REQ["HTTP POST /mcp\n+ Authorization: Bearer &lt;JWT&gt;\n+ Content-Type: application/json\n+ Accept: application/json, text/event-stream"] --> EXTRACT{extractToken\nhas Bearer?}
    EXTRACT -- No --> E401["401 Missing Authorization header"]
    EXTRACT -- Yes --> VALID{validateJWT\ntoken signature + exp via JWKS}
    VALID -- Invalid/expired --> E401B["401 Invalid or expired token"]
    VALID -- Valid --> USER["user.sub = userId"]
    USER --> SERVER["new McpServer({ name: klone-mcp, version: 1.0.0 })"]
    SERVER --> REG["registerTools(server, env, userId, token)"]
    REG --> CLIENT["Supabase client signed with user token"]
    CLIENT --> HANDLER["createMcpHandler(server, { enableJsonResponse: true })"]
    HANDLER --> DISPATCH{"JSON-RPC method"}
    DISPATCH -->|initialize| INIT["protocol handshake"]
    DISPATCH -->|tools/list| LIST["tool schemas"]
    DISPATCH -->|tools/call| CALL["invoke tool → ok()/err()"]
    INIT --> RES["200 JSON response"]
    LIST --> RES
    CALL --> RES
```

### Authentication

Klone reuses **Supabase Auth** as the identity provider — no separate login system.

```mermaid
flowchart LR
    subgraph Client
        LOGIN["POST /auth/v1/token?grant_type=password\n(email + password)"]
        JWT["JWT access token (ES256,\nsigned by Supabase, exp ~1h)"]
        LOGIN --> JWT
    end

    subgraph Worker
        HDR["Authorization: Bearer &lt;JWT&gt;"]
        JWKS["GET /auth/v1/.well-known/jwks.json"]
        VERIFY["jose: jwtVerify(token, JWK)\n→ checks signature, kid, alg, exp"]
        SUB["payload.sub → userId"]
        HDR --> VERIFY --> SUB
        JWKS --> VERIFY
    end

    subgraph Supabase
        RLS["RLS: user_id = auth.uid()"]
        VI[("visual_implementations")]
        SUB -->|"client signed with Bearer JWT"| RLS --> VI
    end
```

> ⚠️ **Critical detail (fixed 2026-08-01):** the Supabase client must be created **with the user's JWT**, not just the anon key. `getSupabase(env, token)` sets `global.headers.Authorization`, so Supabase resolves `auth.uid()` correctly. Without it, every write fails with *"new row violates row-level security policy"* because the client looks anonymous.

### Tool Reference

All 9 tools, grouped by purpose:

| # | Tool | Args | Returns |
|---|---|---|---|
| 1 | `list_component_categories` | — | 10 categories with component counts |
| 2 | `list_components` | `category?`, `query?`, `limit?` | Component metadata (no code) |
| 3 | `get_component` | `component_id` | Full design: prompt + HTML code |
| 4 | `get_component_kit` ⭐ | `purpose`, `component_ids?`, `max_components?` | **Main entry** — matched designs + assembly instructions |
| 5 | `create_visual_implementation` | `title`, `html_code`, `description?`, `css_code?`, `source_component_ids?`, `prompt_used?`, `metadata?` | Saved row with id |
| 6 | `list_visual_implementations` | `limit?`, `offset?` | User's implementations, newest first |
| 7 | `get_visual_implementation` | `id` (uuid) | Single implementation |
| 8 | `update_visual_implementation` | `id` + any updatable field | Updated row |
| 9 | `delete_visual_implementation` | `id` | `{ deleted: true }` |

**The intended agent workflow:**

```
1. list_component_categories     → see what exists
2. get_component_kit(purpose)    → get relevant designs + instructions
3. (optional) get_component      → tweak an individual design
4. compose the HTML doc
5. create_visual_implementation  → persist under the user
6. list / get / update / delete  → manage saved designs
```

### Component Library

10 hardcoded designs in `src/component-library.ts`. Each entry is a **self-contained HTML snippet** (inline CSS, zero external dependencies) an agent can drop into a page and adapt.

| Category | Component id | Use for |
|---|---|---|
| Buttons | `btn-basic` | CTAs, submit, primary/secondary/outline/ghost |
| Cards | `card-basic` | Features, articles, gallery items |
| Badges | `badge-status` | Status pills, labels, version tags |
| Navigation | `navbar-simple` | Top navigation with links + CTA |
| Hero | `hero-center` | Opening section of a landing page |
| Forms | `form-contact` | Contact/lead capture forms |
| Pricing | `pricing-tiers` | 3-tier pricing with "Popular" plan |
| Testimonials | `testimonial-card` | Social proof quotes |
| Stats | `stats-band` | Metric counters band |
| Footer | `footer-simple` | Site footer with columns |

**Auto-matching (scored search)** — `searchComponents(purpose, max)`:

```mermaid
flowchart TD
    P["purpose text, e.g. 'landing page with hero and pricing'"] --> TOK["tokenize\nlowercase, strip punctuation,\ndrop stopwords (the, and, for…)"]
    TOK --> SCORE["score each component"]
    SCORE --> W1["name/category: weight 3"]
    SCORE --> W2["tags: weight 2"]
    SCORE --> W3["description: weight 1.5"]
    SCORE --> W4["prompt: weight 1"]
    W1 & W2 & W3 & W4 --> SORT["sort by score, take top max"]
    SORT --> CHECK{any matched?}
    CHECK -- Yes --> OUT["return scored components"]
    CHECK -- No --> FB["fallback: navbar-simple,\nhero-center, card-basic, form-contact"]
    FB --> OUT
```

---

## Data Model

```mermaid
erDiagram
    auth_users ||--o{ visual_implementations : "owns (cascade)"
    visual_implementations {
        uuid id PK "gen_random_uuid()"
        uuid user_id FK "auth.users.id"
        text title
        text description
        text html_code "required"
        text css_code
        text[] source_component_ids "library ids used"
        text prompt_used
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }

    categories ||--o{ sub_categories : "has"
    sub_categories ||--o{ components : "has"
    components ||--o| components : "chain_id (self-ref)"
    categories {
        uuid id PK
        text name
        text slug UK
    }
    sub_categories {
        uuid id PK
        uuid category_id FK
        text name
        text slug
    }
    components {
        uuid id PK
        text name
        text image_url
        uuid sub_category_id FK
        text component_code
        text demo_url
        text prompt
        uuid chain_id FK
    }
```

**Where data lives today:**

| Data | Location | Notes |
|---|---|---|
| Component designs | Hardcoded in `apps/mcp/src/component-library.ts` | Will move to `components` table later |
| Saved implementations | `public.visual_implementations` (Supabase) | ✅ migrated & applied |
| Admin content taxonomy | `categories → sub_categories → components` | Migration `0001_init.sql` exists |

---

## Security Model

- **Every MCP call requires a valid Supabase JWT** (`Authorization: Bearer …`). No token → 401.
- **Tokens are verified with JWKS** (public keys), so no secret validation happens in the worker.
- **RLS is the enforcement point** for the database:
  - `visual_implementations`: `using (user_id = auth.uid()) with check (user_id = auth.uid())` — users can only read/update/delete **their own** rows, even if they forge queries.
  - `categories` / `sub_categories` / `components`: any authenticated user (admin app) has full access.
- **The worker never stores the user's password or long-lived secrets** — only the anon key and JWKS URL are baked into env vars.

```mermaid
flowchart LR
    U["Attacker with someone else's JWT"] --> MCP["/mcp"]
    MCP --> V{"JWT valid?"}
    V -- No --> R401["401"]
    V -- Yes, sub = victim --> SB["Supabase query WHERE user_id = sub"]
    SB --> RLS{"RLS: user_id = auth.uid()?"}
    RLS -- "sub ≠ auth.uid()" --> DENY["0 rows / policy violation"]
    RLS -- equal --> OK["data"]
```

---

## Running Locally

**Prerequisites:** Node 20+, pnpm, [wrangler](https://developers.cloudflare.com/workers/wrangler/).

```bash
# 1. Install dependencies (repo root)
pnpm install

# 2. Start the MCP server (port 8789)
cd apps/mcp
pnpm dev          # wrangler dev --port 8789

# 3. (optional) Web app
cd apps/web
pnpm dev

# 4. (optional) Admin app
cd apps/admin
pnpm dev
```

Environment (`apps/mcp/wrangler.jsonc` + `.env.local`):

| Var | Value |
|---|---|
| `SUPABASE_URL` | `https://drwchrxljcokigkecbow.supabase.co` |
| `SUPABASE_ANON_KEY` | anon JWT |
| `SUPABASE_JWKS_URL` | `…/auth/v1/.well-known/jwks.json` |

Type-check the MCP app:

```bash
cd apps/mcp
pnpm tsc --noEmit
```

---

## Testing with Postman

A ready-made collection is at [`docs/postman/klone-mcp.postman_collection.json`](docs/postman/klone-mcp.postman_collection.json).

**Import:** Postman → Import → select the JSON file.

**How it works out of the box:**

- A **pre-request script** auto-refreshes the Supabase JWT when missing/expired (uses the test user `mcp-test@klone.dev`).
- Request **8 (create)** captures the returned id into `{{implementation_id}}`, so requests 10–12 auto-fill it.
- Base URL is `{{mcp_url}}` → `http://127.0.0.1:8789/mcp`.

**Manual equivalent (curl):**

```bash
# get token
curl -s -X POST "https://drwchrxljcokigkecbow.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"mcp-test@klone.dev","password":"McpTest123!"}'

# call a tool
curl -s -X POST http://127.0.0.1:8789/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_component_kit","arguments":{"purpose":"a landing page","max_components":2}}}'
```

> **Note:** on Windows PowerShell, `·`, `✓`, `★` may render as mojibake (`Â·`, `â`) in the console — that's a display artifact only; MCP clients receive correct UTF-8.

---

## Deploying

The MCP server deploys as a Cloudflare Worker:

```bash
cd apps/mcp
npx wrangler deploy          # or: pnpm run deploy
```

DB migrations are applied via the Supabase CLI or SQL editor (see `apps/admin/supabase/migrations/`):

```bash
cd apps/admin
supabase db push --db-url "$DATABASE_URL"
```

---

## Roadmap / Next Steps

- [x] MCP server with 9 tools (component discovery + implementation CRUD)
- [x] Hardcoded component library (10 designs)
- [x] `visual_implementations` table + RLS (migration applied)
- [x] JWT-gated auth with user-scoped Supabase client
- [ ] Move component designs from code → `components` table
- [ ] Web app: list/render saved implementations from `visual_implementations`
- [ ] Support MCP clients without custom header support (e.g. token via env/query param)
