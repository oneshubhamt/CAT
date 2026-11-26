'use strict';
const assert=require('node:assert/strict');
const matrix=require('./visual-matrix.cjs');
async function visual(api){
 const {page,desc,section,mode,top,disclosure,allDetails,bring,measure,snap,action}=api;
 await measure('overview-default');await snap('overview-default');
 assert.equal(await page.locator('[data-fixed-segment]').count(),24);
 assert(await page.locator('[data-fixed-segment]').evaluateAll(els=>els.every(e=>e.style.width&&/\d+–\d+m/.test(e.querySelector('[data-clock-time]')?.textContent||''))));
 for(const key of matrix.modes){
  await section(page,'overview');await mode(page,key);
  await measure('overview-'+key,{contrast:false});
  for(const accent of ['varc','dilr','qa']){
   const button=page.locator('#panel-overview .timeline-seg[data-accent="'+accent+'"]').first();
   await button.click();
   assert((await page.locator('#overview-timeline-readout').textContent()).includes(accent.toUpperCase()));
  }
  if(key===desc.mode){await bring(page,page.locator('#overview-timeline-readout'));await snap('timeline-inspector-'+key);}
  await top(page);await page.locator('#btn-quick-revision').click();
  assert(await page.locator('#quick-revision').isVisible());
  assert.equal(await page.locator('#overview-full').isVisible(),false);
  await measure('quick-'+key,{contrast:key===desc.mode});
  if(key===desc.mode)await snap('quick-'+key,true);
  await page.locator('#btn-close-revision').click();
  await section(page,'varc');await measure('varc-'+key,{contrast:false});
  if(key===desc.mode)await snap('varc-'+key);
 }
 await section(page,'overview');await mode(page,desc.mode);
 if(desc.depth==='deep'){await top(page);await snap('mode-toast');}
 for(const tab of matrix.tabs){
  await section(page,tab);
  if(tab==='dilr'||tab==='qa')await snap(tab+'-default');
  for(const d of await page.locator('#panel-'+tab+' [data-strategy-detail]').all()){
   const before=await d.evaluate(e=>e.open);await disclosure(d,!before);await disclosure(d,before);
  }
  await allDetails(page,tab);await top(page);await measure(tab+'-expanded');
  if(desc.depth==='deep')await snap(tab+'-expanded',true);
  const target={overview:'#logistics-title',varc:'[data-decision-grid]',dilr:'[data-selection-steps]',qa:'#qa-skip-title'}[tab];
  await bring(page,page.locator(target));await measure(tab+'-scrolled',{pinned:true,contrast:false});
  if(desc.depth==='deep')await snap(tab+'-scrolled');
 }
 action('All three modes, four tabs, seven disclosures and three timeline accents');
}
async function boundary(api){
 const {page,section,mode,allDetails,measure,action}=api;
 await section(page,'overview');await mode(page,'split');
 for(const v of matrix.boundaries){
  await page.setViewportSize(v);
  for(const tab of matrix.tabs){await section(page,tab);await allDetails(page,tab);await measure(v.width+'x'+v.height+'-'+tab,{contrast:false});}
  await section(page,'overview');await page.locator('#btn-quick-revision').click();
  await measure(v.width+'x'+v.height+'-quick',{contrast:false});await page.locator('#btn-close-revision').click();
 }
 action('Five views on both sides of five responsive boundaries');
}
module.exports={visual,boundary};
