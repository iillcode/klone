export function getEditorScript(): string {
  return `<script>
(function(){
var selectedEls=[];
var hoveredEl=null;
var undoStack=[];
var redoStack=[];
var marquee=null;
var dragStartX=0;
var dragStartY=0;
var isDragging=false;

function outlineStyle(type){
  if(type==='selected')return '2px solid #8b5cf6';
  if(type==='hover')return '1px dashed rgba(139,92,246,0.6)';
  return '';
}
var outlineOffsetVal='2px';

function deselectAll(){
  for(var i=0;i<selectedEls.length;i++){
    selectedEls[i].style.outline='';
    selectedEls[i].style.outlineOffset='';
  }
  selectedEls=[];
}

function selectEl(el,add){
  if(add){
    var idx=selectedEls.indexOf(el);
    if(idx>=0){
      el.style.outline='';
      el.style.outlineOffset='';
      selectedEls.splice(idx,1);
    }else{
      el.style.outline=outlineStyle('selected');
      el.style.outlineOffset=outlineOffsetVal;
      selectedEls.push(el);
    }
  }else{
    deselectAll();
    el.style.outline=outlineStyle('selected');
    el.style.outlineOffset=outlineOffsetVal;
    selectedEls.push(el);
  }
  fireSelection();
}

function setHover(el){
  if(hoveredEl===el)return;
  clearHover();
  if(selectedEls.indexOf(el)>=0)return;
  hoveredEl=el;
  el.style.outline=outlineStyle('hover');
  el.style.outlineOffset='1px';
}

function clearHover(){
  if(hoveredEl){
    if(selectedEls.indexOf(hoveredEl)<0){
      hoveredEl.style.outline='';
      hoveredEl.style.outlineOffset='';
    }
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

function getStyles(el){
  var s=getComputedStyle(el);
  return{
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
  };
}

function fireSelection(){
  if(selectedEls.length===0){
    window.parent.postMessage({type:'selection-cleared'},'*');
  }else if(selectedEls.length===1){
    var el=selectedEls[0];
    window.parent.postMessage({
      type:'element-selected',
      tag:el.tagName.toLowerCase(),
      classes:el.className,
      styles:getStyles(el)
    },'*');
  }else{
    var items=[];
    for(var i=0;i<selectedEls.length;i++){
      items.push({
        tag:selectedEls[i].tagName.toLowerCase(),
        classes:selectedEls[i].className,
        styles:getStyles(selectedEls[i])
      });
    }
    window.parent.postMessage({
      type:'multi-selected',
      elements:items,
      count:items.length
    },'*');
  }
}

function getScrollWrapper(){
  var sw=document.querySelector('.scroll-wrapper');
  return sw||document.documentElement;
}

function getScrollOffset(){
  var sw=document.querySelector('.scroll-wrapper');
  if(sw&&sw!==document.documentElement){
    return{x:sw.scrollLeft,y:sw.scrollTop};
  }
  return{x:document.documentElement.scrollLeft||0,y:document.documentElement.scrollTop||0};
}

function getMarqueeRect(x1,y1,x2,y2){
  var minX=Math.min(x1,x2);
  var minY=Math.min(y1,y2);
  var w=Math.abs(x2-x1);
  var h=Math.abs(y2-y1);
  return{x:minX,y:minY,w:w,h:h};
}

function createMarquee(){
  var m=document.createElement('div');
  m.style.cssText='position:fixed;border:1px dashed rgba(139,92,246,0.5);background:rgba(139,92,246,0.08);pointer-events:none;z-index:99999;display:none;';
  document.body.appendChild(m);
  return m;
}

function showMarquee(x,y,w,h){
  if(!marquee)marquee=createMarquee();
  marquee.style.display='block';
  marquee.style.left=x+'px';
  marquee.style.top=y+'px';
  marquee.style.width=w+'px';
  marquee.style.height=h+'px';
}

function hideMarquee(){
  if(marquee){
    marquee.style.display='none';
    marquee.parentNode.removeChild(marquee);
    marquee=null;
  }
}

function rectOverlap(r1,r2){
  return!(r2.left>r1.right||r2.right<r1.left||r2.top>r1.bottom||r2.bottom<r1.top);
}

function getElementsInRect(rect){
  var all=document.querySelectorAll('.scroll-wrapper *');
  var found=[];
  for(var i=0;i<all.length;i++){
    var el=all[i];
    if(!el.tagName||el===document.body||el===document.documentElement)continue;
    if(el.tagName==='SCRIPT')continue;
    var r=el.getBoundingClientRect();
    if(rectOverlap(rect,r))found.push(el);
  }
  return found;
}

document.addEventListener('mouseover',function(e){
  var el=e.target;
  if(!el||!el.tagName)return;
  setHover(el);
});

document.addEventListener('mouseout',function(e){
  var el=e.target;
  if(!el)return;
  if(hoveredEl===el)clearHover();
});

document.addEventListener('mousedown',function(e){
  if(e.button!==0)return;
  var el=e.target;
  if(!el||!el.tagName)return;

  if(el.tagName==='SCRIPT')return;

  if(selectedEls.indexOf(el)>=0&&!e.ctrlKey&&!e.metaKey){
    return;
  }

  if(e.ctrlKey||e.metaKey){
    e.preventDefault();
    e.stopPropagation();
    clearHover();
    selectEl(el,true);
    return;
  }

  var tag=el.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||tag==='BUTTON'||tag==='A')return;
  if(el.closest('.scroll-wrapper')&&!el.closest('h1,h2,h3,p,table,div.section,div.header,div.footer,span.path,span.desc,td,th,pre,code'))return;

  var offsetX=typeof e.offsetX==='number'?e.offsetX:(e.clientX-(el.getBoundingClientRect().left));
  var offsetY=typeof e.offsetY==='number'?e.offsetY:(e.clientY-(el.getBoundingClientRect().top));
  if(offsetX>3&&offsetY>3)return;

  var scroll=getScrollOffset();
  dragStartX=e.clientX+scroll.x;
  dragStartY=e.clientY+scroll.y;
  isDragging=true;
  e.preventDefault();
});

document.addEventListener('mousemove',function(e){
  if(!isDragging)return;
  var scroll=getScrollOffset();
  var curX=e.clientX+scroll.x;
  var curY=e.clientY+scroll.y;
  var r=getMarqueeRect(dragStartX,dragStartY,curX,curY);

  var viewX=e.clientX;
  var viewY=e.clientY;
  var vpLeft=dragStartX-scroll.x;
  var vpTop=dragStartY-scroll.y;
  var mLeft=Math.min(vpLeft,viewX);
  var mTop=Math.min(vpTop,viewY);
  var mW=Math.abs(viewX-vpLeft);
  var mH=Math.abs(viewY-vpTop);

  if(mW>3||mH>3){
    showMarquee(mLeft,mTop,mW,mH);
  }
});

document.addEventListener('mouseup',function(e){
  if(!isDragging)return;
  isDragging=false;

  var scroll=getScrollOffset();
  var curX=e.clientX+scroll.x;
  var curY=e.clientY+scroll.y;
  var r=getMarqueeRect(dragStartX,dragStartY,curX,curY);

  hideMarquee();

  if(r.w<4&&r.h<4)return;

  var found=getElementsInRect(r);
  if(found.length>0){
    deselectAll();
    for(var i=0;i<found.length;i++){
      found[i].style.outline=outlineStyle('selected');
      found[i].style.outlineOffset=outlineOffsetVal;
      selectedEls.push(found[i]);
    }
    fireSelection();
  }
});

document.addEventListener('click',function(e){
  e.stopPropagation();
  var el=e.target;
  if(!el||!el.tagName)return;
  if(el.tagName==='SCRIPT')return;

  clearHover();

  if(e.ctrlKey||e.metaKey){
    return;
  }

  deselectAll();
  el.style.outline=outlineStyle('selected');
  el.style.outlineOffset=outlineOffsetVal;
  selectedEls.push(el);
  fireSelection();
});

document.addEventListener('dblclick',function(e){
  var el=e.target;
  if(!el||!el.tagName)return;
  var sw=getScrollWrapper();
  var children=sw.children;
  for(var i=0;i<children.length;i++){
    if(children[i]===el||children[i].contains(el)){
      deselectAll();
      el.style.outline=outlineStyle('selected');
      el.style.outlineOffset=outlineOffsetVal;
      selectedEls.push(el);
      fireSelection();
      return;
    }
  }
});

document.addEventListener('keydown',function(e){
  if((e.key==='Delete'||e.key==='Backspace')&&selectedEls.length>0){
    var tag=document.activeElement?document.activeElement.tagName:'';
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
    e.preventDefault();
    for(var i=0;i<selectedEls.length;i++){
      selectedEls[i].remove();
    }
    selectedEls=[];
    window.parent.postMessage({type:'selection-cleared'},'*');
  }
});

window.addEventListener('message',function(e){
  var data=e.data;
  if(!data)return;

  if(data.type==='apply-style'){
    if(selectedEls.length===0)return;
    for(var i=0;i<selectedEls.length;i++){
      var oldVal=selectedEls[i].style[data.property];
      undoStack.push({element:selectedEls[i],property:data.property,oldValue:oldVal});
      selectedEls[i].style[data.property]=data.value;
    }
    redoStack=[];
    var last=selectedEls[selectedEls.length-1];
    var s=getComputedStyle(last);
    window.parent.postMessage({
      type:'style-updated',
      property:data.property,
      value:parseRgbToHex(s[data.property])
    },'*');
  }

  if(data.type==='delete-element'){
    if(selectedEls.length===0)return;
    for(var d=0;d<selectedEls.length;d++){
      selectedEls[d].remove();
    }
    selectedEls=[];
    window.parent.postMessage({type:'selection-cleared'},'*');
  }

  if(data.type==='undo'){
    if(undoStack.length===0)return;
    var entry=undoStack.pop();
    var curVal=entry.element.style[entry.property];
    redoStack.push({element:entry.element,property:entry.property,oldValue:curVal});
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
    var curVal2=entry2.element.style[entry2.property];
    undoStack.push({element:entry2.element,property:entry2.property,oldValue:curVal2});
    entry2.element.style[entry2.property]=entry2.oldValue;
    var s3=getComputedStyle(entry2.element);
    window.parent.postMessage({
      type:'style-updated',
      property:entry2.property,
      value:parseRgbToHex(s3[entry2.property])
    },'*');
  }
});

})();
</script>`;
}
