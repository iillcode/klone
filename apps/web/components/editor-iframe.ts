export function getEditorScript(): string {
  return `<script>
(function(){
var selectedEls=[];
var hoveredEl=null;
var isDragging=false;
var dragStartX=0;
var dragStartY=0;
var batchId=0;
var undoStack=[];
var redoStack=[];

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

function addToSelection(el){
  if(selectedEls.indexOf(el)>=0)return;
  selectedEls.push(el);
  el.style.outline='2px solid #8b5cf6';
  el.style.outlineOffset='2px';
}

function elementFromPoint(x,y){
  var el=document.elementFromPoint(x,y);
  if(!el||!isClickable(el))return null;
  return el;
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
  if(isDragging)return;
  var el=e.target;
  if(!el||!el.tagName)return;
  setHover(el);
});

document.addEventListener('mouseout',function(e){
  if(isDragging)return;
  var el=e.target;
  if(!el)return;
  if(hoveredEl===el){
    clearHover();
  }
});

document.addEventListener('click',function(e){
  if(isDragging)return;
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
  if(e.button!==0)return;
  if(e.ctrlKey||e.metaKey)return;
  dragStartX=e.clientX;
  dragStartY=e.clientY;
  isDragging=true;
  document.body.style.cursor='crosshair';
});

document.addEventListener('mousemove',function(e){
  if(!isDragging)return;
  var el=elementFromPoint(e.clientX,e.clientY);
  if(el){
    addToSelection(el);
    clearHover();
  }
});

document.addEventListener('mouseup',function(e){
  if(!isDragging)return;
  isDragging=false;
  document.body.style.cursor='';
  if(selectedEls.length>0){
    fireSelected();
  }else{
    window.parent.postMessage({type:'selection-cleared'},'*');
  }
});

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
    var lastBatch2=redoStack[redoStack.length-1].batchId;
    var entries2=[];
    while(redoStack.length>0&&redoStack[redoStack.length-1].batchId===lastBatch2){
      entries2.push(redoStack.pop());
    }
    for(var i=0;i<entries2.length;i++){
      var entry2=entries2[i];
      var currentValue2=entry2.element.style[entry2.property];
      undoStack.push({element:entry2.element,property:entry2.property,oldValue:currentValue2,batchId:lastBatch2});
      entry2.element.style[entry2.property]=entry2.oldValue;
    }
    var s3=getComputedStyle(entries2[0].element);
    window.parent.postMessage({type:'style-updated',property:entries2[0].property,value:parseRgbToHex(s3[entries2[0].property])},'*');
  }
});

})();
</script>`;
}
