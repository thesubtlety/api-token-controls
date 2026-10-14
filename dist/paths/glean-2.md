# Glean: Client API token (GLOBAL permission, X-Glean-ActAs)

`glean-2` · API key / token · service. Glean-issued bearer token that can act as any user by sending X-Glean-ActAs: <email>.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin console > Platform > API tokens. | Admin console > Platform > API tokens. |
| Protect: Admin can block or require approval | Yes | Token creation roles | Token creation roles: Admin console > User roles |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Tenant-wide VPC firewall greenlist only. | Where: No self-serve setting; send Glean the allowed CIDRs and Glean enables IP green listing (tenant-wide) |
| Protect: Expires automatically | Yes | Optional expiry date | Where: Admin console → Client API Token Settings → Add New Token → Expires (set at creation) |
| Detect: Usage appears in logs | Yes | IsRestClientApi | Where: Query the glean-customer-event log (bucket/warehouse; ask account team for location); filter IsRestClientApi = true |
| Detect: Data reads appear in logs | Yes | SEARCH | Where: In glean-customer-event log, filter jsonPayload.type = SEARCH and IsRestClientApi = true |
| Respond: Revocation ends active access | No docs found | Revoke the global token in the API tokens page. |  |
| Respond: Stops working when user is removed | N/A | GLOBAL tokens are not tied to one user; they can act as any user via X-Glean-ActAs. |  |

## Protect: what an admin can configure

### Admin controls
- **Token scopes** (Limit scope; all plans; default unknown). Token is limited to chosen Client API scopes, fixed at creation. Where: Add New Token > Scopes.
- **Token creation roles** (Require approval; all plans; default on). Only admin roles or API Token Creator can create tokens; global scope needs Super Admin. Where: Admin console > User roles.
- **Tenant-wide IP greenlist** (Limit network; all plans; default unknown). VPC firewall allowlist for the tenant; MCP also checks at app layer. Where: Not documented (Glean-managed).

- Network: conditional (checked at api_request). Tenant-wide VPC firewall greenlist only.
- Lifetime: Optional expiry date. Renewal: Create a new token.
- Keyless option: not_applicable. Static token; independent of the IdP.
- Conditions: Highest-impact Glean credential: impersonates any user.

## Detect: what gets logged
- Token prefix: `glean_`

### Logs
- GCE logs: Events are attributed to the impersonated user.

### Fields that identify the credential
- `IsRestClientApi` (GCE SEARCH): No token ID documented.

### Lifecycle events
No docs found.

### Correlate on
`user identity`

### API calls a holder can make, and whether they are logged
- collection (bulk): `POST /rest/api/v1/adminsearch`. Search results without permission checks (privileged users) Logged: unknown. 
- collection (bulk): `POST /rest/api/v1/search with X-Glean-ActAs`. Any user's visible documents Logged: yes (`SEARCH`). GCE

### What to look for (analyst guidance)
- API activity spread across many users at once (ActAs fan-out)

## Respond: how to revoke it
- Admin: **Revoke API token**. Revokes a Glean-issued token. Where: Admin console > Platform > API tokens.

Revoke the global token in the API tokens page. Live access ends on revocation: unknown. 

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- Whether logs record the ActAs caller vs. impersonated user
- Whether revoking a Glean-issued API token takes effect immediately
- Whether user deprovisioning revokes that user's Glean-issued API tokens
- Whether admin audit logs record API token create/revoke (coverage list does not mention tokens)
- Per-token IP allowlist for Client API tokens
- Default OAuth server state (admin docs: off; developer docs: on)
- Where the tenant-wide IP greenlist is configured and whether customers manage it
- EMA token lifetime

## Sources
- [Glean-Issued Tokens for Client API](https://developers.glean.com/api-info/client/authentication/glean-issued) (retrieved 2026-10-14)
- [MCP Security, Data Flow, and Permissions](https://docs.glean.com/administration/platform/mcp/security) (retrieved 2026-10-14)
- [Administrator Roles](https://docs.glean.com/administration/identity/roles/admin-roles) (retrieved 2026-10-14)
- [API Tokens | Glean Docs](https://docs.glean.com/administration/developer/api-tokens) (retrieved 2026-10-14)
- [Glean web application firewall on AWS](https://docs.glean.com/security/cloud-prem/aws/aws-waf) (retrieved 2026-10-14)
- [Glean Customer Event logs overview](https://docs.glean.com/administration/gce-logs/data-dictionary) (retrieved 2026-10-14)
- [Event schemas | Glean Customer Event logs](https://docs.glean.com/administration/gce-logs/data-dictionary-detailed) (retrieved 2026-10-14)
- [MCP usage tracking and analytics](https://docs.glean.com/administration/platform/mcp/analytics) (retrieved 2026-10-14)
- [Search the index (admin)](https://developers.glean.com/api/client-api/search/adminsearch) (retrieved 2026-10-14)
- [Indexing API Authentication](https://developers.glean.com/api-info/indexing/authentication/overview) (retrieved 2026-10-14)
