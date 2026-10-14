# Postman: System service account API key and access token

`postman-2` · API key / token · service. Admin creates a system service account and an API key for it. The key is sent as x-api-key to get a short-lived token used for Postman API calls.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admins see all system service accounts and their active credentials on the Service Accounts page. | Admins see all system service accounts and their active credentials on the Service Accounts page. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No Postman doc found describing IP allowlisting for API keys or the Postman API. |  |
| Protect: Expires automatically | Yes | Token TTL fixed (value not stated); API key expiry configurable | Where: Profile > team/organization > Service Accounts > select account > view each API key's expiration (access token TTL is fixed, not configurable) |
| Detect: Usage appears in logs | Yes | unknown | Audit logs (dashboard and GET /audit/logs): Enterprise; 180 days; CSV export or Postman API for SIEM; events carry actor, IP, userAgent, data.variables · Service Accounts page: Last-used, creation and expiry per key |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Issued short-lived tokens may remain valid until expiry; not documented. |  |
| Respond: Stops working when user is removed | N/A | System service accounts are non-human identities, not tied to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Service account roles** (Limit resources; Enterprise; default varies). Service account access follows the org, team and workspace roles assigned to it. Where: Service Accounts > Assigned teams / Assigned workspaces.
- **Service account management restricted to Admin or Super Admin** (Other; Enterprise; default on). Only Admins and Super Admins can create service accounts and generate their API keys. Where: Team/organization > Service Accounts.

### Not available (vendor states)
- Service account short-lived token expiration cannot be configured.

- Network: unknown (checked at unknown). No Postman doc found describing IP allowlisting for API keys or the Postman API.
- Lifetime: Token TTL fixed (value not stated); API key expiry configurable. Renewal: Rotate by creating a second key, then revoking the old one
- Keyless option: not_verified. No workload identity federation documented for this credential.
- Conditions: Enterprise plan; Admin or Super Admin

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit logs (dashboard and GET /audit/logs): Enterprise; 180 days; CSV export or Postman API for SIEM; events carry actor, IP, userAgent, data.variables
- Service Accounts page: Last-used, creation and expiry per key

### Fields that identify the credential
- `unknown` (Audit logs): Field for service account key events not documented

### Lifecycle events
- create: `API key created` Display text; action code not given
- rotate: `API key regenerated` 
- other: `API key activated` 
- revoke: `API key deactivated` 
- revoke: `API key deleted` 
- other: `API key renamed` 

### Correlate on
`data.actor.id`, `ip`, `userAgent`

### API calls a holder can make, and whether they are logged
- recon: `GET /me`. Authenticated user, team, usage Logged: unknown. Audit log docs do not list API read events
- discovery (bulk): `GET /workspaces`. All accessible workspaces incl. visibility Logged: unknown. Audit log docs do not list API read events
- collection (bulk): `GET /collections`. All collections the user can see Logged: unknown. Audit log docs do not list API read events
- enumeration (bulk): `GET /users`. All team users Logged: unknown. Audit log docs do not list API read events

### What to look for (analyst guidance)
- Service account key used from unexpected IP
- New key created outside change window
- Service account given Super Admin

## Respond: how to revoke it
- Admin: **Service account API key management**. Admins create, rotate, revoke or delete service account keys and set key expiry. Where: Team/Organization > Service Accounts.

Service Accounts > select account > revoke or delete key. Live access ends on revocation: unknown. Issued short-lived tokens may remain valid until expiry; not documented.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Token endpoint name
- Effect of key revocation on live tokens
- Token exchange endpoint
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
- [Manage service account identities for automation and integrations](https://learning.postman.com/docs/administration/service-accounts/) (retrieved 2026-10-14)
- [Audit logs](https://learning.postman.com/docs/administration/managing-your-team/audit-logs/) (retrieved 2026-10-14)
- [Get authenticated user](https://learning.postman.com/api-docs/api-reference/users/get-authenticated-user) (retrieved 2026-10-14)
- [Get all collections](https://learning.postman.com/api-docs/api-reference/collections/get-collections) (retrieved 2026-10-14)
- [Get all workspaces](https://learning.postman.com/api-docs/api-reference/workspaces/get-workspaces) (retrieved 2026-10-14)
- [Get all team users](https://learning.postman.com/api-docs/api-reference/users/get-team-users) (retrieved 2026-10-14)
