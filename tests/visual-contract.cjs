'use strict';
// Matrix contract is dependency-free and can run before browser installation.
function validate(matrix){
 const {profiles,journeys,boundaries,tabs,modes,select}=matrix;
 const checks=[];const check=(v,label)=>{if(!v)throw Error('Matrix: '+label);checks.push(label);};
 const all=profiles.concat(journeys);
 check(new Set(all.map(p=>p.id)).size===all.length,'unique scenario IDs');
 check(all.every(p=>p.width>=320&&p.height>0&&['light','dark'].includes(p.theme)&&p.reason),'explicit dimensions, theme and rationale');
 check(profiles.every(p=>modes.includes(p.mode)&&['deep','sweep'].includes(p.depth)),'explicit screenshot mode and depth');
 check(tabs.join()==='overview,varc,dilr,qa'&&modes.join()==='standard,split,readable','all screen and mode keys');
 const core=select('core'),full=select('full');
 check(core.visual.length===8&&core.stateful.length===4&&!core.boundary,'bounded core plan');
 check(full.visual.length===17&&full.stateful.length===6&&full.boundary,'extended plan adds independent engine and edges');
 check(new Set(core.visual.map(p=>p.engine)).size===2,'core Chromium and WebKit');
 check(new Set(full.visual.map(p=>p.engine)).size===3,'extended Firefox');
 for(const engine of ['chromium','webkit']){
  const group=core.visual.filter(p=>p.engine===engine);
  check(modes.every(m=>group.some(p=>p.mode===m)),engine+' all screenshot modes');
  check(['light','dark'].every(t=>group.some(p=>p.theme===t)),engine+' both themes');
  check(group.some(p=>p.width<768&&p.depth==='deep')&&group.some(p=>p.width>=1024&&p.depth==='deep'),engine+' deep phone and desktop');
 }
 check(core.visual.some(p=>p.width===320)&&core.visual.some(p=>p.width===768)&&core.visual.some(p=>p.width>p.height&&p.height<500),'compact, tablet and short landscape');
 for(const w of [640,768,1024,1280])check(boundaries.some(p=>p.width===w-1)&&boundaries.some(p=>p.width===w),'edge pair '+w);
 check(boundaries.some(p=>p.height===499)&&boundaries.some(p=>p.height===501),'short landscape boundary pair');
 check(core.stateful.map(p=>p.id).sort().join()===['durable-storage','memory-only','portable-webkit','recovery-journal'].sort().join(),'durable, journal, memory-only and portable journeys');
 check(full.stateful.some(p=>p.id==='keyboard-resize'),'keyboard and live resize');
 for(const p of all){const chosen=select(p.tier==='core'?'core':'full',p.engine,p.id);check(chosen.visual.length+chosen.stateful.length===1&&!chosen.boundary,'isolated selection '+p.id);}
 check(select('full','chromium','boundaries').boundary,'isolated boundary run');
 for(const args of [['invalid'],['core','invalid'],['core','','missing']]){
  let failed=false;try{select(...args);}catch{failed=true;}check(failed,'invalid selection rejected: '+args.join('/'));
 }
 return checks;
}
module.exports={validate};
if(require.main===module){const checks=validate(require('./visual-matrix.cjs'));console.log(checks.length+' visual matrix contract checks passed');}
