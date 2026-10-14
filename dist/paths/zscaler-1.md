# Zscaler: OneAPI API client (client secret)

`zscaler-1` · OAuth · service. An API client in Authentication Service (ZIdentity) uses the OAuth 2.0 client credentials grant with a client ID and secret at <tenant>.zslogin.net/oauth2/v1/token (audience https://api.zscaler.com) and gets a JWT access token for OneAPI.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | API Clients page (Administration > API > API Clients) lists all clients and exports CSV; issued tokens on Administration > API > Tokens. | API Clients page (Administration > API > API Clients) lists all clients and exports CSV; issued tokens on Administration > API > Tokens. |
| Protect: Admin can block or require approval | Yes (requires Authentication Service (ZIdentity)) | API client Status (enable/disable) | API client Status (enable/disable): Administration > API > API Clients > Edit |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | API Client Access Policy criteria are time and API resources only; no source-IP criterion is documented. Whether the Admin Sign-On Policy applies to API clients is not stated. |  |
| Protect: Expires automatically | Yes | Secret 30-365 days; access token 1 min-24 h | Access Token Validity: Add/Edit API Client > Access Token Validity · Client secret validity: Add API Client > Secret |
| Detect: Usage appears in logs | Yes | Client ID / JTI, Trace ID, Client ID, Transaction ID | Authentication Service Issued Tokens page: Administration > API > Tokens; lists Client ID, JTI, issued/expires, status. · Authentication Service audit logs: Data Explorer > Audit Logs > Authentication Service; Interface field shows API-based; stream to SIEM via NSS (auditlogtype ZID). · ZIA audit logs: Data Explorer > Audit Logs > Internet & SaaS; records Admin UI and API actions; 6-month retention; NSS admin audit feed. · ZPA audit logs: Records admin and API actions; Client ID column; 6-month retention. |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | Yes | Revoked tokens can no longer be used; disabling the client revokes its tokens. | Disable or delete the API client (revokes its tokens), or revoke individual tokens on the Tokens page; remove secrets/keys. |
| Respond: Stops working when user is removed | N/A | An API client represents an application or service, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **API client Status (enable/disable)** (Disable; Authentication Service (ZIdentity); default on). A disabled client cannot get tokens, and its issued tokens are revoked. Where: Administration > API > API Clients > Edit.
- **Access Token Validity** (Limit lifetime; all plans; default unknown). Sets token lifetime from 1 minute to 24 hours. Where: Add/Edit API Client > Access Token Validity.
- **Client secret validity** (Limit lifetime; all plans; default unknown). Secrets expire after 30-365 days. Where: Add API Client > Secret.
- **API resources (scope)** (Limit scope; all plans; default unknown). Client gets one API role per Zscaler service. Where: Add API Client > Resources tab.
- **API Client Access Policy** (Limit scope; all plans; default off). Allow/Block rules by API resource and time window, one rule per client. Where: Administration > API > API Client Access Policy.

- Network: unknown (checked at unknown). API Client Access Policy criteria are time and API resources only; no source-IP criterion is documented. Whether the Admin Sign-On Policy applies to API clients is not stated.
- Lifetime: Secret 30-365 days; access token 1 min-24 h. Renewal: Request a new token with the secret; rotate by adding a second secret (max two; a third replaces the most recent).
- Keyless option: not_verified. Docs do not describe workload/OIDC federation for secret-based clients.
- Conditions: Zscaler services must be linked to Authentication Service; up to 256 API clients per tenant.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Authentication Service Issued Tokens page: Administration > API > Tokens; lists Client ID, JTI, issued/expires, status.
- Authentication Service audit logs: Data Explorer > Audit Logs > Authentication Service; Interface field shows API-based; stream to SIEM via NSS (auditlogtype ZID).
- ZIA audit logs: Data Explorer > Audit Logs > Internet & SaaS; records Admin UI and API actions; 6-month retention; NSS admin audit feed.
- ZPA audit logs: Records admin and API actions; Client ID column; 6-month retention.

### Fields that identify the credential
- `Client ID / JTI` (Issued Tokens page): Search tokens by either
- `Trace ID` (ZIA audit logs): Generated for ZIA requests via OneAPI
- `Client ID` (ZPA audit logs): API key client ID that made changes
- `Transaction ID` (ZPA audit logs): Created by OneAPI; visible when Authentication Service enabled

### Lifecycle events
- create: `Create` Generic Authentication Service audit action; client-specific category not listed
- revoke: `Delete` Generic action

### Correlate on
`Client ID`, `JTI`, `Trace ID`, `Transaction ID`, `Client IP`

### API calls a holder can make, and whether they are logged
- recon: `POST <tenant>.zslogin.net/oauth2/v1/token`. Access token; resources granted Logged: unknown. Visible on Issued Tokens page

### What to look for (analyst guidance)
- Tokens issued for a client outside its normal schedule (Issued At filter)
- ZIA/ZPA changes with Interface API from unexpected Client IP
- New secret added to an existing client

## Respond: how to revoke it
- Admin: **Delete API client**. Deleting a client revokes its tokens. Where: Administration > API > API Clients.
- Admin: **Revoke access token**. Revoke a single active token by Client ID or JTI. Where: Administration > API > Tokens > Revoke.

Disable or delete the API client (revokes its tokens), or revoke individual tokens on the Tokens page; remove secrets/keys. Live access ends on revocation: yes. Revoked tokens can no longer be used; disabling the client revokes its tokens.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Exact audit event name for API client and token actions
- Whether token issuance is itself audited
- Documented OneAPI whoami endpoint
- Whether OneAPI GET calls are logged
- Source-IP restriction for OneAPI clients, ZPA keys or legacy ZIA sessions (Admin Sign-On Policy and ZIA restricted admin access pages do not state API coverage)
- Whether the Authentication Service Admin Sign-On Policy or MFA applies to legacy ZIA API password logins
- Whether deleting/disabling a ZPA API key or ZIA authorization server ends already-issued bearer tokens
- Whether API client create/delete and token revoke appear as named actions in Authentication Service audit logs (documented actions are generic Create/Update/Delete)
- Whether read-only (GET) API calls are recorded in any audit log
- Expiry of JWT key pairs (zscaler-2) and Sandbox tokens
- OneAPI rate limits (only legacy limits fetched)

## Sources
- [Adding an API Client](https://help.zscaler.com/authentication-service/adding-api-client) (retrieved 2026-10-14)
- [Understanding OneAPI Authentication](https://help.zscaler.com/authentication-service/understanding-oneapi-authentication) (retrieved 2026-10-14)
- [Using Zscaler Microsegmentation API](https://help.zscaler.com/legacy-apis/using-zscaler-microsegmentation-api) (retrieved 2026-10-14)
- [About the API Client Access Policy](https://help.zscaler.com/authentication-service/about-api-client-access-policy) (retrieved 2026-10-14)
- [Adding API Client Access Policy Rule](https://help.zscaler.com/authentication-service/adding-api-client-access-policy-rule) (retrieved 2026-10-14)
- [About API Clients](https://help.zscaler.com/authentication-service/about-api-clients) (retrieved 2026-10-14)
- [Viewing API Resources](https://help.zscaler.com/authentication-service/viewing-api-resources) (retrieved 2026-10-14)
- [Admin Roles and Permissions](https://help.zscaler.com/authentication-service/admin-roles-and-permissions) (retrieved 2026-10-14)
- [Ranges & Limitations](https://help.zscaler.com/unified/ranges-limitations) (retrieved 2026-10-14)
- [About Access Tokens](https://help.zscaler.com/authentication-service/about-access-tokens) (retrieved 2026-10-14)
- [Revoking Access Tokens](https://help.zscaler.com/authentication-service/revoking-access-tokens) (retrieved 2026-10-14)
- [About Audit Logs](https://help.zscaler.com/authentication-service/about-audit-logs) (retrieved 2026-10-14)
- [About Audit Logs (Internet & SaaS)](https://help.zscaler.com/zia/about-audit-logs) (retrieved 2026-10-14)
- [About Audit Logs (Private Access)](https://help.zscaler.com/zpa/about-audit-logs) (retrieved 2026-10-14)
- [NSS Feed Output Format: Admin Audit Logs](https://help.zscaler.com/zia/nss-feed-output-format-admin-audit-logs) (retrieved 2026-10-14)
