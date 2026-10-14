# Box: Developer token

`box-5` · OAuth · person. Ordinary Box access token generated in the Developer Console for testing. It acts as the user who was signed in to the console when it was generated.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Enable/disable user authentication app | Enable/disable user authentication app: Admin Console > Platform > Platform Apps > User Authentication Apps |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | A Box staff community answer describes an enterprise IP allowlist that narrows both web app and API access. Current official documentation of its coverage for developer-token calls was not found; confirm with Box. |  |
| Protect: Expires automatically | Yes | 60 minutes | Where: Fixed 60 min, not configurable or refreshable (Developer Console > Configuration > Generate Developer Token) |
| Detect: Usage appears in logs | Yes | created_by, session_id, additional_details | Box Enterprise Events (GET /events, stream_type=admin_logs / admin_logs_streaming): Admin/co-admin with reporting permission. admin_logs: 1 year history; admin_logs_streaming: ~2 weeks live. Admin Console reports: 7 years. · Box Shield alerts (SHIELD_ALERT in enterprise events): Shield add-on only. Suspicious location/session, anomalous download alerts with ip_info and service_name. |
| Detect: Data reads appear in logs | Yes | DOWNLOAD | Where: Admin Console > Reports > Create Report > User Activity; filter Action types to Downloaded · API: GET /2.0/events?stream_type=admin_logs&event_type=DOWNLOAD |
| Respond: Revocation ends active access | Yes | Revoking a developer token deletes all webhooks created by that app. | Revoke the token in Developer Console or via POST /oauth2/revoke; it also expires on its own after 60 minutes. Disable the developer's account or the app if generation is the problem. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Enable/disable user authentication app** (Disable; all plans; default varies). Admins enable or disable a custom OAuth 2.0 app for the enterprise by Client ID. Where: Admin Console > Platform > Platform Apps > User Authentication Apps.

- Network: unknown (checked at unknown). A Box staff community answer describes an enterprise IP allowlist that narrows both web app and API access. Current official documentation of its coverage for developer-token calls was not found; confirm with Box.
- Lifetime: 60 minutes. Renewal: Cannot be refreshed programmatically; generate a new token in the Developer Console.
- Keyless option: not_applicable. Generated manually in the console; no external identity exchange applies.
- Conditions: Box says developer tokens are for development and testing only and should not be used in production.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Box Enterprise Events (GET /events, stream_type=admin_logs / admin_logs_streaming): Admin/co-admin with reporting permission. admin_logs: 1 year history; admin_logs_streaming: ~2 weeks live. Admin Console reports: 7 years.
- Box Shield alerts (SHIELD_ALERT in enterprise events): Shield add-on only. Suspicious location/session, anomalous download alerts with ip_info and service_name.

### Fields that identify the credential
- `created_by` (Box Enterprise Events): User mini object (id, name, login) acting; id 2 = Unknown User
- `session_id` (Box Enterprise Events): User session; not populated on all events
- `additional_details` (Box Enterprise Events): Event-specific details ('how a user performed an event'); per-event keys not fully documented

### Lifecycle events
- use: `CONTENT_ACCESS` Programmatic access by a Box application
- use: `DOWNLOAD` File download
- revoke: `OAUTH2_ACCESS_TOKEN_REVOKE` Access token revoked; coverage for developer tokens not documented

### Correlate on
`created_by.id`, `created_by.login`, `ip_address`, `session_id`, `event_type`, `created_at`, `action_by`, `additional_details`

### API calls a holder can make, and whether they are logged
- recon: `GET /users/me`. the user who was logged into the Developer Console when the token was generated Logged: unknown. Read event emission not documented; token expires after 60 minutes
- enumeration (bulk): `GET /folders/0/items`. items the console user can reach; traverse tree Logged: unknown. Listing read event not documented
- collection (bulk): `GET /files/{file_id}/content`. file contents in binary Logged: yes (`DOWNLOAD`). Enterprise events admin_logs record downloads; actor is the console user

### What to look for (analyst guidance)
- Developer's account making API calls from an IP not matching their recent LOGIN events
- Bursts of API-style activity under a human admin/developer account
- Repeated short-lived activity windows (~60 min) suggesting regenerated developer tokens
- Developer tokens generated on an app in production use (webhooks lost on revoke)

### Sample query (Box Events API (GET /events))
Review programmatic access by the developer user; filter created_by.login and compare ip_address to their LOGIN events

```
GET https://api.box.com/2.0/events?stream_type=admin_logs&event_type=DOWNLOAD,CONTENT_ACCESS&created_after=2026-09-12T00:00:00-00:00&limit=500
```

## Respond: how to revoke it


Revoke the token in Developer Console or via POST /oauth2/revoke; it also expires on its own after 60 minutes. Disable the developer's account or the app if generation is the problem. Live access ends on revocation: yes. Revoking a developer token deletes all webhooks created by that app.

## No vendor documentation found
- Admin can list all of them
- SSO and MFA rules apply
- IP restriction
- Stops working when user is removed
- Event recording developer token generation
- Field distinguishing developer-token use from the user's normal sessions
- Whether reads produce events
- No admin setting found that blocks developers from generating developer tokens; tokens expire after 60 minutes and inherit the app's scopes and the user's access.
- Whether Box offers API source-IP enforcement for app tokens (no admin doc found; Shield/firewall not counted).
- Whether new Limited Access (App Token) apps can still be created.
- Whether Box SSO requirements constrain OAuth token issuance for managed users (not checked).
- Whether app access level (App only vs App + Enterprise) and scopes can be overridden by the admin at authorization time; docs show them set by the developer in the Developer Console.

## Sources
- [Developer Tokens - Box Dev Docs](https://developer.box.com/guides/authentication/tokens/developer-tokens) (retrieved 2026-10-12)
- [Authentication - Box Dev Docs](https://developer.box.com/guides/authentication) (retrieved 2026-10-09)
- [Limiting access for an app by IP range (Box Community)](https://support.box.com/hc/en-us/community/posts/1500000391641-Limiting-access-for-an-app-by-IP-range) (retrieved 2026-10-12)
- [Developer tokens](https://developer.box.com/guides/authentication/tokens/developer-tokens/) (retrieved 2026-10-14)
- [Running Reports](https://support.box.com/hc/en-us/articles/360043696534-Running-Reports) (retrieved 2026-10-14)
- [User Activity Report](https://support.box.com/hc/en-us/articles/4415012490387-User-Activity-Report) (retrieved 2026-10-14)
- [Box API: List user and enterprise events](https://developer.box.com/reference/get-events/) (retrieved 2026-10-12)
- [Box: Monitor enterprise events](https://developer.box.com/guides/events/enterprise-events/for-enterprise/) (retrieved 2026-10-12)
- [Box Java SDK (vendor repo): BoxEvent](https://github.com/box/box-java-sdk/blob/legacy/src/main/java/com/box/sdk/BoxEvent.java) (retrieved 2026-10-12)
- [Box: Shield alert events](https://developer.box.com/guides/events/event-triggers/shield-alert-events/) (retrieved 2026-10-12)
- [Box: Revoke a token](https://developer.box.com/guides/authentication/tokens/revoke/) (retrieved 2026-10-12)
- [Box API: Revoke access token](https://developer.box.com/reference/post-oauth2-revoke/) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Get current user](https://developer.box.com/reference/get-users-me/) (retrieved 2026-10-12)
- [Download file](https://developer.box.com/reference/get-files-id-content/) (retrieved 2026-10-12)
- [Managing platform apps](https://docs.box.com/en/box-admin-tools/how-to-guides-for-admins/managing-platform-apps) (retrieved 2026-10-13)
