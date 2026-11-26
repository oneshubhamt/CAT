/* Dependency-free source-level smoke tests. No production test hooks. */
'use strict';

async function runSmoke(html) {
  const checks = [];
  const check = (condition, label) => {
    if (!condition) throw new Error('FAIL: ' + label);
    checks.push(label);
  };
  const script = html.match(/<script id="cat-app">([\s\S]*?)<\/script>/)?.[1];
  check(Boolean(script), 'Named application script exists');
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    const body = match[1].trim();
    if (body && !body.startsWith('{')) new Function(body);
  }
  checks.push('All executable inline scripts parse');
  const expectedModules = ['strategy','schema','record-model','persistence','feedback','shell','checklist','notes','error-log','plan-view','export','bootstrap'];
  const moduleStarts = [...script.matchAll(/\/\/ <module:([^>]+)>/g)].map(m=>m[1]);
  const moduleEnds = [...script.matchAll(/\/\/ <\/module:([^>]+)>/g)].map(m=>m[1]);
  check(moduleStarts.join() === expectedModules.join() && moduleEnds.join() === expectedModules.join(), 'Stable ordered module boundaries');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  check(ids.length === new Set(ids).size, 'Unique HTML IDs');
  check(!/\b(?:import|export)\s+(?:\{|default|from)/.test(script), 'Classic single-file script');
  check(!html.includes('cat99_playbook_state_v1'), 'No legacy migration');
  const offline = html.match(/<style id="cat-offline-css">([\s\S]*?)<\/style>/)?.[1];
  check(Boolean(offline && offline.length > 1000), 'Embedded offline stylesheet exists');
  check(!/<(?:script|link|img|iframe|source|video|audio)\b[^>]*(?:src|href)\s*=\s*["'][^"']+["']/i.test(html), 'No external runtime resource tags');
  check(![...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)].some(m=>/@import\b|url\s*\(/i.test(m[1])), 'No CSS imports or asset URLs');
  check(!/\b(?:fetch\s*\(|XMLHttpRequest\b|WebSocket\b|EventSource\b|sendBeacon\s*\()/i.test(script), 'No runtime network request code');
  check(offline.includes('.dark .dark\\:bg-darkCanvas') && offline.includes('@media (min-width:768px)') && offline.includes('.lg\\:grid-cols-5'), 'Offline CSS includes theme, responsive and computed grid rules');
  check(html.includes('region:dilr-personal-selection') && html.includes('Binary, yes/no or coded responses') && html.includes('personal preference as a tie-breaker'), 'Personal DILR triage is explicit and conditional');
  check(html.includes('region:qa-skip-routing') && ['L · Solvable but lengthy','I · Calculation incomplete','U · Method uncertain','X · Conceptual gap','T · Unsolved TITA'].every(x=>html.includes(x)), 'Five QA skip classes present');
  check(!html.includes('Reframe length as a green flag') && html.includes('leave dead skips unflagged'), 'QA routing no longer conflicts with mechanical rules');
  check(html.includes('id="cat-mobile-layout"') && html.includes('viewport-fit=cover'), 'Authored mobile styles and safe-area viewport');
  check((html.match(/<div data-mobile-clock\b/g)||[]).length===6 && (html.match(/<div data-mode-switch\b/g)||[]).length===2, 'All six pacing bars and both mode switches have responsive hooks');
  check((html.match(/<table data-responsive-table\b/g)||[]).length===4 && html.includes('data-cell-label="Skip class"') && html.includes('data-cell-value'), 'All four tables support mobile row labels');
  check(['overview','varc','dilr','qa'].every(key=>html.includes('id="tab-'+key+'" role="tab" aria-controls="panel-'+key+'"')), 'Tabs link to their accessible panels');
  check(html.includes('ArrowRight:(index+1)%tabs.length') && html.includes("btn.setAttribute('tabindex', isTarget ? '0' : '-1')"), 'Roving tab keyboard navigation');
  check(html.includes('min-height:44px;min-width:44px') && html.includes('font-size:16px;line-height:1.4;width:100%'), 'Touch sizes and mobile form zoom protection');
  check(html.includes('region:rule-hierarchy') && ['1 · Non-negotiable safeguards','2 · Adaptive checkpoints','3 · Strong default execution plans','4 · Personal preferences and tie-breakers'].every(x=>html.includes(x)), 'Four ordered rule levels');
  check(!/attempt all 4 unconditionally|ONLY for ugly 3-digit division|skip pure Geometry in 10s|Banned in R1:|Write every addition out on paper/i.test(html), 'Contradictory absolute strategy rules removed');
  check(html.includes('combine premises across paragraphs') && html.includes('If two passages fail the gate'), 'VARC cross-paragraph inference and multiple rejection recovery');
  check(html.includes('region:dilr-case-discipline') && html.includes('separate temporary copy') && html.includes('uniqueness of the requested answer across surviving cases'), 'DILR hypothetical separation and answer determinacy');
  check(html.includes('At minute 22, if questions remain unseen') && html.includes('R2: unseen questions first') && html.includes('actual method, not topic alone'), 'QA first-pass and skip-routing alignment');
  check(html.includes('region:exam-logistics') && html.includes('Your admit card is authoritative') && html.includes('Reviewed 26 Nov 2026'), 'Dated logistics with admit-card precedence');
  check(['Report 07:00 · Gate 08:00','Report 11:00 · Gate 12:00','Report 15:00 · Gate 16:00','08:30–10:30','12:30–14:30','16:30–18:30'].every(x=>html.includes(x)), 'Reported three-shift timing table');
  check(html.includes('https://iimcat.ac.in/') && html.includes('32842@@M218') && html.includes('direct mock could not be opened'), 'Official portal and qualified reported mock link');
  check(html.includes('departure = target arrival minus realistic journey time and contingency') && html.includes('accepted, original, valid photo ID') && html.includes('do not assume a locker is available'), 'Travel, identity and belongings contingency');
  check(html.includes('Report a login, timer, mouse, calculator or display problem to the invigilator immediately') && html.includes('Use only authorised rough-work material'), 'Exam-hall fault handling and authorised materials');
  check(html.includes('4 November IIM admit-card release (mirror)') && html.includes('reported timings and rules') && html.includes('Links require internet only when opened'), 'Logistics provenance and offline link boundary');
  check(!/Hard Cap:|lock your best sequence, type it in|\bP1\b|\bQBR\b|\bAP\/GP\b|\bPLD\b|\bTSD\b|\bSI\/CI\b/.test(html), 'Residual absolute rules and obscure shorthand removed');
  check(html.includes('Save a defensible sequence if actual marking is penalty-free') && html.includes('as a tie-breaker only; rank by actual solvability'), 'Para Jumbles and compact DILR guidance are conditional');
  check((html.match(/<details data-strategy-detail="/g)||[]).length===7 && (html.match(/<details data-strategy-detail="[^"]+" open/g)||[]).length===2, 'Seven native disclosures, two core sections open by default');
  check(html.includes('aria-label="Dark mode" aria-pressed="false"'), 'Stable theme toggle label and initial pressed state');
  check(html.includes('[data-clock-time]') && html.includes('font-variant-numeric:tabular-nums') && html.includes('font-size:15px!important'), 'Prominent numeric timing labels');
  const initial = html.match(/<script id="embedded-user-state"[^>]*>([\s\S]*?)<\/script>/)[1].trim();
  check(JSON.parse(initial).schemaVersion === 2 && JSON.parse(initial).records.length === 0, 'Empty repository snapshot');

  // Isolated in-memory implementations of the relevant browser API surface.
  // They exercise wiring and state logic, not native browser layout or IndexedDB scheduling.
  const disk = new Map(), journal = new Map();
  let writerSequence = 0, failWrite = false, denyJournal = false;
  const localStorage = {
    get length() { if (denyJournal) throw Error('blocked'); return journal.size; },
    key(i) { return [...journal.keys()][i]; },
    getItem(k) { if (denyJournal) throw Error('blocked'); return journal.get(k) ?? null; },
    setItem(k,v) { if (denyJournal) throw Error('blocked'); journal.set(k,v); },
    removeItem(k) { if (denyJournal) throw Error('blocked'); journal.delete(k); }
  };
  function makeDb() {
    return {
      close() {},
      objectStoreNames: {contains:()=>true},
      transaction(name,mode) {
        const tx = {};
        let jobs = 0, closed = false;
        const next = new Map(disk);
        const finish = () => {
          if (jobs || closed) return;
          closed = true;
          if (mode === 'readwrite') {
            if (failWrite) { tx.error = Error('simulated abort'); tx.onabort?.(); return; }
            disk.clear(); for (const [k,v] of next) disk.set(k,v);
          }
          tx.oncomplete?.();
        };
        const request = fn => {
          jobs++;
          const req = {};
          Promise.resolve().then(() => {
            if (closed) return;
            req.result = fn(); req.onsuccess?.(); jobs--; finish();
          });
          return req;
        };
        tx.objectStore = () => ({
          get: k=>request(()=>next.get(k)),
          getAll: ()=>request(()=>[...next.values()]),
          put: r=>request(()=>next.set(r.key,JSON.parse(JSON.stringify(r))))
        });
        tx.abort = () => { closed=true; tx.onabort?.(); };
        return tx;
      }
    };
  }
  const idb = {open(name,version) {
    if(name !== 'cat99_playbook' || version !== 1) throw Error('Unexpected DB schema');
    const req = {result:makeDb()};
    Promise.resolve().then(()=>req.onsuccess?.());
    return req;
  }};

  function makeNode(id='') {
    const handlers = new Map(), attrs = new Map(), classes = new Set();
    return {
      id, dataset:{}, value:'', textContent:'', innerHTML:'', className:'', hidden:false,
      checked:false, disabled:false, children:[], style:{setProperty(k,v){this[k]=v;}}, offsetHeight:0, selectionStart:0, selectionEnd:0,
      classList:{
        add(...c){c.forEach(x=>classes.add(x));},
        remove(...c){c.forEach(x=>classes.delete(x));},
        toggle(c,force){const on=force??!classes.has(c);if(on)classes.add(c);else classes.delete(c);return on;},
        contains:c=>classes.has(c)
      },
      setAttribute(k,v){attrs.set(k,String(v));},
      getAttribute:k=>attrs.get(k)??null,
      removeAttribute:k=>attrs.delete(k),
      addEventListener(k,f){const a=handlers.get(k)||[];a.push(f);handlers.set(k,a);},
      async emit(k,e={}){for(const f of handlers.get(k)||[]) await f({target:this,preventDefault(){},...e});},
      click(){return this.emit('click');},
      append(...nodes){this.children.push(...nodes);},
      replaceChildren(...nodes){this.children=nodes;},
      querySelectorAll(){return [];},
      querySelector(){return null;},
      focus(){},scrollIntoView(){},setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}
    };
  }

  function environment({enabled=true,embedded=initial}={}) {
    const nodes = new Map(ids.map(id=>[id,makeNode(id)]));
    const node = id => { if(!nodes.has(id)) throw Error('Missing DOM id: '+id); return nodes.get(id); };
    node('embedded-user-state').textContent=embedded;
    const form=node('error-log-form');
    const fields=Object.fromEntries(['date','section','category','reference','cause','correction','marks','minutes','status'].map(k=>[k,makeNode(k)]));
    form.elements={...fields,namedItem:k=>fields[k]};
    form.reset=()=>{for(const f of Object.values(fields)) f.value='';fields.section.value='VARC';fields.category.value='Selection';fields.status.value='open';};
    const filter=node('error-log-filter'); filter.value='all';
    const sections=['overview','varc','dilr','qa'];
    const tabBtns=sections.map(tab=>Object.assign(makeNode(),{dataset:{tab}}));
    const modeBtns=['standard','split','readable','standard','split','readable'].map(varcOrder=>Object.assign(makeNode(),{dataset:{varcOrder}}));
    const noteKeys=sections;
    const noteNodes=noteKeys.map(noteKey=>Object.assign(makeNode(),{dataset:{noteKey}}));
    const badges=Object.fromEntries(noteKeys.map(k=>[k,makeNode()]));
    const checkboxes=[...new Set([...html.matchAll(/data-chk="([^"]+)"/g)].map(m=>m[1]))].map(chk=>Object.assign(makeNode(),{dataset:{chk}}));
    const bindings=[...html.matchAll(/data-plan="([^"]+)"/g)].map(m=>Object.assign(makeNode(),{dataset:{plan:m[1]}}));
    const fixedSegments=[...html.matchAll(/data-fixed-segment="([^"]+)"/g)].map(m=>{
      const el=makeNode(), label=makeNode(), time=makeNode();
      el.dataset.fixedSegment=m[1];el.dataset.accent=m[1].split(':')[0];
      el.querySelector=q=>q==='[data-clock-label]'?label:q==='[data-clock-time]'?time:null;
      return {el,label,time};
    });
    const statusNodes=sections.map(()=>makeNode()), modeLabels=sections.map(()=>makeNode());
    const select={
      '.tab-panel':sections.map(x=>node('panel-'+x)),
      '.tab-btn':tabBtns, '.varc-order-btn':modeBtns, '.reset-chk':checkboxes,
      'textarea[data-note-key]':noteNodes,'[data-plan]':bindings,'[data-fixed-segment]':fixedSegments.map(s=>s.el),
      '[data-note-status]':statusNodes,'.varc-mode-label':modeLabels,
      '#panel-overview .timeline-seg':[],'.notes-drawer':[]
    };
    const document=Object.assign(makeNode('document'),{
      body:makeNode('body'),documentElement:makeNode('html'),
      getElementById:node,querySelectorAll:s=>select[s]||[],
      querySelector:s=>badges[s.match(/data-note-badge="([^"]+)"/)?.[1]]||null,
      createElement:()=>makeNode()
    });
    const window=Object.assign(makeNode('window'),{scrollTo(){},print(){},confirm(){return true;}});
    const globalThis={crypto:{randomUUID:()=> 'test-'+(++writerSequence)},indexedDB:enabled?idb:undefined};
    const timers=new Map();let timerSequence=0;
    const setTimeout=(fn,ms)=>{const id=++timerSequence;timers.set(id,{fn,ms});return id;};
    const clearTimeout=id=>timers.delete(id);
    const runTimers=async()=>{
      for(let n=0;timers.size && n<30;n++){
        const [id,{fn}]=[...timers.entries()].sort((a,b)=>a[1].ms-b[1].ms)[0];
        timers.delete(id);await fn();await Promise.resolve();
      }
    };
    class FormData { constructor(form){this.form=form;} *[Symbol.iterator](){for(const [k,v] of Object.entries(this.form.elements))if(k!=='namedItem')yield [k,v.value];} }
    const patched=script.trim().replace(/\}\)\(\);\s*$/,'return {strategy,schema,createRecordModel,createPersistence,createApp}; })();').replace(/^\(function/,'return (function');
    const api=new Function('document','window','globalThis','localStorage','console','setTimeout','clearTimeout','FormData',patched)(
      document,window,globalThis,localStorage,{warn(){},error(){}},setTimeout,clearTimeout,FormData);
    return {api,node,document,window,fields,form,tabBtns,modeBtns,noteNodes,checkboxes,bindings,fixedSegments,runTimers};
  }
  const env=environment();
  const {strategy,schema,createRecordModel,createPersistence}=env.api;
  for (const mode of strategy.validModes) {
    let elapsed=0,width=0;
    for (const seg of strategy.orders[mode].segments) {
      const [start,end]=seg.time.replace('m','').split('–').map(Number);
      check(start===elapsed && end>start && seg.width===(end-start)*2.5, mode+' contiguous segment '+seg.time);
      elapsed=end; width+=seg.width;
    }
    check(elapsed===40 && width===100,mode+' 40-minute clock');
    const p=strategy.planValues(mode);
    check(p.quick===strategy.orders[mode].segments.map(s=>s.time+' '+s.label).join(' · '),mode+' derived revision clock');
    check(p.combined===(mode==='readable'?'103–115 raw marks':'100–112 raw marks'),mode+' combined score math');
  }
  for(const [name,segments] of Object.entries(strategy.fixedClocks)){
    let elapsed=0;
    for(const seg of segments){check(seg.start===elapsed && seg.end>seg.start,name+' contiguous phase '+seg.start+'–'+seg.end);elapsed=seg.end;}
    check(elapsed===40 && Object.isFrozen(segments[0]),name+' immutable 40-minute schedule');
  }
  const fixed=strategy.planValues('standard');
  check(fixed.dilrQuick==='0–4m scan · 4–18m set 1 · 18–32m set 2 · 32–39m optional · 39–40m audit','DILR compact schedule derived');
  check(fixed.qaQuick==='0–22m sitters · 22–36m mediums · 36–40m cleanup','QA compact schedule derived');
  check(fixed.dilrCorrect==='10–12 correct' && fixed.qaCorrect==='11–12 correct' && fixed.dilrMarks==='30–36 before penalties' && fixed.qaMarks==='33–36 before penalties','Non-VARC scores and correct counts share source');
  check(fixed.dilrSwitch==='6–7m' && fixed.qaIgnition==='45s' && fixed.qaRound1==='2.5m' && fixed.qaRound2==='3.5m','Shared adaptive checkpoint values');
  check(strategy.fixedBars.dilr[3].start===32 && strategy.fixedBars.dilr[3].end===40 && fixed.dilrRecoveryQuick.includes('11–25m, 25–39m'),'Combined DILR bar and recovery projection');
  check(strategy.scenarioValues('standard').map(s=>s.total).join()==='78,101,122','Standard scenario totals');
  check(strategy.scenarioValues('readable').map(s=>s.total).join()==='78,104,122','Readable scenario totals');
  check(Object.isFrozen(strategy.orders.standard.segments[0]),'Strategy output immutable');
  const m=createRecordModel(schema,'model-test');
  const initialView=m.view();
  m.applyRecord(m.createRecord('note:qa','hello'));
  check(initialView.notes.qa==='' && m.view().notes.qa==='hello','Copy-on-write projection');
  check(Object.isFrozen(m.view()) && Object.isFrozen(m.view().notes),'Model views immutable');
  check(Object.isFrozen(m.snapshot().records[0]),'Snapshot records immutable');
  const validError={date:'2026-11-26',section:'VARC',category:'Comprehension',reference:'RC 1',cause:'Missed qualifier',correction:'Check scope',marks:4,minutes:2,status:'open'};
  check(schema.isValidRecord({key:'error:test',value:validError,time:1,seq:1,writer:'x'}),'Valid error shape');
  check(!schema.isValidRecord({key:'pref:theme',value:'invalid',time:1,seq:1,writer:'x'}),'Invalid preference rejected');
  const newStorage=e=>e.api.createPersistence({onStatus(){},onReconcile(){},readEmbedded:()=>e.node('embedded-user-state').textContent});
  const a=newStorage(env);await a.loadState();
  a.setRecord('note:varc','</'+'script><script>example</'+'script>',10000);
  const oldKey=[...journal.keys()][0];
  a.setRecord('pref:theme','dark',10000);
  check(journal.size===1 && !journal.has(oldKey) && disk.size===0,'Immutable dirty journal generations');
  await a.flushPending();
  check(disk.size===2 && journal.size===0,'Commit retires journal');
  check(!a.safeSnapshot().includes('<') && schema.readSnapshot(a.safeSnapshot())[0].value.includes('</'+'script>'),'Snapshot escaping round-trip');
  let rejected=false;
  try {schema.readSnapshot(JSON.stringify({schemaVersion:2,records:[...a.snapshot().records,a.snapshot().records[0]]}));} catch {rejected=true;}
  check(rejected,'Duplicate snapshot keys rejected');
  const b=newStorage(environment());await b.loadState();
  check(b.view().theme==='dark' && b.view().notes.varc.includes('example'),'Reload hydrates data');
  a.setRecord('note:qa','QA edit',10000);await a.flushPending();
  b.setRecord('check:chk-bailout',true,10000);await b.flushPending();await b.reconcileDatabase();
  check(b.view().notes.qa==='QA edit' && b.view().checklist['chk-bailout'],'Independent cross-tab merging');
  b.setRecord('error:test',validError,10000);await b.flushPending();
  const oldSnapshot=b.safeSnapshot();b.setRecord('error:test',null,10000);await b.flushPending();
  const c=newStorage(environment({embedded:oldSnapshot}));await c.loadState();
  check(!c.view().errors.test,'Deleted entry protected from stale export');
  const d=newStorage(environment({enabled:false}));await d.loadState();
  d.setRecord('note:dilr','recover me');
  check(journal.size>0 && !d.isOpen(),'Emergency journal fallback');
  const f=newStorage(environment());await f.loadState();
  check(f.view().notes.dilr==='recover me' && journal.size===0,'Journal replay and cleanup');
  failWrite=true;f.setRecord('note:overview','write failed',10000);await f.flushPending();
  check(!f.isOpen() && journal.size>0,'Aborted transaction retains data');
  failWrite=false;await f.loadState();
  check(f.view().notes.overview==='write failed' && journal.size===0,'Retry persists failed edit');
  const h=newStorage(environment({enabled:false}));await h.loadState();h.setRecord('note:qa','x'.repeat(40000));
  check(h.view().notes.qa.length===40000 && journal.size===0,'Oversized journal retains in-memory record');
  denyJournal=true;const z=newStorage(environment({enabled:false}));await z.loadState();z.setRecord('note:qa','memory only');
  check(z.view().notes.qa==='memory only','Both stores unavailable: memory retained');denyJournal=false;

  // Execute the actual registered bootstrap and exercise feature events.
  disk.clear();journal.clear();
  const app=environment();
  await app.document.emit('DOMContentLoaded');
  check(!app.document.body.inert,'Bootstrap releases the interface');
  check(app.node('panel-overview').classList.contains('hidden')===false,'Overview initially active');
  check(app.node('btn-theme').getAttribute('aria-pressed')==='false','Light theme pressed state on startup');
  check(app.fixedSegments.length===24 && app.fixedSegments.every(({el,label,time})=>{
    const [key,i]=el.dataset.fixedSegment.split(':');const seg=strategy.fixedBars[key][Number(i)];
    return seg && el.style.width===((seg.end-seg.start)*2.5)+'%' && label.textContent===seg.label && time.textContent===seg.start+'–'+seg.end+'m';
  }), 'All 24 fixed clock elements rendered from strategy data');
  check(app.bindings.every(n=>typeof strategy.planValues('standard')[n.dataset.plan]==='string' && n.textContent===strategy.planValues('standard')[n.dataset.plan]),'Every plan binding is defined and rendered');
  await app.modeBtns[1].click();
  check(app.modeBtns[1].getAttribute('aria-pressed')==='true' && app.modeBtns[4].getAttribute('aria-pressed')==='true','Mode toggles synchronized');
  check(app.bindings.filter(n=>n.dataset.plan==='quick').every(n=>n.textContent.includes('0–17m')),'Quick view follows active mode');
  await app.node('btn-quick-revision').click();
  check(!app.node('quick-revision').hidden && app.node('overview-full').hidden,'Revision view opens');
  await app.tabBtns[2].click();
  check(app.node('quick-revision').hidden && !app.node('panel-dilr').classList.contains('hidden'),'Tab navigation exits revision');
  await app.node('btn-theme').click();
  check(app.document.documentElement.classList.contains('dark') && app.node('btn-theme').getAttribute('aria-pressed')==='true','Theme switch and pressed state');
  const qaNote=app.noteNodes[3];qaNote.value='Remember units';await qaNote.emit('input');
  check([...journal.values()].some(raw=>raw.includes('Remember units')),'Note input journals immediately');
  const item=app.checkboxes[0];item.checked=true;await item.emit('change');
  check(app.node('checklist-progress').textContent.startsWith('1 /'),'Checklist updates');
  await app.node('btn-reset-checklist').click();
  check(app.node('checklist-progress').textContent.startsWith('0 /'),'Checklist reset');
  for(const [k,v] of Object.entries(validError)) app.fields[k].value=v===null?'':String(v);
  await app.form.emit('submit');
  check(app.node('error-log-count').textContent==='1 entries · 1 open','Error-log creation via UI');
  const card=app.node('error-log-list').children[0], actions=card.children.at(-1);
  await actions.children[1].click();
  check(app.node('error-log-count').textContent==='1 entries · 0 open','Error-log review via UI');
  await app.node('error-log-list').children[0].children.at(-1).children[2].click();
  check(app.node('error-log-count').textContent==='0 entries · 0 open','Error-log deletion via UI');
  await app.runTimers();
  const reopened=environment();await reopened.document.emit('DOMContentLoaded');
  check(reopened.noteNodes[3].value==='Remember units' && reopened.document.documentElement.classList.contains('dark'),'UI reload hydrates saved data');
  check(reopened.modeBtns[1].getAttribute('aria-pressed')==='true','UI reload restores mode');
  check(reopened.node('btn-theme').getAttribute('aria-pressed')==='true','Theme pressed state restored from storage');
  return checks;
}

if(typeof module !== 'undefined' && require.main === module) {
  const fs=require('node:fs'),path=require('node:path');
  runSmoke(fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8'))
    .then(checks=>{for(const label of checks) console.log('PASS '+label);console.log(checks.length+' checks passed');})
    .catch(error=>{console.error(error);process.exitCode=1;});
}
