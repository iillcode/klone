# Multi-page Editing (Inspect Mode) — Design

> **Status:** Approved 2026-08-07

## Goal

In the canvas editor's preview page, when the user switches to **inspect mode**, they can:

1. Add empty pages below the existing content by clicking a **"+ Add page"** overlay button at the bottom of the editor canvas.
2. Move elements from the top page to the new pages — either by **dragging them across a page boundary**, or via an explicit **"Move to page"** action in the properties sidebar.
3. Keep the existing PDF split-mode feature intact (per approved scope: "keep both").

## Problem

Today the preview editor renders a single continuous document (one scrolling page). There is no notion of multiple pages. The existing PDF **split mode** (`data-klone-page-break` markers → `break-before: page` on export) provides page breaks, but they are: (a) attached to arbitrary elements, (b) invisible in preview mode, and (c) not a page *model* — nothing distinguishes "page 1 content" from "page 2 content".

## Design

### 1. Page model — structural boundary elements

A page boundary is a **real, persisted element**:

```html
<div data-klone-page-boundary></div>
```

- Inserted as a direct child of the content container (`.scroll-wrapper` or `body` fallback).
- Content **above** the first boundary = page 1; content **between** boundaries = page N; content **after** the last boundary = the last page.
- Boundaries are **system-level** (like `.klone-frame`/`.scroll-wrapper`): never selectable, hoverable, draggable, resizable, or deletable via selection; excluded from marquee and Ctrl+A select-all (`isSystemFrame`/`isClickable` checks).
- Boundaries **persist in saved HTML** (like `data-klone-page-break`), so pages survive save/reload. On script init, existing boundaries are picked up and marker overlays rebuilt (`ensureSystemFrame` runs before page logic; boundary detection is idempotent).

### 2. Visuals

- Boundaries are **zero-height in-flow** elements → **no visual impact in preview mode**; the document renders exactly as today.
- In **inspect mode**, an overlay divider is drawn at each boundary: a full-container-width dashed line + chip labeled **"Page N starts here"** with a small **×** button to remove the boundary (merges pages).
- Divider styling is neutral (white/gray) so it is never confused with the blue PDF split markers (`data-klone-page-break`).

### 3. Add page — overlay button

- Only rendered when `inspectMode` is on.
- Floating **"+ Add page"** pill button at the bottom-center of the editor canvas, stacked above the existing discovery hint pill.
- Click → parent posts `{ type: "add-page" }` to the iframe → iframe appends a new boundary at the end of the content container → page count reported to parent via `pages-changed` (deduped, same pattern as `page-break-updated`).
- `PreviewEditor` keeps `pageCount` state; the button shows the current count (e.g. "+ Add page · 3").

### 4. Move elements between pages

Two mechanisms (both approved):

**A. Drag across a boundary (Canva-like):**

- During drag-move, boundary positions are tracked (they are in-flow, so `getBoundingClientRect` is valid even at height 0).
- On drag end (`mouseup`), each dragged element's top edge is compared against boundary lines. If the element crossed a boundary, it is **reparented** to the other side **with transform compensation**, so its visual position stays exactly where the user dropped it:
  1. Record current transform `T1`, parent, and nextSibling.
  2. `parent.removeChild(el)`.
  3. Insert into the new parent at the appropriate position (before the boundary line it crossed, or after).
  4. Apply transform `T2 = T1 + (oldParentRect.top - newParentRect.top)` to preserve visual position across the parent offset change.
- Boundaries themselves are never dragged.

**B. Explicit "Move to page" action:**

- New **"Pages"** section in `PropertiesSidebar`, visible when elements are selected.
- Shows the selection's current page (derived from boundary positions) and a **"Move to page"** dropdown: existing pages + **"+ New page"** (creates a boundary and moves the selection into it).
- Reuses the same reparent + transform-compensation routine via a new `move-to-page` message.

### 5. Undo/redo

- New entry types in the existing batch-based stack:
  - `__page_boundary__` — add/remove boundary (with nextSibling/parent restore).
  - `__reparent__` — restore previous parent, nextSibling, and transform.
- All page operations (add boundary, remove boundary, move element) push undo entries; undo/redo mirror them exactly like the existing `__delete__`/`__page_break__` entries, including marker overlay refresh.

### 6. Export & PDF

- **Saved HTML (`getFullHtml`)**: boundary elements are **kept** so pages reopen.
- **PDF export (`exportPdf`)**: in the export clone, each boundary becomes `break-before: page` (a zero-height block, so no blank page) → **one PDF page per editor page**. The existing `data-klone-page-break` split markers continue to work inside pages (they are preserved as today).
- `serializeCleanHtml(true)` currently converts `data-klone-page-break` → print CSS; the boundary conversion is added in the same pass.

### 7. Message protocol additions

**Parent → iframe:**
```
{ type: "add-page" }
{ type: "move-to-page", pageIndex }          // pageIndex = 0..N-1, or "new"
{ type: "remove-page-boundary" }             // from the divider chip × (optional; can also be via undo)
```

**Iframe → parent:**
```
{ type: "pages-changed", count, changed }
```

## Files changed

| File | Change |
|---|---|
| `apps/web/components/editor/editor-iframe.ts` | Boundary create/remove/render markers, drag-across-page reparent logic, `add-page` / `move-to-page` message handlers, `pages-changed` reporting, `__page_boundary__` / `__reparent__` undo entries, selection exclusions (`isSystemFrame`/`isClickable`), boundary detection on init |
| `apps/web/components/editor/HtmlPreview.tsx` | `pages-changed` message bridge, `addPage()` / `moveToPage(n)` / `removePageBoundary()` on `HtmlPreviewHandle`, boundary → print-break conversion in `serializeCleanHtml(true)` |
| `apps/web/components/editor/PreviewEditor.tsx` | `pageCount` state, "+ Add page" overlay button (inspect mode only), wiring for `onPageCountChange` |
| `apps/web/components/editor/PropertiesSidebar.tsx` | "Pages" section: current page + move-to-page dropdown (+ new page) |

## Edge cases handled

- Container elements (`.scroll-wrapper`, `.klone-frame`, `body`) can never be moved to another page (`isContainer` guard).
- Elements keep inline styles; class-based styling from the old parent may change after reparent (inherent to page moves — the page model is structural).
- Moving all content off a page leaves it empty → removable via **×** on its divider.
- Undo restores exact DOM order + transforms, including boundaries created before a save/reload (init-time detection).
- Dragging a group across a boundary: each element is evaluated independently; group members may end up on different pages.
- Boundary markers must be rebuilt after any undo/redo/delete/reparent. The new `updateBoundaryMarkers()` runs alongside the existing `updatePageBreakMarkers()` (both are called from the same mutation points; split mode stays independent).
- **Move-to-page insertion point** is explicit: "Move to page N" appends the element(s) at the **end of page N's region** (immediately before the boundary that starts page N+1, or at the end of the container for the last page). "Move to new page" appends a boundary at the container end, then moves the selection into that new page.

## Non-goals

- No fixed-size (Canva-style) page canvases — pages are boundaries in the continuous document (approved choice).
- No reordering of whole pages (drag page cards), no page thumbnails strip.
- No rename/duplicate of pages.
- No per-page background color.
- Split mode (fine-grained breaks inside a page) remains separate and unchanged.

## Testing

- Manual: add pages via button, verify divider chips + count; drag element across boundary → lands on next page with same visual position; undo/redo of add-page, move, remove; save → reload → pages persist; PDF export → one page per editor page; split markers still work inside pages.
- The editor script is vanilla JS in an iframe (no unit-test harness exists); verification is via browser interaction + existing `route-protection.test.ts` untouched.
