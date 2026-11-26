/* Small offline CSS compiler for this playbook's utility vocabulary.
 * No general Tailwind compatibility is claimed. Unknown classes fail compilation.
 * Node is a development-only tool; the committed HTML needs no runtime dependencies.
 */
'use strict';
const semantic = new Set('dark group no-print notes-drawer print-card print-show-heading reset-chk tab-btn tab-panel timeline-seg varc-mode-label varc-order-btn'.split(' '));
const palette = {canvas:'#FAF9F6',surface:'#FFFFFF',hairline:'#E5E4DF',ink:'#1A1A19',muted:'#5F5F5A',darkCanvas:'#131312',darkSurface:'#1C1C1A',darkHairline:'#2D2D29',darkInk:'#F3F2EE',darkMuted:'#A1A09A',varc:'#3B5BDB',dilr:'#0F766E',qa:'#B45309',alert:'#BE123C',white:'#FFFFFF','amber-300':'#FCD34D','emerald-300':'#6EE7B7','indigo-300':'#A5B4FC',transparent:'transparent'};
// Classes used in computed templates, JS state transitions and DOM-created elements.
const dynamic = 'opacity-100 translate-y-0 shadow-sm border-transparent border-ink dark:border-darkInk border-varc border-dilr border-qa border-dilr/40 lg:grid-cols-5 bg-varc bg-dilr bg-qa text-ink dark:text-darkInk text-varc text-dilr text-qa text-muted dark:text-darkMuted hover:text-ink dark:hover:text-darkInk text-white hidden whitespace-pre-wrap break-words underline font-medium no-print flex flex-wrap gap-4'.split(' ');
const sans='system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif',mono='ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace';
const base=[
'*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#E5E4DF}',
'html{line-height:1.5;-webkit-text-size-adjust:100%;tab-size:4;font-family:'+sans+'}',
'body,h1,h2,h3,h4,h5,h6,p,dl,dd,figure,blockquote,pre,fieldset{margin:0}',
'h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}',
'b,strong{font-weight:bolder}ol,ul,menu{list-style:none;margin:0;padding:0}',
'a{color:inherit;text-decoration:inherit}table{text-indent:0;border-color:inherit;border-collapse:collapse}',
'button,input,optgroup,select,textarea{font:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}',
'button{background:transparent;cursor:pointer}button:disabled{cursor:default;opacity:.65}textarea{resize:vertical}',
'input,textarea,select{background:transparent}::placeholder{opacity:1;color:#9CA3AF}',
'img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}',
'summary{display:list-item;cursor:pointer}summary.list-none::-webkit-details-marker{display:none}',
'[hidden]{display:none!important}button:focus-visible,a:focus-visible,summary:focus-visible{outline:2px solid #3B5BDB;outline-offset:2px}',
'input[type=checkbox]{flex-shrink:0}'
].join('\n');
const map={
block:'display:block',inline:'display:inline','inline-block':'display:inline-block',flex:'display:flex','inline-flex':'display:inline-flex',grid:'display:grid',hidden:'display:none',
'flex-1':'flex:1 1 0%','flex-col':'flex-direction:column','flex-row':'flex-direction:row','flex-wrap':'flex-wrap:wrap','shrink-0':'flex-shrink:0',
'items-start':'align-items:flex-start','items-center':'align-items:center','items-baseline':'align-items:baseline','items-end':'align-items:flex-end','justify-between':'justify-content:space-between','justify-center':'justify-content:center','self-start':'align-self:flex-start','self-auto':'align-self:auto',
'max-w-6xl':'max-width:72rem','max-w-full':'max-width:100%','w-full':'width:100%','min-h-screen':'min-height:100vh',
relative:'position:relative',sticky:'position:sticky',fixed:'position:fixed',
'overflow-hidden':'overflow:hidden','overflow-x-auto':'overflow-x:auto',truncate:'overflow:hidden;text-overflow:ellipsis;white-space:nowrap','whitespace-nowrap':'white-space:nowrap','whitespace-pre-wrap':'white-space:pre-wrap','break-words':'overflow-wrap:break-word','align-middle':'vertical-align:middle','align-top':'vertical-align:top','border-collapse':'border-collapse:collapse',
rounded:'border-radius:.25rem','rounded-md':'border-radius:.375rem','rounded-lg':'border-radius:.5rem','rounded-xl':'border-radius:.75rem','rounded-full':'border-radius:9999px',
'font-sans':'font-family:'+sans,'font-mono':'font-family:'+mono,'font-normal':'font-weight:400','font-medium':'font-weight:500','font-semibold':'font-weight:600','font-bold':'font-weight:700',
'text-xs':'font-size:.75rem;line-height:1rem','text-sm':'font-size:.875rem;line-height:1.25rem','text-base':'font-size:1rem;line-height:1.5rem','text-lg':'font-size:1.125rem;line-height:1.75rem','text-xl':'font-size:1.25rem;line-height:1.75rem','text-2xl':'font-size:1.5rem;line-height:2rem','text-3xl':'font-size:1.875rem;line-height:2.25rem',
'text-left':'text-align:left','text-center':'text-align:center',uppercase:'text-transform:uppercase',italic:'font-style:italic',underline:'text-decoration-line:underline','tracking-tight':'letter-spacing:-.025em','tracking-tighter':'letter-spacing:-.05em','tracking-wider':'letter-spacing:.05em','leading-none':'line-height:1','leading-snug':'line-height:1.375','leading-relaxed':'line-height:1.625',
'list-disc':'list-style-type:disc','list-none':'list-style-type:none','list-inside':'list-style-position:inside','cursor-pointer':'cursor:pointer','pointer-events-none':'pointer-events:none','select-none':'user-select:none','resize-y':'resize:vertical','antialiased':'-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale','scroll-smooth':'scroll-behavior:smooth',
'shadow-sm':'box-shadow:0 1px 2px 0 rgb(0 0 0 / .05)','shadow-lg':'box-shadow:0 10px 15px -3px rgb(0 0 0 / .1),0 4px 6px -4px rgb(0 0 0 / .1)','backdrop-blur-md':'-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)',
'transition-all':'transition:all .15s cubic-bezier(.4,0,.2,1)','transition-colors':'transition:color,background-color,border-color,fill,stroke,text-decoration-color;transition-duration:.15s;transition-timing-function:cubic-bezier(.4,0,.2,1)','transition-transform':'transition:transform .15s cubic-bezier(.4,0,.2,1)','outline-none':'outline:2px solid transparent;outline-offset:2px','break-inside-avoid':'break-inside:avoid','translate-y-0':'transform:translateY(0)','translate-y-2':'transform:translateY(.5rem)','rotate-90':'transform:rotate(90deg)'
};
function size(v){if(v==='px')return '1px';if(v==='auto')return 'auto';if(/^\d+(?:\.\d+)?$/.test(v))return Number(v)/4+'rem';if(/^\[\d+(?:\.\d+)?px\]$/.test(v))return v.slice(1,-1);throw Error('Unknown spacing '+v);}
function color(token){
 const [key,a]=token.split('/');if(!(key in palette))return null;const v=palette[key];if(!a||v==='transparent')return v;
 const alpha=a.startsWith('[')?Number(a.slice(1,-1)):Number(a)/100;if(!Number.isFinite(alpha)||alpha<0||alpha>1)throw Error('Invalid alpha '+token);
 return 'rgb('+[1,3,5].map(i=>parseInt(v.slice(i,i+2),16)).join(' ')+' / '+alpha+')';
}
function utility(u){
 if(Object.hasOwn(map,u))return [map[u],u==='hidden'?20:u.startsWith('leading-')?15:10,''];
 let m;
 if((m=u.match(/^(-?)(p|m)([xytblr]?)-(.+)$/))){
   const prop=m[2]==='p'?'padding':'margin',v=(m[1]?'-':'')+size(m[4]),sides={x:['left','right'],y:['top','bottom'],t:['top'],b:['bottom'],l:['left'],r:['right'],'':['']};
   return [sides[m[3]].map(side=>prop+(side?'-'+side:'')+':'+v).join(';'),m[3]?(m[3].length===1&&'tblr'.includes(m[3])?13:12):10,''];
 }
 if((m=u.match(/^(w|h|gap|top|right|bottom|left)-(.+)$/)))return [({w:'width',h:'height'}[m[1]]||m[1])+':'+size(m[2]),10,''];
 if((m=u.match(/^space-y-(.+)$/)))return ['margin-top:'+size(m[1]),10,' > :not([hidden]) ~ :not([hidden])'];
 if((m=u.match(/^grid-cols-(\d+)$/)))return ['grid-template-columns:repeat('+m[1]+',minmax(0,1fr))',10,''];
 if((m=u.match(/^col-span-(\d+)$/)))return ['grid-column:span '+m[1]+' / span '+m[1],10,''];
 if((m=u.match(/^z-(\d+)$/)))return ['z-index:'+m[1],10,''];
 if((m=u.match(/^opacity-(\d+)$/)))return ['opacity:'+Number(m[1])/100,10,''];
 if((m=u.match(/^duration-(\d+)$/)))return ['transition-duration:'+m[1]+'ms',20,''];
 if((m=u.match(/^text-\[(\d+(?:\.\d+)?)px\]$/)))return ['font-size:'+m[1]+'px',10,''];
 if((m=u.match(/^border(?:-([tblr]))?(?:-(\d+))?$/)))return ['border'+({t:'-top',b:'-bottom',l:'-left',r:'-right'}[m[1]]||'')+'-width:'+(m[2]||1)+'px',m[1]?12:10,''];
 if(u==='divide-y')return ['border-top-width:1px',10,' > :not([hidden]) ~ :not([hidden])'];
 if((m=u.match(/^(bg|text|border(?:-[tblr])?|accent|divide)-(.+)$/))){
   const c=color(m[2]);if(c!==null){const prop=({bg:'background-color',text:'color',border:'border-color','border-t':'border-top-color','border-b':'border-bottom-color','border-l':'border-left-color','border-r':'border-right-color',accent:'accent-color',divide:'border-color'})[m[1]];return [prop+':'+c,m[1].startsWith('border-')?14:11,m[1]==='divide'?' > :not([hidden]) ~ :not([hidden])':''];}
 }
 throw Error('Unsupported utility '+u);
}
const escapeClass=s=>s.replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c),breakpoints={sm:640,md:768,lg:1024,xl:1280};
function rule(token){
 const parts=token.split(':'),u=parts.pop(),[declarations,priority,suffix]=utility(u);let selector='.'+escapeClass(token),bp=0,variant=0;
 for(const p of parts){
   if(p in breakpoints){bp=breakpoints[p];continue;}
   if(p==='dark'){selector='.dark '+selector;variant+=10;}
   else if(p==='group-open'){selector='.group[open] '+selector;variant+=1;}
   else if(p==='selection'){selector+='::selection,'+selector+' *::selection';variant+=1;}
   else if(p==='placeholder'){selector+='::placeholder';variant+=1;}
   else if(['hover','focus','first','last'].includes(p)){selector+=':'+({first:'first-child',last:'last-child'}[p]||p);variant+=1;}
   else throw Error('Unsupported variant '+p);
 }
 return {bp,variant,priority,token,css:selector+suffix+'{'+declarations+'}'};
}
function collect(html){
 const tokens=new Set(dynamic);
 for(const m of html.matchAll(/class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\x60([^\x60]*)\x60)/g)){
   const literal=(m[1]??m[2]??m[3]).replace(/\$\{[^}]*\}/g,'');
   literal.split(/\s+/).filter(Boolean).forEach(x=>tokens.add(x));
 }
 for(const m of html.matchAll(/"classes":\s*"([^"]+)"/g))m[1].split(/\s+/).filter(Boolean).forEach(x=>tokens.add(x));
 for(const m of html.matchAll(/classList\.(add|remove|toggle|contains)\(([^)\n]*)\)/g)){
   const args=m[1]==='toggle'||m[1]==='contains'?m[2].split(',')[0]:m[2];
   for(const q of args.matchAll(/['"]([^'"]+)['"]/g))q[1].split(/\s+/).forEach(x=>tokens.add(x));
 }
 return [...tokens].filter(x=>!semantic.has(x)).sort();
}
function generate(html){
 const rules=collect(html).map(rule).sort((a,b)=>a.bp-b.bp||a.variant-b.variant||a.priority-b.priority||(a.token<b.token?-1:a.token>b.token?1:0));
 const groups=new Map();for(const r of rules){if(!groups.has(r.bp))groups.set(r.bp,[]);groups.get(r.bp).push(r.css);}
 const css=base+'\n'+[...groups].map(([bp,arr])=>bp?'@media (min-width:'+bp+'px){\n'+arr.join('\n')+'\n}':arr.join('\n')).join('\n');
 return {css,count:rules.length};
}
function embed(html){
 const {css}=generate(html),block='<style id="cat-offline-css">\n/* Generated by tools/build-offline-css.cjs. Edit the generator, not this block. */\n'+css+'\n  </style>',re=/<style id="cat-offline-css">[\s\S]*?<\/style>/;
 if(!re.test(html))throw Error('Missing embedded stylesheet marker');return html.replace(re,()=>block);
}
if(typeof module!=='undefined'){
 module.exports={generate,embed,collect};
 if(require.main===module){
   const fs=require('node:fs'),path=require('node:path'),file=path.resolve(__dirname,'../index.html'),input=fs.readFileSync(file,'utf8'),output=embed(input);
   if(process.argv.includes('--check')){if(output!==input){console.error('Embedded CSS out of date');process.exitCode=1;}else console.log('Embedded CSS is up to date ('+generate(input).count+' utilities)');}
   else{fs.writeFileSync(file,output);console.log('Embedded CSS regenerated');}
 }
}
