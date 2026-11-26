'use strict';
// Development-only runner. See tests/visual-matrix.cjs for the coverage policy.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const matrix=require('./visual-matrix.cjs'),{audit}=require('./visual-audit.cjs'),{writeReport}=require('./visual-report.cjs');
const {runJourney}=require('./visual-journeys.cjs'),{visual,boundary}=require('./visual-screens.cjs');
const input=path.resolve(__dirname,'../index.html'),output=path.resolve(process.env.CAT_SCREENSHOTS||path.join(__dirname,'../artifacts/mobile'));
const tier=process.env.CAT_TIER||'core',plan=matrix.select(tier,process.env.CAT_ENGINE||'',process.env.CAT_PROFILE||'');
const descriptors=[...plan.visual.map(p=>({...p,kind:'visual'})),...plan.stateful.map(p=>({...p,kind:'journey'})),...(plan.boundary?[{id:'boundaries',kind:'boundary',engine:'chromium',width:639,height:900,theme:'light',reason:'Both sides of responsive breakpoints and short landscape'}]:[])];
const report={version:2,tier,platform:process.platform,arch:process.arch,commit:process.env.GITHUB_SHA||'local',startedAt:new Date().toISOString(),planned:descriptors,scenarios:[]};
const top=page=>page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
async function ready(page,url){
 await page.goto(url,{waitUntil:'load'});
 await page.waitForFunction(()=>!document.body.inert&&document.querySelector('#storage-status')?.textContent!=='Opening browser storage…'&&!!document.querySelector('[data-fixed-segment] [data-clock-time]')?.textContent);
 await page.evaluate(()=>document.fonts.ready.then(()=>true));
}
async function section(page,tab){
 await top(page);const target=page.locator('#tab-'+tab);
 if(await page.evaluate(()=>navigator.maxTouchPoints>0))await target.tap();else await target.click();
 assert(await page.locator('#panel-'+tab).isVisible());
 assert.equal(await page.locator('#tab-'+tab).getAttribute('aria-selected'),'true');
 await top(page);
}
async function theme(page,dark){
 await top(page);const btn=page.locator('#btn-theme');
 if((await btn.getAttribute('aria-pressed')==='true')!==dark)await btn.click();
 assert.equal(await btn.getAttribute('aria-pressed'),String(dark));
 assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('dark')),dark);
}
async function mode(page,key,tab='overview'){
 await page.locator('#panel-'+tab+' [data-varc-order="'+key+'"]').click();
 for(const p of ['overview','varc'])assert.equal(await page.locator('#panel-'+p+' [data-varc-order="'+key+'"]').getAttribute('aria-pressed'),'true');
 const expected={standard:4,split:5,readable:4}[key];
 assert.equal(await page.locator('#overview-varc-bar > *').count(),expected);
 assert.equal(await page.locator('#varc-tab-bar > *').count(),expected);
}
async function disclosure(locator,open){
 if((await locator.evaluate(e=>e.open))!==open)await locator.locator(':scope > summary').click();
 assert.equal(await locator.evaluate(e=>e.open),open);
}
async function allDetails(page,tab){
 for(const item of await page.locator('#panel-'+tab+' [data-strategy-detail]').all())await disclosure(item,true);
 if(tab==='overview')await disclosure(page.locator('[data-glossary]'),true);
}
async function bring(page,locator){
 await locator.evaluate(el=>{
  const header=document.querySelector('#playbook-header'),r=el.getBoundingClientRect();
  const pinned=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toolbar-pinned-height'))||72;
  const offset=innerWidth<768?pinned+16:(getComputedStyle(header).position==='sticky'?header.offsetHeight+12:12);
  scrollTo({top:Math.max(0,scrollY+r.top-offset),behavior:'instant'});
 });
}
async function runScenario(browser,desc,origin){
 const rec={...desc,status:'running',checks:[],evidence:[],actions:[],runtimeErrors:[],consoleErrors:[],networkRequests:[],failure:null,elapsedMs:0,browserVersion:browser.version()};
 report.scenarios.push(rec);
 const start=Date.now(),dir=path.join(output,desc.id);
 fs.mkdirSync(dir,{recursive:true});let ctx,page,tracing=false;const failureEvidence=new Set();
 const record=(kind,label,file)=>rec.evidence.push({kind,label,path:path.relative(output,file).split(path.sep).join('/')});
 const captureEvents=(p,allowed)=>{
  p.on('pageerror',e=>rec.runtimeErrors.push(String(e)));
  p.on('console',msg=>{if(msg.type()==='error')rec.consoleErrors.push(msg.text());});
  p.on('request',req=>{if(/^https?:/.test(req.url())&&(!allowed||new URL(req.url()).origin!==allowed))rec.networkRequests.push(req.url());});
 };
 const snap=async(label,full=false,source=page)=>{
  const capture=async(name,whole)=>{
   const file=path.join(dir,name+'.png');
   await source.screenshot({path:file,fullPage:whole,animations:'disabled',caret:'hide',style:name.includes('toast')?'':'#toast{visibility:hidden!important}',timeout:15000});
   record('screenshot',name,file);
  };
  if(full){
   await top(source);
   const {height,vh}=await source.evaluate(()=>({height:document.documentElement.scrollHeight,vh:innerHeight}));
   if(height>15000){
    // Viewport strips with overlap for exceptionally long mobile panels.
    const stride=Math.max(100,vh-220);
    for(let y=0,i=1;y<height;y+=stride,i++){
     const reached=await source.evaluate(y=>{scrollTo({top:y,behavior:'instant'});return scrollY;},y);
     await capture(label+'-part-'+i,false);
     if(reached+vh>=height-2)break;
    }
    await top(source);return;
   }
  }
  await capture(label,full);
 };
 const measure=async(label,opts={},source=page)=>{
  const result=await audit(source,opts);rec.checks.push({label,...result});
  if(result.errors.length){
   const first=result.errors.find(e=>!failureEvidence.has(e.kind+'|'+e.element));
   for(const e of result.errors)failureEvidence.add(e.kind+'|'+e.element);
   if(first){
    const y=await source.evaluate(()=>scrollY);
    try{if(first.top!==null)await source.evaluate(v=>scrollTo({top:Math.max(0,v-180),behavior:'instant'}),first.top);await snap('failure-'+label,false,source);}
    catch{}finally{await source.evaluate(v=>scrollTo({top:v,behavior:'instant'}),y).catch(()=>{});}
   }
   console.error(desc.id+' '+label+': '+result.errors.length+' layout errors');
  }
 };
 const action=label=>rec.actions.push(label);
 try{
  const hosted=desc.kind==='journey'&&!['portable-webkit','keyboard-resize'].includes(desc.id);
  ctx=await browser.newContext({viewport:{width:desc.width,height:desc.height},hasTouch:desc.width<768||desc.height<500,isMobile:desc.engine!=='firefox'&&(desc.width<768||desc.height<500),deviceScaleFactor:1,offline:!hosted&&desc.engine!=='webkit',acceptDownloads:true,reducedMotion:'reduce',timezoneId:'Asia/Kolkata',locale:'en-IN',colorScheme:'light'});
  await ctx.tracing.start({screenshots:true,snapshots:true,sources:false});tracing=true;
  await ctx.route(/^https?:\/\//,route=>hosted&&new URL(route.request().url()).origin===origin?route.continue():route.abort());
  if(['recovery-journal','memory-only'].includes(desc.id)){
   await ctx.addInitScript(({both})=>{
    const original=window.indexedDB;
    let allowed=false;try{allowed=sessionStorage.getItem('qa-allow-idb')==='yes';}catch{}
    window.__qaDenyIDB=both||!allowed;
    Object.defineProperty(window,'indexedDB',{configurable:true,get(){if(window.__qaDenyIDB)throw new DOMException('Synthetic storage denial','SecurityError');return original;}});
    if(both)Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Synthetic storage denial','SecurityError');}});
   },{both:desc.id==='memory-only'});
  }
  page=await ctx.newPage();page.setDefaultTimeout(10000);captureEvents(page,hosted?origin:null);
  if(desc.kind!=='journey')await page.clock.setFixedTime(new Date('2026-11-26T06:30:00Z'));
  const url=hosted?origin+'/':pathToFileURL(input).href;
  await ready(page,url);await theme(page,desc.theme==='dark');
  const api={page,ctx,browser,desc,origin,url,dir,ready,top,section,theme,mode,disclosure,allDetails,bring,measure,snap,action,captureEvents};
  await ({visual,boundary,journey:runJourney}[desc.kind])(api);
  assert.deepEqual(rec.networkRequests,[],'Unexpected external network requests');
  assert.deepEqual(rec.runtimeErrors,[],'Unhandled browser exceptions');
  assert.deepEqual(rec.consoleErrors,[],'Unexpected browser console errors');
  assert.equal(rec.checks.reduce((n,c)=>n+c.errors.length,0),0,'Native layout failures (see report)');
  rec.status='passed';
 }catch(e){
  rec.status='failed';rec.failure=e.stack||String(e);console.error(desc.id+' FAILED: '+rec.failure);
  if(page)await snap('failure-final').catch(()=>{});
 }finally{
  if(tracing&&ctx){
   try{if(rec.status==='failed'){const file=path.join(dir,'trace.zip');await ctx.tracing.stop({path:file});record('trace','Failure trace',file);}else await ctx.tracing.stop();}catch(e){rec.failure=(rec.failure||'')+'\nTrace: '+String(e);rec.status='failed';}
  }
  if(ctx)await ctx.close().catch(()=>{});
  rec.elapsedMs=Date.now()-start;
  writeReport(output,report);
  console.log(rec.status.toUpperCase()+' '+desc.id+' — '+rec.checks.length+' audits, '+rec.evidence.length+' evidence files');
 }
}
async function main(){
 const {chromium,webkit,firefox}=require('playwright');
 fs.mkdirSync(output,{recursive:true});
 const source=fs.readFileSync(input,'utf8');
 report.sourceSha256=crypto.createHash('sha256').update(source,'utf8').digest('hex');
 const initial=source.match(/<script id="embedded-user-state"[^>]*>([\s\S]*?)<\/script>/);
 assert(initial&&JSON.parse(initial[1]).records.length===0,'Refuse to test personal backup as repository input');
 // Hosted journeys use an isolated ephemeral loopback origin; visual profiles
 // use the real local file offline. No production data or external web services.
 const server=http.createServer((req,res)=>{
  if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}
  if(req.url!=='/'){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(source);
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const origin='http://127.0.0.1:'+server.address().port;
 writeReport(output,report);
 try{
  for(const [name,launcher] of Object.entries({chromium,webkit,firefox})){
   const cases=descriptors.filter(p=>p.engine===name);if(!cases.length)continue;
   let browser;
   try{browser=await launcher.launch({headless:true});}catch(e){
    for(const desc of cases)report.scenarios.push({...desc,status:'failed',checks:[],evidence:[],actions:[],runtimeErrors:[],consoleErrors:[],networkRequests:[],elapsedMs:0,failure:'Browser launch: '+String(e)});
    writeReport(output,report);continue;
   }
   try{for(const desc of cases)await runScenario(browser,desc,origin);}finally{await browser.close();}
  }
 }finally{await new Promise(resolve=>server.close(resolve));}
 writeReport(output,report);
 const failed=report.scenarios.filter(s=>s.status!=='passed').length;
 console.log((report.scenarios.length-failed)+'/'+descriptors.length+' scenarios passed; evidence: '+output);
 if(failed||report.scenarios.length!==descriptors.length)process.exitCode=1;
}
if(process.argv.includes('--list'))console.log(JSON.stringify(descriptors,null,2));
else main().catch(e=>{console.error(e);process.exitCode=1;});
