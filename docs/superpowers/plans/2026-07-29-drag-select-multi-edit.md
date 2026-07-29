# Drag-Select + Multi-Element Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add marquee drag selection, Ctrl/Cmd+click multi-select, and bulk style editing to the HTML preview editor.

**Architecture:** The iframe script (`editor-iframe.ts`) manages all selection state and DOM operations. Parent React components receive selection updates via `postMessage` and pass user actions back. Four files modified total.

**Tech Stack:** TypeScript, React, vanilla DOM scripting (iframe), `postMessage` API

## Global Constraints

- No new dependencies
- Follow existing code style (no comments, minimal abstractions)
- `editor-iframe.ts` is a string-returning function — all code inside must be valid JS within a `<script>` tag
- The iframe is sandboxed (`allow-scripts` only) — no `srcdoc`, content is passed via `srcDoc` prop

---

## File Map

| File | Responsibility |
|------|---------------|
| `apps/web/components/editor-iframe.ts` | Selection state, marquee UI, bulk style/delete, batch undo/redo, select-all |
| `apps/web/components/HtmlPreview.tsx` | Message bridge between iframe and React, exposed handle methods |
| `apps/web/components/PreviewToolbar.tsx` | Toolbar UI — shows shared style controls for multi-select |
| `apps/web/app/(dashboard)/preview/[id]/page.tsx` | Page-level state for selected elements, keyboard shortcuts |

---

### Task 1: Rewrite `editor-iframe.ts` — Multi-Select Engine

**Files:**
- Modify: `apps/web/components/editor-iframe.ts` (full rewrite of the inner script)

**Interfaces:**
- Consumes: None (self-contained)
- Produces: Posts `element-selected` (with `elements` array), `selection-cleared`, `style-updated` messages to parent

- [ ] **Step 1: Replace single-select state with multi-select state**

In `apps/web/components/editor-iframe.ts`, replace the inner script content. Change the state variables from:

```js
var selectedEl=null;
```

To:

```js
var selectedEls=[];
var marqueeEl=null;
var isDragging=false;
var dragStartX=0;
var dragStartY=0;
var batchId=0;
```

- [ ] **Step 2: Rewrite `deselect()` to clear all selected elements**

Replace the `deselect` function:

```js
function deselect(){
  for(var i=0;i<selectedEls.length;i++){
    selectedEls[i].style.outline='';
    selectedEls[i].style.outlineOffset='';
  }
  selectedEls=[];
}
```

- [ ] **Step 3: Add `highlightSelected()` helper**

```js
function highlightSelected(){
  for(var i=0;i<selectedEls.length;i++){
    selectedEls[i].style.outline='2px solid #8b5cf6';
    selectedEls[i].style.outlineOffset='2px';
  }
}
```

- [ ] **Step 4: Add `isClickable(el)` filter**

```js
function isClickable(el){
  if(!el||!el.tagName)return false;
  var tag=el.tagName.toLowerCase();
  if(tag==='html'||tag==='head'||tag==='body'||tag==='script')return false;
  if(el===marqueeEl)return false;
  return true;
}
```

- [ ] **Step 5: Add `getClickableElements()` to gather all elements**

```js
function getClickableElements(){
  var all=document.querySelectorAll('*');
  var result=[];
  for(var i=0;i<all.length;i++){
    if(isClickable(all[i]))result.push(all[i]);
  }
  return result;
}
```

- [ ] **Step 6: Add rect intersection check**

```js
function rectsIntersect(a,b){
  return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
}
```

- [ ] **Step 7: Add `findDeepestElements(els)` to filter nested parents**

```js
function findDeepestElements(els){
  var result=[];
  for(var i=0;i<els.length;i++){
    var isParent=false;
    for(var j=0;j<els.length;j++){
      if(i!==j&&els[i].contains(els[j])){
        isParent=true;
        break;
      }
    }
    if(!isParent)result.push(els[i]);
  }
  return result;
}
```

- [ ] **Step 8: Add `fireSelected()` for multi-select**

Replace the existing `fireSelected`:

```js
function fireSelected(){
  var infos=[];
  for(var i=0;i<selectedEls.length;i++){
    var el=selectedEls[i];
    var s=getComputedStyle(el);
    infos.push({
      tag:el.tagName.toLowerCase(),
      classes:el.className,
      styles:{
        color:s.color,
        backgroundColor:s.backgroundColor,
        paddingTop:s.paddingTop,
        paddingRight:s.paddingRight,
        paddingBottom:s.paddingBottom,
        paddingLeft:s.paddingLeft,
        marginTop:s.marginTop,
        marginRight:s.marginRight,
        marginBottom:s.marginBottom,
        marginLeft:s.marginLeft,
        width:s.width,
        height:s.height,
        textAlign:s.textAlign,
        fontSize:s.fontSize,
        fontWeight:s.fontWeight
      }
    });
  }
  window.parent.postMessage({
    type:'element-selected',
    elements:infos
  },'*');
}
```

- [ ] **Step 9: Add marquee creation and update functions**

```js
function createMarquee(x,y){
  marqueeEl=document.createElement('div');
  marqueeEl.style.cssText='position:fixed;border:1px dashed rgba(139,92,246,0.6);background:rgba(139,92,246,0.1);pointer-events:none;z-index:99999;';
  marqueeEl.style.left=x+'px';
  marqueeEl.style.top=y+'px';
  marqueeEl.style.width='0px';
  marqueeEl.style.height='0px';
  document.body.appendChild(marqueeEl);
}

function updateMarquee(x,y){
  if(!marqueeEl)return;
  var minX=Math.min(dragStartX,x);
  var minY=Math.min(dragStartY,y);
  var maxX=Math.max(dragStartX,x);
  var maxY=Math.max(dragStartY,y);
  marqueeEl.style.left=minX+'px';
  marqueeEl.style.top=minY+'px';
  marqueeEl.style.width=(maxX-minX)+'px';
  marqueeEl.style.height=(maxY-minY)+'px';
}

function removeMarquee(){
  if(marqueeEl&&marqueeEl.parentNode){
    marqueeEl.parentNode.removeChild(marqueeEl);
  }
  marqueeEl=null;
}
```

- [ ] **Step 10: Rewrite the click handler for multi-select**

Replace the existing `document.addEventListener('click',...)`:

```js
document.addEventListener('click',function(e){
  e.stopPropagation();
  var el=e.target;
  if(!isClickable(el))return;
  clearHover();
  if(e.ctrlKey||e.metaKey){
    var idx=selectedEls.indexOf(el);
    if(idx>=0){
      el.style.outline='';
      el.style.outlineOffset='';
      selectedEls.splice(idx,1);
      if(selectedEls.length===0){
        window.parent.postMessage({type:'selection-cleared'},'*');
      }else{
        fireSelected();
      }
    }else{
      selectedEls.push(el);
      el.style.outline='2px solid #8b5cf6';
      el.style.outlineOffset='2px';
      fireSelected();
    }
  }else{
    deselect();
    selectedEls=[el];
    el.style.outline='2px solid #8b5cf6';
    el.style.outlineOffset='2px';
    fireSelected();
  }
});
```

- [ ] **Step 11: Add mousedown handler to start drag**

```js
document.addEventListener('mousedown',function(e){
  if(e.target===marqueeEl)return;
  if(e.ctrlKey||e.metaKey)return;
  if(!isClickable(e.target)){
    dragStartX=e.clientX;
    dragStartY=e.clientY;
    isDragging=true;
  }
});
```

- [ ] **Step 12: Add mousemove handler to draw marquee**

```js
document.addEventListener('mousemove',function(e){
  if(!isDragging)return;
  var dx=e.clientX-dragStartX;
  var dy=e.clientY-dragStartY;
  if(!marqueeEl&&(Math.abs(dx)>5||Math.abs(dy)>5)){
    createMarquee(dragStartX,dragStartY);
  }
  if(marqueeEl){
    updateMarquee(e.clientX,e.clientY);
  }
});
```

- [ ] **Step 13: Add mouseup handler to finish drag selection**

```js
document.addEventListener('mouseup',function(e){
  if(!isDragging)return;
  isDragging=false;
  if(marqueeEl){
    var mRect={
      left:Math.min(dragStartX,e.clientX),
      top:Math.min(dragStartY,e.clientY),
      right:Math.max(dragStartX,e.clientX),
      bottom:Math.max(dragStartY,e.clientY)
    };
    var allEls=getClickableElements();
    var found=[];
    for(var i=0;i<allEls.length;i++){
      var bcr=allEls[i].getBoundingClientRect();
      if(rectsIntersect(mRect,bcr)){
        found.push(allEls[i]);
      }
    }
    removeMarquee();
    deselect();
    var deepest=findDeepestElements(found);
    selectedEls=deepest;
    highlightSelected();
    if(selectedEls.length>0){
      fireSelected();
    }else{
      window.parent.postMessage({type:'selection-cleared'},'*');
    }
  }
});
```

- [ ] **Step 14: Update the keydown handler**

Replace the existing keydown handler:

```js
document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&e.key==='a'){
    e.preventDefault();
    deselect();
    selectedEls=getClickableElements();
    highlightSelected();
    fireSelected();
  }
  if(e.key==='Escape'){
    deselect();
    window.parent.postMessage({type:'selection-cleared'},'*');
  }
  if((e.key==='Delete'||e.key==='Backspace')&&selectedEls.length>0){
    e.preventDefault();
    deleteSelected();
  }
});
```

- [ ] **Step 15: Rewrite the message handler for bulk ops**

Replace the existing `window.addEventListener('message',...)`:

```js
window.addEventListener('message',function(e){
  var data=e.data;
  if(!data)return;

  if(data.type==='apply-style'){
    if(selectedEls.length===0)return;
    batchId++;
    for(var i=0;i<selectedEls.length;i++){
      var el=selectedEls[i];
      var oldValue=el.style[data.property];
      undoStack.push({element:el,property:data.property,oldValue:oldValue,batchId:batchId});
      el.style[data.property]=data.value;
    }
    redoStack=[];
    var s=getComputedStyle(selectedEls[selectedEls.length-1]);
    window.parent.postMessage({type:'style-updated',property:data.property,value:parseRgbToHex(s[data.property])},'*');
  }

  if(data.type==='delete-element'){
    deleteSelected();
  }

  if(data.type==='undo'){
    if(undoStack.length===0)return;
    var lastBatch=undoStack[undoStack.length-1].batchId;
    var entries=[];
    while(undoStack.length>0&&undoStack[undoStack.length-1].batchId===lastBatch){
      entries.push(undoStack.pop());
    }
    for(var i=0;i<entries.length;i++){
      var entry=entries[i];
      if(entry.property==='__delete__'){
        if(entry.nextSibling&&entry.nextSibling.parentNode){
          entry.nextSibling.parentNode.insertBefore(entry.element,entry.nextSibling);
        }else if(entry.parentNode){
          entry.parentNode.appendChild(entry.element);
        }
      }else{
        var currentValue=entry.element.style[entry.property];
        redoStack.push({element:entry.element,property:entry.property,oldValue:currentValue,batchId:lastBatch});
        entry.element.style[entry.property]=entry.oldValue;
      }
    }
    if(entries.length>0&&entries[0].property!=='__delete__'){
      var s2=getComputedStyle(entries[0].element);
      window.parent.postMessage({type:'style-updated',property:entries[0].property,value:parseRgbToHex(s2[entries[0].property])},'*');
    }
  }

  if(data.type==='redo'){
    if(redoStack.length===0)return;
    var lastBatch=redoStack[redoStack.length-1].batchId;
    var entries=[];
    while(redoStack.length>0&&redoStack[redoStack.length-1].batchId===lastBatch){
      entries.push(redoStack.pop());
    }
    for(var i=0;i<entries.length;i++){
      var entry=entries[i];
      var currentValue=entry.element.style[entry.property];
      undoStack.push({element:entry.element,property:entry.property,oldValue:currentValue,batchId:lastBatch});
      entry.element.style[entry.property]=entry.oldValue;
    }
    var s3=getComputedStyle(entries[0].element);
    window.parent.postMessage({type:'style-updated',property:entries[0].property,value:parseRgbToHex(s3[entries[0].property])},'*');
  }
});
```

- [ ] **Step 16: Add `deleteSelected()` function**

```js
function deleteSelected(){
  if(selectedEls.length===0)return;
  batchId++;
  for(var i=0;i<selectedEls.length;i++){
    var el=selectedEls[i];
    undoStack.push({
      element:el,
      property:'__delete__',
      oldValue:null,
      nextSibling:el.nextSibling,
      parentNode:el.parentNode,
      batchId:batchId
    });
    el.remove();
  }
  selectedEls=[];
  window.parent.postMessage({type:'selection-cleared'},'*');
}
```

- [ ] **Step 17: Update the existing `undoStack` and `redoStack` declarations**

Ensure these are declared at the top of the IIFE (they should already exist from the original code, but now the undo entries have the `batchId` field):

```js
var undoStack=[];
var redoStack=[];
```

- [ ] **Step 18: Verify the full script is syntactically correct**

Read the file and confirm all braces, parentheses, and string interpolation are balanced. The `getEditorScript()` function should return a valid `<script>` tag.

- [ ] **Step 19: Commit**

```bash
git add apps/web/components/editor-iframe.ts
git commit -m "feat: multi-select engine with marquee, Ctrl+click, bulk ops"
```

---

### Task 2: Update `HtmlPreview.tsx` — Message Bridge

**Files:**
- Modify: `apps/web/components/HtmlPreview.tsx`

**Interfaces:**
- Consumes: Posts `element-selected` (with `elements` array), `selection-cleared`, `style-updated` from iframe
- Produces: `HtmlPreviewHandle` with `applyStyleMulti(property, value)`, `deleteMulti()`; `onElementSelect(elements: ElementInfo[] | null)` callback

- [ ] **Step 1: Update `ElementInfo` and `HtmlPreviewHandle` types**

Replace the existing type definitions:

```typescript
export interface ElementInfo {
  tag: string;
  classes: string;
  styles: Record<string, string>;
}

export interface HtmlPreviewHandle {
  applyStyleMulti: (property: string, value: string) => void;
  undo: () => void;
  redo: () => void;
  deleteMulti: () => void;
}
```

- [ ] **Step 2: Update `HtmlPreviewProps`**

```typescript
interface HtmlPreviewProps {
  html?: string;
  onElementSelect?: (elements: ElementInfo[] | null) => void;
  onStyleUpdated?: (property: string, value: string) => void;
}
```

- [ ] **Step 3: Update `useImperativeHandle` to use new method names**

Replace the existing `useImperativeHandle`:

```typescript
useImperativeHandle(ref, () => ({
  applyStyleMulti: (property: string, value: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'apply-style', property, value },
      '*'
    );
  },
  undo: () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'undo' }, '*');
  },
  redo: () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'redo' }, '*');
  },
  deleteMulti: () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'delete-element' }, '*');
  },
}));
```

- [ ] **Step 4: Update the message listener for multi-select**

Replace the existing `useEffect` message handler:

```typescript
useEffect(() => {
  const handler = (e: MessageEvent) => {
    if (e.data && e.data.type === 'element-selected') {
      onElementSelect?.(e.data.elements);
    }
    if (e.data && e.data.type === 'style-updated') {
      onStyleUpdated?.(e.data.property, e.data.value);
    }
    if (e.data && e.data.type === 'selection-cleared') {
      onElementSelect?.(null);
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, [onElementSelect, onStyleUpdated]);
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/HtmlPreview.tsx
git commit -m "feat: update HtmlPreview for multi-select message protocol"
```

---

### Task 3: Update `PreviewToolbar.tsx` — Multi-Element UI

**Files:**
- Modify: `apps/web/components/PreviewToolbar.tsx`

**Interfaces:**
- Consumes: `selectedElements: ElementInfo[]`, `onApplyStyle(property, value)`, `onDelete()`
- Produces: Renders shared style controls, shows element count badge

- [ ] **Step 1: Update `PreviewToolbarProps`**

Replace the existing interface:

```typescript
export interface ElementInfo {
  tag: string;
  classes: string;
  styles: Record<string, string>;
}

interface PreviewToolbarProps {
  selectedElements: ElementInfo[];
  onApplyStyle: (property: string, value: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onCopy?: () => void;
}
```

- [ ] **Step 2: Update the component to read from first element**

Replace the first line of the component body:

```typescript
export function PreviewToolbar({
  selectedElements,
  onApplyStyle,
  onDelete,
  onEdit,
  onDownload,
  onCopy,
}: PreviewToolbarProps) {
  const first = selectedElements[0];
  const s = first?.styles;
  const count = selectedElements.length;
```

- [ ] **Step 3: Update the toolbar header to show multi-select badge**

Replace the `{selectedElement && s ? (` conditional block start:

```typescript
{count > 0 && s ? (
  <>
    <span className="px-1.5 py-0.5 rounded bg-[#27272a] text-[#a1a1aa] text-[11px] font-mono leading-none">
      &lt;{first.tag}&gt;
    </span>

    {count > 1 && (
      <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[11px] font-mono leading-none">
        &times;{count}
      </span>
    )}
```

- [ ] **Step 4: Update the width input to read from first element**

The width input at the bottom already reads from `s.width`, which now reads from the first selected element. No change needed — verify it renders correctly.

- [ ] **Step 5: Verify all style controls still reference `s` (which is now `first?.styles`)**

Read through the full component. Every reference to `selectedElement.styles` should now work through `s = first?.styles`. The controls read from `s` and write via `onApplyStyle` which applies to all. No additional changes needed.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/PreviewToolbar.tsx
git commit -m "feat: PreviewToolbar supports multi-element selection display"
```

---

### Task 4: Update `preview/[id]/page.tsx` — Page State

**Files:**
- Modify: `apps/web/app/(dashboard)/preview/[id]/page.tsx`

**Interfaces:**
- Consumes: `HtmlPreview` with `applyStyleMulti`, `deleteMulti`; `onElementSelect(elements)`
- Produces: Manages `selectedElements: ElementInfo[]` state, keyboard shortcuts for multi-select

- [ ] **Step 1: Update state from single to array**

Replace:

```typescript
const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
```

With:

```typescript
const [selectedElements, setSelectedElements] = useState<ElementInfo[]>([]);
```

- [ ] **Step 2: Update `handleElementSelect` callback**

Replace:

```typescript
const handleElementSelect = useCallback((info: ElementInfo | null) => {
  setSelectedElement(info);
}, []);
```

With:

```typescript
const handleElementSelect = useCallback((elements: ElementInfo[] | null) => {
  setSelectedElements(elements ?? []);
}, []);
```

- [ ] **Step 3: Update `handleStyleUpdated` callback**

Replace:

```typescript
const handleStyleUpdated = useCallback((property: string, value: string) => {
  setSelectedElement((prev) => {
    if (!prev) return prev;
    return { ...prev, styles: { ...prev.styles, [property]: value } };
  });
}, []);
```

With:

```typescript
const handleStyleUpdated = useCallback((property: string, value: string) => {
  setSelectedElements((prev) =>
    prev.map((el) => ({ ...el, styles: { ...el.styles, [property]: value } }))
  );
}, []);
```

- [ ] **Step 4: Update `handleApplyStyle` to use `applyStyleMulti`**

Replace:

```typescript
const handleApplyStyle = useCallback((property: string, value: string) => {
  previewRef.current?.applyStyle(property, value);
  setSelectedElement((prev) => {
    if (!prev) return prev;
    return { ...prev, styles: { ...prev.styles, [property]: value } };
  });
}, []);
```

With:

```typescript
const handleApplyStyle = useCallback((property: string, value: string) => {
  previewRef.current?.applyStyleMulti(property, value);
  setSelectedElements((prev) =>
    prev.map((el) => ({ ...el, styles: { ...el.styles, [property]: value } }))
  );
}, []);
```

- [ ] **Step 5: Update `handleDelete` to use `deleteMulti`**

Replace:

```typescript
const handleDelete = useCallback(() => {
  previewRef.current?.deleteElement();
}, []);
```

With:

```typescript
const handleDelete = useCallback(() => {
  previewRef.current?.deleteMulti();
}, []);
```

- [ ] **Step 6: Update keyboard shortcuts for multi-select**

Replace the existing `useEffect` for keyboard shortcuts:

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
      const tag = document.activeElement?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        previewRef.current?.deleteMulti();
      }
    }
  }
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

- [ ] **Step 7: Update the `PreviewToolbar` usage**

Replace:

```typescript
<PreviewToolbar
  selectedElement={selectedElement}
  onApplyStyle={handleApplyStyle}
  onDelete={handleDelete}
/>
```

With:

```typescript
<PreviewToolbar
  selectedElements={selectedElements}
  onApplyStyle={handleApplyStyle}
  onDelete={handleDelete}
/>
```

- [ ] **Step 8: Verify the `HtmlPreview` callback props**

The `HtmlPreview` component now expects `onElementSelect` to accept an array. The `handleElementSelect` callback already handles this. Verify the JSX:

```typescript
<HtmlPreview
  ref={previewRef}
  onElementSelect={handleElementSelect}
  onStyleUpdated={handleStyleUpdated}
/>
```

- [ ] **Step 9: Run TypeScript check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 10: Commit**

```bash
git add apps/web/app/\(dashboard\)/preview/\[id\]/page.tsx
git commit -m "feat: preview page supports multi-select state and bulk ops"
```

---

### Task 5: Integration Test

**Files:**
- None (manual verification)

- [ ] **Step 1: Start the dev server**

```bash
cd apps/web && npm run dev
```

- [ ] **Step 2: Open the preview page in browser**

Navigate to a preview page and verify:

- Single click selects one element (purple outline)
- Ctrl/Cmd+click toggles elements in/out of selection
- Drag on empty area draws a marquee rectangle
- Marquee release selects all enclosed elements (purple outlines)
- Toolbar shows `<tag>` badge for single select
- Toolbar shows `<tag> ×N` badge for multi-select
- Changing color/padding/margin/alignment applies to all selected
- Delete removes all selected elements
- Ctrl+Z undoes the last bulk operation
- Ctrl+Y redoes it
- Escape clears selection
- Ctrl+A selects all elements

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add -A && git commit -m "fix: integration fixes for multi-select"
```
