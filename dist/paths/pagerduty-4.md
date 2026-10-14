# PagerDuty: User OAuth token (Scoped OAuth and Classic User OAuth apps)

`pagerduty-4` · OAuth · person. Authorization-code + PKCE flow; the user logs in and consents, and the app gets a Bearer token acting as that user, limited to the intersection of app scopes and user permissions. Classic apps use coarse read/write scopes.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Integrations > OAuth Apps: for each installed app admins see everyone who authorized it and when. Private apps are managed on a separate page. | Integrations > OAuth Apps: for each installed app admins see everyone who authorized it and when. Private apps are managed on a separate page. |
| Protect: Admin can block or require approval | Yes | Install (admin approval) of public OAuth apps | Install (admin approval) of public OAuth apps: App installation page > Install on your account |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Not available | IP allow list applies to web/mobile sessions, not REST API calls or integrations. |  |
| Protect: Expires automatically | Yes | Scoped: 1-day access, 30-day refresh, 1-year window. Classic: 30-day access, 210-day refresh, 3-year window. | API: Fixed lifetimes (Scoped 1 day/30 days/1 year; Classic 30 days/210 days/3 years); token response from https://identity.pagerduty.com/oauth/token field expires_in |
| Detect: Usage appears in logs | Yes | method.truncated_token, actors[] | Audit Trail (UI + GET /audit/records): Business, Enterprise for Incident Management, Digital Operations (legacy); 12-month retention; config changes on users, teams, schedules, escalation policies, services, IP allow lists only. Admin / global API token, scope audit_records.read. |
| Detect: Data reads appear in logs | Not available | Audit records cover configuration changes only. |  |
| Respond: Revocation ends active access | Partial | Revoke All runs in the background; delegation deletion is synchronous. | Integrations > OAuth Apps > app > Revoke All User Tokens or Uninstall; per-user: DELETE /oauth_delegations or admin password change. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Install (admin approval) of public OAuth apps** (Require approval; all plans; default on). A public Scoped OAuth app cannot access the account until an Admin installs it and approves its scopes. Where: App installation page > Install on your account.
- **Scoped OAuth scopes** (Limit scope; all plans; default varies). Per-resource read/write scopes (e.g. incidents.read) limit what the token can call. Where: App Registration > OAuth > Scoped OAuth.

### Not available (vendor states)
- No IP/network restriction for OAuth user tokens.
- Deleting an app's OAuth functionality does not revoke tokens already issued.

- Network: excluded (checked at login_only). IP allow list applies to web/mobile sessions, not REST API calls or integrations.
- Lifetime: Scoped: 1-day access, 30-day refresh, 1-year window. Classic: 30-day access, 210-day refresh, 3-year window.. Renewal: Refresh grant returns new access and refresh tokens.
- Keyless option: limited. The grant requires an interactive user login, which goes through the account login (SSO if configured); whether SSO policy is rechecked on refresh is not documented.
- Conditions: Admin install gate applies to public Scoped OAuth apps; Classic app gating not stated.

## Detect: what gets logged
- Token prefix: `pdus+`

### Logs
- Audit Trail (UI + GET /audit/records): Business, Enterprise for Incident Management, Digital Operations (legacy); 12-month retention; config changes on users, teams, schedules, escalation policies, services, IP allow lists only. Admin / global API token, scope audit_records.read.

### Fields that identify the credential
- `method.truncated_token` (Audit record): Last 4 chars when method.type=oauth.
- `actors[]` (Audit record): Authorizing user and/or app reference.

### Lifecycle events
- create: `App install (audit trail event)` Installing an app creates an audit trail event; exact name not documented.
- use: `action=create|update|delete with method.type=oauth` Config changes.

### Correlate on
`method.type`, `method.truncated_token`, `actors[].type/id`, `execution_context.request_id`, `execution_context.remote_address`

### API calls a holder can make, and whether they are logged
- recon: `GET /users/me`. Authorizing user Logged: unknown. 
- collection (bulk): `GET /incidents`. Incidents visible to user within scopes Logged: unknown. 
- collection: `GET /users`. Users the authorizing person can see (needs users.read scope) Logged: no. Audit records cover configuration changes only.

### What to look for (analyst guidance)
- New installs or unknown authorizers on OAuth Apps page
- Classic apps with write scope

## Respond: how to revoke it
- Admin: **Revoke All User Tokens**. Admin revokes every user token issued for an installed app; runs in the background. Where: Integrations > OAuth Apps > (app) > Revoke All User Tokens.
- Admin: **Uninstall**. Revokes all user tokens for the app and blocks reauthorization until reinstalled. Where: Integrations > OAuth Apps > (app) > Uninstall.
- Admin: **Revoke All Tokens (App Registration)**. App owner invalidates all OAuth tokens issued to the app. Where: Integrations > Developer Tools > App Registration > app > OAuth Client > Revoke All Tokens.
- Admin: **Delete all OAuth delegations**. Revokes a user's mobile or web delegations (signs them out). Where: DELETE /oauth_delegations?user_id=..&type=mobile,web.
- Admin: **Change Another User's Password**. Admin password change also revokes the user's OAuth tokens. Where: People > Users > user > User Settings > Change Password.

Integrations > OAuth Apps > app > Revoke All User Tokens or Uninstall; per-user: DELETE /oauth_delegations or admin password change. Live access ends on revocation: partial. Revoke All runs in the background; delegation deletion is synchronous.

## No vendor documentation found
- SSO and MFA rules apply
- Stops working when user is removed
- Exact audit event names for install/uninstall/revoke
- Scope required for GET /users/me under Scoped OAuth.
- Whether general access or user token keys can be given an expiry, or ever expire.
- Whether SSO enforcement or deprovisioning in the IdP affects existing API keys (only "user leaves the account" disables user keys).
- Any admin setting to block users from creating user token keys or to block Classic User OAuth app authorization.
- Whether API key create/disable/delete events appear in the Audit Trail (the tracked resource list does not include API keys).
- Whether disabling/deleting a key or Revoke All User Tokens ends in-flight access immediately (Revoke All runs in the background).
- Whether private app (client credentials) tokens can be revoked by admins other than the app owner; client secret expiry/rotation.
- Whether read (GET) API calls are logged anywhere customer-visible.
- Whether integration key creation/rotation appears in audit records (support page says integration add/remove is not captured; Audit API lists Integrations as an associated resource of Services).

## Sources
- [OAuth Functionality](https://docs.pagerduty.com/developer/oauth-functionality) (retrieved 2026-10-14)
- [Private Apps](https://docs.pagerduty.com/developer/private-apps) (retrieved 2026-10-14)
- [IP Allow List for User Sessions](https://support.pagerduty.com/main/docs/ip-allow-list-for-user-sessions) (retrieved 2026-10-14)
- [Scoped OAuth Apps](https://support.pagerduty.com/main/docs/scoped-oauth-apps) (retrieved 2026-10-14)
- [Audit Trail Reporting](https://support.pagerduty.com/main/docs/audit-trail-reporting) (retrieved 2026-10-14)
- [Audit Records API](https://docs.pagerduty.com/developer/audit-records-api) (retrieved 2026-10-14)
- [REST API OpenAPI spec — List audit records](https://docs.pagerduty.com/api-specs/rest.json) (retrieved 2026-10-14)
- [User Settings](https://support.pagerduty.com/main/docs/user-settings) (retrieved 2026-10-14)
- [PagerDuty REST API OpenAPI v3 spec - List users](https://github.com/PagerDuty/api-schema/blob/main/reference/REST/openapiv3.json) (retrieved 2026-10-14)
- [Register an App](https://docs.pagerduty.com/developer/register-an-app) (retrieved 2026-10-14)
