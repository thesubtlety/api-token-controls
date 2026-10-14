# Slack: MCP enterprise-managed authorization

`slack-3` · Federated identity · person. OAuth bot/user bearer tokens; app-level tokens for selected functions.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | EMA apps are org-level installs, visible in Integrations > Installed apps; individual MCP tokens are not listed. | EMA apps are org-level installs, visible in Integrations > Installed apps; individual MCP tokens are not listed. |
| Protect: Admin can block or require approval | Yes | Require approved apps (Only allow pre-approved apps); Restrict app; App Management policy (Require App Approval); Restrict for Organization; MCP client app approval | Require approved apps (Only allow pre-approved apps): Admin > Apps and workflows > App Management Settings > Require approved apps · Restrict app: Admin > Apps and workflows > Browse > [app] > Restrict · App Management policy (Require App Approval): Organization settings > Settings > Organization Policies > Apps > App Management > Add Policy · Restrict for Organization: Org app request notification > Restrict for Organization; or admin.apps.restrict API · MCP client app approval: Same as app approval settings |
| Protect: SSO and MFA rules apply | Yes | Tokens are issued only from an IdP credential, and IdP admins decide which permissions each user gets for the MCP server. | Where: In the IdP: set which permissions each user gets for the Slack MCP server (token-exchange policy for audience https://mcp.slack.com/) |
| Protect: IP restriction | Yes | The app's Allowed IP Address Ranges (Restrict API Token Usage) also apply to Slack MCP server requests. The app owner sets the list, not the customer org admin; IPv6 is not supported. | Restrict API Token Usage (Allowed IP Address Ranges): App settings > OAuth & Permissions > Restrict API Token Usage |
| Protect: Expires automatically | Yes | Currently 1 hour | API: oauth.v2.user.access response field expires_in (3600) |
| Detect: Usage appears in logs | Yes | context.app.id, actor.user.id | Slack Audit Logs API (GET https://api.slack.com/audit/v1/logs): Enterprise plan. MCP tool calls logged as mcp_slack_*_tool_called; slack_ai_api_tool_called for API calls by AI apps. · Identity provider system log (Okta): ID-JAG issuance happens at the IdP; Okta is the only supported IdP for Slack MCP EMA in Claude. Event names not covered by Slack docs. |
| Detect: Data reads appear in logs | Conditional | Slack Enterprise audit log; mcp_slack_search_public_tool_called for public only.; Slack Enterprise audit log; mcp_slack_read_thread_tool_called for threads. | Where: Organization settings > Security > Audit logs > Filter > Events · API: GET https://api.slack.com/audit/v1/logs?action=mcp_slack_read_channel_tool_called,mcp_slack_read_thread_tool_called,mcp_slack_search_public_and_private_tool_called,mcp_slack_search_public_tool_called |
| Respond: Revocation ends active access | Partial | auth.revoke kills one access token at once, but the client's long-lived IdP credential can mint new tokens until the IdP or app side is revoked. EMA docs do not describe revocation. | Where: Remove the user's access to the app in the IdP; in Slack: Manage apps > Installed Apps > App Details > Configuration > Remove App · API: GET https://slack.com/api/auth.revoke (captured xoxp); POST https://slack.com/api/admin.apps.uninstall |
| Respond: Stops working when user is removed | Yes | EMA returns xoxp user tokens, and Slack revokes a member's API tokens when the member is deactivated. | Where: Organization settings > People > Members > select > Deactivate · API: SCIM DELETE /Users/{id} (deactivates) |

## Protect: what an admin can configure

### Admin controls
- **Require approved apps (Only allow pre-approved apps)** (Require approval; all plans; default off). Members can only install pre-approved apps; others must be requested and approved, and approval covers the scopes the app will use. Where: Admin > Apps and workflows > App Management Settings > Require approved apps.
- **Restrict app** (Disable; all plans; default off). Blocks members from installing or requesting a specific app; existing installs keep working until uninstalled. Where: Admin > Apps and workflows > Browse > [app] > Restrict.
- **App Management policy (Require App Approval)** (Require approval; Enterprise; default off). Turns on app approval for every workspace in the Enterprise org. Where: Organization settings > Settings > Organization Policies > Apps > App Management > Add Policy.
- **Restrict for Organization** (Disable; Enterprise; default off). Org Owners/Admins can block an app from being installed anywhere in the org when reviewing a request. Where: Org app request notification > Restrict for Organization; or admin.apps.restrict API.
- **Member Permissions: who can use the app** (Limit resources; Enterprise; default off). Limits which members (everyone, no one, or specific people/groups) can initiate interaction with an installed app. Where: Organization settings > Integrations > Installed apps > [app] > Member Permissions > Who has permission to initiate interaction with this app.
- **Enterprise-Managed Authorization (EMA)** (Require SSO; Slack Enterprise+ (Okta IdP; Claude Team/Enterprise); default off). Lets the IdP (Okta) provision and govern access to the Slack MCP server from Claude via ID-JAG; Org Owner enables it and sets the issuer URL. Where: Organization settings > Security > SSO settings > Enterprise-Managed Authorization > Edit.
- **MCP client app approval** (Require approval; all plans; default varies). MCP clients must be backed by a registered Slack app, so the normal app approval process gates MCP access. Where: Same as app approval settings.
- **Restrict API Token Usage (Allowed IP Address Ranges)** (Limit network; all plans; default off). Rejects Web API, SCIM API and MCP server calls made with the app's tokens from IPs not on the list (max 20 IPv4 entries). Where: App settings > OAuth & Permissions > Restrict API Token Usage.

### Not available (vendor states)
- Unlisted (non-Marketplace, non-internal) apps cannot use the Slack MCP server at all; admins cannot allow them.

- Network: supported (checked at api_request). The app's Allowed IP Address Ranges (Restrict API Token Usage) also apply to Slack MCP server requests. The app owner sets the list, not the customer org admin; IPv6 is not supported.
- Lifetime: Currently 1 hour. Renewal: Obtain another MCP user token through the IdP/ID-JAG exchange.
- Keyless option: limited. Enterprise-managed authorization exchanges external IdP ID-JAGs for user access to Slack MCP. It is not general bot/workload federation.
- Conditions: SAML SSO requires eligible Business+/Enterprise tiers. EMA uses organization-level installations and MCP user tokens.

## Detect: what gets logged
- Token prefix: `xoxp-`

### Logs
- Slack Audit Logs API (GET https://api.slack.com/audit/v1/logs): Enterprise plan. MCP tool calls logged as mcp_slack_*_tool_called; slack_ai_api_tool_called for API calls by AI apps.
- Identity provider system log (Okta): ID-JAG issuance happens at the IdP; Okta is the only supported IdP for Slack MCP EMA in Claude. Event names not covered by Slack docs.

### Fields that identify the credential
- `context.app.id` (Audit Logs API): AI app calling the MCP server
- `actor.user.id` (Audit Logs API): User on whose behalf the tool ran

### Lifecycle events
- create: `app_installed` MCP client app (e.g. Claude) installed before EMA is enabled
- use: `mcp_slack_search_public_and_private_tool_called` AI app searched public and private content
- use: `mcp_slack_read_channel_tool_called` AI app read a channel
- use: `mcp_slack_send_message_tool_called` AI app sent a message on behalf of a user
- use: `slack_ai_api_tool_called` AI app called a Slack API method on a user's behalf
- revoke: `app_uninstalled` Removes the MCP client app

### Correlate on
`actor.user.id`, `actor.user.email`, `context.app.id`, `context.ip_address`, `context.ua`, `context.session_id`

### API calls a holder can make, and whether they are logged
- recon: `Okta token exchange issuing ID-JAG for Slack (Cross App Access)`. ID-JAG assertion the MCP client exchanges for a Slack token Logged: yes (`app.oauth2.token.grant.id_jag`). Logged in Okta System Log (IdP side), not Slack.
- enumeration: `MCP tool: search users (POST https://mcp.slack.com/mcp)`. Users matching a query Logged: plan (`mcp_slack_search_users_tool_called`). Slack Enterprise audit log; records an AI app acting for a user.
- discovery: `MCP tool: search channels`. Channels matching a query Logged: plan (`mcp_slack_search_channels_tool_called`). Slack Enterprise audit log.
- collection (bulk): `MCP tool: search public and private content`. Messages and files across the user's visible content Logged: plan (`mcp_slack_search_public_and_private_tool_called`). Slack Enterprise audit log; mcp_slack_search_public_tool_called for public only.
- collection (bulk): `MCP tool: read channel / read thread`. Channel or thread message contents Logged: plan (`mcp_slack_read_channel_tool_called`). Slack Enterprise audit log; mcp_slack_read_thread_tool_called for threads.

### Public detection rules (community, not vendor documentation)
- [Slack App Added](https://github.com/panther-labs/panther-analysis/blob/develop/rules/slack_rules/slack_app_added.yml) (Panther): A Slack app was approved, installed, or added to a workspace in an Enterprise org.
- [Slack App Removed](https://github.com/panther-labs/panther-analysis/blob/develop/rules/slack_rules/slack_app_removed.yml) (Panther): A Slack app was restricted, uninstalled, or removed from a workspace.

### What to look for (analyst guidance)
- mcp_slack_search_public_and_private_tool_called bursts for one user outside working hours
- MCP tool calls continuing for a user already deprovisioned in the IdP (should stop within ~1 h token life)
- mcp_slack_send_message_tool_called volume spike or messages to external/shared channels
- MCP tool calls from an app ID other than the approved MCP client
- Slack MCP use with no matching IdP token-exchange event in Okta

### Sample query (Slack Audit Logs API (GET /audit/v1/logs query parameters))
Review MCP tool activity for one user during an investigation

```
GET https://api.slack.com/audit/v1/logs?action=mcp_slack_search_public_and_private_tool_called,mcp_slack_send_message_tool_called,slack_ai_api_tool_called&actor=W0000EXAMPLE&oldest=1759622400
```

## Respond: how to revoke it
- Admin: **Remove or uninstall an org-level app**. Org admins can remove an org-installed app from workspaces or uninstall it from the whole org. Where: Organization settings > Integrations > Installed apps; or admin.apps.uninstall API.

Remove the user's or app's access in the IdP (Okta) so no new ID-JAG is issued; uninstall or restrict the MCP client app in Slack; auth.revoke any captured xoxp token. Live access ends on revocation: partial. auth.revoke kills one access token at once, but the client's long-lived IdP credential can mint new tokens until the IdP or app side is revoked. EMA docs do not describe revocation.

## No vendor documentation found
- Revocation mechanism and effect on issued EMA tokens
- Audit event for enabling/disabling EMA or for each token exchange
- Okta event names for ID-JAG issuance
- Whether Slack issues refresh tokens for EMA
- Exact MCP tool identifiers (docs give capabilities and audit action names, not a full tool-name list)
- Whether Slack logs the ID-JAG-to-token exchange on its side
- No tenant-admin IP allowlist for app tokens found; 'Restrict API Token Usage' IP ranges are set by the app developer in app config, not by workspace admins.
- Whether admins can force-revoke individual user tokens without uninstalling the app.
- Whether EMA lets admins restrict MCP scopes beyond IdP assignment.

## Sources
- [Using token rotation | Slack Developer Docs](https://docs.slack.dev/authentication/using-token-rotation/) (retrieved 2026-10-09)
- [Enterprise-managed authorization | Slack Developer Docs](https://docs.slack.dev/authentication/enterprise-managed-authorization) (retrieved 2026-10-09)
- [Slack MCP server | Slack Developer Docs](https://docs.slack.dev/ai/mcp-server/) (retrieved 2026-10-14)
- [Security best practices | Slack Developer Docs](https://docs.slack.dev/concepts/security/) (retrieved 2026-10-09)
- [Manage deactivated members' apps and integrations | Slack](https://slack.com/help/articles/360000446446-Manage-deactivated-members-apps-and-integrations) (retrieved 2026-10-14)
- [Manage apps in an Enterprise organization | Slack](https://slack.com/help/articles/360000281563-Manage-apps-in-an-Enterprise-organization) (retrieved 2026-10-14)
- [Audit logs in Slack](https://slack.com/help/articles/360000394286-Audit-logs-in-Slack) (retrieved 2026-10-14)
- [Audit Logs API methods & actions](https://docs.slack.dev/reference/audit-logs-api/methods-actions-reference) (retrieved 2026-10-12)
- [auth.revoke](https://docs.slack.dev/reference/methods/auth.revoke) (retrieved 2026-10-12)
- [admin.apps.uninstall](https://docs.slack.dev/reference/methods/admin.apps.uninstall) (retrieved 2026-10-12)
- [Remove apps and custom integrations from your workspace](https://slack.com/help/articles/360003125231-Remove-apps-and-custom-integrations-from-your-workspace) (retrieved 2026-10-14)
- [Deactivate a member's account](https://slack.com/help/articles/204475027-Deactivate-a-members-account) (retrieved 2026-10-14)
- [SCIM API reference](https://docs.slack.dev/reference/scim-api) (retrieved 2026-10-14)
- [Manage access to the Slack MCP server through your identity provider](https://slack.com/help/articles/54548358406419-Manage-access-to-the-Slack-MCP-server-through-your-identity-provider) (retrieved 2026-10-12)
- [Using the Audit Logs API](https://docs.slack.dev/admins/audit-logs-api) (retrieved 2026-10-12)
- [Okta Event Types](https://developer.okta.com/docs/reference/api/event-types/) (retrieved 2026-10-12)
- [Slack MCP server](https://docs.slack.dev/ai/slack-mcp-server.md) (retrieved 2026-10-12)
- [Manage app approval for your workspace | Slack](https://slack.com/help/articles/222386767-Manage-app-approval-for-your-workspace) (retrieved 2026-10-13)
- [Set organization-level policies for apps | Slack](https://slack.com/help/articles/360038559694-Set-organization-policies-for-apps-on-Enterprise-Grid) (retrieved 2026-10-13)
- [Manage apps in an Enterprise organization | Slack](https://slack.com/help/articles/360000281563-Manage-apps-on-Enterprise-Grid) (retrieved 2026-10-13)
- [Slack MCP server](https://docs.slack.dev/ai/slack-mcp-server) (retrieved 2026-10-12)
