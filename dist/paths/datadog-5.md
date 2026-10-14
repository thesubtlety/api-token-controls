# Datadog: Personal Access Token (PAT)

`datadog-5` · Personal access token · person. User-owned bearer token (prefix ddpat_) sent in the Authorization header, or in dd-application-key. No API key needed. Scopes are mandatory.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Organization Settings > Access Tokens (org_app_keys_read) or GET /api/v2/personal_access_tokens lists all PATs and SATs. | Organization Settings > Access Tokens (org_app_keys_read) or GET /api/v2/personal_access_tokens lists all PATs and SATs. |
| Protect: Admin can block or require approval | Yes | User App Keys (user_app_keys) permission | User App Keys (user_app_keys) permission: Organization Settings > Roles (permission user_app_keys) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Org-wide IP allowlist covers all Datadog API calls, so token use from other IPs is blocked; it cannot be set per token. Pro+ or Enterprise, enabled through support. | IP Allowlist: Organization Settings > Security > IP Allowlist; IP Allowlist API |
| Protect: Expires automatically | Yes | Required TTL, 24 hours to 1 year; fixed at creation | Where: Personal Settings > Access Tokens > New token > Expiration Date (24h-1y); admins see expiry in Organization Settings > Access Tokens · API: GET /api/v2/personal_access_tokens/{pat_id} |
| Detect: Usage appears in logs | Yes | public_portion / id (Token ID), last_used_at | Audit Trail: Must be enabled (Organization Settings > Audit Trail Settings). Default retention 90 days (3-90 configurable). Records token creation, usage and revocation. Captures authentication method and token metadata per API call. |
| Detect: Data reads appear in logs | Yes | @evt.name:"Log Management" @asset.type:logs_query | Where: Audit Trail explorer; query @evt.name:"Log Management" @asset.type:logs_query · API: POST /api/v2/audit/events/search with that query |
| Respond: Revocation ends active access | Yes | Docs: revoked tokens can no longer authenticate; takes effect within seconds (eventual consistency). | Revoke the token in the UI or with DELETE on its endpoint; also list and revoke any tokens it created. For PATs, disabling the owner revokes all their PATs. |
| Respond: Stops working when user is removed | Yes | Disabling a user revokes all of their PATs immediately. | Where: Organization Settings > Users > Edit > Disable toggle > Save · API: DELETE /api/v2/users/{user_id} |

## Protect: what an admin can configure

### Admin controls
- **User App Keys (user_app_keys) permission** (Disable; all plans; default off). Only roles with user_app_keys can create PATs; remove it from a role to stop its members creating PATs. Where: Organization Settings > Roles (permission user_app_keys).
- **Token scopes** (Limit scope; all plans; default on). Each PAT or SAT must have at least one scope and can only do what its scopes allow. Where: Select Scopes when creating or editing a token.
- **Mandatory PAT time-to-live** (Limit lifetime; all plans; default on). Every PAT expires between 24 hours and one year after creation; expired tokens are revoked automatically. Where: Expiration Date at creation (fixed by Datadog bounds).
- **Restrictions on token-authenticated API calls** (Other; all plans; default on). A PAT or SAT cannot create application keys, and can only mint tokens with a subset of its scopes and no longer TTL. Where: Built in.
- **IP Allowlist** (Limit network; Pro+ or Enterprise (request through support); default off). Org-wide allowlist blocks API calls from IPs outside the list, including token-authenticated calls. Where: Organization Settings > Security > IP Allowlist; IP Allowlist API.

### Not available (vendor states)
- IP restriction for a single token; the IP allowlist is org-wide only.

- Network: supported (checked at api_request). Org-wide IP allowlist covers all Datadog API calls, so token use from other IPs is blocked; it cannot be set per token. Pro+ or Enterprise, enabled through support.
- Lifetime: Required TTL, 24 hours to 1 year; fixed at creation. Renewal: TTL cannot be changed; revoke and create a new token.
- Keyless option: not_applicable. Static bearer token issued by Datadog; no external identity exchange.
- Conditions: user_app_keys is in the Datadog Standard Role by default.

## Detect: what gets logged
- Token prefix: `ddpat_`

### Logs
- Audit Trail: Must be enabled (Organization Settings > Audit Trail Settings). Default retention 90 days (3-90 configurable). Records token creation, usage and revocation. Captures authentication method and token metadata per API call.

### Fields that identify the credential
- `public_portion / id (Token ID)` (GET /api/v2/personal_access_tokens response): Identifies the token in inventory. Exact Audit Trail attribute name for the token is not documented.
- `last_used_at` (GET /api/v2/personal_access_tokens response): Date the token was last used.

### Lifecycle events
No docs found.

### Correlate on
`token public_portion / Token ID`, `owner (user or service account)`, `authentication method facet in Audit Trail`

### API calls a holder can make, and whether they are logged
- recon (bulk): `GET /api/v2/users`. All users in the org, including deactivated ones Logged: unknown. Token usage is recorded in Audit Trail generally; no specific event documented for this call.
- discovery (bulk): `GET /api/v2/personal_access_tokens`. All PATs and SATs (names, scopes, expiry, last use) when the token has org_app_keys_read Logged: unknown. No specific event documented.
- collection (bulk): `POST /api/v2/logs/events/search`. Log events Logged: yes (`@evt.name:"Log Management" @asset.type:logs_query`). Audit Trail logs Log Management List queries made through the Public API; Audit Trail must be enabled.

### What to look for (analyst guidance)
- GET /api/v2/personal_access_tokens?filter[leaked]=true returns tokens Datadog detected as leaked
- New PATs/SATs created by a token-authenticated call (a token can mint subset-scoped tokens)
- Recent last_used_at on tokens expected to be idle

## Respond: how to revoke it
- Admin: **Revoke a token (PAT)**. Owner or admin revokes a PAT; it stops authenticating within seconds. Where: Personal Settings > Access Tokens or Organization Settings > Access Tokens > Revoke Token; DELETE /api/v2/personal_access_tokens/<PAT_ID>.
- Admin: **Disable existing members**. Disabling a user revokes all of their PATs immediately. Where: Organization Settings > Users > Disable.

Revoke the token in the UI or with DELETE on its endpoint; also list and revoke any tokens it created. For PATs, disabling the owner revokes all their PATs. Live access ends on revocation: yes. Docs: revoked tokens can no longer authenticate; takes effect within seconds (eventual consistency).

## No vendor documentation found
- SSO and MFA rules apply
- Exact Audit Trail event names and attribute names for PAT/SAT creation, use and revocation
- Rate limits for these endpoints with PAT/SAT auth
- No org setting found that blocks personal application keys or forces service-account-only keys.
- Whether the IP allowlist applies to API-key and client-token requests outside telemetry intake is not stated; entitlement differs between account docs (Pro+/Enterprise) and API reference (Enterprise).
- Plan requirement for Agent-based WIF: current WIF page lists no tier; earlier material says Enterprise-only and preview.
- How to delete or disable an identity mapping is not documented on the WIF page; intake mappings are deleted via API.
- Whether custom roles (needed to narrow these permissions) require a specific plan was not confirmed.

## Sources
- [Personal Access Tokens](https://docs.datadoghq.com/account_management/personal-access-tokens/) (retrieved 2026-10-12)
- [IP Allowlist - Datadog Infrastructure and Application Monitoring](https://docs.datadoghq.com/account_management/org_settings/ip_allowlist/) (retrieved 2026-10-09)
- [Datadog Role Permissions](https://docs.datadoghq.com/account_management/rbac/permissions/) (retrieved 2026-10-12)
- [User Management](https://docs.datadoghq.com/account_management/users/) (retrieved 2026-10-14)
- [datadog-api-client-go: v2 OpenAPI spec](https://github.com/DataDog/datadog-api-client-go/blob/master/.generator/schemas/v2/openapi.yaml) (retrieved 2026-10-14)
- [Datadog Audit Trail](https://docs.datadoghq.com/account_management/audit_trail/) (retrieved 2026-10-12)
- [Audit Trail Events](https://docs.datadoghq.com/account_management/audit_trail/events/) (retrieved 2026-10-12)
- [Audit API reference](https://docs.datadoghq.com/api/latest/audit/) (retrieved 2026-10-14)
- [Users API reference](https://docs.datadoghq.com/api/latest/users/) (retrieved 2026-10-14)
- [Service Access Tokens](https://docs.datadoghq.com/account_management/service-access-tokens/) (retrieved 2026-10-14)
- [Logs API: Search logs](https://docs.datadoghq.com/api/latest/logs/search-logs-post/) (retrieved 2026-10-12)
