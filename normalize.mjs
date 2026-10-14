import fs from 'node:fs/promises';
import {writeReadable} from './readable.mjs';
// Builds dist/ from research/: one file per platform (research/platforms/<id>.json) and a shared source index.
const sources=JSON.parse(await fs.readFile('research/sources.json','utf8'));
const files=(await fs.readdir('research/platforms')).filter(f=>f.endsWith('.json')).sort();
const platforms=await Promise.all(files.map(async f=>JSON.parse(await fs.readFile(`research/platforms/${f}`,'utf8'))));
const keys=['oauth','api_key','pat','jwt','federation','basic','job_token','hmac','webhook','ssh_key','certificate'];
const sections=['authentication','federation','ip_restriction','lifetime','renewal','administration'];
// Every evidence reference a credential or control cites.
const refsOfPath=r=>[...sections.flatMap(k=>r[k].evidence_refs),...r.incident_response.evidence_refs,...r.post_use.evidence_refs,
 ...Object.values(r.how).flatMap(x=>x.evidence_refs),...Object.values(r.identity).flatMap(x=>x.evidence_refs)];
const providers=[],paths=[],used=new Set();
for(const [i,p] of platforms.entries()){
 if(`${p.id}.json`!==files[i])throw new Error(`${files[i]}: id ${p.id} does not match file name`);
 const {credentials,...provider}=p;
 for(const r of credentials){
  if(!r.id.startsWith(`${p.id}-`))throw new Error(`${p.id}: credential id ${r.id} must start with ${p.id}-`);
  paths.push({id:r.id,provider_id:p.id,...r});
 }
 const ids=new Set(credentials.map(r=>r.id));
 for(const c of provider.controls)for(const id of c.applies_to)if(!ids.has(id))throw new Error(`${p.id} control "${c.name}" names unknown credential ${id}`);
 for(const g of provider.no_control)if(!ids.has(g.path_id))throw new Error(`${p.id} gap names unknown credential ${g.path_id}`);
 providers.push(provider);
}
if(new Set(paths.map(r=>r.id)).size!==paths.length)throw new Error('Duplicate credential id');
for(const r of paths)for(const id of refsOfPath(r))used.add(id);
for(const p of providers)for(const c of [...p.controls,...p.no_control])for(const id of c.evidence_refs)used.add(id);
for(const id of used)if(!sources[id]?.url)throw new Error(`Missing source ${id}`);
const evidence=[...used].sort().map(id=>({id,...sources[id],type:'vendor_documentation'}));
const catalog={schema_version:'2.0.0',title:'API Token Controls',as_of:'2026-10-09',updated:'2026-10-14',
 scope:'Admin controls, logging and revocation for API credentials on SaaS platforms. Sourced from vendor documentation; not an audit of any tenant.',
 definitions:{supported:'Documented for this credential.',conditional:'Documented, with plan, policy or endpoint conditions.',excluded:'The named control explicitly does not cover this credential.',not_supported:'Vendor documentation states this credential lacks the control.',unknown:'No source found either way. Not a negative finding.',not_verified:'No source found either way. Not a negative finding.',not_applicable:'Does not apply to this credential.',limited:'Documented for a narrower case only.'},
 providers,auth_paths:paths,evidence};
const str={type:'string'},strs={type:'array',items:str},refs={type:'array',items:str};
const schema={$schema:'https://json-schema.org/draft/2020-12/schema',title:'API Token Controls v2',type:'object',required:['schema_version','as_of','providers','auth_paths','evidence'],properties:{
 schema_version:{const:'2.0.0'},as_of:{type:'string',format:'date'},
 evidence:{type:'array',items:{type:'object',required:['id','url','title','retrieved_at']}},
 providers:{type:'array',items:{type:'object',required:['id','name','controls','no_control'],properties:{controls:{type:'array',items:{type:'object',required:['name','effect','applies_to','what','setting','default','evidence_refs'],properties:{effect:{enum:['revoke','disable','require_approval','limit_scope','limit_resources','limit_network','limit_lifetime','require_sso','require_rotation','other']},applies_to:strs,plan:{type:['string','null']},default:{enum:['on','off','varies','unknown']},evidence_refs:refs}}},no_control:{type:'array',items:{type:'object',required:['path_id','what','kind','evidence_refs'],properties:{kind:{enum:['disable','network','expiry','kill','other']}}}}}}},
 auth_paths:{type:'array',items:{type:'object',required:['id','provider_id','name','family','principal','lifecycle','ip_restriction','lifetime','renewal','identity','incident_response','post_use'],properties:{
  family:{enum:keys},principal:{enum:['user','service','user_or_service']},lifecycle:{enum:['current','legacy']},
  federation:{type:'object',properties:{status:{enum:['supported','limited','not_verified','not_applicable','not_supported']}}},
  ip_restriction:{type:'object',properties:{status:{enum:['supported','conditional','excluded','unknown','not_supported']},enforcement_stage:{enum:['api_request','token_issuance','login_only','mixed','unknown']}}},
  lifetime:{type:'object',properties:{basis:{enum:['absolute','inactivity','none','policy','unknown','job']},default_seconds:{type:['number','null']},maximum_seconds:{type:['number','null']}}},
  identity:{type:'object',required:['sso','offboard','inventory'],properties:{sso:{type:'object',properties:{status:{enum:['yes','no','partial','unknown']}}},offboard:{type:'object',properties:{status:{enum:['yes','no','partial','not_applicable','unknown']}}},inventory:{type:'object',properties:{status:{enum:['yes','no','partial','unknown']}}}}},
  incident_response:{type:'object',required:['log_sources','credential_id_fields','lifecycle_events','containment','evidence_refs'],properties:{containment:{type:'object',properties:{kills_existing:{enum:['yes','no','partial','unknown']}}}}},
  post_use:{type:'object',required:['calls','evidence_refs'],properties:{calls:{type:'array',items:{type:'object',required:['stage','call','logged'],properties:{stage:{enum:['recon','discovery','enumeration','collection']},logged:{enum:['yes','no','plan','unknown']}}}}}}}}}}};
await fs.mkdir('dist',{recursive:true});
await fs.writeFile('dist/catalog.json',JSON.stringify(catalog,null,2));
await fs.writeFile('dist/catalog.schema.json',JSON.stringify(schema,null,2));
await writeReadable(catalog);
console.log(`Built ${paths.length} credentials on ${providers.length} platforms from ${evidence.length} sources.`);
