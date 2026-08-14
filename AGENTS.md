# Klone — Agent Instructions

## Git policy (MANDATORY)

- **Never commit changes to git.**
- **Never push anything to a remote git repository.**
- Do not run `git commit`, `git push`, `git add && git commit`, or any
  equivalent that stages/commits/pushes changes — unless the user explicitly
  asks for it in the current request.
- Leave all work as uncommitted working-tree changes so the user can review
  and commit themselves.
- If a workflow step says "commit" (e.g. design docs or plans), skip that
  step and note it instead.

## Workspace layout

- pnpm + Turborepo monorepo: `apps/web`, `apps/admin`, `apps/mcp`,
  `packages/ui`, `docs/`, `scripts/`.
- Editor code lives in `apps/web/components/editor/` (React parent +
  `editor-iframe.ts` vanilla-JS script injected into a sandboxed preview
  iframe; message-protocol based, see the spec in
  `docs/superpowers/specs/2026-08-07-multipage-editor-design.md`).

## Build / dev / test commands

Run from the repo root unless noted. Use pnpm (packageManager pinned to 9.x).

```bash
pnpm install                       # install all workspace deps
pnpm dev                           # turbo run dev across all apps
pnpm --filter web dev              # web app (Next 16, port 3000)
pnpm --filter admin dev            # admin app (Next 16, port 3001)
cd apps/mcp && pnpm dev            # MCP server (wrangler dev, port 8789)
pnpm build / pnpm check-types / pnpm lint   # turbo via root
pnpm --filter web lint             # web: flat eslint, NO test runner yet
pnpm --filter admin lint           # admin: next lint
cd apps/mcp && pnpm tsc --noEmit    # type-check the MCP worker
```

- Web and admin deploy to **Cloudflare** via `@opennextjs/cloudflare` (`pnpm --filter web deploy`), NOT Vercel.
- MCP server is a **Cloudflare Worker** (`wrangler deploy`, port 8789 in dev).
- MCP env bindings (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWKS_URL`) live inline in `apps/mcp/wrangler.jsonc`.
- Admin has one Vitest test: `apps/admin/lib/route-protection.test.ts` (run `vitest` directly). Web has no test runner wired up.

## Architecture at a glance

- **`apps/web`** — end-user app (Next.js 16.2.10, React 19). Template gallery,
  Figma-style canvas editor, PDF export. Reads `visual_implementations` +
  `pdf_templates` from Supabase via RLS-scoped server clients.
- **`apps/admin`** — content-manager app (Next.js 16). Manages `pdf_templates`
  (blueprint outlines) via the `TemplateBuilder` client component. Migrations
  for the whole project live in `apps/admin/supabase/migrations/`.
- **`apps/mcp`** — Cloudflare Worker MCP server. Exposes 7 JSON-RPC tools
  (JWT-gated via JWKS). Agents call `get_pdf_template` (blueprint) then
  `create_document` (persist HTML). See `docs/admin-api-docs.html` and
  `docs/postman/klone-mcp.postman_collection.json`.
- **`packages/ui`** — shared `@base-ui/react` primitives + `cn()` util
  (`@repo/ui/utils`). Imported as `@repo/ui` in apps.

## Conventions (deviate only with reason)

- **Supabase**: use `@supabase/ssr` for browser/server clients
  (`lib/supabase/{client,server}.ts` in each app). `@supabase/supabase-js` is
  for types only. All data access relies on RLS (`user_id = auth.uid()`).
- **MCP Supabase client MUST be created with the caller's JWT** — see
  `apps/mcp/src/supabase.ts` `getSupabase(env, token)` which sets
  `global.headers.Authorization`. Without the user token, every write fails
  RLS. `user.sub` is the `userId` used to scope document queries.
- **Styling**: Tailwind v4 (CSS-first, tokens in `app/globals.css`, no config
  file) + shadcn v4 config, but primitives use **Base UI (`@base-ui/react`),
  NOT Radix**. Use `cn()` from `@repo/ui`. Dark theme is default.
- **Shared data contract**: `apps/mcp/src/types.ts` (`PdfTemplate`/`Document`)
  and `apps/admin/lib/template-types.ts` (`TemplateBlueprint`) both describe
  `public.pdf_templates` / `public.visual_implementations`. The admin blueprint
  is the richer v2 shape (`structure` + `components[]` + `requirements`); the
  MCP blueprint supports both legacy `sections[]` (v1) and v2 `components[]`.
  Keep them in sync when changing the schema.
- **Component catalog**: `apps/admin/lib/template-components.json` is canonical
  for template blocks; changing it alters every new template and MCP blueprints.

## The canvas editor (apps/web/components/editor/)

3 layers, message-protocol based:

1. `PreviewEditor.tsx` — client parent, owns state, exposes `previewRef`.
2. `HtmlPreview.tsx` — client, hosts a sandboxed `<iframe srcDoc sandbox="allow-scripts allow-same-origin">`; the text-edit overlay lives in the **parent**, not the iframe.
3. `editor-iframe.ts` — `getEditorScript()` returns a ~2.8k-line vanilla-JS string injected into the iframe.

Protocol: parent→iframe via `iframe.contentWindow.postMessage` (apply-style,
add-component, add-page, move-by, align, inspect, set-text…); iframe→parent via
`window.parent.postMessage` (element-selected, style-updated, pages-changed…).
All messages use `'*'` origin. Guard: `window.__kloneEditorInjected`;
version marker `console.log('[editor] script v23')`.

## Pitfalls / gotchas

- **Next.js 16 is not the Next you know** — `apps/web/CLAUDE.md` warns:
  read `node_modules/next/dist/docs/` before coding; `params` is a Promise
  (await it); Turbopack root is the monorepo root.
- **Editor HMR**: editing `editor-iframe.ts` does NOT hot-reload the iframe
  `srcDoc` — hard-refresh the browser after changes, and **bump the `v23`
  marker** so you can confirm the new script loaded.
- **PDF route** hardcodes `C:\Program Files\Google\Chrome\Application\chrome.exe`
  (puppeteer-core) for local dev — Windows-only, won't run on other OSes.
- React list keys: seed data can produce duplicate `component.key` — avoid
  `${group}-${index}` collisions when adding keys.
- Stale `metadata.title` is `"DevLibrary"` — update in `apps/web/app/layout.tsx`
  when touching metadata.
- Web template component data lives in `lib/data/template-components.ts`;
  `lib/data/components.ts` holds only a stray `Author` type — don't rely on it.

## Where to look (link, don't duplicate)

- Product/architecture overview + data model + security: `README.md`
- Editor design spec + plans: `docs/superpowers/specs/2026-08-07-multipage-editor-design.md`, `docs/superpowers/plans/`
- MCP tool reference + Postman collection: `docs/admin-api-docs.html`, `docs/postman/klone-mcp.postman_collection.json`
- Web admin design system notes: `memories/repo/admin-design-system.md`, `memories/repo/web-app.md`
