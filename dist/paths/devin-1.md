# Devin: Service User API Key

`devin-1` · API key / token · service. cog_ bearer key for a non-human service user created at organization or enterprise level. Permissions come from the RBAC role assigned to the service user. Also works with the Devin MCP server.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Enterprise admins can list service users (GET /v3/enterprise/members/service-users) and each one's keys with status (GET /v3beta1/enterprise/service-users/{service_user_id}/api-keys). | Enterprise admins can list service users (GET /v3/enterprise/members/service-users) and each one's keys with status (GET /v3beta1/enterprise/service-users/{service_user_id}/api-keys). |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | Static service user keys disabled | Static service user keys disabled: Enterprise setting (name not documented; audit action update_service_user_key_policy) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Enterprise IP access list rejects API requests from other IPs with 401; applies enterprise-wide, not per key. | IP Access Lists: /v3/enterprise/ip-access-list (ManageIPWhitelist) |
| Protect: Expires automatically | Yes | Optional expiry; can be non-expiring | Service user key expiration: POST /v3beta1/enterprise/service-users/{id}/api-keys |
| Detect: Usage appears in logs | Yes | service_user_id | Audit logs API: GET /v3/enterprise/audit-logs (ViewAccountAuditLogs); org variant exists. Max 100-day window per query. |
| Detect: Data reads appear in logs | Yes | create_session | API: GET /v3/enterprise/audit-logs?action=create_session; match service_user_id |
| Respond: Revocation ends active access | No docs found | Revoke the key (API or Settings > Devin API > Service users); or delete the service user. |  |
| Respond: Stops working when user is removed | N/A | Service user keys belong to a non-human service user, not a person. |  |

## Protect: what an admin can configure

### Admin controls
- **Service user role (RBAC)** (Limit scope; all plans; default unknown). Role decides which endpoints a service user key can call. Where: Settings > Devin API > Service users.
- **Static service user keys disabled** (Disable; Enterprise; default unknown). Blocks creating or rotating static service user keys (except SCIM/Outpost service users). Where: Enterprise setting (name not documented; audit action update_service_user_key_policy).
- **Service user key expiration** (Limit lifetime; Enterprise; default off). Optional expires_at at creation or rotation. Where: POST /v3beta1/enterprise/service-users/{id}/api-keys.
- **IP Access Lists** (Limit network; Enterprise; default off). Only allowed CIDRs can reach Devin APIs and webapp. Where: /v3/enterprise/ip-access-list (ManageIPWhitelist).

- Network: supported (checked at api_request). Enterprise IP access list rejects API requests from other IPs with 401; applies enterprise-wide, not per key.
- Lifetime: Optional expiry; can be non-expiring. Renewal: Rotate creates a new key and revokes the old one by default; graceful overlap is optional.
- Keyless option: not_verified. Audit actions mention federated identity providers and credentials, but no inbound federation guide was found.
- Conditions: Enterprise key API is beta.

## Detect: what gets logged
- Token prefix: `cog_`

### Logs
- Audit logs API: GET /v3/enterprise/audit-logs (ViewAccountAuditLogs); org variant exists. Max 100-day window per query.

### Fields that identify the credential
- `service_user_id` (audit log): Also service_user_name; no key ID field documented.

### Lifecycle events
- create: `create_service_user_api_key` 
- rotate: `rotate_service_user_api_key` 
- revoke: `revoke_service_user_api_key` 

### Correlate on
`service_user_id`, `org_id`

### API calls a holder can make, and whether they are logged
- recon: `GET /v3/self`. Principal type and identity Logged: unknown. 
- collection (bulk): `GET /v3/organizations/{org_id}/sessions`. Sessions in the org Logged: unknown. 
- collection: `POST /v3/organizations/{org_id}/sessions`. Starts a Devin session with repo/secret access Logged: yes (`create_session`). 

### What to look for (analyst guidance)
- create_session with create_as_user_id from a service user
- rotate with revoke_current=false leaving two keys active

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **Revoke API key for service user**. Revokes one service user key. Where: DELETE /v3beta1/enterprise/service-users/{service_user_id}/api-keys/{api_key_id}.

Revoke the key (API or Settings > Devin API > Service users); or delete the service user. Live access ends on revocation: unknown. 

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- Per-request API logging
- Whether API tokens are blocked when SSO is enforced or bypass IdP conditional access (not stated)
- Inbound workload federation for the Devin API (audit actions exist, no guide found)
- Where the static service user key policy is set in the UI
- Audit log retention period
- Whether read calls (list sessions, list knowledge) are audited
- Legacy key expiry and whether a v3 setting disables them
- Whether revoking a service user key ends access immediately

## Sources
- [Authentication | Devin Docs](https://docs.devin.ai/api-reference/authentication) (retrieved 2026-10-14)
- [Devin MCP | Devin Docs](https://docs.devin.ai/work-with-devin/devin-mcp) (retrieved 2026-10-14)
- [IP Access Lists | Devin Docs](https://docs.devin.ai/enterprise/security-access/ip-access-lists) (retrieved 2026-10-14)
- [Create API key for service user](https://docs.devin.ai/api-reference/v3/service-users/post-enterprise-service-user-api-keys) (retrieved 2026-10-14)
- [Rotate API key for service user](https://docs.devin.ai/api-reference/v3/service-users/rotate-enterprise-service-user-api-key) (retrieved 2026-10-14)
- [Devin API v3 OpenAPI spec](https://docs.devin.ai/v3-openapi.yaml) (retrieved 2026-10-14)
- [List Audit Logs | Devin API](https://docs.devin.ai/api-reference/v3/audit-logs/enterprise-audit-logs) (retrieved 2026-10-14)
- [Revoke API key for service user](https://docs.devin.ai/api-reference/v3/service-users/delete-enterprise-service-user-api-key) (retrieved 2026-10-14)
- [Get Self | Devin API](https://docs.devin.ai/api-reference/v3/self/self) (retrieved 2026-10-14)
- [List Sessions | Devin API](https://docs.devin.ai/api-reference/v3/sessions/organizations-sessions) (retrieved 2026-10-14)
