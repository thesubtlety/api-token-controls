# Zscaler: ZIA OAuth 2.0 with external authorization server (PingFederate, Okta, Entra ID)

`zscaler-4` · Federated identity · service. A client app registered in the customer's IdP gets a client-credentials JWT with scope <cloud>::<orgid>::<API role>; ZIA validates the signature via the server's JWKS and the scope claim.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Zscaler lists configured authorization servers; the individual OAuth clients live in the external IdP. | Where: ZIA Admin Portal > Administration > Cloud Service API Security > OAuth 2.0 Authorization Servers tab (servers only; list OAuth clients in the external IdP) |
| Protect: Admin can block or require approval | Yes (requires API subscription) | OAuth 2.0 Authorization Server status / delete | OAuth 2.0 Authorization Server status / delete: Administration > API > Internet & SaaS API > OAuth 2.0 Authorization Servers |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented on the ZIA side; any IP policy would be the external IdP's. |  |
| Protect: Expires automatically | Partial | Token lifetime set in the external OAuth service | Where: Set in the external OAuth service, e.g. Okta: authorization server > Access Policies > rule > Access token lifetime is. Check expires_in in the token response |
| Detect: Usage appears in logs | Yes | Admin ID, Client IP | ZIA audit logs: Data Explorer > Audit Logs > Internet & SaaS; records Admin UI and API actions; 6-month retention; NSS admin audit feed. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Docs do not say whether ZIA rejects already-issued, unexpired JWTs after IdP-side revocation. |  |
| Respond: Stops working when user is removed | N/A | Client-credentials grant works outside the context of users. |  |

## Protect: what an admin can configure

### Admin controls
- **OAuth 2.0 Authorization Server status / delete** (Disable; API subscription; default unknown). Disable or delete a trusted external authorization server. Where: Administration > API > Internet & SaaS API > OAuth 2.0 Authorization Servers.
- **Required JWT claims (audience, issuer, client ID)** (Limit scope; API subscription; default off). Mandate claim checks on external tokens. Where: OAuth 2.0 Authorization Servers > Add/Edit.
- **API Roles** (Limit scope; API subscription; default unknown). Per-category Full/View Only/None permissions; cannot modify admins. Where: Administration > Role Management > Internet & SaaS > Add API Role.

- Network: unknown (checked at unknown). Not documented on the ZIA side; any IP policy would be the external IdP's.
- Lifetime: Token lifetime set in the external OAuth service. Renewal: Client requests a new token from its IdP.
- Keyless option: supported. ZIA trusts tokens issued by the customer's PingFederate, Okta or Entra ID; audience, issuer and client ID claims can be required.
- Conditions: Requires API subscription and API roles; cloud service API only.

## Detect: what gets logged
- Token prefix: not established

### Logs
- ZIA audit logs: Data Explorer > Audit Logs > Internet & SaaS; records Admin UI and API actions; 6-month retention; NSS admin audit feed.

### Fields that identify the credential
- `Admin ID` (ZIA audit logs): Internal API user oauth-<rolename>$@<orgid>.<cloud-domain>
- `Client IP` (ZIA audit logs): Client application's IP

### Lifecycle events
- create: `OAuth 2.0 Authorization Servers` Audit sub-category for server changes

### Correlate on
`Admin ID (oauth-<rolename>)`, `Client IP`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/v1/status`. Activation status Logged: unknown. Audit logs record actions; GETs not confirmed
- collection (bulk): `POST /api/v1/urlLookup`. URL categories (up to 100 URLs per request) Logged: unknown. 

### What to look for (analyst guidance)
- API changes by oauth-<role> user from unknown IPs
- New authorization server added

## Respond: how to revoke it


Disable or delete the authorization server in ZIA; disable the client in the IdP; tighten the API role. Live access ends on revocation: unknown. Docs do not say whether ZIA rejects already-issued, unexpired JWTs after IdP-side revocation.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Effect of disabling the server on live tokens
- Which IdP client made a call (only role user is logged)
- Whether GET calls are audited
- Source-IP restriction for OneAPI clients, ZPA keys or legacy ZIA sessions (Admin Sign-On Policy and ZIA restricted admin access pages do not state API coverage)
- Whether the Authentication Service Admin Sign-On Policy or MFA applies to legacy ZIA API password logins
- Whether deleting/disabling a ZPA API key or ZIA authorization server ends already-issued bearer tokens
- Whether API client create/delete and token revoke appear as named actions in Authentication Service audit logs (documented actions are generic Create/Update/Delete)
- Whether read-only (GET) API calls are recorded in any audit log
- Expiry of JWT key pairs (zscaler-2) and Sandbox tokens
- OneAPI rate limits (only legacy limits fetched)

## Sources
- [Getting Started (ZIA API)](https://help.zscaler.com/legacy-apis/getting-started-zia-api) (retrieved 2026-10-14)
- [About OAuth 2.0 Authorization Servers](https://help.zscaler.com/zia/about-oauth-2.0-authorization-servers) (retrieved 2026-10-14)
- [Adding API Roles](https://help.zscaler.com/zia/adding-api-roles) (retrieved 2026-10-14)
- [Getting Started (ZIA API)](https://help.zscaler.com/zia/api-getting-started) (retrieved 2026-10-14)
- [Create access policies (Okta)](https://help.okta.com/en-us/content/topics/security/api-config-access-policies.htm) (retrieved 2026-10-14)
- [About Audit Logs (Internet & SaaS)](https://help.zscaler.com/zia/about-audit-logs) (retrieved 2026-10-14)
