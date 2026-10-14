# Glean: Client API token (USER permission)

`glean-1` · API key / token · person. Glean-issued bearer token created in Admin console > Platform > API tokens, tied to one user and a fixed set of scopes (SEARCH, CHAT, DOCUMENTS, MCP, etc.). Can also be scoped to specific agents.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin console > Platform > API tokens lists Client API tokens. | Admin console > Platform > API tokens lists Client API tokens. |
| Protect: Admin can block or require approval | Yes | Token creation roles | Token creation roles: Admin console > User roles |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Only the tenant-wide IP greenlist at the VPC firewall; no per-token IP list documented for Client API tokens. | Where: No self-serve setting; send Glean the allowed CIDRs and Glean enables IP green listing (tenant-wide) |
| Protect: Expires automatically | Yes | Optional expiry date; agent-scoped tokens expire after 1 year | Where: Admin console → Client API Token Settings → Add New Token → Expires (set at creation) |
| Detect: Usage appears in logs | Yes | IsRestClientApi | Where: Query the glean-customer-event log (bucket/warehouse; ask account team for location); filter IsRestClientApi = true |
| Detect: Data reads appear in logs | Yes | SEARCH | Where: In glean-customer-event log, filter jsonPayload.type = SEARCH and IsRestClientApi = true |
| Respond: Revocation ends active access | No docs found | Revoke the token in Admin console > Platform > API tokens. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Token scopes** (Limit scope; all plans; default unknown). Token is limited to chosen Client API scopes, fixed at creation. Where: Add New Token > Scopes.
- **Agent-scoped Client API token** (Limit resources; all plans; default off). Token only works for the assigned agents and expires after one year. Where: API tokens page or agent Share > API.
- **Token creation roles** (Require approval; all plans; default on). Only admin roles or API Token Creator can create tokens; global scope needs Super Admin. Where: Admin console > User roles.
- **Tenant-wide IP greenlist** (Limit network; all plans; default unknown). VPC firewall allowlist for the tenant; MCP also checks at app layer. Where: Not documented (Glean-managed).

### Not available (vendor states)
- Token scopes and permission type cannot be edited after creation; must reissue.

- Network: conditional (checked at api_request). Only the tenant-wide IP greenlist at the VPC firewall; no per-token IP list documented for Client API tokens.
- Lifetime: Optional expiry date; agent-scoped tokens expire after 1 year. Renewal: Create a new token; scopes cannot be edited.
- Keyless option: not_applicable. Static token. Docs say it works without the identity provider, so it does not pass through SSO or IdP conditional access.
- Conditions: No approval workflow or org-wide disable switch documented.

## Detect: what gets logged
- Token prefix: `glean_`

### Logs
- Glean Customer Event (GCE) logs: On by default; delivered to object storage/warehouse; customer export needs account team.
- Admin audit logs: Config changes only; 30-day default retention; CSV export.

### Fields that identify the credential
- `IsRestClientApi` (GCE SEARCH/CHAT): Flags API calls; no token ID field documented.

### Lifecycle events
No docs found.

### Correlate on
`user identity`, `TrackingToken`, `SessionTrackingToken`

### API calls a holder can make, and whether they are logged
- collection (bulk): `POST /rest/api/v1/search`. Documents the user can see Logged: yes (`SEARCH`). GCE log; IsRestClientApi field
- collection: `POST /rest/api/v1/chat`. AI answers over user's data Logged: unknown. GCE CHAT event has IsRestClientApi

### What to look for (analyst guidance)
- IsRestClientApi=true searches for a user who never used the API
- High-volume search or getdocuments

## Respond: how to revoke it
- Admin: **Revoke API token**. Revokes a Glean-issued token. Where: Admin console > Platform > API tokens.

Revoke the token in Admin console > Platform > API tokens. Live access ends on revocation: unknown. 

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- Stops working when user is removed
- Event names for token create/revoke
- whoami endpoint
- Whether revoking a Glean-issued API token takes effect immediately
- Whether user deprovisioning revokes that user's Glean-issued API tokens
- Whether admin audit logs record API token create/revoke (coverage list does not mention tokens)
- Per-token IP allowlist for Client API tokens
- Default OAuth server state (admin docs: off; developer docs: on)
- Where the tenant-wide IP greenlist is configured and whether customers manage it
- EMA token lifetime

## Sources
- [Glean-Issued Tokens for Client API](https://developers.glean.com/api-info/client/authentication/glean-issued) (retrieved 2026-10-14)
- [API Tokens | Glean Docs](https://docs.glean.com/administration/developer/api-tokens) (retrieved 2026-10-14)
- [MCP Security, Data Flow, and Permissions](https://docs.glean.com/administration/platform/mcp/security) (retrieved 2026-10-14)
- [Administrator Roles](https://docs.glean.com/administration/identity/roles/admin-roles) (retrieved 2026-10-14)
- [Glean web application firewall on AWS](https://docs.glean.com/security/cloud-prem/aws/aws-waf) (retrieved 2026-10-14)
- [Glean Customer Event logs overview](https://docs.glean.com/administration/gce-logs/data-dictionary) (retrieved 2026-10-14)
- [Event schemas | Glean Customer Event logs](https://docs.glean.com/administration/gce-logs/data-dictionary-detailed) (retrieved 2026-10-14)
- [MCP usage tracking and analytics](https://docs.glean.com/administration/platform/mcp/analytics) (retrieved 2026-10-14)
- [Audit Logs | Glean Docs](https://docs.glean.com/administration/management/audit-logs/admin-audit-logs) (retrieved 2026-10-14)
- [Search](https://developers.glean.com/api/client-api/search/search) (retrieved 2026-10-14)
- [Indexing API Authentication](https://developers.glean.com/api-info/indexing/authentication/overview) (retrieved 2026-10-14)
