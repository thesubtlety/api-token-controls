# MuleSoft Anypoint: Anypoint Platform bearer token (user token from /accounts/login or SAML assertion)

`mulesoft-3` · Personal access token · person. A user exchanges username/password at /accounts/login, or an IdP-initiated SAML response at the provider receive-id endpoint, for a bearer token with that user's permissions. Used by the CLI --bearer option.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Partial | Federated users get the token through an IdP-initiated SAML assertion, but non-federated users keep using Anypoint credentials and /accounts/login. | Where: Access Management > Identity Providers > SAML 2.0 (configure IdP); MFA for SSO users is set in the IdP |
| Protect: IP restriction | Conditional | Applies to sign-ins with Anypoint credentials; not to SSO users. Not documented for API calls with an issued token. | IP Allowlist (Enforce IP restrictions for login): Access Management > Security Settings > IP Allowlist |
| Protect: Expires automatically | Partial | Default Session Timeout (15-180 min) Admin control: Default session timeout. | Default session timeout: Access Management > Business Groups > root org > Settings |
| Detect: Usage appears in logs | Yes | User Name | Anypoint Platform audit log (Access Management > Audit Log, Audit Log Query API): Default retention 1 year (6 years for orgs before 2023-07-10), configurable 30-2190 days; export via Telemetry Exporter needs Anypoint Integration Advanced or Titanium. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Partial | The user can end their own session with GET /accounts/logout; no admin-side per-token revoke is documented. Otherwise the token lasts until the Default Session Timeout. | Disable/remove the user or wait for session timeout. |
| Respond: Stops working when user is removed | Partial | Deleting a user in the IdP does not remove them from Anypoint; they must be deleted manually. Token validity follows the Default Session Timeout. |  |

## Protect: what an admin can configure

### Admin controls
- **IP Allowlist (Enforce IP restrictions for login)** (Limit network; US and EU commercial clouds only; default off). Blocks sign-ins with Anypoint credentials from outside allowed IPv4 CIDRs; users can be exempted. Where: Access Management > Security Settings > IP Allowlist.
- **Default session timeout** (Limit lifetime; all plans; default on). Sets inactivity timeout that bounds bearer token validity (15-180 min). Where: Access Management > Business Groups > root org > Settings.

### Not available (vendor states)
- IP allowlist does not apply to users who authenticate through SSO, so SAML-derived bearer tokens are not IP-restricted by it.

- Network: conditional (checked at login_only). Applies to sign-ins with Anypoint credentials; not to SSO users. Not documented for API calls with an issued token.
- Lifetime: Default Session Timeout (15-180 min). Renewal: Log in again to get a new token.
- Keyless option: not_applicable. User token; SAML exchange requires IdP-initiated SSO.
- Conditions: MuleSoft says CLI use moves to connected apps.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Anypoint Platform audit log (Access Management > Audit Log, Audit Log Query API): Default retention 1 year (6 years for orgs before 2023-07-10), configurable 30-2190 days; export via Telemetry Exporter needs Anypoint Integration Advanced or Titanium.

### Fields that identify the credential
- `User Name` (audit log): Actions attributed to the user; no token ID documented

### Lifecycle events
- create: `Login success` Logged only at org level
- other: `Login failure` SSO via LDAP/OIDC failures not logged

### Correlate on
`User Name`, `Time`

### API calls a holder can make, and whether they are logged
- recon: `GET /accounts/api/me`. Caller identity and organization Logged: unknown. No read events documented
- recon: `GET /accounts/api/profile`. Profile (for CC apps: owner id) Logged: unknown. 
- discovery (bulk): `GET /api/organizations/{orgId}/environments`. Environments Logged: unknown. CLI equivalent: anypoint-cli-v4 account:environment:list
- collection (bulk): `POST /audit/v2/organizations/{orgId}/query`. Audit history Logged: unknown. Needs Audit Log Viewer or Org Admin

### What to look for (analyst guidance)
- Login from unexpected IP (IP allowlist blocks are logged)
- API-style activity under a human account

## Respond: how to revoke it


Disable/remove the user or wait for session timeout. Live access ends on revocation: partial. The user can end their own session with GET /accounts/logout; no admin-side per-token revoke is documented. Otherwise the token lasts until the Default Session Timeout.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- Data reads appear in logs
- Whether disabling a user kills live bearer tokens
- Token identifier in logs
- Which data reads appear in audit log
- Whether IP allowlist applies to connected app token requests or API calls with an issued token
- Whether deleting a client-credentials app or rotating its secret invalidates unexpired access tokens
- Whether a client-credentials app's tokens can be revoked without deleting it (Revoke Authorization is documented for user authorizations)
- Exact UI setting name for disabling connected apps org-wide
- Whether read/GET API calls are audit logged
- Environment client secret rotation procedure (help.salesforce.com KB 001115221 did not render)
- Bearer token format/prefix
- Whether IdP conditional access applies to connected app tokens (not stated)

## Sources
- [Access Management API - Authentication](https://anypoint.mulesoft.com/exchange/portals/anypoint-platform/f1e97bc6-315a-4490-82a7-23abe036327a.anypoint-platform/access-management-api/minor/1.0/pages/Authentication) (retrieved 2026-10-14)
- [Obtaining an API Bearer Token Using a SAML Assertion](https://docs.mulesoft.com/access-management/saml-bearer-token) (retrieved 2026-10-14)
- [Authentication to the Anypoint Platform CLI](https://docs.mulesoft.com/anypoint-cli/latest/auth) (retrieved 2026-10-14)
- [Managing IP Allowlists in Access Management](https://docs.mulesoft.com/access-management/managing-ip-allowlists) (retrieved 2026-10-14)
- [Managing Business Groups in Anypoint Platform](https://docs.mulesoft.com/access-management/organization) (retrieved 2026-10-14)
- [Enabling and Managing Multi-Factor Authentication in Anypoint Platform](https://docs.mulesoft.com/access-management/multi-factor-authentication) (retrieved 2026-10-14)
- [SSO Prerequisites and Limitations](https://docs.mulesoft.com/access-management/sso-prerequisites-about) (retrieved 2026-10-14)
- [Configuring SAML SSO for Anypoint Platform](https://docs.mulesoft.com/access-management/conf-saml-sso) (retrieved 2026-10-14)
- [Audit Logging in Anypoint Platform](https://docs.mulesoft.com/access-management/audit-logging) (retrieved 2026-10-14)
- [Configure Audit Log Retention in Anypoint Platform](https://docs.mulesoft.com/access-management/audit-log-retention) (retrieved 2026-10-14)
- [Access Management API spec: /connectedApplications/{clientId}/revoke](https://github.com/mulesoft/anypoint-public-api-specs/blob/master/apis/access-management/api.yaml) (retrieved 2026-10-14)
- [Access Management API - Basic Examples](https://anypoint.mulesoft.com/exchange/portals/anypoint-platform/f1e97bc6-315a-4490-82a7-23abe036327a.anypoint-platform/access-management-api/minor/1.0/pages/Basic_Examples) (retrieved 2026-10-14)
