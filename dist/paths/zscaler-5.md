# Zscaler: ZPA API key (client ID and client secret, legacy ZPA API)

`zscaler-5` · OAuth · service. ZPA API key = client ID + secret, posted to https://config.private.zscaler.com/signin to get a bearer token for /mgmtconfig endpoints.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | API Keys page (Administration > API > Private Access API) lists all keys with status, role and validity. | API Keys page (Administration > API > Private Access API) lists all keys with status, role and validity. |
| Protect: Admin can block or require approval | Yes | ZPA API key Status | ZPA API key Status: Administration > API > Private Access API > Edit |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented for ZPA API keys. |  |
| Protect: Expires automatically | Yes | Key itself has no documented expiry; session validity up to 3,600 s | Session Validity Interval: Add API Keys > Session Validity Interval |
| Detect: Usage appears in logs | Yes | Client ID | Where: Zscaler Admin Console > Data Explorer > Audit Logs > Private Access; filter Client ID; Download for CSV |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | No docs found | Docs do not say whether issued tokens end before their validity interval (max 3,600 s). |  |
| Respond: Stops working when user is removed | N/A | The key carries its own API role and is not tied to an admin user. |  |

## Protect: what an admin can configure

### Admin controls
- **ZPA API key Status** (Disable; all plans; default on). Disabled keys cannot be used. Where: Administration > API > Private Access API > Edit.
- **ZPA API key Role** (Limit scope; all plans; default unknown). Predefined or custom role (e.g. API Read Only) enforces RBAC on ZPA API operations. Where: Add API Keys > Role.
- **Session Validity Interval** (Limit lifetime; all plans; default unknown). Token lifetime up to 3,600 s. Where: Add API Keys > Session Validity Interval.

- Network: unknown (checked at unknown). Not documented for ZPA API keys.
- Lifetime: Key itself has no documented expiry; session validity up to 3,600 s. Renewal: Call /signin again with the same client ID and secret.
- Keyless option: not_verified. Not documented.
- Conditions: Keys created via Zscaler Deception cannot be edited or deleted here.

## Detect: what gets logged
- Token prefix: not established

### Logs
- ZPA audit logs: Records admin and API actions; Client ID column; 6-month retention.

### Fields that identify the credential
- `Client ID` (ZPA audit logs): API key's client ID that made changes

### Lifecycle events
- use: `Sign In` ZPA audit action
- use: `Sign In Failure` ZPA audit action
- revoke: `Delete` Generic action

### Correlate on
`Client ID`, `Request ID`, `Transaction ID`

### API calls a holder can make, and whether they are logged
- recon: `POST https://config.private.zscaler.com/signin`. Bearer token Logged: yes (`Sign In`). ZPA audit action list includes Sign In
- enumeration (bulk): `GET /mgmtconfig/v1/admin/customers/{customerId}/application`. All application segments Logged: unknown. ZPA audit log documents changes and sign-ins, not reads

### What to look for (analyst guidance)
- Changes by an unfamiliar Client ID
- Sign In Failure bursts

## Respond: how to revoke it
- Admin: **Delete ZPA API key**. Remove a key. Where: Administration > API > Private Access API.

Disable or delete the ZPA API key. Live access ends on revocation: unknown. Docs do not say whether issued tokens end before their validity interval (max 3,600 s).

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Whether data reads are audited
- Source-IP restriction for OneAPI clients, ZPA keys or legacy ZIA sessions (Admin Sign-On Policy and ZIA restricted admin access pages do not state API coverage)
- Whether the Authentication Service Admin Sign-On Policy or MFA applies to legacy ZIA API password logins
- Whether deleting/disabling a ZPA API key or ZIA authorization server ends already-issued bearer tokens
- Whether API client create/delete and token revoke appear as named actions in Authentication Service audit logs (documented actions are generic Create/Update/Delete)
- Whether read-only (GET) API calls are recorded in any audit log
- Expiry of JWT key pairs (zscaler-2) and Sandbox tokens
- OneAPI rate limits (only legacy limits fetched)

## Sources
- [About API Key Management](https://help.zscaler.com/zpa/about-api-key-management) (retrieved 2026-10-14)
- [Getting Started (ZPA API)](https://help.zscaler.com/legacy-apis/getting-started-zpa-api) (retrieved 2026-10-14)
- [Adding API Keys](https://help.zscaler.com/zpa/adding-api-keys) (retrieved 2026-10-14)
- [About Audit Logs (Private Access)](https://help.zscaler.com/zpa/about-audit-logs) (retrieved 2026-10-14)
- [Understanding Rate Limiting](https://help.zscaler.com/legacy-apis/understanding-rate-limiting) (retrieved 2026-10-14)
