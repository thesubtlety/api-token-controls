// Shared logic for the site, build and tests. Each credential is judged on nine questions,
// grouped by NIST CSF 2.0 function: Identify, Protect, Detect, Respond.
export const families={oauth:'OAuth',api_key:'API key / token',pat:'Personal access token',jwt:'Signed JWT',federation:'Federated identity',basic:'Basic credentials',job_token:'Job token',hmac:'HMAC',webhook:'Webhook secret',ssh_key:'SSH key',certificate:'X.509 certificate'};
export const principals={user:'person',service:'service',user_or_service:'person or service'};
export const effects={revoke:'Revoke',disable:'Disable',require_approval:'Require approval',limit_scope:'Limit scope',limit_resources:'Limit resources',limit_network:'Limit network',limit_lifetime:'Limit lifetime',require_sso:'Require SSO',require_rotation:'Require rotation',other:'Other'};
export const signalLabels={yes:'Yes',plan:'Conditional',partial:'Partial',no:'Not available',unknown:'No docs found',na:'N/A'};
export const signalColumns=[
 ['inventory','Admin can list all of them','Identify'],
 ['disable','Admin can block or require approval','Protect'],
 ['sso','SSO and MFA rules apply','Protect'],
 ['network','IP restriction','Protect'],
 ['expiry','Expires automatically','Protect'],
 ['usage','Usage appears in logs','Detect'],
 ['reads','Data reads appear in logs','Detect'],
 ['kill','Revocation ends active access','Respond'],
 ['offboard','Stops working when user is removed','Respond']];
export const signalGroups=[...new Set(signalColumns.map(c=>c[2]))];
export const signalHelp={yes:'Yes: vendor documentation confirms it.',plan:'Conditional: depends on configuration, an add-on or a narrower case; see details.',partial:'Partial: available with limits.',no:'Not available: vendor documentation states it is not available.',unknown:'No docs found: vendor documentation does not say either way.',na:'N/A: not tied to a user account.'};
// Everything this review searched for and did not find, per credential.
export function missingFor(catalog,r){
 const s=signals(catalog,r),p=catalog.providers.find(x=>x.id===r.provider_id),out=[];
 for(const [k,label] of signalColumns.map(c=>[c[0],c[1]]))if(s[k].v==='unknown')out.push(label);
 for(const x of [...r.incident_response.unknown,...r.post_use.unknown,...(p.controls_unknown||[])])if(!out.includes(x))out.push(x);
 return out;
}

// A control's plan field names a paid plan or add-on unless it says all plans or is a non-licensing note.
export const isLicensed=plan=>!!plan&&!/^(all\b|not established|not stated|unknown|self-hosted|us and eu|requires cloudflare|must be enabled|aws organizations|aws control tower|plugin)/i.test(plan);
// Plan names when every control behind an answer needs a paid plan; null when any works on all plans.
const licenseOf=list=>list.length&&list.every(c=>isLicensed(c.plan))?[...new Set(list.map(c=>c.plan))].join('; '):null;
export const controlsFor=(catalog,r)=>catalog.providers.find(p=>p.id===r.provider_id).controls.filter(c=>c.applies_to.includes(r.id));
// Documented absences are filed under the question they answer.
export const gapKind=g=>g.kind??(/expir|lifetime|rotat|idle/i.test(g.what)?'expiry':/\bip\b|zone|network|allow ?list/i.test(g.what)?'network':/disabl|turn off|block|prevent|switch|creat|restrict/i.test(g.what)?'disable':/revok|still work|remain|keep working|until (they )?expire/i.test(g.what)?'kill':'other');
export const gapsFor=(catalog,r)=>catalog.providers.find(p=>p.id===r.provider_id).no_control.filter(n=>n.path_id===r.id);

const steps=list=>list.filter(c=>c.setting).map(c=>`${c.name}: ${c.setting}`).join(' · ');
export const howText=h=>[h.ui&&`Where: ${h.ui}`,h.api&&`API: ${h.api}`,h.cli&&`Command: ${h.cli}`].filter(Boolean).join(' · ');
export function signals(catalog,r){
 const ctl=controlsFor(catalog,r),gaps=gapsFor(catalog,r).filter(g=>gapKind(g)==='disable');
 const gate=ctl.filter(c=>['disable','require_approval'].includes(c.effect));
 const disable=gate.length?{v:'yes',lic:licenseOf(gate),why:gate.map(c=>c.name).join('; ')}
  :gaps.length?{v:'no',why:gaps.map(g=>g.what).join('; ')}:{v:'unknown',why:'No documented control found.'};
 const ip=r.ip_restriction,netCtl=ctl.filter(c=>c.effect==='limit_network');
 const network=ip.status==='supported'&&ip.enforcement_stage!=='login_only'?{v:'yes',why:ip.boundary}
  :ip.status==='conditional'||netCtl.length?{v:'plan',lic:licenseOf(netCtl),why:ip.boundary}
  :['excluded','not_supported'].includes(ip.status)||(ip.status!=='unknown'&&ip.enforcement_stage==='login_only')?{v:'no',why:ip.boundary}:{v:'unknown',why:ip.boundary};
 const b=r.lifetime.basis,capCtl=ctl.filter(c=>c.effect==='limit_lifetime'||c.effect==='require_rotation');
 const expiry=['absolute','job'].includes(b)?{v:'yes',why:r.lifetime.summary}
  :['none','inactivity'].includes(b)?{v:capCtl.length?'partial':'no',lic:licenseOf(capCtl),why:r.lifetime.summary+(capCtl.length?` Admin control: ${capCtl.map(c=>c.name).join('; ')}.`:'')}
  :b==='policy'?{v:'partial',why:r.lifetime.summary}:{v:'unknown',why:r.lifetime.summary};
 const ir=r.incident_response;
 // A vendor statement that use is not logged overrides fields that only appear on lifecycle events.
 const usage=ir.use_not_logged?{v:'no',why:ir.use_not_logged.notes}:ir.credential_id_fields.length?{v:'yes',why:ir.credential_id_fields.map(f=>f.field).join(', ')}
  :ir.log_sources.length?{v:'partial',why:'Log source documented; no field identifies the credential.'}:{v:'unknown',why:'No log source found.'};
 const reads=r.post_use.calls.filter(c=>c.stage==='collection');
 const readSig=!reads.length?{v:'unknown',why:r.post_use.calls.length?'No collection call researched.':'Not researched.'}
  :reads.some(c=>c.logged==='yes')?{v:'yes',why:reads.filter(c=>c.logged==='yes').map(c=>c.log_event||c.call).join('; ')}
  :reads.some(c=>c.logged==='plan')?{v:'plan',why:reads.filter(c=>c.logged==='plan').map(c=>c.log_notes||c.call).join('; ')}
  :reads.some(c=>c.logged==='no')?{v:'no',why:reads.filter(c=>c.logged==='no').map(c=>c.log_notes||c.call).join('; ')}:{v:'unknown',why:'Vendor docs neither confirm nor deny.'};
 const k=ir.containment.kills_existing;
 const kill={v:k==='yes'?'yes':k==='partial'?'partial':k==='no'?'no':'unknown',why:ir.containment.notes||ir.containment.steps||'Not established.'};
 const idm={yes:'yes',no:'no',partial:'partial',not_applicable:'na',unknown:'unknown'},id=x=>({v:idm[x.status],why:x.details||'No vendor documentation found.'});
 const {sso,offboard,inventory}=r.identity;
 const out={inventory:id(inventory),disable,sso:id(sso),network,expiry,usage,reads:readSig,kill,offboard:id(offboard)};
 // How to act on each answer. Researched steps win; otherwise the step comes from the controls, logs or containment data.
 const derived={inventory:inventory.details,disable:steps(gate),network:steps(netCtl),expiry:steps(capCtl),
  usage:ir.log_sources.map(x=>x.notes?`${x.name}: ${x.notes}`:x.name).join(' · '),
  reads:reads.filter(c=>c.log_event&&['yes','plan'].includes(c.logged)).map(c=>`Look for ${c.log_event}`).join(' · '),kill:ir.containment.steps};
 for(const [k,x] of Object.entries(out))x.how=['yes','plan','partial'].includes(x.v)?(r.how?.[k]?howText(r.how[k]):derived[k]||null):null;
 return out;
}
const weight={no:3,unknown:1,plan:1,partial:1,yes:0,na:0};
export const exposure=s=>Object.values(s).reduce((n,x)=>n+weight[x.v]+(x.v==='yes'&&x.lic?1:0),0);

export function searchText(catalog,r){
 const p=catalog.providers.find(x=>x.id===r.provider_id),i=r.incident_response;
 return [p.name,r.name,r.family,r.principal,i.token_format.prefix,...controlsFor(catalog,r).map(c=>c.name),...i.log_sources.map(x=>x.name),...i.credential_id_fields.map(x=>x.field),...i.lifecycle_events.map(x=>x.event),...r.post_use.calls.flatMap(c=>[c.call,c.log_event])].filter(Boolean).join(' ').toLowerCase();
}
// Column sort order, worst first. A licensed Yes ranks just below a plain Yes.
const rank={no:0,unknown:1,partial:2,plan:3,na:3.5,yes:4},rankOf=x=>rank[x.v]-(x.lic?0.5:0);
export function overviewRows(catalog,{provider='',query='',sort='exposure',dir=1}={}){
 const q=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 const rows=catalog.auth_paths.filter(r=>(!provider||r.provider_id===provider)&&q.every(t=>searchText(catalog,r).includes(t))).map(r=>{const s=signals(catalog,r);return {r,s,score:exposure(s)};});
 const name=x=>catalog.providers.find(p=>p.id===x.r.provider_id).name+' '+x.r.name;
 const cmp=sort==='exposure'?(a,b)=>b.score-a.score:sort==='name'?()=>0:(a,b)=>rankOf(a.s[sort])-rankOf(b.s[sort]);
 return rows.sort((a,b)=>dir*(cmp(a,b)||name(a).localeCompare(name(b))));
}

export function duration(seconds){
 for(const [n,u] of [[31536000,'year'],[86400,'day'],[3600,'hour'],[60,'minute']])if(seconds>=n&&seconds%n===0){const v=seconds/n;return `${v} ${u}${v===1?'':'s'}`;}
 return `${seconds} seconds`;
}
const loggedRank={no:0,unknown:1,plan:2,yes:3},stageOrder=['recon','discovery','enumeration','collection'];
export const postUseRows=(catalog,rows=catalog.auth_paths)=>rows.flatMap(r=>r.post_use.calls.map(c=>({id:r.id,provider_id:r.provider_id,name:r.name,...c}))).sort((a,b)=>loggedRank[a.logged]-loggedRank[b.logged]||stageOrder.indexOf(a.stage)-stageOrder.indexOf(b.stage)||(b.bulk-a.bulk)||a.id.localeCompare(b.id));

export function refsOf(catalog,r){
 const sections=['authentication','federation','ip_restriction','lifetime','renewal','administration'];
 return [...new Set([...sections.flatMap(k=>r[k].evidence_refs),...Object.values(r.identity).flatMap(x=>x.evidence_refs),...Object.values(r.how||{}).flatMap(x=>x.evidence_refs),...r.incident_response.evidence_refs,...r.post_use.evidence_refs,...controlsFor(catalog,r).flatMap(c=>c.evidence_refs),...gapsFor(catalog,r).flatMap(g=>g.evidence_refs)])];
}
// A self-contained subset: the chosen paths, their providers (controls trimmed to those paths) and cited evidence.
export function exportSubset(catalog,rows){
 const ids=new Set(rows.map(r=>r.id));
 const providers=catalog.providers.filter(p=>rows.some(r=>r.provider_id===p.id)).map(p=>({...p,controls:p.controls.filter(c=>c.applies_to.some(id=>ids.has(id))),no_control:p.no_control.filter(n=>ids.has(n.path_id))}));
 const sub={...catalog,providers,auth_paths:rows};
 const refs=new Set(rows.flatMap(r=>refsOf(sub,r)));
 return {...sub,evidence:catalog.evidence.filter(e=>refs.has(e.id))};
}
// Wall of fame and shame, per platform, current credentials only. Controls score: Yes = 1, Conditional or
// Partial = 0.5, Not available = 0, averaged over answered cells; only platforms with at least 70% of cells
// answered are rated. Documentation score: share of cells answered (not "No docs found").
const points={yes:1,plan:0.5,partial:0.5,no:0};
export function walls(catalog,n=3){
 const by={};
 for(const r of catalog.auth_paths){
  if(r.lifecycle==='legacy')continue;
  const p=by[r.provider_id]??={id:r.provider_id,cells:0,known:0,pts:0};
  for(const x of Object.values(signals(catalog,r))){if(x.v==='na')continue;p.cells++;if(x.v!=='unknown'){p.known++;p.pts+=points[x.v];}}
 }
 const ps=Object.values(by).map(p=>({id:p.id,controls:p.pts/p.known,docs:p.known/p.cells}));
 const rated=ps.filter(p=>p.docs>=0.7),top=(xs,f)=>[...xs].sort(f).slice(0,n);
 return {bestControls:top(rated,(a,b)=>b.controls-a.controls),worstControls:top(rated,(a,b)=>a.controls-b.controls),
  bestDocs:top(ps,(a,b)=>b.docs-a.docs||b.controls-a.controls),worstDocs:top(ps,(a,b)=>a.docs-b.docs)};
}
