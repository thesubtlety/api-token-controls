# Datadog: Service Access Token (SAT)

`datadog-6` · Personal access token · service. Bearer token (prefix ddsat_) owned by a service account, sent in the Authorization header or dd-application-key. No API key needed. Scopes are mandatory.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Organization Settings > Access Tokens (org_app_keys_read) or GET /api/v2/personal_access_tokens lists all SATs. | Organization Settings > Access Tokens (org_app_keys_read) or GET /api/v2/personal_access_tokens lists all SATs. |
| Protect: Admin can block or require approval | Yes | Service Account Write (service_account_write) permission | Service Account Write (service_account_write) permission: Organization Settings > Roles (permission service_account_write) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Org-wide IP allowlist covers all Datadog API calls, so token use from other IPs is blocked; it cannot be set per token. Pro+ or Enterprise, enabled through support. | IP Allowlist: Organization Settings > Security > IP Allowlist; IP Allowlist API |
| Protect: Expires automatically | Yes | Optional TTL: 1 day, 1 month, 1 year, custom, or Never; fixed at creation | Where: Organization Settings > Service Accounts > (account) > Access Tokens > + New Token > Expiration Date (1 day/1 month/1 year/Never/Custom) · API: GET /api/v2/service_accounts/{service_account_id}/access_tokens/{token_id} |
| Detect: Usage appears in logs | Yes | public_portion / id (Token ID), last_used_at | Audit Trail: Must be enabled (Organization Settings > Audit Trail Settings). Default retention 90 days (3-90 configurable). Records token creation, usage and revocation. Each call is attributed to the owning service account. |
| Detect: Data reads appear in logs | Yes | @evt.name:"Log Management" @asset.type:logs_query | Where: Audit Trail explorer; query @evt.name:"Log Management" @asset.type:logs_query · API: POST /api/v2/audit/events/search with that query |
| Respond: Revocation ends active access | Yes | Docs: revoked tokens can no longer authenticate; takes effect within seconds (eventual consistency). | Revoke the token in the UI or with DELETE on its endpoint; also list and revoke any tokens it created. For PATs, disabling the owner revokes all their PATs. |
| Respond: Stops working when user is removed | N/A | SATs belong to a service account and stay valid when people leave. |  |

## Protect: what an admin can configure

### Admin controls
- **Service Account Write (service_account_write) permission** (Disable; all plans; default off). Only roles with service_account_write (or org_app_keys_write) can create SATs. Where: Organization Settings > Roles (permission service_account_write).
- **Token scopes** (Limit scope; all plans; default on). Each PAT or SAT must have at least one scope and can only do what its scopes allow. Where: Select Scopes when creating or editing a token.
- **Restrictions on token-authenticated API calls** (Other; all plans; default on). A PAT or SAT cannot create application keys, and can only mint tokens with a subset of its scopes and no longer TTL. Where: Built in.
- **IP Allowlist** (Limit network; Pro+ or Enterprise (request through support); default off). Org-wide allowlist blocks API calls from IPs outside the list, including token-authenticated calls. Where: Organization Settings > Security > IP Allowlist; IP Allowlist API.

### Not available (vendor states)
- IP restriction for a single token; the IP allowlist is org-wide only.

- Network: supported (checked at api_request). Org-wide IP allowlist covers all Datadog API calls, so token use from other IPs is blocked; it cannot be set per token. Pro+ or Enterprise, enabled through support.
- Lifetime: Optional TTL: 1 day, 1 month, 1 year, custom, or Never; fixed at creation. Renewal: Expiration cannot be changed; revoke and create a new token.
- Keyless option: not_applicable. Static bearer token issued by Datadog; no external identity exchange.
- Conditions: service_account_write is in the Datadog Admin Role by default.

## Detect: what gets logged
- Token prefix: `ddsat_`

### Logs
- Audit Trail: Must be enabled (Organization Settings > Audit Trail Settings). Default retention 90 days (3-90 configurable). Records token creation, usage and revocation. Each call is attributed to the owning service account.

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
- Admin: **Revoke a token (SAT)**. Admin revokes a SAT; it stops authenticating within seconds. Where: Organization Settings > Service Accounts > (account) > Revoke, or Organization Settings > Access Tokens; DELETE /api/v2/service_accounts/<SERVICE_ACCOUNT_ID>/access_tokens/<TOKEN_ID>.

Revoke the token in the UI or with DELETE on its endpoint; also list and revoke any tokens it created. For PATs, disabling the owner revokes all their PATs. Live access ends on revocation: yes. Docs: revoked tokens can no longer authenticate; takes effect within seconds (eventual consistency).

## No vendor documentation found
- SSO and MFA rules apply
- Exact Audit Trail event names and attribute names for PAT/SAT creation, use and revocation
- Whether disabling the owning service account revokes its SATs
- Rate limits for these endpoints with PAT/SAT auth
- No org setting found that blocks personal application keys or forces service-account-only keys.
- Whether the IP allowlist applies to API-key and client-token requests outside telemetry intake is not stated; entitlement differs between account docs (Pro+/Enterprise) and API reference (Enterprise).
- Plan requirement for Agent-based WIF: current WIF page lists no tier; earlier material says Enterprise-only and preview.
- How to delete or disable an identity mapping is not documented on the WIF page; intake mappings are deleted via API.
- Whether custom roles (needed to narrow these permissions) require a specific plan was not confirmed.

## Sources
- [Service Access Tokens](https://docs.datadoghq.com/account_management/service-access-tokens/) (retrieved 2026-10-14)
- [IP Allowlist - Datadog Infrastructure and Application Monitoring](https://docs.datadoghq.com/account_management/org_settings/ip_allowlist/) (retrieved 2026-10-09)
- [Datadog Role Permissions](https://docs.datadoghq.com/account_management/rbac/permissions/) (retrieved 2026-10-12)
- [Datadog Audit Trail](https://docs.datadoghq.com/account_management/audit_trail/) (retrieved 2026-10-12)
- [Audit Trail Events](https://docs.datadoghq.com/account_management/audit_trail/events/) (retrieved 2026-10-12)
- [Audit API reference](https://docs.datadoghq.com/api/latest/audit/) (retrieved 2026-10-14)
- [datadog-api-client-go: v2 OpenAPI spec](https://github.com/DataDog/datadog-api-client-go/blob/master/.generator/schemas/v2/openapi.yaml) (retrieved 2026-10-14)
- [Personal Access Tokens](https://docs.datadoghq.com/account_management/personal-access-tokens/) (retrieved 2026-10-12)
- [Logs API: Search logs](https://docs.datadoghq.com/api/latest/logs/search-logs-post/) (retrieved 2026-10-12)
