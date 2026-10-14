# OpenAI API: Service account API key

`openai-2` · API key / token · service. Bearer key for a project-owned non-human service account. Key scopes can narrow but not exceed the service account's project role.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /v1/organization/projects/{project_id}/service_accounts lists service accounts and GET /v1/organization/projects/{project_id}/api_keys lists keys including service-account-owned ones. | GET /v1/organization/projects/{project_id}/service_accounts lists service accounts and GET /v1/organization/projects/{project_id}/api_keys lists keys including service-account-owned ones. |
| Protect: Admin can block or require approval | Yes | API Key Governance | API Key Governance: Platform settings > API Key Governance |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Same org/project allowlist as other API keys; applies at API request time. | IP allowlist: Settings > Security > IP allowlist |
| Protect: Expires automatically | Partial | expires_at optional; org/project max lifetime policy applies to new keys | Maximum API key lifetime: Platform settings (organization/general) |
| Detect: Usage appears in logs | Yes | actor.api_key.id, api_key_id, actor.api_key.service_account.id | Audit logs (GET /v1/organization/audit_logs): User actions and configuration changes; actor is session or api_key with key tracking id. Read with an admin key. Activation and retention not verified. · Usage API (GET /v1/organization/usage/*): Aggregated usage groupable by api_key_id; not per-request. Old pre-Dec-2023 keys may be untracked. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Yes | Key revocation takes effect within a few seconds; service account deletion effect on live keys assumed but not stated. | Delete the key, or delete the service account. |
| Respond: Stops working when user is removed | N/A | Key is owned by a project service account, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **API Key Governance** (Disable; all plans; default unknown). Allow only service-account keys, only user-owned project keys, or disable all new API key creation at org or project level. Where: Platform settings > API Key Governance.
- **Maximum API key lifetime** (Limit lifetime; all plans; default unknown). New keys must expire within the configured limit; project limit cannot exceed org limit. Where: Platform settings (organization/general).
- **IP allowlist** (Limit network; all plans; default off). Reject API requests from IPs outside up to 50 addresses/CIDRs; org or project level. Where: Settings > Security > IP allowlist.
- **API key permissions (scopes)** (Limit scope; all plans; default varies). Key permissions are intersected with the owner's project role. Where: Key create/edit.

- Network: supported (checked at api_request). Same org/project allowlist as other API keys; applies at API request time.
- Lifetime: expires_at optional; org/project max lifetime policy applies to new keys. Renewal: Create a new key via the admin endpoint and delete the old one; value shown once.
- Keyless option: not_applicable. Static key; the same service account can instead use workload identity federation (openai-4).
- Conditions: Deleting the service account removes it; existing keys unaffected by governance changes.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit logs (GET /v1/organization/audit_logs): User actions and configuration changes; actor is session or api_key with key tracking id. Read with an admin key. Activation and retention not verified.
- Usage API (GET /v1/organization/usage/*): Aggregated usage groupable by api_key_id; not per-request. Old pre-Dec-2023 keys may be untracked.

### Fields that identify the credential
- `actor.api_key.id` (Audit logs): Tracking id of the API key used
- `api_key_id` (Usage API): When group_by=api_key_id
- `actor.api_key.service_account.id` (Audit logs): Service account behind the key

### Lifecycle events
- create: `service_account.created` 
- create: `api_key.created` 
- revoke: `api_key.deleted` 
- revoke: `service_account.deleted` 

### Correlate on
`actor.api_key.id (tracking id)`, `actor.api_key.service_account.id`, `actor.session.ip_address`, `project_id`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/models`. Key is valid; models visible to the project Logged: unknown. Audit log covers config changes; inference/read calls not stated
- collection (bulk): `GET /v1/files then GET /v1/files/{file_id}/content`. Uploaded files (fine-tuning, batch, assistants data) Logged: unknown. Not listed as an audit event

### Public detection rules (community, not vendor documentation)
- [OpenAI Anomalous API Key Activity](https://github.com/panther-labs/panther-analysis/blob/develop/rules/openai_rules/openai_api_key_anomalous_activity.yml) (Panther): An OpenAI API key was created or updated with elevated scopes (all, admin, models:write, organization:write, api_keys:write).

### What to look for (analyst guidance)
- Key used from IP that triggers ip_not_authorized
- api_key.created by unexpected user or outside change window
- Usage spike grouped by api_key_id

## Respond: how to revoke it
- Admin: **Delete project API key**. Admin deletes a project key; takes effect within a few seconds. Where: DELETE /v1/organization/projects/{project_id}/api_keys/{api_key_id}.
- Admin: **Delete project service account**. Removes the service account identity. Where: DELETE /v1/organization/projects/{project_id}/service_accounts/{service_account_id}.

Delete the key, or delete the service account. Live access ends on revocation: yes. Key revocation takes effect within a few seconds; service account deletion effect on live keys assumed but not stated.

## No vendor documentation found
- SSO and MFA rules apply
- Data reads appear in logs
- Whether API keys are subject to SSO or IdP conditional access (no statement found).
- Whether the IP allowlist covers Administration API calls made with admin keys.
- Whether audit logging must be activated and its retention period (help center pages blocked to fetch).
- Whether inference/data-read API calls (e.g. GET /v1/files) appear in the audit log; it is described as user actions and configuration changes.
- Whether deleting a service account or WIF mapping invalidates already-issued WIF tokens before expiry.
- Lifetime, listing and admin revocation of legacy user API keys.
- API key secret prefix format (not stated in fetched docs).

## Sources
- [Service Accounts reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/service_accounts) (retrieved 2026-10-14)
- [Manage service accounts with Terraform](https://developers.openai.com/api/docs/guides/terraform/service-accounts) (retrieved 2026-10-14)
- [Workload identity federation](https://developers.openai.com/api/docs/guides/workload-identity-federation) (retrieved 2026-10-14)
- [IP allowlist](https://developers.openai.com/api/docs/guides/ip-allowlist) (retrieved 2026-10-14)
- [Production best practices - API keys](https://developers.openai.com/api/docs/guides/production-best-practices) (retrieved 2026-10-14)
- [List project API keys](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/api_keys/methods/list) (retrieved 2026-10-14)
- [List project service accounts](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/service_accounts/methods/list) (retrieved 2026-10-14)
- [API Overview - Authentication](https://developers.openai.com/api/reference/overview) (retrieved 2026-10-14)
- [Project API Keys reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/api_keys) (retrieved 2026-10-14)
- [Audit Logs reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/audit_logs) (retrieved 2026-10-14)
- [List audit logs](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/audit_logs/methods/list) (retrieved 2026-10-14)
- [Models reference](https://developers.openai.com/api/reference/resources/models) (retrieved 2026-10-14)
- [Files reference](https://developers.openai.com/api/reference/resources/files) (retrieved 2026-10-14)
- [Manage permissions in the OpenAI platform](https://developers.openai.com/api/docs/guides/rbac) (retrieved 2026-10-14)
