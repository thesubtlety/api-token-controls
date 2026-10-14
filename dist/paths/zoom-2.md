# Zoom: Server-to-Server OAuth

`zoom-2` · OAuth · service. Delegated OAuth bearer; Server-to-Server OAuth using account ID, client ID and client secret.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Apps on Account dashboard has a Created apps tab, but the page does not mention Server-to-Server apps specifically. | Apps on Account dashboard has a Created apps tab, but the page does not mention Server-to-Server apps specifically. |
| Protect: Admin can block or require approval | Yes | Server-to-Server OAuth app role permission | Server-to-Server OAuth app role permission: Web portal > User Management > Roles > Role Settings > Advanced features > Server-to-Server OAuth app |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Account-admin IP enforcement covers API calls and OAuth endpoints. Server-to-Server restrictions are administered centrally. | Where: Zoom Marketplace > Marketplace admin > Marketplace Management > Permissions > Security permissions > IP allow list for apps > + Add IP address/CDIR |
| Protect: Expires automatically | Yes | 1 hour; mint a new token | API: POST https://zoom.us/oauth/token?grant_type=account_credentials response expires_in (3600). Fixed, not configurable |
| Detect: Usage appears in logs | Yes | appId, trace_id, secret_id, operator | Marketplace API call logs (GET /marketplace/apps/{appId}/api_call_logs): Per-app log: url_pattern, method, http_status, time, trace_id; up to 30 days (duration 7/14/30). No IP, user agent or token id documented. Same data in Manage > Apps on Account dashboard. · Operation Logs report (GET /report/operationlogs): Admin changes made via API appear with operator/action/operation_detail/time; app identity and IP not documented. Pro+; one month per request. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Yes | Docs: tokens stop working when the app is deactivated. Rotating the secret alone does not kill issued access tokens (1 hour TTL); new tokens do not invalidate old ones. No refresh token. | Deactivate the app (App Marketplace > app > Activation > Deactivate); rotate the secret via POST /marketplace/apps/{appId}/rotate_client_secret with revoke_old_secret_time=now (dashboard regenerate leaves old secret valid 30 days); delete the app if no longer needed. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **IP allowlist for Marketplace apps** (Limit network; all plans; default off). Admins approve or reject the IPs an app declares and can enforce the allowlist, blocking token exchange, revocation and API calls from other IPs; S2S app IPs are declared by the admin. Where: Zoom admin portal: App IP allowlist configuration.
- **Server-to-Server OAuth app role permission** (Disable; all plans; default unknown). Only users whose role has View/Edit for Server-to-Server OAuth app can create or manage S2S apps. Where: Web portal > User Management > Roles > Role Settings > Advanced features > Server-to-Server OAuth app.
- **Scope permissions for S2S developers** (Limit scope; all plans; default varies). Scopes a developer can add to an S2S app are capped by their role; lowering the owner's role strips admin-level scopes. Where: Web portal > User Management > Roles (developer's role).

### Not available (vendor states)
- S2S access-token lifetime is fixed at one hour; no refresh token; not configurable.

- Network: supported (checked at mixed). Account-admin IP enforcement covers API calls and OAuth endpoints. Server-to-Server restrictions are administered centrally.
- Lifetime: 1 hour; mint a new token. Renewal: No refresh token; request a new token with the app credentials.
- Keyless option: not_verified. Server-to-Server OAuth supports unattended account-level access but uses an app secret; no general external identity exchange established.
- Conditions: Distinguish marketplace build-flow settings from account-admin controls for Server-to-Server apps.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Marketplace API call logs (GET /marketplace/apps/{appId}/api_call_logs): Per-app log: url_pattern, method, http_status, time, trace_id; up to 30 days (duration 7/14/30). No IP, user agent or token id documented. Same data in Manage > Apps on Account dashboard.
- Operation Logs report (GET /report/operationlogs): Admin changes made via API appear with operator/action/operation_detail/time; app identity and IP not documented. Pro+; one month per request.

### Fields that identify the credential
- `appId` (Marketplace API call logs (path parameter)): Identifies the S2S app; individual access tokens are not distinguished
- `trace_id` (Marketplace API call logs): Unique id per request
- `secret_id` (rotate_client_secret response): Id of the new client secret (not a log field)
- `operator` (Operation Logs report): User recorded for the change

### Lifecycle events
No docs found.

### Correlate on
`trace_id`, `url_pattern`, `method`, `http_status`, `time`, `operator`, `category_type`

### API calls a holder can make, and whether they are logged
- recon: `POST https://zoom.us/oauth/token (grant_type=account_credentials, account_id)`. 1-hour access token; response 'scope' lists the app's scopes Logged: unknown. No documented log of Server-to-Server token issuance.
- recon: `GET /v2/users/me`. Account and user details of the token principal Logged: unknown. Operation Logs record admin write-actions; API reads not documented as logged.
- enumeration (bulk): `GET /v2/users`. All users in the account Logged: unknown. No documented log for API reads.
- collection (bulk): `GET /v2/users/{userId}/recordings`. Cloud recordings with download URLs Logged: unknown. Operation Logs cover deleting recordings; recording downloads/views via API not documented.
- recon (bulk): `GET /v2/report/operationlogs`. Admin activity report; lets the holder read the same admin audit trail defenders use Logged: unknown. Report requires Pro or higher plan; records admin actions, not API reads.

### What to look for (analyst guidance)
- Call volume from the S2S app outside its scheduled job windows or a new url_pattern family (users, recordings, report, phone)
- Many token requests: multiple valid tokens can coexist, so parallel use from a second environment will not break the legitimate one
- 401 bursts after secret rotation or app deactivation (attacker still holding old secret/token)
- Operation Logs changes (user deletes, role changes, settings) not matching any change ticket around the app's call times
- Read-heavy calls to /report/* or recording endpoints from an app normally used for scheduling

### Sample query (Zoom REST API query parameters)
Find destructive calls made by the S2S app in the last 30 days

```
GET https://api.zoom.us/v2/marketplace/apps/{appId}/api_call_logs?duration=30&method=DELETE&page_size=100
```

## Respond: how to revoke it
- Admin: **Deactivate or remove S2S app**. Deactivating the app stops existing tokens; it can also be removed. Where: Zoom App Marketplace > App Management > Created apps > Activation / Remove App.

Deactivate the app (App Marketplace > app > Activation > Deactivate); rotate the secret via POST /marketplace/apps/{appId}/rotate_client_secret with revoke_old_secret_time=now (dashboard regenerate leaves old secret valid 30 days); delete the app if no longer needed. Live access ends on revocation: yes. Docs: tokens stop working when the app is deactivated. Rotating the secret alone does not kill issued access tokens (1 hour TTL); new tokens do not invalidate old ones. No refresh token.

## No vendor documentation found
- SSO and MFA rules apply
- Data reads appear in logs
- Stops working when user is removed
- token prefix/regex and client secret format
- token issuance (account_credentials grant) event or log
- app created/activated/deactivated/secret-rotated audit event names
- caller IP or user agent per API call
- how S2S-app actions are attributed in operator field
- api_call_logs retention beyond 30 days
- Whether S2S token issuance or API reads are recorded in any admin-visible log
- Operation Logs retention period
- Official Zoom support articles for pre-approval (KB0062300) and admin IP allowlist (KB0088682) render only via JavaScript and could not be read; UI paths and defaults are taken from developer docs.
- Plan requirements for the Marketplace app IP allowlist.
- Whether admins can revoke individual users' OAuth grants for a Marketplace app without removing the app.

## Sources
- [Server-to-Server OAuth - Internal Apps - Zoom Developer Docs](https://developers.zoom.us/docs/internal-apps/s2s-oauth/) (retrieved 2026-10-09)
- [IP Addresses - Build Flow - Zoom Developer Docs](https://developers.zoom.us/docs/build-flow/basic-info/ip-address/) (retrieved 2026-10-09)
- [Using the Marketplace App Dashboard](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0080840) (retrieved 2026-10-14)
- [Managing permissions for the Zoom Marketplace](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0089123) (retrieved 2026-10-14)
- [Create a Server-to-Server OAuth app - Zoom Developer Docs](https://developers.zoom.us/docs/internal-apps/create/) (retrieved 2026-10-12)
- [App Credentials - Zoom Developer Docs](https://developers.zoom.us/docs/build-flow/basic-info/app-credentials/) (retrieved 2026-10-12)
- [Marketplace APIs - Zoom Developer Docs](https://developers.zoom.us/docs/api/marketplace/) (retrieved 2026-10-12)
- [Meetings APIs (Reports) - Zoom Developer Docs](https://developers.zoom.us/docs/api/meetings/) (retrieved 2026-10-12)
- [Zoom Users API](https://developers.zoom.us/api-hub/users/methods/endpoints.json) (retrieved 2026-10-12)
- [Zoom Meetings/Reports API](https://developers.zoom.us/api-hub/meetings/methods/endpoints.json) (retrieved 2026-10-12)
- [Zoom API rate limits](https://developers.zoom.us/docs/api/rate-limits/) (retrieved 2026-10-12)
- [Operation Logs](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0067251) (retrieved 2026-10-12)
- [Internal apps (Server-to-server) - Internal Apps - Zoom Developer Docs](https://developers.zoom.us/docs/internal-apps/) (retrieved 2026-10-13)
