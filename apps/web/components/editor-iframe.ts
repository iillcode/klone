export function getEditorScript(): string {
  return `<script>
(function(){
var selectedEls=[];
var hoveredEl=null;
var undoStack=[];
var redoStack=[];

function deselectAll(){
  selectedEls.forEach(function(el){
    if(el){el.style.outline='';el.style.outlineOffset='';}
  });
  selectedEls=[];
}

function fireSelected(){
  if(selectedEls.length===0)return;
  var infos=selectedEls.map(function(el){
    var s=getComputedStyle(el);
    return{
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
    };
  });
  window.parent.postMessage({type:'multi-selected',elements:infos},'*');
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

function setHover(el){
  if(el===hoveredEl)return;
  clearHover();
  hoveredEl=el;
  el.style.outline='1px dashed rgba(139,92,246,0.6)';
  el.style.outlineOffset='1px';
}

function clearHover(){
  if(hoveredEl){hoveredEl.style.outline='';hoveredEl.style.outlineOffset='';hoveredEl=null;}
}

function getElement(el){
  if(!el)return null;
  if(el.nodeType===3)return el.parentElement||el.parentNode;
  return el;
}

function isSelected(el){
  return selectedEls.indexOf(el)!==-1;
}

document.addEventListener('mouseover',function(e){
  var el=getElement(e.target);
  if(!el||!el.tagName)return;
  setHover(el);
});

document.addEventListener('mouseout',function(e){
  var el=getElement(e.target);
  if(!el)return;
  if(hoveredEl===el){clearHover();}
});

document.addEventListener('mousedown',function(e){
  var el=getElement(e.target);
  if(!el||!el.tagName)return;
  if(e.ctrlKey||e.metaKey){
    e.preventDefault();
    if(isSelected(el)){
      selectedEls=selectedEls.filter(function(s){return s!==el;});
      el.style.outline='';el.style.outlineOffset='';
    }else{
      selectedEls.push(el);
      el.style.outline='2px solid #8b5cf6';
      el.style.outlineOffset='2px';
    }
    fireSelected();
    return;
  }
});

document.addEventListener('click',function(e){
  if(e.ctrlKey||e.metaKey)return;
  e.stopPropagation();
  var el=getElement(e.target);
  if(!el||!el.tagName)return;
  clearHover();
  deselectAll();
  selectedEls=[el];
  el.style.outline='2px solid #8b5cf6';
  el.style.outlineOffset='2px';
  fireSelected();
});

document.addEventListener('keydown',function(e){
  if(e.key==='Delete'&&selectedEls.length>0){
    e.preventDefault();
    var toRemove=selectedEls.slice();
    deselectAll();
    toRemove.forEach(function(el){el.remove();});
    window.parent.postMessage({type:'selection-cleared'},'*');
  }
});

window.addEventListener('message',function(e){
  var data=e.data;
  if(!data)return;

  if(data.type==='apply-style'){
    if(selectedEls.length===0)return;
    var entry={elements:selectedEls.slice(),property:data.property,oldValues:[]};
    selectedEls.forEach(function(el){
      entry.oldValues.push(el.style[data.property]);
    });
    undoStack.push(entry);
    redoStack=[];
    selectedEls.forEach(function(el){el.style[data.property]=data.value;});
    var s=getComputedStyle(selectedEls[0]);
    window.parent.postMessage({
      type:'style-updated',
      property:data.property,
      value:parseRgbToHex(s[data.property])
    },'*');
  }

  if(data.type==='delete-element'){
    if(selectedEls.length===0)return;
    var toRemove=selectedEls.slice();
    deselectAll();
    toRemove.forEach(function(el){el.remove();});
    window.parent.postMessage({type:'selection-cleared'},'*');
  }

  if(data.type==='undo'){
    if(undoStack.length===0)return;
    var entry=undoStack.pop();
    var redoEntry={elements:entry.elements.slice(),property:entry.property,oldValues:[]};
    entry.elements.forEach(function(el,i){
      redoEntry.oldValues.push(el.style[entry.property]);
      el.style[entry.property]=entry.oldValues[i];
    });
    redoStack.push(redoEntry);
    var s=getComputedStyle(entry.elements[0]);
    window.parent.postMessage({
      type:'style-updated',
      property:entry.property,
      value:parseRgbToHex(s[entry.property])
    },'*');
  }

  if(data.type==='redo'){
    if(redoStack.length===0)return;
    var entry2=redoStack.pop();
    var undoEntry={elements:entry2.elements.slice(),property:entry2.property,oldValues:[]};
    entry2.elements.forEach(function(el,i){
      undoEntry.oldValues.push(el.style[entry2.property]);
      el.style[entry2.property]=entry2.oldValues[i];
    });
    undoStack.push(undoEntry);
    var s2=getComputedStyle(entry2.elements[0]);
    window.parent.postMessage({
      type:'style-updated',
      property:entry2.property,
      value:parseRgbToHex(s2[entry2.property])
    },'*');
  }
});

})();
</script>`;
}
