# PagerDuty: Scoped OAuth app token (private app, client credentials)

`pagerduty-3` · OAuth · service. A private app with Scoped OAuth exchanges client_id/client_secret at https://identity.pagerduty.com/oauth/token (client_credentials) for a Bearer token limited only by the app's scopes, not by any user.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Private apps are listed under OAuth Apps > Manage Private Apps (and App Registration > My Apps); issued app tokens are not listed. | Private apps are listed under OAuth Apps > Manage Private Apps (and App Registration > My Apps); issued app tokens are not listed. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Not available | IP allow list does not restrict REST API calls. |  |
| Protect: Expires automatically | Yes | Access token 1 day; client secret no documented expiry | API: Fixed 1-day lifetime; POST https://identity.pagerduty.com/oauth/token response field expires_in |
| Detect: Usage appears in logs | Yes | method.truncated_token, actors[] (app_reference) | Audit Trail (UI + GET /audit/records): Business, Enterprise for Incident Management, Digital Operations (legacy); 12-month retention; config changes on users, teams, schedules, escalation policies, services, IP allow lists only. Admin / global API token, scope audit_records.read. |
| Detect: Data reads appear in logs | Not available | Audit records cover configuration changes only. |  |
| Respond: Revocation ends active access | Yes | Docs say Revoke All Tokens invalidates all tokens; app tokens otherwise expire in 1 day. | App Registration > app > OAuth Client > Revoke All Tokens, then delete and recreate OAuth functionality to replace the client secret (revoke first: deleting does not revoke tokens). |
| Respond: Stops working when user is removed | N/A | Client-credentials app tokens have no user involved. |  |

## Protect: what an admin can configure

### Admin controls
- **Scoped OAuth scopes** (Limit scope; all plans; default varies). Per-resource read/write scopes (e.g. incidents.read) limit what the token can call. Where: App Registration > OAuth > Scoped OAuth.
- **App Registration role requirement** (Other; all plans; default on). Only Manager, Global Admin, or Account Owner base roles can register apps, so lower roles cannot create private OAuth apps. Where: Integrations > Developer Tools > App Registration.

### Not available (vendor states)
- No IP/network restriction for OAuth app tokens.

- Network: excluded (checked at login_only). IP allow list does not restrict REST API calls.
- Lifetime: Access token 1 day; client secret no documented expiry. Renewal: App requests a new token with its client secret; no refresh token.
- Keyless option: not_verified. No workload identity federation documented; client secret only.
- Conditions: App tokens are only issued on the account that created the app.

## Detect: what gets logged
- Token prefix: `pdus+`

### Logs
- Audit Trail (UI + GET /audit/records): Business, Enterprise for Incident Management, Digital Operations (legacy); 12-month retention; config changes on users, teams, schedules, escalation policies, services, IP allow lists only. Admin / global API token, scope audit_records.read.

### Fields that identify the credential
- `method.truncated_token` (Audit record): Last 4 chars when method.type=oauth.
- `actors[] (app_reference)` (Audit record): Actor type for app actions.

### Lifecycle events
- use: `action=create|update|delete with method.type=oauth` Config changes.

### Correlate on
`method.type`, `method.truncated_token`, `actors[].type/id`, `execution_context.request_id`, `execution_context.remote_address`

### API calls a holder can make, and whether they are logged
- recon: `GET /abilities`. Account features Logged: unknown. 
- collection (bulk): `GET /incidents`. All incidents (app token not user-bounded) Logged: unknown. 
- collection: `GET /users`. All users (needs users.read scope) Logged: no. Audit records cover configuration changes only.

### What to look for (analyst guidance)
- app_reference actors you do not recognize
- Private apps created by Managers without review

## Respond: how to revoke it
- Admin: **Revoke All Tokens (App Registration)**. App owner invalidates all OAuth tokens issued to the app. Where: Integrations > Developer Tools > App Registration > app > OAuth Client > Revoke All Tokens.

App Registration > app > OAuth Client > Revoke All Tokens, then delete and recreate OAuth functionality to replace the client secret (revoke first: deleting does not revoke tokens). Live access ends on revocation: yes. Docs say Revoke All Tokens invalidates all tokens; app tokens otherwise expire in 1 day.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- App registration/secret events in audit
- Whether GET /users/me works with an app token.
- Whether general access or user token keys can be given an expiry, or ever expire.
- Whether SSO enforcement or deprovisioning in the IdP affects existing API keys (only "user leaves the account" disables user keys).
- Any admin setting to block users from creating user token keys or to block Classic User OAuth app authorization.
- Whether API key create/disable/delete events appear in the Audit Trail (the tracked resource list does not include API keys).
- Whether disabling/deleting a key or Revoke All User Tokens ends in-flight access immediately (Revoke All runs in the background).
- Whether private app (client credentials) tokens can be revoked by admins other than the app owner; client secret expiry/rotation.
- Whether read (GET) API calls are logged anywhere customer-visible.
- Whether integration key creation/rotation appears in audit records (support page says integration add/remove is not captured; Audit API lists Integrations as an associated resource of Services).

## Sources
- [Private Apps](https://docs.pagerduty.com/developer/private-apps) (retrieved 2026-10-14)
- [Scoped OAuth Apps](https://support.pagerduty.com/main/docs/scoped-oauth-apps) (retrieved 2026-10-14)
- [IP Allow List for User Sessions](https://support.pagerduty.com/main/docs/ip-allow-list-for-user-sessions) (retrieved 2026-10-14)
- [Register an App](https://docs.pagerduty.com/developer/register-an-app) (retrieved 2026-10-14)
- [OAuth Functionality](https://docs.pagerduty.com/developer/oauth-functionality) (retrieved 2026-10-14)
- [Audit Trail Reporting](https://support.pagerduty.com/main/docs/audit-trail-reporting) (retrieved 2026-10-14)
- [Audit Records API](https://docs.pagerduty.com/developer/audit-records-api) (retrieved 2026-10-14)
- [REST API OpenAPI spec — List audit records](https://docs.pagerduty.com/api-specs/rest.json) (retrieved 2026-10-14)
- [PagerDuty REST API OpenAPI v3 spec - List users](https://github.com/PagerDuty/api-schema/blob/main/reference/REST/openapiv3.json) (retrieved 2026-10-14)
