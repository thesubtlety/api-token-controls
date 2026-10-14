# Notion: Public connection OAuth

`notion-3` · OAuth · person. Internal connection tokens, personal access tokens and public-connection OAuth bearer tokens.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Enterprise only: Settings → Connections → Manage tab shows which members have each connection installed; no token-level list. | Enterprise only: Settings → Connections → Manage tab shows which members have each connection installed; no token-level list. |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | Limit which connections members can install; Who can add integrations (organization security setting) | Limit which connections members can install: Settings > Connections > Manage tab · Who can add integrations (organization security setting): Admin console (Manage organization) > Security |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Enterprise IP allowlist restricts managed-user sign-in and explicitly does not apply to admin tokens on the admin APIs. Coverage of connection, PAT and OAuth API calls is not documented. |  |
| Protect: Expires automatically | No docs found | Refresh/revoke exists; default TTL not verified |  |
| Detect: Usage appears in logs | Yes | bot_id, owner, workspace_id, active, iat | Notion workspace audit log: Enterprise only; 365-day retention; UI filter by user/integration/agent; IP included where available. API data-access calls are not listed as events. · Notion SIEM connection (webhook): Enterprise; real-time JSON webhook of every audit log event; payload field names not documented publicly. · Settings → Connections (workspace owner): Connection catalog, connected members, disconnect. |
| Detect: Data reads appear in logs | Yes | Page viewed | Look for Page viewed |
| Respond: Revocation ends active access | Partial | Revoke endpoint revokes the given access token; docs do not say if sibling refresh/access tokens or other authorizations are revoked. Since 2026-06-08 each authorization mints a fresh pair, so one user may hold several. | App operator: POST /v1/oauth/revoke with the token (Basic auth with client id/secret). Workspace owner: Settings → Connections → disconnect the connection or disconnect members. Remove from approved connections. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Limit which connections members can install** (Require approval; Enterprise; default off). Restricts members to no restriction, approved & recommended, or approved-only connections. Where: Settings > Connections > Manage tab.
- **Approved connections list (revoke / disconnect)** (Other; Enterprise; default unknown). Owners revoke specific users' access to a connection or disconnect all users. Where: Settings > Connections > Manage tab > ••• menu.
- **Manage page access (connection)** (Limit resources; Enterprise; default off). Owners choose which pages a connection can access and whether only owners can connect/disconnect it from pages. Where: Settings > Connections > Manage tab > ••• > Manage page access.
- **Who can add integrations (organization security setting)** (Disable; Enterprise; default varies). Org owners enable or disable adding integrations for every workspace, or leave it workspace-managed. Where: Admin console (Manage organization) > Security.

- Network: unknown (checked at login_only). Enterprise IP allowlist restricts managed-user sign-in and explicitly does not apply to admin tokens on the admin APIs. Coverage of connection, PAT and OAuth API calls is not documented.
- Lifetime: Refresh/revoke exists; default TTL not verified. Renewal: Refresh returns a new access token and a new refresh token. Access- and refresh-token lifetimes are not documented.
- Keyless option: not_verified. OAuth/connection authorization is documented; no general external workload identity exchange established.
- Conditions: Enterprise for IP restrictions; Business/Enterprise for SAML SSO. Confirm API enforcement and token-expiry requirements with Notion.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Notion workspace audit log: Enterprise only; 365-day retention; UI filter by user/integration/agent; IP included where available. API data-access calls are not listed as events.
- Notion SIEM connection (webhook): Enterprise; real-time JSON webhook of every audit log event; payload field names not documented publicly.
- Settings → Connections (workspace owner): Connection catalog, connected members, disconnect.

### Fields that identify the credential
- `bot_id` (OAuth token response): identifier for this authorization
- `owner` (OAuth token response): user who authorized
- `workspace_id` (OAuth token response): workspace of the authorization
- `active` (POST /v1/oauth/introspect): token still valid
- `iat` (POST /v1/oauth/introspect): issued time

### Lifecycle events
- create: `workspace.integration_added` first time an integration is added to the workspace
- create: `workspace.external_account_connected` public integration connected
- change: `page.permissions.integration_role_added` page shared with connection
- revoke: `workspace.external_account_disconnected` disconnected or owner removed for all users
- revoke: `workspace.integration_removed` all bots for a public integration removed

### Correlate on
`bot_id`, `owner`, `workspace_id`

### API calls a holder can make, and whether they are logged
- recon: `POST /v1/oauth/introspect`. token active status, scope, and issued time (iat) Logged: unknown. No documented audit event for introspection
- recon: `GET /v1/users/me`. the bot user; owner and workspace_name of the authorizing workspace Logged: unknown. Enterprise audit log records integration activity; /users/me specifics not stated
- discovery (bulk): `POST /v1/search`. all pages/data sources shared with the public connection Logged: yes (`Content search queried`). Enterprise audit log, 365-day retention
- collection (bulk): `POST /v1/data_sources/{data_source_id}/query`. pages/rows in accessible databases Logged: yes (`Page viewed`). Reading page data logged as Page viewed; Enterprise only

### Public detection rules (community, not vendor documentation)
- [Notion Page API Permissions Changed](https://github.com/panther-labs/panther-analysis/blob/develop/rules/notion_rules/notion_page_accessible_to_api.yml) (Panther): An integration was given access to a Notion page or its page role changed.

### What to look for (analyst guidance)
- workspace.external_account_connected for an app not on approved connections
- Same public integration connected by many members in a short window (consent phishing)
- Connection kept after authorizing user offboarded
- Rapid page.permissions.integration_role_added followed by exports
- Re-authorizations minting new token pairs repeatedly (each auth now issues a fresh pair)

### Sample query (Notion audit log UI filters)
Find members who authorized a suspicious public connection.

```
Event type = 'External/Public integration connected'; Date range = incident window; review actor per row
```

## Respond: how to revoke it


App operator: POST /v1/oauth/revoke with the token (Basic auth with client id/secret). Workspace owner: Settings → Connections → disconnect the connection or disconnect members. Remove from approved connections. Live access ends on revocation: partial. Revoke endpoint revokes the given access token; docs do not say if sibling refresh/access tokens or other authorizations are revoked. Since 2026-06-08 each authorization mints a fresh pair, so one user may hold several.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Stops working when user is removed
- OAuth access token prefix
- access token lifetime
- whether disconnect in UI revokes tokens immediately
- audit/SIEM payload field names
- API usage logging per token
- Whether reads are logged on non-Enterprise workspaces
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
- [Enterprise connection settings in Notion](https://www.notion.com/help/enterprise-connection-settings) (retrieved 2026-10-13)
- [Revoke a token - Notion Docs](https://developers.notion.com/reference/revoke-token) (retrieved 2026-10-12)
- [Introspect a token - Notion Docs](https://developers.notion.com/reference/introspect-token) (retrieved 2026-10-12)
- [SIEM events - Notion Docs](https://developers.notion.com/compliance/siem-events) (retrieved 2026-10-12)
- [Audit log events - Notion Docs](https://developers.notion.com/compliance/audit-log-events) (retrieved 2026-10-12)
- [Add and manage connections with the API](https://www.notion.com/help/add-and-manage-connections-with-the-api) (retrieved 2026-10-12)
- [Authentication - Notion Docs](https://developers.notion.com/reference/authentication) (retrieved 2026-10-12)
- [Changelog - Notion Docs](https://developers.notion.com/page/changelog) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Workspace audit log in Notion](https://www.notion.com/help/audit-log) (retrieved 2026-10-12)
- [Retrieve your token's bot user - Notion Docs](https://developers.notion.com/reference/get-self) (retrieved 2026-10-12)
- [Search by title](https://developers.notion.com/reference/post-search) (retrieved 2026-10-12)
- [Query a data source](https://developers.notion.com/reference/query-a-data-source) (retrieved 2026-10-12)
- [Request limits](https://developers.notion.com/reference/request-limits) (retrieved 2026-10-12)
- [Organization-level controls in Notion](https://www.notion.com/help/organization-level-controls) (retrieved 2026-10-13)
