export function getEditorScript(): string {
  return `<script>
(function(){
var selectedEl=null;
var undoStack=[];
var redoStack=[];

function deselect(){
  if(selectedEl){
    selectedEl.style.outline='';
    selectedEl.style.outlineOffset='';
    selectedEl=null;
  }
}

function parseRgbToHex(s){
  if(!s||s==='transparent'||s==='rgba(0, 0, 0, 0)')return'#000000';
  if(s.startsWith('#'))return s;
  var m=s.match(/(\d+)/g);
  if(!m||m.length<3)return'#000000';
  var r=parseInt(m[0]).toString(16).padStart(2,'0');
  var g=parseInt(m[1]).toString(16).padStart(2,'0');
  var b=parseInt(m[2]).toString(16).padStart(2,'0');
  return'#'+r+g+b;
}

function fireSelected(){
  if(!selectedEl)return;
  var s=getComputedStyle(selectedEl);
  window.parent.postMessage({
    type:'element-selected',
    tag:selectedEl.tagName.toLowerCase(),
    classes:selectedEl.className,
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
  },'*');
}

function setHoverOutline(el){
  deselectHover();
  hoveredEl=el;
  el.style.outline='1px dashed rgba(139,92,246,0.6)';
  el.style.outlineOffset='1px';
}

function clearHoverOutline(){
  if(hoveredEl){
    hoveredEl.style.outline='';
    hoveredEl.style.outlineOffset='';
    hoveredEl=null;
  }
}

document.addEventListener('click',function(e){
  deselect();
  selectedEl=e.target;
  selectedEl.style.outline='2px solid #8b5cf6';
  selectedEl.style.outlineOffset='2px';
  fireSelected();
});

  if(data.type==='apply-style'){
    if(!selectedEl)return;
    var oldValue=selectedEl.style[data.property];
    undoStack.push({
      property:data.property,
      oldValue:oldValue,
      element:selectedEl
    });
    redoStack=[];
    selectedEl.style[data.property]=data.value;
    var s=getComputedStyle(selectedEl);
    window.parent.postMessage({
      type:'style-updated',
      property:data.property,
      value:parseRgbToHex(s[data.property])
    },'*');
  }

  if(data.type==='delete-element'){
    if(!selectedEl)return;
    selectedEl.remove();
    deselect();
    window.parent.postMessage({type:'selection-cleared'},'*');
  }

  if(data.type==='undo'){
    if(undoStack.length===0)return;
    var entry=undoStack.pop();
    var currentValue=entry.element.style[entry.property];
    redoStack.push({
      property:entry.property,
      oldValue:currentValue,
      element:entry.element
    });
    entry.element.style[entry.property]=entry.oldValue;
    var s2=getComputedStyle(entry.element);
    window.parent.postMessage({
      type:'style-updated',
      property:entry.property,
      value:parseRgbToHex(s2[entry.property])
    },'*');
  }

  if(data.type==='redo'){
    if(redoStack.length===0)return;
    var entry2=redoStack.pop();
    var currentValue2=entry2.element.style[entry2.property];
    undoStack.push({
      property:entry2.property,
      oldValue:currentValue2,
      element:entry2.element
    });
    entry2.element.style[entry2.property]=entry2.oldValue;
    var s3=getComputedStyle(entry2.element);
    window.parent.postMessage({
      type:'style-updated',
      property:entry2.property,
      value:parseRgbToHex(s3[entry2.property])
    },'*');
  }
});

document.addEventListener('keydown',function(e){
  if(e.key==='Delete'&&selectedEl){
    e.preventDefault();
    selectedEl.remove();
    deselect();
    window.parent.postMessage({type:'selection-cleared'},'*');
  }
});

})();
</script>`;
}
