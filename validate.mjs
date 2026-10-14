import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {walls,isLicensed,gapKind,signals,signalColumns,overviewRows,controlsFor,exportSubset,refsOf,postUseRows} from './dist/catalog-core.mjs';
const c=JSON.parse(await fs.readFile('dist/catalog.json','utf8'));
const ev=new Set(c.evidence.map(e=>e.id)),pids=new Set(c.providers.map(p=>p.id));

// Shape and references.
assert.equal(c.schema_version,'2.0.0');assert(c.providers.length&&c.auth_paths.length);
assert.equal(new Set(c.auth_paths.map(r=>r.id)).size,c.auth_paths.length);
for(const r of c.auth_paths){
 assert(pids.has(r.provider_id));
 for(const id of refsOf(c,r))assert(ev.has(id),`${r.id} cites missing ${id}`);
 const i=r.incident_response;
 assert(['yes','no','partial','unknown'].includes(i.containment.kills_existing));
 if(i.credential_id_fields.length||i.lifecycle_events.length)assert(i.evidence_refs.length,`${r.id} names log fields without sources`);
 assert(!('sample_event' in i),'illustrative samples are not published');assert(!('pattern' in i.token_format),'derived regexes are not published');
 if(r.post_use.calls.length)assert(r.post_use.evidence_refs.length,`${r.id} post-use lacks sources`);
 for(const x of r.post_use.calls){assert(['recon','discovery','enumeration','collection'].includes(x.stage));assert(['yes','no','plan','unknown'].includes(x.logged));}
}
for(const p of c.providers){
 for(const x of p.controls){assert(['revoke','disable','require_approval','limit_scope','limit_resources','limit_network','limit_lifetime','require_sso','require_rotation','other'].includes(x.effect));assert(x.evidence_refs.length,`${p.id} control "${x.name}" lacks a source`);for(const id of x.applies_to)assert(c.auth_paths.some(r=>r.id===id&&r.provider_id===p.id),`${p.id} control names ${id}`);}
 for(const n of p.no_control)assert(n.evidence_refs.length&&c.auth_paths.some(r=>r.id===n.path_id&&r.provider_id===p.id));
}
const cited=new Set([...c.auth_paths.flatMap(r=>refsOf(c,r))]);
assert.equal(cited.size,c.evidence.length,'every evidence record is cited');

// Signals: "no" only from documented absence; unknown never upgraded or downgraded.
for(const r of c.auth_paths){
 const s=signals(c,r);
 for(const [k] of signalColumns)assert(['yes','plan','partial','no','unknown','na'].includes(s[k].v),`${r.id}.${k}`);
 if(s.disable.v==='no')assert(c.providers.find(p=>p.id===r.provider_id).no_control.some(n=>n.path_id===r.id&&gapKind(n)==='disable'),`${r.id} disable=no without a cited absence`);
 if(r.ip_restriction.status==='unknown')assert(s.network.v!=='no'&&s.network.v!=='yes'||controlsFor(c,r).some(x=>x.effect==='limit_network'),`${r.id} network from unknown`);
 if(s.network.v==='no')assert(['excluded','not_supported'].includes(r.ip_restriction.status)||r.ip_restriction.enforcement_stage==='login_only');
 if(s.reads.v==='no')assert(r.post_use.calls.some(x=>x.stage==='collection'&&x.logged==='no'));
 if(s.disable.lic)assert(controlsFor(c,r).filter(x=>['disable','require_approval'].includes(x.effect)).every(x=>isLicensed(x.plan)),`${r.id} licensed Yes with a free control`);
 if(s.kill.v!=='unknown')assert.equal(s.kill.v,r.incident_response.containment.kills_existing);
 for(const d of r.detections)assert(/^https:\/\/github\.com\//.test(d.url)&&d.title&&d.detects,`${r.id} detection rule`);
 for(const [k,x] of Object.entries(r.how))assert(signalColumns.some(c=>c[0]===k)&&(x.ui||x.api||x.cli)&&x.evidence_refs.length,`${r.id}.how.${k}`);
 if(s.usage.v==='no')assert(r.incident_response.use_not_logged?.evidence_refs.length,`${r.id} usage no needs a source`);
 // SSO, offboarding and inventory answers other than unknown must cite a source.
 for(const [k,x] of Object.entries(r.identity))assert(x.status==='unknown'||x.evidence_refs.length,`${r.id}.identity.${k} has no source`);
}
for(const k of signalColumns.map(x=>x[0])){const o=overviewRows(c,{sort:k}),rk={no:0,unknown:1,partial:2,plan:3,na:3.5,yes:4};assert(o.every((x,i)=>!i||rk[o[i-1].s[k].v]<=rk[x.s[k].v]),`sort by ${k}`);}
const ov=overviewRows(c);assert(ov.every((x,k)=>!k||ov[k-1].score>=x.score),'overview sorted worst first');
assert.deepEqual(overviewRows(c,{query:'ghp_'}).map(x=>x.r.id),['github-1']);
assert(overviewRows(c,{provider:'okta'}).every(x=>x.r.provider_id==='okta'));

// Generated files match the catalog.
for(const r of c.auth_paths){
 const md=await fs.readFile(`dist/paths/${r.id}.md`,'utf8');assert(md.includes(`\`${r.id}\``));
 for(const id of refsOf(c,r))assert(md.includes(c.evidence.find(e=>e.id===id).url),`${r.id}.md missing a source`);
 const sub=JSON.parse(await fs.readFile(`dist/paths/${r.id}.json`,'utf8'));assert.deepEqual(sub,JSON.parse(JSON.stringify(exportSubset(c,[r]))));
 for(const id of sub.auth_paths.flatMap(x=>refsOf(sub,x)))assert(sub.evidence.some(e=>e.id===id),`${r.id}.json not self-contained`);
}
assert.equal((await fs.readdir('dist/paths')).length,c.auth_paths.length*2);
const llms=await fs.readFile('dist/llms.txt','utf8');for(const m of llms.matchAll(/\]\(([^)]+)\)/g))await fs.access('dist/'+m[1]);
for(const [f,n] of [['overview.csv',c.auth_paths.length],['containment.csv',c.auth_paths.length],['post-use.csv',postUseRows(c).length],['controls.csv',c.providers.reduce((k,p)=>k+p.controls.length,0)]]){const t=await fs.readFile('dist/'+f,'utf8');assert(t.split('\n')[0].includes(','),f);assert(t.trim().split('\n').length-1>=n,f);}
for(const f of ['index.html','app.js','style.css','catalog-core.mjs','catalog.schema.json'])await fs.access('dist/'+f);
console.log(`Validated ${c.auth_paths.length} credentials, ${c.providers.reduce((k,p)=>k+p.controls.length,0)} admin controls, ${postUseRows(c).length} post-use calls, ${c.evidence.length} sources, and ${c.auth_paths.length*2} generated files.`);

// Wall of fame and shame: three platforms per list, sorted, controls lists only rate well-documented platforms.
{const w=walls(c);for(const k in w)assert.equal(w[k].length,3,k);
 assert(w.bestControls[0].controls>=w.bestControls[2].controls&&w.worstControls[0].controls<=w.worstControls[2].controls);
 assert([...w.bestControls,...w.worstControls].every(p=>p.docs>=0.7));assert(w.worstDocs[0].docs<=w.bestDocs[2].docs);}
