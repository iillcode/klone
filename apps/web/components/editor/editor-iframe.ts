export function getEditorScript(): string {
  return `<script>
(function(){
  // ── Editor script version marker ──
  // If the iframe is running a stale copy of this script (HMR sometimes
  // doesn't reload sandboxed iframe srcDoc), the console inside the iframe
  // will show an older version. Hard-refresh the page to reload it.
  if(window.__kloneEditorInjected)return; // never double-bind listeners
  window.__kloneEditorInjected=true;
  console.log('[editor] script v23');
var selectedEls=[];
var hoveredEl=null;
var isDragging=false;
var dragMoved=false;
var justDragged=false;
var dragStartX=0;
var dragStartY=0;
var lastDragX=null;
var lastDragY=null;
var batchId=0;
var undoStack=[];
var redoStack=[];
var inspectEnabled=false;
var pendingEditEl=null;
var editReqId=0;
var isMoving=false;
var moveDeltas=[];
var autoScrollDir=null; // 'up'|'down'|null - edge auto-scroll while dragging
var selBoxEl=null;
var isResizing=false;
var resizeHandle='';
var resizeStartX=0;
var resizeStartWidth=0;
var resizeStartWidthCss='';
var resizeStartTransform='';
var resizeStartTx=0;
var resizeStartLeft=0;
var marqueeEl=null;
var marqueeAdditive=false;
var marqueeBase=[];
var marqueePrevSel=[];
var lastChangeEl=null;
var lastChangeProp='';
var lastChangeTime=0;
var guidesLayer=null;
var moveTargets=[];
var pendingMX=0;
var pendingMY=0;
var pendingShift=false;
var dragFrameScheduled=false;
var dragBounds=null;
var dragBaseRect=null;
var dragBasePos=[0,0];
var moveRects=[];
var dragScrollTop=0; // scroll offset at mousedown (converts drag rects to document space)
var lastDragMoveEls=[]; // elements moved in the most recent drag (used to auto-move them onto a page added right after the drop)
var lastGuidesKey=null;
var dragDirX=0;
var dragDirY=0;
var nudgeGuideTimer=null;
var splitMode=false;

function getPageBreakEls(){
  var list=document.querySelectorAll('[data-klone-page-break]');
  var result=[];
  for(var i=0;i<list.length;i++)result.push(list[i]);
  return result;
}

function hasPageBreak(el){
  return !!(el&&el.getAttribute&&el.getAttribute('data-klone-page-break')!==null);
}

var lastReportedPageBreakCount=-1;
function reportPageBreak(changed){
  var count=getPageBreakEls().length;
  if(count===lastReportedPageBreakCount&&!changed)return; // nothing new to report
  lastReportedPageBreakCount=count;
  window.parent.postMessage({
    type:'page-break-updated',
    hasPageBreak:count>0,
    count:count,
    changed:!!changed
  },'*');
}

function createPageBreakMarker(){
  var marker=document.createElement('div');
  marker.setAttribute('data-editor-ui','page-break-marker');
  marker.style.cssText='position:fixed;left:0;height:0;border-top:2px dashed #18a0fb;pointer-events:none;z-index:99997;display:none;';
  var label=document.createElement('span');
  label.textContent='PDF page starts here';
  label.style.cssText='position:absolute;top:-21px;left:12px;padding:3px 7px;border-radius:4px;background:#18a0fb;color:#fff;font:600 10px/1.2 Arial,sans-serif;letter-spacing:.01em;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.28);';
  marker.appendChild(label);
  document.body.appendChild(marker);
  return marker;
}

function updatePageBreakMarkers(){
  // Rebuild every marker from the live marked elements so deletes/undo can
  // never leave a stale overlay behind.
  var old=document.querySelectorAll('[data-editor-ui="page-break-marker"]');
  for(var i=0;i<old.length;i++)old[i].remove();
  // In preview mode (inspect/split off) the split lines are hidden - they
  // only make sense while the user is inspecting or splitting the document.
  if(!(inspectEnabled||splitMode))return;
  var els=getPageBreakEls();
  for(var j=0;j<els.length;j++){
    var el=els[j];
    if(!el||!el.isConnected)continue;
    var marker=createPageBreakMarker();
    var r=el.getBoundingClientRect();
    marker.style.display='block';
    // Show the line below/under the element (at its bottom edge) rather than
    // above it, so the break reads as "next page starts under this element".
    marker.style.top=Math.round(r.bottom)+'px';
    marker.style.width=Math.max(document.documentElement.clientWidth,document.body.clientWidth)+'px';
  }
}

// Toggle a split on one element (adds when absent, removes when present).
// Multiple splitters are supported - each marked element starts a new page.
function togglePageBreak(el,record){
  if(!el||!isClickable(el)||isContainer(el))return;
  var adding=!hasPageBreak(el);
  if(record){
    batchId++;
    undoStack.push({property:'__page_break__',element:el,adding:adding,batchId:batchId});
    redoStack=[];
  }
  if(adding)el.setAttribute('data-klone-page-break','');
  else el.removeAttribute('data-klone-page-break');
  updatePageBreakMarkers();
  reportPageBreak(!!record);
}

// Remove EVERY marked split (used by the "remove all breaks" action).
function clearPageBreaks(record){
  var els=getPageBreakEls();
  if(els.length===0)return;
  if(record){
    batchId++;
    for(var i=0;i<els.length;i++){
      undoStack.push({property:'__page_break__',element:els[i],adding:false,batchId:batchId});
    }
    redoStack=[];
  }
  for(var j=0;j<els.length;j++)els[j].removeAttribute('data-klone-page-break');
  updatePageBreakMarkers();
  reportPageBreak(!!record);
}

function setSplitMode(enabled){
  splitMode=!!enabled;
  clearHover();
  document.body.style.cursor=splitMode?'crosshair':'';
  window.parent.postMessage({type:'split-mode-changed',enabled:splitMode},'*');
  // Splitting shows the markers; turning it off hides them again in preview.
  updatePageBreakMarkers();
}

// ── Pages ──
// A "page" is a real CONTAINER element (data-klone-page-boundary) appended
// to the content container. Content before the first page container = page
// 1; the content INSIDE page container N = page N+1. Each page container
// reserves a full page of height (A4 ratio) so an empty page is visible and
// droppable. Page containers are system-level: never selectable/draggable.
function isPageBoundary(el){
  return !!(el&&el.getAttribute&&el.getAttribute('data-klone-page-boundary')!==null);
}

// ── Copy / Paste ──
// A single clipboard holds serialized element HTML (or a full page). Ctrl/Cmd
// + C copies the current selection; Ctrl/Cmd + V pastes a clone of whatever
// is on the clipboard as a NEW element right after the source location (or at
// the end of the body when nothing is selected). This mirrors the user's
// "duplicate via copy/paste" expectation without a separate Duplicate button.
var clipboard=null; // { html: string }

// Serialize a node to an outerHTML string, stripping editor-only attributes
// so the stored copy is a clean, re-insertable block.
function serializeForClipboard(el){
  var clone=el.cloneNode(true);
  clone.removeAttribute('data-editor-selected');
  clone.removeAttribute('data-editor-block');
  if(isPageBoundary(clone))clone.removeAttribute('id');
  return clone.outerHTML;
}

// Copy the current selection into the clipboard. Supports a whole page (when
// the selection is a page boundary) as well as individual elements.
function copySelection(){
  if(selectedEls.length===0){clipboard=null;return;}
  // If a single page boundary is selected, copy the whole page.
  if(selectedEls.length===1&&isPageBoundary(selectedEls[0])){
    clipboard={html:serializeForClipboard(selectedEls[0])};
    return;
  }
  // Otherwise copy each selected element (skipping system frames).
  var parts=[];
  for(var i=0;i<selectedEls.length;i++){
    var el=selectedEls[i];
    if(isContainer(el))continue;
    parts.push(serializeForClipboard(el));
  }
  clipboard=parts.length>0?{html:parts.join('')}:null;
}

// Insert a parsed clipboard node into the container right after afterEl
// (or appended when afterEl is null/last). Returns the inserted element or
// null. Re-enables pointer events for page-boundary content.
function insertClipboardNode(container,afterEl){
  if(!clipboard||!clipboard.html)return null;
  var wrapper=document.createElement('div');
  wrapper.innerHTML=clipboard.html;
  var node=wrapper.firstElementChild;
  if(!node)return null;
  if(isPageBoundary(node)){
    var kids=node.children;
    for(var k=0;k<kids.length;k++)kids[k].style.pointerEvents='auto';
    undoStack.push({property:'__page_boundary__',element:node,adding:true,nextSibling:afterEl?afterEl.nextSibling:null,parentNode:container,batchId:batchId});
    redoStack=[];
  }else{
    undoStack.push({property:'__component__',element:node,adding:true,nextSibling:afterEl?afterEl.nextSibling:null,parentNode:container,batchId:batchId});
    redoStack=[];
    if(container!==getContentContainer())node.style.pointerEvents='auto';
  }
  if(afterEl&&afterEl.parentNode)container.insertBefore(node,afterEl.nextSibling);
  else container.appendChild(node);
  return node;
}

// Paste the clipboard as NEW element(s). When something is selected, the copy
// is placed after the last selected element (same container); otherwise it is
// appended to the end of the body. The pasted node becomes the new selection.
function pasteClipboard(){
  if(!clipboard||!clipboard.html)return;
  batchId++;
  var anchor=selectedEls.length>0?selectedEls[selectedEls.length-1]:null;
  var container=getContentContainer();
  if(anchor&&anchor.parentNode)container=anchor.parentNode;
  var node=insertClipboardNode(container,anchor);
  if(!node)return;
  selectedEls=[node];
  fireSelected();
  reportDirty();
}

function getPageBoundaryEls(){
  var list=document.querySelectorAll('[data-klone-page-boundary]');
  var result=[];
  for(var i=0;i<list.length;i++)result.push(list[i]);
  return result;
}

function getContentContainer(){
  // Prefer the rendered user content space (user templates host their
  // design inside a .scroll-wrapper.klone-render-space; default/blank
  // templates use a plain .scroll-wrapper). Falls back to the document body.
  var wrap=document.querySelector('.scroll-wrapper');
  return wrap||document.body;
}

// One printed page of height for the current page width (A4 = 210x297mm).
// The container's own width IS the page width, so the ratio keeps an added
// empty page the same shape as the exported PDF page.
function getPageHeightPx(){
  var c=getContentContainer();
  var w=c?c.clientWidth:794;
  if(!w||w<=0)w=794;
  return Math.round(w*297/210);
}

// The element that HOLDS page pageIndex content (0-based): page 0 lives
// directly in the content container, page N inside page container N-1.
function getPageContainer(pageIndex){
  if(pageIndex<=0)return getContentContainer();
  var boundaries=getPageBoundaryEls();
  return boundaries[pageIndex-1]||getContentContainer();
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

// The page container's own box: a real, page-sized empty area so a newly
// added page is VISIBLE and can be dropped into. Kept as inline styles so
// the page survives save/reload without depending on template CSS.
// pointer-events:none makes the page container CLICK-THROUGH: an element
// dropped at the bottom (visually overlapping the page area) stays
// selectable instead of being blocked by the transparent page box. Content
// moved ONTO the page re-enables pointer events on itself (see
// syncPageBoundarySizes / reparentElementToPage), so it remains clickable.
function pageBoundaryCss(){
  return 'display:block;position:relative;width:100%;min-height:'+getPageHeightPx()+'px;margin:0;padding:0;border:0;pointer-events:none;';
}

// Append a new empty page (a page-sized container) at the end of the doc.
// autoMoveDropped: when the user drags an element to the bottom and THEN
// adds the page, any element from that drag whose centre now sits inside
// the new page's area is pulled onto the page (same undo batch as the
// boundary, so one undo reverses both) - the element lands where the user
// meant it to go instead of being stranded overlapping the page box.
function addPageBoundary(record,sharedBatchId,autoMoveDropped){
  var container=getContentContainer();
  if(!container)return;
  var b=document.createElement('div');
  b.setAttribute('data-klone-page-boundary','');
  b.style.cssText=pageBoundaryCss();
  var bid=0;
  if(record){
    bid=sharedBatchId||++batchId;
    undoStack.push({property:'__page_boundary__',element:b,adding:true,nextSibling:null,parentNode:container,batchId:bid});
    redoStack=[];
  }
  container.appendChild(b);
  // Freshly dragged elements that ended up at/below the new page's top
  // edge are moved onto it, preserving their exact visual drop position.
  if(autoMoveDropped&&lastDragMoveEls.length>0){
    var nr=b.getBoundingClientRect();
    for(var ai=0;ai<lastDragMoveEls.length;ai++){
      var ael=lastDragMoveEls[ai];
      if(!ael||!ael.isConnected)continue;
      if(isContainer(ael)||isPageBoundary(ael))continue;
      if(getPageIndexOf(ael)>0)continue; // already lives on a page container
      var ar=ael.getBoundingClientRect();
      var acy=ar.top+ar.height/2;
      // Centre at/inside the new page's area - or the element was dropped
      // against the bottom edge of the previous page (drag clamping keeps
      // it inside the body, so its centre sits just above the new page's
      // top) - pull it onto the page either way.
      if(acy<nr.top-(ar.height/2))continue;
      if(bid>0)reparentElementToPage(ael,countPages()-1,bid);
    }
    lastDragMoveEls=[];
  }
  updateBoundaryMarkers();
  reportPages(true);
}

// Append a template component (key + html + css) into the document. The
// block goes inside the EXISTING body when there are no extra pages, or
// inside the LAST page boundary (the most recently added page) when the
// user has created new pages — so components accumulate on the page the user
// is building rather than spilling back into the root body. The component
// HTML is wrapped in a block-level container so it behaves like a normal
// selectable/editable element, with its CSS scoped inside the block. One
// undo step restores the document to its previous state.
function addComponentToBottom(key, html, css){
  if(!key||!html)return;
  var container=getContentContainer();
  if(!container)return;
  // When extra pages exist, append into the last page boundary so the new
  // block lands on the page the user just created (not the root body).
  var pages=getPageBoundaryEls();
  if(pages.length>0)container=pages[pages.length-1];
  var wrap=document.createElement('div');
  wrap.setAttribute('data-klone-component', key);
  wrap.setAttribute('data-editor-block','');
  // Elements inside a page boundary must be click-through-disabled on the
  // page box but re-enabled on the element so they stay selectable.
  if(container!==getContentContainer())wrap.style.pointerEvents='auto';
  wrap.innerHTML=(css?('<style>'+css+'</style>'):'')+html;
  batchId++;
  undoStack.push({property:'__component__',element:wrap,adding:true,parentNode:container,batchId:batchId});
  redoStack=[];
  container.appendChild(wrap);
  // Select the newly added block so the user can immediately style it.
  selectedEls=[wrap];
  fireSelected();
  reportDirty();
}

// Deep-clone an element, stripping any editor-only selection/state
// attributes so the duplicate is a clean, editable copy. The clone keeps its
// inline styles (position via transform included) so it lands exactly where
// the source sits.
function cloneForDuplicate(el){
  var clone=el.cloneNode(true);
  clone.removeAttribute('data-editor-selected');
  clone.removeAttribute('data-editor-block');
  // A cloned page boundary must keep its page marker but drop a stale id.
  if(isPageBoundary(clone))clone.removeAttribute('id');
  return clone;
}

// Keep every page's height in sync with the current page width (the page
// container is responsive, so a resize must re-derive the A4 height), and
// re-apply the box styles to pages restored from saved HTML. Content that
// lives on a page re-enables pointer events (the page box itself is
// click-through) so elements on the page stay selectable after a reload.
function syncPageBoundarySizes(){
  var els=getPageBoundaryEls();
  var css=pageBoundaryCss();
  for(var i=0;i<els.length;i++){
    if(els[i].getAttribute('style')!==css)els[i].style.cssText=css;
    var kids=els[i].children;
    for(var k=0;k<kids.length;k++){
      kids[k].style.pointerEvents='auto';
    }
  }
}

// Delete a page AND everything on it. The page is a real container, so
// removing it takes its content with it - including elements that were
// moved onto the page from another page. The whole page (with its content)
// is kept in the undo entry, so one undo restores the page and everything
// that was on it.
function removePageBoundary(boundary,record,sharedBatchId){
  if(!boundary||!boundary.isConnected)return;
  var parent=boundary.parentNode;
  // Anything selected on this page is about to disappear - drop it from the
  // selection first so the sidebar never edits a detached element.
  var hadSelection=false;
  for(var i=selectedEls.length-1;i>=0;i--){
    if(boundary===selectedEls[i]||boundary.contains(selectedEls[i])){
      selectedEls[i].style.outline='';
      selectedEls[i].style.outlineOffset='';
      selectedEls.splice(i,1);
      hadSelection=true;
    }
  }
  // A text edit in progress on this page must be abandoned too.
  if(pendingEditEl&&boundary.contains(pendingEditEl)){
    pendingEditEl=null;
    editReqId=0;
  }
  // Elements that were moved OFF this page leave origin-space placeholders
  // on their old pages - free them too (their content is gone now). Kept
  // on the undo entry so undoing the page delete restores them.
  var removedPlaceholders=removePlaceholdersFor(boundary);
  if(record){
    var bid=sharedBatchId||++batchId;
    undoStack.push({property:'__page_boundary__',element:boundary,adding:false,nextSibling:boundary.nextSibling,parentNode:parent,placeholders:removedPlaceholders,batchId:bid});
    redoStack=[];
  }
  boundary.remove();
  if(hadSelection){
    if(selectedEls.length===0){
      if(selBoxEl)selBoxEl.style.display='none';
      window.parent.postMessage({type:'selection-cleared'},'*');
    }else{
      fireSelected();
    }
  }
  updateBoundaryMarkers();
  reportPages(true);
  // Deleted content may have carried PDF split markers - resync both the
  // overlays and the parent's break count.
  updatePageBreakMarkers();
  reportPageBreak(false);
}

// ── Inline delete confirmation ──
// The preview iframe is sandboxed WITHOUT allow-modals, so window.confirm()
// is blocked. Deleting a page that holds content therefore arms a "Delete
// page?" state on the chip: the first click arms it, a second click within
// the timeout deletes. Clicking anywhere else (or the timeout) disarms.
var pendingDeletePage=null;
var pendingDeleteTimer=null;

function disarmPageDelete(){
  if(pendingDeleteTimer){clearTimeout(pendingDeleteTimer);pendingDeleteTimer=null;}
  if(pendingDeletePage){
    pendingDeletePage=null;
    updateBoundaryMarkers();
  }
}

function armPageDelete(page){
  if(pendingDeleteTimer)clearTimeout(pendingDeleteTimer);
  pendingDeletePage=page;
  updateBoundaryMarkers();
  pendingDeleteTimer=setTimeout(disarmPageDelete,4000);
}

function createPageBoundaryMarker(boundary,pageNum){
  var armed=(pendingDeletePage===boundary);
  var marker=document.createElement('div');
  marker.setAttribute('data-editor-ui','page-boundary-marker');
  // A hairline top divider marks where the new page starts - no full box
  // outline, so the page border never looks broken/uneven. An armed
  // (pending-delete) page turns red so it is obvious WHAT will be deleted.
  var edge=armed?'rgba(248,113,113,0.85)':'rgba(255,255,255,0.28)';
  marker.style.cssText='position:fixed;left:0;top:0;box-sizing:border-box;border:0;border-top:1px dashed '+edge+';pointer-events:none;z-index:99995;display:none;'+(armed?'background:rgba(248,113,113,0.06);':'');
  var chip=document.createElement('div');
  chip.style.cssText='position:absolute;top:-22px;right:8px;display:flex;align-items:center;gap:6px;padding:3px 6px 3px 8px;border-radius:4px;background:'+(armed?'#3b1f22':'#2a2a2c')+';border:1px solid '+(armed?'#7f2b2b':'#3f3f46')+';color:#e4e4e7;font:600 10px/1.2 Arial,sans-serif;white-space:nowrap;pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,.28);';
  var label=document.createElement('span');
  var n=boundary.children.length;
  label.textContent=armed
    ?('Delete page '+pageNum+' and '+n+' element'+(n===1?'':'s')+'?')
    :('Page '+pageNum+' starts here');
  chip.appendChild(label);
  var removeBtn=document.createElement('button');
  removeBtn.setAttribute('data-action','remove-boundary');
  removeBtn.textContent=armed?'Delete':'×';
  removeBtn.title=armed?'Click again to delete this page and its content':'Delete this page and everything on it';
  removeBtn.style.cssText='border:0;background:transparent;color:'+(armed?'#fca5a5':'#a1a1aa')+';font:600 '+(armed?'10px':'12px')+'/1 Arial,sans-serif;cursor:pointer;padding:0 2px;pointer-events:auto;';
  chip.appendChild(removeBtn);
  marker.appendChild(chip);
  document.body.appendChild(marker);
  return marker;
}

function updateBoundaryMarkers(){
  // Page boundaries no longer render any canvas overlay (no divider lines
  // or boxes). Delete/inspect of pages happens from the sidebar's page
  // list instead, so stale overlays can't linger after undo/redo. We still
  // clear any leftover markers, but create none.
  var old=document.querySelectorAll('[data-editor-ui="page-boundary-marker"]');
  for(var i=0;i<old.length;i++)old[i].remove();
  return;
  // (Marker-building code below is unreachable; kept only so the function
  // shape and helpers remain intact for future reuse.)
  if(!inspectEnabled)return;
  var boundaries=getPageBoundaryEls();
  for(var j=0;j<boundaries.length;j++){
    var b=boundaries[j];
    if(!b||!b.isConnected)continue;
    var marker=createPageBoundaryMarker(b,j+2); // page container j holds page j+2
    var r=b.getBoundingClientRect();
    // The divider is drawn across the TOP edge of the page container, and
    // the page's own area is outlined so an empty page is clearly visible.
    marker.style.display='block';
    marker.style.left=Math.round(r.left)+'px';
    marker.style.width=Math.round(r.width)+'px';
    marker.style.top=Math.round(r.top)+'px';
    marker.style.height=Math.round(r.height)+'px';
  }
}

// ── Moved-element placeholders ──
// Moving an element to another page removes it from its page's flow, which
// collapses the layout (everything below shifts up and the page shrinks).
// To keep the origin page's space for inserting other elements, a
// placeholder - a transparent box with the SAME display, box and margins as
// the moved element - is left where the element used to be. Placeholders
// are system-level (never selectable/draggable), persist in saved HTML, and
// are cleaned up automatically when their element is deleted (or its page
// is deleted). The link back to the origin element is JS-only (never
// serialized).
function isPagePlaceholder(el){
  return !!(el&&el.getAttribute&&el.getAttribute('data-klone-page-placeholder')!==null);
}

// Create a placeholder for el (measured at oldRect) at its old position.
// Returns null when the element does not occupy flow space (inline text or
// absolutely/fixed positioned), in which case removing it never collapses
// the layout.
function createPagePlaceholder(el,oldParent,oldNextSibling,oldRect){
  if(!oldParent)return null;
  var cs=getComputedStyle(el);
  if(cs.position==='absolute'||cs.position==='fixed')return null;
  if(cs.display==='inline')return null; // inline text just reflows
  var ph=document.createElement('div');
  ph.setAttribute('data-klone-page-placeholder','');
  ph.__kloneOriginEl=el; // JS-only link back to the moved element
  var s=ph.style;
  s.display=(cs.display==='inline-block'||cs.display==='inline-flex')?'inline-block':'block';
  s.boxSizing='border-box';
  s.width=Math.round(oldRect.width)+'px';
  s.height=Math.round(oldRect.height)+'px';
  s.marginTop=cs.marginTop;
  s.marginRight=cs.marginRight;
  s.marginBottom=cs.marginBottom;
  s.marginLeft=cs.marginLeft;
  if(s.display==='inline-block')s.verticalAlign=cs.verticalAlign;
  // Transparent and click-through: reserves space but never blocks
  // selection/dragging of the elements around it.
  s.pointerEvents='none';
  if(oldNextSibling&&oldNextSibling.parentNode)oldParent.insertBefore(ph,oldNextSibling);
  else oldParent.appendChild(ph);
  return ph;
}

// Remove every placeholder that preserves the space of el (or of any
// element inside el) - used when an element or its page is deleted. Returns
// the removed placeholders with their positions so an undo can restore
// them.
function removePlaceholdersFor(el){
  var removed=[];
  if(!el)return removed;
  var all=document.querySelectorAll('[data-klone-page-placeholder]');
  for(var i=0;i<all.length;i++){
    var ph=all[i];
    if(!ph.__kloneOriginEl)continue;
    if(ph.__kloneOriginEl===el||el.contains(ph.__kloneOriginEl)){
      removed.push({ph:ph,parentNode:ph.parentNode,nextSibling:ph.nextSibling});
      ph.remove();
    }
  }
  return removed;
}

// Restore a list of placeholders (undo of a delete / page delete).
function restorePlaceholders(list){
  if(!list)return;
  for(var i=0;i<list.length;i++){
    var item=list[i];
    if(!item||!item.ph||item.ph.isConnected)continue;
    if(item.nextSibling&&item.nextSibling.parentNode)item.parentNode.insertBefore(item.ph,item.nextSibling);
    else if(item.parentNode)item.parentNode.appendChild(item.ph);
  }
}

// ── Cross-page style preservation ──
// Moving an element into a page container changes its DOM ancestry, so
// ancestor-context CSS rules (e.g. .header .meta, .section h2) stop
// matching and the element silently reverts to page defaults - colors,
// fonts, margins, display, etc. are lost, and the transform compensation
// then bakes the wrong offsets in (the element lands off-canvas). The move
// therefore snapshots the computed styles of the element AND its whole
// subtree, then re-inlines exactly the properties whose computed value
// changed after the move, so the element looks identical on the new page.
// Layout-driving properties are listed first so inlining e.g. line-height
// restores a content-derived height before height itself is compared
// (content-sized heights stay auto instead of being frozen to px).
var PRESERVED_STYLE_PROPS=[
  'display','position','cssFloat','clear','boxSizing','visibility','opacity','zIndex','overflow','overflowX','overflowY',
  'fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','wordSpacing','textAlign','textTransform','textDecorationLine','textIndent','whiteSpace','wordBreak','overflowWrap',
  'color','backgroundColor','backgroundImage','backgroundSize','backgroundPosition','backgroundRepeat',
  'marginTop','marginRight','marginBottom','marginLeft',
  'paddingTop','paddingRight','paddingBottom','paddingLeft',
  'width','height','minWidth','minHeight','maxWidth','maxHeight',
  'top','right','bottom','left','verticalAlign',
  'borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth',
  'borderTopStyle','borderRightStyle','borderBottomStyle','borderLeftStyle',
  'borderTopColor','borderRightColor','borderBottomColor','borderLeftColor',
  'borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius',
  'justifyContent','alignItems','alignContent','flexDirection','flexWrap','flexGrow','flexShrink','flexBasis','gap','rowGap','columnGap','order'
];

// Capture the computed styles of root and every descendant, for
// restoreSubtreeStyles() to diff against after the move.
function captureSubtreeStyles(root){
  var out=[];
  if(!root)return out;
  var queue=[root];
  while(queue.length){
    var n=queue.shift();
    var cs=(n.ownerDocument&&n.ownerDocument.defaultView)?getComputedStyle(n):null;
    var vals={};
    if(cs){
      for(var p=0;p<PRESERVED_STYLE_PROPS.length;p++){
        vals[PRESERVED_STYLE_PROPS[p]]=cs[PRESERVED_STYLE_PROPS[p]];
      }
    }
    out.push({el:n,vals:vals});
    for(var c=0;c<n.children.length;c++)queue.push(n.children[c]);
  }
  return out;
}

// Re-apply the pre-move appearance: inline every preserved property whose
// computed value changed since the snapshot (the new context computed it
// differently - that IS the style loss). Two passes: inlining one property
// can change how a later one computes (e.g. line-height restores a
// content-driven height), so the second pass catches anything the first
// pass's comparison missed.
function restoreSubtreeStyles(root,snapshots){
  if(!snapshots)return;
  for(var pass=0;pass<2;pass++){
    var changed=false;
    for(var i=0;i<snapshots.length;i++){
      var s=snapshots[i];
      var el=s.el;
      if(!el||!el.isConnected)continue;
      var cs=el.ownerDocument?getComputedStyle(el):null;
      if(!cs)continue;
      for(var p=0;p<PRESERVED_STYLE_PROPS.length;p++){
        var prop=PRESERVED_STYLE_PROPS[p];
        if(cs[prop]!==s.vals[prop]){
          el.style[prop]=s.vals[prop];
          changed=true;
        }
      }
    }
    if(!changed)break;
  }
}

// Move el to the END of page pageIndex (0-based) inside the content
// container. Two placement modes:
//   - Drag drop (placeOnPage=false): keep the EXACT visual position where
//     the element was dropped. The static flow position changes after
//     reparenting, so the transform is compensated by exactly the flow
//     shift (delta between untransformed rects before/after).
//   - Sidebar move (placeOnPage=true): land the element INSIDE the target
//     page - it keeps its offset relative to the page it was on (clamped
//     into the target page's bounds) so the moved element is actually
//     visible on the new page, instead of floating at its old viewport
//     spot on a different page.
function reparentElementToPage(el,pageIndex,bid,placeOnPage){
  if(!el||!el.parentNode)return;
  var boundaries=getPageBoundaryEls();
  if(pageIndex<0)pageIndex=0;
  if(pageIndex>boundaries.length)pageIndex=boundaries.length;
  // Never move a page into itself or into one of its own descendants.
  if(isPageBoundary(el))return;
  var target=getPageContainer(pageIndex);
  if(!target||el===target||el.contains(target))return;
  var oldParent=el.parentNode;
  var oldNextSibling=el.nextSibling;
  var oldTransform=el.style.transform||'';
  // Snapshot the element's appearance (its whole subtree) BEFORE the move:
  // reparenting changes which ancestor-context CSS rules match, so styles
  // would be silently lost on the new page. restoreSubtreeStyles() below
  // re-inlines exactly what changed.
  var styleSnapshots=captureSubtreeStyles(el);
  var cc=getContentContainer();
  var curPage=getPageIndexOf(el);
  // The page AREA the element currently lives on - the relative offset is
  // measured against its top so it survives the reparent.
  var oldPageTop=cc.getBoundingClientRect().top;
  if(curPage>0){
    oldPageTop=boundaries[curPage-1].getBoundingClientRect().top;
  }
  var ot=getTranslate(el);
  el.style.transform='';
  var oldRect=el.getBoundingClientRect();
  // Reserve the origin space BEFORE the element moves, so the origin page
  // keeps its layout (and a visible spot to insert other elements). The
  // placeholder is removed again below if the move turns out to be a no-op.
  var placeholder=createPagePlaceholder(el,oldParent,oldNextSibling,oldRect);
  // The element's VISUAL offset within its current page (its previous
  // translate is part of where the user sees it) - the placement below
  // reproduces that same relative spot on the target page.
  var relTop=(oldRect.top+ot[1])-oldPageTop;
  if(pageIndex===0){
    // Page 1 lives directly in the content container, BEFORE the first
    // page container (which starts page 2).
    if(boundaries.length>0)target.insertBefore(el,boundaries[0]);
    else target.appendChild(el);
  }else{
    // Pages 2+ are real containers - the element goes INSIDE them.
    target.appendChild(el);
  }
  // Preserve the pre-move appearance BEFORE measuring newRect, so the
  // transform compensation below lands the element exactly where it was
  // dropped - with its styles intact, not reverted to page defaults.
  restoreSubtreeStyles(el,styleSnapshots);
  // Content on a page container must stay selectable even though the page
  // container itself is click-through (pointer-events:none) so it can never
  // block elements that visually overlap the page area.
  syncElementPointerEvents(el);
  var newRect=el.getBoundingClientRect();
  var tx,ty;
  if(placeOnPage){
    // Land the element ON the target page: same relative offset into the
    // target page's content area, clamped so the whole element stays
    // inside the page. The element is then visible when the user scrolls
    // to the page it was moved to. Y is an ABSOLUTE placement on the new
    // page (the previous translate is not carried over - it only described
    // the position on the OLD page); X keeps the visual position including
    // any previous horizontal translate.
    var tTop,tH;
    if(pageIndex===0){
      var cr=cc.getBoundingClientRect();
      tTop=cr.top;
      tH=(boundaries.length>0?boundaries[0].getBoundingClientRect().top:cr.bottom)-tTop;
    }else{
      tH=boundaries[pageIndex-1].getBoundingClientRect().height;
      tTop=boundaries[pageIndex-1].getBoundingClientRect().top;
    }
    var maxRel=Math.max(0,tH-oldRect.height);
    var finalTop=tTop+Math.min(Math.max(relTop,0),maxRel);
    tx=ot[0]+oldRect.left-newRect.left;
    ty=finalTop-newRect.top;
  }else{
    // Drag drop: keep the exact drop position (compensate the flow shift).
    tx=ot[0]+oldRect.left-newRect.left;
    ty=ot[1]+oldRect.top-newRect.top;
  }
  var nt=(tx===0&&ty===0)?'':'translate('+tx+'px,'+ty+'px)';
  el.style.transform=nt;
  var sameSpot=(oldParent===el.parentNode&&oldNextSibling===el.nextSibling);
  if(sameSpot&&placeholder&&placeholder.parentNode)placeholder.remove();
  // The element came home: its origin-space placeholder(s) now live in the
  // SAME container as the element (e.g. moved to page 2 then back to page
  // 1, or dragged to a new spot within its own page). A placeholder next
  // to the element it preserves would double the space, so they are
  // removed - but recorded on the undo entry so undoing the move restores
  // the exact pre-move layout.
  var homePlaceholders=[];
  var allPhHome=document.querySelectorAll('[data-klone-page-placeholder]');
  for(var zh=0;zh<allPhHome.length;zh++){
    var zph=allPhHome[zh];
    if(zph.__kloneOriginEl===el&&zph.parentNode===el.parentNode){
      homePlaceholders.push({ph:zph,parentNode:zph.parentNode,nextSibling:zph.nextSibling});
      zph.remove();
    }
  }
  if(bid>0&&!sameSpot){
    undoStack.push({
      property:'__reparent__',
      element:el,
      oldParent:oldParent,
      oldNextSibling:oldNextSibling,
      oldTransform:oldTransform,
      newParent:el.parentNode,
      newNextSibling:el.nextSibling,
      newTransform:nt,
      placeholder:placeholder,
      homePlaceholders:homePlaceholders,
      batchId:bid
    });
  }
}

// 0-based index of the page el currently lives on. Pages 2+ are real
// containers, so the page is simply the page container that CONTAINS the
// element; anything outside every page container is on page 1.
function getPageIndexOf(el){
  if(!el)return 0;
  var boundaries=getPageBoundaryEls();
  for(var i=0;i<boundaries.length;i++){
    if(boundaries[i].contains(el))return i+1;
  }
  return 0;
}

// The 0-based page whose AREA contains viewport y, for an element that
// currently lives on page curPage. Only pages the element could have been
// dragged INTO are candidates: its own page (no move), pages BELOW it
// (dropping down), or pages above it up to page 1 (dropping up). Page
// containers reserve a full page each and sit flush together, so the
// centre of a dropped element maps to exactly one page area. Defaulting to
// the element's OWN page is the key: without it, dragging an element
// within page 2+ would re-derive page 1 as the target and silently yank
// the element back to the first page.
function getDropPage(cy,curPage){
  var boundaries=getPageBoundaryEls();
  var N=boundaries.length;
  if(N===0)return 0;
  var rects=[];
  for(var i=0;i<N;i++)rects.push(boundaries[i].getBoundingClientRect());
  if(curPage===0){
    // Page 1: only pages below (boundary j holds page j+2).
    for(var bi=0;bi<N;bi++){
      if(cy>=rects[bi].top&&cy<rects[bi].bottom)return bi+1;
    }
    // Dropping below every page area lands on the last page.
    return (cy>=rects[N-1].bottom)?N:0;
  }
  // Pages 2+ live in page containers (boundary curPage-1 holds the page).
  var own=rects[curPage-1];
  if(cy>=own.bottom){
    // Dropped below its own page: pages curPage+1..N (boundaries curPage..).
    for(var bj=curPage;bj<N;bj++){
      if(cy>=rects[bj].top&&cy<rects[bj].bottom)return bj+1;
    }
    return N;
  }
  if(cy<own.top){
    // Dropped above its own page: pages 1..curPage (boundaries 0..curPage-2).
    for(var bk=0;bk<curPage-1;bk++){
      if(cy>=rects[bk].top&&cy<rects[bk].bottom)return bk+1;
    }
    return 0;
  }
  return curPage;
}

// Move the current selection to the END of page pageIndex (0-based).
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
    // The sidebar move LANDS the element on the target page (rather than
    // keeping its old viewport spot) so the move is actually visible.
    reparentElementToPage(e,target,bid,true);
  }
  redoStack=[];
  updateBoundaryMarkers();
  reportPages(false);
  fireSelected();
  updateSelectionBox();
  // Bring the moved element into view so the move is visible (the wrap is
  // the nearest scroll container, so this never scrolls the outer page).
  if(selectedEls.length>0&&selectedEls[0].scrollIntoView){
    selectedEls[0].scrollIntoView({block:'nearest',inline:'nearest'});
  }
}

// Drop any selected element that is no longer in the document (its page was
// deleted, or an undo/redo detached it), so the sidebar never edits - and
// getComputedStyle is never called on - a detached node.
function pruneDetachedSelection(){
  var removed=false;
  for(var i=selectedEls.length-1;i>=0;i--){
    if(!selectedEls[i].isConnected){selectedEls.splice(i,1);removed=true;}
  }
  if(!removed)return;
  if(selectedEls.length===0){
    if(selBoxEl)selBoxEl.style.display='none';
    window.parent.postMessage({type:'selection-cleared'},'*');
  }else{
    fireSelected();
  }
}

function deselect(){
  for(var i=0;i<selectedEls.length;i++){
    selectedEls[i].style.outline='';
    selectedEls[i].style.outlineOffset='';
  }
  selectedEls=[];
  marqueeBase=[];
  marqueePrevSel=[];
  if(selBoxEl)selBoxEl.style.display='none';
  hideMarquee();
  hideGuides();
}

function highlightSelected(){
  // Multi-select: no selection box, so each element gets its own outline.
  for(var i=0;i<selectedEls.length;i++){
    selectedEls[i].style.outline='2px solid #8b5cf6';
    selectedEls[i].style.outlineOffset='2px';
  }
}

function addToSelection(el){
  if(selectedEls.indexOf(el)>=0)return;
  selectedEls.push(el);
  // Only outline when multi-selecting (marquee) - single-select uses the
  // selection box instead, so no double violet border.
  if(selectedEls.length>1){
    el.style.outline='2px solid #8b5cf6';
    el.style.outlineOffset='2px';
  }
}

// The SYSTEM FRAME: a template's .scroll-wrapper page container and the
// editor-created .klone-frame wrapper around it. The frame belongs to the
// system — it defines the page width/centering/scrolling — so it is STICKY:
// never selectable, hoverable, draggable, resizable or deletable.
function isSystemFrame(el){
  if(!el||!el.tagName)return false;
  if(el.getAttribute&&el.getAttribute('data-klone-system-frame')!==null)return true;
  if(el.classList){
    if(el.classList.contains('scroll-wrapper'))return true;
    if(el.classList.contains('klone-frame'))return true;
    if(el.classList.contains('klone-render-space'))return true;
  }
  return false;
}

function isClickable(el){
  if(!el||!el.tagName)return false;
  var tag=el.tagName.toLowerCase();
  // The document skeleton and invisible head elements are never selectable.
  if(tag==='html'||tag==='head'||tag==='body'||tag==='script')return false;
  if(tag==='style'||tag==='meta'||tag==='link'||tag==='title'||tag==='base'||tag==='noscript'||tag==='template')return false;
  if(el.getAttribute&&el.getAttribute('data-editor-ui'))return false;
  if(el.getAttribute&&el.getAttribute('data-klone-page-boundary')!==null)return false;
  // Moved-element placeholders are system-level too - never selectable.
  if(el.getAttribute&&el.getAttribute('data-klone-page-placeholder')!==null)return false;
  // The system frame is sticky - it can never be selected.
  if(isSystemFrame(el))return false;
  return true;
}

function getClickableElements(){
  var all=document.querySelectorAll('*');
  var result=[];
  for(var i=0;i<all.length;i++){
    if(isClickable(all[i]))result.push(all[i]);
  }
  return result;
}

function setHover(el){
  if(hoveredEl===el)return;
  clearHover();
  hoveredEl=el;
  el.style.outline='1px dashed rgba(139,92,246,0.6)';
  el.style.outlineOffset='1px';
}

function clearHover(){
  if(hoveredEl){
    hoveredEl.style.outline='';
    hoveredEl.style.outlineOffset='';
    hoveredEl=null;
  }
}

// Color-like properties keep their ALPHA so the sidebar's opacity field
// stays in sync: computed values come back as rgb(...)/rgba(...), which we
// forward as-is. Fully-opaque colors may arrive as rgb(...) too - the
// sidebar converts to hex for display and derives the alpha itself. Every
// other property sends its raw value.
function isColorProperty(p){return p==='color'||p==='backgroundColor';}

function formatStyleValue(property,computedValue){
  if(isColorProperty(property)){
    if(!computedValue||computedValue==='transparent')return'rgba(0, 0, 0, 0)';
    return computedValue;
  }
  return computedValue;
}
// Content moved onto a page container re-enables pointer events on itself
// (the page box is click-through, so without this it could never be
// selected). Kept in sync on reparent AND undo/redo: only elements whose
// parent IS a page container carry the inline override.
function syncElementPointerEvents(el){
  if(!el||!el.style)return;
  if(el.parentNode&&isPageBoundary(el.parentNode))el.style.pointerEvents='auto';
  else if(el.style.pointerEvents==='auto')el.style.pointerEvents='';
}

function performUndo(){
  if(undoStack.length===0)return;
  var lastBatch=undoStack[undoStack.length-1].batchId;
  var entries=[];
  while(undoStack.length>0&&undoStack[undoStack.length-1].batchId===lastBatch){
    entries.push(undoStack.pop());
  }
  for(var i=0;i<entries.length;i++){
    var entry=entries[i];
    if(entry.property==='__delete__'){
      // Undoing a delete also brings back the origin-space placeholders
      // that were freed along with the element. Record an inverse redo
      // entry so the deletion can be replayed by redo.
      redoStack.push({element:entry.element,property:'__delete__',oldValue:null,nextSibling:entry.nextSibling,parentNode:entry.parentNode,placeholders:entry.placeholders,batchId:lastBatch});
      restorePlaceholders(entry.placeholders);
      if(entry.nextSibling&&entry.nextSibling.parentNode){
        entry.nextSibling.parentNode.insertBefore(entry.element,entry.nextSibling);
      }else if(entry.parentNode){
        entry.parentNode.appendChild(entry.element);
      }
    }else if(entry.property==='__page_break__'){
      // Reverse the toggle: an added split is removed, a removed one is
      // restored.
      redoStack.push({property:'__page_break__',element:entry.element,adding:!entry.adding,batchId:lastBatch});
      if(entry.adding)entry.element.removeAttribute('data-klone-page-break');
      else entry.element.setAttribute('data-klone-page-break','');
      updatePageBreakMarkers();
      reportPageBreak(true);
    }else if(entry.property==='__page_boundary__'){
      // Reverse the boundary op: an added boundary is removed, a removed
      // one is restored at its original position (together with any
      // placeholders that were freed with its content).
      redoStack.push({property:'__page_boundary__',element:entry.element,adding:!entry.adding,nextSibling:entry.nextSibling,parentNode:entry.parentNode,placeholders:entry.placeholders,batchId:lastBatch});
      if(entry.adding){
        entry.element.remove();
      }else if(entry.parentNode){
        restorePlaceholders(entry.placeholders);
        if(entry.nextSibling&&entry.nextSibling.parentNode)entry.nextSibling.parentNode.insertBefore(entry.element,entry.nextSibling);
        else entry.parentNode.appendChild(entry.element);
      }
      updateBoundaryMarkers();
      reportPages(true);
    }else if(entry.property==='__component__'){
      // A duplicated/pasted element. Undo removes it; redo re-inserts it
      // at its recorded position (so it reappears exactly where it landed).
      redoStack.push({property:'__component__',element:entry.element,adding:!entry.adding,nextSibling:entry.nextSibling,parentNode:entry.parentNode,batchId:lastBatch});
      if(entry.adding){
        entry.element.remove();
      }else if(entry.parentNode){
        if(entry.nextSibling&&entry.nextSibling.parentNode)entry.nextSibling.parentNode.insertBefore(entry.element,entry.nextSibling);
        else entry.parentNode.appendChild(entry.element);
      }
    }else if(entry.property==='__reparent__'){
      // Restore the pre-move position; push the swapped entry so redo
      // moves the element back to where the user put it. The origin-space
      // placeholder is removed with the undo (the element returns to that
      // spot) and re-added by redo; placeholders that were dropped because
      // the element came home are restored.
      redoStack.push({property:'__reparent__',element:entry.element,oldParent:entry.newParent,oldNextSibling:entry.newNextSibling,oldTransform:entry.newTransform,newParent:entry.oldParent,newNextSibling:entry.oldNextSibling,newTransform:entry.oldTransform,placeholder:entry.placeholder,homePlaceholders:entry.homePlaceholders,batchId:lastBatch});
      if(entry.placeholder&&entry.placeholder.parentNode)entry.placeholder.remove();
      if(entry.oldNextSibling&&entry.oldNextSibling.parentNode){
        entry.oldParent.insertBefore(entry.element,entry.oldNextSibling);
      }else if(entry.oldParent){
        entry.oldParent.appendChild(entry.element);
      }
      entry.element.style.transform=entry.oldTransform;
      restorePlaceholders(entry.homePlaceholders);
      syncElementPointerEvents(entry.element);
    }else if(entry.property==='__text__'){
      var cur=entry.element.innerHTML;
      redoStack.push({element:entry.element,property:'__text__',oldValue:cur,batchId:lastBatch});
      entry.element.innerHTML=entry.oldValue;
    }else{
      var currentValue=entry.element.style[entry.property];
      redoStack.push({element:entry.element,property:entry.property,oldValue:currentValue,batchId:lastBatch});
      entry.element.style[entry.property]=entry.oldValue;
    }
  }
  // Undoing/redoing a page delete detaches whole subtrees - drop anything
  // no longer in the document from the selection.
  pruneDetachedSelection();
  // Page-break markers must mirror the live DOM after any undo (a deleted
  // marked element being restored, a break toggled back, etc.).
  updatePageBreakMarkers();
  reportPageBreak(false);
  updateBoundaryMarkers();
  reportPages(false);
  if(entries.length>0&&entries[0].property==='__text__'){
    window.parent.postMessage({type:'style-updated',property:'textContent',value:entries[0].element.textContent},'*');
  }else if(entries.length>0&&entries[0].property!=='__delete__'&&entries[0].property!=='__page_break__'&&entries[0].property!=='__page_boundary__'&&entries[0].property!=='__reparent__'){
    var s2=getComputedStyle(entries[0].element);
    window.parent.postMessage({type:'style-updated',property:entries[0].property,value:formatStyleValue(entries[0].property,s2[entries[0].property])},'*');
  }
  // Send full element snapshot so parent toolbar stays in sync
  if(selectedEls.length>0){fireSelected();}
}

function performRedo(){
  if(redoStack.length===0)return;
  var lastBatch=redoStack[redoStack.length-1].batchId;
  var entries=[];
  while(redoStack.length>0&&redoStack[redoStack.length-1].batchId===lastBatch){
    entries.push(redoStack.pop());
  }
  for(var i=0;i<entries.length;i++){
    var entry=entries[i];
    if(entry.property==='__page_break__'){
      undoStack.push({property:'__page_break__',element:entry.element,adding:!entry.adding,batchId:lastBatch});
      if(entry.adding)entry.element.setAttribute('data-klone-page-break','');
      else entry.element.removeAttribute('data-klone-page-break');
      updatePageBreakMarkers();
      reportPageBreak(true);
    }else if(entry.property==='__page_boundary__'){
      undoStack.push({property:'__page_boundary__',element:entry.element,adding:!entry.adding,nextSibling:entry.nextSibling,parentNode:entry.parentNode,placeholders:entry.placeholders,batchId:lastBatch});
      // entry.adding=true means "undo of an add" → remove; false means
      // "undo of a remove" → restore at the recorded position.
      if(entry.adding){
        entry.element.remove();
        // Re-free the placeholders that belonged to the deleted content.
        if(entry.placeholders){
          for(var pfi=0;pfi<entry.placeholders.length;pfi++){
            var pf=entry.placeholders[pfi];
            if(pf&&pf.ph&&pf.ph.isConnected)pf.ph.remove();
          }
        }
      }else if(entry.parentNode){
        if(entry.nextSibling&&entry.nextSibling.parentNode)entry.nextSibling.parentNode.insertBefore(entry.element,entry.nextSibling);
        else entry.parentNode.appendChild(entry.element);
      }
      updateBoundaryMarkers();
      reportPages(true);
    }else if(entry.property==='__component__'){
      // A duplicated/pasted element. Redo re-inserts it (or removes it if
      // the entry represents the undo of an add).
      undoStack.push({property:'__component__',element:entry.element,adding:!entry.adding,nextSibling:entry.nextSibling,parentNode:entry.parentNode,batchId:lastBatch});
      if(entry.adding){
        if(entry.parentNode){
          if(entry.nextSibling&&entry.nextSibling.parentNode)entry.nextSibling.parentNode.insertBefore(entry.element,entry.nextSibling);
          else entry.parentNode.appendChild(entry.element);
        }
      }else{
        entry.element.remove();
      }
    }else if(entry.property==='__reparent__'){
      undoStack.push({property:'__reparent__',element:entry.element,oldParent:entry.newParent,oldNextSibling:entry.newNextSibling,oldTransform:entry.newTransform,newParent:entry.oldParent,newNextSibling:entry.oldNextSibling,newTransform:entry.oldTransform,placeholder:entry.placeholder,homePlaceholders:entry.homePlaceholders,batchId:lastBatch});
      // Redo moves the element to the state it had BEFORE the undo ran
      // (the entry's "old" fields: the post-reparent position), and puts
      // the origin-space placeholder back where the element had been.
      // Placeholders that the move had dropped (element came home) are
      // dropped again.
      if(entry.placeholder&&!entry.placeholder.isConnected){
        if(entry.newNextSibling&&entry.newNextSibling.parentNode)entry.newParent.insertBefore(entry.placeholder,entry.newNextSibling);
        else if(entry.newParent)entry.newParent.appendChild(entry.placeholder);
      }
      if(entry.homePlaceholders){
        for(var hri=0;hri<entry.homePlaceholders.length;hri++){
          var hr=entry.homePlaceholders[hri];
          if(hr&&hr.ph&&hr.ph.isConnected)hr.ph.remove();
        }
      }
      if(entry.oldNextSibling&&entry.oldNextSibling.parentNode){
        entry.oldParent.insertBefore(entry.element,entry.oldNextSibling);
      }else if(entry.oldParent){
        entry.oldParent.appendChild(entry.element);
      }
      entry.element.style.transform=entry.oldTransform;
      syncElementPointerEvents(entry.element);
    }else if(entry.property==='__delete__'){
      // Redo of a delete: remove the element again and free the
      // origin-space placeholders that came back with the undo. Push the
      // inverse entry so undo can restore it once more.
      undoStack.push({element:entry.element,property:'__delete__',oldValue:null,nextSibling:entry.nextSibling,parentNode:entry.parentNode,placeholders:entry.placeholders,batchId:lastBatch});
      removePlaceholdersFor(entry.element);
      entry.element.remove();
    }else if(entry.property==='__text__'){
      var cur=entry.element.innerHTML;
      undoStack.push({element:entry.element,property:'__text__',oldValue:cur,batchId:lastBatch});
      entry.element.innerHTML=entry.oldValue;
    }else{
      var currentValue=entry.element.style[entry.property];
      undoStack.push({element:entry.element,property:entry.property,oldValue:currentValue,batchId:lastBatch});
      entry.element.style[entry.property]=entry.oldValue;
    }
  }
  // Redoing a page delete detaches whole subtrees - drop anything no longer
  // in the document from the selection.
  pruneDetachedSelection();
  // Page-break markers must mirror the live DOM after any redo.
  updatePageBreakMarkers();
  reportPageBreak(false);
  updateBoundaryMarkers();
  reportPages(false);
  if(entries[0].property==='__text__'){
    window.parent.postMessage({type:'style-updated',property:'textContent',value:entries[0].element.textContent},'*');
  }else if(entries[0].property!=='__page_break__'&&entries[0].property!=='__page_boundary__'&&entries[0].property!=='__reparent__'){
    var s3=getComputedStyle(entries[0].element);
    window.parent.postMessage({type:'style-updated',property:entries[0].property,value:formatStyleValue(entries[0].property,s3[entries[0].property])},'*');
  }
  // Send full element snapshot so parent toolbar stays in sync
  if(selectedEls.length>0){fireSelected();}
}

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
        backgroundImage:s.backgroundImage,
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
        fontWeight:s.fontWeight,
        fontFamily:s.fontFamily,
        lineHeight:s.lineHeight,
        letterSpacing:s.letterSpacing,
        textDecorationLine:s.textDecorationLine,
        textTransform:s.textTransform,
        rotate:s.rotate,
        opacity:s.opacity,
        borderRadius:s.borderRadius,
        visibility:s.visibility,
        mixBlendMode:s.mixBlendMode,
        rotate:s.rotate,
        scaleX:s.scaleX,
        scaleY:s.scaleY,
        scale:s.scale,
        borderTopWidth:s.borderTopWidth,
        borderRightWidth:s.borderRightWidth,
        borderBottomWidth:s.borderBottomWidth,
        borderLeftWidth:s.borderLeftWidth,
        borderColor:s.borderColor,
        borderStyle:s.borderStyle,
        transform:s.transform
      }
    });
  }
  window.parent.postMessage({
    type:'element-selected',
    elements:infos,
    page:selectedEls.length>0?getPageIndexOf(selectedEls[0]):0,
    pageCount:countPages()
  },'*');
  updateSelectionBox();
}

function deleteSelected(){
  if(selectedEls.length===0)return;
  batchId++;
  for(var i=0;i<selectedEls.length;i++){
    var el=selectedEls[i];
    // Placeholders that preserve this element's origin space go with it -
    // the element no longer exists, so the reserved space is freed. They
    // are stored on the undo entry so undoing the delete restores them.
    var removedPlaceholders=removePlaceholdersFor(el);
    undoStack.push({element:el,property:'__delete__',oldValue:null,nextSibling:el.nextSibling,parentNode:el.parentNode,placeholders:removedPlaceholders,batchId:batchId});
    el.remove();
  }
  selectedEls=[];
  if(selBoxEl)selBoxEl.style.display='none';
  window.parent.postMessage({type:'selection-cleared'},'*');
  // Deleting a marked element must clear its split marker and resync the
  // parent (deduped: only reports when the break count actually changed).
  updatePageBreakMarkers();
  reportPageBreak(false);
}

function getTranslate(el){
  var t=el.style.transform||'';
  var m=t.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
  if(m)return[parseFloat(m[1]),parseFloat(m[2])];
  // The inline transform may be authored differently or normalized by the
  // browser (translateX/translateY, matrix(), matrix3d()). Fall back to the
  // COMPUTED transform, which always reflects the element's CURRENT position
  // - so a re-grab continues from where the element actually is, never from
  // its original position.
  var cs=el.ownerDocument?getComputedStyle(el).transform:'none';
  if(cs&&cs!=='none'){
    var mm=cs.match(/matrix3d\(([^)]+)\)/)||cs.match(/matrix\(([^)]+)\)/);
    if(mm){
      var parts=mm[1].split(',').map(parseFloat);
      if(parts.length>=6){
        // matrix: tx=parts[4], ty=parts[5]; matrix3d: tx=parts[12], ty=parts[13]
        var is3d=parts.length===16;
        return[parts[is3d?12:4]||0,parts[is3d?13:5]||0];
      }
    }
  }
  return[0,0];
}

// The document container: the default preview template uses a centered
// .scroll-wrapper; user-authored HTML falls back to the body.
// top/bottom are DOCUMENT-space vertical bounds (the content's top and
// bottom edges), NOT the visible viewport edges. They are scroll-
// independent: a scrolled viewport shows a slice of the content, but the
// element may be dragged anywhere inside the full content area - including
// below the current screen while auto-scroll carries it to the last page -
// and only clamps at the actual document edges so it never leaves the body.
function getMoveBounds(){
  var wrap=document.querySelector('.scroll-wrapper');
  var box=wrap||document.body;
  if(!box)return null;
  var r=box.getBoundingClientRect();
  var top,bottom;
  if(wrap){
    // .scroll-wrapper is the scroll container: its content runs from its
    // top edge down scrollHeight (document space, unaffected by scrollTop).
    top=r.top;
    var sh=Math.max(box.scrollHeight,box.clientHeight);
    bottom=top+sh;
  }else{
    // body fallback: the document origin is the top of the page.
    var dh=document.documentElement;
    top=0;
    bottom=Math.max(dh?dh.scrollHeight:0,dh?dh.clientHeight:0,r.height);
  }
  return{left:r.left,right:r.right,top:top,bottom:bottom};
}

// Clamp a proposed translate-x so the element NEVER leaves the container
// horizontally - dragging outside must not expand the container width.
// The container itself is the page bounds, so it moves freely.
function clampTranslateX(el,nx){
  var bounds=getMoveBounds();
  if(!bounds)return nx;
  if(isContainer(el))return nx;
  var cur=getTranslate(el);
  var r=el.getBoundingClientRect();
  var relX=nx-cur[0];
  if(r.left+relX<bounds.left)return cur[0]+(bounds.left-r.left);
  if(r.right+relX>bounds.right)return cur[0]+(bounds.right-r.right);
  return nx;
}

// Clamp a proposed translate-y so the element NEVER leaves the document
// vertically - it stays inside the body (top edge at/after the content
// top, bottom edge at/before the content bottom). Mirrors
// clampTranslateX; the container itself moves freely.
function clampTranslateY(el,ny){
  var bounds=getMoveBounds();
  if(!bounds)return ny;
  if(isContainer(el))return ny;
  var cur=getTranslate(el);
  var r=el.getBoundingClientRect();
  // Convert the element's viewport rect to DOCUMENT space (add the current
  // scroll offset) so it compares against the scroll-independent bounds.
  var st=getScrollState();
  var S=(st&&st.el)?st.scrollTop:0;
  var docTop=r.top+S;
  var docBottom=r.bottom+S;
  var relY=ny-cur[1];
  if(docTop+relY<bounds.top)return cur[1]+(bounds.top-docTop);
  if(docBottom+relY>bounds.bottom)return cur[1]+(bounds.bottom-docBottom);
  return ny;
}

// Elements whose width is LOCKED: the document container (html/body) and
// the default template's .scroll-wrapper. Their width defines the page
// layout, so it must never be editable - neither via the properties
// sidebar nor via the resize handles.
function isContainer(el){
  if(!el||!el.tagName)return false;
  var tag=el.tagName.toLowerCase();
  if(tag==='html'||tag==='head'||tag==='body')return true;
  // The template's system frame (and its editor wrapper) is a locked
  // container too - it can never be moved, resized or styled.
  return isSystemFrame(el);
}

// Template documents are wrapped in a .scroll-wrapper page frame. That frame
// is part of the SYSTEM, so it must never be dragged around the canvas. To
// make it sticky we wrap it in a dedicated outer .klone-frame div (same width
// as the frame, centered, full height) that the editor treats as a locked
// container - the inner .scroll-wrapper keeps its authored layout, width and
// internal scrolling exactly as before. User-authored HTML (no
// .scroll-wrapper) is left completely untouched.
function ensureSystemFrame(){
  var wrap=document.querySelector('.scroll-wrapper');
  if(!wrap)return; // not a template document - no system frame to protect
  var parent=wrap.parentNode;
  if(!parent)return;
  // Already wrapped by a previous run (reloaded documents stay idempotent).
  if(parent.nodeType===1&&parent.classList&&parent.classList.contains('klone-frame')){
    // Re-fit the frame to the wrapper's CURRENT width - the canvas may have
    // a different size than when this document was saved/loaded.
    syncSystemFrameSize();
    return;
  }
  var frame=document.createElement('div');
  frame.className='klone-frame';
  frame.setAttribute('data-klone-system-frame','');
  // Fill the canvas height so the inner .scroll-wrapper (height:100%) has a
  // real viewport to scroll within. The frame itself is click-through and
  // does NOT clip: the .scroll-wrapper is the scroll container, so a tall
  // user page scrolls to its bottom instead of being cut off.
  frame.style.cssText='width:100%;max-width:100%;height:100%;margin:0 auto;overflow:visible;';
  parent.insertBefore(frame,wrap);
  frame.appendChild(wrap);
  syncSystemFrameSize();
  // The sticky frame sits at its authored position - clear any leftover
  // transform from documents that were dragged before this feature existed
  // (otherwise the offset would clip content against the frame's
  // overflow:hidden).
  wrap.style.transform='';
  frame.style.transform='';
}

// Fit the .klone-frame to the wrapper's CURRENT computed width. The frame
// hugs the page (so the wrapper's scrollbar sits at the page edge, not the
// canvas edge) but must never stay frozen at a width measured before the
// document's CSS/fonts were laid out - that clips or stretches the page
// (the intermittent reload crash). Called on init and whenever the wrapper
// or canvas resizes.
function syncSystemFrameSize(){
  var wrap=document.querySelector('.scroll-wrapper');
  if(!wrap)return;
  var parent=wrap.parentNode;
  if(!parent||parent.nodeType!==1||!parent.classList||!parent.classList.contains('klone-frame'))return;
  var cs=getComputedStyle(wrap);
  var w=parseFloat(cs.width);
  parent.style.width=(isFinite(w)&&w>0?w+'px':'100%');
}

// True when applying a width-related style to any selected element would
// hit the locked container.
function isWidthLocked(property){
  if(property!=='width'&&property!=='maxWidth'&&property!=='minWidth')return false;
  for(var i=0;i<selectedEls.length;i++){
    if(isContainer(selectedEls[i]))return true;
  }
  return false;
}

function createMarquee(){
  if(marqueeEl)return;
  marqueeEl=document.createElement('div');
  marqueeEl.setAttribute('data-editor-ui','marquee');
  marqueeEl.style.cssText='position:fixed;border:1px solid rgba(139,92,246,0.9);background:rgba(139,92,246,0.10);pointer-events:none;z-index:99996;display:none;border-radius:1px;';
  document.body.appendChild(marqueeEl);
}
function showMarquee(x1,y1,x2,y2){
  if(!marqueeEl)createMarquee();
  marqueeEl.style.display='block';
  marqueeEl.style.left=Math.min(x1,x2)+'px';
  marqueeEl.style.top=Math.min(y1,y2)+'px';
  marqueeEl.style.width=Math.abs(x2-x1)+'px';
  marqueeEl.style.height=Math.abs(y2-y1)+'px';
}
function hideMarquee(){
  if(marqueeEl)marqueeEl.style.display='none';
}

/* ── Alignment guides + snapping (Figma/Canva-style) ── */
var SNAP_DIST=3;
var GUIDE_COLOR='#ff4d6d';

function createGuidesLayer(){
  if(guidesLayer)return;
  guidesLayer=document.createElement('div');
  guidesLayer.setAttribute('data-editor-ui','guides');
  guidesLayer.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:99997;overflow:hidden;';
  document.body.appendChild(guidesLayer);
}
function hideGuides(){
  if(nudgeGuideTimer){clearTimeout(nudgeGuideTimer);nudgeGuideTimer=null;}
  if(guidesLayer)guidesLayer.innerHTML='';
}
// Arrow-key nudging has no mouseup to clear the guide overlay, so the
// guides auto-hide shortly after the last nudge (any hide/drag/deselect
// clears the timer too).
function scheduleHideGuides(ms){
  if(nudgeGuideTimer)clearTimeout(nudgeGuideTimer);
  nudgeGuideTimer=setTimeout(hideGuides,ms||1200);
}
function rectOf(el){
  var r=el.getBoundingClientRect();
  return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
}
function shiftRect(r,dx,dy){
  return {left:r.left+dx,top:r.top+dy,right:r.right+dx,bottom:r.bottom+dy,width:r.width,height:r.height};
}
function unionRect(els){
  var r=null;
  for(var i=0;i<els.length;i++){
    var rr=els[i].getBoundingClientRect();
    if(!r){r={left:rr.left,top:rr.top,right:rr.right,bottom:rr.bottom};continue;}
    r.left=Math.min(r.left,rr.left);
    r.top=Math.min(r.top,rr.top);
    r.right=Math.max(r.right,rr.right);
    r.bottom=Math.max(r.bottom,rr.bottom);
  }
  if(!r)return null;
  r.width=r.right-r.left;
  r.height=r.bottom-r.top;
  return r;
}
function getContainerRect(){
  var wrap=document.querySelector('.scroll-wrapper');
  var box=wrap||document.body;
  if(!box)return null;
  var r=box.getBoundingClientRect();
  return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
}
// Everything a dragged element can align to: the page container (for
// center/edge guides) + every other element (excluding the dragged group
// and its ancestors/descendants).
function getAlignTargets(){
  var drags=selectedEls;
  var targets=[];
  var c=getContainerRect();
  if(c)targets.push({isContainer:true,rect:c});
  var all=document.querySelectorAll('*');
  for(var i=0;i<all.length;i++){
    var el=all[i];
    if(!isClickable(el))continue;
    if(isContainer(el))continue;
    var related=false;
    for(var j=0;j<drags.length;j++){
      if(drags[j]===el||drags[j].contains(el)||el.contains(drags[j])){related=true;break;}
    }
    if(related)continue;
    var r=rectOf(el);
    if(r.width===0||r.height===0)continue;
    targets.push({isContainer:false,rect:r});
  }
  return targets;
}
// Smallest edge-alignment delta (left/center/right vs top/center/bottom)
// between two boxes, or null when nothing is within the snap threshold.
// Direction-aware: only deltas pointing ALONG the drag (dragDir) are
// candidates - a line already crossed by the cursor is behind it and must
// not re-grab, which is what made dragging feel "stuck" past a guide.
function bestAlignDelta(a,b,axis,dragDir){
  var ae,be;
  if(axis==='x'){ae=[a.left,a.left+a.width/2,a.right];be=[b.left,b.left+b.width/2,b.right];}
  else{ae=[a.top,a.top+a.height/2,a.bottom];be=[b.top,b.top+b.height/2,b.bottom];}
  var best=null;
  for(var i=0;i<3;i++){
    for(var j=0;j<3;j++){
      var d=be[j]-ae[i];
      if(Math.abs(d)>SNAP_DIST)continue;
      // Skip alignments the cursor is moving AWAY from. d===0 (already on
      // the line) still holds; backward deltas (-dragDir) are ignored.
      if(dragDir!==0&&d!==0&&Math.sign(d)===-dragDir)continue;
      if(best===null||Math.abs(d)<Math.abs(best))best=d;
    }
  }
  return best;
}
function computeSnap(dragR,targets,dirX,dirY){
  var snapX=0,snapY=0,bestX=null,bestY=null;
  for(var t=0;t<targets.length;t++){
    var r=targets[t].rect;
    var dx=bestAlignDelta(dragR,r,'x',dirX);
    if(dx!==null&&(bestX===null||Math.abs(dx)<Math.abs(bestX)))bestX=dx;
    var dy=bestAlignDelta(dragR,r,'y',dirY);
    if(dy!==null&&(bestY===null||Math.abs(dy)<Math.abs(bestY)))bestY=dy;
  }
  if(bestX!==null)snapX=bestX;
  if(bestY!==null)snapY=bestY;
  return {snapX:snapX,snapY:snapY};
}
// Every pair of edges that line up EXACTLY after snapping (used to draw
// the guide lines so they always match the snapped position).
function matchingLines(a,b,axis,isContainer){
  var out=[];
  var ae,be;
  if(axis==='x'){
    ae=[a.left,a.left+a.width/2,a.right];
    be=[b.left,b.left+b.width/2,b.right];
  }else{
    ae=[a.top,a.top+a.height/2,a.bottom];
    be=[b.top,b.top+b.height/2,b.bottom];
  }
  for(var i=0;i<3;i++){
    for(var j=0;j<3;j++){
      if(Math.abs(be[j]-ae[i])<0.5){
        var span,gap,gapMid;
        if(axis==='x'){
          span={from:Math.min(a.top,b.top),to:Math.max(a.bottom,b.bottom)};
          if(a.right<b.left){gap=b.left-a.right;gapMid=(a.right+b.left)/2;}
          else if(b.right<a.left){gap=a.left-b.right;gapMid=(b.right+a.left)/2;}
          else{gap=0;gapMid=(a.left+b.right)/2;}
        }else{
          span={from:Math.min(a.left,b.left),to:Math.max(a.right,b.right)};
          if(a.bottom<b.top){gap=b.top-a.bottom;gapMid=(a.bottom+b.top)/2;}
          else if(b.bottom<a.top){gap=a.top-b.bottom;gapMid=(b.bottom+a.top)/2;}
          else{gap=0;gapMid=(a.top+b.bottom)/2;}
        }
        out.push({pos:be[j],span:span,gap:gap,gapMid:gapMid,isContainer:isContainer,box:b});
      }
    }
  }
  return out;
}
function addGuideLine(vertical,pos,from,to){
  var d=document.createElement('div');
  d.setAttribute('data-editor-ui','guide');
  if(vertical){
    d.style.cssText='position:fixed;width:1px;background:'+GUIDE_COLOR+';pointer-events:none;';
    d.style.left=Math.round(pos)+'px';
    d.style.top=Math.round(from)+'px';
    d.style.height=Math.max(1,Math.round(to-from))+'px';
  }else{
    d.style.cssText='position:fixed;height:1px;background:'+GUIDE_COLOR+';pointer-events:none;';
    d.style.top=Math.round(pos)+'px';
    d.style.left=Math.round(from)+'px';
    d.style.width=Math.max(1,Math.round(to-from))+'px';
  }
  guidesLayer.appendChild(d);
}
function addGuideDot(x,y){
  var d=document.createElement('div');
  d.setAttribute('data-editor-ui','guide');
  d.style.cssText='position:fixed;width:5px;height:5px;border-radius:50%;background:'+GUIDE_COLOR+';pointer-events:none;margin-left:-2px;margin-top:-2px;';
  d.style.left=Math.round(x)+'px';
  d.style.top=Math.round(y)+'px';
  guidesLayer.appendChild(d);
}
function addGuideLabel(x,y,text){
  var d=document.createElement('div');
  d.setAttribute('data-editor-ui','guide');
  d.textContent=text;
  d.style.cssText='position:fixed;background:rgba(255,77,109,0.92);color:#fff;font:600 10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:2px 4px;border-radius:3px;pointer-events:none;white-space:nowrap;transform:translate(-50%,-50%);';
  d.style.left=Math.round(x)+'px';
  d.style.top=Math.round(y)+'px';
  guidesLayer.appendChild(d);
}
// Draw all guide lines + end dots + distance labels for the dragged box.
function renderGuides(dragR,targets){
  if(!guidesLayer)createGuidesLayer();
  guidesLayer.innerHTML='';
  var lines=[];
  for(var t=0;t<targets.length;t++){
    var r=targets[t].rect;
    var xl=matchingLines(dragR,r,'x',targets[t].isContainer);
    for(var i=0;i<xl.length;i++)xl[i].vertical=true;
    var yl=matchingLines(dragR,r,'y',targets[t].isContainer);
    for(var j=0;j<yl.length;j++)yl[j].vertical=false;
    lines=lines.concat(xl,yl);
  }
  for(var k=0;k<lines.length;k++){
    var ln=lines[k];
    if(ln.vertical){
      // Container center = full-length indicator; elements = span + dots
      var from=ln.isContainer?ln.box.top:ln.span.from;
      var to=ln.isContainer?ln.box.bottom:ln.span.to;
      addGuideLine(true,ln.pos,from,to);
      if(!ln.isContainer){
        addGuideDot(ln.pos,from);
        addGuideDot(ln.pos,to);
      }
      if(ln.gap>0)addGuideLabel(ln.gapMid,(from+to)/2,ln.gap+'px');
    }else{
      var fromH=ln.isContainer?ln.box.left:ln.span.from;
      var toH=ln.isContainer?ln.box.right:ln.span.to;
      addGuideLine(false,ln.pos,fromH,toH);
      if(!ln.isContainer){
        addGuideDot(fromH,ln.pos);
        addGuideDot(toH,ln.pos);
      }
      if(ln.gap>0)addGuideLabel((fromH+toH)/2,ln.gapMid,ln.gap+'px');
    }
  }
}

// All selectable elements whose box intersects the marquee rectangle.
// The page container (.scroll-wrapper/html/body) is NEVER marquee-selected:
// it spans the whole document, so it would intersect every drag box.
// The DEEPEST intersecting elements win: when a wrapper (e.g. .header,
// .section) and one of its children both intersect the box, the wrapper
// is dropped so the drag selects the actual element under the box - not
// the whole block around it. Only elements with no other intersecting
// descendant get selected.
function computeMarqueeSelection(box,base){
  var els=getClickableElements();
  var sel=base?base.slice():[];
  // Pass 1: every element whose box intersects the marquee.
  var hits=[];
  for(var i=0;i<els.length;i++){
    var el=els[i];
    if(isContainer(el))continue;
    if(sel.indexOf(el)>=0)continue;
    var r=el.getBoundingClientRect();
    if(r.width===0||r.height===0)continue;
    if(r.left>=box.right||r.right<=box.left||r.top>=box.bottom||r.bottom<=box.top)continue;
    hits.push(el);
  }
  // Pass 2: drop any hit that contains another hit (the wrapper), keeping
  // only the deepest elements the box actually touched.
  for(var i=0;i<hits.length;i++){
    var el=hits[i];
    var hasChildHit=false;
    if(el.children.length>0){
      for(var j=0;j<hits.length;j++){
        if(hits[j]!==el&&el.contains(hits[j])){hasChildHit=true;break;}
      }
    }
    if(!hasChildHit)sel.push(el);
  }
  return sel;
}

function createSelectionBox(){
  if(selBoxEl)return;
  selBoxEl=document.createElement('div');
  selBoxEl.setAttribute('data-editor-ui','box');
  selBoxEl.style.cssText='position:fixed;border:1.5px solid #8b5cf6;pointer-events:none;z-index:99998;display:none;';
  document.body.appendChild(selBoxEl);
  var positions=['l','r','nw','ne','sw','se'];
  for(var i=0;i<positions.length;i++){
    var p=positions[i];
    var h=document.createElement('div');
    h.setAttribute('data-editor-ui','handle');
    h.style.cssText='position:absolute;width:6px;height:6px;background:#8b5cf6;border:1px solid #fff;border-radius:1px;box-shadow:0 0 3px rgba(0,0,0,0.3);pointer-events:auto;z-index:99999;box-sizing:border-box;';
    if(p==='l'){h.style.left='-3px';h.style.top='50%';h.style.marginTop='-3px';h.style.cursor='ew-resize';}
    else if(p==='r'){h.style.right='-3px';h.style.top='50%';h.style.marginTop='-3px';h.style.cursor='ew-resize';}
    else if(p==='nw'){h.style.left='-3px';h.style.top='-3px';h.style.cursor='nwse-resize';}
    else if(p==='ne'){h.style.right='-3px';h.style.top='-3px';h.style.cursor='nesw-resize';}
    else if(p==='sw'){h.style.left='-3px';h.style.bottom='-3px';h.style.cursor='nesw-resize';}
    else{h.style.right='-3px';h.style.bottom='-3px';h.style.cursor='nwse-resize';}
    (function(pos){
      h.addEventListener('mousedown',function(e){
        if(!inspectEnabled||selectedEls.length!==1)return;
        var el=selectedEls[0];
        // The container's width is locked - no resize handles on it.
        if(isContainer(el))return;
        e.preventDefault();
        e.stopPropagation();
        isResizing=true;
        resizeHandle=pos;
        resizeStartX=e.clientX;
        resizeStartWidth=el.getBoundingClientRect().width;
        resizeStartLeft=el.getBoundingClientRect().left;
        resizeStartWidthCss=el.style.width||'';
        resizeStartTransform=el.style.transform||'';
        resizeStartTx=getTranslate(el)[0];
        document.body.style.cursor='ew-resize';
        document.body.style.userSelect='none';
        document.body.style.webkitUserSelect='none';
      });
    })(p);
    selBoxEl.appendChild(h);
  }
}

function updateSelectionBox(){
  if(!selBoxEl)return;
  if(pendingEditEl||selectedEls.length!==1){
    selBoxEl.style.display='none';
    return;
  }
  var el=selectedEls[0];
  var r=el.getBoundingClientRect();
  selBoxEl.style.display='block';
  selBoxEl.style.left=r.left+'px';
  selBoxEl.style.top=r.top+'px';
  selBoxEl.style.width=r.width+'px';
  selBoxEl.style.height=r.height+'px';
}

document.addEventListener('mouseover',function(e){
  if((!inspectEnabled&&!splitMode)||isDragging)return;
  var el=e.target;
  if(!el||!el.tagName)return;
  if(el.getAttribute&&el.getAttribute('data-editor-ui'))return;
  // Don't hover-highlight an element that is already selected (the
  // selection box already marks it).
  if(selectedEls.indexOf(el)>=0)return;
  setHover(el);
});

document.addEventListener('mouseout',function(e){
  if((!inspectEnabled&&!splitMode)||isDragging)return;
  var el=e.target;
  if(!el)return;
  if(hoveredEl===el){
    clearHover();
  }
});

document.addEventListener('click',function(e){
  if(splitMode){
    // The × on a page-boundary chip is handled by its own listener.
    if(e.target&&e.target.getAttribute&&e.target.getAttribute('data-action')==='remove-boundary')return;
    e.preventDefault();
    e.stopPropagation();
    var splitTarget=e.target;
    if(isClickable(splitTarget)&&!isContainer(splitTarget)){
      // Toggle a split on the clicked element. Split mode STAYS ON so the
      // user can add several splitters in one pass; click an already-marked
      // element again to remove that split.
      togglePageBreak(splitTarget,true);
    }else{
      // Clicked the canvas/container background - done splitting.
      setSplitMode(false);
    }
    return;
  }
  if(!inspectEnabled||isDragging)return;
  // The × on a page-boundary chip is handled by its own listener - never
  // let clicking it select the chip/button.
  if(e.target&&e.target.getAttribute&&e.target.getAttribute('data-action')==='remove-boundary')return;
  if(justDragged){justDragged=false;return;}
  e.stopPropagation();
  var el=e.target;
  if(!isClickable(el)){
    // Clicking the page background (container) deselects everything,
    // like clicking empty canvas in Figma - the container itself is
    // never a selectable element.
    if(!e.ctrlKey&&!e.metaKey&&isContainer(el)&&selectedEls.length>0){
      deselect();
      window.parent.postMessage({type:'selection-cleared'},'*');
    }
    return;
  }
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
        // Remaining multi-selection: ensure all keep outlines
        for(var i2=0;i2<selectedEls.length;i2++){
          selectedEls[i2].style.outline='2px solid #8b5cf6';
          selectedEls[i2].style.outlineOffset='2px';
        }
        fireSelected();
      }
    }else{
      selectedEls.push(el);
      // Multi-select: outline every selected element (single-select uses
      // the selection box, so it stays borderless).
      if(selectedEls.length>1)highlightSelected();
      fireSelected();
    }
  }else{
    deselect();
    selectedEls=[el];
    // Single-select: no element outline - the selection box with handles
    // is the single violet indicator.
    fireSelected();
  }
});

// Remove a page boundary from its divider chip (×). Runs as a separate
// listener; stopImmediatePropagation prevents the MAIN click handler (also
// on document, registered earlier) from also seeing the click and selecting
// the chip/button.
document.addEventListener('click',function(e){
  var t=e.target;
  if(!t||!t.getAttribute||t.getAttribute('data-action')!=='remove-boundary')return;
  e.preventDefault();
  e.stopImmediatePropagation();
  var marker=t.closest?t.closest('[data-editor-ui="page-boundary-marker"]'):null;
  var markers=document.querySelectorAll('[data-editor-ui="page-boundary-marker"]');
  var idx=marker?Array.prototype.indexOf.call(markers,marker):-1;
  var boundaries=getPageBoundaryEls();
  var page=(idx>=0)?boundaries[idx]:null;
  if(!page)return;
  // Deleting a page deletes its content too, so a page that HAS content
  // asks first via an INLINE confirm (the preview iframe is sandboxed
  // without allow-modals, so window.confirm is blocked). An empty page is
  // removed straight away. Undo restores the page and its content either
  // way, in a single step.
  if(page.children.length>0&&pendingDeletePage!==page){
    armPageDelete(page);
    return;
  }
  disarmPageDelete();
  removePageBoundary(page,true);
});

document.addEventListener('dblclick',function(e){
  if(!inspectEnabled||isDragging)return;
  var el=e.target;
  if(!el||!isClickable(el))return;
  // Text editing is only allowed on a SINGLE element with NO child
  // elements (leaf nodes). Containers like body/div/table/ul - anything
  // holding other elements - cannot be text-edited: replacing their text
  // would wipe out their children.
  if(selectedEls.length>1)return;
  if(el.children&&el.children.length>0)return;
  e.preventDefault();
  deselect();
  window.parent.postMessage({type:'selection-cleared'},'*');
  var s=getComputedStyle(el);
  var r=el.getBoundingClientRect();
  editReqId++;
  pendingEditEl=el;
  // Hide the element so the parent's edit overlay doesn't show a
  // duplicated copy of the text underneath it.
  el.style.visibility='hidden';
  window.parent.postMessage({
    type:'edit-text-request',
    reqId:editReqId,
    text:el.textContent,
    tag:el.tagName.toLowerCase(),
    rect:{left:r.left,top:r.top,width:r.width,height:r.height},
    styles:{
      fontFamily:s.fontFamily,
      fontSize:s.fontSize,
      fontWeight:s.fontWeight,
      lineHeight:s.lineHeight,
      color:s.color,
      textAlign:s.textAlign,
      paddingTop:s.paddingTop,
      paddingRight:s.paddingRight,
      paddingBottom:s.paddingBottom,
      paddingLeft:s.paddingLeft,
      backgroundColor:s.backgroundColor
    }
  },'*');
});

document.addEventListener('mousedown',function(e){
  // Any interaction outside the armed chip cancels a pending page delete.
  if(pendingDeletePage&&!(e.target&&e.target.getAttribute&&e.target.getAttribute('data-action')==='remove-boundary')){
    disarmPageDelete();
  }
  if(splitMode){
    e.preventDefault();
    return;
  }
  if(!inspectEnabled)return;
  if(e.button!==0)return;
  hideGuides();
  justDragged=false;
  dragMoved=false;
  // A new interaction with the canvas invalidates the previous drag's
  // "dropped for a new page" mark (only the most recent drop can be
  // auto-moved when the user adds a page right after it).
  lastDragMoveEls=[];
  lastDragX=null;
  lastDragY=null;
  dragStartX=e.clientX;
  dragStartY=e.clientY;
  isDragging=true;
  isMoving=false;
  autoScrollDir=null;
  // Shift/Ctrl+drag starts an ADDITIVE marquee (adds to the current
  // selection); a plain drag on empty space replaces the selection.
  marqueeAdditive=(e.shiftKey||e.ctrlKey||e.metaKey);
  marqueeBase=[];
  marqueePrevSel=[];
  var grabEl=e.target;
  var grabSelected=false;
  var grabSelfSelected=false;
  for(var gi=0;gi<selectedEls.length;gi++){
    if(selectedEls[gi]===grabEl)grabSelfSelected=true;
    if(selectedEls[gi].contains(grabEl)){
      grabSelected=true;
      break;
    }
  }
  if(grabSelected){
    // Grabbing a child element that is inside a selected container but is
    // NOT itself selected selects that child first (Figma-like), so the
    // drag moves the clicked element instead of its parent - unless the
    // grab is part of the current selection, which moves as a group.
    if(!grabSelfSelected&&isClickable(grabEl)&&!marqueeAdditive){
      deselect();
      selectedEls=[grabEl];
      fireSelected();
    }
    isMoving=true;
    // Snapshot everything the dragged group can align to (other elements
    // + the page container). Targets are static during the drag, so they
    // are captured once instead of re-queried on every mousemove.
    moveTargets=getAlignTargets();
    // Cache everything the move needs so per-frame work never touches
    // layout: container bounds, the union box, the base transform and each
    // element's rect are all captured here (they are static mid-drag).
    dragBounds=getMoveBounds();
    dragBaseRect=unionRect(selectedEls);
    dragBasePos=getTranslate(selectedEls[0]);
    lastGuidesKey=null;
    dragDirX=0;
    dragDirY=0;
    // Track the cursor from the exact grab point so the element follows
    // the mouse with zero dead-zone lag once the threshold is crossed.
    lastDragX=dragStartX;
    lastDragY=dragStartY;
    // Kill native text selection / native drag BEFORE it can start, so
    // only the element moves (not the text inside it).
    e.preventDefault();
    moveDeltas=[];
    moveRects=[];
    dragScrollTop=getScrollState().scrollTop;
    for(var i=0;i<selectedEls.length;i++){
      // moveDeltas entry: [oldTransform, finalX, finalY]
      // oldTransform is kept for undo; finalX/finalY track the element's
      // position at drag end so mouseup knows whether anything moved.
      // Movement is applied once per animation frame in dragFrame(),
      // re-reading the CURRENT transform so a drag always continues from
      // where the element IS - never from its origin.
      moveDeltas.push([selectedEls[i].style.transform||'',0,0]);
      moveRects.push(rectOf(selectedEls[i]));
    }
  }
  document.body.style.cursor=isMoving?'move':'crosshair';
  document.body.style.userSelect='none';
  document.body.style.webkitUserSelect='none';
  document.documentElement.style.userSelect='none';
  document.documentElement.style.webkitUserSelect='none';
});

// ── Drag auto-scroll ──
// While dragging an element, holding the cursor near the top/bottom edge
// of the canvas auto-scrolls it so the element can be moved onto pages
// that are currently off-screen (above or below). The scroll container is
// the document container itself (.scroll-wrapper, or the body for
// user-authored HTML), so the same code works for both.
function getScrollState(){
  var wrap=getContentContainer();
  // User templates host their A4 page sheet inside the body and <html> is
  // the canvas scroller (see SYSTEM_RESET_CSS in lib/data/templates.ts), so
  // scroll state must be read from the documentElement — not the
  // .scroll-wrapper page sheet (overflow:visible, does not scroll) nor body.
  // Default/blank templates keep the .scroll-wrapper as scroller.
  var isUserTpl=!!document.querySelector('.klone-render-space');
  var useHtml=isUserTpl;
  var el=useHtml?document.documentElement:wrap;
  return {
    el:el,
    useBody:false,
    scrollTop:useHtml?(window.pageYOffset||el.scrollTop||0):el.scrollTop,
    clientH:useHtml?window.innerHeight:el.clientHeight,
    scrollH:useHtml?document.documentElement.scrollHeight:el.scrollHeight
  };
}

function setScrollTop(st,top){
  if(st.useBody)window.scrollTo(0,top);
  else st.el.scrollTop=top;
}

// Point the auto-scroll direction at the canvas edge the cursor is in.
// The scroll container's getBoundingClientRect includes its full (scrolled)
// content box, so the VISIBLE viewport is derived from the client height.
function updateAutoScroll(cx,cy){
  autoScrollDir=null;
  var st=getScrollState();
  if(!st.el)return;
  var r=st.el.getBoundingClientRect();
  var top=r.top;
  var bottom=r.top+st.clientH;
  var edge=44;
  if(cy<top+edge)autoScrollDir='up';
  else if(cy>bottom-edge)autoScrollDir='down';
}

// Scroll one step toward autoScrollDir; returns the viewport scroll delta
// (positive = content moved up, i.e. scrolled down). 0 when the scroll is
// already at its limit - the caller then stops auto-scrolling.
function stepAutoScroll(){
  var st=getScrollState();
  if(!st.el)return 0;
  var step=14;
  var top=st.scrollTop;
  var maxTop=Math.max(0,st.scrollH-st.clientH);
  if(autoScrollDir==='down'){
    if(top>=maxTop)return 0;
    var next=Math.min(maxTop,top+step);
    setScrollTop(st,next);
    return next-top;
  }
  if(autoScrollDir==='up'){
    if(top<=0)return 0;
    var nextUp=Math.max(0,top-step);
    setScrollTop(st,nextUp);
    return nextUp-top; // negative: content moved down
  }
  return 0;
}

// Runs once per animation frame while an element is being dragged. All
// layout data was cached at mousedown (dragBounds, dragBaseRect,
// moveRects), so each frame only does cheap style reads and one transform
// write per element - no forced layout, no guide DOM churn while a snap
// holds the element still.
function dragFrame(){
  dragFrameScheduled=false;
  if(!isMoving||!isDragging)return;
  // Auto-scroll the canvas while the cursor is held against the top/bottom
  // edge, so the dragged element can reach off-screen pages. The scroll
  // moves the content under a stationary cursor, so the element's transform
  // is compensated by exactly the scroll delta to keep it glued to the
  // cursor. The loop keeps running (re-scheduling itself) while the cursor
  // stays in the edge zone, even though mousemove stops firing.
  var scrollDeltaY=0;
  if(autoScrollDir){
    scrollDeltaY=stepAutoScroll();
    if(scrollDeltaY===0)autoScrollDir=null; // reached the scroll limit
  }
  // Apply ONLY the cursor delta since the last APPLIED frame, on top of
  // the element's CURRENT transform (re-read every frame). Each drag
  // therefore continues from where the element actually is - it never
  // snaps back to its origin when re-dragged.
  var ddx=(lastDragX===null)?0:(pendingMX-lastDragX);
  var ddy=(lastDragY===null)?0:(pendingMY-lastDragY);
  lastDragX=pendingMX;
  lastDragY=pendingMY;
  // Track the current drag direction (sign of the last non-zero cursor
  // delta) so snapping only pulls toward lines the cursor is approaching.
  if(ddx!==0)dragDirX=ddx>0?1:-1;
  if(ddy!==0)dragDirY=ddy>0?1:-1;
  // Raw next positions (clamped to the container) before any snapping.
  var rawNx=[],rawNy=[];
  // Fresh bounds EVERY frame: the bounds are in DOCUMENT space (scroll-
  // independent) so they are stable during auto-scroll - the element's
  // document position grows as its transform compensates the scrolling,
  // letting it ride down to the last page, and it only clamps when it
  // reaches the actual content edges (never the visible screen edge).
  var frameBounds=getMoveBounds()||dragBounds;
  for(var i=0;i<selectedEls.length;i++){
    var el=selectedEls[i];
    var curT2=getTranslate(el);
    var nx=curT2[0]+ddx;
    // Horizontal clamp against the container bounds, derived from the
    // element's CURRENT rect (cached rect shifted by how far the drag has
    // moved since the grab). Never touches layout during the drag, and
    // pins AT the boundary instead of compounding an offset when the
    // element is already at the edge.
    if(!isContainer(el)&&frameBounds&&moveRects[i]){
      var relX=nx-curT2[0];
      var rr=moveRects[i];
      var shift=curT2[0]-dragBasePos[0];
      var curLeft=rr.left+shift;
      var curRight=rr.right+shift;
      if(curLeft+relX<frameBounds.left)nx=curT2[0]+(frameBounds.left-curLeft);
      if(curRight+relX>frameBounds.right)nx=curT2[0]+(frameBounds.right-curRight);
    }
    rawNx.push(nx);
    // The scroll compensation keeps the element under the cursor while the
    // canvas auto-scrolls underneath it.
    var ny=curT2[1]+ddy+scrollDeltaY;
    // Vertical clamp in DOCUMENT space: the mousedown rect plus the scroll
    // offset at mousedown is the element's document position; the transform
    // delta (including scroll compensation) moves it through the document.
    // This pins at the content edges - it never pins at the screen edge, so
    // a bottom-edge drag keeps riding down to the last page while
    // auto-scrolling, and can't leave the body above/below.
    if(!isContainer(el)&&frameBounds&&moveRects[i]){
      var relY=ny-curT2[1];
      var rr2=moveRects[i];
      var shiftY=curT2[1]-dragBasePos[1];
      var curTop=rr2.top+dragScrollTop+shiftY;
      var curBottom=rr2.bottom+dragScrollTop+shiftY;
      if(curTop+relY<frameBounds.top)ny=curT2[1]+(frameBounds.top-curTop);
      if(curBottom+relY>frameBounds.bottom)ny=curT2[1]+(frameBounds.bottom-curBottom);
    }
    rawNy.push(ny);
  }
  // Alignment snap (Figma/Canva-style). Holding Shift disables it for
  // fine-tuned placement. Snap targets are captured at mousedown in
  // viewport coordinates, so snapping is skipped while auto-scrolling
  // (the canvas is moving, the targets are stale).
  var appliedDx=0,appliedDy=0;
  if(!pendingShift&&!autoScrollDir&&selectedEls.length>0&&dragBaseRect){
    var proj=shiftRect(dragBaseRect,rawNx[0]-dragBasePos[0],rawNy[0]-dragBasePos[1]);
    var snap=computeSnap(proj,moveTargets,dragDirX,dragDirY);
    appliedDx=snap.snapX;
    appliedDy=snap.snapY;
  }
  for(var i=0;i<selectedEls.length;i++){
    var nx=rawNx[i]+appliedDx;
    var ny=rawNy[i]+appliedDy;
    var m=moveDeltas[i];
    m[1]=nx;
    m[2]=ny;
    selectedEls[i].style.transform='translate('+nx+'px,'+ny+'px)';
  }
  // Keep the selection box glued to the element while it moves.
  updateSelectionBox();
  // Only touch the guide DOM when the snapped view actually changes. While
  // a guide holds the element still, the guides are identical frame to
  // frame, so nothing is re-created; when moving freely there is nothing
  // to draw at all.
  var gkey=(appliedDx||appliedDy)?(rawNx[0]+appliedDx)+','+(rawNy[0]+appliedDy):'';
  if(gkey!==lastGuidesKey){
    lastGuidesKey=gkey;
    if(gkey===''){
      hideGuides();
    }else{
      renderGuides(shiftRect(dragBaseRect,rawNx[0]-dragBasePos[0]+appliedDx,rawNy[0]-dragBasePos[1]+appliedDy),moveTargets);
    }
  }
  // Keep auto-scrolling frame after frame while the cursor stays in the
  // edge zone (mousemove stops firing when the cursor is stationary).
  if(autoScrollDir&&isMoving&&isDragging){
    dragFrameScheduled=true;
    requestAnimationFrame(dragFrame);
  }
}

document.addEventListener('mousemove',function(e){
  if(isResizing){
    var el=selectedEls[0];
    if(!el)return;
    var dx=e.clientX-resizeStartX;
    var bounds=getMoveBounds();
    if(resizeHandle==='r'||resizeHandle==='ne'||resizeHandle==='se'){
      // Growing to the right must stop at the container edge.
      var maxW=bounds?Math.max(20,bounds.right-resizeStartLeft):Infinity;
      el.style.width=Math.min(Math.max(20,resizeStartWidth+dx),maxW)+'px';
    }else{
      // Growing to the left: the right edge stays fixed, so the width is
      // limited by the container's left edge (width=W0-dx, left moves by
      // +dx). Clamp dx so the left edge never passes bounds.left.
      var dL=dx;
      if(bounds&&resizeStartLeft+dL<bounds.left)dL=bounds.left-resizeStartLeft;
      var w=Math.max(20,resizeStartWidth-dL);
      el.style.width=w+'px';
      el.style.transform='translate('+(resizeStartTx+dL)+'px,'+getTranslate(el)[1]+'px)';
    }
    updateSelectionBox();
    return;
  }
  if(!isDragging)return;
  if(!dragMoved){
    var dx=e.clientX-dragStartX;
    var dy=e.clientY-dragStartY;
    if(Math.abs(dx)<3&&Math.abs(dy)<3)return;
    dragMoved=true;
    if(!isMoving){
      if(marqueeAdditive){
        // Keep the current selection and add to it.
        marqueeBase=selectedEls.slice();
      }else{
        deselect();
      }
    }
  }
  if(isMoving){
    // Coalesce the drag: mousemove can fire far faster than the display
    // can refresh, so only record the latest pointer here and do all the
    // work once per animation frame in dragFrame(). The element always
    // tracks the cursor exactly (delta from the last APPLIED position)
    // with no heavy DOM/layout work more often than once per frame.
    pendingMX=e.clientX;
    pendingMY=e.clientY;
    pendingShift=e.shiftKey;
    // Watch the canvas edges so the drag auto-scrolls toward off-screen
    // pages while the cursor is held against the top/bottom edge.
    updateAutoScroll(e.clientX,e.clientY);
    if(!dragFrameScheduled){
      dragFrameScheduled=true;
      requestAnimationFrame(dragFrame);
    }
    e.preventDefault();
    return;
  }
  // ── Marquee (box drag-select) ──
  // Select every element whose box intersects the drag rectangle. The
  // marquee rectangle is drawn live and the selection is rebuilt on every
  // move so the user sees exactly what is (and isn't) being selected.
  showMarquee(dragStartX,dragStartY,e.clientX,e.clientY);
  var box={left:Math.min(dragStartX,e.clientX),top:Math.min(dragStartY,e.clientY),right:Math.max(dragStartX,e.clientX),bottom:Math.max(dragStartY,e.clientY)};
  var finalSel=computeMarqueeSelection(box,marqueeBase);
  // Update outlines incrementally vs the previous marquee frame.
  for(var qi=0;qi<marqueePrevSel.length;qi++){
    if(finalSel.indexOf(marqueePrevSel[qi])<0){
      marqueePrevSel[qi].style.outline='';
      marqueePrevSel[qi].style.outlineOffset='';
    }
  }
  for(var qj=0;qj<finalSel.length;qj++){
    if(marqueePrevSel.indexOf(finalSel[qj])<0){
      finalSel[qj].style.outline='2px solid #8b5cf6';
      finalSel[qj].style.outlineOffset='2px';
    }
  }
  // Only notify the parent when the selection actually changed.
  var changed=finalSel.length!==selectedEls.length;
  if(!changed){
    for(var qk=0;qk<finalSel.length;qk++){
      if(selectedEls.indexOf(finalSel[qk])<0){changed=true;break;}
    }
  }
  marqueePrevSel=finalSel;
  selectedEls=finalSel;
  if(changed)fireSelected();
  e.preventDefault();
});

document.addEventListener('mouseup',function(e){
  if(isResizing){
    hideMarquee();
    hideGuides();
    isResizing=false;
    document.body.style.cursor='';
    document.body.style.userSelect='';
    document.body.style.webkitUserSelect='';
    justDragged=true;
    var el=selectedEls[0];
    if(el&&resizeStartX!==e.clientX){
      batchId++;
      undoStack.push({element:el,property:'width',oldValue:resizeStartWidthCss,batchId:batchId});
      if(el.style.transform!==resizeStartTransform){
        undoStack.push({element:el,property:'transform',oldValue:resizeStartTransform,batchId:batchId});
      }
      redoStack=[];
      var s=getComputedStyle(el);
      window.parent.postMessage({type:'style-updated',property:'width',value:s.width},'*');
      fireSelected();
    }
    return;
  }
  if(!isDragging)return;
  // If a move frame is still queued, run it against the release point so
  // the element lands exactly where the cursor is (not one frame behind).
  if(dragFrameScheduled){
    pendingMX=e.clientX;
    pendingMY=e.clientY;
    pendingShift=e.shiftKey;
    dragFrame();
  }
  hideMarquee();
  hideGuides();
  lastGuidesKey=null;
  isDragging=false;
  autoScrollDir=null;
  document.body.style.cursor='';
  document.body.style.userSelect='';
  document.body.style.webkitUserSelect='';
  document.documentElement.style.userSelect='';
  document.documentElement.style.webkitUserSelect='';
  if(dragMoved){
    justDragged=true;
    if(isMoving){
      isMoving=false;
      batchId++;
      var moved=false;
      lastDragMoveEls=[];
      for(var i=0;i<selectedEls.length;i++){
        var m=moveDeltas[i];
        if(m[1]===0&&m[2]===0)continue;
        moved=true;
        lastDragMoveEls.push(selectedEls[i]);
        undoStack.push({element:selectedEls[i],property:'transform',oldValue:m[0],batchId:batchId});
      }
      if(moved)redoStack=[];
      // ── Drag across pages ──
      // Pages 2+ are real page-sized containers, so "which page did the
      // user drop this on" is the page area the element's centre now sits
      // in. The element's OWN page is the default target - only a centre
      // that crossed INTO a different page area (up or down) triggers a
      // reparent, so dragging within a page never moves it. When a move
      // IS needed the transform compensation keeps the element exactly
      // where it was dropped. Each element is evaluated on its own: group
      // members may end up on different pages.
      var boundaries=getPageBoundaryEls();
      if(boundaries.length>0){
        for(var pi=0;pi<selectedEls.length;pi++){
          var pel=selectedEls[pi];
          if(isContainer(pel)||isPageBoundary(pel))continue;
          var m2=moveDeltas[pi];
          if(m2[1]===0&&m2[2]===0)continue;
          var er=pel.getBoundingClientRect();
          var cy=er.top+er.height/2;
          var curPage=getPageIndexOf(pel);
          var dropPage=getDropPage(cy,curPage);
          if(dropPage!==curPage){
            reparentElementToPage(pel,dropPage,batchId);
          }
        }
        updateBoundaryMarkers();
        reportPages(false);
      }
      fireSelected();
    }else if(selectedEls.length>0){
      // Marquee: if more than one element was selected, ensure each has
      // its own outline (no selection box in multi-select).
      if(selectedEls.length>1)highlightSelected();
      fireSelected();
    }else{
      window.parent.postMessage({type:'selection-cleared'},'*');
    }
  }
});

document.addEventListener('keydown',function(e){
  if(!inspectEnabled)return;
  if((e.ctrlKey||e.metaKey)&&e.key==='a'){
    e.preventDefault();
    deselect();
    // Select all real elements, never the page container.
    selectedEls=getClickableElements().filter(function(el){return !isContainer(el);});
    highlightSelected();
    fireSelected();
  }
  // Copy the current selection (Ctrl/Cmd+C).
  if((e.ctrlKey||e.metaKey)&&(e.key==='c'||e.key==='C')){
    e.preventDefault();
    copySelection();
  }
  // Paste as a NEW element (Ctrl/Cmd+V). This creates a duplicate of whatever
  // is on the clipboard, placed after the selection (or at the body end).
  if((e.ctrlKey||e.metaKey)&&(e.key==='v'||e.key==='V')){
    e.preventDefault();
    pasteClipboard();
  }
  if(e.key==='Escape'){
    disarmPageDelete();
    deselect();
    window.parent.postMessage({type:'selection-cleared'},'*');
  }
  if((e.key==='Delete'||e.key==='Backspace')&&selectedEls.length>0){
    e.preventDefault();
    deleteSelected();
  }

});

// Never let the browser start its own text selection or HTML5 drag while
// inspect mode is active - the editor owns all dragging.
document.addEventListener('selectstart',function(e){
  if(inspectEnabled||splitMode)e.preventDefault();
});
document.addEventListener('dragstart',function(e){
  if(inspectEnabled||splitMode)e.preventDefault();
});

createSelectionBox();
createMarquee();
createGuidesLayer();

// ── Reload-safe layout sync ──
// When this script parses, the document may not be laid out yet: external
// stylesheets and fonts load asynchronously, and the iframe itself is only
// sized by React slightly later. One-shot measurements taken at parse time
// would therefore freeze wrong values (a page frame sized before its CSS
// loaded, page min-heights derived from a 0-width canvas) - the
// intermittent reload crash. The first sync is deferred to after the
// initial layout, then a ResizeObserver on the content container re-syncs
// on ANY later size change (late CSS/fonts, sidebar toggles, window
// resizes), and window.load gives one final pass once every resource is in.
// Documents saved while the PDF clipping strip ran on EVERY save carry
// baked inline overflow/height overrides (overflow:visible; height:auto;
// max-height:none on html/body/.scroll-wrapper) that defeat the template's
// height:100% / overflow-y:auto scroll layout - the reopened preview can't
// scroll. Heal such docs on load by removing exactly those baked values.
// Template documents only (.scroll-wrapper guard); user-authored HTML is
// never touched.
function healBakedClipping(){
  if(!document.querySelector('.scroll-wrapper'))return;
  var els=[document.documentElement,document.body];
  for(var i=0;i<els.length;i++){
    var el=els[i];
    if(!el)continue;
    if(el.style.overflow==='visible')el.style.overflow='';
    if(el.style.height==='auto')el.style.height='';
  }
  var wrap=document.querySelector('.scroll-wrapper');
  if(wrap){
    if(wrap.style.overflow==='visible')wrap.style.overflow='';
    if(wrap.style.height==='auto')wrap.style.height='';
    if(wrap.style.maxHeight==='none')wrap.style.maxHeight='';
  }
  // Docs saved while an element was hovered/selected also baked the purple
  // editor outline as an inline style - it is editor chrome, never part of
  // the design, so strip it from every element on load.
  var styled=document.querySelectorAll('[style]');
  for(var j=0;j<styled.length;j++){
    var e2=styled[j];
    var o2=e2.style.outline||'';
    if(o2.indexOf('8b5cf6')!==-1||o2.indexOf('139, 92, 246')!==-1){
      e2.style.outline='';
      e2.style.outlineOffset='';
    }
  }
}

function syncLayout(){
  healBakedClipping();
  ensureSystemFrame();
  syncSystemFrameSize();
  syncPageBoundarySizes();
  updatePageBreakMarkers();
  updateBoundaryMarkers();
}

var layoutWatchStarted=false;
function startLayoutWatch(){
  if(layoutWatchStarted)return;
  layoutWatchStarted=true;
  if(typeof ResizeObserver==='undefined')return;
  // Watch BOTH the document element (its client box changes whenever the
  // iframe/canvas resizes - the .scroll-wrapper is max-width capped, so it
  // stays put and would never fire) and the .scroll-wrapper itself (its
  // width changes when its own CSS settles, e.g. a late external
  // stylesheet). Either change re-syncs the frame + page sizes.
  var obs=new ResizeObserver(function(){syncLayout();});
  obs.observe(document.documentElement);
  var wrap=document.querySelector('.scroll-wrapper');
  if(wrap)obs.observe(wrap);
  // One final pass once all resources (external CSS, fonts, images) are in.
  window.addEventListener('load',function(){syncLayout();});
}

// Defer the first sync until the document has had a layout pass, so widths
// measured here are real. Messages to the parent are also posted slightly
// later - the parent's listeners are attached by then, so no report is ever
// lost (the old synchronous init could post before the listener existed).
requestAnimationFrame(function(){
  syncLayout();
  reportPageBreak(false);
  reportPages(false);
  startLayoutWatch();
});

// ── Preview canvas colour ──
// Always keep Klone's canvas colour on the preview <body> so a document's
// own background can never be inherited into the editor preview. For default
// templates the document background lives on the <body>; for USER templates
// it lives on the .klone-render-space element (we remap their body rules
// onto that class). Capture whichever one carries the authored background
// (stored on the element) so PDF export can restore it.
var __kloneAuthoredBgEl=document.querySelector('.klone-render-space')||document.body;
if(__kloneAuthoredBgEl){
  var __kloneComputedBg=getComputedStyle(__kloneAuthoredBgEl).backgroundColor;
  document.body.__kloneAuthoredBg=(__kloneComputedBg&&__kloneComputedBg!=='transparent'&&__kloneComputedBg!=='rgba(0, 0, 0, 0)')?__kloneComputedBg:'';
  document.body.style.setProperty('background-color','#161617','important');
}
window.addEventListener('resize',function(){updateSelectionBox();updatePageBreakMarkers();syncSystemFrameSize();syncPageBoundarySizes();updateBoundaryMarkers();});
window.addEventListener('scroll',function(){updateSelectionBox();updatePageBreakMarkers();updateBoundaryMarkers();},true);

window.addEventListener('message',function(e){
  var data=e.data;
  if(!data)return;

  if(data.type==='apply-style'){
    if(selectedEls.length===0)return;
    // The system frame is STICKY - never apply any style to it.
    for(var sci=0;sci<selectedEls.length;sci++){
      if(isContainer(selectedEls[sci]))return;
    }
    // The container's width is locked - ignore width edits on it.
    if(isWidthLocked(data.property))return;
    // The native color picker fires onChange continuously while dragging
    // AND a final change event when the dialog closes (re-sending the
    // same value). Without guards, that would create one tiny undo entry
    // per event + a no-op entry that breaks undo/redo. Fix: group rapid
    // same-property changes into ONE undo batch, and never record a
    // change whose value equals the current inline value.
    var now=Date.now();
    var sameBatch=(selectedEls[0]===lastChangeEl)&&(data.property===lastChangeProp)&&(now-lastChangeTime<500);
    if(!sameBatch)batchId++;
    lastChangeEl=selectedEls[0];
    lastChangeProp=data.property;
    lastChangeTime=now;
    var applied=false;
    for(var i=0;i<selectedEls.length;i++){
      var el=selectedEls[i];
      var oldValue=el.style[data.property];
      if(data.property==='backgroundColor'){
        // A solid background color must REPLACE any background-image
        // (gradient/image) that would otherwise paint over it and make
        // the change invisible. Record it for undo alongside the color.
        var oldBgImage=el.style.backgroundImage;
        if(oldBgImage&&oldBgImage!=='none'&&oldBgImage!==''){
          applied=true;
          undoStack.push({element:el,property:'backgroundImage',oldValue:oldBgImage,batchId:batchId});
          el.style.backgroundImage='none';
        }
      }
      if(oldValue===data.value)continue; // no-op change - skip entirely
      applied=true;
      undoStack.push({element:el,property:data.property,oldValue:oldValue,batchId:batchId});
      el.style[data.property]=data.value;
    }
    if(!applied)return; // nothing actually changed - don't touch redoStack
    redoStack=[];
    var s=getComputedStyle(selectedEls[selectedEls.length-1]);
    window.parent.postMessage({type:'style-updated',property:data.property,value:formatStyleValue(data.property,s[data.property])},'*');
    updateSelectionBox();
  }

  if(data.type==='delete-element'){
    deleteSelected();
  }

  if(data.type==='delete-page'){
    // Delete a page by its 0-based index. Page 0 is the root document body
    // and has no boundary, so it is never deletable. Pages >= 1 map to the
    // (index-1)th page boundary. The sidebar page list drives deletion (no
    // canvas chip anymore), so deletion is immediate - the page + its
    // content are restored in a single undo step, which is the safety net.
    var di=Number(data.pageIndex);
    if(!isFinite(di)||di<1)return;
    var dbs=getPageBoundaryEls();
    var db=dbs[di-1];
    if(!db)return;
    disarmPageDelete();
    removePageBoundary(db,true);
  }

  if(data.type==='copy'){
    copySelection();
  }

  if(data.type==='paste'){
    pasteClipboard();
  }

  if(data.type==='set-split-mode'){
    setSplitMode(data.enabled);
  }

  if(data.type==='clear-split'){
    clearPageBreaks(true);
  }

  if(data.type==='add-page'){
    // autoMoveDropped: pull any element the user JUST dragged down onto the
    // new page so it stays selectable and lands where the user wanted it.
    addPageBoundary(true,0,true);
  }

  if(data.type==='add-component'){
    addComponentToBottom(data.key, data.html, data.css);
  }

  if(data.type==='move-to-page'){
    moveSelectionToPage(data.pageIndex);
  }

  if(data.type==='set-text'){
    if(!pendingEditEl||data.reqId!==editReqId)return;
    var el=pendingEditEl;
    pendingEditEl=null;
    el.style.visibility='';
    var oldHtml=el.innerHTML;
    var newText=(data.text==null)?'':String(data.text);
    if(newText!==el.textContent){
      batchId++;
      undoStack.push({element:el,property:'__text__',oldValue:oldHtml,batchId:batchId});
      redoStack=[];
      el.textContent=newText;
      window.parent.postMessage({type:'style-updated',property:'textContent',value:newText},'*');
    }
    selectedEls=[el];
    fireSelected();
  }

  if(data.type==='cancel-edit'){
    if(pendingEditEl&&data.reqId===editReqId){
      var ce=pendingEditEl;
      pendingEditEl=null;
      ce.style.visibility='';
      selectedEls=[ce];
      fireSelected();
    }
  }

  if(data.type==='move-by'){
    if(selectedEls.length===0)return;
    // The system frame is sticky - never nudge it with the arrow keys.
    for(var mbi=0;mbi<selectedEls.length;mbi++){
      if(isContainer(selectedEls[mbi]))return;
    }
    var mdx=Number(data.dx)||0;
    var mdy=Number(data.dy)||0;
    batchId++;
    // Snapshot alignment targets + the selection's union box for this nudge
    // (static during a single key press), then apply the SAME direction-
    // aware alignment snap + guides as mouse dragging so arrow keys show
    // the indicators and snap to lines too.
    var targets=getAlignTargets();
    var baseRect=unionRect(selectedEls);
    var p0=getTranslate(selectedEls[0]);
    var rawNx=[],rawNy=[];
    for(var i=0;i<selectedEls.length;i++){
      var el2=selectedEls[i];
      var t=getTranslate(el2);
      undoStack.push({element:el2,property:'transform',oldValue:el2.style.transform||'',batchId:batchId});
      // Clamp so nudging (arrow keys) never pushes the element outside
      // the container - the container width must not expand, and the
      // element must stay inside the document vertically.
      rawNx.push(clampTranslateX(el2,t[0]+mdx));
      rawNy.push(clampTranslateY(el2,t[1]+mdy));
    }
    var dirX=mdx>0?1:(mdx<0?-1:0);
    var dirY=mdy>0?1:(mdy<0?-1:0);
    var proj=shiftRect(baseRect,rawNx[0]-p0[0],rawNy[0]-p0[1]);
    var snap=computeSnap(proj,targets,dirX,dirY);
    // Nudging only snaps on the axis being nudged, so a vertical arrow
    // never makes the element drift horizontally (and vice versa).
    var adx=mdx!==0?snap.snapX:0;
    var ady=mdy!==0?snap.snapY:0;
    for(var i=0;i<selectedEls.length;i++){
      var el2=selectedEls[i];
      el2.style.transform='translate('+(rawNx[i]+adx)+'px,'+(rawNy[i]+ady)+'px)';
    }
    redoStack=[];
    if(adx||ady){
      renderGuides(shiftRect(proj,adx,ady),targets);
      scheduleHideGuides(1200);
    }else{
      hideGuides();
    }
    fireSelected();
  }

  if(data.type==='align-elements'){
    if(selectedEls.length===0)return;
    // The system frame is sticky - never align it.
    for(var ali=0;ali<selectedEls.length;ali++){
      if(isContainer(selectedEls[ali]))return;
    }
    var align=data.align||'left';
    batchId++;
    for(var ai=0;ai<selectedEls.length;ai++){
      var ael=selectedEls[ai];
      // The page container that holds the element defines the alignment
      // box (page 1 = content container, pages 2+ = the page boundary).
      var apage=getPageContainer(getPageIndexOf(ael));
      if(!apage)continue;
      var pcs=getComputedStyle(apage);
      var pRect=apage.getBoundingClientRect();
      // Content box: subtract padding so alignment lands inside the page.
      var pL=parseFloat(pcs.paddingLeft)||0;
      var pR=parseFloat(pcs.paddingRight)||0;
      var pT=parseFloat(pcs.paddingTop)||0;
      var pB=parseFloat(pcs.paddingBottom)||0;
      var cLeft=pRect.left+pL;
      var cTop=pRect.top+pT;
      var cW=pRect.width-pL-pR;
      // Page 1 lives inside a scroll container whose visible height is NOT
      // the page height, so vertical alignment on page 1 must use the true
      // PDF page height (one page of content), not the wrapper's viewport.
      var cH=pRect.height-pT-pB;
      var pageIndex=getPageIndexOf(ael);
      if(pageIndex<=0)cH=getPageHeightPx();
      var ar=ael.getBoundingClientRect();
      var t=getTranslate(ael);
      // The element's flow position (translate removed), then the target
      // translate that lands it at the desired alignment edge.
      var flowX=ar.left-t[0];
      var flowY=ar.top-t[1];
      var nx=t[0],ny=t[1];
      if(align==='left')nx=cLeft-flowX;
      else if(align==='center-x')nx=(cLeft+(cW-ar.width)/2)-flowX;
      else if(align==='right')nx=(cLeft+cW-ar.width)-flowX;
      if(align==='top')ny=cTop-flowY;
      else if(align==='center-y')ny=(cTop+(cH-ar.height)/2)-flowY;
      else if(align==='bottom')ny=(cTop+cH-ar.height)-flowY;
      var nt=(nx===0&&ny===0)?'':'translate('+nx+'px,'+ny+'px)';
      if(ael.style.transform===nt)continue; // no-op - skip undo entry
      undoStack.push({element:ael,property:'transform',oldValue:ael.style.transform||'',batchId:batchId});
      ael.style.transform=nt;
    }
    redoStack=[];
    fireSelected();
    updateSelectionBox();
  }

  if(data.type==='undo'){performUndo();}
  if(data.type==='redo'){performRedo();}
  if(data.type==='deselect'){
    deselect();
    window.parent.postMessage({type:'selection-cleared'},'*');
  }
  if(data.type==='inspect-mode'){
    inspectEnabled=data.enabled;
    if(!inspectEnabled){
      if(pendingEditEl)pendingEditEl.style.visibility='';
      pendingEditEl=null;
      editReqId=0;
      // The delete-confirm chip is inspect-mode UI - never leave it armed.
      pendingDeletePage=null;
      if(pendingDeleteTimer){clearTimeout(pendingDeleteTimer);pendingDeleteTimer=null;}
      deselect();
      window.parent.postMessage({type:'selection-cleared'},'*');
    }
    // Show/hide the PDF split lines with inspect mode (hidden in preview).
    updatePageBreakMarkers();
    // Page-boundary dividers render only in inspect mode too.
    updateBoundaryMarkers();
  }
});

})();
</script>`;
}
