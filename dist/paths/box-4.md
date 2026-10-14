# Box: App Token (Limited Access App)

`box-4` · API key / token · service · legacy. Fixed bearer token generated in the Developer Console for a Limited Access App. It acts as the app's service account and is mainly intended for Box View previews.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Admin Console > Platform > Platform Apps > Server Authentication Apps lists apps with authorization/enablement status, not individual keys or tokens. | Admin Console > Platform > Platform Apps > Server Authentication Apps lists apps with authorization/enablement status, not individual keys or tokens. |
| Protect: Admin can block or require approval | Yes | Admin authorization of server authentication apps; Re-authorization on scope/access changes; Disable unpublished platform apps by default | Admin authorization of server authentication apps: Admin Console > Platform > Platform Apps > Server Authentication Apps · Re-authorization on scope/access changes: Admin Console > Platform > Platform Apps > … > Reauthorize · Disable unpublished platform apps by default: Admin Console > Enterprise Settings > Platform Apps |
| Protect: SSO and MFA rules apply | Not available | App Tokens are server-side authentication, which Box says does not use SSO. |  |
| Protect: IP restriction | No docs found | A Box staff community answer describes an enterprise IP allowlist that narrows both web app and API access, with no per-app option. Current official documentation of its coverage for App Token calls was not found; confirm with Box. |  |
| Protect: Expires automatically | Yes | Set per token: auto-expire or never expire | Where: Developer Console > (app) > Configuration > Primary Access Token > Generate Key; choose auto-expire or never |
| Detect: Usage appears in logs | Yes | created_by, session_id, additional_details | Box Enterprise Events (GET /events, stream_type=admin_logs / admin_logs_streaming): Admin/co-admin with reporting permission. admin_logs: 1 year history; admin_logs_streaming: ~2 weeks live. Admin Console reports: 7 years. |
| Detect: Data reads appear in logs | Yes | DOWNLOAD | Where: Admin Console > Reports > Create Report > User Activity; filter Action types to Downloaded · API: GET /2.0/events?stream_type=admin_logs&event_type=DOWNLOAD |
| Respond: Revocation ends active access | No docs found | Box docs do not document revoking App Tokens or the effect of regeneration; verify in a test app. |  |
| Respond: Stops working when user is removed | N/A | App Tokens are restricted to the application's Service Account. |  |

## Protect: what an admin can configure

### Admin controls
- **Admin authorization of server authentication apps** (Require approval; all plans; default on). JWT, CCG and Limited Access (App Token) apps cannot be used in the enterprise until an admin authorizes them by Client ID. Where: Admin Console > Platform > Platform Apps > Server Authentication Apps.
- **Re-authorization on scope/access changes** (Require approval; all plans; default on). Authorization is a snapshot; changed scopes or access level need admin re-authorization. Where: Admin Console > Platform > Platform Apps > … > Reauthorize.
- **Disable unpublished platform apps by default** (Require approval; all plans; default off). Unpublished custom apps (OAuth and server-auth) are disabled until an admin enables them. Where: Admin Console > Enterprise Settings > Platform Apps.

- Network: unknown (checked at unknown). A Box staff community answer describes an enterprise IP allowlist that narrows both web app and API access, with no per-app option. Current official documentation of its coverage for App Token calls was not found; confirm with Box.
- Lifetime: Set per token: auto-expire or never expire. Renewal: The token is reused until it expires or is revoked; replace it by generating the secondary token, switching over, then revoking the primary.
- Keyless option: not_applicable. Manually generated static token; no external identity exchange is documented. The token can be the subject token for Box downscoping.
- Conditions: Box calls these legacy Limited Access Apps and says the approach is being replaced by CCG and JWT, which support all App Token endpoints plus 150 more. Whether new App Token apps can still be created is not stated.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Box Enterprise Events (GET /events, stream_type=admin_logs / admin_logs_streaming): Admin/co-admin with reporting permission. admin_logs: 1 year history; admin_logs_streaming: ~2 weeks live. Admin Console reports: 7 years.

### Fields that identify the credential
- `created_by` (Box Enterprise Events): User mini object (id, name, login) acting; id 2 = Unknown User
- `session_id` (Box Enterprise Events): User session; not populated on all events
- `additional_details` (Box Enterprise Events): Event-specific details ('how a user performed an event'); per-event keys not fully documented

### Lifecycle events
- create: `APPLICATION_CREATED` App created
- use: `PREVIEW` Previewed (Box View use case)
- use: `CONTENT_ACCESS` Programmatic access by a Box application
- use: `DOWNLOAD` File download

### Correlate on
`created_by.id`, `created_by.login`, `ip_address`, `session_id`, `event_type`, `created_at`, `action_by`, `additional_details`

### API calls a holder can make, and whether they are logged
- recon: `GET /users/me`. the app's Service Account identity (App Token has access only to its own account) Logged: unknown. Read event emission not documented; scope limited to app's own account
- enumeration (bulk): `GET /folders/0/items`. items in the app's own account only Logged: unknown. Listing read event not documented
- collection (bulk): `GET /files/{file_id}/content`. file contents in binary (within the app's own account) Logged: yes (`DOWNLOAD`). Enterprise events admin_logs record downloads as 'Downloaded'

### What to look for (analyst guidance)
- App service account doing anything other than upload/preview (e.g. collaborations, shared links)
- Use from IPs outside the Box View host's egress
- Use of a non-expiring token long after the integration was retired
- Both Primary and Secondary tokens in use at once (one may be leaked)

### Sample query (Box Events API (GET /events))
Review content access; filter created_by.login to the Limited Access App service account

```
GET https://api.box.com/2.0/events?stream_type=admin_logs&event_type=PREVIEW,DOWNLOAD,CONTENT_ACCESS&created_after=2026-09-12T00:00:00-00:00&limit=500
```

## Respond: how to revoke it


Regenerate/remove the Primary or Secondary App Token in Developer Console > Configuration; admin disables the app in Admin Console. Live access ends on revocation: unknown. Box docs do not document revoking App Tokens or the effect of regeneration; verify in a test app.

## No vendor documentation found
- IP restriction
- Revocation ends active access
- App Token revoke/regenerate procedure and event
- Event field identifying the app
- Whether POST /oauth2/revoke works on App Tokens
- App Token is scoped to the app's own account, so it cannot enumerate other users' content
- Whether reads produce events
- No admin setting found that blocks developers from generating developer tokens; tokens expire after 60 minutes and inherit the app's scopes and the user's access.
- Whether Box offers API source-IP enforcement for app tokens (no admin doc found; Shield/firewall not counted).
- Whether new Limited Access (App Token) apps can still be created.
- Whether Box SSO requirements constrain OAuth token issuance for managed users (not checked).
- Whether app access level (App only vs App + Enterprise) and scopes can be overridden by the admin at authorization time; docs show them set by the developer in the Developer Console.

## Sources
- [App Token Auth - Box Dev Docs](https://developer.box.com/guides/authentication/app-token) (retrieved 2026-10-12)
- [Authentication - Box Dev Docs](https://developer.box.com/guides/authentication) (retrieved 2026-10-09)
- [Setup - Box Dev Docs](https://developer.box.com/guides/embed/box-view/setup) (retrieved 2026-10-12)
- [Limiting access for an app by IP range (Box Community)](https://support.box.com/hc/en-us/community/posts/1500000391641-Limiting-access-for-an-app-by-IP-range) (retrieved 2026-10-12)
- [Setup with App Token Auth - Box Dev Docs](https://developer.box.com/guides/authentication/app-token/app-token-setup) (retrieved 2026-10-12)
- [Rotating App Tokens - Box Dev Docs](https://developer.box.com/guides/authentication/app-token/rollover) (retrieved 2026-10-12)
- [Box API and SSO - Box Dev Docs](https://developer.box.com/guides/authentication/sso) (retrieved 2026-10-14)
- [Managing platform apps – Box Support](https://support.box.com/hc/en-us/articles/360044196653-Managing-platform-apps) (retrieved 2026-10-14)
- [App token setup](https://developer.box.com/guides/authentication/app-token/app-token-setup/) (retrieved 2026-10-14)
- [Running Reports](https://support.box.com/hc/en-us/articles/360043696534-Running-Reports) (retrieved 2026-10-14)
- [User Activity Report](https://support.box.com/hc/en-us/articles/4415012490387-User-Activity-Report) (retrieved 2026-10-14)
- [Box API: List user and enterprise events](https://developer.box.com/reference/get-events/) (retrieved 2026-10-12)
- [Box: Monitor enterprise events](https://developer.box.com/guides/events/enterprise-events/for-enterprise/) (retrieved 2026-10-12)
- [Box Java SDK (vendor repo): BoxEvent](https://github.com/box/box-java-sdk/blob/legacy/src/main/java/com/box/sdk/BoxEvent.java) (retrieved 2026-10-12)
- [Box Support: Managing custom apps](https://support.box.com/hc/en-us/articles/360044196653-Managing-custom-apps) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Get current user](https://developer.box.com/reference/get-users-me/) (retrieved 2026-10-12)
- [Download file](https://developer.box.com/reference/get-files-id-content/) (retrieved 2026-10-12)
- [Managing platform apps](https://docs.box.com/en/box-admin-tools/how-to-guides-for-admins/managing-platform-apps) (retrieved 2026-10-13)
- [Security - Box Dev Docs](https://developer.box.com/guides/security) (retrieved 2026-10-13)
- [Enterprise Settings: Platform Apps](https://support.box.com/hc/en-us/articles/49348283011731-Enterprise-Settings-Platform-Apps) (retrieved 2026-10-13)
