# Coupa: OAuth2/OpenID Connect Client - Authorization Code / Device Code grant (user-delegated)

`coupa-2` · OAuth · person. A user signs in to Coupa and consents; the app gets an access token and, with offline_access, a refresh token acting as that user (e.g. Okta provisioning).

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | The OpenIDConnect Clients table lists clients, but docs name no view of which users authorized a client or their tokens. | Where: Setup > Integrations > Oauth2/OpenID Connect Clients (lists clients only, not per-user grants) |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | IP Whitelisting is a field on OAuth/OIDC clients; docs do not limit it to client credentials. Account/business group restrictions apply only to client-credentials clients. | IP Whitelisting: OAuth/OIDC Client Configuration > IP Whitelisting |
| Protect: Expires automatically | Yes | Refresh tokens expire every 90 days | API: Fixed: refresh tokens expire every 90 days; not configurable in docs |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | API telemetry: Same limits as coupa-1. |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | No docs found | Deactivate the client. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Scopes** (Limit scope; all plans; default varies). Each client gets only the service.object.right scopes assigned. Where: Client create/edit page; /oauth2/scopes.
- **IP Whitelisting** (Limit network; all plans; default off). Rejects API requests from IPs or CIDRs not on the client's allowlist (403). Where: OAuth/OIDC Client Configuration > IP Whitelisting.
- **Client Purpose** (Other; all plans; default on). Mandatory field recording whether the client is internal, third-party or marketplace. Where: OAuth/OIDC Client Configuration > Client Purpose.

- Network: supported (checked at api_request). IP Whitelisting is a field on OAuth/OIDC clients; docs do not limit it to client credentials. Account/business group restrictions apply only to client-credentials clients.
- Lifetime: Refresh tokens expire every 90 days. Renewal: App refreshes until the refresh token expires, then the user re-authenticates.
- Keyless option: not_verified. The user authenticates to Coupa during consent (SSO if configured); later refresh-token use has no documented IdP check.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- API telemetry: Same limits as coupa-1.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`client Identifier`, `consenting user`

### API calls a holder can make, and whether they are logged
- enumeration (bulk): `GET /api/users`. User records Logged: unknown. 

### What to look for (analyst guidance)
- Authorization code clients requesting offline_access with write scopes

## Respond: how to revoke it
- Admin: **Deactivate OAuth2/OpenID Connect client**. Deactivate an individual client. Where: Setup > Integrations > Oauth2/OpenID Connect Clients.

Deactivate the client. Live access ends on revocation: unknown. null

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- How to revoke one user's refresh token
- Whether deactivating a client invalidates already-issued 24h JWT access tokens.
- Whether client secrets can be rotated without recreating the client, and whether they expire.
- Admin audit log events for OAuth client creation, edits, secret views or deactivation.
- Whether customers can view the API telemetry data (docs describe 'internal reporting').
- Whether Coupa SAML SSO settings affect OAuth token use or API key use.
- Whether any legacy API keys still authenticate on current releases.

## Sources
- [OpenID Connect Clients](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/oauth-2.0-and-oidc/openid-connect-clients) (retrieved 2026-10-14)
- [Set Up Okta User Provisioning with OAuth 2.0](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/oauth-2.0-and-oidc/set-up-okta-user-provisioning-with-oauth-2.0) (retrieved 2026-10-14)
- [OAuth 2.0 and OIDC (Coupa Documentation)](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/oauth-2.0-and-oidc) (retrieved 2026-10-14)
- [Get Started with the API](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/get-started-with-the-api) (retrieved 2026-10-14)
- [OAuth 2.0 Getting Started with Coupa API (Revised 25 February 2026)](https://compass.coupa.com/en-us/products/total-spend-management-platform/integration-playbooks-and-resources/integration-knowledge-articles/oauth-2.0-getting-started-with-coupa-api) (retrieved 2026-10-14)
