# Glean: Enterprise Managed Auth (JWT bearer assertion for MCP)

`glean-6` · Federated identity · person. An AI app sends an IdP-signed identity assertion to /oauth/token with the JWT bearer grant; Glean returns an MCP access token without a consent screen.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Enable Glean OAuth Server | Enable Glean OAuth Server: Admin console > Settings > Third-party access (OAuth) |
| Protect: SSO and MFA rules apply | Yes | Each token comes from an IdP identity assertion, and admins control which users and apps can connect in the IdP. | Where: In the IdP, register Glean as a Cross App Access resource server and assign users; in Glean: Users & permissions → Third-party access (OAuth) → Enterprise Managed Auth → Trusted issuer |
| Protect: IP restriction | Conditional | MCP app-layer IP greenlisting. | Where: No self-serve setting; send Glean the allowed CIDRs and Glean enables IP green listing (tenant-wide) |
| Protect: Expires automatically | No docs found | Not stated for EMA |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Where: MCP activity logs (filter by server, tool, user, date; shows OAuth client name); GCE log: type = MCP_USAGE, McpUsage.Application / AuthMethod |
| Detect: Data reads appear in logs | Yes | MCP_USAGE | Where: In glean-customer-event log, filter jsonPayload.type = MCP_USAGE (EventType TOOL_CALL, ToolName) |
| Respond: Revocation ends active access | Partial | Turning off EMA or removing the issuer leaves existing tokens valid until expiry. Admin 'sign out of all sessions' invalidates them after the revocation cache refreshes (~10 minutes). | Where: Users & permissions → Third-party access (OAuth) → turn off Enterprise Managed Auth, or delete the app's static client; then User roles → ⋮ → Sign out of all sessions to cut existing tokens |
| Respond: Stops working when user is removed | Partial | No refresh tokens are issued, so once the IdP stops issuing assertions no new tokens are minted. Existing access tokens run until they expire. | Where: Unassign the user in the IdP Cross App Access connection; Admin console → Users & permissions → User roles → ⋮ → Sign out of all sessions |

## Protect: what an admin can configure

### Admin controls
- **Tenant-wide IP greenlist** (Limit network; all plans; default unknown). VPC firewall allowlist for the tenant; MCP also checks at app layer. Where: Not documented (Glean-managed).
- **Enable Glean OAuth Server** (Disable; all plans; default varies). Turns Glean-issued OAuth on or off. Where: Admin console > Settings > Third-party access (OAuth).
- **Enterprise Managed Auth (trusted issuer, allowed scopes)** (Limit scope; all plans; default off). EMA tokens limited to selected scopes; rejected without a trusted issuer. Where: Users & permissions > Third-party access (OAuth) > Enterprise Managed Auth.

- Network: conditional (checked at api_request). MCP app-layer IP greenlisting.
- Lifetime: Not stated for EMA. Renewal: App obtains a new assertion from the IdP.
- Keyless option: limited. Trusted issuer must be configured; currently Claude with Okta only.
- Conditions: Admin role required.

## Detect: what gets logged
- Token prefix: not established

### Logs
- GCE MCP_USAGE: 

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`user identity`

### API calls a holder can make, and whether they are logged
- collection (bulk): `MCP tool calls`. Per allowed scopes Logged: yes (`MCP_USAGE`). 

## Respond: how to revoke it


Turn off EMA or remove the trusted issuer; unassign the user in the IdP. Live access ends on revocation: partial. Turning off EMA or removing the issuer leaves existing tokens valid until expiry. Admin 'sign out of all sessions' invalidates them after the revocation cache refreshes (~10 minutes).

## No vendor documentation found
- Admin can list all of them
- Expires automatically
- EMA-specific log fields
- Whether revoking a Glean-issued API token takes effect immediately
- Whether user deprovisioning revokes that user's Glean-issued API tokens
- Whether admin audit logs record API token create/revoke (coverage list does not mention tokens)
- Per-token IP allowlist for Client API tokens
- Default OAuth server state (admin docs: off; developer docs: on)
- Where the tenant-wide IP greenlist is configured and whether customers manage it
- EMA token lifetime

## Sources
- [Enterprise Managed Auth](https://docs.glean.com/administration/oauth/enterprise-managed-auth) (retrieved 2026-10-14)
- [MCP Security, Data Flow, and Permissions](https://docs.glean.com/administration/platform/mcp/security) (retrieved 2026-10-14)
- [Glean web application firewall on AWS](https://docs.glean.com/security/cloud-prem/aws/aws-waf) (retrieved 2026-10-14)
- [MCP usage tracking and analytics](https://docs.glean.com/administration/platform/mcp/analytics) (retrieved 2026-10-14)
- [Glean Customer Event logs overview](https://docs.glean.com/administration/gce-logs/data-dictionary) (retrieved 2026-10-14)
- [Event schemas | Glean Customer Event logs](https://docs.glean.com/administration/gce-logs/data-dictionary-detailed) (retrieved 2026-10-14)
- [Managing Users](https://docs.glean.com/administration/identity/roles/manage-users) (retrieved 2026-10-14)
- [Glean OAuth Authorization Server](https://docs.glean.com/administration/oauth/authorization-server) (retrieved 2026-10-14)
- [Client API Authentication](https://developers.glean.com/api-info/client/authentication/overview) (retrieved 2026-10-14)
