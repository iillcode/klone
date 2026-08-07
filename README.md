# Klone — PDF Document Generation Platform

> Turn plain task descriptions into **print-ready documents** — a coding agent (Claude, Cursor, any MCP client) fetches a PDF template blueprint through the **Klone MCP server**, authors a self-contained HTML document against it, and saves it under the user's account. The web app then previews, edits, and exports those documents as PDFs.

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
   - [PDF Template Library](#pdf-template-library)
6. [Data Model](#data-model)
7. [Security Model](#security-model)
8. [Running Locally](#running-locally)
9. [Testing with Postman](#testing-with-postman)
10. [Deploying](#deploying)

---

## What is Klone?

Klone is a **PDF document generation platform**. Instead of a coding agent just describing what it built, Klone lets the agent produce a *real, editable document* that a human can open, refine, and export as a PDF.

The one-sentence flow:

```
You (IDE / agent) ──ask──▶ Klone MCP ──gives──▶ PDF template blueprint (outline + guidance)
                                                    │
You (agent) ──author + save──▶ Klone MCP ──writes──▶ Supabase (visual_implementations)
                                                    │
You (human) ──open──▶ Web app ──reads──▶ your saved documents ──▶ preview / edit / export PDF
```

**Three surfaces:**

| Surface | Who uses it | What it does |
|---|---|---|
| **Klone MCP** (`apps/mcp`) | Coding agents & IDEs | Exposes 7 tools: fetch PDF template blueprints, and CRUD the user's saved HTML documents |
| **Klone Web** (`apps/web`) | End users | Template gallery, HTML preview/editor (Figma-style canvas), PDF export |
| **Klone Admin** (`apps/admin`) | Content managers | Manage `pdf_templates` (blueprint outlines) + the legacy `categories → sub_categories → components` taxonomy |

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
        T["7 Tools\n(registerTools)"]
        TPL["Template tools\n(templates.ts)"]
        DOC["Document tools\n(documents.ts)"]
        AUTH --> H --> T
        T --> TPL
        T --> DOC
    end

    subgraph DB["Supabase (jdzhnwmfbfdocqncwfay)"]
        VI[("visual_implementations\n(user-owned documents)")]
        PT[("pdf_templates\n(blueprint outlines)")]
        CAT[("categories")]
        SC[("sub_categories")]
        COMP[("components")]
    end

    IDE -->|"HTTP /mcp  Bearer JWT"| AUTH
    POSTMAN -->|"HTTP /mcp  Bearer JWT"| AUTH
    MCP -->|"Supabase JS client\n(signed with user JWT)"| VI
    MCP -->|"Supabase JS client"| PT
    ADMIN -->|"server client (RLS)"| CAT
    ADMIN -->|"server client (RLS)"| SC
    ADMIN -->|"server client (RLS)"| COMP
    ADMIN -->|"server client (RLS)"| PT
    WEB -->|"server client (RLS)"| VI

    style MCP fill:#4f46e5,color:#fff
    style DB fill:#3ecf8e,color:#111
```

**Key architectural decisions:**

- **Templates in the DB, documents per user** — PDF template blueprints live in `public.pdf_templates` (manageable from the admin app); the documents agents save go to `public.visual_implementations` (per-user, RLS-scoped). PDF rendering stays in the web app (`/api/pdf`) — the worker only stores HTML.
- **Blueprint, not finished HTML** — templates are outlines (page constraints + sections + guidance) that agents follow to author a self-contained HTML document.
- **JSON over SSE** — `createMcpHandler(server, { enableJsonResponse: true })` makes the worker reply with plain JSON-RPC responses, so it works equally well from MCP clients, curl, and Postman.
- **Structured JSON responses** — every tool returns a consistent `{ ok, data }` / `{ ok, error }` envelope so agents can parse results uniformly.
- **User-scoped writes** — every request is authenticated with a Supabase JWT; the server signs its Supabase client with that same token so RLS enforces "users manage own documents".

---

## The Core Flow

```mermaid
sequenceDiagram
    autonumber
    participant Agent as Coding Agent (MCP client)
    participant MCP as Klone MCP Worker
    participant TPL as PDF Templates (Supabase)
    participant SB as Supabase

    Agent->>MCP: initialize (JSON-RPC handshake)
    MCP-->>Agent: serverInfo { klone-mcp 1.0.0 }

    Agent->>MCP: tools/list
    MCP-->>Agent: 7 tool schemas

    Agent->>MCP: list_pdf_templates()
    MCP->>TPL: SELECT active templates
    TPL-->>MCP: metadata (slug, name, category, tags)
    MCP-->>Agent: { ok, data: { count, templates } }

    Agent->>MCP: get_pdf_template(slug: "business-report")
    MCP->>TPL: SELECT blueprint outline
    TPL-->>MCP: { page, sections[], requirements[] }
    MCP-->>Agent: { ok, data: { template } }

    Agent->>Agent: Author ONE self-contained HTML doc from the blueprint

    Agent->>MCP: create_document(title, html_code, template_slug, ...)
    MCP->>SB: INSERT INTO visual_implementations (user_id = JWT.sub) ... RETURNING
    SB-->>MCP: row (id: 0f14f398-…)
    MCP-->>Agent: { ok, data: { saved: true, document } }

    Agent->>MCP: list_documents / get / update / delete
    MCP->>SB: SELECT/UPDATE/DELETE ... WHERE user_id = JWT.sub
    SB-->>MCP: scoped results
    MCP-->>Agent: { ok, data }
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
    MCPAPP --> M4["src/tools.ts — registerTools (7 tools)"]
    MCPAPP --> M5["src/templates.ts — list/get_pdf_template tools"]
    MCPAPP --> M6["src/documents.ts — document CRUD tools"]
    MCPAPP --> M7["src/types.ts + src/respond.ts — blueprint types + JSON envelope"]
    MCPAPP --> M8["wrangler.jsonc — env bindings, port 8789"]

    ADMIN --> A1["supabase/migrations/0001_init.sql — categories → sub_categories → components"]
    ADMIN --> A2["supabase/migrations/0002_visual_implementations.sql — user-owned documents"]
    ADMIN --> A3["supabase/migrations/0003_pdf_templates.sql — template blueprints"]
    DOCS --> P1["docs/postman/klone-mcp.postman_collection.json — 10 ready requests"]

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

All 7 tools, grouped by purpose. Every tool returns the same structured-JSON envelope — `{ "ok": true, "data": … }` on success, `{ "ok": false, "error": … }` (with `isError`) on failure:

| # | Tool | Args | Returns |
|---|---|---|---|
| 1 | `list_pdf_templates` | `category?`, `query?`, `limit?` | Active template metadata (no blueprint) |
| 2 | `get_pdf_template` ⭐ | `template_id?` or `slug?` | **Main entry** — full blueprint outline (page, sections, requirements) |
| 3 | `create_document` | `title`, `html_code`, `description?`, `template_id?`, `template_slug?`, `prompt_used?`, `metadata?` | Saved document with id |
| 4 | `list_documents` | `limit?`, `offset?` | User's documents, most recently updated first |
| 5 | `get_document` | `id` (uuid) | Single document |
| 6 | `update_document` | `id` + any updatable field | Updated document |
| 7 | `delete_document` | `id` | `{ deleted: true }` |

**The intended agent workflow:**

```
1. list_pdf_templates            → see available blueprint outlines
2. get_pdf_template(slug)        → get page constraints + sections + guidance
3. author the HTML doc from the blueprint
4. create_document(title, html_code, template_slug) → persist under the user
5. list / get / update / delete  → manage saved documents
```

### PDF Template Library

Templates live in `public.pdf_templates` and are managed from the admin app. Each template is a **blueprint outline** — not finished HTML — that guides the agent: page constraints, an ordered list of sections (name, description, guidance per section), and global requirements for the final document.

```json
{
  "version": 1,
  "page": { "format": "A4", "content_width": "794px", "margin": "2.5rem", "body_background": "#ffffff" },
  "sections": [
    {
      "key": "executive-summary",
      "name": "Executive summary",
      "description": "A short overview of the report, its purpose and the key takeaway.",
      "guidance": "Write 3-6 sentences. Use a highlighted callout box with a light background to draw attention.",
      "required": true
    }
  ],
  "requirements": [
    "Self-contained HTML document with embedded <style>",
    "Target content width 794px (A4), renders standalone in an iframe",
    "No external fonts, scripts or network dependencies"
  ]
}
```

**Seeded starter templates** (editable/deletable in the admin app):

| Slug | Category | Use for |
|---|---|---|
| `blank` | General | Anything — the agent structures the document from scratch |
| `business-report` | Reports | Cover, executive summary, findings, data table, recommendations |
| `invoice` | Business | Header, from/to blocks, line items, totals, payment terms |
| `api-docs` | Technical | Overview, auth, endpoints table, request example, error codes |
| `letter` | Business | Sender, date, recipient, salutation, body, signature |

---

## Data Model

```mermaid
erDiagram
    auth_users ||--o{ visual_implementations : "owns (cascade)"
    pdf_templates ||--o{ visual_implementations : "template (set null)"
    visual_implementations {
        uuid id PK "gen_random_uuid()"
        uuid user_id FK "auth.users.id"
        text title
        text description
        text html_code "required"
        text css_code
        text[] source_component_ids "deprecated — unused"
        uuid template_id FK "pdf_templates.id, set null"
        text template_slug "denormalized"
        text prompt_used
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }

    pdf_templates {
        uuid id PK "gen_random_uuid()"
        text slug UK
        text name
        text description
        text category
        jsonb blueprint "sections + guidance outline"
        text[] tags
        boolean is_active
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
| PDF template blueprints | `public.pdf_templates` (Supabase) | Migration `0003_pdf_templates.sql` |
| Saved documents | `public.visual_implementations` (Supabase) | Migrations `0002` + `0003` (template columns) |
| Admin content taxonomy | `categories → sub_categories → components` | Migration `0001_init.sql` exists |

---

## Security Model

- **Every MCP call requires a valid Supabase JWT** (`Authorization: Bearer …`). No token → 401.
- **Tokens are verified with JWKS** (public keys), so no secret validation happens in the worker.
- **RLS is the enforcement point** for the database:
  - `visual_implementations`: `using (user_id = auth.uid()) with check (user_id = auth.uid())` — users can only read/update/delete **their own** rows, even if they forge queries.
  - `categories` / `sub_categories` / `components`: any authenticated user (admin app) has full access.
  - `pdf_templates`: any authenticated user (agents + admin app) has full access.
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
| `SUPABASE_URL` | `https://jdzhnwmfbfdocqncwfay.supabase.co` |
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
- Request **6 (create_document)** captures the returned id into `{{document_id}}`, so requests 8–10 auto-fill it.
- Base URL is `{{mcp_url}}` → `http://127.0.0.1:8789/mcp`.

**Manual equivalent (curl):**

```bash
# get token
curl -s -X POST "https://jdzhnwmfbfdocqncwfay.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"mcp-test@klone.dev","password":"McpTest123!"}'

# call a tool
curl -s -X POST http://127.0.0.1:8789/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_pdf_template","arguments":{"slug":"business-report"}}}'
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

- [x] MCP server with 7 tools (PDF template blueprints + document CRUD)
- [x] `pdf_templates` table + blueprint outlines + RLS (migration `0003_pdf_templates.sql`)
- [x] `visual_implementations` table + RLS (migration applied)
- [x] JWT-gated auth with user-scoped Supabase client
- [ ] Admin app: manage `pdf_templates` blueprints in the UI
- [ ] Web app: template gallery sourced from `pdf_templates` (currently hardcoded in `apps/web/lib/data/templates.ts`)
- [ ] Support MCP clients without custom header support (e.g. token via env/query param)
