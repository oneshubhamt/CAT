'use strict';
const fs=require('node:fs'),path=require('node:path');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function writeReport(output,report){
 fs.writeFileSync(path.join(output,'layout-report.json'),JSON.stringify(report,null,2));
 const rows=report.scenarios.map(s=>{
  const images=s.evidence.filter(e=>e.kind==='screenshot').map(e=>'<figure><a href="'+esc(e.path)+'"><img loading="lazy" src="'+esc(e.path)+'" alt="'+esc(e.label)+'"></a><figcaption>'+esc(e.label)+'</figcaption></figure>').join('');
  const results=s.checks.map(c=>'<tr><td>'+esc(c.label)+'</td><td>'+esc(c.errors.length)+'</td><td>'+esc(c.warningCount)+'</td><td>'+esc(c.elementsChecked)+'</td><td>'+esc(c.contrastChecked)+'</td></tr>').join('');
  const problems=s.checks.flatMap(c=>c.errors.map(e=>c.label+': '+e.kind+' — '+e.element+' '+JSON.stringify(e.detail))).concat(s.failure?[s.failure]:[]);
  const warnings={};for(const c of s.checks)for(const [k,v] of Object.entries(c.warningCounts))warnings[k]=(warnings[k]||0)+v;
  return '<section><h2>'+esc(s.id)+' <span class="'+esc(s.status)+'">'+esc(s.status)+'</span></h2><p>'+esc(s.reason)+' · '+esc(s.engine)+' · '+esc(s.width)+'×'+esc(s.height)+' · '+esc(s.theme)+'</p>'+
   '<p>'+s.checks.length+' audits · '+s.evidence.length+' evidence files · '+esc(Math.round(s.elapsedMs/1000))+'s</p>'+
   (problems.length?'<details open><summary>Failures ('+problems.length+')</summary><pre>'+esc(problems.join('\n'))+'</pre></details>':'')+
   (Object.keys(warnings).length?'<p>Review warnings: '+esc(Object.entries(warnings).map(([k,v])=>k+' '+v).join(' · '))+'</p>':'')+
   '<details><summary>Audit details</summary><table><thead><tr><th>State</th><th>Errors</th><th>Warnings</th><th>Elements</th><th>Contrast samples</th></tr></thead><tbody>'+results+'</tbody></table></details>'+
   '<div class="gallery">'+images+'</div>'+s.evidence.filter(e=>e.kind!=='screenshot').map(e=>'<p><a href="'+esc(e.path)+'">'+esc(e.label)+'</a></p>').join('')+'</section>';
 }).join('');
 const done=report.scenarios.length,passed=report.scenarios.filter(s=>s.status==='passed').length;
 const summary=''+passed+'/'+report.planned.length+' scenarios passed · '+done+' attempted · '+(report.planned.length-done)+' not run';
 const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CAT visual QA evidence</title><style>*{box-sizing:border-box}body{font:15px/1.5 system-ui,sans-serif;margin:24px auto;padding:0 16px;max-width:1250px;background:#f6f7f9;color:#222}section{background:white;border:1px solid #ddd;border-radius:10px;padding:16px;margin:16px 0}h1,h2{line-height:1.25}h2{font-size:19px}p{overflow-wrap:anywhere}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px;margin-top:12px}figure{margin:0;border:1px solid #ddd;border-radius:6px;overflow:hidden}img{display:block;width:100%;height:240px;object-fit:contain;object-position:top;background:#e9ebee}figcaption{padding:8px;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:6px;border-bottom:1px solid #eee}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}.passed{color:#08664b}.failed{color:#a11}.running{color:#555}summary{cursor:pointer}a{color:#2746ac}</style><h1>CAT visual QA</h1><p><strong>'+esc(summary)+'</strong></p><p>'+esc(report.tier)+' · '+esc(report.commit)+' · '+esc(report.startedAt)+'</p><p>Open a screenshot for full resolution. Full-panel images cover expanded content; viewport shots cover interaction states. Layout errors fail the suite. Contrast estimates and intentional narrow desktop phases are review warnings; no pixel baseline or human visual approval is implied.</p><p><a href="layout-report.json">Machine-readable evidence</a></p>'+rows+'</html>';
 fs.writeFileSync(path.join(output,'index.html'),html);
}
module.exports={writeReport};
