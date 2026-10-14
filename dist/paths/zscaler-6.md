# Zscaler: Sandbox API Token with ZIA admin credentials

`zscaler-6` · Basic credentials · person. Sandbox Submission API uses an org API token plus ZIA admin username and password to create a session.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Sandbox API Token page (Administration > API > Internet & SaaS API > Sandbox API Token). | Sandbox API Token page (Administration > API > Internet & SaaS API > Sandbox API Token). |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | Not available | No token expiry documented |  |
| Detect: Usage appears in logs | Yes | Admin ID | ZIA audit logs: Data Explorer > Audit Logs > Internet & SaaS; records Admin UI and API actions; 6-month retention; NSS admin audit feed. |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | No docs found | Regeneration immediately invalidates the old token; effect on open sessions not stated. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Admin role functional scope** (Limit scope; API subscription; default varies). Key access is given only to admins with functional scope for API services. Where: ZIA admin roles.

- Network: unknown (checked at unknown). Not documented.
- Lifetime: No token expiry documented. Renewal: Reuse token and admin credentials to create a new session.
- Keyless option: not_applicable. Password-based; same Authentication Service restriction as zscaler-3.
- Conditions: Requires Sandbox subscription.

## Detect: what gets logged
- Token prefix: not established

### Logs
- ZIA audit logs: Data Explorer > Audit Logs > Internet & SaaS; records Admin UI and API actions; 6-month retention; NSS admin audit feed.

### Fields that identify the credential
- `Admin ID` (ZIA audit logs): Admin login used

### Lifecycle events
- use: `Sandbox` ZIA audit category/sub-category; exact token events not documented

### Correlate on
`Admin ID`, `Client IP`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Sandbox submissions from unexpected admins

## Respond: how to revoke it
- Admin: **Regenerate / delete Sandbox API token**. Regenerating immediately invalidates the old token. Where: Administration > API > Internet & SaaS API > Sandbox API Token.
- Admin: **Delete the API token**. Deleting the Sandbox API tokens stops Sandbox Submission API requests. Where: Administration > API > Internet & SaaS API > Sandbox API Token > Delete.

Regenerate or delete the Sandbox API token. Live access ends on revocation: unknown. Regeneration immediately invalidates the old token; effect on open sessions not stated.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- Token-specific audit events
- Sandbox API endpoints not reviewed
- Source-IP restriction for OneAPI clients, ZPA keys or legacy ZIA sessions (Admin Sign-On Policy and ZIA restricted admin access pages do not state API coverage)
- Whether the Authentication Service Admin Sign-On Policy or MFA applies to legacy ZIA API password logins
- Whether deleting/disabling a ZPA API key or ZIA authorization server ends already-issued bearer tokens
- Whether API client create/delete and token revoke appear as named actions in Authentication Service audit logs (documented actions are generic Create/Update/Delete)
- Whether read-only (GET) API calls are recorded in any audit log
- Expiry of JWT key pairs (zscaler-2) and Sandbox tokens
- OneAPI rate limits (only legacy limits fetched)

## Sources
- [About Sandbox API Token](https://help.zscaler.com/zia/about-sandbox-api-token) (retrieved 2026-10-14)
- [Getting Started (ZIA API)](https://help.zscaler.com/legacy-apis/getting-started-zia-api) (retrieved 2026-10-14)
- [About Audit Logs (Internet & SaaS)](https://help.zscaler.com/zia/about-audit-logs) (retrieved 2026-10-14)
- [About Cloud Service API Key](https://help.zscaler.com/zia/about-cloud-service-api-key) (retrieved 2026-10-14)
