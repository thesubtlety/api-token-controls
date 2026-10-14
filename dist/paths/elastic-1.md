# Elastic Cloud: Elastic Cloud API key

`elastic-1` · API key / token · service. Org-owned key sent as 'Authorization: ApiKey' to api.elastic-cloud.com. Manages org, deployments and projects; on Serverless can optionally reach Elasticsearch/Kibana APIs; on ECH no Elasticsearch/Kibana access.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Organization > API keys; organization owners can view and revoke all keys in the organization. | Organization > API keys; organization owners can view and revoke all keys in the organization. |
| Protect: Admin can block or require approval | Yes | Organization owner / manage workload credentials (Cloud role permission) | Organization owner / manage workload credentials (Cloud role permission): Organization > Members > role assignment |
| Protect: SSO and MFA rules apply | Not available | Elastic recommends keeping an org-owner Cloud API key to turn off SSO enforcement if the IdP fails, so keys keep working under enforced SSO. |  |
| Protect: IP restriction | No docs found | IP filters apply to deployment/project traffic; no documented IP restriction for the Elastic Cloud API itself. |  |
| Protect: Expires automatically | Yes | Default 3 months; up to 1 year or Never | API key expiration (Elastic Cloud): Organization > API keys > Create API key > Expiration |
| Detect: Usage appears in logs | Yes | elastic_govcloud.org_audit.api_key.* | Where: Kibana (destination deployment) > [Elastic GovCloud] Organization Audit Logs dashboard; filter elastic_govcloud.org_audit.api_key.id · API: POST /api/v1/organizations/{org_id}/audit_logs {"deployment_id": "...", "index": "logs-elastic_govcloud.org_audit-default"} to enable delivery |
| Detect: Data reads appear in logs | Conditional | POST /api/v1/deployments/{deployment_id}/elasticsearch/{ref_id}/_reset-password | Where: Discover on logs-elastic_govcloud.org_audit-*: filter elastic_govcloud.org_audit.api_key.id and http.request.method (every Cloud API call is logged) |
| Respond: Revocation ends active access | No docs found | Also rotate any 'elastic' passwords or ES keys the Cloud key could have created. |  |
| Respond: Stops working when user is removed | N/A | The key belongs to the organization and keeps working after its creator leaves, until it expires or is revoked. |  |

## Protect: what an admin can configure

### Admin controls
- **API key expiration (Elastic Cloud)** (Limit lifetime; all plans; default on). Key expires after a preset or date up to one year, or never. Where: Organization > API keys > Create API key > Expiration.
- **Roles on Cloud API keys** (Limit scope; all plans; default varies). Org-level, cloud resource and connected cluster roles limit what the key can do; Cloud-API-only access is default on Serverless. Where: Create API key > Roles.
- **Organization owner / manage workload credentials (Cloud role permission)** (Disable; all plans; default varies). Only organization owners and users who can manage workload credentials can create Cloud API keys; withholding these roles blocks creation. Where: Organization > Members > role assignment.

- Network: unknown (checked at unknown). IP filters apply to deployment/project traffic; no documented IP restriction for the Elastic Cloud API itself.
- Lifetime: Default 3 months; up to 1 year or Never. Renewal: Same key reused until expiry; create a new key to rotate.
- Keyless option: not_verified. Docs recommend keeping an org-owner Cloud API key to disable SSO enforcement in an emergency, implying keys work while SSO is enforced. Keys survive the creator leaving.
- Conditions: Non-owners can assign only roles they hold.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Elastic Cloud audit trail: FedRAMP Moderate only; Platinum/Enterprise; delivered to logs-elastic_govcloud.org_audit-* in a deployment you own; no backfill.

### Fields that identify the credential
- `elastic_govcloud.org_audit.api_key.*` (Elastic Cloud audit trail): API key fields mapped by the integration

### Lifecycle events
No docs found.

### Correlate on
`api_key_id`, `organization id`, `deployment id`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/v1/account`. Current account Logged: plan. Only on FedRAMP Moderate audit trail
- discovery: `GET /api/v1/organizations`. Organizations Logged: plan. 
- enumeration (bulk): `GET /api/v1/deployments`. Deployments Logged: plan. 
- enumeration (bulk): `GET /api/v1/users/auth/keys`. Visible API keys Logged: plan. 
- collection: `POST /api/v1/deployments/{deployment_id}/elasticsearch/{ref_id}/_reset-password`. New 'elastic' superuser password, giving data access Logged: plan. 

### What to look for (analyst guidance)
- Keys with expiration Never
- Org-owner keys created by non-admins
- Calls to _reset-password on deployments
- Keys whose creator left the org

## Respond: how to revoke it
- Admin: **Revoke Cloud API key**. Deletes the key. Where: Organization > API keys > trash icon; DELETE /api/v1/users/auth/keys/{api_key_id}.

Revoke in Organization > API keys or DELETE /api/v1/users/auth/keys/{api_key_id}; bulk via DELETE /api/v1/users/auth/keys. Live access ends on revocation: unknown. Also rotate any 'elastic' passwords or ES keys the Cloud key could have created.

## No vendor documentation found
- IP restriction
- Revocation ends active access
- Exact event names for key create/delete
- Any audit outside FedRAMP Moderate
- Rate limits
- IP restriction for the Elastic Cloud API (api.elastic-cloud.com) used with Cloud API keys.
- Whether an org can block creation of Cloud API keys with no expiry (Never).
- Org-level audit log of Cloud API key creation/use outside FedRAMP Moderate.
- Whether ES API keys owned by a SAML user stop working when the user is removed in the IdP.
- Whether xpack.security.authc.api_key.enabled can be set in ECH user settings.
- Whether Cloud API key revocation affects in-flight requests.

## Sources
- [Elastic Cloud API keys](https://www.elastic.co/docs/deploy-manage/api-keys/elastic-cloud-api-keys) (retrieved 2026-10-14)
- [Configure Elastic Cloud SAML single sign-on](https://www.elastic.co/docs/deploy-manage/users-roles/cloud-organization/configure-saml-authentication) (retrieved 2026-10-14)
- [Manage IP filters in ECH or Serverless](https://www.elastic.co/docs/deploy-manage/security/ip-filtering-cloud) (retrieved 2026-10-14)
- [Elastic Cloud audit trail](https://www.elastic.co/docs/deploy-manage/monitor/log-delivery/cloud-audit-trail) (retrieved 2026-10-14)
- [Elastic GovCloud Integration](https://www.elastic.co/docs/reference/integrations/elastic_govcloud) (retrieved 2026-10-14)
- [Elastic Cloud API (OpenAPI)](https://www.elastic.co/docs/api/doc/cloud.json) (retrieved 2026-10-14)
- [Elastic Cloud audit trail](https://www.elastic.co/docs/deploy-manage/monitor/cloud-audit-trail) (retrieved 2026-10-14)
