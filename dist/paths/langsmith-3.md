# LangSmith: SCIM bearer token

`langsmith-3` · API key / token · service. Org token used by the IdP to call SCIM endpoints; value shown only at creation.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /api/v1/platform/orgs/current/scim/tokens lists all SCIM tokens for the org. | GET /api/v1/platform/orgs/current/scim/tokens lists all SCIM tokens for the org. |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | OrganizationAuthenticationManage permission | OrganizationAuthenticationManage permission: POST /api/v1/platform/orgs/current/scim/tokens (role permission) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | No docs found | Not documented |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Audit logs: Enterprise; Organization Settings > Audit logs or GET /api/v1/audit-logs (OCSF); 400-day retention; self-hosted needs Helm 0.12.33+ and enablement. |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | No docs found | DELETE /v1/platform/orgs/current/scim/tokens/{scim_token_id} |  |
| Respond: Stops working when user is removed | N/A | The SCIM token is an org-level token used by the IdP, not a user credential. |  |

## Protect: what an admin can configure

### Admin controls
- **OrganizationAuthenticationManage permission** (Disable; Enterprise; default unknown). Creating a SCIM token requires the OrganizationAuthenticationManage permission; users without it get 403. Where: POST /api/v1/platform/orgs/current/scim/tokens (role permission).

- Network: unknown (checked at unknown). Not documented.
- Lifetime: Not documented. Renewal: Create new token, delete old.
- Keyless option: not_applicable. Static token held by IdP.
- Conditions: Enterprise (SCIM).

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit logs: Enterprise; Organization Settings > Audit logs or GET /api/v1/audit-logs (OCSF); 400-day retention; self-hosted needs Helm 0.12.33+ and enablement.

### Fields that identify the credential
No docs found.

### Lifecycle events
- create: `create_scim_token` 
- modify: `update_scim_token` 
- revoke: `delete_scim_token` 

### Correlate on
No docs found.

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Unexpected create_scim_user / delete_scim_user

## Respond: how to revoke it
- Admin: **Delete SCIM token**. Deletes a SCIM bearer token. Where: DELETE /v1/platform/orgs/current/scim/tokens/{scim_token_id}.

DELETE /v1/platform/orgs/current/scim/tokens/{scim_token_id} Live access ends on revocation: unknown. 

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Cache latency
- SCIM read endpoints a holder could call
- What ip_allowlist covers and whether it applies to API key requests
- Whether SSO-only enforcement blocks PATs
- Whether pat_creation_disabled affects existing PATs
- Exact behaviour of max_pat_expiry_days / max_service_key_expiry_days
- SCIM token expiry
- Whether whoami-style reads (list workspaces, org info) are audited

## Sources
- [User management](https://docs.langchain.com/langsmith/user-management) (retrieved 2026-10-14)
- [List SCIM tokens](https://docs.langchain.com/langsmith/smith-api/scim-tokens/list-scim-tokens) (retrieved 2026-10-14)
- [Audit logs](https://docs.langchain.com/langsmith/audit-logs) (retrieved 2026-10-14)
- [Create a SCIM token](https://docs.langchain.com/langsmith/smith-api/scim-tokens/create-a-scim-token) (retrieved 2026-10-14)
