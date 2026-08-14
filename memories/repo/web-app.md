# apps/web (Klone web app)

Next.js **16.2.10** + React 19 + Turbopack. CLAUDE.md: "This is NOT the Next.js you know" — read `node_modules/next/dist/docs/` before coding; `params` is a Promise (await it). Deploy target = Cloudflare (`@opennextjs/cloudflare`), not Vercel.

## Commands

- `pnpm --filter web dev|build|start|lint` (lint = flat `eslint`, no test script — no test runner wired up).

## Editor (Figma-style canvas) — components/editor/

3 layers: `PreviewEditor.tsx` (client parent, state + imperative handle `previewRef`) → `HtmlPreview.tsx` (client, `<iframe srcDoc sandbox="allow-scripts allow-same-origin">`, text-edit overlay lives in PARENT) → `editor-iframe.ts` (`getEditorScript()` returns ~2.8k-line vanilla JS string run inside iframe).

- Protocol: parent→iframe via `iframe.contentWindow.postMessage` (apply-style, undo, add-component, add-page, move-by, align-elements, inspect-mode, set-text/cancel-edit, …); iframe→parent via `window.parent.postMessage` (element-selected, style-updated, edit-text-request, pages-changed, …). All use `'*'` origin.
- Guard `window.__kloneEditorInjected`; version marker `console.log('[editor] script v23')`. HMR does NOT reload srcDoc → hard refresh after editing editor-iframe.ts.
- Multi-page: `[data-klone-page-boundary]` container, `[data-klone-page-break]` marker.

## Supabase

- `@supabase/ssr` for both: `lib/supabase/client.ts` (createBrowserClient) + `lib/supabase/server.ts` (createServerClient + cookies()). `@supabase/supabase-js` for types only. Auth in `lib/auth.ts`. Server data layer `lib/data/*.ts` relies on RLS (`user_id=auth.uid()`). Tables: `visual_implementations`, `pdf_templates`, `users`. Migrations in `apps/admin/supabase/migrations/`.

## Styling

- **Tailwind v4 CSS-first** (no tailwind.config.js; tokens in app/globals.css). shadcn v4 config BUT primitives use **@base-ui/react (Base UI, not Radix)** in `@repo/ui/src`. `cn()` = clsx+tailwind-merge from `@repo/ui/utils`. Dark theme default.

## Pitfalls

- editor-iframe.ts is a string literal; bump v23 marker.
- PDF route hardcodes `C:\Program Files\Google\Chrome\Application\chrome.exe` for puppeteer-core in dev (Windows-only).
- Don't add Radix. Theme edits go in globals.css.
- metadata.title is stale "DevLibrary".
- Template component data in `lib/data/template-components.ts`; `lib/data/components.ts` only has stray Author type.
- Key React lists by `${group}-${index}` (dup component keys in seed data).
