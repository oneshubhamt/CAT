'use strict';
// Risk-based visual matrix. Every profile checks all tabs, all VARC modes and all
// disclosures. Deep profiles additionally capture expanded full-panel evidence.
// The assigned screenshot mode rotates across profiles; assertions cover all modes.
const profiles = [
  {id:'c320-light',engine:'chromium',width:320,height:568,theme:'light',tier:'core',depth:'deep',mode:'standard',reason:'Smallest supported phone; content density and wrapping'},
  {id:'c390-dark',engine:'chromium',width:390,height:844,theme:'dark',tier:'core',depth:'deep',mode:'split',reason:'Typical phone; dark contrast and five-phase clock'},
  {id:'c768-light',engine:'chromium',width:768,height:1024,theme:'light',tier:'core',depth:'sweep',mode:'readable',reason:'Tablet transition to desktop-like tables'},
  {id:'c1280-light',engine:'chromium',width:1280,height:900,theme:'light',tier:'core',depth:'deep',mode:'readable',reason:'Desktop grids and proportional clocks'},
  {id:'w390-light',engine:'webkit',width:390,height:844,theme:'light',tier:'core',depth:'deep',mode:'readable',reason:'Safari engine; phone form and disclosure layout'},
  {id:'w430-dark',engine:'webkit',width:430,height:932,theme:'dark',tier:'core',depth:'sweep',mode:'standard',reason:'Large phone; dark theme and wrapping'},
  {id:'w844-landscape',engine:'webkit',width:844,height:390,theme:'dark',tier:'core',depth:'sweep',mode:'split',reason:'Short landscape viewport and nonsticky header'},
  {id:'w1280-dark',engine:'webkit',width:1280,height:900,theme:'dark',tier:'core',depth:'deep',mode:'split',reason:'Desktop Safari engine, dark theme'},
  {id:'c360-dark',engine:'chromium',width:360,height:800,theme:'dark',tier:'extended',depth:'sweep',mode:'standard',reason:'Narrow Android-style viewport'},
  {id:'c430-light',engine:'chromium',width:430,height:932,theme:'light',tier:'extended',depth:'sweep',mode:'split',reason:'Large phone, light theme'},
  {id:'c1024-dark',engine:'chromium',width:1024,height:768,theme:'dark',tier:'extended',depth:'sweep',mode:'readable',reason:'Large-grid breakpoint and compact laptop'},
  {id:'c1440-dark',engine:'chromium',width:1440,height:900,theme:'dark',tier:'extended',depth:'sweep',mode:'standard',reason:'Wide desktop content cap'},
  {id:'w320-dark',engine:'webkit',width:320,height:568,theme:'dark',tier:'extended',depth:'sweep',mode:'split',reason:'Smallest WebKit phone with dark surfaces'},
  {id:'w768-dark',engine:'webkit',width:768,height:1024,theme:'dark',tier:'extended',depth:'sweep',mode:'standard',reason:'Tablet in dark mode'},
  {id:'w1024-light',engine:'webkit',width:1024,height:768,theme:'light',tier:'extended',depth:'sweep',mode:'readable',reason:'WebKit grid transition'},
  {id:'f390-dark',engine:'firefox',width:390,height:844,theme:'dark',tier:'extended',depth:'sweep',mode:'split',reason:'Independent layout engine at phone width'},
  {id:'f1440-light',engine:'firefox',width:1440,height:900,theme:'light',tier:'extended',depth:'deep',mode:'standard',reason:'Independent layout engine at desktop width'}
];
const tabs=['overview','varc','dilr','qa'];
const modes=['standard','split','readable'];
// Boundary pass is layout-only: change width on one isolated Chromium page, scan
// all four expanded panels and quick view. No identical screenshots on both sides
// unless a failure is observed. CSS sm/md/lg/xl and the 500px landscape rule.
const boundaries=[{width:639,height:900},{width:640,height:900},{width:767,height:900},{width:768,height:900},{width:1023,height:900},{width:1024,height:900},{width:1279,height:900},{width:1280,height:900},{width:844,height:499},{width:844,height:501}];
const journeys=[
  {id:'durable-storage',engine:'chromium',width:390,height:844,theme:'light',tier:'core',reason:'Hosted-origin IndexedDB, checklist, all notes, error log CRUD, reload, cross-tab, export'},
  {id:'portable-webkit',engine:'webkit',width:390,height:844,theme:'dark',tier:'core',reason:'Local-file storage policy, real download and fresh-context reopen'},
  {id:'recovery-journal',engine:'chromium',width:320,height:568,theme:'dark',tier:'core',reason:'Controlled IndexedDB denial, temporary journal, retry and recovery'},
  {id:'memory-only',engine:'webkit',width:320,height:568,theme:'light',tier:'core',reason:'Both storage APIs denied; unsaved state, export and isolated reopen'},
  {id:'keyboard-resize',engine:'chromium',width:1280,height:800,theme:'light',tier:'extended',reason:'Keyboard, focus, native disclosures, zoom-style narrow reflow and orientation'},
  {id:'durable-firefox',engine:'firefox',width:1024,height:768,theme:'dark',tier:'extended',reason:'Hosted-origin durable storage in independent engine'}
];
function select(tier='core',engine='',profile=''){
  if(!['core','full'].includes(tier))throw Error('CAT_TIER must be core or full');
  if(engine&&!['chromium','webkit','firefox'].includes(engine))throw Error('Unknown CAT_ENGINE: '+engine);
  const eligible=p=>(tier==='full'||p.tier==='core')&&(!engine||p.engine===engine)&&(!profile||p.id===profile);
  const visual=profiles.filter(eligible),stateful=journeys.filter(eligible);
  const boundary=(tier==='full'&&(!engine||engine==='chromium')&&(!profile||profile==='boundaries'));
  if(!visual.length&&!stateful.length&&!boundary)throw Error('Empty test selection; check tier, engine and profile');
  return {visual,stateful,boundary};
}
module.exports={profiles,tabs,modes,boundaries,journeys,select};
