# Box: Client Credentials Grant

`box-2` · OAuth · service. OAuth bearer; server authentication via Client Credentials Grant or signed JWT, usually using an app service account.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Admin Console > Platform > Platform Apps > Server Authentication Apps lists apps with authorization/enablement status, not individual keys or tokens. | Admin Console > Platform > Platform Apps > Server Authentication Apps lists apps with authorization/enablement status, not individual keys or tokens. |
| Protect: Admin can block or require approval | Yes | Admin authorization of server authentication apps; Re-authorization on scope/access changes; Disable unpublished platform apps by default | Admin authorization of server authentication apps: Admin Console > Platform > Platform Apps > Server Authentication Apps · Re-authorization on scope/access changes: Admin Console > Platform > Platform Apps > … > Reauthorize · Disable unpublished platform apps by default: Admin Console > Enterprise Settings > Platform Apps |
| Protect: SSO and MFA rules apply | Not available | CCG gets tokens with client ID and secret and no sign-in; Box says SSO is not used for server-side authentication. |  |
| Protect: IP restriction | No docs found | Box support docs refer to an enterprise 'IP Allowlist' setting turned on per enterprise (not a plan feature). Its coverage of API calls with this credential is not documented; confirm with Box. |  |
| Protect: Expires automatically | Yes | 60 minutes | API: Fixed 60 min; read expires_in in the POST https://api.box.com/oauth2/token response (no refresh token) |
| Detect: Usage appears in logs | Yes | created_by, session_id, additional_details, box_subject_id | Box Enterprise Events (GET /events, stream_type=admin_logs / admin_logs_streaming): Admin/co-admin with reporting permission. admin_logs: 1 year history; admin_logs_streaming: ~2 weeks live. Admin Console reports: 7 years. · Box Shield alerts (SHIELD_ALERT in enterprise events): Shield add-on only. Suspicious location/session, anomalous download alerts with ip_info and service_name. |
| Detect: Data reads appear in logs | Yes | DOWNLOAD | Where: Admin Console > Reports > Create Report > User Activity; filter Action types to Downloaded · API: GET /2.0/events?stream_type=admin_logs&event_type=DOWNLOAD |
| Respond: Revocation ends active access | No docs found | Revoking one access token does not stop minting new ones while the secret is valid; effect of secret rotation on already-issued 60-min tokens is not documented. |  |
| Respond: Stops working when user is removed | N/A | Tokens belong to the app's auto-generated Service Account, not a person. |  |

## Protect: what an admin can configure

### Admin controls
- **Admin authorization of server authentication apps** (Require approval; all plans; default on). JWT, CCG and Limited Access (App Token) apps cannot be used in the enterprise until an admin authorizes them by Client ID. Where: Admin Console > Platform > Platform Apps > Server Authentication Apps.
- **Re-authorization on scope/access changes** (Require approval; all plans; default on). Authorization is a snapshot; changed scopes or access level need admin re-authorization. Where: Admin Console > Platform > Platform Apps > … > Reauthorize.
- **Disable unpublished platform apps by default** (Require approval; all plans; default off). Unpublished custom apps (OAuth and server-auth) are disabled until an admin enables them. Where: Admin Console > Enterprise Settings > Platform Apps.

- Network: unknown (checked at unknown). Box support docs refer to an enterprise 'IP Allowlist' setting turned on per enterprise (not a plan feature). Its coverage of API calls with this credential is not documented; confirm with Box.
- Lifetime: 60 minutes. Renewal: Use client credentials to mint a new access token; no refresh token.
- Keyless option: not_verified. Box JWT auth is app-key authentication. Box token downscoping exchanges an existing Box token, not an arbitrary external IdP token.
- Conditions: Do not substitute Box Shield location/anomaly detection or corporate firewall allowlisting for API source-IP enforcement.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Box Enterprise Events (GET /events, stream_type=admin_logs / admin_logs_streaming): Admin/co-admin with reporting permission. admin_logs: 1 year history; admin_logs_streaming: ~2 weeks live. Admin Console reports: 7 years.
- Box Shield alerts (SHIELD_ALERT in enterprise events): Shield add-on only. Suspicious location/session, anomalous download alerts with ip_info and service_name.

### Fields that identify the credential
- `created_by` (Box Enterprise Events): User mini object (id, name, login) acting; id 2 = Unknown User
- `session_id` (Box Enterprise Events): User session; not populated on all events
- `additional_details` (Box Enterprise Events): Event-specific details ('how a user performed an event'); per-event keys not fully documented
- `box_subject_id` (token request (POST /oauth2/token), not logged): Enterprise ID (service account) or user ID the token acts as

### Lifecycle events
- create: `APPLICATION_CREATED` App created in Developer Console
- change: `ENTERPRISE_APP_AUTHORIZATION_UPDATE` JWT app authorized or reauthorized by admin
- use: `CONTENT_ACCESS` Programmatic file access by a Box application
- use: `DOWNLOAD` File download
- create: `USER_AUTHENTICATE_OAUTH2_ACCESS_TOKEN_CREATE` OAuth 2.0 access token created; coverage for CCG not documented
- revoke: `OAUTH2_ACCESS_TOKEN_REVOKE` Access token revoked

### Correlate on
`created_by.id`, `created_by.login`, `ip_address`, `session_id`, `event_type`, `created_at`, `action_by`, `additional_details`

### API calls a holder can make, and whether they are logged
- recon: `GET /users/me`. identity; with box_subject_type=enterprise this is the app's Service Account Logged: unknown. Read event emission not documented
- enumeration (bulk): `GET /folders/0/items`. items under the service account's root; traverse the tree Logged: unknown. Listing read event not documented
- collection (bulk): `GET /files/{file_id}/content`. file contents in binary Logged: yes (`DOWNLOAD`). Enterprise events admin_logs; downloads appear as 'Downloaded'

### What to look for (analyst guidance)
- App service account acting from an IP outside your server egress ranges
- CCG app acting as managed users/admins (box_subject_type=user) when it normally uses the service account
- Service account suddenly downloading or collaborating on content it never touched
- ENTERPRISE_APP_AUTHORIZATION_UPDATE or app scope changes outside change windows
- Service account activity continuing after secret rotation (old secret still in use elsewhere)

### Sample query (Box Events API (GET /events))
Find programmatic content access and app authorization changes; filter created_by.login to the app service account

```
GET https://api.box.com/2.0/events?stream_type=admin_logs&event_type=CONTENT_ACCESS,DOWNLOAD,ENTERPRISE_APP_AUTHORIZATION_UPDATE&created_after=2026-09-12T00:00:00-00:00&limit=500
```

## Respond: how to revoke it


Rotate/revoke the client secret in Developer Console > Configuration; revoke live tokens via POST /oauth2/revoke; admin disables or deauthorizes the server app in Admin Console > Platform > Platform Apps. Live access ends on revocation: unknown. Revoking one access token does not stop minting new ones while the secret is valid; effect of secret rotation on already-issued 60-min tokens is not documented.

## No vendor documentation found
- IP restriction
- Revocation ends active access
- Event field identifying the app/client_id
- Whether CCG token minting emits USER_AUTHENTICATE_OAUTH2_ACCESS_TOKEN_CREATE
- Event for client secret reset
- Documented UI path/effect of client secret revoke
- Whether a CCG service account token can be elevated via As-User, which would change the actor recorded in events
- No admin setting found that blocks developers from generating developer tokens; tokens expire after 60 minutes and inherit the app's scopes and the user's access.
- Whether Box offers API source-IP enforcement for app tokens (no admin doc found; Shield/firewall not counted).
- Whether new Limited Access (App Token) apps can still be created.
- Whether Box SSO requirements constrain OAuth token issuance for managed users (not checked).
- Whether app access level (App only vs App + Enterprise) and scopes can be overridden by the admin at authorization time; docs show them set by the developer in the Developer Console.

## Sources
- [Authentication - Box Dev Docs](https://developer.box.com/guides/authentication) (retrieved 2026-10-09)
- [Refresh a token - Box Dev Docs](https://developer.box.com/guides/authentication/tokens/refresh) (retrieved 2026-10-09)
- [Downscope a token - Box Dev Docs](https://developer.box.com/guides/authentication/tokens/downscope) (retrieved 2026-10-09)
- [Understanding Requests to Authorize or Allow Applications – Box Support](https://support.box.com/hc/en-us/articles/360044193933-Understanding-Requests-to-Authorize-or-Allow-Applications) (retrieved 2026-10-09)
- [Box IT & Admin Console | Access Control, Provisioning, and Reporting](https://www.box.com/security/it-admin-controls) (retrieved 2026-10-09)
- [Security Control Types - Box Support](https://docs.box.com/en/box-shield/shield-smart-access-policies/security-control-types) (retrieved 2026-10-09)
- [Developer sandbox management FAQ - Box Support](https://support.box.com/hc/en-us/articles/360044196313-Developer-sandbox-management-FAQ) (retrieved 2026-10-09)
- [Client Credentials Grant - Box Dev Docs](https://developer.box.com/guides/authentication/client-credentials) (retrieved 2026-10-09)
- [Box API and SSO - Box Dev Docs](https://developer.box.com/guides/authentication/sso) (retrieved 2026-10-14)
- [Authorization - Box Dev Docs](https://developer.box.com/guides/authorization) (retrieved 2026-10-14)
- [Managing platform apps – Box Support](https://support.box.com/hc/en-us/articles/360044196653-Managing-platform-apps) (retrieved 2026-10-14)
- [Tokens](https://developer.box.com/guides/authentication/tokens/) (retrieved 2026-10-14)
- [Box: Access tokens](https://developer.box.com/guides/authentication/tokens/access-tokens/) (retrieved 2026-10-12)
- [Running Reports](https://support.box.com/hc/en-us/articles/360043696534-Running-Reports) (retrieved 2026-10-14)
- [User Activity Report](https://support.box.com/hc/en-us/articles/4415012490387-User-Activity-Report) (retrieved 2026-10-14)
- [Box API: List user and enterprise events](https://developer.box.com/reference/get-events/) (retrieved 2026-10-12)
- [Box: Monitor enterprise events](https://developer.box.com/guides/events/enterprise-events/for-enterprise/) (retrieved 2026-10-12)
- [Box Java SDK (vendor repo): BoxEvent](https://github.com/box/box-java-sdk/blob/legacy/src/main/java/com/box/sdk/BoxEvent.java) (retrieved 2026-10-12)
- [Box: Shield alert events](https://developer.box.com/guides/events/event-triggers/shield-alert-events/) (retrieved 2026-10-12)
- [Box: Revoke a token](https://developer.box.com/guides/authentication/tokens/revoke/) (retrieved 2026-10-12)
- [Box: Platform app approval](https://developer.box.com/guides/authorization/platform-app-approval/) (retrieved 2026-10-12)
- [Box Support: Managing custom apps](https://support.box.com/hc/en-us/articles/360044196653-Managing-custom-apps) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Get current user](https://developer.box.com/reference/get-users-me/) (retrieved 2026-10-12)
- [List items in folder](https://developer.box.com/reference/get-folders-id-items/) (retrieved 2026-10-12)
- [Download file](https://developer.box.com/reference/get-files-id-content/) (retrieved 2026-10-12)
- [Managing platform apps](https://docs.box.com/en/box-admin-tools/how-to-guides-for-admins/managing-platform-apps) (retrieved 2026-10-13)
- [Security - Box Dev Docs](https://developer.box.com/guides/security) (retrieved 2026-10-13)
- [Enterprise Settings: Platform Apps](https://support.box.com/hc/en-us/articles/49348283011731-Enterprise-Settings-Platform-Apps) (retrieved 2026-10-13)
