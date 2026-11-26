/* Native-browser mobile QA. Development only: npm install --no-save playwright
 * npx playwright install chromium webkit
 * node tests/mobile-browser.cjs
 * Screenshots and a JSON report go to artifacts/mobile/ (override with CAT_SCREENSHOTS).
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium, webkit} = require('playwright');
const input = path.resolve(__dirname,'../index.html');
const output = path.resolve(process.env.CAT_SCREENSHOTS || path.join(__dirname,'../artifacts/mobile'));
const sizes = [{name:'compact',width:320,height:568},{name:'android',width:360,height:800},{name:'iphone',width:390,height:844},{name:'large-phone',width:430,height:932},{name:'tablet',width:768,height:1024},{name:'landscape',width:844,height:390},{name:'desktop',width:1280,height:900}];
const report = [];
fs.mkdirSync(output,{recursive:true});
async function main(){
 for (const [engine, launcher] of [['chromium',chromium],['webkit',webkit]]) {
   if(process.env.CAT_ENGINE && process.env.CAT_ENGINE!==engine)continue;
   const browser=await launcher.launch({headless:true});
   try {
     for(const size of sizes){
       const context=await browser.newContext({viewport:{width:size.width,height:size.height},hasTouch:size.name!=='desktop',deviceScaleFactor:1,offline:true,acceptDownloads:true,reducedMotion:'reduce'});
       const page=await context.newPage();
       const errors=[],requests=[];
       page.on('pageerror',e=>errors.push(String(e)));
       page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
       await page.goto(pathToFileURL(input).href);
       await page.waitForFunction(()=>!document.body.inert && document.querySelector('#storage-status')?.textContent!=='Opening browser storage…');
       const checkLayout=async(label)=>{
         const metrics=await page.evaluate(()=>{
           const visible=e=>!!e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
           const root=document.documentElement;
           const header=document.querySelector('#playbook-header').getBoundingClientRect();
           const nav=[...document.querySelectorAll('#section-nav .tab-btn')].map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,right:el.getBoundingClientRect().right}));
           const actions=[...document.querySelectorAll('#toolbar-actions button')].map(el=>({id:el.id,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,right:el.getBoundingClientRect().right}));
           const clocks=[...document.querySelectorAll('[data-mobile-clock] > *')].filter(visible).map(el=>({height:el.getBoundingClientRect().height,clipped:el.scrollWidth>el.clientWidth+2 || el.scrollHeight>el.clientHeight+2}));
           const clipped=[...document.querySelectorAll('main [data-cell-value],main .varc-order-btn,main textarea,main input:not([type=checkbox]),main select')].filter(visible).filter(el=>el.getBoundingClientRect().right>innerWidth+2).map(el=>el.outerHTML.slice(0,140));
           return {width:innerWidth,scrollWidth:root.scrollWidth,headerHeight:header.height,nav,actions,clocks,clipped};
         });
         assert(metrics.scrollWidth<=metrics.width+2,engine+' '+size.name+' '+label+' page overflow '+JSON.stringify(metrics));
         assert(metrics.nav.every(n=>n.height>=44 && n.right<=metrics.width+1),engine+' '+size.name+' tab targets');
         assert(metrics.actions.every(n=>n.height>=44 && n.width>=44 && n.right<=metrics.width+1),engine+' '+size.name+' action targets');
         if(size.width<768)assert(metrics.clocks.every(c=>c.height>=44&&!c.clipped),engine+' '+size.name+' clipped timeline '+JSON.stringify(metrics.clocks));
         assert(!metrics.clipped.length,engine+' '+size.name+' '+label+' clipped controls '+metrics.clipped);
         report.push({engine,viewport:size.name,view:label,...metrics});
       };
       const snap=async(label,fullPage=false)=>{
         await page.screenshot({path:path.join(output,[engine,size.name,label].join('-')+'.png'),fullPage,animations:'disabled'});
       };
       const section=async(tab)=>{await page.locator('#tab-'+tab).click();await page.waitForFunction(t=>!document.querySelector('#panel-'+t).classList.contains('hidden'),tab);await page.evaluate(()=>scrollTo(0,0));};
       await checkLayout('overview');await snap('overview');
       for(const mode of ['standard','split','readable']){
         await page.locator('#panel-overview [data-varc-order="'+mode+'"]').click();
         assert.equal(await page.locator('#panel-varc [data-varc-order="'+mode+'"]').getAttribute('aria-pressed'),'true');
         await checkLayout('overview-'+mode);
         await page.locator('#btn-quick-revision').click();
         await checkLayout('quick-'+mode);await snap('quick-'+mode);
         await page.locator('#btn-close-revision').click();
       }
       await section('varc');await checkLayout('varc');await snap('varc');
       await page.locator('#panel-varc [data-varc-order="split"]').click();
       await checkLayout('varc-split');await snap('varc-split');
       await page.locator('#panel-varc [data-responsive-table]').scrollIntoViewIfNeeded();await snap('varc-question-types');
       await section('dilr');await checkLayout('dilr');await snap('dilr');
       await page.locator('#dilr-personal-title').scrollIntoViewIfNeeded();await snap('dilr-selection');
       await page.locator('#dilr-recovery-title').scrollIntoViewIfNeeded();await snap('dilr-recovery');
       await section('qa');await checkLayout('qa');await snap('qa');
       await page.locator('#qa-skip-title').scrollIntoViewIfNeeded();await snap('qa-routing');
       await page.locator('#panel-qa [data-responsive-table]').last().scrollIntoViewIfNeeded();await snap('qa-priority');
       await page.locator('#panel-qa .notes-drawer summary').click();
       await page.locator('textarea[data-note-key="qa"]').fill('Native mobile QA — notes survive reload. Units, domain, sign.');
       await checkLayout('notes');await snap('notes');
       await section('overview');
       await page.locator('#error-log-title').scrollIntoViewIfNeeded();
       await page.locator('#error-log-form [name="reference"]').fill('Mock 1');
       await page.locator('#error-log-form [name="cause"]').fill('Misread a qualifier.');
       await page.locator('#error-log-form [name="correction"]').fill('Verify scope.');
       await checkLayout('error-form');await snap('error-form');
       await page.locator('#error-log-submit').click();
       assert.match(await page.locator('#error-log-count').textContent(),/1 entries/);
       await snap('error-saved');
       await page.locator('#btn-theme').click();
       await page.locator('#btn-quick-revision').click();
       await checkLayout('dark-quick');await snap('dark-quick');
       await page.locator('#btn-close-revision').click();
       await section('qa');await checkLayout('dark-qa');await snap('dark-qa');
       // Test true portable file export and reload once per engine, even if file-origin
       // IndexedDB policies differ. No personal data is written to the repository.
       if(size.name==='iphone'){
         const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#btn-export-html').click()]);
         const backup=path.join(output,engine+'-portable-backup.html');
         await download.saveAs(backup);
         const backupPage=await context.newPage();
         backupPage.on('pageerror',e=>errors.push(String(e)));
         backupPage.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
         await backupPage.goto(pathToFileURL(backup).href);
         await backupPage.waitForFunction(()=>!document.body.inert && document.querySelector('#storage-status')?.textContent!=='Opening browser storage…');
         assert.equal(await backupPage.locator('textarea[data-note-key="qa"]').inputValue(),'Native mobile QA — notes survive reload. Units, domain, sign.');
         assert.match(await backupPage.locator('#error-log-count').textContent(),/1 entries/);
         assert.equal(await backupPage.locator('html').evaluate(el=>el.classList.contains('dark')),true);
         await backupPage.screenshot({path:path.join(output,engine+'-portable-reopened.png'),animations:'disabled'});
         await backupPage.close();
       }
       assert.deepEqual(requests,[],engine+' '+size.name+' offline network requests');
       assert.deepEqual(errors,[],engine+' '+size.name+' browser exceptions');
       console.log('PASS '+engine+' '+size.name);
       await context.close();
     }
   } finally {await browser.close();}
 }
}
main().then(()=>{fs.writeFileSync(path.join(output,'layout-report.json'),JSON.stringify(report,null,2));console.log(report.length+' layout measurements; screenshots in '+output);}).catch(error=>{fs.writeFileSync(path.join(output,'layout-report.json'),JSON.stringify(report,null,2));console.error(error);process.exitCode=1;});
