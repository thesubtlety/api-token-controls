# Datadog: OAuth app

`datadog-2` · OAuth · person. Organization API key, often combined with a user/service-account application key; OAuth for supported apps; workload federation for supported scenarios.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Organization Settings > Mobile and Third-Party Access lists OAuth apps and the users who authorized each one. | Organization Settings > Mobile and Third-Party Access lists OAuth apps and the users who authorized each one. |
| Protect: Admin can block or require approval | Yes | Disable OAuth access for an application | Disable OAuth access for an application: Organization Settings > OAuth Apps (Admin role or org_authorized_apps_read/write) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional (requires Pro+ or Enterprise, enabled via support (API reference says Enterprise)) | Org IP allowlist explicitly covers third-party apps accessing Datadog through OAuth. Org-wide only; cannot be scoped to a token, key, user or endpoint. | IP Allowlist: Organization Settings > Security > IP Allowlist; IP Allowlist API; Terraform ip_allowlist (Org Management permission) |
| Protect: Expires automatically | Yes | Access token TTL 1 hour | API: Fixed 1-hour access token TTL, returned by POST /api/v2/oauth2/token; not configurable |
| Detect: Usage appears in logs | Yes | @metadata.oauth_client.name, @asset.id | Where: Audit Trail explorer; filter by Authentication Attributes facets · API: POST /api/v2/audit/events/search |
| Detect: Data reads appear in logs | Yes | @evt.name:"Log Management" @asset.type:logs_query | Where: Audit Trail explorer; query @evt.name:"Log Management" @asset.type:logs_query · API: POST /api/v2/audit/events/search with that query |
| Respond: Revocation ends active access | Partial | Refresh tokens never expire until revoked; access tokens last 1 hour. Not documented whether revoking a refresh token kills issued access tokens. | Revoke tokens via POST /oauth2/v1/revoke or user revokes app authorization; delete the OAuth client. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **IP Allowlist** (Limit network; Pro+ or Enterprise, enabled via support (API reference says Enterprise); default off). Blocks UI, public API and OAuth app access from IPs outside the list; Agent intake and some endpoints are exempt. Where: Organization Settings > Security > IP Allowlist; IP Allowlist API; Terraform ip_allowlist (Org Management permission).
- **Disable OAuth access for an application** (Disable; all plans; default off). Turns off an OAuth app and revokes it for all users in the org. Where: Organization Settings > OAuth Apps (Admin role or org_authorized_apps_read/write).

- Network: conditional (checked at api_request). Org IP allowlist explicitly covers third-party apps accessing Datadog through OAuth. Org-wide only; cannot be scoped to a token, key, user or endpoint.
- Lifetime: Access token TTL 1 hour. Renewal: Refresh token obtains a new 1-hour access token. Marketplace OAuth client refresh tokens have no expiration until the user revokes authorization; other client types not stated.
- Keyless option: not_verified. OAuth authorization-code grant with PKCE and user consent. No external identity/assertion exchange is documented for this path; AWS workload federation is a separate path (datadog-3).
- Conditions: IP documentation differs on entitlement (Pro+ via support vs Enterprise). Confirm contract. AWS WIF requires supported integration/configuration.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Datadog Audit Trail: Request events for API calls plus product events; records @auth_method and key IDs. Default 90-day retention when enabled (3-90 days); 7 days when disabled.

### Fields that identify the credential
- `@metadata.oauth_client.name` (Audit Trail): OAuth client used when @auth_method is oauth_token
- `@asset.id` (Audit Trail): OAuth client asset on oauth_client events

### Lifecycle events
- change: `@evt.name:OAuth @asset.type:oauth_client` OAuth client created, modified or deleted, with previous/new values
- use: `@auth_method:oauth_token` API call made with OAuth access token

### Correlate on
`@usr.email`, `@usr.id`, `@metadata.oauth_client.name`, `@network.client.ip`, `@http.useragent`, `@http.url_details.path`

### API calls a holder can make, and whether they are logged
- collection: `POST /api/v2/logs/events/search`. Log events (OAuth scope logs_read_data) Logged: yes (`@evt.name:"Log Management" @asset.type:logs_query`). Audit Trail event 'Query (Public Beta)'; Audit Trail must be enabled.

### What to look for (analyst guidance)
- OAuth client name not on the approved app list
- OAuth token use by a user who was deactivated or lost the role
- New OAuth client created or redirect URIs changed
- API_KEYS_WRITE-scoped app creating keys

### Sample query (Datadog Audit Trail search)
Write actions performed through OAuth apps

```
@auth_method:oauth_token @http.method:(POST OR PATCH OR DELETE)
```

## Respond: how to revoke it
- Admin: **Revoke a user's OAuth access**. Removes one user's authorization for an OAuth app; the user can re-authorize. Where: Organization Settings > OAuth Apps.

Revoke tokens via POST /oauth2/v1/revoke or user revokes app authorization; delete the OAuth client. Live access ends on revocation: partial. Refresh tokens never expire until revoked; access tokens last 1 hour. Not documented whether revoking a refresh token kills issued access tokens.

## No vendor documentation found
- SSO and MFA rules apply
- Stops working when user is removed
- token format
- OAuth client ID field in audit events
- authorization/consent grant event name
- refresh token rotation
- No org setting found that blocks personal application keys or forces service-account-only keys.
- Whether the IP allowlist applies to API-key and client-token requests outside telemetry intake is not stated; entitlement differs between account docs (Pro+/Enterprise) and API reference (Enterprise).
- Plan requirement for Agent-based WIF: current WIF page lists no tier; earlier material says Enterprise-only and preview.
- How to delete or disable an identity mapping is not documented on the WIF page; intake mappings are deleted via API.
- Whether custom roles (needed to narrow these permissions) require a specific plan was not confirmed.

## Sources
- [API and Application Keys](https://docs.datadoghq.com/account_management/api-app-keys/) (retrieved 2026-10-09)
- [Workload Identity Federation](https://docs.datadoghq.com/account_management/workload_identity_federation/) (retrieved 2026-10-09)
- [OAuth2 in Datadog](https://docs.datadoghq.com/extend/authorization/oauth2_in_datadog/) (retrieved 2026-10-09)
- [OAuth2 Authorization Endpoints Reference - Datadog](https://docs.datadoghq.com/extend/authorization/oauth2_endpoints/) (retrieved 2026-10-09)
- [IP Allowlist - Datadog Infrastructure and Application Monitoring](https://docs.datadoghq.com/account_management/org_settings/ip_allowlist/) (retrieved 2026-10-09)
- [IP Allowlist - Datadog Infrastructure and Application Monitoring](https://docs.datadoghq.com/api/latest/ip-allowlist/) (retrieved 2026-10-09)
- [API and Application Keys](https://docs.datadoghq.com/account_management/api-app-keys/) (retrieved 2026-10-09)
- [OAuth Apps](https://docs.datadoghq.com/account_management/org_settings/oauth_apps/) (retrieved 2026-10-13)
- [OAuth2 Authorization Endpoints Reference](https://docs.datadoghq.com/developers/authorization/oauth2_endpoints/) (retrieved 2026-10-12)
- [Datadog Audit Trail](https://docs.datadoghq.com/account_management/audit_trail/) (retrieved 2026-10-12)
- [Audit API reference](https://docs.datadoghq.com/api/latest/audit/) (retrieved 2026-10-14)
- [Audit Trail Events](https://docs.datadoghq.com/account_management/audit_trail/events/) (retrieved 2026-10-12)
- [dd.audit dataset (DDSQL)](https://docs.datadoghq.com/ddsql_reference/data_directory/dd/dd.audit.dataset/) (retrieved 2026-10-12)
- [Logs API: Search logs](https://docs.datadoghq.com/api/latest/logs/search-logs-post/) (retrieved 2026-10-12)
