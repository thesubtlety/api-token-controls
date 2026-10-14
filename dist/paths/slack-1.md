# Slack: Bot / user OAuth token

`slack-1` · OAuth · person or service. OAuth bot/user bearer tokens; app-level tokens for selected functions.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Org admins can list installed apps (Integrations > Installed apps, Export CSV), not individual tokens. | Org admins can list installed apps (Integrations > Installed apps, Export CSV), not individual tokens. |
| Protect: Admin can block or require approval | Yes | Require approved apps (Only allow pre-approved apps); Restrict app; App Management policy (Require App Approval); Restrict for Organization | Require approved apps (Only allow pre-approved apps): Admin > Apps and workflows > App Management Settings > Require approved apps · Restrict app: Admin > Apps and workflows > Browse > [app] > Restrict · App Management policy (Require App Approval): Organization settings > Settings > Organization Policies > Apps > App Management > Add Policy · Restrict for Organization: Org app request notification > Restrict for Organization; or admin.apps.restrict API |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | App-level allowlist supports up to 20 IPv4 ranges for Web API and SCIM. Incoming webhooks are excluded. | Restrict API Token Usage (Allowed IP Address Ranges): App settings > OAuth & Permissions > Restrict API Token Usage |
| Protect: Expires automatically | Partial (requires Enterprise) | Non-expiring unless rotation enabled Admin control: Token rotation policy. | Token rotation policy: Organization settings > Settings > Organization Policies > Apps > Token rotation > Add Policy |
| Detect: Usage appears in logs | Yes | context.app.id, context.app.scopes / context.app.scopes_bot, context.app.creator, actor.user.id, entity.app (entity.type=app) | Slack Audit Logs API (GET https://api.slack.com/audit/v1/logs): Enterprise plan only; app must have auditlogs:read and be installed org-wide by the Owner. Records app install/scope/token lifecycle; app-triggered events carry context.app. No data before March 2018; retention not documented. Tier 3, per-org rate limit. · Audit Logs anomaly events (action=anomaly): Flags token IP/ASN/Tor anomalies and unexpected_credential_testing for apps. · team.accessLogs: Paid plans. Per user/IP/user_agent aggregates (date_first, date_last, count). Does not state whether bot/API token use is included. |
| Detect: Data reads appear in logs | Conditional | Enterprise audit action 'A file was downloaded or viewed within Slack'; docs do not state whether API-driven downloads emit it. Anomaly excessive_downloads covers apps and users. | Where: Organization settings > Security > Audit logs > Filter > Events (file downloaded) and Acting user · API: GET https://api.slack.com/audit/v1/logs?action=file_downloaded (filter entries on context.app.id; actor= for user) |
| Respond: Revocation ends active access | Partial | auth.revoke kills one token only; other user/bot tokens of the same app stay valid until uninstall. Revoking a bot token deactivates the bot user and removes its channel memberships but does not uninstall the app. | Where: Tools & settings > Manage apps > Installed Apps > App Details > Configuration > Remove App (or Authorizations > Authorized members > See all > Revoke) · API: GET https://slack.com/api/auth.revoke (one token); POST https://slack.com/api/apps.uninstall; POST https://slack.com/api/admin.apps.uninstall (app_id + enterprise_id or team_ids) |
| Respond: Stops working when user is removed | Partial | User tokens are revoked when the authorizing member is deactivated; bot tokens are tied to the app and keep working. | Where: Enterprise: Organization settings > People > Members > select > Deactivate. Other plans: Admin > Workspace settings > People > three dots > Deactivate account. Bot tokens: uninstall the app (see kill) · API: SCIM DELETE /Users/{id} (deactivates) |

## Protect: what an admin can configure

### Admin controls
- **Require approved apps (Only allow pre-approved apps)** (Require approval; all plans; default off). Members can only install pre-approved apps; others must be requested and approved, and approval covers the scopes the app will use. Where: Admin > Apps and workflows > App Management Settings > Require approved apps.
- **Restrict app** (Disable; all plans; default off). Blocks members from installing or requesting a specific app; existing installs keep working until uninstalled. Where: Admin > Apps and workflows > Browse > [app] > Restrict.
- **App Management policy (Require App Approval)** (Require approval; Enterprise; default off). Turns on app approval for every workspace in the Enterprise org. Where: Organization settings > Settings > Organization Policies > Apps > App Management > Add Policy.
- **Restrict for Organization** (Disable; Enterprise; default off). Org Owners/Admins can block an app from being installed anywhere in the org when reviewing a request. Where: Org app request notification > Restrict for Organization; or admin.apps.restrict API.
- **Token rotation policy** (Require rotation; Enterprise; default off). Requires OAuth token rotation for apps and expires unused refresh tokens after 30 days; applies only to installs and updates after it is turned on. Where: Organization settings > Settings > Organization Policies > Apps > Token rotation > Add Policy.
- **Slack Marketplace installations policy** (Limit scope; Enterprise; default off). Limits members to installing apps listed in the Slack Marketplace. Where: Organization settings > Settings > Organization Policies > Apps > Slack Marketplace installations.
- **Member Permissions: who can use the app** (Limit resources; Enterprise; default off). Limits which members (everyone, no one, or specific people/groups) can initiate interaction with an installed app. Where: Organization settings > Integrations > Installed apps > [app] > Member Permissions > Who has permission to initiate interaction with this app.
- **Member Permissions: where can this app be used** (Limit resources; Enterprise; default off). Limits an installed app to all channels, only specific channels, or all channels except some. Where: Organization settings > Integrations > Installed apps > [app] > Member Permissions > Where can this app be used.
- **Restrict API Token Usage (Allowed IP Address Ranges)** (Limit network; all plans; default off). Rejects Web API, SCIM API and MCP server calls made with the app's tokens from IPs not on the list (max 20 IPv4 entries). Where: App settings > OAuth & Permissions > Restrict API Token Usage.

### Not available (vendor states)
- The token rotation org policy does not apply to apps already installed before it is turned on.

- Network: supported (checked at api_request). App-level allowlist supports up to 20 IPv4 ranges for Web API and SCIM. Incoming webhooks are excluded.
- Lifetime: Non-expiring unless rotation enabled. Renewal: Standard bot/user tokens are non-expiring until rotation is enabled or access is revoked.
- Keyless option: not_verified. Enterprise-managed authorization exchanges external IdP ID-JAGs for user access to Slack MCP. It is not general bot/workload federation.
- Conditions: SAML SSO requires eligible Business+/Enterprise tiers. EMA uses organization-level installations and MCP user tokens.

## Detect: what gets logged
- Token prefix: `xoxb- / xoxp- (xapp- for app-level)`

### Logs
- Slack Audit Logs API (GET https://api.slack.com/audit/v1/logs): Enterprise plan only; app must have auditlogs:read and be installed org-wide by the Owner. Records app install/scope/token lifecycle; app-triggered events carry context.app. No data before March 2018; retention not documented. Tier 3, per-org rate limit.
- Audit Logs anomaly events (action=anomaly): Flags token IP/ASN/Tor anomalies and unexpected_credential_testing for apps.
- team.accessLogs: Paid plans. Per user/IP/user_agent aggregates (date_first, date_last, count). Does not state whether bot/API token use is included.

### Fields that identify the credential
- `context.app.id` (Audit Logs API): App that made the request
- `context.app.scopes / context.app.scopes_bot` (Audit Logs API): User-token vs bot-token scopes of the app
- `context.app.creator` (Audit Logs API): User ID that created the app
- `actor.user.id` (Audit Logs API): User behind a user token (xoxp)
- `entity.app (entity.type=app)` (Audit Logs API): Target app for lifecycle events; nested key names not confirmed

### Lifecycle events
- create: `app_approved` Approved, not yet installed
- create: `app_installed` Tokens issued on install
- change: `app_scopes_expanded` Additional OAuth scopes granted
- change: `app_resources_added` Resource access granted
- change: `bot_token_upgraded` Bot token moved to granular permissions
- change: `bot_token_downgraded` Bot token moved to non-granular permissions
- change: `app_token_preserved` Token kept instead of revoked when owner/installer removed
- change: `org_app_upgraded_to_org_install` Access extended to all workspaces
- revoke: `app_uninstalled` App uninstalled
- revoke: `app_restricted` App blocked from install
- revoke: `app_deleted` App deleted
- use: `anomaly` details.reason e.g. ip_address, asn, tor, unexpected_credential_testing (app)

### Correlate on
`actor.user.id`, `actor.user.email`, `context.ip_address`, `context.ua`, `context.session_id`, `context.location.id`, `context.app.id`, `entity.type`, `details.reason`, `details.previous_ip_address`

### API calls a holder can make, and whether they are logged
- recon: `auth.test`. team, user, team_id, user_id, url (bot_id for bot tokens) Logged: unknown. No documented audit action for auth.test; the app-only anomaly unexpected_credential_testing may fire on suspicious validity testing (Enterprise only).
- enumeration (bulk): `users.list`. All workspace members and profiles Logged: unknown. No documented audit action for this read; user-token anomaly unexpected_api_call_volume may apply (Enterprise).
- discovery (bulk): `conversations.list`. Channels and DMs the token can see Logged: unknown. No documented audit action for this read.
- collection (bulk): `conversations.history`. Full message history of a channel Logged: unknown. No documented audit action for API message reads; audit logs do not expose message content.
- collection (bulk): `search.messages`. Keyword search across messages the user can read Logged: unknown. No documented audit action; user-token anomalies unexpected_scraping / unexpected_api_call_volume may fire (Enterprise).
- collection (bulk): `files.list`. File listing including download URLs Logged: plan (`file_downloaded`). Enterprise audit action 'A file was downloaded or viewed within Slack'; docs do not state whether API-driven downloads emit it. Anomaly excessive_downloads covers apps and users.

### Public detection rules (community, not vendor documentation)
- [Slack App Added](https://github.com/panther-labs/panther-analysis/blob/develop/rules/slack_rules/slack_app_added.yml) (Panther): A Slack app was approved, installed, or added to a workspace in an Enterprise org.
- [Slack App Access Expanded](https://github.com/panther-labs/panther-analysis/blob/develop/rules/slack_rules/slack_app_access_expanded.yml) (Panther): A Slack app gained scopes or resources, or its bot token was upgraded.
- [Slack App Removed](https://github.com/panther-labs/panther-analysis/blob/develop/rules/slack_rules/slack_app_removed.yml) (Panther): A Slack app was restricted, uninstalled, or removed from a workspace.
- [Slack Anomaly Detected](https://github.com/panther-labs/panther-analysis/blob/develop/rules/slack_rules/slack_passthrough_anomaly.yml) (Panther): Slack anomaly events, including unusual IP or user agent for a user token and unexpected API call volume.

### What to look for (analyst guidance)
- app_token_preserved followed by continued app activity after the installer left
- app_scopes_expanded or bot_token_downgraded outside a change window
- anomaly with reason=ip_address and ip_address_details new-asn or cloud-asn for an xoxp token
- anomaly reason=unexpected_credential_testing on an app (leaked token being validated)
- excessive_downloads by an app shortly after app_installed
- GitHub secret scanning alert for slack_api_token with validity active

### Sample query (Slack Audit Logs API (GET /audit/v1/logs query parameters))
Pull app token lifecycle changes and anomalies for the last 30 days

```
GET https://api.slack.com/audit/v1/logs?action=app_installed,app_scopes_expanded,app_token_preserved,bot_token_downgraded,app_uninstalled,anomaly&oldest=1757635200&limit=1000
```

## Respond: how to revoke it
- Admin: **Remove or uninstall an org-level app**. Org admins can remove an org-installed app from workspaces or uninstall it from the whole org. Where: Organization settings > Integrations > Installed apps; or admin.apps.uninstall API.

Call auth.revoke with the leaked token; or uninstall the app (apps.uninstall, or admin.apps.uninstall with app_id + enterprise_id/team_ids); restrict the app to block reinstall; rotate the client secret before reinstall. Live access ends on revocation: partial. auth.revoke kills one token only; other user/bot tokens of the same app stay valid until uninstall. Revoking a bot token deactivates the bot user and removes its channel memberships but does not uninstall the app.

## No vendor documentation found
- SSO and MFA rules apply
- Per-API-call usage log keyed by token (no documented Web API call log)
- Exact nested key names of entity when entity.type=app
- Audit log retention period
- Vendor regex for token body
- Whether team.accessLogs includes bot token usage
- Whether Web API reads (conversations.history, users.list, search.messages) appear in any Slack log; docs neither list nor deny them
- Whether bot downloads via url_private emit file_downloaded
- Audit Logs API retention period
- No tenant-admin IP allowlist for app tokens found; 'Restrict API Token Usage' IP ranges are set by the app developer in app config, not by workspace admins.
- Whether admins can force-revoke individual user tokens without uninstalling the app.
- Whether EMA lets admins restrict MCP scopes beyond IdP assignment.

## Sources
- [Using token rotation | Slack Developer Docs](https://docs.slack.dev/authentication/using-token-rotation/) (retrieved 2026-10-09)
- [Enterprise-managed authorization | Slack Developer Docs](https://docs.slack.dev/authentication/enterprise-managed-authorization) (retrieved 2026-10-09)
- [Security best practices | Slack Developer Docs](https://docs.slack.dev/concepts/security/) (retrieved 2026-10-09)
- [Tokens | Slack Developer Docs](https://docs.slack.dev/authentication/tokens/) (retrieved 2026-10-14)
- [Manage deactivated members' apps and integrations | Slack](https://slack.com/help/articles/360000446446-Manage-deactivated-members-apps-and-integrations) (retrieved 2026-10-14)
- [Installing via OAuth authorization code flow | Slack Developer Docs](https://docs.slack.dev/authentication/installing-with-oauth/) (retrieved 2026-10-14)
- [Manage apps in an Enterprise organization | Slack](https://slack.com/help/articles/360000281563-Manage-apps-in-an-Enterprise-organization) (retrieved 2026-10-14)
- [Audit logs in Slack](https://slack.com/help/articles/360000394286-Audit-logs-in-Slack) (retrieved 2026-10-14)
- [Audit Logs API methods & actions](https://docs.slack.dev/reference/audit-logs-api/methods-actions-reference) (retrieved 2026-10-12)
- [Using the Audit Logs API](https://docs.slack.dev/admins/audit-logs-api) (retrieved 2026-10-12)
- [auth.revoke](https://docs.slack.dev/reference/methods/auth.revoke) (retrieved 2026-10-12)
- [admin.apps.uninstall](https://docs.slack.dev/reference/methods/admin.apps.uninstall) (retrieved 2026-10-12)
- [apps.uninstall method](https://docs.slack.dev/reference/methods/apps.uninstall) (retrieved 2026-10-14)
- [Remove apps and custom integrations from your workspace](https://slack.com/help/articles/360003125231-Remove-apps-and-custom-integrations-from-your-workspace) (retrieved 2026-10-14)
- [Using token rotation](https://docs.slack.dev/authentication/using-token-rotation) (retrieved 2026-10-14)
- [Deactivate a member's account](https://slack.com/help/articles/204475027-Deactivate-a-members-account) (retrieved 2026-10-14)
- [SCIM API reference](https://docs.slack.dev/reference/scim-api) (retrieved 2026-10-14)
- [Tokens](https://docs.slack.dev/authentication/tokens) (retrieved 2026-10-12)
- [Anomalous events reference](https://docs.slack.dev/reference/audit-logs-api/anomalous-events-reference) (retrieved 2026-10-12)
- [team.accessLogs](https://docs.slack.dev/reference/methods/team.accessLogs) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [auth.test method](https://docs.slack.dev/reference/methods/auth.test) (retrieved 2026-10-12)
- [users.list method](https://docs.slack.dev/reference/methods/users.list) (retrieved 2026-10-12)
- [conversations.list method](https://docs.slack.dev/reference/methods/conversations.list) (retrieved 2026-10-12)
- [conversations.history method](https://docs.slack.dev/reference/methods/conversations.history) (retrieved 2026-10-12)
- [search.messages method](https://docs.slack.dev/reference/methods/search.messages) (retrieved 2026-10-12)
- [files.list method](https://docs.slack.dev/reference/methods/files.list) (retrieved 2026-10-12)
- [Manage app approval for your workspace | Slack](https://slack.com/help/articles/222386767-Manage-app-approval-for-your-workspace) (retrieved 2026-10-13)
- [Set organization-level policies for apps | Slack](https://slack.com/help/articles/360038559694-Set-organization-policies-for-apps-on-Enterprise-Grid) (retrieved 2026-10-13)
- [Manage apps in an Enterprise organization | Slack](https://slack.com/help/articles/360000281563-Manage-apps-on-Enterprise-Grid) (retrieved 2026-10-13)
- [Slack MCP server | Slack Developer Docs](https://docs.slack.dev/ai/mcp-server/) (retrieved 2026-10-14)
