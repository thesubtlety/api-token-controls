# Zscaler: Cloud Service API Key with ZIA admin credentials (legacy ZIA API)

`zscaler-3` · Basic credentials · person. Legacy ZIA API: POST /api/v1/authenticatedSession with admin username, password, an obfuscated 12-character org API key and timestamp; returns a JSESSIONID cookie.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | One key per organization, shown on the Cloud Service API Key page. | One key per organization, shown on the Cloud Service API Key page. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Not available | API login uses a username and password for an admin hosted on Authentication Service; IdP-provisioned admins cannot use the API, so IdP SSO is not in the path. |  |
| Protect: IP restriction | No docs found | No IP restriction for API sessions is documented on the API pages fetched. |  |
| Protect: Expires automatically | Not available | Org key never expires; session cookie expires in 5 minutes by default |  |
| Detect: Usage appears in logs | Yes | Admin ID, Client IP | ZIA audit logs: Data Explorer > Audit Logs > Internet & SaaS; records Admin UI and API actions; 6-month retention; NSS admin audit feed. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Yes | Docs: deleting the key ensures no further API requests are possible; old key invalidated immediately. | Regenerate, edit or delete the Cloud Service API Key; reset or remove the admin account used. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Admin role functional scope** (Limit scope; API subscription; default varies). Key access is given only to admins with functional scope for API services. Where: ZIA admin roles.

### Not available (vendor states)
- Admins provisioned through a third-party IdP cannot use the legacy ZIA API, so this path needs a password admin hosted in Authentication Service outside IdP SSO.

- Network: unknown (checked at unknown). No IP restriction for API sessions is documented on the API pages fetched.
- Lifetime: Org key never expires; session cookie expires in 5 minutes by default. Renewal: Re-POST /authenticatedSession with the same key and password.
- Keyless option: not_applicable. Password-based; in Authentication Service tenants, users provisioned via third-party IdPs cannot authenticate to the APIs.
- Conditions: Requires API subscription; Zscaler may disable the key for abuse.

## Detect: what gets logged
- Token prefix: not established

### Logs
- ZIA audit logs: Data Explorer > Audit Logs > Internet & SaaS; records Admin UI and API actions; 6-month retention; NSS admin audit feed.

### Fields that identify the credential
- `Admin ID` (ZIA audit logs): Admin login used with the key
- `Client IP` (ZIA audit logs): Source IP

### Lifecycle events
- use: `Sign In` ZIA audit action
- use: `Sign Out` ZIA audit action
- create: `Cloud Service API Key` Audit sub-category for key changes

### Correlate on
`Admin ID`, `Client IP`, `Interface=API`

### API calls a holder can make, and whether they are logged
- recon: `POST /api/v1/authenticatedSession`. Session cookie Logged: yes (`Sign In`). ZIA audit Sign In action; Interface API
- recon: `GET /api/v1/status`. Activation status Logged: unknown. Audit logs record actions; GETs not confirmed
- collection (bulk): `POST /api/v1/urlLookup`. URL categories (up to 100 URLs per request) Logged: unknown. 

### What to look for (analyst guidance)
- Sign In with Interface API from an unexpected IP
- Key regenerate/edit by an unexpected admin

## Respond: how to revoke it
- Admin: **Delete / regenerate / edit Cloud Service API Key**. Any of these immediately invalidates the old key. Where: Administration > API > Internet & SaaS API > Cloud Service API Key.
- Admin: **Delete the API key**. Deleting the organization's only Cloud Service API key stops all legacy ZIA API requests until a new key is added. Where: Administration > API > Internet & SaaS API > Cloud Service API Key > Delete.

Regenerate, edit or delete the Cloud Service API Key; reset or remove the admin account used. Live access ends on revocation: yes. Docs: deleting the key ensures no further API requests are possible; old key invalidated immediately.

## No vendor documentation found
- Admin can block or require approval
- IP restriction
- Data reads appear in logs
- Stops working when user is removed
- Whether an existing JSESSIONID survives key deletion for its remaining minutes
- Whether GET calls are audited
- Source-IP restriction for OneAPI clients, ZPA keys or legacy ZIA sessions (Admin Sign-On Policy and ZIA restricted admin access pages do not state API coverage)
- Whether the Authentication Service Admin Sign-On Policy or MFA applies to legacy ZIA API password logins
- Whether deleting/disabling a ZPA API key or ZIA authorization server ends already-issued bearer tokens
- Whether API client create/delete and token revoke appear as named actions in Authentication Service audit logs (documented actions are generic Create/Update/Delete)
- Whether read-only (GET) API calls are recorded in any audit log
- Expiry of JWT key pairs (zscaler-2) and Sandbox tokens
- OneAPI rate limits (only legacy limits fetched)

## Sources
- [About Cloud Service API Key](https://help.zscaler.com/zia/about-cloud-service-api-key) (retrieved 2026-10-14)
- [Getting Started (ZIA API)](https://help.zscaler.com/legacy-apis/getting-started-zia-api) (retrieved 2026-10-14)
- [Managing Cloud Service API Key](https://help.zscaler.com/zia/managing-cloud-service-api-key) (retrieved 2026-10-14)
- [About Audit Logs (Internet & SaaS)](https://help.zscaler.com/zia/about-audit-logs) (retrieved 2026-10-14)
