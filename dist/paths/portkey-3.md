# Portkey: Workspace User API Keys

`portkey-3` · API key / token · person. Workspace keys tied to an individual user; same operational scopes as service keys but cannot manage other keys.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /api-keys (List API Key) with workspace_id; scope workspace_user_api_keys.list lists all workspace user keys. | GET /api-keys (List API Key) with workspace_id; scope workspace_user_api_keys.list lists all workspace user keys. |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | Manage Keys (Workspace Managers); Manage Keys (Workspace Members) | Manage Keys (Workspace Managers): Admin Settings > Security > API Key Management · Manage Keys (Workspace Members): Admin Settings > Security > API Key Management |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | Partial | Optional expires_at; org can enforce rotation cadence for user keys | expires_at / org-workspace maximum TTL: expires_at on create; max TTL setting name not documented · Rotation policy: rotation_policy on create/update; POST /v2/api-keys/{id}/rotate · user_api_key_rotation_period: Organisation setting user_api_key_rotation_period |
| Detect: Usage appears in logs | Yes | user_type=api_key / user_id, api_key_id, old_key_masked | Audit Logs: Enterprise; Admin Settings > Audit Logs or GET /audit-logs (admin key with audit_logs.list); indefinite retention; filter by user_type=api_key. · Request Logs: Gateway request logs with full request/response; retention 3 days Developer, 30 days Production, unlimited Enterprise. |
| Detect: Data reads appear in logs | Conditional | Audit action 'Export' exists (Enterprise) | Where: Admin Settings > Audit Logs > filter Action = Export · API: GET https://api.portkey.ai/v1/audit-logs?action=<export>&user_type=api_key |
| Respond: Revocation ends active access | No docs found | Rotation leaves old secret valid at least 30 minutes. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **API key scopes** (Limit scope; all plans; default varies). Each key gets a list of permission scopes at create/update. Where: scopes on POST /api-keys/{type}/{sub-type}.
- **expires_at / org-workspace maximum TTL** (Limit lifetime; all plans; default unknown). Key expiry date, which cannot exceed a configured org/workspace maximum TTL. Where: expires_at on create; max TTL setting name not documented.
- **Rotation policy** (Require rotation; all plans; default off). Scheduled automatic rotation (weekly, monthly or N days). Where: rotation_policy on create/update; POST /v2/api-keys/{id}/rotate.
- **user_api_key_rotation_period** (Require rotation; all plans; default off). Org enforces a rotation cadence (1-365 days) on workspace-user keys. Where: Organisation setting user_api_key_rotation_period.
- **API Key Management permissions** (Limit scope; Enterprise; default varies). Controls whether workspace managers/members can view or manage keys. Where: Admin Settings > Security > API Key Management.
- **Per-key rate and usage limits** (Limit resources; all plans; default off). Request/token rate limits and cost/token budgets per key. Where: rate_limits, usage_limits on create/update.
- **Pinned default config** (Limit scope; all plans; default off). Pins a config to a key; allow_config_override=false stops callers overriding it. Where: defaults.config_id, defaults.allow_config_override.
- **Manage Keys (Workspace Managers)** (Disable; Enterprise; default unknown). Org admins can turn off workspace managers' ability to create, update and delete workspace service and user API keys. Where: Admin Settings > Security > API Key Management.
- **Manage Keys (Workspace Members)** (Disable; Enterprise; default unknown). Org admins can turn off workspace members' ability to create, update and delete their own user API keys. Where: Admin Settings > Security > API Key Management.

- Network: unknown (checked at unknown). Not documented.
- Lifetime: Optional expires_at; org can enforce rotation cadence for user keys. Renewal: Rotation; non-admins can rotate only their own keys.
- Keyless option: not_verified. Docs do not say whether user keys stop when the user is removed or SSO policy changes.
- Conditions: Enterprise for permission settings.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit Logs: Enterprise; Admin Settings > Audit Logs or GET /audit-logs (admin key with audit_logs.list); indefinite retention; filter by user_type=api_key.
- Request Logs: Gateway request logs with full request/response; retention 3 days Developer, 30 days Production, unlimited Enterprise.

### Fields that identify the credential
- `user_type=api_key / user_id` (Audit log): Actor can be an API key
- `api_key_id, old_key_masked` (Audit log (rotation)): 

### Lifecycle events
- create: `Create (resource type API Keys)` Audit action filter
- rotate: `Rotate` rotation_mode manual|auto
- revoke: `Delete` 
- modify: `Update` 

### Correlate on
`request_id`, `client_ip`, `workspace_id`, `api key id`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/models`. Models available to the key Logged: unknown. 
- enumeration (bulk): `GET /v1/api-keys`. API keys in scope Logged: unknown. Audit method filter lists only POST/PUT/DELETE
- enumeration (bulk): `GET /v1/integrations`. Stored provider integrations Logged: unknown. 
- collection (bulk): `POST /v1/logs/exports`. Bulk export of request logs (full prompts/responses) Logged: plan (`Export`). Audit action 'Export' exists (Enterprise)

### What to look for (analyst guidance)
- Admin key actions from new Client IP or Country
- Keys created without expires_at
- Workspace service key creating other keys

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **Delete API key**. Removes an API key. Where: DELETE /v1/api-keys/{id} (Admin API).

DELETE the key via Admin API or dashboard; or rotate with minimum 30-minute transition. Live access ends on revocation: unknown. Rotation leaves old secret valid at least 30 minutes.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Revocation ends active access
- Stops working when user is removed
- Whether request logs record which API key was used (field name)
- Whoami endpoint
- IP allowlisting for API keys or JWTs
- Name of the org/workspace maximum key TTL setting
- Whether user API keys are disabled when the user is removed or deprovisioned via SCIM
- Whether SSO enforcement affects API keys
- Whether GET (read) API calls appear in audit logs (filter lists only POST/PUT/DELETE)
- Auth cache delay after key deletion
- SCIM token expiry and revocation
- API key token prefix

## Sources
- [API Keys (AuthN and AuthZ)](https://docs.portkey.ai/docs/product/enterprise-offering/org-management/api-keys-authn-and-authz) (retrieved 2026-10-14)
- [Create API Key](https://docs.portkey.ai/docs/api-reference/admin-api/control-plane/api-keys/create-api-key) (retrieved 2026-10-14)
- [API Key Rotation](https://docs.portkey.ai/docs/product/enterprise-offering/org-management/api-key-rotation) (retrieved 2026-10-14)
- [Configure API Key Access Permissions for Workspaces](https://docs.portkey.ai/docs/product/administration/configure-api-key-access-permissions) (retrieved 2026-10-14)
- [List API Keys](https://docs.portkey.ai/docs/api-reference/admin-api/control-plane/api-keys/list-api-keys) (retrieved 2026-10-14)
- [Audit Logs](https://docs.portkey.ai/docs/product/enterprise-offering/audit-logs) (retrieved 2026-10-14)
- [List Audit Logs](https://docs.portkey.ai/docs/api-reference/admin-api/control-plane/audit-logs/list-audit-logs) (retrieved 2026-10-14)
- [Delete an API Key](https://docs.portkey.ai/docs/api-reference/admin-api/control-plane/api-keys/delete-an-api-key) (retrieved 2026-10-14)
- [Logs](https://docs.portkey.ai/docs/product/observability/logs) (retrieved 2026-10-14)
- [List Models](https://docs.portkey.ai/docs/api-reference/inference-api/models/models) (retrieved 2026-10-14)
- [Create a Log Export](https://docs.portkey.ai/docs/api-reference/admin-api/data-plane/logs/log-exports-beta/create-a-log-export) (retrieved 2026-10-14)
