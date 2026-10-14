# Zoom: Delegated OAuth

`zoom-1` · OAuth · person. Delegated OAuth bearer; Server-to-Server OAuth using account ID, client ID and client secret.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Marketplace Manage > Apps on Account dashboard lists all apps on the account (Added apps tab). | Marketplace Manage > Apps on Account dashboard lists all apps on the account (Added apps tab). |
| Protect: Admin can block or require approval | Yes | App pre-approval (Marketplace admin) | App pre-approval (Marketplace admin): Zoom App Marketplace > Manage > Permissions (admin dashboard) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Account-admin IP enforcement covers API calls and OAuth endpoints. Server-to-Server restrictions are administered centrally. | Where: Zoom Marketplace > Marketplace admin > Marketplace Management > Permissions > Security permissions > IP allow list for apps (Apps tab > Has IPs > app > Add) |
| Protect: Expires automatically | Yes | 1 hour; refresh with refresh token | API: POST https://zoom.us/oauth/token response expires_in (3600); refresh token lasts 90 days. Fixed, not configurable |
| Detect: Usage appears in logs | Yes | client_id, user_id, appId, trace_id, operator | Marketplace API call logs (GET /marketplace/apps/{appId}/api_call_logs): Per-app log of API calls: url_pattern, method, http_status, time, trace_id. duration 7/14/30 days max. No caller IP or user field documented. Admin dashboard (Manage > Apps on Account) shows the same per-app call usage and CSV export. · Operation Logs report (GET /report/operationlogs): Admin/user activity (add user, settings change, delete recording). Fields: action, category_type, operation_detail, operator, time. No app/client id or IP documented. Pro+; one month per request. · app_deauthorized webhook event: Sent to the app's endpoint when a user deauthorizes/removes the app; carries account_id, user_id, client_id, deauthorization_time. Only visible to the app owner's webhook receiver. · Sign in / sign out activity report (GET /report/activities): User interactive sign-ins with ip_address, client_type, version; useful to compare the authorizing user's normal IPs. Range within last six months; Pro+. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Docs do not say whether revoking an access token also kills the refresh token, or whether admin Disable/Remove revokes issued tokens. Access tokens expire after one hour; refresh tokens after 90 days. |  |
| Respond: Stops working when user is removed | Partial | Refreshing fails with error 4735 once the token's user has been removed from the account; docs don't cover deactivation or the up-to-1-hour access token. | Where: Zoom web portal > User Management > Users > ... > Deactivate or Delete · API: PUT /v2/users/{userId}/status (action deactivate); DELETE /v2/users/{userId} (action delete or disassociate); app can also POST https://zoom.us/oauth/revoke |

## Protect: what an admin can configure

### Admin controls
- **App pre-approval (Marketplace admin)** (Require approval; all plans; default unknown). Requires a Marketplace admin to pre-approve an app before users can authorize it; users can request approval. Where: Zoom App Marketplace > Manage > Permissions (admin dashboard).
- **Role permissions for admin-level scopes** (Limit scope; all plans; default varies). Apps requesting admin scopes can only be authorized by users whose role holds the matching account-level permissions. Where: Web portal > User Management > Roles.
- **IP allowlist for Marketplace apps** (Limit network; all plans; default off). Admins approve or reject the IPs an app declares and can enforce the allowlist, blocking token exchange, revocation and API calls from other IPs; S2S app IPs are declared by the admin. Where: Zoom admin portal: App IP allowlist configuration.

- Network: supported (checked at mixed). Account-admin IP enforcement covers API calls and OAuth endpoints. Server-to-Server restrictions are administered centrally.
- Lifetime: 1 hour; refresh with refresh token. Renewal: Exchange the refresh token for a new access token and keep the newest refresh token returned. Refresh tokens expire after 90 days; the docs do not say whether refreshing resets that window. After expiry the user must re-authorize.
- Keyless option: not_verified. Server-to-Server OAuth supports unattended account-level access but uses an app secret; no general external identity exchange established.
- Conditions: Distinguish marketplace build-flow settings from account-admin controls for Server-to-Server apps.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Marketplace API call logs (GET /marketplace/apps/{appId}/api_call_logs): Per-app log of API calls: url_pattern, method, http_status, time, trace_id. duration 7/14/30 days max. No caller IP or user field documented. Admin dashboard (Manage > Apps on Account) shows the same per-app call usage and CSV export.
- Operation Logs report (GET /report/operationlogs): Admin/user activity (add user, settings change, delete recording). Fields: action, category_type, operation_detail, operator, time. No app/client id or IP documented. Pro+; one month per request.
- app_deauthorized webhook event: Sent to the app's endpoint when a user deauthorizes/removes the app; carries account_id, user_id, client_id, deauthorization_time. Only visible to the app owner's webhook receiver.
- Sign in / sign out activity report (GET /report/activities): User interactive sign-ins with ip_address, client_type, version; useful to compare the authorizing user's normal IPs. Range within last six months; Pro+.

### Fields that identify the credential
- `client_id` (app_deauthorized webhook payload): OAuth app whose grant was removed
- `user_id` (app_deauthorized webhook payload): User who deauthorized
- `appId` (Marketplace API call logs (path parameter)): Scopes call log to one app; individual tokens are not identified
- `trace_id` (Marketplace API call logs): Unique id per request
- `operator` (Operation Logs report): User who performed the change (email); the app/token is not identified

### Lifecycle events
- revoke: `app_deauthorized` Webhook when a user deauthorizes or removes a production app

### Correlate on
`client_id`, `user_id`, `account_id`, `trace_id`, `url_pattern`, `operator`, `ip_address`, `time`

### API calls a holder can make, and whether they are logged
- recon: `GET /v2/users/me`. Account and user details of the token principal Logged: unknown. Operation Logs record admin write-actions; API reads not documented as logged.
- enumeration (bulk): `GET /v2/users`. All users in the account Logged: unknown. No documented log for API reads.
- discovery (bulk): `GET /v2/users/{userId}/meetings`. A host's scheduled meetings Logged: unknown. Rate-limit label not confirmed.
- collection (bulk): `GET /v2/users/{userId}/recordings`. Cloud recordings with download URLs Logged: unknown. Operation Logs cover deleting recordings; recording downloads/views via API not documented.
- collection (bulk): `GET /v2/meetings/{meetingId}/recordings`. Recording files with a download_url per file Logged: unknown. Not documented as logged.

### What to look for (analyst guidance)
- Spike in calls or new url_pattern values (e.g. /users, /recordings, report endpoints) in the app's api_call_logs
- Bursts of 401/403 http_status for the app after a refresh token was rotated or revoked (stale stolen token)
- Operation Logs entries (recording deletes, user/settings changes) by the authorizing user at times they were not signed in per /report/activities
- API calls continuing for an app after the user who authorized it was deactivated
- app_deauthorized followed by renewed calls for the same appId

### Sample query (Zoom REST API query parameters)
List failed auth calls for the app over 30 days to spot stolen or revoked tokens being replayed

```
GET https://api.zoom.us/v2/marketplace/apps/{appId}/api_call_logs?duration=30&status_code=401&page_size=100
```

## Respond: how to revoke it


POST https://zoom.us/oauth/revoke with token=<access_token>; admin Manage > Apps on Account > Added Apps > Disable App or Remove (account-wide) or Disable per user; rotate client secret via POST /marketplace/apps/{appId}/rotate_client_secret with revoke_old_secret_time=now. Live access ends on revocation: unknown. Docs do not say whether revoking an access token also kills the refresh token, or whether admin Disable/Remove revokes issued tokens. Access tokens expire after one hour; refresh tokens after 90 days.

## No vendor documentation found
- SSO and MFA rules apply
- Data reads appear in logs
- Revocation ends active access
- token prefix/regex
- caller IP or user agent per API call
- which user's token made a given call in api_call_logs
- authorization-granted (app added) event name
- whether revoke/admin disable invalidates refresh tokens or issued access tokens
- api_call_logs retention beyond 30 days
- Whether any Zoom log records REST API reads or recording downloads/views
- Operation Logs retention period
- Rate-limit label for List meetings
- Official Zoom support articles for pre-approval (KB0062300) and admin IP allowlist (KB0088682) render only via JavaScript and could not be read; UI paths and defaults are taken from developer docs.
- Plan requirements for the Marketplace app IP allowlist.
- Whether admins can revoke individual users' OAuth grants for a Marketplace app without removing the app.

## Sources
- [Server-to-Server OAuth - Internal Apps - Zoom Developer Docs](https://developers.zoom.us/docs/internal-apps/s2s-oauth/) (retrieved 2026-10-09)
- [IP Addresses - Build Flow - Zoom Developer Docs](https://developers.zoom.us/docs/build-flow/basic-info/ip-address/) (retrieved 2026-10-09)
- [OAuth 2.0 - Integrations - Zoom Developer Docs](https://developers.zoom.us/docs/integrations/oauth/) (retrieved 2026-10-09)
- [OAuth error messages](https://developers.zoom.us/docs/integrations/oauth-error-messages/) (retrieved 2026-10-14)
- [Using the Marketplace App Dashboard](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0080840) (retrieved 2026-10-14)
- [Managing permissions for the Zoom Marketplace](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0089123) (retrieved 2026-10-14)
- [Deactivating, unlinking, or deleting users from your account](https://support.zoom.us/hc/en-us/articles/115005269946-Remove-User-from-your-Account) (retrieved 2026-10-14)
- [Zoom Users API](https://developers.zoom.us/api-hub/users/methods/endpoints.json) (retrieved 2026-10-12)
- [Marketplace APIs - Zoom Developer Docs](https://developers.zoom.us/docs/api/marketplace/) (retrieved 2026-10-12)
- [Meetings APIs (Reports) - Zoom Developer Docs](https://developers.zoom.us/docs/api/meetings/) (retrieved 2026-10-12)
- [Admin management of the Zoom App Marketplace](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060122) (retrieved 2026-10-12)
- [Zoom Meetings/Reports API](https://developers.zoom.us/api-hub/meetings/methods/endpoints.json) (retrieved 2026-10-12)
- [Zoom API rate limits](https://developers.zoom.us/docs/api/rate-limits/) (retrieved 2026-10-12)
- [Operation Logs](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0067251) (retrieved 2026-10-12)
- [End user authorization - Integrations - Zoom Developer Docs](https://developers.zoom.us/docs/integrations/end-user-auth/) (retrieved 2026-10-13)
