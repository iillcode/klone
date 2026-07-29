# Canvas Editor Design — Preview Section

## Problem

The preview iframe in the canvas editor is buggy: element selection is broken (no hover, clicks don't always select), and key editing features (align, delete, undo/redo, width, hover highlight) are missing. The user needs a functional canvas-type editor in the preview section.

## Scopes (must implement)

1. Hover highlight on any element
2. Change text color (exists, needs fix)
3. Align div content (textAlign: start / center / end)
4. Padding (exists, needs fix)
5. Container width adjustment
6. Undo/Redo (Ctrl+Z / Ctrl+Y)
7. Delete selected element (Delete key)

## Bugs to fix

- Capture-phase click handler blocks element selection
- Number inputs use `defaultValue` (stale on re-select)
- No optimistic state update (toolbar snaps back on re-render)

## Architecture

### File structure

```
apps/web/
  components/
    editor-iframe.ts            # New: clean iframe editor script generator
    HtmlPreview.tsx             # Refactored: uses editor-iframe, handles messages
    PreviewToolbar.tsx          # Updated: align buttons, width, delete, hover info
  app/(dashboard)/preview/[id]/page.tsx  # Updated: keyboard shortcuts, delete flow
```

### Iframe script (`editor-iframe.ts`)

Generates a well-structured `<script>` block injected into the preview HTML. The script manages:

- **Element selection** (click)
- **Element hover** (mouseover delegation)
- **Undo/redo stacks**
- **Keyboard event listener** (Delete key deletes)
- **Message handler** for commands from parent

Message protocol:

**Iframe → Parent:**
```
{ type: "element-selected", tag, classes, styles }
{ type: "element-hover", tag, classes }
{ type: "selection-cleared" }
{ type: "style-updated", property, value }
```

**Parent → Iframe:**
```
{ type: "apply-style", property, value }
{ type: "delete-element" }
{ type: "undo" }
{ type: "redo" }
```

### Undo/Redo in iframe

Each `apply-style` command records `{ property, oldValue, element }` on undoStack and clears redoStack.

- `undo`: pop undoStack, set element.style[property] = oldValue, push to redoStack
- `redo`: pop redoStack, set element.style[property] = value, push to undoStack

### Delete

`delete-element` removes the selected element from the DOM, clears selection, posts `selection-cleared`.

### Hover highlight (in iframe)

Uses event delegation on `body` with `mouseover`/`mouseout`. On hover:
- Sets `outline: 1px dashed rgba(139, 92, 246, 0.6)` on hovered element
- Sends `element-hover` to parent (for potential future toolbar updates)
- On mouseout: removes the dashed outline

The hover outline is distinct from the selection outline (solid purple).

### Hover vs Click distinction

- Hover (mouseover): dashed outline, visual preview only, no selection UI
- Click (mousedown): changes dashed to solid purple outline, activates editing UI in toolbar
- Clicking empty space: removes outline, clears selection

This means mousedown + click fires the selection; mouseover handles the hover preview.

### PreviewToolbar edits

When element is selected, toolbar shows:

```
[<div> | 🔤 Align: [start] [center] [end] | 🎨 Color | 🎨 Bg | PX [8] | Width [100%] | 🗑 Delete | ✏️ ⬇️ 📋 ]
```

New controls:
- **Align group**: 3 toggle buttons (start/center/end), text-align values
- **Width**: number input for `width` in px
- **Delete**: trash icon button

### Keyboard handling (parent page)

In `preview/[id]/page.tsx`, add `useEffect` for `keydown`:
- `Ctrl+Z` → `previewRef.current?.undo()` (new handle method)
- `Ctrl+Y` → `previewRef.current?.redo()` (new handle method)
- `Delete` / `Backspace` → `previewRef.current?.deleteElement()` (new handle method)

### HtmlPreviewHandle expansion

```typescript
export interface HtmlPreviewHandle {
  applyStyle: (property: string, value: string) => void;
  undo: () => void;
  redo: () => void;
  deleteElement: () => void;
}
```

## Notes

- The `sandbox="allow-scripts"` attribute on the iframe is sufficient for postMessage communication.
- The preview page is a Client Component (`'use client'`) so keyboard event listeners work.
- The editor script must not conflict with existing page styles — it uses inline styles for outlines only.
- Align uses `textAlign` CSS property applied to the selected element.
