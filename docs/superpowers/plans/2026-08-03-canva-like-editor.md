# Canva-like Editor Interactions — Implementation Plan

> **Status:** Implemented 2026-08-03

**Goal:** Add Canva.com-style direct manipulation to the HTML preview editor: inline text editing on the canvas, drag-to-move elements, and arrow-key nudge — on top of the existing select/multi-select/marquee/undo/redo/delete features.

**Architecture:** All interaction logic lives in the iframe script (`editor-iframe.ts`); the parent React app only forwards commands (`move-by`) and renders the discovery hint pill. No new dependencies.

## Features

### 1. Double-click inline text editing (Parent Overlay — rewritten)

- **Architecture**: text editing lives in the PARENT document, not the sandboxed iframe. The iframe's contenteditable approach kept failing due to focus races with the parent's keyboard-capture input.
- Iframe: `dblclick` → `deselect()` + posts `edit-text-request` `{reqId, text, tag, rect, styles}` (computed font/color/padding/background + element rect)
- Parent (`HtmlPreview.tsx`): renders a `<textarea>` overlay positioned exactly over the element, styled to match (font family/size/weight/line-height/color/text-align/padding/background), sky-blue focus ring
- **Commit**: Enter (except `pre`/`code`), Ctrl/Cmd+Enter, or clicking away (textarea blur) → posts `set-text {reqId, text}`
- **Cancel**: Escape → posts `cancel-edit {reqId}`
- Iframe applies `textContent` (or re-selects on cancel), pushes `__text__` undo entry (innerHTML snapshot), re-selects element with purple outline, syncs parent
- `reqId` guard: stale `set-text`/`cancel-edit` messages are ignored
- `pendingEditEl` + `editReqId` cleared when inspect mode turns off

### 2. Drag to move

- `mousedown` on an **already-selected** element → move mode (`cursor: move`); marquee drag-select only starts on empty space
- `mousemove` applies `transform: translate(dx, dy)` live to all selected elements
- `mouseup` commits a batched undo entry (`transform` property, old value = pre-drag transform) if the element actually moved
- Multi-selected elements move together

### 3. Arrow-key nudge

- Parent page keydown intercepts Arrow keys in inspect mode with selection → `moveBy(dx, dy)` → `move-by` postMessage
- Default step **1px**, **Shift = 10px**
- Guard uses `!isInput || isEditorCapture` (the hidden capture input is an INPUT tag)

### 4. Width resize handles (selection box)

- When exactly ONE element is selected, a violet selection box (`1.5px solid #8b5cf6`) with 6 white handles (left/right edges + 4 corners) is drawn over the element via a fixed-position overlay div (`data-editor-ui="box"/"handle"`)
- **All handles resize WIDTH only**: right-side handles grow/shrink width from the right; left-side handles shrink/grow width AND shift the element (`transform: translateX`) so the left edge stays under the cursor
- Resize commits on mouseup as a batched undo entry (`width` + `transform` if left handle), syncs parent via `style-updated` + `fireSelected`
- Box hidden for multi-select, while editing text (`pendingEditEl`), or on deselect; position refreshed on scroll (capture phase) + window resize
- Handles excluded from click/hover/marquee selection via `data-editor-ui` check in `isClickable`
- Export (HtmlPreview) strips `[data-editor-ui]` nodes from the PDF clone

### 5. Discovery hint

- Floating pill bottom-center of canvas when inspect mode is on: "double-click edit text · drag to move · V exit"

## Files Changed

- `apps/web/components/editor-iframe.ts` — removed ALL contenteditable/edit-mode logic; added `pendingEditEl`/`editReqId` state, `dblclick` → `edit-text-request` poster, `set-text`/`cancel-edit` message handlers
- `apps/web/components/HtmlPreview.tsx` — text-edit overlay (`TextEditState` + styled textarea), message bridge for `edit-text-request`, `cancelTextEdit` on handle, overlay closes on inspect-off
- `apps/web/app/(dashboard)/preview/[id]/page.tsx` — unchanged (already gates shortcuts via `onEditModeChange`/`isEditingRef`)

## Interaction Matrix

| Action                          | Result                                       |
| ------------------------------- | -------------------------------------------- |
| Click                           | Select (purple outline)                      |
| Ctrl/Cmd+click                  | Toggle multi-select                          |
| Drag on empty space             | Marquee select                               |
| Drag on selected element        | Move (transform translate)                   |
| Double-click text               | Parent-side textarea overlay (sky-blue ring) |
| Enter / Ctrl+Enter / click-away | Save text                                    |
| Escape                          | Cancel text edit                             |
| Arrow keys / Shift+Arrows       | Nudge 1px / 10px                             |
| Delete / Backspace              | Delete selection                             |
| Ctrl+Z / Ctrl+Shift+Z           | Undo / Redo                                  |
| Escape                          | Deselect                                     |

## Edge Cases Handled

- Focus races eliminated: editor lives in the parent document, so the iframe capture input can never steal focus mid-edit
- `reqId` guard: stale set-text/cancel-edit messages (from an earlier element) are ignored
- `pendingEditEl` cleared on inspect-off so edits never apply to the wrong element
- Enter in `pre`/`code` inserts newline instead of committing (multi-line content)
- Undo/redo of text, transform, styles, and deletions each restore correctly (batch-based)
- `justDragged` flag prevents click-after-drag from deselecting moved elements
