export function getEditorScript(): string {
  return `<script>
(function(){
var selectedEls=[];
var hoveredEl=null;
var isDragging=false;
var dragMoved=false;
var justDragged=false;
var dragStartX=0;
var dragStartY=0;
var batchId=0;
var undoStack=[];
var redoStack=[];
var inspectEnabled=false;

function deselect(){
  for(var i=0;i<selectedEls.length;i++){
    selectedEls[i].style.outline='';
    selectedEls[i].style.outlineOffset='';
  }
  selectedEls=[];
}

function highlightSelected(){
  for(var i=0;i<selectedEls.length;i++){
    selectedEls[i].style.outline='2px solid #8b5cf6';
    selectedEls[i].style.outlineOffset='2px';
  }
}

function addToSelection(el){
  if(selectedEls.indexOf(el)>=0)return;
  selectedEls.push(el);
  el.style.outline='2px solid #8b5cf6';
  el.style.outlineOffset='2px';
}

function isClickable(el){
  if(!el||!el.tagName)return false;
  var tag=el.tagName.toLowerCase();
  if(tag==='html'||tag==='head'||tag==='body'||tag==='script')return false;
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

function deepestClickableFromPoint(x,y){
  var els=document.elementsFromPoint(x,y);
  if(!els)return null;
  for(var i=0;i<els.length;i++){
    if(isClickable(els[i]))return els[i];
  }
  return null;
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
    }else{
      var currentValue=entry.element.style[entry.property];
      redoStack.push({element:entry.element,property:entry.property,oldValue:currentValue,batchId:lastBatch});
      entry.element.style[entry.property]=entry.oldValue;
    }
  }
  if(entries.length>0&&entries[0].property!=='__delete__'){
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
    var currentValue=entry.element.style[entry.property];
    undoStack.push({element:entry.element,property:entry.property,oldValue:currentValue,batchId:lastBatch});
    entry.element.style[entry.property]=entry.oldValue;
  }
  var s3=getComputedStyle(entries[0].element);
  window.parent.postMessage({type:'style-updated',property:entries[0].property,value:formatStyleValue(entries[0].property,s3[entries[0].property])},'*');
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
        fontWeight:s.fontWeight
      }
    });
  }
  window.parent.postMessage({type:'element-selected',elements:infos},'*');
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

document.addEventListener('mouseover',function(e){
  if(!inspectEnabled||isDragging)return;
  var el=e.target;
  if(!el||!el.tagName)return;
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

document.addEventListener('mousedown',function(e){
  if(!inspectEnabled)return;
  if(e.button!==0)return;
  if(e.ctrlKey||e.metaKey)return;
  justDragged=false;
  dragMoved=false;
  dragStartX=e.clientX;
  dragStartY=e.clientY;
  isDragging=true;
  document.body.style.cursor='crosshair';
  document.body.style.userSelect='none';
  document.body.style.webkitUserSelect='none';
});

document.addEventListener('mousemove',function(e){
  if(!isDragging)return;
  if(!dragMoved){
    var dx=e.clientX-dragStartX;
    var dy=e.clientY-dragStartY;
    if(Math.abs(dx)<5&&Math.abs(dy)<5)return;
    dragMoved=true;
    deselect();
  }
  var el=deepestClickableFromPoint(e.clientX,e.clientY);
  if(el){
    addToSelection(el);
    clearHover();
  }
});

document.addEventListener('mouseup',function(e){
  if(!isDragging)return;
  isDragging=false;
  document.body.style.cursor='';
  document.body.style.userSelect='';
  document.body.style.webkitUserSelect='';
  if(dragMoved){
    justDragged=true;
    if(selectedEls.length>0){
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
    window.parent.postMessage({type:'style-updated',property:data.property,value:formatStyleValue(data.property,s[data.property])},'*');
  }

  if(data.type==='delete-element'){
    deleteSelected();
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
      deselect();
      window.parent.postMessage({type:'selection-cleared'},'*');
    }
  }
});

})();
</script>`;
}
