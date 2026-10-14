# LangSmith: Service keys (service accounts)

`langsmith-2` · API key / token · service. Admin-created keys (lsv2_sk_) for applications, scoped to one or more workspaces or the whole org; org-scoped keys need X-Tenant-Id for workspace resources.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /api/v1/orgs/current/service-keys lists the org's service keys (also Settings > API Keys > Service tab). | GET /api/v1/orgs/current/service-keys lists the org's service keys (also Settings > API Keys > Service tab). |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | ip_allowlist org field exists; semantics undocumented. |  |
| Protect: Expires automatically | Yes | Never expires by default; org field max_service_key_expiry_days | Key expiration: API key create dialog · max_pat_expiry_days / max_service_key_expiry_days: PATCH /api/v1/orgs/current/info |
| Detect: Usage appears in logs | Yes | actor.user.credential_uid | Audit logs: Enterprise; Organization Settings > Audit logs or GET /api/v1/audit-logs (OCSF); 400-day retention; self-hosted needs Helm 0.12.33+ and enablement. |
| Detect: Data reads appear in logs | Conditional | Enterprise audit logs; Enterprise audit logs | Where: Organization Settings > Audit logs; filter Operation = query_runs / create_bulk_export, Actor = the key · API: GET /api/v1/audit-logs?operations=query_runs&operations=create_bulk_export&actor_api_key_ids=<key id> (match actor.user.credential_uid) |
| Respond: Revocation ends active access | Yes | Auth cache means up to about a minute. | Delete the key (Settings > API Keys > Service, or DELETE /api/v1/orgs/current/service-keys/{api_key_id}). |
| Respond: Stops working when user is removed | N/A | Service keys act for a service account, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Key expiration** (Limit lifetime; all plans; default off). Per-key expiry in days; default never. Where: API key create dialog.
- **max_pat_expiry_days / max_service_key_expiry_days** (Limit lifetime; all plans; default unknown). Org-level maximum expiry fields in the org API schema (behaviour not described in guides). Where: PATCH /api/v1/orgs/current/info.
- **Service key workspace scope and roles** (Limit scope; Enterprise (roles); default varies). Limit keys to specific workspaces and (Enterprise) a workspace role. Where: Settings > API Keys > Service.
- **Service key creation limited to admins** (Other; all plans; default on). Only admins can create service keys, so non-admin members cannot create them. Where: Organization roles (Settings > Members and roles).

### Not available (vendor states)
- Service keys cannot be deactivated (only deleted).

- Network: unknown (checked at unknown). ip_allowlist org field exists; semantics undocumented.
- Lifetime: Never expires by default; org field max_service_key_expiry_days. Renewal: Create a new key and delete the old one; roles can be edited without rotating.
- Keyless option: not_applicable. Static key not tied to a user.
- Conditions: Operators cannot create org-wide keys.

## Detect: what gets logged
- Token prefix: `lsv2_sk_`

### Logs
- Audit logs: Enterprise; Organization Settings > Audit logs or GET /api/v1/audit-logs (OCSF); 400-day retention; self-hosted needs Helm 0.12.33+ and enablement.

### Fields that identify the credential
- `actor.user.credential_uid` (Audit logs): UUID of the service key

### Lifecycle events
- create: `create_service_key` 
- modify: `update_service_key` Role change
- revoke: `delete_service_key` 
- create: `create_service_account` 
- use: `query_runs` 

### Correlate on
`actor.user.credential_uid`, `workspace_id`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/v1/workspaces`. Workspaces visible to the key Logged: unknown. Not in tracked operations list
- discovery: `GET /api/v1/orgs/current/info`. Org settings Logged: unknown. 
- collection (bulk): `POST /api/v1/runs/query`. Traces/runs incl. inputs and outputs Logged: plan (`query_runs`). Enterprise audit logs
- collection (bulk): `POST /api/v1/bulk-exports`. Bulk export of trace data to a destination Logged: plan (`create_bulk_export`). Enterprise audit logs
- enumeration (bulk): `GET /api/v1/orgs/current/service-keys`. Org service keys Logged: plan (`list_org_service_keys`). 

### What to look for (analyst guidance)
- Org-wide service key created
- Service key creating bulk exports

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **Delete service key**. Service keys can only be deleted. Where: Settings > API Keys > Service; DELETE /api/v1/orgs/current/service-keys/{api_key_id}.

Delete the key (Settings > API Keys > Service, or DELETE /api/v1/orgs/current/service-keys/{api_key_id}). Live access ends on revocation: yes. Auth cache means up to about a minute.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- What ip_allowlist covers and whether it applies to API key requests
- Whether SSO-only enforcement blocks PATs
- Whether pat_creation_disabled affects existing PATs
- Exact behaviour of max_pat_expiry_days / max_service_key_expiry_days
- SCIM token expiry
- Whether whoami-style reads (list workspaces, org info) are audited

## Sources
- [Create an account and API key](https://docs.langchain.com/langsmith/create-account-api-key) (retrieved 2026-10-14)
- [Administration overview](https://docs.langchain.com/langsmith/administration-overview) (retrieved 2026-10-14)
- [Update current organization info (API reference)](https://docs.langchain.com/langsmith/smith-api/orgs/update-current-organization-info) (retrieved 2026-10-14)
- [Create org service key](https://docs.langchain.com/langsmith/smith-api/orgs/create-org-service-key) (retrieved 2026-10-14)
- [List org service keys](https://docs.langchain.com/langsmith/smith-api/orgs/list-org-service-keys) (retrieved 2026-10-14)
- [Audit logs](https://docs.langchain.com/langsmith/audit-logs) (retrieved 2026-10-14)
- [Get audit logs (API reference)](https://docs.langchain.com/langsmith/smith-api/audit-logs/get-audit-logs) (retrieved 2026-10-14)
- [Delete org service key](https://docs.langchain.com/langsmith/smith-api/orgs/delete-org-service-key) (retrieved 2026-10-14)
- [List workspaces](https://docs.langchain.com/langsmith/smith-api/workspaces/list-workspaces) (retrieved 2026-10-14)
- [Get current organization info](https://docs.langchain.com/langsmith/smith-api/orgs/get-current-organization-info) (retrieved 2026-10-14)
- [Query runs](https://docs.langchain.com/langsmith/smith-api/run/query-runs) (retrieved 2026-10-14)
- [Create bulk export](https://docs.langchain.com/langsmith/smith-api/bulk-exports/create-bulk-export) (retrieved 2026-10-14)
