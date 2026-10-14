# Notion: Internal connection token

`notion-1` · API key / token · service. Internal connection tokens, personal access tokens and public-connection OAuth bearer tokens.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Every Workspace Owner sees all internal connections in the Developer portal; Settings → Connections lists all workspace connections. | Every Workspace Owner sees all internal connections in the Developer portal; Settings → Connections lists all workspace connections. |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | Limit which connections members can install; Who can add integrations (organization security setting) | Limit which connections members can install: Settings > Connections > Manage tab · Who can add integrations (organization security setting): Admin console (Manage organization) > Security |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Enterprise IP allowlist restricts managed-user sign-in and explicitly does not apply to admin tokens on the admin APIs. Coverage of connection, PAT and OAuth API calls is not documented. |  |
| Protect: Expires automatically | No docs found | Static credential; fixed expiry not verified |  |
| Detect: Usage appears in logs | Yes | bot.owner.type, workspace_id | Notion workspace audit log: Enterprise only; 365-day retention; UI filter by user/integration/agent; IP included where available. API data-access calls are not listed as events. · Notion SIEM connection (webhook): Enterprise; real-time JSON webhook of every audit log event; payload field names not documented publicly. · Developer portal / Settings → Connections: Lists internal connections, owners, capabilities and content access; visible to all Workspace Owners. |
| Detect: Data reads appear in logs | Yes | Page viewed; Page viewed | Look for Page viewed · Look for Page viewed |
| Respond: Revocation ends active access | No docs found | Docs say to replace the old token everywhere after Refresh but do not state explicitly that the old token is invalidated immediately. Deleting the connection removes it. |  |
| Respond: Stops working when user is removed | N/A | Internal connections run as their own bot user, not tied to a member. |  |

## Protect: what an admin can configure

### Admin controls
- **Limit which connections members can install** (Require approval; Enterprise; default off). Restricts members to no restriction, approved & recommended, or approved-only connections. Where: Settings > Connections > Manage tab.
- **Approved connections list (revoke / disconnect)** (Other; Enterprise; default unknown). Owners revoke specific users' access to a connection or disconnect all users. Where: Settings > Connections > Manage tab > ••• menu.
- **Manage page access (connection)** (Limit resources; Enterprise; default off). Owners choose which pages a connection can access and whether only owners can connect/disconnect it from pages. Where: Settings > Connections > Manage tab > ••• > Manage page access.
- **Who can add integrations (organization security setting)** (Disable; Enterprise; default varies). Org owners enable or disable adding integrations for every workspace, or leave it workspace-managed. Where: Admin console (Manage organization) > Security.

- Network: unknown (checked at login_only). Enterprise IP allowlist restricts managed-user sign-in and explicitly does not apply to admin tokens on the admin APIs. Coverage of connection, PAT and OAuth API calls is not documented.
- Lifetime: Static credential; fixed expiry not verified. Renewal: Static token reused for API calls. The Refresh action on the internal connection issues a replacement; no documented expiry.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: Enterprise for IP restrictions; Business/Enterprise for SAML SSO. Confirm API enforcement and token-expiry requirements with Notion.

## Detect: what gets logged
- Token prefix: `ntn_`

### Logs
- Notion workspace audit log: Enterprise only; 365-day retention; UI filter by user/integration/agent; IP included where available. API data-access calls are not listed as events.
- Notion SIEM connection (webhook): Enterprise; real-time JSON webhook of every audit log event; payload field names not documented publicly.
- Developer portal / Settings → Connections: Lists internal connections, owners, capabilities and content access; visible to all Workspace Owners.

### Fields that identify the credential
- `bot.owner.type` (GET /v1/users/me response): 'workspace' means internal connection bot
- `workspace_id` (GET /v1/users/me response (bot object)): workspace the token belongs to

### Lifecycle events
- create: `integration.created` SIEM; audit log 'Integration created'
- revoke: `integration.secret_reset` token refreshed; audit log 'Integration secret reset'
- change: `integration.permission.updated` capabilities changed
- change: `integration.owner_added` new explicit owner can see/refresh token
- change: `integration.owner_break_glass_added` admin break-glass ownership
- change: `page.permissions.integration_role_added` page shared with the connection
- revoke: `integration.deleted` connection deleted

### Correlate on
`workspace_id`, `bot.owner.type`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/users/me`. the bot user; owner (workspace vs user) and workspace_name Logged: unknown. Enterprise audit log records integration reads, but whether /users/me specifically logs is not stated
- discovery (bulk): `POST /v1/search`. all pages and data sources shared with the connection Logged: yes (`Content search queried`). Enterprise audit log, 365-day retention; event attributed to the integration/agent actor
- collection (bulk): `POST /v1/data_sources/{data_source_id}/query`. pages in a data source/database, filtered and paginated Logged: yes (`Page viewed`). Page viewed covers an integration/AI tool reading page data; Enterprise audit log, 365-day retention
- collection (bulk): `GET /v1/blocks/{block_id}/children`. full block content of a page (paginated) Logged: yes (`Page viewed`). Reading page data by an integration is captured as Page viewed; Enterprise plan only

### Public detection rules (community, not vendor documentation)
- [Notion Page API Permissions Changed](https://github.com/panther-labs/panther-analysis/blob/develop/rules/notion_rules/notion_page_accessible_to_api.yml) (Panther): An integration was given access to a Notion page or its page role changed.

### What to look for (analyst guidance)
- integration.secret_reset or integration.owner_break_glass_added outside a change window
- Burst of page.permissions.integration_role_added for one connection, especially on sensitive teamspaces
- Connection still active after its creator/owner left the workspace (access persists)
- Edits attributed to the connection's bot identity at odd hours or on pages unrelated to its purpose
- Token with legacy secret_ prefix still in use (old, never rotated)

### Sample query (Notion audit log UI filters)
Find who refreshed or took ownership of an internal connection token.

```
Event type = 'Integration secret reset' OR 'Integration owner added' OR 'Admin added themselves as integration owner'; Date range = last 90 days
```

## Respond: how to revoke it


Settings → Connections → Develop or manage connections → Refresh the internal connection token (or delete the connection); remove page access; update apps with new token. Live access ends on revocation: unknown. Docs say to replace the old token everywhere after Refresh but do not state explicitly that the old token is invalidated immediately. Deleting the connection removes it.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Revocation ends active access
- audit log / SIEM payload field names (actor, IP, user agent)
- whether Refresh immediately invalidates the old token
- per-request API usage logging
- last-used timestamp for internal connection tokens
- Whether non-Enterprise workspaces log any integration reads (audit log is Enterprise-only)
- Exact audit event for GET /v1/users/me
- Whether Notion IP address restrictions apply to internal connection tokens, PATs or public OAuth tokens (help page only describes user sign-in; admin tokens are excluded).
- Whether SAML SSO enforcement affects API tokens (not stated).
- Whether admins can set a maximum PAT lifetime (creators choose 7 days to 1 year; default 1 year).
- Whether internal connection tokens or OAuth tokens expire or can be force-rotated by admins.

## Sources
- [Authorization - Notion Docs](https://developers.notion.com/guides/get-started/authorization) (retrieved 2026-10-09)
- [Create a token - Notion Docs](https://developers.notion.com/reference/create-a-token) (retrieved 2026-10-09)
- [Refresh a token - Notion Docs](https://developers.notion.com/reference/refresh-a-token) (retrieved 2026-10-09)
- [IP address restrictions in Notion | Notion Help – Notion Help Center](https://www.notion.com/help/ip-address-restrictions) (retrieved 2026-10-09)
- [Secure API credentials - Notion Docs](https://developers.notion.com/guides/get-started/handling-api-keys) (retrieved 2026-10-09)
- [Internal connections - Notion Docs](https://developers.notion.com/guides/get-started/internal-connections) (retrieved 2026-10-12)
- [Add and manage connections with the API](https://www.notion.com/help/add-and-manage-connections-with-the-api) (retrieved 2026-10-12)
- [Changelog - Notion Docs](https://developers.notion.com/page/changelog) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Workspace audit log in Notion](https://www.notion.com/help/audit-log) (retrieved 2026-10-12)
- [Audit log events - Notion Docs](https://developers.notion.com/compliance/audit-log-events) (retrieved 2026-10-12)
- [SIEM events - Notion Docs](https://developers.notion.com/compliance/siem-events) (retrieved 2026-10-12)
- [Authentication - Notion Docs](https://developers.notion.com/reference/authentication) (retrieved 2026-10-12)
- [Retrieve your token's bot user - Notion Docs](https://developers.notion.com/reference/get-self) (retrieved 2026-10-12)
- [Search by title](https://developers.notion.com/reference/post-search) (retrieved 2026-10-12)
- [Query a data source](https://developers.notion.com/reference/query-a-data-source) (retrieved 2026-10-12)
- [Retrieve block children](https://developers.notion.com/reference/get-block-children) (retrieved 2026-10-12)
- [Request limits](https://developers.notion.com/reference/request-limits) (retrieved 2026-10-12)
- [Enterprise connection settings in Notion](https://www.notion.com/help/enterprise-connection-settings) (retrieved 2026-10-13)
- [Organization-level controls in Notion](https://www.notion.com/help/organization-level-controls) (retrieved 2026-10-13)
