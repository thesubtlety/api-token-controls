import {walls,families,principals,effects,signalLabels,signalHelp,signalColumns,signalGroups,controlsFor,gapsFor,signals,overviewRows,refsOf,missingFor} from './catalog-core.mjs';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const code=v=>`<code>${esc(v)}</code>`;
let catalog,providerOf,evidenceOf;
const ui={provider:'',query:'',sort:'exposure',dir:1};
// Tooltips use data-tip so they appear immediately on hover (CSS), not after the browser's title delay.
const chip=(s,label)=>`<span class="sig ${s.v}" tabindex="0" data-tip="${esc((s.lic?`Requires ${s.lic}. `:'')+s.why+(s.how?`\nHow: ${s.how}`:''))}">${label??signalLabels[s.v]}${s.lic?'<sup class="lic" aria-label="requires a paid plan">$</sup>':''}</span>`;
const nodocs='<span class="sig unknown">No docs found</span>';
const legacy=r=>r.lifecycle==='legacy'?' <span class="badge">legacy</span>':'';
const meta=r=>`${esc(families[r.family])} · ${esc(principals[r.principal])}`;
const loggedLabel={yes:'Logged',plan:'Conditional',no:'Not logged (vendor states)',unknown:'No docs found'};
const src=ids=>ids.map(id=>{const e=evidenceOf.get(id);return `<a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer" title="${esc(e.title)}">source</a>`;}).join(' ');
// Wall of fame and shame: four short lists of platforms, computed once.
let wallHtml;
const pct=x=>Math.round(x*100)+'%';
const wall=()=>wallHtml??=(()=>{const w=walls(catalog),tip=p=>`Controls ${pct(p.controls)} · documented ${pct(p.docs)}`;
 const group=(label,list,key)=>`<div class="wgroup"><h3>${label}</h3>${list.map(p=>`<a class="tile" href="#p/${p.id}" data-tip="${tip(p)}"><img class="ico" src="icons/${p.id}.png" alt="" width="14" height="14">${esc(providerOf.get(p.id).name)}<b>${pct(p[key])}</b></a>`).join('')}</div>`;
 return `<div class="walls"><section class="wall fame"><h2>Wall of fame</h2>${group('Best controls',w.bestControls,'controls')}${group('Best documented',w.bestDocs,'docs')}</section><section class="wall shame"><h2>Wall of shame</h2>${group('Worst controls',w.worstControls,'controls')}${group('Least documented',w.worstDocs,'docs')}</section></div>`;})();
const legend=`<p class="legend">${Object.entries(signalLabels).map(([k,v])=>`<span class="sig ${k}">${v}</span> ${esc(signalHelp[k].split(': ')[1])}`).join(' · ')} · <span class="sig yes">Yes<sup class="lic">$</sup></span> requires a paid plan or add-on (hover for which).</p>`;

const arrow=c=>ui.sort===c?(ui.dir===1?' ▲':' ▼'):'';
const th=(c,label,extra='')=>`<th${extra}><button class="sortby" data-sort="${c}" aria-sort="${ui.sort===c?(ui.dir===1?'ascending':'descending'):'none'}">${label}${arrow(c)}</button></th>`;
function overview(){
 const rows=overviewRows(catalog,ui),p=providerOf.get(ui.provider);
 return `<section class="intro"><h1>API token controls</h1><p>Whether an admin can restrict each API credential, whether its use is logged, and whether revoking it ends access. Select a credential for details and sources.</p></section>${wall()}
 <div class="controls"><div class="combo"><label for="fProvider">Platform</label><input id="fProvider" role="combobox" aria-expanded="false" aria-controls="fProviderList" autocomplete="off" placeholder="All platforms" value="${esc(p?.name??'')}"><ul id="fProviderList" role="listbox" hidden></ul></div><input id="fQuery" type="search" placeholder="Search credentials, token prefixes, log events, field names, settings" value="${esc(ui.query)}">${ui.sort!=='exposure'?'<button class="sortby reset" data-sort="exposure">Reset sort</button>':''}</div>
 ${legend}
 <div class="tablewrap"><table class="overview"><thead><tr>${th('name','Credential',' rowspan="2"')}${signalGroups.map(g=>`<th colspan="${signalColumns.filter(c=>c[2]===g).length}" class="grp">${g}</th>`).join('')}</tr><tr>${signalColumns.map(c=>th(c[0],c[1])).join('')}</tr></thead>
 <tbody>${rows.map(({r,s})=>`<tr><td><a href="#c/${r.id}"><span class="prov"><img class="ico" src="icons/${r.provider_id}.png" alt="" width="14" height="14" loading="lazy">${esc(providerOf.get(r.provider_id).name)}</span>${esc(r.name)}</a>${legacy(r)}<span class="sub">${meta(r)}</span></td>${signalColumns.map(c=>`<td>${chip(s[c[0]])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${rows.length?'':'<p>No matches.</p>'}`;
}

function controlTable(list,showApplies){
 if(!list.length)return `<p>${nodocs} No admin control found in vendor documentation.</p>`;
 return `<div class="tablewrap"><table class="ctl"><thead><tr><th>Control</th><th>Effect</th>${showApplies?'<th>Applies to</th>':''}<th>Where to set it</th><th>Plan</th><th>Default</th><th>Source</th></tr></thead><tbody>${list.map(c=>`<tr><td><b>${esc(c.name)}</b><span class="sub">${esc(c.what)}</span></td><td>${esc(effects[c.effect])}</td>${showApplies?`<td>${c.applies_to.map(id=>`<a href="#c/${id}">${esc(catalog.auth_paths.find(x=>x.id===id).name)}</a>`).join('<br>')}</td>`:''}<td>${esc(c.setting)}${c.level?`<span class="sub">${esc(c.level)} level</span>`:''}</td><td>${esc(c.plan||'All plans')}</td><td>${esc(c.default)}</td><td>${src(c.evidence_refs)}</td></tr>`).join('')}</tbody></table></div>`;
}
function gapTable(list,showPath){
 return `<div class="tablewrap"><table class="gaps"><thead><tr>${showPath?'<th>Credential</th>':''}<th>Not available</th><th>Source</th></tr></thead><tbody>${list.map(g=>`<tr>${showPath?`<td><a href="#c/${g.path_id}">${esc(catalog.auth_paths.find(r=>r.id===g.path_id).name)}</a></td>`:''}<td>${esc(g.what)}</td><td>${src(g.evidence_refs)}</td></tr>`).join('')}</tbody></table></div>`;
}
const gapsBlock=(list,showPath)=>`<h3>Not available (vendor states)</h3><p class="note">Vendor documentation says these controls do not exist.</p>${list.length?gapTable(list,showPath):'<p class="muted">None stated.</p>'}`;
const missingBlock=items=>`<h3>No vendor documentation found</h3><p class="note">We searched the vendor's documentation and found nothing either way. Test in your tenant before relying on any of these.</p>${items.length?`<ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="muted">Nothing missing.</p>'}`;

function providerPage(id){
 const p=providerOf.get(id);if(!p)return null;
 const rows=catalog.auth_paths.filter(r=>r.provider_id===id);
 return `<a class="back" href="#">← All credentials</a><h1>${esc(p.name)}</h1><p class="lede">${esc(p.scope_notes)}</p>
 <h2>API credential types (${rows.length})</h2>${legend}<div class="tablewrap"><table class="overview"><thead><tr><th>Credential</th>${signalColumns.map(c=>`<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>{const s=signals(catalog,r);return `<tr><td><a href="#c/${r.id}">${esc(r.name)}</a>${legacy(r)}<span class="sub">${meta(r)}</span></td>${signalColumns.map(c=>`<td>${chip(s[c[0]])}</td>`).join('')}</tr>`;}).join('')}</tbody></table></div>
 <h2>Admin controls (${p.controls.length})</h2>${controlTable(p.controls,true)}
 ${gapsBlock(p.no_control,true)}
 ${missingBlock((p.controls_unknown||[]))}`;
}

function credentialPage(id){
 const r=catalog.auth_paths.find(x=>x.id===id);if(!r)return null;
 const p=providerOf.get(r.provider_id),s=signals(catalog,r),i=r.incident_response,gaps=gapsFor(catalog,r),ctl=controlsFor(catalog,r);
 const list=(xs,f)=>xs.length?`<ul>${xs.map(f).join('')}</ul>`:nodocs;
 const sources=refsOf(catalog,r).map(x=>evidenceOf.get(x));
 const calls=r.post_use.calls.length?`<div class="tablewrap"><table class="calls"><thead><tr><th>Stage</th><th>API call</th><th>Logged?</th></tr></thead><tbody>${r.post_use.calls.map(c=>`<tr><td>${esc(c.stage)}${c.bulk?' <span class="badge">bulk</span>':''}</td><td>${code(c.call)}<span class="sub">${esc(c.reveals)}${c.scope?` Requires ${esc(c.scope)}.`:''}</span></td><td>${chip({v:c.logged,why:c.log_notes||''},loggedLabel[c.logged])}${c.log_event?` ${code(c.log_event)}`:''}<span class="sub">${esc(c.log_notes||'')}</span></td></tr>`).join('')}</tbody></table></div>`:`<p>${nodocs} Not yet researched for this platform.</p>`;
 return `<a class="back" href="#p/${p.id}">← ${esc(p.name)}</a><h1>${esc(r.name)}${legacy(r)}</h1><p class="lede">${esc(p.name)} · ${meta(r)}</p>
 <div class="strip">${signalColumns.map(c=>`<div><span>${c[2]} · ${c[1]}</span>${chip(s[c[0]])}<small>${esc(s[c[0]].why)}</small>${s[c[0]].how?`<p class="how"><b>How:</b> ${esc(s[c[0]].how)}</p>`:''}</div>`).join('')}</div>
 <section class="sec"><h2>Identify: can an admin see them all?</h2><dl><dt>Admin can list all of them</dt><dd>${chip(s.inventory)}<span class="sub">${esc(r.identity.inventory.details)}</span></dd></dl></section>
 <section class="sec"><h2>Protect: what an admin can configure</h2>
  <h3>Admin controls</h3>${controlTable(ctl.filter(c=>c.effect!=='revoke'),false)}
  <dl><dt>SSO and MFA rules apply</dt><dd>${chip(s.sso)}<span class="sub">${esc(r.identity.sso.details)}</span></dd>
  <dt>IP restriction</dt><dd>${esc(r.ip_restriction.status.replaceAll('_',' '))}; checked at ${esc(r.ip_restriction.enforcement_stage.replaceAll('_',' '))}<span class="sub">${esc(r.ip_restriction.boundary)}</span></dd>
  <dt>Lifetime</dt><dd>${esc(r.lifetime.summary)}<span class="sub">Renewal: ${esc(r.renewal.summary)}</span></dd>
  <dt>Federated (keyless) option</dt><dd>${esc(r.federation.status.replaceAll('_',' '))}<span class="sub">${esc(r.federation.details)}</span></dd>
  <dt>Plan and product conditions</dt><dd>${esc(r.administration.conditions)}</dd></dl>
  ${gapsBlock(gaps,false)}</section>
 <section class="sec"><h2>Detect: what gets logged</h2><dl>
  <dt>Token prefix</dt><dd>${i.token_format.prefix?code(i.token_format.prefix):nodocs}${i.token_format.notes?`<span class="sub">${esc(i.token_format.notes)}</span>`:''}</dd>
  <dt>Logs</dt><dd>${list(i.log_sources,x=>`<li><b>${esc(x.name)}</b>: ${esc(x.notes)}</li>`)}</dd>
  <dt>Fields that identify this credential</dt><dd>${list(i.credential_id_fields,x=>`<li>${code(x.field)} <span class="muted">${esc(x.log)}</span> ${esc(x.notes)}</li>`)}</dd>
  <dt>Lifecycle events</dt><dd>${list(i.lifecycle_events,x=>`<li><span class="muted">${esc(x.stage)}</span> ${code(x.event)} ${esc(x.notes)}</li>`)}</dd>
  <dt>Fields to correlate on</dt><dd>${i.correlation_keys.length?i.correlation_keys.map(code).join(' '):nodocs}</dd></dl>
  <h3>API calls a holder of this credential can make, and whether they are logged</h3>${calls}
  ${r.detections.length?`<h3>Public detection rules <span class="muted">(community rules on GitHub, not vendor documentation)</span></h3><ul>${r.detections.map(d=>`<li><a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.title)}</a> <span class="muted">${esc(d.source)}</span>: ${esc(d.detects)}</li>`).join('')}</ul>`:''}
  ${i.anomaly_cues.length?`<h3>What to look for <span class="muted">(analyst guidance, not vendor documentation)</span></h3><ul>${i.anomaly_cues.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
  ${i.sample_query?`<h3>Example query (${esc(i.sample_query.language)})</h3><p class="muted">${esc(i.sample_query.purpose)}</p><pre><code>${esc(i.sample_query.query)}</code></pre>`:''}</section>
 <section class="sec"><h2>Respond: how to revoke it</h2>
  ${ctl.some(c=>c.effect==='revoke')?`<h3>Admin revocation</h3>${controlTable(ctl.filter(c=>c.effect==='revoke'),false)}`:''}
  <dl><dt>Steps</dt><dd>${esc(i.containment.steps)||nodocs}</dd><dt>Does revocation end active access?</dt><dd>${chip(s.kill)}<span class="sub">${esc(i.containment.notes)}</span></dd>
  <dt>Stops working when user is removed</dt><dd>${chip(s.offboard)}<span class="sub">${esc(r.identity.offboard.details)}</span></dd></dl></section>
 <section class="sec"><h2>Gaps in this record</h2>${missingBlock(missingFor(catalog,r))}</section>
 <details class="sources"><summary>All sources (${sources.length})</summary><ol>${sources.map(e=>`<li><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.title)}</a> <span class="muted">retrieved ${esc(e.retrieved_at)}</span></li>`).join('')}</ol></details>
 <p class="muted">Also available as <a href="paths/${r.id}.md">Markdown</a> and <a href="paths/${r.id}.json">JSON</a>. ID ${code(r.id)}.</p>`;
}


// Fuzzy match: every typed character appears in order; earlier, tighter matches rank first.
function fuzzy(q,text){
 q=q.toLowerCase();text=text.toLowerCase();if(!q)return 0;
 const at=text.indexOf(q);if(at>=0)return at;
 let i=0,score=100,last=-1;for(const ch of q){const j=text.indexOf(ch,last+1);if(j<0)return null;score+=j-last-1;last=j;i++;}
 return score;
}
function wireOverview(){
 const redraw=keepFocus=>{const pos=$('fQuery').selectionStart;$('app').innerHTML=overview();wireOverview();if(keepFocus){$('fQuery').focus();$('fQuery').setSelectionRange(pos,pos);}};
 const box=$('fProvider'),list=$('fProviderList');let opts=[],active=0;
 const choose=id=>{ui.provider=id;redraw(false);};
 const render=()=>{
  const q=box.value.trim(),all=[{id:'',name:'All platforms'},...[...catalog.providers].sort((a,b)=>a.name.localeCompare(b.name))];
  opts=q&&q!==providerOf.get(ui.provider)?.name?all.filter(p=>p.id).map(p=>[p,fuzzy(q,p.name+' '+p.id)]).filter(x=>x[1]!==null).sort((a,b)=>a[1]-b[1]).map(x=>x[0]):all;
  active=Math.min(active,Math.max(0,opts.length-1));
  list.innerHTML=opts.map((p,i)=>`<li role="option" data-id="${p.id}" aria-selected="${i===active}">${esc(p.name)}</li>`).join('')||'<li class="muted">No platform matches</li>';
  list.hidden=false;box.setAttribute('aria-expanded','true');list.children[active]?.scrollIntoView({block:'nearest'});
 };
 box.onfocus=()=>{box.select();active=0;render();};
 box.oninput=()=>{active=0;render();};
 box.onkeydown=e=>{
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)render();active=(active+(e.key==='ArrowDown'?1:-1)+opts.length)%opts.length;render();}
  else if(e.key==='Enter'){e.preventDefault();if(opts[active])choose(opts[active].id);}
  else if(e.key==='Escape'){box.value=providerOf.get(ui.provider)?.name??'';list.hidden=true;box.blur();}
 };
 list.onmousedown=e=>{const li=e.target.closest('li[data-id]');if(li){e.preventDefault();choose(li.dataset.id);}};
 box.onblur=()=>{list.hidden=true;box.setAttribute('aria-expanded','false');box.value=providerOf.get(ui.provider)?.name??'';};
 for(const b of document.querySelectorAll('.sortby'))b.onclick=()=>{const c=b.dataset.sort;if(c==='exposure'){ui.sort='exposure';ui.dir=1;}else if(ui.sort!==c){ui.sort=c;ui.dir=1;}else ui.dir=-ui.dir;redraw(false);};
 $('fQuery').oninput=e=>{ui.query=e.target.value;redraw(true);};
}
function route(){
 const h=decodeURIComponent(location.hash.slice(1));
 const html=h.startsWith('c/')?credentialPage(h.slice(2)):h.startsWith('p/')?providerPage(h.slice(2)):null;
 $('app').innerHTML=html??overview();if(!html)wireOverview();scrollTo(0,0);
}
// One shared tooltip, shown immediately on hover or focus and positioned against the viewport so tables cannot clip it.
const tip=document.createElement('div');tip.id='tip';tip.hidden=true;document.body.append(tip);
const showTip=el=>{const t=el.dataset.tip;if(!t){tip.hidden=true;return;}tip.textContent=t;tip.hidden=false;const b=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;tip.style.left=Math.max(8,Math.min(b.left,innerWidth-w-8))+'px';tip.style.top=(b.bottom+h+12>innerHeight?b.top-h-6:b.bottom+6)+'px';};
for(const ev of ['mouseover','focusin'])document.addEventListener(ev,e=>{const el=e.target.closest?.('[data-tip]');if(el)showTip(el);else tip.hidden=true;});
document.addEventListener('scroll',()=>{tip.hidden=true;},true);
try{
 const res=await fetch('./catalog.json');if(!res.ok)throw new Error('Catalog unavailable');catalog=await res.json();
 providerOf=new Map(catalog.providers.map(p=>[p.id,p]));evidenceOf=new Map(catalog.evidence.map(e=>[e.id,e]));
 addEventListener('hashchange',route);route();
}catch(err){$('app').innerHTML='<h1>The catalog could not load</h1><p>Serve this folder over HTTP and reload.</p>';console.error(err);}
