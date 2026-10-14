# OpenAI API: Project API key (user-owned)

`openai-1` · API key / token · person. Static secret created in a project and sent as a bearer token. It acts for its owning user; its scopes are checked against the user's project role.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin API GET /v1/organization/projects/{project_id}/api_keys lists keys per project (owner_project_access=any includes keys whose owner lost access); iterate over projects. | Admin API GET /v1/organization/projects/{project_id}/api_keys lists keys per project (owner_project_access=any includes keys whose owner lost access); iterate over projects. |
| Protect: Admin can block or require approval | Yes | API Key Governance | API Key Governance: Platform settings > API Key Governance |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Org or project IP allowlist applies to API requests made with the key. Does not cover dashboard sign-in. Changes take up to 15 minutes. | IP allowlist: Settings > Security > IP allowlist |
| Protect: Expires automatically | Partial | Optional expiry per key; admins can cap max lifetime per org/project | Maximum API key lifetime: Platform settings (organization/general) |
| Detect: Usage appears in logs | Yes | actor.api_key.id, api_key_id | Audit logs (GET /v1/organization/audit_logs): User actions and configuration changes; actor is session or api_key with key tracking id. Read with an admin key. Activation and retention not verified. · Usage API (GET /v1/organization/usage/*): Aggregated usage groupable by api_key_id; not per-request. Old pre-Dec-2023 keys may be untracked. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Yes | Revocations take effect within a few seconds. | Delete the key in the dashboard or DELETE /v1/organization/projects/{project_id}/api_keys/{api_key_id}. |
| Respond: Stops working when user is removed | Yes | Requests with a user-owned project key also require the owning user to hold a project role with the same permissions, so removing the user removes the key's effective access; the key record stays listed as owner access 'inactive' until deleted, and role changes take up to 30 minutes to propagate. | Where: API Platform settings > People > Members > Remove > Confirm removal; project only: project Members page · API: DELETE /organization/users/{user_id}; DELETE /organization/projects/{project_id}/users/{user_id} |

## Protect: what an admin can configure

### Admin controls
- **API Key Governance** (Disable; all plans; default unknown). Allow only service-account keys, only user-owned project keys, or disable all new API key creation at org or project level. Where: Platform settings > API Key Governance.
- **Maximum API key lifetime** (Limit lifetime; all plans; default unknown). New keys must expire within the configured limit; project limit cannot exceed org limit. Where: Platform settings (organization/general).
- **IP allowlist** (Limit network; all plans; default off). Reject API requests from IPs outside up to 50 addresses/CIDRs; org or project level. Where: Settings > Security > IP allowlist.
- **Project API Keys permission (RBAC)** (Other; all plans; default on). Custom-role-eligible permission that lets a user manage their own API keys; assign roles without it to limit who can create keys. Where: Organization/Project settings > Roles.
- **API key permissions (scopes)** (Limit scope; all plans; default varies). Key permissions are intersected with the owner's project role. Where: Key create/edit.

- Network: supported (checked at api_request). Org or project IP allowlist applies to API requests made with the key. Does not cover dashboard sign-in. Changes take up to 15 minutes.
- Lifetime: Optional expiry per key; admins can cap max lifetime per org/project. Renewal: Create a replacement key and revoke the old one; full value shown only once.
- Keyless option: not_verified. OpenAI docs fetched do not say whether API keys are subject to SSO or IdP conditional access.
- Conditions: Governance only affects new keys. If the owner loses project access the key reports owner_project_access inactive.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit logs (GET /v1/organization/audit_logs): User actions and configuration changes; actor is session or api_key with key tracking id. Read with an admin key. Activation and retention not verified.
- Usage API (GET /v1/organization/usage/*): Aggregated usage groupable by api_key_id; not per-request. Old pre-Dec-2023 keys may be untracked.

### Fields that identify the credential
- `actor.api_key.id` (Audit logs): Tracking id of the API key used
- `api_key_id` (Usage API): When group_by=api_key_id

### Lifecycle events
- create: `api_key.created` data.scopes lists allowed scopes
- update: `api_key.updated` 
- revoke: `api_key.deleted` 
- create: `tenant.project_api_key.created` Tenant-level variant; semantics not described

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

Delete the key in the dashboard or DELETE /v1/organization/projects/{project_id}/api_keys/{api_key_id}. Live access ends on revocation: yes. Revocations take effect within a few seconds.

## No vendor documentation found
- SSO and MFA rules apply
- Data reads appear in logs
- Whether individual inference requests are logged anywhere customer-visible
- Per-request access logs for customers
- Whether API keys are subject to SSO or IdP conditional access (no statement found).
- Whether the IP allowlist covers Administration API calls made with admin keys.
- Whether audit logging must be activated and its retention period (help center pages blocked to fetch).
- Whether inference/data-read API calls (e.g. GET /v1/files) appear in the audit log; it is described as user actions and configuration changes.
- Whether deleting a service account or WIF mapping invalidates already-issued WIF tokens before expiry.
- Lifetime, listing and admin revocation of legacy user API keys.
- API key secret prefix format (not stated in fetched docs).

## Sources
- [API Overview - Authentication](https://developers.openai.com/api/reference/overview) (retrieved 2026-10-14)
- [Manage permissions in the OpenAI platform](https://developers.openai.com/api/docs/guides/rbac) (retrieved 2026-10-14)
- [IP allowlist](https://developers.openai.com/api/docs/guides/ip-allowlist) (retrieved 2026-10-14)
- [Production best practices - API keys](https://developers.openai.com/api/docs/guides/production-best-practices) (retrieved 2026-10-14)
- [Project API Keys reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/api_keys) (retrieved 2026-10-14)
- [Manage service accounts with Terraform](https://developers.openai.com/api/docs/guides/terraform/service-accounts) (retrieved 2026-10-14)
- [List project API keys](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/api_keys/methods/list) (retrieved 2026-10-14)
- [Managing members in an API organization](https://help.openai.com/en/articles/4936812-how-do-i-add-change-or-remove-members-on-my-openai-api-account) (retrieved 2026-10-14)
- [Delete user](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/users/methods/delete) (retrieved 2026-10-14)
- [Delete project user](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/users/methods/delete) (retrieved 2026-10-14)
- [Audit Logs reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/audit_logs) (retrieved 2026-10-14)
- [List audit logs](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/audit_logs/methods/list) (retrieved 2026-10-14)
- [Usage reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage) (retrieved 2026-10-14)
- [Models reference](https://developers.openai.com/api/reference/resources/models) (retrieved 2026-10-14)
- [Files reference](https://developers.openai.com/api/reference/resources/files) (retrieved 2026-10-14)
