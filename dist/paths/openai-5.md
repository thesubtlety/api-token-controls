# OpenAI API: Legacy user API key

`openai-5` · API key / token · person. Older user-level key that can reach projects; callers select organization and project with OpenAI-Organization / OpenAI-Project headers.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Allowlist applies to API requests for the organization or project associated with the key; legacy keys not addressed specifically. |  |
| Protect: Expires automatically | No docs found | Not documented |  |
| Detect: Usage appears in logs | Yes | actor.api_key.id | Audit logs (GET /v1/organization/audit_logs): User actions and configuration changes; actor is session or api_key with key tracking id. Read with an admin key. Activation and retention not verified. |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | Yes | General API key statement: revocations take effect within a few seconds; legacy keys not named specifically. | Delete the key from the API keys page. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
No docs found.

- Network: unknown (checked at unknown). Allowlist applies to API requests for the organization or project associated with the key; legacy keys not addressed specifically.
- Lifetime: Not documented. Renewal: Replace with a project or service account key.
- Keyless option: not_verified. OpenAI docs fetched do not say whether API keys are subject to SSO or IdP conditional access.
- Conditions: Admin listing/revocation path for legacy keys not documented in fetched pages.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit logs (GET /v1/organization/audit_logs): User actions and configuration changes; actor is session or api_key with key tracking id. Read with an admin key. Activation and retention not verified.

### Fields that identify the credential
- `actor.api_key.id` (Audit logs): type user

### Lifecycle events
- revoke: `api_key.deleted` Assumed to apply; not verified for legacy keys

### Correlate on
`actor.api_key.id (tracking id)`, `actor.api_key.service_account.id`, `actor.session.ip_address`, `project_id`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/models`. Key is valid; models visible to the project Logged: unknown. Audit log covers config changes; inference/read calls not stated

### What to look for (analyst guidance)
- Key used from IP that triggers ip_not_authorized
- api_key.created by unexpected user or outside change window
- Usage spike grouped by api_key_id

## Respond: how to revoke it


Delete the key from the API keys page. Live access ends on revocation: yes. General API key statement: revocations take effect within a few seconds; legacy keys not named specifically.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Stops working when user is removed
- Admin visibility of legacy keys
- Whether API keys are subject to SSO or IdP conditional access (no statement found).
- Whether the IP allowlist covers Administration API calls made with admin keys.
- Whether audit logging must be activated and its retention period (help center pages blocked to fetch).
- Whether inference/data-read API calls (e.g. GET /v1/files) appear in the audit log; it is described as user actions and configuration changes.
- Whether deleting a service account or WIF mapping invalidates already-issued WIF tokens before expiry.
- Lifetime, listing and admin revocation of legacy user API keys.
- API key secret prefix format (not stated in fetched docs).

## Sources
- [API Overview - Authentication](https://developers.openai.com/api/reference/overview) (retrieved 2026-10-14)
- [IP allowlist](https://developers.openai.com/api/docs/guides/ip-allowlist) (retrieved 2026-10-14)
- [Production best practices - API keys](https://developers.openai.com/api/docs/guides/production-best-practices) (retrieved 2026-10-14)
- [Audit Logs reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/audit_logs) (retrieved 2026-10-14)
- [Models reference](https://developers.openai.com/api/reference/resources/models) (retrieved 2026-10-14)
