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

function parseRgbToHex(s){
  if(!s||s==='transparent'||s==='rgba(0, 0, 0, 0)')return'#000000';
  if(s.startsWith('#'))return s;
  var m=s.match(/(\\d+)/g);
  if(!m||m.length<3)return'#000000';
  var r=parseInt(m[0]).toString(16).padStart(2,'0');
  var g=parseInt(m[1]).toString(16).padStart(2,'0');
  var b=parseInt(m[2]).toString(16).padStart(2,'0');
  return'#'+r+g+b;
}
// color-like properties that need hex conversion; everything else sends raw value
function isColorProperty(p){return p==='color'||p==='backgroundColor';}

function formatStyleValue(property,computedValue){
  if(isColorProperty(property))return parseRgbToHex(computedValue);
  return computedValue;
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
  // Page-break markers must mirror the live DOM after any undo (a deleted
  // marked element being restored, a break toggled back, etc.).
  updatePageBreakMarkers();
  reportPageBreak(false);
  if(entries.length>0&&entries[0].property==='__text__'){
    window.parent.postMessage({type:'style-updated',property:'textContent',value:entries[0].element.textContent},'*');
  }else if(entries.length>0&&entries[0].property!=='__delete__'&&entries[0].property!=='__page_break__'){
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
  // Page-break markers must mirror the live DOM after any redo.
  updatePageBreakMarkers();
  reportPageBreak(false);
  if(entries[0].property==='__text__'){
    window.parent.postMessage({type:'style-updated',property:'textContent',value:entries[0].element.textContent},'*');
  }else if(entries[0].property!=='__page_break__'){
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
        rotate:s.rotate,
        opacity:s.opacity,
        borderRadius:s.borderRadius,
        transform:s.transform
      }
    });
  }
  window.parent.postMessage({type:'element-selected',elements:infos},'*');
  updateSelectionBox();
}

function deleteSelected(){
  if(selectedEls.length===0)return;
  batchId++;
  for(var i=0;i<selectedEls.length;i++){
    var el=selectedEls[i];
    undoStack.push({element:el,property:'__delete__',oldValue:null,nextSibling:el.nextSibling,parentNode:el.parentNode,batchId:batchId});
    el.remove();
  }
  selectedEls=[];
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
function getMoveBounds(){
  var wrap=document.querySelector('.scroll-wrapper');
  var box=wrap||document.body;
  if(!box)return null;
  var r=box.getBoundingClientRect();
  return{left:r.left,right:r.right};
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
  if(parent.nodeType===1&&parent.classList&&parent.classList.contains('klone-frame'))return;
  var cs=getComputedStyle(wrap);
  var w=parseFloat(cs.width);
  var frame=document.createElement('div');
  frame.className='klone-frame';
  frame.setAttribute('data-klone-system-frame','');
  // Same width as the template frame; centered and full height so the inner
  // scroller's height:100% keeps scrolling exactly as authored.
  frame.style.cssText='width:'+(isFinite(w)&&w>0?w+'px':'100%')+';max-width:100%;height:100%;margin:0 auto;overflow:hidden;';
  parent.insertBefore(frame,wrap);
  frame.appendChild(wrap);
  // The sticky frame sits at its authored position - clear any leftover
  // transform from documents that were dragged before this feature existed
  // (otherwise the offset would clip content against the frame's
  // overflow:hidden).
  wrap.style.transform='';
  frame.style.transform='';
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
  if(splitMode){
    e.preventDefault();
    return;
  }
  if(!inspectEnabled)return;
  if(e.button!==0)return;
  hideGuides();
  justDragged=false;
  dragMoved=false;
  lastDragX=null;
  lastDragY=null;
  dragStartX=e.clientX;
  dragStartY=e.clientY;
  isDragging=true;
  isMoving=false;
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

// Runs once per animation frame while an element is being dragged. All
// layout data was cached at mousedown (dragBounds, dragBaseRect,
// moveRects), so each frame only does cheap style reads and one transform
// write per element - no forced layout, no guide DOM churn while a snap
// holds the element still.
function dragFrame(){
  dragFrameScheduled=false;
  if(!isMoving||!isDragging)return;
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
  for(var i=0;i<selectedEls.length;i++){
    var el=selectedEls[i];
    var curT2=getTranslate(el);
    var nx=curT2[0]+ddx;
    // Horizontal clamp against the CACHED container bounds, derived from
    // the element's CURRENT rect (cached rect shifted by how far the drag
    // has moved since the grab). Never touches layout during the drag, and
    // pins AT the boundary instead of compounding an offset when the
    // element is already at the edge.
    if(!isContainer(el)&&dragBounds&&moveRects[i]){
      var relX=nx-curT2[0];
      var rr=moveRects[i];
      var shift=curT2[0]-dragBasePos[0];
      var curLeft=rr.left+shift;
      var curRight=rr.right+shift;
      if(curLeft+relX<dragBounds.left)nx=curT2[0]+(dragBounds.left-curLeft);
      if(curRight+relX>dragBounds.right)nx=curT2[0]+(dragBounds.right-curRight);
    }
    rawNx.push(nx);
    rawNy.push(curT2[1]+ddy);
  }
  // Alignment snap (Figma/Canva-style). Holding Shift disables it for
  // fine-tuned placement.
  var appliedDx=0,appliedDy=0;
  if(!pendingShift&&selectedEls.length>0&&dragBaseRect){
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
      for(var i=0;i<selectedEls.length;i++){
        var m=moveDeltas[i];
        if(m[1]===0&&m[2]===0)continue;
        moved=true;
        undoStack.push({element:selectedEls[i],property:'transform',oldValue:m[0],batchId:batchId});
      }
      if(moved)redoStack=[];
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
  if(e.key==='Escape'){
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
// Make the template's page frame sticky (wrap it in the system frame)
// BEFORE any selection/marker logic runs.
ensureSystemFrame();
updatePageBreakMarkers();
reportPageBreak(false);

// ── Preview canvas colour ──
// Always keep Klone's canvas colour on the preview <body> so a document's
// own body background (e.g. a light email template) can never be inherited
// into the editor preview. The document's OWN background is captured first
// (and stored on the element) so PDF export can restore it.
if(document.body){
  var __kloneComputedBg=getComputedStyle(document.body).backgroundColor;
  document.body.__kloneAuthoredBg=(__kloneComputedBg&&__kloneComputedBg!=='transparent'&&__kloneComputedBg!=='rgba(0, 0, 0, 0)')?__kloneComputedBg:'';
  document.body.style.setProperty('background-color','#161617','important');
}
window.addEventListener('resize',function(){updateSelectionBox();updatePageBreakMarkers();});
window.addEventListener('scroll',function(){updateSelectionBox();updatePageBreakMarkers();},true);

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

  if(data.type==='set-split-mode'){
    setSplitMode(data.enabled);
  }

  if(data.type==='clear-split'){
    clearPageBreaks(true);
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
      // the container - the container width must not expand.
      rawNx.push(clampTranslateX(el2,t[0]+mdx));
      rawNy.push(t[1]+mdy);
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
      deselect();
      window.parent.postMessage({type:'selection-cleared'},'*');
    }
    // Show/hide the PDF split lines with inspect mode (hidden in preview).
    updatePageBreakMarkers();
  }
});

})();
</script>`;
}
