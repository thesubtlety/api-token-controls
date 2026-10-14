# Jamf: Jamf Platform API Gateway integration (Jamf Account client credentials)

`jamf-3` · OAuth · service. An integration created in Jamf Account holds a client_id and client_secret, exchanged at https://{region}.api.jamfcloud.com/auth/token for a 15-minute bearer token. Reaches platform APIs and, at tenant scope, Jamf Pro (incl. Classic), Jamf Protect and Jamf Security Cloud.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | Yes | Token 900 s; integration credentials valid six months | Where: Jamf Account > Integrations (integration valid six months; access tokens 900 s, see expires_in) |
| Detect: Usage appears in logs | Yes | actor | Platform Audit API (GET /v1/audit): api-gateway source records actor, method, path; needs audit:read. |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | No docs found | Jamf's migration guide lists no invalidate endpoint for gateway tokens; they expire after 900 s. |  |
| Respond: Stops working when user is removed | N/A | The credential belongs to a Jamf Account integration, not to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Integration scope level and capability permissions** (Limit scope; all plans; default unknown). Each gateway integration is bound to one scope level (org, environment, tenant) and granted capability:action permissions. Where: Jamf Account > Integrations.
- **Integration validity (six months)** (Limit lifetime; all plans; default on). Gateway integrations expire after six months. Where: Fixed.

- Network: unknown (checked at unknown). Not documented.
- Lifetime: Token 900 s; integration credentials valid six months. Renewal: No refresh token; request a new token with the same credentials; regenerate secret / recreate integration every six months.
- Keyless option: not_verified. Only client credentials documented.
- Conditions: Jamf Account Administrator role or custom role with Integrations privileges.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Platform Audit API (GET /v1/audit): api-gateway source records actor, method, path; needs audit:read.

### Fields that identify the credential
- `actor` (Platform audit events): Filter field.

### Lifecycle events
No docs found.

### Correlate on
`actor`, `transaction id`

### API calls a holder can make, and whether they are logged
- discovery: `GET /v1/audit/sources`. Audit sources and event types Logged: unknown. 

### What to look for (analyst guidance)
- New integrations with organization-management scope
- Destructive device action capability granted

## Respond: how to revoke it


Delete or regenerate the integration in Jamf Account. Live access ends on revocation: unknown. Jamf's migration guide lists no invalidate endpoint for gateway tokens; they expire after 900 s.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Event names for integration create/delete
- whoami endpoint
- IP allowlisting for Jamf Pro API clients or user API access (none found in public docs).
- Default and maximum Access Token Lifetime for API clients (the doc example shows expires_in 599, but no default is stated).
- Whether Jamf Pro admins can block a user account from using /v1/auth/token while keeping UI access.
- Which identity Change Management logs for actions taken by an API client, and whether /v1/oauth/token requests appear in the Access Log.
- Exact Change Management object/action names for API client create/rotate/disable.
- Jamf Protect API token lifetime and revocation; Jamf School API key expiry, auth header format and revocation behavior.
- Platform API Gateway: revoke/disable controls for an integration and IP restrictions.

## Sources
- [Platform API fundamentals](https://developer.jamf.com/platform-api/reference/platform-api-fundamentals) (retrieved 2026-10-14)
- [Getting started](https://developer.jamf.com/platform-api/reference/getting-started-with-platform-api) (retrieved 2026-10-14)
- [Discover audit sources](https://developer.jamf.com/platform-api/reference/listauditsources) (retrieved 2026-10-14)
- [Filter audit events](https://developer.jamf.com/platform-api/reference/filterauditevents) (retrieved 2026-10-14)
- [Move an existing integration to the Platform API Gateway](https://developer.jamf.com/platform-api/reference/move-an-existing-integration-to-the-platform-api-gateway) (retrieved 2026-10-14)
