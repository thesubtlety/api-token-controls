# OpenText Cloud Platform: User access/refresh tokens via authorization code (confidential) or PKCE (public client)

`opentext-3` · OAuth · person. Users sign in through the tenant oauth2/auth endpoint (and the tenant's authentication handler, e.g. SAML to Okta/Google), and the app exchanges the code for access, refresh and ID tokens. Public clients use PKCE and have no secret.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Deactivate service client (activate=false) | Deactivate service client (activate=false): PATCH /admin/api/v1/organizations/{organizationId}/apps/{appId}/clients/{clientId}?activate=false (or /organizations/{organizationId}/clients/{clientId}) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | Partial | Refresh token up to 1 year; access 900-28800 s | Edit token lifetimes: Admin Center > Service clients > More options > Edit token lifetimes; Admin API Client.accessTokenLifetime / refreshTokenLifetime |
| Detect: Usage appears in logs | No docs found | No log source found. |  |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Docs say Revoke client revokes an access token but do not state scope or timing. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Edit token lifetimes** (Limit lifetime; all plans; default unknown). Sets access (900-28800 s) and refresh (900 s-1 year) token lifetimes per client. Where: Admin Center > Service clients > More options > Edit token lifetimes; Admin API Client.accessTokenLifetime / refreshTokenLifetime.
- **Deactivate service client (activate=false)** (Disable; all plans; default unknown). Deactivates an app or organization service client through the Admin API. Where: PATCH /admin/api/v1/organizations/{organizationId}/apps/{appId}/clients/{clientId}?activate=false (or /organizations/{organizationId}/clients/{clientId}).
- **allowedScopes** (Limit scope; all plans; default unknown). Lists the scopes a client may request. Where: Admin API Client.allowedScopes.
- **Redirect URLs** (Limit scope; all plans; default on). Only registered redirect URLs can receive authorization codes. Where: Admin Center > Service clients > Redirect URLs.

### Not available (vendor states)
- Public clients cannot be revoked or regenerated in Admin Center (only confidential clients can).

- Network: unknown (checked at unknown). Not documented.
- Lifetime: Refresh token up to 1 year; access 900-28800 s. Renewal: Rotating refresh tokens.
- Keyless option: supported. The interactive sign-in goes through the tenant's configured authentication scheme (e.g. SAML IdP). Whether refresh tokens are re-checked against the IdP is not documented.
- Conditions: 

## Detect: what gets logged
- Token prefix: not established

### Logs
No docs found.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`client ID`, `tenant ID`, `organization ID`

### API calls a holder can make, and whether they are logged
- collection (bulk): `GET /v3/files (Core Content)`. Files the user can reach Logged: unknown. 

### What to look for (analyst guidance)
- Long refresh token lifetimes (up to 1 year)
- Wildcard redirect URLs

## Respond: how to revoke it
- Admin: **Revoke client**. Revokes access tokens for a confidential service client. Where: Admin Center > Service clients > More options > Revoke client.

Revoke the confidential client; for public clients deactivate via Admin API activate=false; disable the user. Live access ends on revocation: unknown. Docs say Revoke client revokes an access token but do not state scope or timing.

## No vendor documentation found
- Admin can list all of them
- SSO and MFA rules apply
- IP restriction
- Usage appears in logs
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- Audit event names and log location
- Token format
- userinfo endpoint not documented
- Audit log for OpenText Cloud Platform / Admin Center: event names for client create, regenerate, revoke and token issuance; retention; how to export.
- Whether API calls or data reads (e.g. Core Content GET /v3/files) are logged and which field identifies the client.
- Whether client secrets expire or can be given an expiry.
- Any IP/network restriction on service clients or tokens.
- Whether 'Revoke client' invalidates already-issued access tokens immediately, and whether it also invalidates the secret.
- Default token lifetimes when not edited (Core Capture sample shows 900 s).
- Whether the password grant can be disabled per tenant, and whether IdP MFA applies to it.
- Token format/prefix.

## Sources
- [API Authentication (OpenText Cloud Platform)](https://developer.opentext.com/cloud-platform/products/ocp/documentation/authentication) (retrieved 2026-10-14)
- [Admin Center guide](https://developer.opentext.com/cloud-platform/products/ocp/documentation/application-administration) (retrieved 2026-10-14)
- [Administration API (OpenAPI spec)](https://developer.opentext.com/saasapps/products/developer-admin/apis/developer-administration-api) (retrieved 2026-10-14)
- [Integrating Okta with OpenText using SAML (and SCIM)](https://developer.opentext.com/cloud-platform/products/ocp/tutorials/okta-saml-and-scim-integration-for-opentext-applications) (retrieved 2026-10-14)
- [Managing the extension (SaaS application extension)](https://developer.opentext.com/cloud-platform/products/ocp/documentation/saas-application-extension-developer-concepts-overview) (retrieved 2026-10-14)
