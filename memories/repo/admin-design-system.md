# Admin app design system

The `apps/admin` UI aligns with the `apps/web` dark theme.

## Tokens (apps/admin/app/globals.css :root + .dark)
- background `#161617`, card `#1a1a1a`, border `#27272a`, muted `#a1a1aa`
- primary (violet) `#8b5cf6`, destructive `#ef4444`
- All shadcn primitives (@repo/ui) read these vars, so changing the vars restyles every component at once.

## Layout shell
- `(admin)/layout.tsx`: flex h-screen shell = `<AdminSidebar>` (280px) + topbar (h-14) + scrollable `<main p-6>`.
- `components/layout/AdminSidebar.tsx` is a client component (uses usePathname) — matches web `Sidebar` style (brand block, nav, account footer).
- `TemplateBuilder` uses `sticky top-0 -mx-6` action bar; keep `main` padded with `p-6` so the builder's negative margin bleeds to the panel edges.

## Auth
- Login form (`components/LoginForm.tsx`) is a centered card, not inside the sidebar shell.

## Versions
- admin uses `@base-ui/react`, shadcn v4, lucide-react. Next 16 (middleware -> proxy deprecated warning is harmless).

## TemplateBuilder components editor (redesigned, full-width)
- `components/templates/TemplateBuilder.tsx` is the create/edit screen for a pdf_template.
- Layout: sticky action bar (back, title, save) + top **tab strip** (Details / Page design / Components / Structure / Requirements / Preview sample) — NO left section-nav rail and NO right preview rail (both removed for more editing room).
- "Components" view is **full-width**: a responsive block-card grid (`grid sm:grid-cols-2 lg:grid-cols-3`, keyed by `${group}-${index}`) on top, and a full-width `ComponentEditor` panel below. Click a card to edit; "Add block" appends + auto-selects. State: `selected: number | null` (index into components).
- Removed dead code: `ComponentCard`, `ComponentListItem`, `openGroups`/`toggleGroup`/`allOpen`/`toggleAllGroups`, `previewHtml`/`buildPreviewHtml` (only `buildPreviewHtml` kept for the Preview-sample "Generate" button), `blueprintJson`, `copyJson`, `openPreviewTab`, `showJson`/`copied`/`pvKey`/`zoom` state, and `Copy`/`ExternalLink` imports.
- `groups`/`filteredGroups` still used for grouping + search. Other views (details, page, structure, requirements, preview sample) unchanged.
- Known data quirk: seed templates have duplicate component `key: "section"` — always key React lists by index/group, never by `c.key`.
