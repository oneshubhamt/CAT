'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {tabs}=require('./visual-matrix.cjs');
const fixture='Synthetic QA note — check <value> & units.\nLiteral '+ '<'+'/script> must remain text. '+('Longword'.repeat(18))+'\nSecond line.';
async function runJourney(api){
 const {page,ctx,browser,desc,origin,url,dir,ready,top,section,theme,mode,disclosure,allDetails,bring,measure,snap,action,captureEvents}=api;
 const saved=async(p)=>{
  await p.waitForFunction(()=>document.querySelector('#storage-status')?.textContent==='Saved',null,{timeout:12000});
  assert.equal(await p.locator('#storage-status').isVisible(),false,'Routine save status is not visible in the header');
  if(!await p.locator('#export-fallback').isVisible())assert.equal(await p.locator('#toolbar-storage').isVisible(),false,'Healthy saves do not occupy the header');
 };
 async function add(p,sectionName,reference,long=false){
  const f=p.locator('#error-log-form');
  await f.locator('[name=date]').fill('2026-11-26');
  await f.locator('[name=section]').selectOption(sectionName);
  await f.locator('[name=category]').selectOption('Verification');
  await f.locator('[name=reference]').fill(reference);
  await f.locator('[name=cause]').fill(long?fixture:'Misread the requested value.');
  await f.locator('[name=correction]').fill('Check the exact value and units.');
  await f.locator('[name=marks]').fill('4');
  await f.locator('[name=minutes]').fill('2.5');
  await f.locator('[name=status]').selectOption('open');
  await p.locator('#error-log-submit').click();
 }
 async function note(p,tab,value){
  await section(p,tab);
  const drawer=p.locator('#panel-'+tab+' .notes-drawer');
  await disclosure(drawer,true);await drawer.locator('textarea').fill(value);
 }
 async function exportAndReopen(expected,expectedErrors=0){
  await top(page);
  const download=page.waitForEvent('download',{timeout:15000});
  await page.locator('#btn-export-html').click();
  const file=path.join(dir,'synthetic-backup.html');
  await (await download).saveAs(file);
  let fresh;
  try{
   const raw=fs.readFileSync(file,'utf8'),match=raw.match(/<script id="embedded-user-state"[^>]*>([\s\S]*?)<\/script>/);
   assert(match,'Portable snapshot exists');
   const snapshot=JSON.parse(match[1]);assert.equal(snapshot.schemaVersion,2);
   const errorRecords=snapshot.records.filter(r=>r.key.startsWith('error:')&&r.value!==null);
   assert.equal(errorRecords.length,expectedErrors,'Expected saved error records in export');
   for(const [key,value] of Object.entries(expected))assert.deepEqual(snapshot.records.find(r=>r.key===key)?.value,value,'Exported '+key);
   fresh=await browser.newContext({viewport:{width:desc.width,height:desc.height},hasTouch:desc.width<768,isMobile:desc.engine!=='firefox'&&desc.width<768,deviceScaleFactor:1,offline:desc.engine!=='webkit',acceptDownloads:true,reducedMotion:'reduce',locale:'en-IN',timezoneId:'Asia/Kolkata'});
   await fresh.route(/^https?:\/\//,route=>route.abort());
   const copy=await fresh.newPage();captureEvents(copy,null);await ready(copy,pathToFileURL(file).href);
   assert.equal(await copy.locator('#btn-quick-revision').getAttribute('aria-pressed'),'false');
   assert.equal(await copy.locator('#panel-overview').isVisible(),true);
   for(const [key,value] of Object.entries(expected)){
    if(key.startsWith('note:'))assert.equal(await copy.locator('textarea[data-note-key="'+key.slice(5)+'"]').inputValue(),value);
    if(key==='pref:theme')assert.equal(await copy.locator('#btn-theme').getAttribute('aria-pressed'),String(value==='dark'));
    if(key==='pref:varcOrder')assert.equal(await copy.locator('#panel-overview [data-varc-order="'+value+'"]').getAttribute('aria-pressed'),'true');
    if(key.startsWith('check:'))assert.equal(await copy.locator('[data-chk="'+key.slice(6)+'"]').isChecked(),value);
   }
   assert.equal(await copy.locator('#error-log-list article').count(),errorRecords.length);
   for(const record of errorRecords){const value=record.value;const cards=await copy.locator('#error-log-list article').allTextContents();assert(cards.some(c=>c.includes(value.reference)&&c.includes(value.cause)&&c.includes(value.correction)),'Error content restored');}
   await measure('portable-reopened',{},copy);await snap('portable-reopened',false,copy);
   action('Portable snapshot parsed and reopened in a fresh offline context');
  }finally{if(fresh)await fresh.close();fs.rmSync(file,{force:true});}
 }
 if(desc.id==='keyboard-resize'){
  await section(page,'overview');await page.locator('#tab-overview').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#tab-varc').getAttribute('aria-selected'),'true');
  assert(await page.locator('#tab-varc').evaluate(e=>document.activeElement===e));
  await page.keyboard.press('End');assert.equal(await page.locator('#tab-qa').getAttribute('aria-selected'),'true');
  await page.keyboard.press('Home');assert.equal(await page.locator('#tab-overview').getAttribute('aria-selected'),'true');
  await page.keyboard.press('3');assert(await page.locator('#panel-dilr').isVisible());assert(await page.locator('#tab-dilr').evaluate(e=>document.activeElement===e));
  const d=page.locator('[data-strategy-detail="dilr-flags"]');
  await d.locator('summary').focus();await page.keyboard.press('Enter');assert(await d.evaluate(e=>e.open));
  await note(page,'dilr','1234');await page.locator('textarea[data-note-key="dilr"]').press('4');assert(await page.locator('#panel-dilr').isVisible());
  await top(page);await page.locator('#btn-quick-revision').click();assert(await page.locator('#quick-revision-title').evaluate(e=>document.activeElement===e));
  await page.locator('#btn-close-revision').click();assert(await page.locator('#btn-quick-revision').evaluate(e=>document.activeElement===e));
  await section(page,'qa');await allDetails(page,'qa');
  for(const v of [{width:320,height:568},{width:844,height:390},{width:1280,height:800}]){
   await page.setViewportSize(v);await measure('resize-'+v.width);await snap('resize-'+v.width);
  }
  action('Keyboard navigation, focus, typing guard and live resize');return;
 }
 if(['recovery-journal','memory-only'].includes(desc.id)){
  const both=desc.id==='memory-only';
  await page.waitForFunction(b=>b?/Saving unavailable|Not saved/i.test(document.querySelector('#storage-status').textContent):/temporary save only/i.test(document.querySelector('#storage-status').textContent),both);
  await measure('storage-denied');await snap('storage-denied');
  await note(page,'qa',fixture);await top(page);
  await page.waitForFunction(b=>b?/Not saved|unavailable/i.test(document.querySelector('#storage-status').textContent):/temporary save only/i.test(document.querySelector('#storage-status').textContent),both);
  await measure('pending-note');await snap('pending-note');
  assert(await page.locator('#storage-status').isVisible(),'A saving failure must remain visible');
  assert(await page.locator('#btn-retry-storage').isVisible(),'Retry remains available');
  if(both)assert.match(await page.locator('#storage-status').textContent(),/not saved/i);
  else assert(await page.evaluate(()=>Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).some(k=>k?.startsWith('cat99_emergency_v2:'))),'Emergency recovery journal exists');
  if(!both){
   await page.evaluate(()=>{sessionStorage.setItem('qa-allow-idb','yes');window.__qaDenyIDB=false;});
   await page.locator('#btn-retry-storage').click();await saved(page);
    assert.equal(await page.evaluate(()=>Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).filter(k=>k?.startsWith('cat99_emergency_v2:')).length),0,'Durable commit retires emergency journal');
   await measure('recovered');await snap('recovered');
   await ready(page,url);assert.equal(await page.locator('textarea[data-note-key="qa"]').inputValue(),fixture);
   action('Journal recovery persisted through reload');
  }
  await exportAndReopen({'note:qa':fixture});return;
 }
 if(desc.id==='portable-webkit'){
  await note(page,'qa',fixture);await section(page,'overview');await mode(page,'readable');await add(page,'QA','Synthetic portable error');
  await page.locator('[data-chk="chk-logistics"]').check();
  await measure('portable-populated');await snap('portable-populated');
  await exportAndReopen({'note:qa':fixture,'pref:varcOrder':'readable','pref:theme':'dark','check:chk-logistics':true},1);return;
 }
 await saved(page);
 await section(page,'overview');await bring(page,page.locator('#error-log-title'));await measure('empty-error-log');await snap('empty-error-log');
 await page.locator('#error-log-submit').click();assert.equal(await page.locator('#error-log-list article').count(),0);
 await add(page,'VARC','Synthetic RC error',true);await add(page,'DILR','Synthetic set error');await add(page,'QA','Synthetic QA error');
 assert.equal(await page.locator('#error-log-list article').count(),3);
 await measure('error-log-populated');await bring(page,page.locator('#error-log-list'));await snap('error-log-populated');
 const filter=page.locator('#error-log-filter');await filter.selectOption('VARC');assert.equal(await page.locator('#error-log-list article').count(),1);
 const card=page.locator('#error-log-list article').first();
 const button=name=>card.getByRole('button',{name,exact:true});
 await button('Edit').click();await measure('error-edit');await snap('error-edit');
 await page.locator('#error-log-cancel').click();assert.equal(await page.locator('#error-log-submit').textContent(),'Add error');assert.equal(await filter.inputValue(),'VARC');assert.equal(await page.locator('#error-log-list article').count(),1);
 await button('Edit').click();await page.locator('[name=correction]').fill('Edited correction.');await page.locator('#error-log-submit').click();assert((await card.textContent()).includes('Edited correction.'));assert.equal(await filter.inputValue(),'VARC');assert.equal(await page.locator('#error-log-list article').count(),1);
 await button('Mark reviewed').click();assert((await card.textContent()).includes('Reviewed'));
 await measure('error-reviewed');await snap('error-reviewed');
 await button('Reopen').click();assert((await card.textContent()).includes('Open'));
 page.once('dialog',d=>d.dismiss());await button('Delete').click();assert.equal(await page.locator('#error-log-list article').count(),1);
 page.once('dialog',d=>d.accept());await button('Delete').click();assert.equal(await page.locator('#error-log-list article').count(),0);
 await measure('filter-empty');await snap('filter-empty');
 await filter.selectOption('all');assert.equal(await page.locator('#error-log-list article').count(),2);
 const values={};
 for(const tab of tabs){values['note:'+tab]=fixture+'\n'+tab;await note(page,tab,values['note:'+tab]);}
 await measure('long-note');await snap('long-note');
 await section(page,'overview');await page.locator('[data-chk="chk-varc-gate"]').check();await mode(page,'split');assert.equal(await page.locator('[data-chk="chk-varc-gate"]').isChecked(),false);
 for(const c of await page.locator('[data-chk]').all())await c.check();
 await bring(page,page.locator('#btn-reset-checklist'));await measure('checklist-complete');await snap('checklist-complete');
 await page.locator('#btn-reset-checklist').click();assert.equal(await page.locator('[data-chk]:checked').count(),0);
 await page.locator('[data-chk="chk-logistics"]').check();await theme(page,true);await saved(page);await ready(page,url);
 for(const [key,value] of Object.entries(values))assert.equal(await page.locator('textarea[data-note-key="'+key.slice(5)+'"]').inputValue(),value);
 assert.equal(await page.locator('#error-log-list article').count(),2);
 assert.equal(await page.locator('#btn-theme').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#panel-overview [data-varc-order="split"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('[data-chk="chk-logistics"]').isChecked(),true);
 const other=await ctx.newPage();captureEvents(other,origin);await ready(other,url);
 await note(other,'varc','Newer synthetic note from tab B');await saved(other);
 await page.bringToFront();await page.evaluate(()=>dispatchEvent(new Event('focus')));
 await page.waitForFunction(()=>document.querySelector('textarea[data-note-key="varc"]').value==='Newer synthetic note from tab B');
 values['note:varc']='Newer synthetic note from tab B';await other.close();
 await measure('after-reload');await snap('after-reload');
 await page.locator('[name=cause]').fill('Unsaved synthetic draft');
 await top(page);page.once('dialog',d=>d.dismiss());await page.locator('#btn-export-html').click();
 assert.equal(await page.locator('#export-fallback').isVisible(),false);
 await page.locator('[name=cause]').fill('');
 await exportAndReopen({...values,'pref:theme':'dark','pref:varcOrder':'split','check:chk-logistics':true},2);
 action('CRUD, validation, filters, confirmations, checklist reset, all notes, reload, cross-tab and export');
}
module.exports={runJourney};
