export function getEditorScript(): string {
  return `<script>
(function(){
  // ── Editor script version marker ──
  // If the iframe is running a stale copy of this script (HMR sometimes
  // doesn't reload sandboxed iframe srcDoc), the console inside the iframe
  // will show an older version. Hard-refresh the page to reload it.
  if(window.__kloneEditorInjected)return; // never double-bind listeners
  window.__kloneEditorInjected=true;
  console.log('[editor] script v14');
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

function isClickable(el){
  if(!el||!el.tagName)return false;
  var tag=el.tagName.toLowerCase();
  // The document skeleton and invisible head elements are never selectable.
  if(tag==='html'||tag==='head'||tag==='body'||tag==='script')return false;
  if(tag==='style'||tag==='meta'||tag==='link'||tag==='title'||tag==='base'||tag==='noscript'||tag==='template')return false;
  if(el.getAttribute&&el.getAttribute('data-editor-ui'))return false;
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
  if(entries.length>0&&entries[0].property==='__text__'){
    window.parent.postMessage({type:'style-updated',property:'textContent',value:entries[0].element.textContent},'*');
  }else if(entries.length>0&&entries[0].property!=='__delete__'){
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
    if(entry.property==='__text__'){
      var cur=entry.element.innerHTML;
      undoStack.push({element:entry.element,property:'__text__',oldValue:cur,batchId:lastBatch});
      entry.element.innerHTML=entry.oldValue;
    }else{
      var currentValue=entry.element.style[entry.property];
      undoStack.push({element:entry.element,property:entry.property,oldValue:currentValue,batchId:lastBatch});
      entry.element.style[entry.property]=entry.oldValue;
    }
  }
  if(entries[0].property==='__text__'){
    window.parent.postMessage({type:'style-updated',property:'textContent',value:entries[0].element.textContent},'*');
  }else{
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
  if(el.classList&&el.classList.contains('scroll-wrapper'))return true;
  return false;
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
  if(!inspectEnabled||isDragging)return;
  var el=e.target;
  if(!el||!el.tagName)return;
  if(el.getAttribute&&el.getAttribute('data-editor-ui'))return;
  // Don't hover-highlight an element that is already selected (the
  // selection box already marks it).
  if(selectedEls.indexOf(el)>=0)return;
  setHover(el);
});

document.addEventListener('mouseout',function(e){
  if(!inspectEnabled||isDragging)return;
  var el=e.target;
  if(!el)return;
  if(hoveredEl===el){
    clearHover();
  }
});

document.addEventListener('click',function(e){
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
  if(!inspectEnabled)return;
  if(e.button!==0)return;
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
    // Kill native text selection / native drag BEFORE it can start, so
    // only the element moves (not the text inside it).
    e.preventDefault();
    moveDeltas=[];
    for(var i=0;i<selectedEls.length;i++){
      // moveDeltas entry: [oldTransform, finalX, finalY]
      // oldTransform is kept for undo; finalX/finalY track the element's
      // position at drag end so mouseup knows whether anything moved.
      // Movement itself is applied incrementally in mousemove (see below),
      // re-reading the CURRENT transform on every event so a drag always
      // continues from where the element IS - never from its origin.
      moveDeltas.push([selectedEls[i].style.transform||'',0,0]);
    }
  }
  document.body.style.cursor=isMoving?'move':'crosshair';
  document.body.style.userSelect='none';
  document.body.style.webkitUserSelect='none';
  document.documentElement.style.userSelect='none';
  document.documentElement.style.webkitUserSelect='none';
});

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
    if(Math.abs(dx)<5&&Math.abs(dy)<5)return;
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
    // Incremental movement: apply ONLY the cursor delta since the previous
    // mousemove ON TOP of the element's CURRENT transform (re-read every
    // event). This makes each drag - first, second, third... - continue
    // from where the element actually is, so it never snaps back to its
    // original position when re-dragged.
    var ddx=(lastDragX===null)?0:(e.clientX-lastDragX);
    var ddy=(lastDragY===null)?0:(e.clientY-lastDragY);
    lastDragX=e.clientX;
    lastDragY=e.clientY;
    for(var i=0;i<selectedEls.length;i++){
      var curT2=getTranslate(selectedEls[i]);
      // Clamp horizontally so elements can never be dragged out of the
      // container - the container width must not expand.
      var nx=clampTranslateX(selectedEls[i],curT2[0]+ddx);
      var ny=curT2[1]+ddy;
      var m=moveDeltas[i];
      m[1]=nx;
      m[2]=ny;
      selectedEls[i].style.transform='translate('+nx+'px,'+ny+'px)';
    }
    // Keep the selection box glued to the element while it moves.
    updateSelectionBox();
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
  hideMarquee();
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
  if(inspectEnabled)e.preventDefault();
});
document.addEventListener('dragstart',function(e){
  if(inspectEnabled)e.preventDefault();
});

createSelectionBox();
createMarquee();
window.addEventListener('resize',function(){updateSelectionBox();});
window.addEventListener('scroll',function(){updateSelectionBox();},true);

window.addEventListener('message',function(e){
  var data=e.data;
  if(!data)return;

  if(data.type==='apply-style'){
    if(selectedEls.length===0)return;
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
    batchId++;
    for(var i=0;i<selectedEls.length;i++){
      var el2=selectedEls[i];
      var t=getTranslate(el2);
      undoStack.push({element:el2,property:'transform',oldValue:el2.style.transform||'',batchId:batchId});
      // Clamp so nudging (arrow keys) never pushes the element outside
      // the container - the container width must not expand.
      var nx2=clampTranslateX(el2,t[0]+(data.dx||0));
      el2.style.transform='translate('+nx2+'px,'+(t[1]+(data.dy||0))+'px)';
    }
    redoStack=[];
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
  }
});

})();
</script>`;
}
