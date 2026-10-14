# Postman: OAuth 2.0 client credentials token

`postman-5` · OAuth · service. Client application posts client ID/secret (Basic) plus installationAuthId and a signed JWT to POST /oauth2/token and gets a Bearer token. Docs do not say how clients are registered.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No Postman doc found describing IP allowlisting for API keys or the Postman API. |  |
| Protect: Expires automatically | Yes | expires_in returned (example 3600; field documented in milliseconds) | API: POST https://api.postman.com/oauth2/token; read expires_in in the response |
| Detect: Usage appears in logs | No docs found | No log source found. |  |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | Yes | Docs: revocation is immediate. | POST /oauth2/token/revoke with the token. |
| Respond: Stops working when user is removed | N/A | Client credentials tokens are issued to a client application for backend services or bots, not to a user. |  |

## Protect: what an admin can configure

### Admin controls
No docs found.

- Network: unknown (checked at unknown). No Postman doc found describing IP allowlisting for API keys or the Postman API.
- Lifetime: expires_in returned (example 3600; field documented in milliseconds). Renewal: Request a new token with client credentials
- Keyless option: not_verified. Signed JWT assertion is required but issuer/trust setup is not documented.
- Conditions: unknown

## Detect: what gets logged
- Token prefix: not established

### Logs
No docs found.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
No docs found.

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

## Respond: how to revoke it
- Admin: **Revoke an OAuth Token**. Revoke an OAuth access token immediately. Where: POST /oauth2/token/revoke.

POST /oauth2/token/revoke with the token. Live access ends on revocation: yes. Docs: revocation is immediate.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Usage appears in logs
- Data reads appear in logs
- Any logging of these tokens
- Which endpoints accept these tokens
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
- [Generate an OAuth Token](https://learning.postman.com/api-docs/api-reference/o-auth-2-0/generate-oauth-token) (retrieved 2026-10-14)
- [Revoke an OAuth Token](https://learning.postman.com/api-docs/api-reference/o-auth-2-0/revoke-oauth-token) (retrieved 2026-10-14)
