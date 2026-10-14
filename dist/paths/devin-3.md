# Devin: Legacy API keys (Personal apk_user_ / Service apk_)

`devin-3` · API key / token · person or service. Deprecated keys for the v1 and v2 APIs, still accepted during the deprecation period. Scoped to an (org_id, user_id) pair; no RBAC.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /v2/enterprise/api-keys lists legacy API keys across all orgs in the enterprise (needs an enterprise admin personal API key). | GET /v2/enterprise/api-keys lists legacy API keys across all orgs in the enterprise (needs an enterprise admin personal API key). |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Enterprise IP access list covers Devin APIs. | IP Access Lists: /v3/enterprise/ip-access-list (ManageIPWhitelist) |
| Protect: Expires automatically | No docs found | Not documented |  |
| Detect: Usage appears in logs | Yes | user_id | API: GET /v3/enterprise/audit-logs; filter results on user_id / user_email |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | DELETE /v2/enterprise/api-keys/{api_key_id} or revoke in Settings > API Keys. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **IP Access Lists** (Limit network; Enterprise; default off). Only allowed CIDRs can reach Devin APIs and webapp. Where: /v3/enterprise/ip-access-list (ManageIPWhitelist).

### Not available (vendor states)
- Legacy keys do not support RBAC.

- Network: supported (checked at api_request). Enterprise IP access list covers Devin APIs.
- Lifetime: Not documented. Renewal: Generate a new key in legacy settings; migrate to v3.
- Keyless option: not_applicable. Static key.
- Conditions: v2 key endpoints need an enterprise admin personal API key.

## Detect: what gets logged
- Token prefix: `apk_user_ / apk_`

### Logs
- Audit logs API: 

### Fields that identify the credential
- `user_id` (audit log): 

### Lifecycle events
- create: `create_user_api_key` 
- create: `create_org_api_key` 
- create: `create_service_api_key` 
- revoke: `revoke_enterprise_api_key` 
- revoke: `revoke_all_enterprise_api_keys` 

### Correlate on
`user_id`, `org_id`

### API calls a holder can make, and whether they are logged
- collection (bulk): `GET /v1/sessions`. Org sessions Logged: unknown. 

### What to look for (analyst guidance)
- view_user_api_key / view_org_api_key events
- Any legacy key use after v3 migration

## Respond: how to revoke it
- Admin: **Revoke API Key (v2)**. Revokes an enterprise legacy key. Where: DELETE /v2/enterprise/api-keys/{api_key_id}.

DELETE /v2/enterprise/api-keys/{api_key_id} or revoke in Settings > API Keys. Live access ends on revocation: unknown. 

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- Expiry
- Whether API tokens are blocked when SSO is enforced or bypass IdP conditional access (not stated)
- Inbound workload federation for the Devin API (audit actions exist, no guide found)
- Where the static service user key policy is set in the UI
- Audit log retention period
- Whether read calls (list sessions, list knowledge) are audited
- Legacy key expiry and whether a v3 setting disables them
- Whether revoking a service user key ends access immediately

## Sources
- [Authentication | Devin Docs](https://docs.devin.ai/api-reference/authentication) (retrieved 2026-10-14)
- [v1 API Overview (Legacy)](https://docs.devin.ai/api-reference/v1/overview) (retrieved 2026-10-14)
- [IP Access Lists | Devin Docs](https://docs.devin.ai/enterprise/security-access/ip-access-lists) (retrieved 2026-10-14)
- [Devin MCP | Devin Docs](https://docs.devin.ai/work-with-devin/devin-mcp) (retrieved 2026-10-14)
- [Revoke API Key (v2)](https://docs.devin.ai/api-reference/v2/api-keys/revoke-enterprise-api-key) (retrieved 2026-10-14)
- [List API Keys (v2)](https://docs.devin.ai/api-reference/v2/api-keys/list-enterprise-api-keys) (retrieved 2026-10-14)
- [List Audit Logs | Devin API](https://docs.devin.ai/api-reference/v3/audit-logs/enterprise-audit-logs) (retrieved 2026-10-14)
