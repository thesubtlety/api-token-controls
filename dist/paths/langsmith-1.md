# LangSmith: Personal Access Tokens (PATs)

`langsmith-1` · Personal access token · person. User-created keys (lsv2_pt_) sent as X-API-Key; they carry the creating user's permissions and default workspace.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Settings > API Keys > Personal > All members, or GET /api/v1/orgs/current/members/personal-access-tokens. | Settings > API Keys > Personal > All members, or GET /api/v1/orgs/current/members/personal-access-tokens. |
| Protect: Admin can block or require approval | Yes | pat_creation_disabled; Global PAT creation disable (self-hosted); Organization Viewer role; Deactivate PAT (revocation) | pat_creation_disabled: PATCH /api/v1/orgs/current/info (API only) · Global PAT creation disable (self-hosted): Helm environment variable · Organization Viewer role: Org member role · Deactivate PAT (revocation): Settings > API Keys > Personal; POST /api/v1/orgs/current/personal-access-tokens/{pat_id}/revocation |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Org API schema has an ip_allowlist field, but no doc describes what it covers. |  |
| Protect: Expires automatically | Yes | Never expires by default; optional days; org field max_pat_expiry_days | Key expiration: API key create dialog · max_pat_expiry_days / max_service_key_expiry_days: PATCH /api/v1/orgs/current/info |
| Detect: Usage appears in logs | Yes | actor.user.credential_uid, unmapped.original_audit_log.enrichments.resource_owner_ls_user_id | Audit logs: Enterprise; Organization Settings > Audit logs or GET /api/v1/audit-logs (OCSF); 400-day retention; self-hosted needs Helm 0.12.33+ and enablement. |
| Detect: Data reads appear in logs | Conditional | Enterprise audit logs; Enterprise audit logs | Where: Organization Settings > Audit logs; filter Operation = query_runs / create_bulk_export, Actor = the key · API: GET /api/v1/audit-logs?operations=query_runs&operations=create_bulk_export&actor_api_key_ids=<key id> (match actor.user.credential_uid) |
| Respond: Revocation ends active access | Yes | Takes effect within about a minute due to auth cache. | Deactivate or delete in Settings > API Keys (All members) or via revocation API; remove user from org. |
| Respond: Stops working when user is removed | Yes | LangSmith says a PAT stops working when its user is removed from the organization. | API: DELETE /api/v1/orgs/current/members/{identity_id}; or deprovision via SCIM from the IdP |

## Protect: what an admin can configure

### Admin controls
- **pat_creation_disabled** (Disable; all plans; default off). Stops anyone in the org creating new PATs. Where: PATCH /api/v1/orgs/current/info (API only).
- **Global PAT creation disable (self-hosted)** (Disable; Self-hosted; default off). Env var disables PAT creation across all orgs on a self-hosted install. Where: Helm environment variable.
- **Organization Viewer role** (Disable; Plus or Enterprise; default off). Users with this role cannot create PATs. Where: Org member role.
- **Deactivate PAT (revocation)** (Disable; all plans; default off). Stops a PAT authenticating; reversible. Where: Settings > API Keys > Personal; POST /api/v1/orgs/current/personal-access-tokens/{pat_id}/revocation.
- **Key expiration** (Limit lifetime; all plans; default off). Per-key expiry in days; default never. Where: API key create dialog.
- **max_pat_expiry_days / max_service_key_expiry_days** (Limit lifetime; all plans; default unknown). Org-level maximum expiry fields in the org API schema (behaviour not described in guides). Where: PATCH /api/v1/orgs/current/info.

- Network: unknown (checked at unknown). Org API schema has an ip_allowlist field, but no doc describes what it covers.
- Lifetime: Never expires by default; optional days; org field max_pat_expiry_days. Renewal: Expired keys cannot be extended; create a new one.
- Keyless option: not_verified. SSO-only enforcement is documented for logins; docs do not say whether PATs are blocked by it. PATs stop working if the user is removed from the org (e.g. via SCIM).
- Conditions: Viewer role needs Plus/Enterprise.

## Detect: what gets logged
- Token prefix: `lsv2_pt_`

### Logs
- Audit logs: Enterprise; Organization Settings > Audit logs or GET /api/v1/audit-logs (OCSF); 400-day retention; self-hosted needs Helm 0.12.33+ and enablement.

### Fields that identify the credential
- `actor.user.credential_uid` (Audit logs): UUID of the PAT/key used; null for UI sessions
- `unmapped.original_audit_log.enrichments.resource_owner_ls_user_id` (Audit logs): Owner of PAT acted on

### Lifecycle events
- create: `create_personal_access_token` 
- revoke: `revoke_personal_access_token` Deactivation
- modify: `reinstate_personal_access_token` Reactivation
- revoke: `delete_personal_access_token` 
- use: `query_runs` Run reads are audited

### Correlate on
`actor.user.uid`, `actor.user.credential_uid`, `workspace_id`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/v1/workspaces`. Workspaces visible to the key Logged: unknown. Not in tracked operations list
- discovery: `GET /api/v1/orgs/current/info`. Org settings Logged: unknown. 
- collection (bulk): `POST /api/v1/runs/query`. Traces/runs incl. inputs and outputs Logged: plan (`query_runs`). Enterprise audit logs
- collection (bulk): `POST /api/v1/bulk-exports`. Bulk export of trace data to a destination Logged: plan (`create_bulk_export`). Enterprise audit logs
- enumeration (bulk): `GET /api/v1/orgs/current/members/personal-access-tokens`. All members' PATs (admin) Logged: plan (`list_all_org_personal_access_tokens`). 

### What to look for (analyst guidance)
- query_runs / bulk export by a PAT outside normal use
- PATs with no expiry
- Admin acting on another member's PAT

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **Delete PAT**. Permanently removes a PAT. Where: Settings > API Keys; DELETE /api/v1/orgs/current/personal-access-tokens/{pat_id}.
- Admin: **Remove user from org / SCIM deprovision**. PATs stop working once the user is removed from the organization. Where: Org members or IdP SCIM.

Deactivate or delete in Settings > API Keys (All members) or via revocation API; remove user from org. Live access ends on revocation: yes. Takes effect within about a minute due to auth cache.

## No vendor documentation found
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
- [User management](https://docs.langchain.com/langsmith/user-management) (retrieved 2026-10-14)
- [Update current organization info (API reference)](https://docs.langchain.com/langsmith/smith-api/orgs/update-current-organization-info) (retrieved 2026-10-14)
- [Manage your organization using the API](https://docs.langchain.com/langsmith/manage-organization-by-api) (retrieved 2026-10-14)
- [List all org personal access tokens](https://docs.langchain.com/langsmith/smith-api/orgs/list-all-org-personal-access-tokens) (retrieved 2026-10-14)
- [Audit logs](https://docs.langchain.com/langsmith/audit-logs) (retrieved 2026-10-14)
- [Get audit logs (API reference)](https://docs.langchain.com/langsmith/smith-api/audit-logs/get-audit-logs) (retrieved 2026-10-14)
- [Remove member from current org (API reference)](https://docs.langchain.com/langsmith/smith-api/orgs/remove-member-from-current-org) (retrieved 2026-10-14)
- [List workspaces](https://docs.langchain.com/langsmith/smith-api/workspaces/list-workspaces) (retrieved 2026-10-14)
- [Get current organization info](https://docs.langchain.com/langsmith/smith-api/orgs/get-current-organization-info) (retrieved 2026-10-14)
- [Query runs](https://docs.langchain.com/langsmith/smith-api/run/query-runs) (retrieved 2026-10-14)
- [Create bulk export](https://docs.langchain.com/langsmith/smith-api/bulk-exports/create-bulk-export) (retrieved 2026-10-14)
- [Revoke org personal access token](https://docs.langchain.com/langsmith/smith-api/orgs/revoke-org-personal-access-token) (retrieved 2026-10-14)
- [Role-based access control](https://docs.langchain.com/langsmith/rbac) (retrieved 2026-10-14)
