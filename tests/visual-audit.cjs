'use strict';
// Native layout audit. Evaluated inside the browser; no application hooks.
// Errors are deterministic geometric failures. Contrast/intentional desktop
// mini-segment clipping are review warnings, not false claims of WCAG compliance.
async function audit(page,{pinned=false,contrast=true}={}){
 return page.evaluate(({pinned,contrast})=>{
  const rect=e=>e.getBoundingClientRect();
  const visible=e=>{
   if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')return false;
   const closed=e.closest('details:not([open])');
   return !closed||e===closed||closed.querySelector(':scope > summary')?.contains(e);
  };
  const width=innerWidth,height=innerHeight,root=document.documentElement;
  const mobile=width<768;
  const errors=[],warnings=[],seen=new Set();
  const describe=e=>{
   const id=e.id?'#'+e.id:e.closest('[id]')?.id?'#'+e.closest('[id]').id+' '+e.tagName.toLowerCase():e.tagName.toLowerCase();
   return id+' '+(e.textContent||e.getAttribute('aria-label')||e.getAttribute('name')||'').trim().replace(/\s+/g,' ').slice(0,85);
  };
  const issue=(severity,kind,e,detail)=>{
   const item={kind,element:e?describe(e):'document',detail,top:e?Math.round(rect(e).top+scrollY):null};
   const key=severity+kind+item.element+JSON.stringify(detail);if(seen.has(key))return;seen.add(key);
   (severity==='error'?errors:warnings).push(item);
  };
  if(root.scrollWidth>width+2)issue('error','page-overflow',null,{scrollWidth:root.scrollWidth,width});
  const active=[...document.querySelectorAll('.tab-panel')].filter(visible);
  if(active.length!==1)issue('error','active-panel',null,{visible:active.length});
  const nav=[...document.querySelectorAll('#section-nav [role=tab]')];
  const actions=[...document.querySelectorAll('#toolbar-actions button')];
  for(const e of [...nav,...actions]){
   if(!visible(e)){issue('error','missing-control',e,{});continue;}
   const r=rect(e);
   if(r.height<43.5||r.width<43.5)issue('error','target-size',e,{width:r.width,height:r.height});
   if(r.left< -1||r.right>width+1)issue('error','control-overflow',e,{left:r.left,right:r.right,width});
  }
  if(nav.filter(e=>e.getAttribute('aria-selected')==='true').length!==1)issue('error','tab-selection',null,{});
  const header=rect(document.querySelector('#playbook-header'));
  const navRect=rect(document.querySelector('#section-nav'));
  if(pinned&&mobile&&height>500&&scrollY>200){
   if(navRect.top< -2||navRect.top>12||header.bottom>Math.min(160,height/3))issue('error','sticky-navigation',null,{navTop:navRect.top,headerBottom:header.bottom});
  }
  if(width>=height&&height<=500&&getComputedStyle(document.querySelector('#playbook-header')).position==='sticky')issue('error','landscape-sticky-header',null,{height});
  const selector='main .print-card,main [data-cell-value],main [data-strategy-body],main [data-selection-steps]>li,main [data-decision-grid]>div,main p,main li,main h2,main h3,main h4,main dd,main textarea,main input:not([type=checkbox]),main select,main button,main summary,main [data-mobile-clock]>* ,main [data-recovery-clock]>*';
  const elements=[...new Set(document.querySelectorAll(selector))].filter(visible);
  for(const e of elements){
   const r=rect(e),style=getComputedStyle(e),clock=e.parentElement?.hasAttribute('data-mobile-clock'),recovery=e.parentElement?.hasAttribute('data-recovery-clock');
   if(r.width<=0||r.height<=0){issue('error','zero-size',e,{});continue;}
   const narrowClock=clock&&!mobile&&r.width<55;
   if(r.left< -2||r.right>width+2)issue('error','element-outside-page',e,{left:r.left,right:r.right,width});
   const native=/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName);
   if(!native&&e.clientWidth>0&&e.scrollWidth>e.clientWidth+3){
    const scrollable=/auto|scroll/.test(style.overflowX);
    if(narrowClock)issue('warning','narrow-desktop-phase',e,{width:r.width,scrollWidth:e.scrollWidth});
    else if(clock||recovery||!scrollable)issue('error','horizontal-clipping',e,{client:e.clientWidth,scroll:e.scrollWidth});
    else issue('warning','inner-horizontal-scroll',e,{client:e.clientWidth,scroll:e.scrollWidth});
   }
   if(!native&&e.clientHeight>0&&e.scrollHeight>e.clientHeight+3&&(clock||recovery||/hidden|clip/.test(style.overflowY)))issue(narrowClock?'warning':'error','vertical-clipping',e,{client:e.clientHeight,scroll:e.scrollHeight});
   if(mobile&&clock&&r.height<43.5)issue('error','mobile-clock-height',e,{height:r.height});
   if(mobile&&e.matches('main textarea,main input:not([type=checkbox]),main select')&&parseFloat(style.fontSize)<15.9)issue('warning','small-mobile-field-font',e,{fontSize:style.fontSize});
   if(e.matches('summary,.varc-order-btn,#btn-close-revision,#error-log-form button,#error-log-list button')&&r.height<43.5)issue('warning','small-secondary-control',e,{height:r.height,width:r.width});
  }
  // Simple contrast estimate from computed solid backgrounds. Gradients, images,
  // transparency groups and native controls are deliberately not guessed.
  function rgb(value){const m=value.match(/^rgba?\(([^)]+)\)$/);if(!m)return null;const a=m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);return a.length>=3&&a.every(Number.isFinite)?[a[0],a[1],a[2],a[3]??1]:null;}
  function blend(f,b){return [0,1,2].map(i=>f[i]*f[3]+b[i]*(1-f[3])).concat(1);}
  function luminance(c){return c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);}
  function bg(e){const layers=[];for(let n=e;n;n=n.parentElement){const cs=getComputedStyle(n);if(cs.backgroundImage!=='none'||Number(cs.opacity)<.99)return null;const c=rgb(cs.backgroundColor);if(!c)return null;layers.push(c);if(c[3]>=.999)break;}return layers.reverse().reduce((b,f)=>blend(f,b),[255,255,255,1]);}
  const walker=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT);
  let n,contrastChecked=0;
  while(contrast&&(n=walker.nextNode())){
   const e=n.parentElement;if(!n.textContent.trim()||!e||!visible(e)||e.closest('script,style,textarea,select,input,svg'))continue;
   const cs=getComputedStyle(e),fg=rgb(cs.color),back=bg(e);if(!fg||!back)continue;
   const l1=luminance(blend(fg,back)),l2=luminance(back),ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
   const large=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.66&&Number(cs.fontWeight)>=700),target=large?3:4.5;
   contrastChecked++;
   if(ratio<target-.05)issue('warning','contrast-estimate',e,{ratio:+ratio.toFixed(2),target});
  }
  const allWarningCount=warnings.length;
  // Keep examples of each warning type, without allowing a long table to drown
  // out other findings. Total counts and errors remain available.
  const warningCounts={};for(const w of warnings)warningCounts[w.kind]=(warningCounts[w.kind]||0)+1;
  const kept={};const samples=warnings.filter(w=>(kept[w.kind]=(kept[w.kind]||0)+1)<=8);
  return {viewport:{width,height},scrollWidth:root.scrollWidth,scrollHeight:root.scrollHeight,header:{height:header.height,bottom:header.bottom,navTop:navRect.top},activePanel:active[0]?.id||null,elementsChecked:elements.length,contrastChecked,errors,warnings:samples,warningCounts,warningCount:allWarningCount};
 },{pinned,contrast});
}
module.exports={audit};
