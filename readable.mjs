// Writes the files models and people read from the published site:
// one Markdown + JSON file per credential, CSV tables and llms.txt.
import fs from 'node:fs/promises';
import {families,principals,effects,signalLabels,signalColumns,controlsFor,gapsFor,signals,overviewRows,postUseRows,refsOf,exportSubset,missingFor} from './dist/catalog-core.mjs';

const cell=v=>{const s=String(v??'');return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;};
const csv=(header,rows)=>[header,...rows].map(r=>r.map(cell).join(',')).join('\n')+'\n';
const list=(xs,f,none='No docs found.')=>xs.length?xs.map(x=>`- ${f(x)}`).join('\n'):none;

function markdown(c,r){
 const p=c.providers.find(x=>x.id===r.provider_id),i=r.incident_response,s=signals(c,r),ev=new Map(c.evidence.map(e=>[e.id,e]));
 return `# ${p.name}: ${r.name}

\`${r.id}\` · ${families[r.family]} · ${principals[r.principal]}${r.lifecycle==='legacy'?' · legacy':''}. ${r.authentication.summary}

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
${signalColumns.map(([k,label,group])=>`| ${group}: ${label} | ${signalLabels[s[k].v]}${s[k].lic?` (requires ${s[k].lic})`:''} | ${s[k].why.replaceAll('|','/').replaceAll('\n',' ')} | ${(s[k].how||'').replaceAll('|','/').replaceAll('\n',' ')} |`).join('\n')}

## Protect: what an admin can configure

### Admin controls
${list(controlsFor(c,r).filter(x=>x.effect!=='revoke'),x=>`**${x.name}** (${effects[x.effect]}; ${x.plan||'all plans'}; default ${x.default}). ${x.what} Where: ${x.setting}.`,'No docs found.')}
${gapsFor(c,r).length?`\n### Not available (vendor states)\n${list(gapsFor(c,r),g=>g.what)}\n`:''}
- Network: ${r.ip_restriction.status} (checked at ${r.ip_restriction.enforcement_stage}). ${r.ip_restriction.boundary}
- Lifetime: ${r.lifetime.summary}. Renewal: ${r.renewal.summary}
- Keyless option: ${r.federation.status}. ${r.federation.details}
- Conditions: ${r.administration.conditions}

## Detect: what gets logged
- Token prefix: ${i.token_format.prefix?`\`${i.token_format.prefix}\``:'not established'}

### Logs
${list(i.log_sources,x=>`${x.name}: ${x.notes}`)}

### Fields that identify the credential
${list(i.credential_id_fields,x=>`\`${x.field}\` (${x.log}): ${x.notes}`)}

### Lifecycle events
${list(i.lifecycle_events,x=>`${x.stage}: \`${x.event}\` ${x.notes}`)}

### Correlate on
${i.correlation_keys.length?i.correlation_keys.map(k=>`\`${k}\``).join(', '):'No docs found.'}

### API calls a holder can make, and whether they are logged
${r.post_use.calls.length?list(r.post_use.calls,x=>`${x.stage}${x.bulk?' (bulk)':''}: \`${x.call}\`. ${x.reveals} Logged: ${x.logged}${x.log_event?` (\`${x.log_event}\`)`:''}. ${x.log_notes||''}`):'Not researched for this platform yet.'}
${r.detections.length?`\n### Public detection rules (community, not vendor documentation)\n${list(r.detections,d=>`[${d.title}](${d.url}) (${d.source}): ${d.detects}`)}\n`:''}${i.anomaly_cues.length?`\n### What to look for (analyst guidance)\n${list(i.anomaly_cues,x=>x)}\n`:''}${i.sample_query?`\n### Sample query (${i.sample_query.language})\n${i.sample_query.purpose}\n\n\`\`\`\n${i.sample_query.query}\n\`\`\`\n`:''}
## Respond: how to revoke it
${controlsFor(c,r).filter(x=>x.effect==='revoke').map(x=>`- Admin: **${x.name}**. ${x.what} Where: ${x.setting}.`).join('\n')}

${i.containment.steps||'No docs found.'} Live access ends on revocation: ${i.containment.kills_existing}. ${i.containment.notes}

## No vendor documentation found
${missingFor(c,r).map(x=>`- ${x}`).join('\n')||'Nothing missing.'}

## Sources
${refsOf(c,r).map(id=>`- [${ev.get(id).title}](${ev.get(id).url}) (retrieved ${ev.get(id).retrieved_at})`).join('\n')}
`;
}

export async function writeReadable(c){
 await fs.rm('dist/paths',{recursive:true,force:true});await fs.mkdir('dist/paths');
 for(const r of c.auth_paths){
  await fs.writeFile(`dist/paths/${r.id}.json`,JSON.stringify(exportSubset(c,[r]),null,2));
  await fs.writeFile(`dist/paths/${r.id}.md`,markdown(c,r));
 }
 await fs.writeFile('dist/overview.csv',csv(['path_id','provider','credential','family','principal',...signalColumns.map(x=>x[0]),...signalColumns.map(x=>x[0]+'_how'),'requires_license','exposure_score'],overviewRows(c).map(({r,s,score})=>[r.id,c.providers.find(p=>p.id===r.provider_id).name,r.name,r.family,r.principal,...signalColumns.map(x=>s[x[0]].v),...signalColumns.map(x=>s[x[0]].how||''),signalColumns.filter(x=>s[x[0]].lic).map(x=>`${x[0]}: ${s[x[0]].lic}`).join('; '),score])));
 await fs.writeFile('dist/controls.csv',csv(['provider_id','control','effect','applies_to','what','setting','plan','default','level'],c.providers.flatMap(p=>p.controls.map(x=>[p.id,x.name,x.effect,x.applies_to.join(' '),x.what,x.setting,x.plan,x.default,x.level]))));
 await fs.writeFile('dist/containment.csv',csv(['path_id','provider_id','credential','kills_existing','steps','notes'],c.auth_paths.map(r=>[r.id,r.provider_id,r.name,r.incident_response.containment.kills_existing,r.incident_response.containment.steps,r.incident_response.containment.notes])));
 await fs.writeFile('dist/post-use.csv',csv(['path_id','provider_id','credential','stage','call','reveals','bulk','scope','logged','log_event','log_notes'],postUseRows(c).map(x=>[x.id,x.provider_id,x.name,x.stage,x.call,x.reveals,x.bulk,x.scope,x.logged,x.log_event,x.log_notes])));
 const index=c.providers.map(p=>`### ${p.name}\n${c.auth_paths.filter(r=>r.provider_id===p.id).map(r=>`- [${r.name}](paths/${r.id}.md) \`${r.id}\``).join('\n')}`).join('\n\n');
 await fs.writeFile('dist/llms.txt',`# API Token Controls

> ${c.scope}

Nine questions per credential, grouped by NIST CSF 2.0 function. Identify: an admin can list all of them. Protect: an admin can block it or require approval; SSO and MFA rules apply; IP restriction; expires automatically. Detect: usage appears in logs; data reads appear in logs. Respond: revocation ends active access; stops working when the user is removed. Values: yes (overview.csv requires_license names the paid plan when every control behind a yes needs one); conditional (depends on configuration, an add-on or a narrower case); partial; not available (vendor documentation states it, with a source); no docs found (vendor documentation does not say either way; not a negative finding). Every fact cites vendor documentation; hunting cues are analyst guidance.

## Data
- [overview.csv](overview.csv): the nine answers for every credential, fewest controls first. Each column ending in _how gives the step to act on the answer: where in the admin console, the API call and the command.
- [controls.csv](controls.csv): every admin control, where to set it, plan and default.
- [containment.csv](containment.csv): how to revoke each credential and whether live access ends.
- [post-use.csv](post-use.csv): calls a credential holder can make, from whoami to bulk export, and whether each is logged.
- [catalog.json](catalog.json): everything, with sources. Schema: [catalog.schema.json](catalog.schema.json).

## Credentials
${index}
`);
}
