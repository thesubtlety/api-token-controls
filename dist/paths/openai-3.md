# OpenAI API: Admin API key

`openai-3` · API key / token · person. Organization-level key used only for Administration API endpoints (users, projects, keys, audit logs). Owned by an org owner.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /v1/organization/admin_api_keys lists organization admin API keys. | GET /v1/organization/admin_api_keys lists organization admin API keys. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | IP allowlist covers API requests; docs do not say explicitly whether Administration API calls with admin keys are included. |  |
| Protect: Expires automatically | Yes | Optional expires_in_seconds at creation; no expiry if omitted | API: POST /organization/admin_api_keys with expires_in_seconds (max 31536000); check expires_at via GET /organization/admin_api_keys/{key_id} |
| Detect: Usage appears in logs | Yes | actor.api_key.id | Audit logs (GET /v1/organization/audit_logs): User actions and configuration changes; actor is session or api_key with key tracking id. Read with an admin key. Activation and retention not verified. |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | Yes | Docs state API key revocation takes effect within a few seconds; the statement is for API keys in general, not admin keys specifically. Keys are per-request bearer secrets with no derived tokens. | Delete via dashboard admin-keys page or DELETE /v1/organization/admin_api_keys/{key_id}. |
| Respond: Stops working when user is removed | Partial | Help center says demoting an owner can invalidate their admin API keys; it does not say what happens when the owner is removed entirely, and 'can' is not a guarantee. | Where: API Platform settings > People > Members > Roles (demote owner) or Remove · API: DELETE /organization/users/{user_id} |

## Protect: what an admin can configure

### Admin controls
No docs found.

- Network: unknown (checked at unknown). IP allowlist covers API requests; docs do not say explicitly whether Administration API calls with admin keys are included.
- Lifetime: Optional expires_in_seconds at creation; no expiry if omitted. Renewal: Create a new admin key and delete the old one.
- Keyless option: not_applicable. Workload identity tokens cannot call Admin API endpoints; an admin key is required.
- Conditions: Whether the max-lifetime policy applies to admin keys is not stated.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit logs (GET /v1/organization/audit_logs): User actions and configuration changes; actor is session or api_key with key tracking id. Read with an admin key. Activation and retention not verified.

### Fields that identify the credential
- `actor.api_key.id` (Audit logs): Tracking id

### Lifecycle events
- create: `tenant.admin_api_key.created` Also .updated and .deleted

### Correlate on
`actor.api_key.id (tracking id)`, `actor.api_key.service_account.id`, `actor.session.ip_address`, `project_id`

### API calls a holder can make, and whether they are logged
- discovery (bulk): `GET /v1/organization/users`. All org users and roles Logged: unknown. 
- enumeration (bulk): `GET /v1/organization/audit_logs`. Org activity history, key ids, IPs Logged: unknown. 
- enumeration (bulk): `GET /v1/organization/projects/{project_id}/api_keys`. Keys, owners, last_used_at Logged: unknown. 

### What to look for (analyst guidance)
- Key used from IP that triggers ip_not_authorized
- api_key.created by unexpected user or outside change window
- Usage spike grouped by api_key_id

## Respond: how to revoke it
- Admin: **Delete admin API key**. Deletes an admin key. Where: DELETE /v1/organization/admin_api_keys/{key_id}.

Delete via dashboard admin-keys page or DELETE /v1/organization/admin_api_keys/{key_id}. Live access ends on revocation: yes. Docs state API key revocation takes effect within a few seconds; the statement is for API keys in general, not admin keys specifically. Keys are per-request bearer secrets with no derived tokens.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Whether admin key reads (list users, list audit logs) are themselves logged
- Whether admin-key read calls are logged
- Whether API keys are subject to SSO or IdP conditional access (no statement found).
- Whether the IP allowlist covers Administration API calls made with admin keys.
- Whether audit logging must be activated and its retention period (help center pages blocked to fetch).
- Whether inference/data-read API calls (e.g. GET /v1/files) appear in the audit log; it is described as user actions and configuration changes.
- Whether deleting a service account or WIF mapping invalidates already-issued WIF tokens before expiry.
- Lifetime, listing and admin revocation of legacy user API keys.
- API key secret prefix format (not stated in fetched docs).

## Sources
- [Admin APIs](https://developers.openai.com/api/docs/guides/admin-apis) (retrieved 2026-10-14)
- [Admin API Keys reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/admin_api_keys) (retrieved 2026-10-14)
- [Workload identity token exchange reference](https://developers.openai.com/api/reference/workload-identity-federation) (retrieved 2026-10-14)
- [IP allowlist](https://developers.openai.com/api/docs/guides/ip-allowlist) (retrieved 2026-10-14)
- [Create admin API key](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/admin_api_keys/methods/create) (retrieved 2026-10-14)
- [Manage permissions in the OpenAI platform](https://developers.openai.com/api/docs/guides/rbac) (retrieved 2026-10-14)
- [Managing members in an API organization](https://help.openai.com/en/articles/4936812-managing-members-in-an-api-organization) (retrieved 2026-10-14)
- [List admin API keys](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/admin_api_keys/methods/list) (retrieved 2026-10-14)
- [OpenAI OpenAPI spec (AdminApiKey schema)](https://github.com/openai/openai-openapi/blob/main/openapi.yaml) (retrieved 2026-10-14)
- [Managing members in an API organization](https://help.openai.com/en/articles/4936812-how-do-i-add-change-or-remove-members-on-my-openai-api-account) (retrieved 2026-10-14)
- [Delete user](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/users/methods/delete) (retrieved 2026-10-14)
- [Audit Logs reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/audit_logs) (retrieved 2026-10-14)
- [API Overview - Authentication](https://developers.openai.com/api/reference/overview) (retrieved 2026-10-14)
- [Users reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/users) (retrieved 2026-10-14)
- [Project API Keys reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/api_keys) (retrieved 2026-10-14)
