# Postman: SCIM API key

`postman-3` · API key / token · person or service. Bearer key in the Authorization header for /scim/v2 endpoints only. Owned by an Admin/Super Admin user or by a system service account.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | SCIM keys are managed in Organization settings (Authentication) and service-account-owned keys are listed on the service account; no doc describes one org-wide list. | SCIM keys are managed in Organization settings (Authentication) and service-account-owned keys are listed on the service account; no doc describes one org-wide list. |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | SCIM API key turn on/off, regenerate, delete | SCIM API key turn on/off, regenerate, delete: Service Accounts > SCIM API keys |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No Postman doc found describing IP allowlisting for API keys or the Postman API. |  |
| Protect: Expires automatically | No docs found | Keys show an expiration date; default not stated |  |
| Detect: Usage appears in logs | Yes | unknown | Audit logs (dashboard and GET /audit/logs): Enterprise; 180 days; CSV export or Postman API for SIEM; events carry actor, IP, userAgent, data.variables |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | No docs found | Regeneration may keep old key active if chosen. |  |
| Respond: Stops working when user is removed | Partial | Docs imply a SCIM key owned by an Admin stops working when that Admin leaves; keys owned by a service account keep working. | Where: Remove the owning Admin from the team (Admin/Org Manager/Super Admin only), or deactivate via IdP SCIM; keys owned by a service account are unaffected · API: PUT https://api.postman.com/scim/v2/Users/{userId} {"active": false} |

## Protect: what an admin can configure

### Admin controls
- **SCIM API key turn on/off, regenerate, delete** (Disable; Enterprise; default varies). Disable, replace or delete a service-account-owned SCIM key. Where: Service Accounts > SCIM API keys.

- Network: unknown (checked at unknown). No Postman doc found describing IP allowlisting for API keys or the Postman API.
- Lifetime: Keys show an expiration date; default not stated. Renewal: Regenerate; old key can stay active during switch
- Keyless option: not_verified. No workload identity federation documented for this credential.
- Conditions: Enterprise plan; SSO configured

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit logs (dashboard and GET /audit/logs): Enterprise; 180 days; CSV export or Postman API for SIEM; events carry actor, IP, userAgent, data.variables

### Fields that identify the credential
- `unknown` (Audit logs): not documented

### Lifecycle events
- create: `team.scimkey_create` Created SCIM Key

### Correlate on
`data.actor.id`, `ip`

### API calls a holder can make, and whether they are logged
- enumeration (bulk): `GET /scim/v2/Users`. All team members Logged: unknown. Provisioning changes are audited; reads not stated

### What to look for (analyst guidance)
- SCIM user provisioning or deactivation not originating from your IdP
- SCIM key created by unexpected admin

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it


Turn off, regenerate or delete the key under Service Accounts or Organization settings > Authentication. Live access ends on revocation: unknown. Regeneration may keep old key active if chosen.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Revoke/disable event codes
- Any IP allowlisting for Postman API keys or the Postman API (none found in docs).
- Whether API keys or service account tokens are blocked by SSO-only enforcement or IdP conditional access; docs do not say.
- Whether revoking a service account API key invalidates already-issued short-lived tokens.
- Whether removing or SCIM-deactivating a user revokes their Postman API keys.
- Default and allowed expiry values for user API keys and SCIM keys.
- Exact audit action codes for service account key events and collection access key create/delete.
- Whether Postman API read calls (GET /collections, /workspaces, etc.) appear in audit logs.
- How OAuth client_credentials clients (installationAuthId) are registered and administered.
- Documented prefix for user Postman API keys (OAuth token example shows PMAK-XXX; not stated for API keys).

## Sources
- [Postman API Reference Overview](https://learning.postman.com/api-docs/api-reference) (retrieved 2026-10-14)
- [Get all users](https://learning.postman.com/api-docs/api-reference/scim/get-scim-user-resources) (retrieved 2026-10-14)
- [Manage service account identities for automation and integrations](https://learning.postman.com/docs/administration/service-accounts/) (retrieved 2026-10-14)
- [SCIM provisioning overview](https://learning.postman.com/docs/administration/scim-provisioning/scim-provisioning-overview/) (retrieved 2026-10-14)
- [Manage API keys](https://learning.postman.com/docs/administration/managing-your-team/managing-api-keys/) (retrieved 2026-10-14)
- [Update a user (SCIM)](https://learning.postman.com/api-docs/api-reference/scim/update-scim-user) (retrieved 2026-10-14)
- [Get all audit log event actions](https://learning.postman.com/api-docs/api-reference/audit-logs/get-audit-log-event-actions) (retrieved 2026-10-14)
