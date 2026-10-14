# Dropbox: User / team OAuth

`dropbox-1` · OAuth · person. OAuth 2.0 bearer for user/team access, with PKCE and scopes. App key/secret identifies the OAuth application.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | POST /2/team/linked_apps/list_members_linked_apps lists apps linked to members' accounts but does not list team-linked apps. | POST /2/team/linked_apps/list_members_linked_apps lists apps linked to members' accounts but does not list team-linked apps. |
| Protect: Admin can block or require approval | Yes (requires Standard, Business, Advanced, Business Plus, Enterprise; Business, Business Plus) | Default connection permissions: Connecting registered integrations = Block; Block specific apps; Manage custom apps (Not in App Center) - Allow/Block by app key or app ID; Team app installation is admin-only | Default connection permissions: Connecting registered integrations = Block: Admin console > Products > Dropbox > Settings > Integrations > Default connection permissions · Block specific apps: Admin console > Products > Dropbox > Settings > Integrations > app list > Block · Manage custom apps (Not in App Center) - Allow/Block by app key or app ID: Admin console > Products > Dropbox > Settings > Integrations > filter Not in App Center > enter app key/ID > Allow or Block · Team app installation is admin-only: Admin console > Integrations (team apps); not a toggle |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No general per-token or tenant API source-IP allowlist established in the reviewed public docs. |  |
| Protect: Expires automatically | Partial | Short-lived; honor expires_in | API: Read expires_in from the /oauth2/token response (authorization_code or refresh_token grant) |
| Detect: Usage appears in logs | Yes | details.app_info.app_id, details.app_info.display_name, origin.access_method.api.request_id, actor.app.app_id | Where: Admin console > Activity; filter by Date, Activities, People · API: team_log/get_events (scope events.read, Team Auditing); filter results on actor.app.app_id / details.app_info.app_id · Command: Python SDK: dbx.team_log_get_events(category=..., time=...) |
| Detect: Data reads appear in logs | Yes | file_download | Where: Admin console > Activity; filter Activities · API: team_log/get_events with event_type=file_download (not combinable with category) · Command: Python SDK: dbx.team_log_get_events(event_type=EventTypeArg.file_download) |
| Respond: Revocation ends active access | No docs found | Docs do not say whether unlinking immediately invalidates issued short-lived access tokens; token/revoke disables only the token used for the call. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Default connection permissions: Connecting registered integrations = Block** (Disable; Standard, Business, Advanced, Business Plus, Enterprise; default unknown). Blocks team members from connecting any registered (App Center) app to their work account. Where: Admin console > Products > Dropbox > Settings > Integrations > Default connection permissions.
- **Block specific apps** (Disable; Standard, Business, Advanced, Business Plus, Enterprise; default off). Blocks team members from connecting the selected apps; already-connected members stay connected. Where: Admin console > Products > Dropbox > Settings > Integrations > app list > Block.
- **Manage custom apps (Not in App Center) - Allow/Block by app key or app ID** (Disable; Standard, Business, Advanced, Business Plus, Enterprise; default unknown). Allows or blocks a specific non-App Center app (e.g. an internal or unlisted OAuth app) by its app key or app ID. Where: Admin console > Products > Dropbox > Settings > Integrations > filter Not in App Center > enter app key/ID > Allow or Block.
- **Team app installation is admin-only** (Require approval; Business, Business Plus; default on). Only team admins can install team-scoped apps; members who try get an error. Where: Admin console > Integrations (team apps); not a toggle.
- **Single sign-on (SSO): Required** (Require SSO; Advanced, Business Plus, Enterprise; default off). Team members must sign in through the IdP, so new OAuth authorizations require an IdP login; already-linked devices keep working. Where: Admin console > Settings > Authentication > Single sign-on (SSO) > Required.

### Not available (vendor states)
- Blocking an app does not revoke existing connections to it.
- Some calendar/contacts integrations cannot be blocked.
- Apps members linked individually cannot be managed from the App permissions page (only via activity log / team API).

- Network: unknown (checked at unknown). No general per-token or tenant API source-IP allowlist established in the reviewed public docs.
- Lifetime: Short-lived; honor expires_in. Renewal: Offline refresh tokens do not expire automatically; revocation and continued approval still apply.
- Keyless option: not_verified. Delegated user/team authorization is documented; no general external workload-token exchange established for file APIs.
- Conditions: Business SSO/app-management entitlement varies by plan. Dropbox Sign is a separate API and is excluded.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Dropbox team activity log (team_log/get_events): Team admin API, scope events.read, 'Team Auditing' permission. Records app link/unlink and actions taken via API (origin.access_method = api). Does not log every API read. Retention not established.
- team linked_apps/list_members_linked_apps: Inventory of apps linked by team members (scope sessions.list). Excludes team-linked apps.

### Fields that identify the credential
- `details.app_info.app_id` (team_log): App ID (dbaid:...) on app_link_user/app_unlink_user/app_link_team/app_unlink_team
- `details.app_info.display_name` (team_log): App display name
- `origin.access_method.api.request_id` (team_log): API request ID (dbarid:...) when the action came through the API
- `actor.app.app_id` (team_log): Set when the actor is an app (ActorLogInfo.app)

### Lifecycle events
- create: `app_link_user` (apps) Linked app for member: user granted OAuth
- create: `app_link_team` (apps) Linked app for team: team-scoped app authorized
- revoke: `app_unlink_user` (apps) Unlinked app for member
- revoke: `app_unlink_team` (apps) Unlinked app for team

### Correlate on
`actor.user.account_id`, `actor.user.team_member_id`, `actor.user.email`, `context`, `origin.geo_location.ip_address`, `origin.geo_location.country`, `origin.access_method.api.request_id`, `details.app_info.app_id`, `event_category`, `timestamp`

### API calls a holder can make, and whether they are logged
- collection: `POST /2/files/download`. File contents from a user's Dropbox Logged: yes (`file_download`). Team activity log (team_log/get_events) has a file_download event; actor can be an Application and origin access_method api with a request ID. Docs do not explicitly promise every API download emits it.

### Public detection rules (community, not vendor documentation)
- [Dropbox Linked Team Application Added](https://github.com/panther-labs/panther-analysis/blob/develop/rules/dropbox_rules/dropbox_linked_team_application_added.yml) (Panther): An app was linked to the Dropbox team (team-level OAuth grant).

### What to look for (analyst guidance)
- app_link_user for an app_id never seen in the team before, especially followed soon by bulk file/sharing events with access_method api
- API-origin events from a new country or IP for a member who rarely uses integrations
- app_link_user shortly after a password reset or sign-in from a new location
- Many members linking the same unfamiliar app_id within a short window (consent phishing)
- API-origin activity for a member after offboarding or suspension

### Sample query (Dropbox team_log/get_events request (JSON body))
List all app link/unlink events to find newly authorized OAuth apps per member.

```
POST https://api.dropboxapi.com/2/team_log/get_events {"limit": 1000, "category": "apps"}  -- then page with get_events/continue and group by details.app_info.app_id, actor.user.account_id
```

## Respond: how to revoke it
- Admin: **Revoke a member-linked app (team API)**. Revokes an app that a team member linked to their own account; requires a team-authorized admin app with sessions.modify. Where: API: POST /2/team/linked_apps/revoke_linked_app (and revoke_linked_app_batch); list with /2/team/linked_apps/list_members_linked_apps.

Admin: POST team/linked_apps/revoke_linked_app (app_id + team_member_id) or revoke_linked_app_batch; app owner: auth/token/revoke with the token; user: unlink in account settings. Rotate the app secret if the app key/secret leaked. Blocking the app in App permissions does not disconnect existing users. Live access ends on revocation: unknown. Docs do not say whether unlinking immediately invalidates issued short-lived access tokens; token/revoke disables only the token used for the call.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Revocation ends active access
- Stops working when user is removed
- Activity log retention period
- Whether revoke_linked_app or app_unlink kills already-issued access tokens immediately
- Token prefix/regex
- User agent field in team_log (none found)
- Exact serialized shape of origin.access_method for app-originated calls (only api.request_id documented)
- Default value of "Connecting registered integrations" (allow vs block) is not stated.
- Whether switching SSO to Required revokes existing OAuth access/refresh tokens; docs only say linked devices keep working.
- No admin control found to restrict OAuth scope or force app-folder-only access, set token lifetime, or IP-restrict API calls.
- Exact plan coverage of the team linked-apps API endpoints is not stated in the spec.

## Sources
- [Dropbox OAuth Guide - Dropbox](https://docs.dropboxapi.com/dropbox-api/docs/oauth) (retrieved 2026-10-09)
- [Using OAuth 2.0 with offline access - Dropbox](https://dropbox.tech/developers/using-oauth-2-0-with-offline-access) (retrieved 2026-10-09)
- [Dropbox API v2 HTTP documentation (formerly the Paper API alpha page)](https://www.dropbox.com/developers/paper-api-alpha) (retrieved 2026-10-09)
- [How to manage apps for your Dropbox team - Dropbox Help](https://help.dropbox.com/integrations/app-integrations) (retrieved 2026-10-09)
- [Dropbox API spec (official, GitHub) - linked_apps/list_members_linked_apps](https://raw.githubusercontent.com/dropbox/dropbox-api-spec/master/team_linked_apps.stone) (retrieved 2026-10-14)
- [Dropbox OAuth Guide](https://developers.dropbox.com/oauth-guide) (retrieved 2026-10-14)
- [Dropbox API spec: team_log.stone (official)](https://raw.githubusercontent.com/dropbox/dropbox-api-spec/master/team_log.stone) (retrieved 2026-10-14)
- [Dropbox Python SDK team_log.py (official)](https://raw.githubusercontent.com/dropbox/dropbox-sdk-python/main/dropbox/team_log.py) (retrieved 2026-10-14)
- [View team activity in the admin console](https://help.dropbox.com/account-access/view-activity) (retrieved 2026-10-14)
- [Dropbox Python SDK base_team.py (official)](https://raw.githubusercontent.com/dropbox/dropbox-sdk-python/main/dropbox/base_team.py) (retrieved 2026-10-14)
- [Dropbox API spec: team_log_generated.stone (TeamEvent)](https://github.com/dropbox/dropbox-api-spec/blob/master/team_log_generated.stone) (retrieved 2026-10-12)
- [Dropbox API spec: team_log.stone (get_events)](https://github.com/dropbox/dropbox-api-spec/blob/master/team_log.stone) (retrieved 2026-10-12)
- [Dropbox API spec: team_linked_apps.stone](https://github.com/dropbox/dropbox-api-spec/blob/master/team_linked_apps.stone) (retrieved 2026-10-12)
- [Dropbox API spec: auth.stone](https://github.com/dropbox/dropbox-api-spec/blob/master/auth.stone) (retrieved 2026-10-12)
- [How to manage apps for your Dropbox team](https://help.dropbox.com/teams-admins/admin/app-integrations) (retrieved 2026-10-12)
- [Stone JSON serializer](https://github.com/dropbox/stone/blob/main/docs/json_serializer.rst) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Dropbox API spec (official, GitHub) - files/download](https://raw.githubusercontent.com/dropbox/dropbox-api-spec/master/files.stone) (retrieved 2026-10-14)
- [Dropbox API spec (official, GitHub) - team_log event types](https://raw.githubusercontent.com/dropbox/dropbox-api-spec/master/team_log_generated.stone) (retrieved 2026-10-14)
- [Get Events v2 Migration Guide](https://www.dropbox.com/developers/reference/events-migration-guide) (retrieved 2026-10-14)
- [What is the Dropbox Business API, and what apps are available for my team?](https://help.dropbox.com/integrations/business-api) (retrieved 2026-10-13)
- [dropbox-api-spec team.stone (official Dropbox API spec)](https://github.com/dropbox/dropbox-api-spec/blob/main/team.stone) (retrieved 2026-10-13)
- [How to enable single sign-on (SSO) for your team - Dropbox Help](https://help.dropbox.com/security/sso-admin) (retrieved 2026-10-09)
