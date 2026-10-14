# Box: OAuth

`box-1` · OAuth · person. OAuth bearer; server authentication via Client Credentials Grant or signed JWT, usually using an app service account.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Admin Console > Platform > Platform Apps > User Authentication Apps lists apps and enablement state, not per-user tokens. | Admin Console > Platform > Platform Apps > User Authentication Apps lists apps and enablement state, not per-user tokens. |
| Protect: Admin can block or require approval | Yes | Disable unpublished platform apps by default; Enable/disable user authentication app; Integration Availability Status; Enable Integrations by default | Disable unpublished platform apps by default: Admin Console > Enterprise Settings > Platform Apps · Enable/disable user authentication app: Admin Console > Platform > Platform Apps > User Authentication Apps · Integration Availability Status: Admin Console > Integrations · Enable Integrations by default: Admin Console > Integrations > Settings |
| Protect: SSO and MFA rules apply | Partial | OAuth sign-in goes through the enterprise SSO screen, but under SSO Required existing tokens are not revoked and keep refreshing. | Where: Admin Console > Enterprise Settings > User Settings > Enable Single Sign-On (SSO) for All Users > SSO Required |
| Protect: IP restriction | No docs found | Box support docs refer to an enterprise 'IP Allowlist' setting turned on per enterprise (not a plan feature). Its coverage of API calls with this credential is not documented; confirm with Box. |  |
| Protect: Expires automatically | Yes | 60 minutes | API: Fixed 60 min; read expires_in in the POST https://api.box.com/oauth2/token response |
| Detect: Usage appears in logs | Yes | created_by, session_id, additional_details | Box Enterprise Events (GET /events, stream_type=admin_logs / admin_logs_streaming): Admin/co-admin with reporting permission. admin_logs: 1 year history; admin_logs_streaming: ~2 weeks live. Admin Console reports: 7 years. · Box Shield alerts (SHIELD_ALERT in enterprise events): Shield add-on only. Suspicious location/session, anomalous download alerts with ip_info and service_name. |
| Detect: Data reads appear in logs | Yes | DOWNLOAD | Where: Admin Console > Reports > Create Report > User Activity; filter Action types to Downloaded · API: GET /2.0/events?stream_type=admin_logs&event_type=DOWNLOAD |
| Respond: Revocation ends active access | Partial | Revoke acts on the presented token; whether other tokens the same user granted the app are killed, and whether disabling the app ends live tokens, is not documented. | POST /oauth2/revoke with client_id, client_secret and the access or refresh token; admin can disable the user-auth app in Admin Console > Platform > Platform Apps. |
| Respond: Stops working when user is removed | Yes | Box support says making the user inactive (or revoking tokens) is how to stop the user's tokens. | Where: Admin Console > Users and Groups > Managed Users > (user) > Edit User Account Details > Status: Inactive · API: PUT /2.0/users/{user_id} {"status":"inactive"} |

## Protect: what an admin can configure

### Admin controls
- **Disable unpublished platform apps by default** (Require approval; all plans; default off). Unpublished custom apps (OAuth and server-auth) are disabled until an admin enables them. Where: Admin Console > Enterprise Settings > Platform Apps.
- **Enable/disable user authentication app** (Disable; all plans; default varies). Admins enable or disable a custom OAuth 2.0 app for the enterprise by Client ID. Where: Admin Console > Platform > Platform Apps > User Authentication Apps.
- **Integration Availability Status** (Disable; all plans; default varies). Disables a published integration for all or selected users; existing installs stop working. Where: Admin Console > Integrations.
- **Enable Integrations by default** (Disable; all plans; default on). Toggling off disables all published integrations by default. Where: Admin Console > Integrations > Settings.

- Network: unknown (checked at unknown). Box support docs refer to an enterprise 'IP Allowlist' setting turned on per enterprise (not a plan feature). Its coverage of API calls with this credential is not documented; confirm with Box.
- Lifetime: 60 minutes. Renewal: Refresh token lasts 60 days and is single use.
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

### Lifecycle events
- create: `USER_AUTHENTICATE_OAUTH2_ACCESS_TOKEN_CREATE` OAuth 2.0 access token created
- use: `LOGIN` Interactive login preceding consent
- use: `ADD_LOGIN_ACTIVITY_DEVICE` Login from a device not seen before
- use: `CONTENT_ACCESS` File accessed by user or programmatically by a Box application
- use: `DOWNLOAD` File download
- revoke: `OAUTH2_ACCESS_TOKEN_REVOKE` Access token revoked
- revoke: `OAUTH2_REFRESH_TOKEN_REVOKE` Refresh token revoked
- revoke: `REMOVE_LOGIN_ACTIVITY_DEVICE` Box invalidated a user session associated with an app
- auth_fail: `FAILED_LOGIN` Failed interactive login (not API token failures)

### Correlate on
`created_by.id`, `created_by.login`, `ip_address`, `session_id`, `event_type`, `created_at`, `action_by`, `additional_details`

### API calls a holder can make, and whether they are logged
- recon: `GET /users/me`. the authenticated user (OAuth: the user who authorized the app) Logged: unknown. Enterprise events feed exists but docs do not state whether this read produces an event
- enumeration (bulk): `GET /folders/0/items`. items (files, folders, web links) under the account root (id 0); walk the tree Logged: unknown. Reads: docs do not state whether folder listing produces an enterprise event
- collection (bulk): `GET /files/{file_id}/content`. the file contents in binary Logged: yes (`DOWNLOAD`). Enterprise events (GET /events stream_type=admin_logs) list 'Downloaded'; 1yr historical, 2wk streaming, 7yr via Admin Console reports
- collection (bulk): `POST /zip_downloads`. download_url + status_url for a single zip of many files/folders Logged: unknown. Underlying file fetches may log as DOWNLOAD; a distinct zip event is not documented

### What to look for (analyst guidance)
- USER_AUTHENTICATE_OAUTH2_ACCESS_TOKEN_CREATE for a user right after ADD_LOGIN_ACTIVITY_DEVICE from a new IP
- Bulk DOWNLOAD/CONTENT_ACCESS by a user whose interactive LOGIN came from a different country or ASN
- Token creates for a user shortly after FAILED_LOGIN bursts (consent phishing after credential stuffing)
- Activity continuing after the user is deactivated or after OAUTH2_*_REVOKE
- Shield SHIELD_ALERT suspicious session/location tied to the same user

### Sample query (Box Events API (GET /events))
Pull OAuth token grants and new-device logins for 30 days to spot unexpected app consents

```
GET https://api.box.com/2.0/events?stream_type=admin_logs&event_type=USER_AUTHENTICATE_OAUTH2_ACCESS_TOKEN_CREATE,ADD_LOGIN_ACTIVITY_DEVICE,OAUTH2_ACCESS_TOKEN_REVOKE&created_after=2026-09-12T00:00:00-00:00&limit=500
```

## Respond: how to revoke it


POST /oauth2/revoke with client_id, client_secret and the access or refresh token; admin can disable the user-auth app in Admin Console > Platform > Platform Apps. Live access ends on revocation: partial. Revoke acts on the presented token; whether other tokens the same user granted the app are killed, and whether disabling the app ends live tokens, is not documented.

## No vendor documentation found
- IP restriction
- Field naming the OAuth client_id/app on token-create and use events
- Per-event keys of additional_details
- User-agent field in enterprise events
- Whether app disable invalidates already-issued tokens
- Whether folder-listing and GET /users/me reads produce enterprise events
- Whether POST /zip_downloads produces a distinct event vs per-file DOWNLOAD
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
- [Box API and SSO - Box Dev Docs](https://developer.box.com/guides/authentication/sso) (retrieved 2026-10-14)
- [API [Tokens]: How does password expiration affect existing tokens? – Box Support](https://support.box.com/hc/en-us/articles/360044192013-API-Tokens-How-does-password-expiration-affect-existing-tokens) (retrieved 2026-10-14)
- [Managing platform apps – Box Support](https://support.box.com/hc/en-us/articles/360044196653-Managing-platform-apps) (retrieved 2026-10-14)
- [Setting Up Single Sign-On (SSO) for Your Organization](https://support.box.com/hc/en-us/articles/360043696514-Setting-Up-Single-Sign-On-SSO-for-Your-Organization) (retrieved 2026-10-14)
- [Box: Access tokens](https://developer.box.com/guides/authentication/tokens/access-tokens/) (retrieved 2026-10-12)
- [Tokens](https://developer.box.com/guides/authentication/tokens/) (retrieved 2026-10-14)
- [Running Reports](https://support.box.com/hc/en-us/articles/360043696534-Running-Reports) (retrieved 2026-10-14)
- [User Activity Report](https://support.box.com/hc/en-us/articles/4415012490387-User-Activity-Report) (retrieved 2026-10-14)
- [Box API: List user and enterprise events](https://developer.box.com/reference/get-events/) (retrieved 2026-10-12)
- [Box: Monitor enterprise events](https://developer.box.com/guides/events/enterprise-events/for-enterprise/) (retrieved 2026-10-12)
- [Best Practice - Terminating Employees](https://support.box.com/hc/en-us/articles/360043693014-Best-Practice-Terminating-Employees) (retrieved 2026-10-14)
- [Update user](https://developer.box.com/reference/put-users-id/) (retrieved 2026-10-14)
- [Box Java SDK (vendor repo): BoxEvent](https://github.com/box/box-java-sdk/blob/legacy/src/main/java/com/box/sdk/BoxEvent.java) (retrieved 2026-10-12)
- [Box: Shield alert events](https://developer.box.com/guides/events/event-triggers/shield-alert-events/) (retrieved 2026-10-12)
- [Box: Revoke a token](https://developer.box.com/guides/authentication/tokens/revoke/) (retrieved 2026-10-12)
- [Box API: Revoke access token](https://developer.box.com/reference/post-oauth2-revoke/) (retrieved 2026-10-12)
- [Box Support: Managing custom apps](https://support.box.com/hc/en-us/articles/360044196653-Managing-custom-apps) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Get current user](https://developer.box.com/reference/get-users-me/) (retrieved 2026-10-12)
- [List items in folder](https://developer.box.com/reference/get-folders-id-items/) (retrieved 2026-10-12)
- [Download file](https://developer.box.com/reference/get-files-id-content/) (retrieved 2026-10-12)
- [Create zip download](https://developer.box.com/reference/post-zip-downloads/) (retrieved 2026-10-12)
- [Rate limits](https://developer.box.com/guides/api-calls/permissions-and-errors/rate-limits/) (retrieved 2026-10-12)
- [Enterprise Settings: Platform Apps](https://support.box.com/hc/en-us/articles/49348283011731-Enterprise-Settings-Platform-Apps) (retrieved 2026-10-13)
- [Managing platform apps](https://docs.box.com/en/box-admin-tools/how-to-guides-for-admins/managing-platform-apps) (retrieved 2026-10-13)
- [Application Settings for Your Enterprise](https://support.box.com/hc/en-us/articles/360044195293-Application-Settings-for-Your-Enterprise) (retrieved 2026-10-13)
