'use strict';
// Optional comparison of two actual, completed evidence runs. No golden files
// are created automatically. Compare matching engine/version/profile/state only.
// npm install --no-save pngjs@7.0.0 pixelmatch@5.3.0
const fs=require('node:fs'),path=require('node:path');
const {PNG}=require('pngjs'),pixelmatch=require('pixelmatch');
const args=process.argv.slice(2),strict=args.includes('--strict'),dirs=args.filter(x=>x!=='--strict');
if(dirs.length!==2)throw Error('Usage: node tests/visual-compare.cjs BASELINE_DIR CURRENT_DIR [--strict]');
const [base,current]=dirs.map(x=>path.resolve(x)),ratio=Number(process.env.CAT_DIFF_RATIO??0.005);
if(!Number.isFinite(ratio)||ratio<0||ratio>1)throw Error('CAT_DIFF_RATIO must be in [0,1]');
const read=dir=>JSON.parse(fs.readFileSync(path.join(dir,'layout-report.json'),'utf8'));
const a=read(base),b=read(current);
if(a.platform!==b.platform||a.arch!==b.arch)throw Error('Compare runs from the same OS and architecture');
const result={baseline:a.commit,current:b.commit,threshold:ratio,comparisons:[],unmatched:[]};
const dir=path.join(current,'diffs');fs.mkdirSync(dir,{recursive:true});
const keys=s=>new Map(s.evidence.filter(e=>e.kind==='screenshot'&&!e.label.startsWith('failure-')&&!e.label.includes('toast')).map(e=>[e.label,e]));
const safePath=(root,rel)=>{const target=path.resolve(root,rel);if(!target.startsWith(root+path.sep))throw Error('Invalid evidence path');return target;};
for(const next of b.scenarios){
 const old=a.scenarios.find(s=>s.id===next.id);
 if(!old||old.status!=='passed'||next.status!=='passed'||old.engine!==next.engine||old.browserVersion!==next.browserVersion||old.width!==next.width||old.height!==next.height||old.theme!==next.theme){result.unmatched.push({scenario:next.id,reason:'No matching successful engine/version/profile'});continue;}
 const prev=keys(old),now=keys(next);
 for(const [label,e] of now){
  const prior=prev.get(label);
  if(!prior){result.unmatched.push({scenario:next.id,label,reason:'New screenshot'});continue;}
  const x=PNG.sync.read(fs.readFileSync(safePath(base,prior.path))),y=PNG.sync.read(fs.readFileSync(safePath(current,e.path)));
  if(x.width!==y.width||x.height!==y.height){result.comparisons.push({scenario:next.id,label,status:'dimensions-changed',old:[x.width,x.height],current:[y.width,y.height]});continue;}
  const diff=new PNG({width:x.width,height:x.height});
  const pixels=pixelmatch(x.data,y.data,diff.data,x.width,x.height,{threshold:0.1,includeAA:false});
  const fraction=pixels/(x.width*x.height),status=fraction>ratio?'changed':'within-threshold';
  const item={scenario:next.id,label,pixels,fraction,status};
  if(status==='changed'){
   const name=(next.id+'-'+label).replace(/[^a-zA-Z0-9_-]/g,'_')+'.png';
   fs.writeFileSync(path.join(dir,name),PNG.sync.write(diff));item.diff='diffs/'+name;
  }
  result.comparisons.push(item);
 }
 for(const label of prev.keys())if(!now.has(label))result.unmatched.push({scenario:next.id,label,reason:'Missing screenshot'});
}
for(const old of a.scenarios)if(!b.scenarios.some(s=>s.id===old.id))result.unmatched.push({scenario:old.id,reason:'Scenario not present in current run'});
const changes=result.comparisons.filter(x=>x.status!=='within-threshold').length;
fs.writeFileSync(path.join(current,'visual-diff.json'),JSON.stringify(result,null,2));
console.log(result.comparisons.length+' compared; '+changes+' changed; '+result.unmatched.length+' unmatched. Review visual-diff.json and diff images.');
if(strict&&(changes||result.unmatched.length||!result.comparisons.length))process.exitCode=1;
