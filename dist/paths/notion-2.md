# Notion: Personal access token

`notion-2` · Personal access token · person. Internal connection tokens, personal access tokens and public-connection OAuth bearer tokens.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admins see all PATs in Settings → Connections; org owners can use the Admin API 'List personal access tokens in a workspace' endpoint. | Admins see all PATs in Settings → Connections; org owners can use the Admin API 'List personal access tokens in a workspace' endpoint. |
| Protect: Admin can block or require approval | Yes (requires Business or Enterprise (not configurable on Free/Plus)) | PAT creation policy (who can create PATs with Notion API access) | PAT creation policy (who can create PATs with Notion API access): Settings > Connections (PAT creator settings) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Enterprise IP allowlist restricts managed-user sign-in and explicitly does not apply to admin tokens on the admin APIs. Coverage of connection, PAT and OAuth API calls is not documented. |  |
| Protect: Expires automatically | Yes | Expiry chosen at creation: 7, 30, 90, 180 days or 1 year (default 1 year) | Where: Set at creation: Developer portal > Personal access tokens > New token > Expiration. Admin view: Settings → Connections (all PATs) · API: GET /v1/spaces/{space_id}/personal_access_tokens (Admin API; expires_at field) |
| Detect: Usage appears in logs | Yes | id, creator, last_used_at, status, revoked_by | Settings → Connections → All personal access tokens: Admin view of active, expired, revoked PATs; shows creator and revoker. · Notion Admin API: List personal access tokens: Enterprise org bot token with personal-access-token:read; returns created/last-used/revoked metadata. · Notion workspace audit log: Enterprise only; 365-day retention; UI filter by user/integration/agent; IP included where available. API data-access calls are not listed as events. · Notion SIEM connection (webhook): Enterprise; real-time JSON webhook of every audit log event; payload field names not documented publicly. |
| Detect: Data reads appear in logs | Yes | Page viewed | Look for Page viewed |
| Respond: Revocation ends active access | Yes | Revocation is immediate and permanent; token stops working for API and Workers. | Creator revokes in Developer portal, or admin revokes in Settings → Connections → All personal access tokens, or Admin API DELETE /v1/spaces/{space_id}/personal_access_tokens/{bot_id}. Optionally tighten PAT creation policy. |
| Respond: Stops working when user is removed | Yes | A PAT acts as its creator and loses access when the creator leaves the workspace. | Where: Settings → People (or Members) > Members tab > role dropdown > Remove from workspace · API: DELETE https://api.notion.com/scim/v2/Users/{id} |

## Protect: what an admin can configure

### Admin controls
- **PAT creation policy (who can create PATs with Notion API access)** (Disable; Business or Enterprise (not configurable on Free/Plus); default varies). Limits PAT creation to owners, owners plus selected groups, or all members; removing a member's permission stops their existing PATs. Where: Settings > Connections (PAT creator settings).
- **Revoke personal access tokens** (Other; all plans; default unknown). Workspace admins revoke any PAT; org owners can list/revoke via the Admin API. Where: Settings > Connections > All personal access tokens; Admin API.

### Not available (vendor states)
- PAT creation policy is not configurable on Free and Plus plans.

- Network: unknown (checked at login_only). Enterprise IP allowlist restricts managed-user sign-in and explicitly does not apply to admin tokens on the admin APIs. Coverage of connection, PAT and OAuth API calls is not documented.
- Lifetime: Expiry chosen at creation: 7, 30, 90, 180 days or 1 year (default 1 year). Renewal: No refresh. Create a new PAT before expiry; expired tokens return an unauthorized error.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: Enterprise for IP restrictions; Business/Enterprise for SAML SSO. Confirm API enforcement and token-expiry requirements with Notion.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Settings → Connections → All personal access tokens: Admin view of active, expired, revoked PATs; shows creator and revoker.
- Notion Admin API: List personal access tokens: Enterprise org bot token with personal-access-token:read; returns created/last-used/revoked metadata.
- Notion workspace audit log: Enterprise only; 365-day retention; UI filter by user/integration/agent; IP included where available. API data-access calls are not listed as events.
- Notion SIEM connection (webhook): Enterprise; real-time JSON webhook of every audit log event; payload field names not documented publicly.

### Fields that identify the credential
- `id` (Admin API list PATs): PAT id; pass as bot_id to revoke
- `creator` (Admin API list PATs): user who created (and acts as) the token
- `last_used_at` (Admin API list PATs): epoch ms of last use
- `status` (Admin API list PATs): active|expired|revoked
- `revoked_by` (Admin API list PATs): type bot|organization_bot|user

### Lifecycle events
- change: `workspace.settings.personal_access_token_creation_policy_updated` who may create PATs changed; disallowed members' PATs stop working for API
- change: `workspace.group.personal_access_token_creation_updated` group PAT creation right changed
- change: `workspace.settings.notion_mcp_personal_access_token_policy_updated` PAT use with Notion MCP policy

### Correlate on
`id`, `creator`, `created_at`, `last_used_at`, `expires_at`, `revoked_at`, `revoked_by`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/users/me`. for a PAT, the user who created the token (acts with that user's membership and page permissions) Logged: unknown. Audit log is Enterprise-only; specific logging of /users/me not stated
- discovery (bulk): `POST /v1/search`. pages and data sources the PAT's user can reach Logged: yes (`Content search queried`). Enterprise audit log, 365-day retention; attributed to the PAT's user
- collection (bulk): `GET /v1/blocks/{block_id}/children`. full page/block content Logged: yes (`Page viewed`). Enterprise plan; Page viewed covers reading page data

### What to look for (analyst guidance)
- last_used_at recent for a PAT whose creator was deprovisioned or changed role
- New PAT created shortly before bulk exports or edits by the creator
- PAT with 1-year expiry created by a member who normally has none
- Many PATs by one creator (one per tool is advised; sudden growth is odd)
- Edits attributed to the creator at times they were not working (PAT acts as the user)

### Sample query (Notion Admin API (HTTP))
List PATs used during the incident window and their creators.

```
GET https://api.notion.com/admin/v1/spaces/{space_id}/personal_access_tokens  (then filter results where status='active' and last_used_at > incident_start)
```

## Respond: how to revoke it


Creator revokes in Developer portal, or admin revokes in Settings → Connections → All personal access tokens, or Admin API DELETE /v1/spaces/{space_id}/personal_access_tokens/{bot_id}. Optionally tighten PAT creation policy. Live access ends on revocation: yes. Revocation is immediate and permanent; token stops working for API and Workers.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- PAT token prefix/format
- audit log event for PAT create or revoke (none listed)
- IP/user agent of PAT use
- PAT API calls in audit log
- Whether PAT reads are logged on non-Enterprise plans (audit log Enterprise-only)
- Documented PAT expiry (not found in Notion's own docs)
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
- [Personal access tokens - Notion Docs](https://developers.notion.com/guides/get-started/personal-access-tokens) (retrieved 2026-10-09)
- [List personal access tokens in a workspace - Notion Docs](https://developers.notion.com/reference/admin/list-personal-access-tokens) (retrieved 2026-10-12)
- [Add members, admins, guests, and groups](https://www.notion.com/help/add-members-admins-guests-and-groups) (retrieved 2026-10-14)
- [Provision users and groups with SCIM](https://www.notion.com/help/provision-users-and-groups-with-scim) (retrieved 2026-10-14)
- [Revoke a personal access token in a workspace](https://developers.notion.com/reference/admin/revoke-personal-access-token) (retrieved 2026-10-12)
- [SIEM events - Notion Docs](https://developers.notion.com/compliance/siem-events) (retrieved 2026-10-12)
- [Audit log events - Notion Docs](https://developers.notion.com/compliance/audit-log-events) (retrieved 2026-10-12)
- [Authentication - Notion Docs](https://developers.notion.com/reference/authentication) (retrieved 2026-10-12)
- [Retrieve your token's bot user - Notion Docs](https://developers.notion.com/reference/get-self) (retrieved 2026-10-12)
- [Workspace audit log in Notion](https://www.notion.com/help/audit-log) (retrieved 2026-10-12)
- [Search by title](https://developers.notion.com/reference/post-search) (retrieved 2026-10-12)
- [Retrieve block children](https://developers.notion.com/reference/get-block-children) (retrieved 2026-10-12)
- [Request limits](https://developers.notion.com/reference/request-limits) (retrieved 2026-10-12)
