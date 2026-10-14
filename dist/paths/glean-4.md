# Glean: Glean OAuth Authorization Server token (static and DCR clients, MCP)

`glean-4` · OAuth · person. OAuth 2.1 authorization code + PKCE. User signs in through the tenant's SSO IdP; Glean issues a JWT access token with Glean scopes. Used by MCP hosts and Client/Platform API apps.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Users see their own authorized applications. Admins manage clients in the Admin console but have no documented per-token list. | Users see their own authorized applications. Admins manage clients in the Admin console but have no documented per-token list. |
| Protect: Admin can block or require approval | Yes | Enable Glean OAuth Server; Dynamic client registration settings | Enable Glean OAuth Server: Admin console > Settings > Third-party access (OAuth) · Dynamic client registration settings: Settings > Third-party access (OAuth) > DCR > Manage settings |
| Protect: SSO and MFA rules apply | Yes | Users sign in through the org's existing SSO IdP before Glean issues the OAuth token. | Where: Admin console → Settings → Third‑party access (OAuth) → Enable Glean OAuth Server; sign-in uses the existing SSO IdP, so set MFA/conditional access in the IdP |
| Protect: IP restriction | Conditional | Tenant VPC firewall greenlist; MCP endpoints enforce greenlisting at the app layer. OAuth metadata discovery may be exempt. | Where: No self-serve setting; send Glean the allowed CIDRs and Glean enables IP green listing (tenant-wide) |
| Protect: Expires automatically | Yes | Access 7 days, refresh 180 days by default; admin-configurable | OAuth token TTL: Not documented |
| Detect: Usage appears in logs | Yes | client | Where: MCP activity logs (filter by server, tool, user, date; shows OAuth client name); GCE log: type = MCP_USAGE, McpUsage.Application / AuthMethod |
| Detect: Data reads appear in logs | Yes | MCP_USAGE | Where: In glean-customer-event log, filter jsonPayload.type = MCP_USAGE (EventType TOOL_CALL, ToolName) |
| Respond: Revocation ends active access | Yes | Takes effect after ~5-10 min propagation / 10 min cache. Users can also revoke an app themselves, which deletes its consents and refresh tokens. Admins can list a static client's users via View users. | Where: Users & permissions → Third‑party access (OAuth) → ⋮ next to client → Delete client; per user: User roles → ⋮ → Sign out of all sessions |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Tenant-wide IP greenlist** (Limit network; all plans; default unknown). VPC firewall allowlist for the tenant; MCP also checks at app layer. Where: Not documented (Glean-managed).
- **Enable Glean OAuth Server** (Disable; all plans; default varies). Turns Glean-issued OAuth on or off. Where: Admin console > Settings > Third-party access (OAuth).
- **Dynamic client registration settings** (Require approval; all plans; default off). Allow any app, only approved apps/redirect URIs, or no DCR. Where: Settings > Third-party access (OAuth) > DCR > Manage settings.
- **OAuth token TTL** (Limit lifetime; all plans; default on). Admins can change access (7d) and refresh (180d) TTLs. Where: Not documented.

- Network: conditional (checked at api_request). Tenant VPC firewall greenlist; MCP endpoints enforce greenlisting at the app layer. OAuth metadata discovery may be exempt.
- Lifetime: Access 7 days, refresh 180 days by default; admin-configurable. Renewal: Refresh with offline_access.
- Keyless option: not_applicable. User sign-in goes through the existing SSO IdP; tokens are then Glean-issued.
- Conditions: Docs disagree on default: admin docs say off, developer docs say on.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Admin audit logs: Client create/revoke and OAuth setting changes.
- GCE MCP_USAGE: Tool, server, client, authentication.

### Fields that identify the credential
- `client` (MCP_USAGE): OAuth client metadata.

### Lifecycle events
No docs found.

### Correlate on
`client`, `user identity`

### API calls a holder can make, and whether they are logged
- collection (bulk): `MCP tool calls on /mcp/<server>`. Search, chat, documents per scopes Logged: yes (`MCP_USAGE`). GCE

### What to look for (analyst guidance)
- New DCR client while DCR is set to Allow any application

## Respond: how to revoke it
- Admin: **Delete static client / Revoke client**. Ends access for all users of that client after config propagation. Where: Users & permissions > Third-party access (OAuth) > Delete client.
- Admin: **Rotate secret (static client)**. Old client secret stops working immediately. Where: Edit client > Rotate secret.
- Admin: **Sign out of all sessions**. Invalidates a user's Glean-issued OAuth tokens (cache refresh ~10 min). Where: Admin console (user).

Delete/revoke the client; sign the user out of all sessions. Live access ends on revocation: yes. Takes effect after ~5-10 min propagation / 10 min cache. Users can also revoke an app themselves, which deletes its consents and refresh tokens. Admins can list a static client's users via View users.

## No vendor documentation found
- Stops working when user is removed
- Exact audit event names
- Whether revoking a Glean-issued API token takes effect immediately
- Whether user deprovisioning revokes that user's Glean-issued API tokens
- Whether admin audit logs record API token create/revoke (coverage list does not mention tokens)
- Per-token IP allowlist for Client API tokens
- Default OAuth server state (admin docs: off; developer docs: on)
- Where the tenant-wide IP greenlist is configured and whether customers manage it
- EMA token lifetime

## Sources
- [Glean OAuth Authorization Server](https://docs.glean.com/administration/oauth/authorization-server) (retrieved 2026-10-14)
- [MCP Security, Data Flow, and Permissions](https://docs.glean.com/administration/platform/mcp/security) (retrieved 2026-10-14)
- [OAuth Authentication for Client API](https://developers.glean.com/api-info/client/authentication/oauth) (retrieved 2026-10-14)
- [Client API Authentication](https://developers.glean.com/api-info/client/authentication/overview) (retrieved 2026-10-14)
- [Dynamic Client Registration](https://docs.glean.com/administration/oauth/dynamic-client-registration) (retrieved 2026-10-14)
- [About Glean SSO](https://docs.glean.com/administration/identity/sso/about) (retrieved 2026-10-14)
- [Glean web application firewall on AWS](https://docs.glean.com/security/cloud-prem/aws/aws-waf) (retrieved 2026-10-14)
- [MCP usage tracking and analytics](https://docs.glean.com/administration/platform/mcp/analytics) (retrieved 2026-10-14)
- [Glean Customer Event logs overview](https://docs.glean.com/administration/gce-logs/data-dictionary) (retrieved 2026-10-14)
- [Event schemas | Glean Customer Event logs](https://docs.glean.com/administration/gce-logs/data-dictionary-detailed) (retrieved 2026-10-14)
- [Static OAuth clients](https://docs.glean.com/administration/oauth/static-client-registration) (retrieved 2026-10-14)
- [Managing Users](https://docs.glean.com/administration/identity/roles/manage-users) (retrieved 2026-10-14)
