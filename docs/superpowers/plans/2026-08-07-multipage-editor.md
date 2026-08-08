# Multi-page Editing (Inspect Mode) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-page editing to the preview editor's inspect mode: an "+ Add page" overlay button that appends empty pages below the content, and the ability to move elements from page 1 onto new pages — by dragging them across a page-boundary divider, or via a "Move to page" dropdown in the properties sidebar.

**Architecture:** Pages are real, persisted `data-klone-page-boundary` elements inserted into the content container (`.scroll-wrapper` or `body`), zero-height and invisible in preview mode. In inspect mode the iframe script draws a dashed divider + "Page N starts here" chip at each boundary (with × to remove). Moving an element across a boundary reparents it with transform compensation so its visual position is preserved. PDF export converts each boundary into `break-before: page`. All logic lives in the existing vanilla-JS iframe script (`editor-iframe.ts`) plus the existing message bridge (`HtmlPreview.tsx`); the parent adds UI (button + sidebar section).

**Tech Stack:** Next.js 16 / React 19 (parent), vanilla ES5-style JS in a sandboxed iframe (message-protocol based), Tailwind CSS 4, no new dependencies.

## Global Constraints

- **Never commit or push to git** (repo policy in `AGENTS.md`). Workflow steps that say "commit" are SKIPPED — leave all changes as uncommitted working-tree files.
- The iframe script is a template literal in `editor-iframe.ts` — new code MUST be ES5-style (`var`, `function`), with **no backticks, no `${}`, no arrow functions** (matches existing code).
- Follow the existing message-protocol pattern (`window.parent.postMessage({type:...},'*')`, deduped reporting).
- Boundaries are system-level elements: NEVER selectable, hoverable, draggable, resizable, or deletable via selection; excluded from marquee and Ctrl+A.
- Existing PDF split mode (`data-klone-page-break`) is untouched and keeps working (approved scope: "keep both").
- Spec: `docs/superpowers/specs/2026-08-07-multipage-editor-design.md`.
- Verification is manual (dev server + browser) — the iframe script has no unit-test harness in this repo.

---

### Task 1: Page-boundary core + inspect-mode dividers (iframe script)

**Files:**
- Modify: `apps/web/components/editor/editor-iframe.ts`

**Interfaces:**
- Produces (used by Tasks 2–6):
  - `getPageBoundaryEls()` → `Element[]` (live query of `[data-klone-page-boundary]`)
  - `getContentContainer()` → `Element` (`.scroll-wrapper` or `body`)
  - `countPages()` → `number` (boundaries + 1)
  - `reportPages(changed: boolean)` → posts `{type:'pages-changed', count, changed}`
  - `isPageBoundary(el)` → `boolean`
  - `addPageBoundary(record, sharedBatchId?)` — appends boundary, optional undo entry
  - `removePageBoundary(boundary, record, sharedBatchId?)` — removes, optional undo entry
  - `updateBoundaryMarkers()` — rebuilds `[data-editor-ui="page-boundary-marker"]` overlays
  - Undo entry type `__page_boundary__`: `{property, element, adding, nextSibling, parentNode, batchId}`
  - New state var `lastReportedPageCount` (init `-1`)

- [ ] **Step 1: Add boundary primitives after the page-break section**

Anchor: the end of `function setSplitMode(enabled){...}` (ends with `updatePageBreakMarkers();\n}`), insert this block right after it:

```js
// ── Pages ──
// A "page" is a zero-height structural element (data-klone-page-boundary)
// in the content container. Content above the first boundary = page 1;
// between boundaries = page N; after the last boundary = the last page.
// Boundaries are system-level: never selectable/hoverable/draggable.
function isPageBoundary(el){
  return !!(el&&el.getAttribute&&el.getAttribute('data-klone-page-boundary')!==null);
}

function getPageBoundaryEls(){
  var list=document.querySelectorAll('[data-klone-page-boundary]');
  var result=[];
  for(var i=0;i<list.length;i++)result.push(list[i]);
  return result;
}

function getContentContainer(){
  var wrap=document.querySelector('.scroll-wrapper');
  return wrap||document.body;
}

function countPages(){
  return getPageBoundaryEls().length+1;
}

var lastReportedPageCount=-1;
function reportPages(changed){
  var count=countPages();
  if(count===lastReportedPageCount&&!changed)return; // nothing new to report
  lastReportedPageCount=count;
  window.parent.postMessage({type:'pages-changed',count:count,changed:!!changed},'*');
}

// Append a new empty page at the end of the document.
function addPageBoundary(record,sharedBatchId){
  var container=getContentContainer();
  if(!container)return;
  var b=document.createElement('div');
  b.setAttribute('data-klone-page-boundary','');
  // Inline styles guarantee the boundary never affects layout: block (so
  // no template `div { display:inline }` rule can collapse it), 0 height,
  // no margins/padding/border.
  b.style.cssText='display:block;height:0;margin:0;padding:0;border:0;';
  if(record){
    var bid=sharedBatchId||++batchId;
    undoStack.push({property:'__page_boundary__',element:b,adding:true,nextSibling:null,parentNode:container,batchId:bid});
    redoStack=[];
  }
  container.appendChild(b);
  updateBoundaryMarkers();
  reportPages(true);
}

// Remove a boundary (merges the page below into the page above).
function removePageBoundary(boundary,record,sharedBatchId){
  if(!boundary||!boundary.isConnected)return;
  var parent=boundary.parentNode;
  if(record){
    var bid=sharedBatchId||++batchId;
    undoStack.push({property:'__page_boundary__',element:boundary,adding:false,nextSibling:boundary.nextSibling,parentNode:parent,batchId:bid});
    redoStack=[];
  }
  boundary.remove();
  updateBoundaryMarkers();
  reportPages(true);
}
```

- [ ] **Step 2: Add the inspect-mode divider overlay**

Insert right after `removePageBoundary` (same block region):

```js
function createPageBoundaryMarker(boundary,pageNum){
  var marker=document.createElement('div');
  marker.setAttribute('data-editor-ui','page-boundary-marker');
  marker.style.cssText='position:fixed;left:0;top:0;height:0;border-top:1px dashed rgba(255,255,255,0.35);pointer-events:none;z-index:99995;display:none;';
  var chip=document.createElement('div');
  chip.style.cssText='position:absolute;top:-22px;right:8px;display:flex;align-items:center;gap:6px;padding:3px 6px 3px 8px;border-radius:4px;background:#2a2a2c;border:1px solid #3f3f46;color:#e4e4e7;font:600 10px/1.2 Arial,sans-serif;white-space:nowrap;pointer-events:auto;box-shadow:0 2px 6px rgba(0,0,0,.28);';
  var label=document.createElement('span');
  label.textContent='Page '+pageNum+' starts here';
  chip.appendChild(label);
  var removeBtn=document.createElement('button');
  removeBtn.setAttribute('data-action','remove-boundary');
  removeBtn.textContent='×';
  removeBtn.title='Remove page break (merge with previous page)';
  removeBtn.style.cssText='border:0;background:transparent;color:#a1a1aa;font:600 12px/1 Arial,sans-serif;cursor:pointer;padding:0 2px;';
  chip.appendChild(removeBtn);
  marker.appendChild(chip);
  document.body.appendChild(marker);
  return marker;
}

function updateBoundaryMarkers(){
  // Rebuild every marker from the live boundaries so deletes/undo/redo can
  // never leave a stale overlay behind. Only shown in inspect mode.
  var old=document.querySelectorAll('[data-editor-ui="page-boundary-marker"]');
  for(var i=0;i<old.length;i++)old[i].remove();
  if(!inspectEnabled)return;
  var container=getContentContainer();
  if(!container)return;
  var cr=container.getBoundingClientRect();
  var boundaries=getPageBoundaryEls();
  for(var j=0;j<boundaries.length;j++){
    var b=boundaries[j];
    if(!b||!b.isConnected)continue;
    var marker=createPageBoundaryMarker(b,j+2); // boundary j starts page j+2
    var r=b.getBoundingClientRect();
    marker.style.display='block';
    marker.style.left=Math.round(cr.left)+'px';
    marker.style.width=Math.round(cr.width)+'px';
    marker.style.top=Math.round(r.top)+'px';
  }
}
```

- [ ] **Step 3: Exclude boundaries from selection**

In `isClickable(el)`, right after the `data-editor-ui` check, add:

```js
  if(el.getAttribute&&el.getAttribute('data-klone-page-boundary')!==null)return false;
```

Also guard the split-mode click handler (so clicking × on a boundary chip while split mode is on never toggles a PDF break on the chip). In `document.addEventListener('click',function(e){` — the FIRST (splitMode) handler, right after `if(splitMode){`, add:

```js
    // The × on a page-boundary chip is handled by its own listener.
    if(e.target&&e.target.getAttribute&&e.target.getAttribute('data-action')==='remove-boundary')return;
```

- [ ] **Step 4: Delegated × handler for boundary removal**

Add a new `document.addEventListener('click', ...)` right AFTER the existing main click handler's closing `});` (the one that ends with the single-select `selectedEls=[el]; fireSelected();` block):

```js
// Remove a page boundary from its divider chip (×). Runs as a separate
// listener; the split/main click handlers already ignore data-editor-ui
// targets and the data-action guard.
document.addEventListener('click',function(e){
  var t=e.target;
  if(!t||!t.getAttribute||t.getAttribute('data-action')!=='remove-boundary')return;
  e.preventDefault();
  e.stopPropagation();
  var marker=t.closest?t.closest('[data-editor-ui="page-boundary-marker"]'):null;
  var markers=document.querySelectorAll('[data-editor-ui="page-boundary-marker"]');
  var idx=marker?Array.prototype.indexOf.call(markers,marker):-1;
  var boundaries=getPageBoundaryEls();
  if(idx>=0&&boundaries[idx])removePageBoundary(boundaries[idx],true);
});
```

- [ ] **Step 5: Undo/redo branches for `__page_boundary__`**

In `performUndo()`, inside the `for` loop, after the `__page_break__` branch (the `}else if(entry.property==='__page_break__'){...}` block) and BEFORE the `__text__` branch, add:

```js
    }else if(entry.property==='__page_boundary__'){
      // Reverse the boundary op: an added boundary is removed, a removed
      // one is restored at its original position.
      redoStack.push({property:'__page_boundary__',element:entry.element,adding:!entry.adding,nextSibling:entry.nextSibling,parentNode:entry.parentNode,batchId:lastBatch});
      if(entry.adding){
        entry.element.remove();
      }else if(entry.parentNode){
        if(entry.nextSibling&&entry.nextSibling.parentNode)entry.nextSibling.parentNode.insertBefore(entry.element,entry.nextSibling);
        else entry.parentNode.appendChild(entry.element);
      }
      updateBoundaryMarkers();
      reportPages(true);
    }
```

In `performRedo()`, after the `__page_break__` branch and before the `__text__` branch, add:

```js
    }else if(entry.property==='__page_boundary__'){
      undoStack.push({property:'__page_boundary__',element:entry.element,adding:!entry.adding,nextSibling:entry.nextSibling,parentNode:entry.parentNode,batchId:lastBatch});
      if(entry.adding){
        if(entry.parentNode){
          if(entry.nextSibling&&entry.nextSibling.parentNode)entry.nextSibling.parentNode.insertBefore(entry.element,entry.nextSibling);
          else entry.parentNode.appendChild(entry.element);
        }
      }else{
        entry.element.remove();
      }
      updateBoundaryMarkers();
      reportPages(true);
    }
```

- [ ] **Step 6: Init detection + marker refresh on resize/scroll + report**

In the init section, after the existing lines:

```js
ensureSystemFrame();
updatePageBreakMarkers();
reportPageBreak(false);
```

add:

```js
updateBoundaryMarkers();
reportPages(false);
```

Replace the existing resize/scroll listeners:

```js
window.addEventListener('resize',function(){updateSelectionBox();updatePageBreakMarkers();});
window.addEventListener('scroll',function(){updateSelectionBox();updatePageBreakMarkers();},true);
```

with:

```js
window.addEventListener('resize',function(){updateSelectionBox();updatePageBreakMarkers();updateBoundaryMarkers();});
window.addEventListener('scroll',function(){updateSelectionBox();updatePageBreakMarkers();updateBoundaryMarkers();},true);
```

- [ ] **Step 7: Verify**

1. Run `pnpm --filter web dev`, open `http://localhost:3000/preview/blank`, press **V** to enter inspect mode.
2. In the parent-page console run:
   ```js
   document.querySelector('iframe').contentWindow.postMessage({type:'add-page'},'*')
   ```
   Expected: a dashed divider with chip "Page 2 starts here" appears at the bottom of the document; no layout shift (page 1 looks identical).
3. Click the **×** on the chip → divider disappears. Ctrl+Z → divider returns; Ctrl+Shift+Z → gone again.
4. Click directly on the divider/chip → nothing gets selected (boundaries are not clickable), selection is unchanged.
5. Scroll the canvas → chip stays glued to its boundary.

- [ ] **Step 8: No commit** — skip (per `AGENTS.md` policy; leave as working-tree changes).

---

### Task 2: Drag elements across page boundaries (iframe script)

**Files:**
- Modify: `apps/web/components/editor/editor-iframe.ts`

**Interfaces:**
- Consumes: `getPageBoundaryEls()`, `getContentContainer()`, `isContainer(el)`, `isPageBoundary(el)`, `getTranslate(el)`, `countPages()` (Task 1)
- Produces: `reparentElementToPage(el, pageIndex, bid)` — moves `el` to the end of page `pageIndex` (0-based) with transform compensation; pushes a `__reparent__` undo entry when `bid > 0`; skips the entry when the element is already at that spot. Undo entry shape: `{property:'__reparent__', element, oldParent, oldNextSibling, oldTransform, newParent, newNextSibling, newTransform, batchId}`.

- [ ] **Step 1: Add the reparent helper (with transform compensation)**

Insert right after `updateBoundaryMarkers` (from Task 1):

```js
// Move `el` to the END of page `pageIndex` (0-based) inside the content
// container, preserving its visual position: the static flow position
// changes after reparenting, so the transform is compensated by exactly
// the flow shift (delta between untransformed rects before/after).
function reparentElementToPage(el,pageIndex,bid){
  var container=getContentContainer();
  if(!container||!el||!el.parentNode)return;
  var boundaries=getPageBoundaryEls();
  if(pageIndex<0)pageIndex=0;
  if(pageIndex>boundaries.length)pageIndex=boundaries.length;
  var oldParent=el.parentNode;
  var oldNextSibling=el.nextSibling;
  var oldTransform=el.style.transform||'';
  var ot=getTranslate(el);
  el.style.transform='';
  var oldRect=el.getBoundingClientRect();
  // End of page `pageIndex` = just before boundary[pageIndex], or at the
  // very end of the container for the last page.
  if(pageIndex<boundaries.length){
    container.insertBefore(el,boundaries[pageIndex]);
  }else{
    container.appendChild(el);
  }
  var newRect=el.getBoundingClientRect();
  var dx=oldRect.left-newRect.left;
  var dy=oldRect.top-newRect.top;
  var nt=(ot[0]+dx===0&&ot[1]+dy===0)?'':'translate('+(ot[0]+dx)+'px,'+(ot[1]+dy)+'px)';
  el.style.transform=nt;
  var sameSpot=(oldParent===container&&oldNextSibling===el.nextSibling);
  if(bid>0&&!sameSpot){
    undoStack.push({
      property:'__reparent__',
      element:el,
      oldParent:oldParent,
      oldNextSibling:oldNextSibling,
      oldTransform:oldTransform,
      newParent:container,
      newNextSibling:el.nextSibling,
      newTransform:nt,
      batchId:bid
    });
  }
}
```

- [ ] **Step 2: Detect boundary crossings on drag end**

In the `mouseup` handler, inside the `if(dragMoved){ ... if(isMoving){ ... } }` block — specifically right after:

```js
      if(moved)redoStack=[];
      fireSelected();
```

(inside `isMoving`), replace `fireSelected();` with the crossing logic + a trailing `fireSelected()`:

```js
      if(moved)redoStack=[];
      // ── Drag across page boundaries ──
      // Any element whose top edge crossed a boundary line is reparented
      // to the other side with transform compensation, so it stays exactly
      // where the user dropped it. Each element is evaluated on its own:
      // group members may end up on different pages.
      var boundaries=getPageBoundaryEls();
      for(var pi=0;pi<selectedEls.length;pi++){
        var pel=selectedEls[pi];
        if(isContainer(pel)||isPageBoundary(pel))continue;
        var m2=moveDeltas[pi];
        if(m2[1]===0&&m2[2]===0)continue;
        var startRect=moveRects[pi];
        var endRect=pel.getBoundingClientRect();
        var crossed=null; // {boundary, below, top}
        for(var bi=0;bi<boundaries.length;bi++){
          var bTop=boundaries[bi].getBoundingClientRect().top;
          if(startRect.top<bTop&&endRect.top>=bTop){ // crossed downward
            if(!crossed||bTop>crossed.top)crossed={boundary:boundaries[bi],below:true,top:bTop};
          }else if(startRect.top>bTop&&endRect.top<=bTop){ // crossed upward
            if(!crossed||bTop<crossed.top)crossed={boundary:boundaries[bi],below:false,top:bTop};
          }
        }
        if(crossed){
          // Boundary j starts page j+1 (0-based). Crossing down puts the
          // element on page j+1; crossing up puts it back on page j.
          var bIndex=getPageBoundaryEls().indexOf(crossed.boundary);
          var targetPage=bIndex+(crossed.below?1:0);
          reparentElementToPage(pel,targetPage,batchId);
        }
      }
      if(boundaries.length>0){
        updateBoundaryMarkers();
        reportPages(false);
      }
      fireSelected();
```

- [ ] **Step 3: Undo/redo branches for `__reparent__`**

In `performUndo()`, right after the `__page_boundary__` branch added in Task 1 and BEFORE the `__text__` branch, add:

```js
    }else if(entry.property==='__reparent__'){
      // Restore the pre-move position; push the swapped entry so redo
      // moves the element back to where the user put it.
      redoStack.push({property:'__reparent__',element:entry.element,oldParent:entry.newParent,oldNextSibling:entry.newNextSibling,oldTransform:entry.newTransform,newParent:entry.oldParent,newNextSibling:entry.oldNextSibling,newTransform:entry.oldTransform,batchId:lastBatch});
      if(entry.oldNextSibling&&entry.oldNextSibling.parentNode){
        entry.oldParent.insertBefore(entry.element,entry.oldNextSibling);
      }else if(entry.oldParent){
        entry.oldParent.appendChild(entry.element);
      }
      entry.element.style.transform=entry.oldTransform;
    }
```

In `performRedo()`, right after the `__page_boundary__` branch and BEFORE the `__text__` branch, add:

```js
    }else if(entry.property==='__reparent__'){
      undoStack.push({property:'__reparent__',element:entry.element,oldParent:entry.newParent,oldNextSibling:entry.newNextSibling,oldTransform:entry.newTransform,newParent:entry.oldParent,newNextSibling:entry.oldNextSibling,newTransform:entry.oldTransform,batchId:lastBatch});
      if(entry.newNextSibling&&entry.newNextSibling.parentNode){
        entry.newParent.insertBefore(entry.element,entry.newNextSibling);
      }else if(entry.newParent){
        entry.newParent.appendChild(entry.element);
      }
      entry.element.style.transform=entry.newTransform;
    }
```

- [ ] **Step 4: Refresh boundary markers after undo/redo of other ops**

In `performUndo()`, next to the existing end-of-function calls:

```js
  // Page-break markers must mirror the live DOM after any undo ...
  updatePageBreakMarkers();
  reportPageBreak(false);
```

add after them:

```js
  updateBoundaryMarkers();
  reportPages(false);
```

Do the same in `performRedo()` (same anchor text, same two added lines).

- [ ] **Step 5: Verify**

1. Dev server running, open `/preview/blank`, press **V**.
2. Console: `document.querySelector('iframe').contentWindow.postMessage({type:'add-page'},'*')` → divider appears.
3. Drag a heading/paragraph from page 1 downward so its top edge crosses the divider, release.
   Expected: element is now below the divider (page 2) and its on-screen position is EXACTLY where it was dropped (no jump); the divider stays at the top of page 2's content.
4. Drag another element back upward across the divider → returns to page 1, same visual position.
5. Ctrl+Z once → the drag-across move is undone (element back on page 1, pre-drag position). Ctrl+Shift+Z → move reapplied.
6. Drag a whole group (marquee-select 2 elements) across → both reparent; they may land on different pages if their tops crossed at different points — both keep visual position.
7. Drag an element only partway (not crossing the divider) → nothing reparents; plain move undo still works.

- [ ] **Step 6: No commit** — skip (per `AGENTS.md` policy).

---

### Task 3: Explicit "Move to page" command (iframe script)

**Files:**
- Modify: `apps/web/components/editor/editor-iframe.ts`

**Interfaces:**
- Consumes: Task 1 + Task 2 (`reparentElementToPage`, `addPageBoundary`, `getPageBoundaryEls`, `countPages`, `isContainer`, `isPageBoundary`, `updateBoundaryMarkers`, `reportPages`)
- Produces: `getPageIndexOf(el)` → 0-based page index of an element; message handler `{type:'move-to-page', pageIndex}` where `-1` = "new page"

- [ ] **Step 1: Add `getPageIndexOf`**

Insert right after `reparentElementToPage` (Task 2):

```js
// 0-based index of the page `el` currently lives on (boundaries BEFORE it
// in document order count up). Works for any element inside the container.
function getPageIndexOf(el){
  if(!el||!el.getRootNode)return 0;
  var boundaries=getPageBoundaryEls();
  var idx=0;
  for(var i=0;i<boundaries.length;i++){
    // DOCUMENT_POSITION_FOLLOWING (4): the boundary comes AFTER el in
    // document order → el sits before this boundary → count the page.
    if(boundaries[i].compareDocumentPosition(el)&4)idx=i+1;
    else break;
  }
  return idx;
}
```

- [ ] **Step 2: Add `moveSelectionToPage`**

Insert right after `getPageIndexOf`:

```js
// Move the current selection to the END of page `pageIndex` (0-based).
// pageIndex -1 (or beyond the last page) creates a new page at the end
// and moves the selection into it. One undo batch covers the whole move
// (including any boundary created for a new page).
function moveSelectionToPage(pageIndex){
  if(selectedEls.length===0)return;
  for(var i=0;i<selectedEls.length;i++){
    if(isContainer(selectedEls[i]))return; // the page frame never moves
  }
  var target=Number(pageIndex);
  if(isNaN(target)||target<0)target=countPages(); // "new page"
  var bid=++batchId;
  while(target>=countPages()){
    addPageBoundary(true,bid); // shared batch id → one undo step
  }
  // Move in document order so relative stacking is preserved.
  var els=selectedEls.slice().sort(function(a,b){
    return (a.compareDocumentPosition(b)&4)?1:-1;
  });
  for(var j=0;j<els.length;j++){
    var e=els[j];
    if(isContainer(e)||isPageBoundary(e))continue;
    reparentElementToPage(e,target,bid);
  }
  redoStack=[];
  updateBoundaryMarkers();
  reportPages(false);
  fireSelected();
  updateSelectionBox();
}
```

- [ ] **Step 3: Message handlers**

In the `window.addEventListener('message', ...)` handler, after the existing `if(data.type==='clear-split'){...}` block, add:

```js
  if(data.type==='add-page'){
    addPageBoundary(true);
  }

  if(data.type==='move-to-page'){
    moveSelectionToPage(data.pageIndex);
  }
```

- [ ] **Step 4: Extend `fireSelected` with page info**

In `fireSelected()`, change the final postMessage:

```js
  window.parent.postMessage({type:'element-selected',elements:infos},'*');
```

to:

```js
  window.parent.postMessage({
    type:'element-selected',
    elements:infos,
    page:selectedEls.length>0?getPageIndexOf(selectedEls[0]):0,
    pageCount:countPages()
  },'*');
```

- [ ] **Step 5: Verify**

1. Dev server running, `/preview/blank`, press **V**, select a heading.
2. Console: `document.querySelector('iframe').contentWindow.postMessage({type:'move-to-page',pageIndex:1},'*')` with one boundary already added → element jumps to the end of page 2, visual position preserved (no jump).
3. Console: `document.querySelector('iframe').contentWindow.postMessage({type:'move-to-page',pageIndex:-1},'*')` → a NEW boundary is appended AND the selection moves into the new last page.
4. Ctrl+Z → selection back on its old page AND the auto-created boundary removed (single undo step). Ctrl+Shift+Z → re-applied.
5. Select the `.scroll-wrapper`/body (impossible — containers aren't selectable) → no-op guard confirmed by trying `move-to-page` with a container selected via console: nothing happens.

- [ ] **Step 6: No commit** — skip (per `AGENTS.md` policy).

---

### Task 4: Parent bridge + export (HtmlPreview.tsx)

**Files:**
- Modify: `apps/web/components/editor/HtmlPreview.tsx`

**Interfaces:**
- Consumes: iframe messages from Tasks 1–3 (`pages-changed`, `element-selected` with `page`/`pageCount`)
- Produces (used by Tasks 5–6):
  - `HtmlPreviewHandle.addPage: () => void` — posts `{type:'add-page'}`
  - `HtmlPreviewHandle.moveToPage: (pageIndex: number) => void` — posts `{type:'move-to-page', pageIndex}`
  - Props `onPageInfo?: (info: {page: number; pageCount: number}) => void`
  - Props `onPagesChange?: (count: number, changed: boolean) => void`
  - Export conversion: each `[data-klone-page-boundary]` in the export clone becomes `break-before: page` (skipped when it is the first content element)

- [ ] **Step 1: Extend the handle interface**

In the `HtmlPreviewHandle` interface, after `clearPageBreak: () => void;`, add:

```ts
  /** Append an empty page (boundary) at the end of the document. */
  addPage: () => void;
  /** Move the current selection to page `pageIndex` (0-based; -1 = new page). */
  moveToPage: (pageIndex: number) => void;
```

- [ ] **Step 2: Extend props + destructure**

In `HtmlPreviewProps`, after `onSplitModeChange?: (enabled: boolean) => void;`, add:

```ts
  onPageInfo?: (info: { page: number; pageCount: number }) => void;
  onPagesChange?: (count: number, changed: boolean) => void;
```

In the component signature destructuring, after `onSplitModeChange,`, add:

```ts
      onPageInfo,
      onPagesChange,
```

- [ ] **Step 3: Implement the handle methods**

In `useImperativeHandle`, after the `clearPageBreak` method, add:

```ts
      addPage: () => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "add-page" },
          "*",
        );
      },
      moveToPage: (pageIndex: number) => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "move-to-page", pageIndex },
          "*",
        );
      },
```

- [ ] **Step 4: Bridge the new messages**

In the message `handler`, replace:

```ts
        if (e.data && e.data.type === "element-selected") {
          onElementSelect?.(e.data.elements);
        }
```

with:

```ts
        if (e.data && e.data.type === "element-selected") {
          onElementSelect?.(e.data.elements);
          if (typeof e.data.page === "number") {
            onPageInfo?.({
              page: e.data.page,
              pageCount: e.data.pageCount ?? 1,
            });
          }
        }
        if (e.data && e.data.type === "pages-changed") {
          onPagesChange?.(Number(e.data.count) || 1, Boolean(e.data.changed));
        }
```

Update the effect dependency array — replace:

```ts
    }, [
      onElementSelect,
      onStyleUpdated,
      onEditModeChange,
      onPageBreakChange,
      onSplitModeChange,
    ]);
```

with:

```ts
    }, [
      onElementSelect,
      onStyleUpdated,
      onEditModeChange,
      onPageBreakChange,
      onSplitModeChange,
      onPageInfo,
      onPagesChange,
    ]);
```

- [ ] **Step 5: Convert boundaries to PDF page breaks on export**

In `serializeCleanHtml`, inside the `if (forExport) { ... }` block, right after the existing `cloneSplitEls.forEach(...)` loop (the one that ends with the `display === "inline"` check) and before the closing `}` of the forExport block, add:

```ts
      // Editor pages: each data-klone-page-boundary becomes one PDF page
      // (break-before: page on a zero-height block = clean split, no blank
      // page). Boundaries are kept in saved HTML (reopenable), converted
      // only in the export clone.
      const liveBoundaryEls = Array.from(
        doc.querySelectorAll("[data-klone-page-boundary]"),
      );
      const cloneBoundaryEls = Array.from(
        clone.querySelectorAll("[data-klone-page-boundary]"),
      );
      cloneBoundaryEls.forEach((el, i) => {
        el.removeAttribute("data-klone-page-boundary");
        const live = liveBoundaryEls[i];
        if (!live) return;
        // A boundary as the very first content element means page 1 has no
        // content — a break there would only produce a blank first page.
        if (isFirstElementInBody(live)) return;
        const style = el as HTMLElement;
        style.style.breakBefore = "page";
        style.style.pageBreakBefore = "always";
      });
```

- [ ] **Step 6: Verify**

1. Dev server running, `/preview/blank`, press **V**, add 2 pages via console postMessage, drag one element onto page 2.
2. Click **Save** → a document is created. Reload the page (`/preview/{id}`) → press **V** → both dividers are still there (boundaries persisted in `html_code`).
3. Click **Share/Download (PDF)** → the exported PDF has one page per editor page at the boundary positions; existing blue split markers (if any) still work inside pages.
4. Add a boundary at the very top by moving an element down... (i.e., make page 1 empty by dragging everything below the first divider, or check the empty-first-page case): export → no blank first page.

- [ ] **Step 7: No commit** — skip (per `AGENTS.md` policy).

---

### Task 5: "+ Add page" overlay button (PreviewEditor + icon)

**Files:**
- Modify: `apps/web/components/editor/PreviewEditor.tsx`
- Modify: `apps/web/components/editor/icons/toolbar-icons.tsx`

**Interfaces:**
- Consumes: `HtmlPreviewHandle.addPage` (Task 4), `onPagesChange`, `onPageInfo` (Task 4)
- Produces (used by Task 6): props `pageCount`, `currentPage`, `onMoveToPage` passed to `PropertiesSidebar`; `PlusIcon` export

- [ ] **Step 1: Add the PlusIcon**

In `icons/toolbar-icons.tsx`, after `SpinnerIcon`, add:

```tsx
export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}
```

- [ ] **Step 2: Page state in PreviewEditor**

In `PreviewEditor.tsx`, next to the existing `pageBreakCount` state:

```ts
  const [pageBreakCount, setPageBreakCount] = useState(
    () => (html ?? "").match(/data-klone-page-break/g)?.length ?? 0,
  );
```

add after it:

```ts
  // Multi-page state: pageCount comes from persisted boundaries (or the
  // single default page); currentPage tracks the selection's page.
  const [pageCount, setPageCount] = useState(
    () =>
      ((html ?? "").match(/data-klone-page-boundary/g)?.length ?? 0) + 1,
  );
  const [currentPage, setCurrentPage] = useState(0);
```

- [ ] **Step 3: Handlers**

After the existing `handlePageBreakChange` callback, add:

```ts
  const handlePagesChange = useCallback((count: number, changed: boolean) => {
    setPageCount(Math.max(1, count));
    if (changed) setDirty(true);
  }, []);

  const handlePageInfo = useCallback(
    (info: { page: number; pageCount: number }) => {
      setCurrentPage(info.page);
      setPageCount(Math.max(1, info.pageCount));
    },
    [],
  );
```

- [ ] **Step 4: Wire the props**

In the `<HtmlPreview ... />` element, after `onSplitModeChange={setSplitMode}`, add:

```tsx
                onPageInfo={handlePageInfo}
                onPagesChange={handlePagesChange}
```

In the `<PropertiesSidebar ... />` element, after `onClearPageBreak={handleClearPageBreak}`, add:

```tsx
              pageCount={pageCount}
              currentPage={currentPage}
              onMoveToPage={(pageIndex) => previewRef.current?.moveToPage(pageIndex)}
```

- [ ] **Step 5: The "+ Add page" button**

In the canvas column, after the existing "Canvas editing hint (inspect mode)" block's closing `)}` and before the closing `</div>` of the center column, add:

```tsx
          {/* ── Add page button (inspect mode) ── */}
          {inspectMode && (
            <button
              onClick={() => previewRef.current?.addPage()}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1a1a1a]/95 border border-[#2d2d2d] shadow-lg text-[11px] font-medium text-[#e4e4e7] hover:bg-[#232325] hover:border-[#3f3f46] transition-colors whitespace-nowrap"
            >
              <PlusIcon className="w-3.5 h-3.5 text-[#18a0fb]" />
              Add page
              {pageCount > 1 && (
                <span className="text-[#71717a] font-mono text-[10px]">
                  · {pageCount}
                </span>
              )}
            </button>
          )}
```

Update the import from `./icons/toolbar-icons` (in `FigmaBottomToolbar` usage, the icons are imported in `PreviewEditor`? — verify) — actually the icons are imported inside `FigmaBottomToolbar.tsx`. Add to `PreviewEditor.tsx`:

```ts
import { PlusIcon } from "./icons/toolbar-icons";
```

- [ ] **Step 6: Verify**

1. Dev server running, `/preview/blank` — NO button visible in preview mode (only after pressing **V**).
2. Press **V** → pill button "＋ Add page" appears at bottom-center, above the hint pill, blue plus icon.
3. Click it 3 times → 3 dividers appear (Page 2 / 3 / 4 chips); the button shows "· 4".
4. Click it while elements are selected → still appends at the end (pages append at document end, selection untouched).
5. Press **V** to exit inspect → button + dividers disappear; document renders exactly as before (no layout shift).

- [ ] **Step 7: No commit** — skip (per `AGENTS.md` policy).

---

### Task 6: "Pages" section in the properties sidebar

**Files:**
- Modify: `apps/web/components/editor/PropertiesSidebar.tsx`

**Interfaces:**
- Consumes: `pageCount`, `currentPage`, `onMoveToPage(pageIndex: number)` props (Task 5)
- Produces: none (final task)

- [ ] **Step 1: Props**

In `PropertiesSidebarProps`, after `onClearPageBreak?: () => void;`, add:

```ts
  pageCount?: number;
  currentPage?: number;
  onMoveToPage?: (pageIndex: number) => void;
```

In the destructure, after `onClearPageBreak,`, add:

```ts
  pageCount = 1,
  currentPage = 0,
  onMoveToPage,
```

- [ ] **Step 2: The Pages section**

Between the `{/* ── Typography ── */}` Section (ends with `</Section>`) and the `{/* ── Delete ── */}` block, add:

```tsx
            {/* ── Pages ── */}
            {onMoveToPage && pageCount > 0 && !isContainerSel && (
              <Section title="Pages" noBorder>
                <div className="space-y-2">
                  <span className="block text-[10px] text-[#71717a]">
                    On page {currentPage + 1} of {pageCount}
                  </span>
                  <SelectField
                    title="Move to page"
                    value={String(currentPage)}
                    onChange={(v) => {
                      const target = v === "-1" ? -1 : parseInt(v, 10);
                      if (Number.isNaN(target) || target === currentPage)
                        return;
                      onMoveToPage(target);
                    }}
                    options={[
                      ...Array.from({ length: pageCount }, (_, i) => ({
                        value: String(i),
                        label: `Page ${i + 1}${
                          i === currentPage ? " (current)" : ""
                        }`,
                      })),
                      { value: "-1", label: "+ New page" },
                    ]}
                  />
                </div>
              </Section>
            )}
```

(`Section`, `SelectField` are already imported in this file.)

- [ ] **Step 3: Verify**

1. Dev server running, `/preview/blank`, press **V**, add 2 pages (button), select an element on page 1.
2. Right sidebar shows "Pages" section: "On page 1 of 3", dropdown showing "Page 1 (current)".
3. Pick "Page 3" from the dropdown → element moves to page 3, visual position preserved; section now shows "On page 3 of 3"; dropdown re-renders with "Page 3 (current)".
4. Pick "+ New page" → a new boundary is appended AND the element moves into the new page 4.
5. Ctrl+Z → the whole move (including the created page) undoes in one step.
6. Select the body/frame (not possible — containers aren't selectable) — instead verify the section does NOT appear when the selection is the container via console-selected container: section hidden for container selection (guard `!isContainerSel`).
7. Multi-select elements on different pages → section shows the first element's page; moving sends all to the chosen page.

- [ ] **Step 4: No commit** — skip (per `AGENTS.md` policy).

---

## Self-review notes (run after implementation)

- **Spec coverage:** Add-page button → Task 5; boundary model + persistence → Task 1/4; drag-across → Task 2; move-to-page dropdown → Task 6 (Task 3 iframe side); undo/redo → Tasks 1–3; export one-page-per-boundary → Task 4; split mode kept → untouched, only a one-line guard added; empty-page removal via × → Task 1.
- **Type consistency:** `reparentElementToPage(el, pageIndex, bid)` defined Task 2, used Tasks 2–3; `__reparent__` entry fields identical in Task 2 push and Task 2 undo/redo branches; `moveToPage(pageIndex)` / `addPage()` handle methods defined Task 4, used Tasks 5–6; `onPageInfo`/`onPagesChange`/`pageCount`/`currentPage` names consistent across Tasks 4–6.
- **Placeholder scan:** every step has concrete code or exact anchor text; no TBD/TODO.
