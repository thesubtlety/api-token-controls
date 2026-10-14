# OpenText Cloud Platform: Confidential service client (organization, extension app, tenant-level or app-level) - client credentials

`opentext-1` · OAuth · service. Admin Center creates confidential OAuth clients at organization, tenant or app level (and for each extension app of a Core SaaS app such as Core Content). The holder posts client_id and client_secret to https://<region>.api.opentext.com/tenants/<tenant>/oauth2/token (or the organizations/... endpoint) and gets a bearer token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin Center > Service clients page lists the clients; the Admin API has GET /organizations/{organizationId}/clients (Get service clients). | Admin Center > Service clients page lists the clients; the Admin API has GET /organizations/{organizationId}/clients (Get service clients). |
| Protect: Admin can block or require approval | Yes | Deactivate service client (activate=false) | Deactivate service client (activate=false): PATCH /admin/api/v1/organizations/{organizationId}/apps/{appId}/clients/{clientId}?activate=false (or /organizations/{organizationId}/clients/{clientId}) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No IP allowlist for service clients or tokens found in the developer docs or Admin API spec. |  |
| Protect: Expires automatically | Partial | Access token 900-28800 s per client; secret expiry not documented | Regenerate client: Admin Center > Service clients > More options > Regenerate client · Edit token lifetimes: Admin Center > Service clients > More options > Edit token lifetimes; Admin API Client.accessTokenLifetime / refreshTokenLifetime |
| Detect: Usage appears in logs | No docs found | No log source found. |  |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Docs say Revoke client revokes an access token but do not state scope or timing. |  |
| Respond: Stops working when user is removed | N/A | Service clients belong to the organization (or app/tenant), not to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Regenerate client** (Require rotation; all plans; default unknown). Issues a new client secret for a confidential client. Where: Admin Center > Service clients > More options > Regenerate client.
- **Edit token lifetimes** (Limit lifetime; all plans; default unknown). Sets access (900-28800 s) and refresh (900 s-1 year) token lifetimes per client. Where: Admin Center > Service clients > More options > Edit token lifetimes; Admin API Client.accessTokenLifetime / refreshTokenLifetime.
- **Deactivate service client (activate=false)** (Disable; all plans; default unknown). Deactivates an app or organization service client through the Admin API. Where: PATCH /admin/api/v1/organizations/{organizationId}/apps/{appId}/clients/{clientId}?activate=false (or /organizations/{organizationId}/clients/{clientId}).
- **Client level (organization / tenant / app)** (Limit resources; all plans; default varies). Choosing an app-level client limits access to one application instead of the whole tenant or organization. Where: Admin Center > Integrations > Service Clients at tenant or app level.
- **allowedScopes** (Limit scope; all plans; default unknown). Lists the scopes a client may request. Where: Admin API Client.allowedScopes.
- **Tenant Admin role on service client** (Limit scope; all plans; default unknown). Controls whether a tenant service client gets the Tenant administrator role. Where: Tenant > Integration > Service Clients > Add > Tenant Admin role.

- Network: unknown (checked at unknown). No IP allowlist for service clients or tokens found in the developer docs or Admin API spec.
- Lifetime: Access token 900-28800 s per client; secret expiry not documented. Renewal: Client requests a new token with the same secret; secret changes only when an admin regenerates it.
- Keyless option: not_applicable. Client credentials carry no user, so no IdP sign-in occurs. The docs do not say how SSO or conditional access policies relate to service clients.
- Conditions: Every new or extended app gets a client pair automatically.

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
- recon: `POST https://<region>.api.opentext.com/tenants/<tenant_id>/oauth2/token (client_credentials)`. Whether the client works and its token Logged: unknown. 
- collection (bulk): `GET /v3/files (Core Content)`. Files the client can reach Logged: unknown. 
- enumeration (bulk): `GET /admin/api/v1/organizations/{organizationId}/tenants/{tenantId}/users`. All tenant users (organization client via Admin API) Logged: unknown. 

### What to look for (analyst guidance)
- Tenant-level clients with Tenant administrator role
- Organization-level clients used against many tenants
- Secret regenerations not tied to change tickets

## Respond: how to revoke it
- Admin: **Revoke client**. Revokes access tokens for a confidential service client. Where: Admin Center > Service clients > More options > Revoke client.

Admin Center > Service clients > Revoke client, then Regenerate client; or PATCH the client with activate=false. Live access ends on revocation: unknown. Docs say Revoke client revokes an access token but do not state scope or timing.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Usage appears in logs
- Data reads appear in logs
- Revocation ends active access
- Audit event names and log location
- Token format
- A documented whoami/introspection endpoint
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
- [Managing the extension (SaaS application extension)](https://developer.opentext.com/cloud-platform/products/ocp/documentation/saas-application-extension-developer-concepts-overview) (retrieved 2026-10-14)
- [Administration API (OpenAPI spec)](https://developer.opentext.com/saasapps/products/developer-admin/apis/developer-administration-api) (retrieved 2026-10-14)
- [Core Capture - Getting started](https://developer.opentext.com/saasapps/products/core-capture/documentation/getting-started) (retrieved 2026-10-14)
- [Integrating Okta with OpenText using SAML (and SCIM)](https://developer.opentext.com/cloud-platform/products/ocp/tutorials/okta-saml-and-scim-integration-for-opentext-applications) (retrieved 2026-10-14)
