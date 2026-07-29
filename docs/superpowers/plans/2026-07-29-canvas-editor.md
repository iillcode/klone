# Canvas Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix buggy canvas editor and implement hover highlighting, text alignment, container width, undo/redo (Ctrl+Z/Y), and delete (Del key) in the preview iframe.

**Architecture:** Extract the iframe editor script into a clean `editor-iframe.ts` utility, expand HtmlPreview's forwardRef handle with `undo`/`redo`/`deleteElement` methods, add alignment/width/delete controls to PreviewToolbar, and handle keyboard shortcuts (Ctrl+Z/Y/Delete) in the preview page.

**Tech Stack:** Next.js 16, React (forwardRef, useImperativeHandle), Tailwind CSS v4, TypeScript

## Global Constraints

- `sandbox="allow-scripts"` on iframe — postMessage works cross-origin
- All new UI in the bottom toolbar bar (not the parent page)
- The editor script runs inside the iframe, manages own undo/redo history
- `Ctrl+Z` and `Ctrl+Y` are intercepted by the parent page and forwarded to iframe
- `Delete`/`Backspace` keys are intercepted by parent page and forwarded to iframe

---

### Task 1: Create `editor-iframe.ts` — clean iframe editor script

**Files:**
- Create: `apps/web/components/editor-iframe.ts`

**Produces:** A function `getEditorScript()` that returns a clean, readable `<script>` string to be injected into preview HTML. The script manages: element selection, hover highlighting, undo/redo stacks, delete, text-align, width, color, padding, margin, and parent communication via postMessage.

**Interfaces:**
- Consumes: none (standalone utility)
- Produces: `getEditorScript(): string` — a valid `<script>` block

- [ ] **Step 1: Create `editor-iframe.ts` with `getEditorScript()` export**

Write a new file with a clean, multi-line editor script containing:

1. State variables: `selectedEl`, `hoveredEl`, `undoStack`, `redoStack`
2. `deselect()` — removes outline from selectedEl
3. `deselectHover()` — removes hover outline from hoveredEl
4. `getStyle(el)` — helper to get computed style safely
5. Click handler (bubbling on document): prevents default, deselects, selects clicked element (solid purple outline), posts `element-selected` with tag/classes/styles to parent
6. Mouseover handler (bubbling on document): sets hoveredEl, applies dashed purple outline, posts `element-hover` to parent
7. Mouseout handler (bubbling on document): removes dashed outline from hoveredEl, clears hoveredEl
8. Message listener from parent:
   - `apply-style`: record `{property, oldValue, element}` on undoStack, clear redoStack, apply `element.style[property] = value`, post `style-updated` back with `parseRgbToHex` of current computed color
   - `delete-element`: remove selectedEl from DOM, clear selection, post `selection-cleared`
   - `undo`: pop undoStack, restore oldValue on element, push to redoStack, post update
   - `redo`: pop redoStack, re-apply value on element, push to undoStack, post update
9. Keyboard listener inside iframe for `Delete` key (key === 'Delete' keydown): removes selectedEl, posts `selection-cleared`

- [ ] **Step 2: Verify the script string compiles as a JS function with no syntax errors**

Run: `node -e "require('./apps/web/components/editor-iframe.ts')"` or equivalent to check for parse errors

Expected: no parse errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/editor-iframe.ts
git commit -m "feat: add editor-iframe script generator with hover, undo/redo, delete"
```

---

### Task 2: Refactor `HtmlPreview.tsx` to use `editor-iframe.ts`

**Files:**
- Modify: `apps/web/components/HtmlPreview.tsx`

**Consumes:** `getEditorScript()` from `editor-iframe.ts`, `useTheme()` from theme-provider

**Produces:** Refactored HtmlPreview with forwardRef exposing `applyStyle`, `undo`, `redo`, `deleteElement` methods

**Interfaces:**
- Consumes: `getEditorScript()`, theme context
- Produces: `HtmlPreviewHandle` with `applyStyle`, `undo`, `redo`, `deleteElement` methods

- [ ] **Step 1: Remove old EDITOR_SCRIPT constant and buildHtml function**

Delete the `EDITOR_SCRIPT` constant (line 69) and the `buildHtml` function from HtmlPreview.tsx entirely (lines 69-327).

- [ ] **Step 2: Import `getEditorScript` and rebuild `buildHtml` using the editor script**

Add import: `import { getEditorScript } from './editor-iframe';`

Create a new `buildHtml(c: Colors): string` function that returns the same HTML template as before but uses `getEditorScript()` (instead of the old hardcoded script) appended just before `</body>`.

The HTML template should be identical to the existing one (same CSS, same semantic HTML structure).

- [ ] **Step 3: Update HtmlPreview component props and ref interface**

Change `HtmlPreviewProps` to include:
```typescript
interface HtmlPreviewProps {
  html?: string;
  onElementSelect?: (info: ElementInfo | null) => void;
  onStyleUpdated?: (property: string, value: string) => void;
}
```

Update `HtmlPreviewHandle` to include new methods:
```typescript
export interface HtmlPreviewHandle {
  applyStyle: (property: string, value: string) => void;
  undo: () => void;
  redo: () => void;
  deleteElement: () => void;
}
```

- [ ] **Step 4: Update `useImperativeHandle` to expose new methods**

```typescript
useImperativeHandle(ref, () => ({
  applyStyle: (property, value) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'apply-style', property, value }, '*');
  },
  undo: () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'undo' }, '*');
  },
  redo: () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'redo' }, '*');
  },
  deleteElement: () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'delete-element' }, '*');
  },
}));
```

- [ ] **Step 5: Update message handler to handle `selection-cleared`**

In the existing `useEffect` message handler, add:
```typescript
if (e.data && e.data.type === 'selection-cleared') {
  onElementSelect?.(null);
}
```

- [ ] **Step 6: Build and verify**

Run: `pnpm run build` in `apps/web`

Expected: build succeeds with no TypeScript errors, routes show `○ /` and `ƒ /preview/[id]`

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/HtmlPreview.tsx apps/web/components/editor-iframe.ts
git commit -m "refactor: extract editor script to editor-iframe.ts, expand HtmlPreview handle"
```

---

### Task 3: Update `PreviewToolbar.tsx` with align, width, delete, and hover info

**Files:**
- Modify: `apps/web/components/PreviewToolbar.tsx`

**Consumes:** `ElementInfo` (from HtmlPreview or self), `onApplyStyle`, new `onDelete`, hover state

**Produces:** Updated toolbar with align group, width input, delete button, hover indicator

**Interfaces:**
- Consumes: expanded ElementInfo, new callbacks
- Produces: updated toolbar UI

- [ ] **Step 1: Add `onDelete` callback to `PreviewToolbarProps`**

```typescript
interface PreviewToolbarProps {
  selectedElement: ElementInfo | null;
  onApplyStyle: (property: string, value: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onCopy?: () => void;
}
```

- [ ] **Step 2: Add align buttons (start, center, end)**

After the tag badge, add a group of 3 small toggle buttons:

```tsx
<div className="flex items-center gap-0.5" title="Text alignment">
  <button
    onClick={() => onApplyStyle('textAlign', 'start')}
    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#27272a] transition-colors ${s.textAlign === 'start' ? 'bg-[#27272a] text-white' : ''}`}
  >
    <svg ... />  {/* left-align icon */}
  </button>
  <button
    onClick={() => onApplyStyle('textAlign', 'center')}
    className={...}
  >
    <svg ... />  {/* center-align icon */}
  </button>
  <button
    onClick={() => onApplyStyle('textAlign', 'end')}
    className={...}
  >
    <svg ... />  {/* right-align icon */}
  </button>
</div>
```

- [ ] **Step 3: Add width input**

After the margin input, before the divider:

```tsx
<label className="flex items-center gap-1 text-[#a1a1aa] text-xs" title="Width">
  <span>W</span>
  <input
    type="number"
    value={cssPx(s.width) || ''}
    onChange={(e) => onApplyStyle('width', e.target.value + 'px')}
    className="w-14 px-1 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[#e4e4e7] text-[11px] text-center [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
    title="Container width (px)"
    min={0}
  />
</label>
```

- [ ] **Step 4: Add delete (trash) button**

Replace or add a trash icon button next to the edit/download/copy buttons. Place it before the group:

```tsx
function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
```

Add to toolbar buttons row:
```tsx
<button
  onClick={onDelete}
  className="flex items-center justify-center w-7 h-7 text-[#a1a1aa] hover:text-red-400 hover:bg-[#27272a] rounded-md transition-colors"
  title="Delete element"
>
  <TrashIcon />
</button>
```

- [ ] **Step 5: Build and verify**

Run: `pnpm run build` in `apps/web`

Expected: build succeeds

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/PreviewToolbar.tsx
git commit -m "feat: add align buttons, width input, delete button to preview toolbar"
```

---

### Task 4: Update `preview/[id]/page.tsx` — keyboard shortcuts and delete

**Files:**
- Modify: `apps/web/app/(dashboard)/preview/[id]/page.tsx`

**Consumes:** `HtmlPreviewHandle` ref with `undo`/`redo`/`deleteElement` methods

**Produces:** Preview page that handles Ctrl+Z, Ctrl+Y, Delete keyboard shortcuts

**Interfaces:**
- Consumes: previewRef (HtmlPreviewHandle), selectedElement state
- Produces: keyboard event listeners

- [ ] **Step 1: Add `useEffect` for keyboard shortcuts**

Add `useEffect` that sets up a `keydown` listener on `document`:

```typescript
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') {
        e.preventDefault();
        previewRef.current?.undo();
      }
      if (e.key === 'y') {
        e.preventDefault();
        previewRef.current?.redo();
      }
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Only handle if no input/textarea is focused
      const tag = document.activeElement?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        previewRef.current?.deleteElement();
      }
    }
  }
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

- [ ] **Step 2: Build and verify**

Run: `pnpm run build` in `apps/web`

Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(dashboard\)/preview/\[id\]/page.tsx
git commit -m "feat: add Ctrl+Z/Y undo/redo and Delete key to preview page"
```

---

### Task 5: Update `LandingCards.tsx` — fix unused state if needed

**Files:**
- Modify: `apps/web/components/LandingCards.tsx`

**Note:** This file was previously updated during the routing changes and should already work correctly. Just verify no issues.

- [ ] **Step 1: Verify file compiles correctly**

Run: `pnpm run build` in `apps/web`

Expected: build succeeds

- [ ] **Step 2: Commit if changed**

```bash
git add apps/web/components/LandingCards.tsx
git commit -m "chore: verify LandingCards compiles cleanly"
```

---

## Execution Order

1. Task 1 — create clean editor-iframe.ts script
2. Task 2 — refactor HtmlPreview to use it and expand handle
3. Task 3 — update PreviewToolbar with new controls
4. Task 4 — add keyboard shortcuts in preview page
5. Task 5 — verify LandingCards

## Self-Review Against Spec

- [ ] Hover highlight — yes, Task 1 editor script has mouseover/mouseout handlers
- [ ] Change color — yes, existing (fix buggy defaultValue → value in Task 3) or Task 2
- [ ] Align (start/center/end) — yes, Task 3 adds textAlign buttons
- [ ] Padding — yes, existing (fix in Task 2)
- [ ] Container width — yes, Task 3 adds width input
- [ ] Undo/Redo (Ctrl+Z/Y) — yes, Task 1 editor script has undo/redo stacks, Task 4 forwards keyboard
- [ ] Delete (Del key) — yes, Task 1 editor script has delete, Task 4 forwards keyboard

All 7 scopes covered.
