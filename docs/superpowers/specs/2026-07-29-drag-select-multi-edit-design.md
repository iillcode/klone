# Drag-Select + Multi-Element Editing

## Overview

Add rubber-band (marquee) drag selection, Ctrl/Cmd+click multi-select, and bulk style editing to the HTML preview editor.

## Goals

1. Users can drag a rectangle to select all elements within it
2. Users can Ctrl/Cmd+click to toggle individual elements in/out of selection
3. All selected elements can be styled (color, padding, margin, alignment, width) or deleted in one action
4. One undo reverts the last bulk operation across all affected elements

## Files Modified

- `apps/web/components/editor-iframe.ts` — iframe script (selection, marquee, bulk ops)
- `apps/web/components/HtmlPreview.tsx` — wrapper (message protocol, exposed methods)
- `apps/web/components/PreviewToolbar.tsx` — toolbar (multi-select UI, bulk controls)
- `apps/web/app/(dashboard)/preview/[id]/page.tsx` — page state management

## 1. Selection Model (`editor-iframe.ts`)

### State

```js
var selectedEls = [];      // Array of DOM elements
var marqueeEl = null;      // The marquee rectangle div
var isDragging = false;
var dragStart = null;      // {x, y} in iframe coords
var batchId = 0;           // Groups undo entries per bulk operation
```

### Selection Rules

| Action | Behavior |
|--------|----------|
| Click (no modifier) | Clear all, select clicked element |
| Ctrl/Cmd + click | Toggle clicked element in/out of `selectedEls` |
| Click on empty area | Clear selection |
| Drag (mousedown → mousemove → mouseup) | Draw marquee, select all intersecting elements |
| Ctrl/Cmd + A | Select all clickable elements |
| Escape | Clear selection |

### Visual Feedback

- **Selected elements:** `outline: 2px solid #8b5cf6; outlineOffset: 2px`
- **Marquee rectangle:** `position: fixed` div inside iframe with `border: 1px dashed rgba(139,92,246,0.6); background: rgba(139,92,246,0.1)` — removed on mouseup
- **Hover highlight:** `outline: 1px dashed rgba(139,92,246,0.6)` (unchanged, only when not multi-selecting)

### Marquee Implementation

1. `mousedown` on empty area (no modifier) starts drag. Record `dragStart`.
2. `mousemove` creates/updates a `div` overlay positioned from `dragStart` to current mouse position.
3. `mouseup` finishes drag. Use `getBoundingClientRect()` on all child elements to find those whose rect intersects the marquee rect. Add them to `selectedEls`.
4. Remove the marquee div.

Intersection check: two rects A and B intersect if `A.left < B.right && A.right > B.left && A.top < B.bottom && A.bottom > B.top`.

### Clickable Elements

Any element with a `tagName` (not the `html`, `head`, `body`, or `script` elements). Filter out the marquee div itself.

## 2. PostMessage Protocol

### Parent → Iframe

| Message | Payload | Description |
|---------|---------|-------------|
| `apply-style` | `{property, value}` | Apply style to all `selectedEls` |
| `delete-element` | — | Delete all `selectedEls` |
| `undo` | — | Undo last batch |
| `redo` | — | Redo last batch |

### Iframe → Parent

| Message | Payload | Description |
|---------|---------|-------------|
| `element-selected` | `{elements: ElementInfo[]}` | Selection changed (array) |
| `selection-cleared` | — | Selection empty |
| `style-updated` | `{property, value}` | Last applied style (for UI sync) |

`ElementInfo` = `{tag: string, classes: string, styles: Record<string, string>}`

## 3. Bulk Style Application

When `apply-style` is received:

1. Increment `batchId`
2. For each element in `selectedEls`:
   - Push `{element, property, oldValue, batchId}` to `undoStack`
   - Apply `element.style[property] = value`
3. Clear `redoStack`
4. Send `style-updated` with the last element's computed value (for toolbar sync)

## 4. Bulk Delete

When `delete-element` is received:

1. Increment `batchId`
2. For each element in `selectedEls`:
   - Push `{element, property: '__delete__', oldValue: null, batchId}` to `undoStack`
   - Call `element.remove()`
3. Clear `selectedEls`
4. Send `selection-cleared`

## 5. Undo/Redo (Batch)

- **Undo:** Pop all entries with the latest `batchId` from `undoStack`. If entry is `__delete__`, re-insert element (store `nextSibling` and `parentNode` for restoration). Otherwise restore `oldValue`. Push reverse entries to `redoStack` with same batch ID.
- **Redo:** Pop all entries with latest `batchId` from `redoStack`, re-apply. Push to `undoStack`.

## 6. Parent Layer Changes

### `HtmlPreview.tsx`

- `onElementSelect` signature: `(elements: ElementInfo[] | null) => void`
- `HtmlPreviewHandle` gains: `applyStyleMulti(property, value)`, `deleteMulti()` — both post messages to iframe
- Listen for `element-selected` (plural) and `selection-cleared` messages

### `PreviewToolbar.tsx`

- Props: `selectedElements: ElementInfo[]` (replaces `selectedElement`)
- When `selectedElements.length > 1`: show `<tag> ×N` badge
- All style controls read from first element's styles, write to all via `onApplyStyle`
- When `selectedElements.length === 0`: no controls shown (as today)

### `preview/[id]/page.tsx`

- State: `selectedElements: ElementInfo[]` (replaces `selectedElement`)
- `handleElementSelect` accepts array
- `handleApplyStyle` calls `previewRef.current.applyStyleMulti()`
- `handleDelete` calls `previewRef.current.deleteMulti()`

## 7. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Ctrl/Cmd + A | Select all elements |
| Escape | Clear selection |
| Delete / Backspace | Delete all selected |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Y | Redo |

## 8. Edge Cases

- **Empty click area:** Clear selection, don't start drag unless mouse moves > 5px
- **Single element in marquee:** Select it (treat as click-equivalent)
- **Nested elements in marquee:** Select the deepest/leaf elements only (skip parents whose children are all selected)
- **Undo of deleted elements:** Store parent + nextSibling for re-insertion at original position
