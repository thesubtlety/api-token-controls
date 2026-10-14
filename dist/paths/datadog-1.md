# Datadog: API + application keys

`datadog-1` · API key / token · person or service. Organization API key, often combined with a user/service-account application key; OAuth for supported apps; workload federation for supported scenarios.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Organization Settings > API Keys lists all org API keys (API Keys Read), and Org App Keys Read shows application keys of all users. | Organization Settings > API Keys lists all org API keys (API Keys Read), and Org App Keys Read shows application keys of all users. |
| Protect: Admin can block or require approval | Yes | API Keys Write permission; User App Keys / Org App Keys Write permissions; Service Account Write permission | API Keys Write permission: Organization Settings > Roles (custom roles) · User App Keys / Org App Keys Write permissions: Organization Settings > Roles · Service Account Write permission: Organization Settings > Roles; Organization Settings > Service Accounts |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional (requires Pro+ or Enterprise, enabled via support (API reference says Enterprise)) | Org IP allowlist applies to UI/API, with documented intake/public-dashboard exceptions. Not a per-key rule. | IP Allowlist: Organization Settings > Security > IP Allowlist; IP Allowlist API; Terraform ip_allowlist (Org Management permission) |
| Protect: Expires automatically | Not available | No built-in expiry |  |
| Detect: Usage appears in logs | Yes | @metadata.api_key.id, @metadata.app_key.id, @metadata.application_key.id, datadog.api_key_uuid | Datadog Audit Trail: Request events for API calls plus product events; records @auth_method and key IDs. Default 90-day retention when enabled (3-90 days); 7 days when disabled. · Organization Settings key list (Last used): Last used timestamp per key; Audit Trail extends history. · Datadog Logs (datadog.api_key_uuid tag): Ingested logs carry UUID of submitting API key. |
| Detect: Data reads appear in logs | Yes | @evt.name:"Log Management" @asset.type:logs_query | Where: Audit Trail explorer (Organization Settings > Audit Trail); query @evt.name:"Log Management" @asset.type:logs_query, narrow by API Key ID / actor facet · API: POST /api/v2/audit/events/search with filter.query "@evt.name:\"Log Management\" @asset.type:logs_query" |
| Respond: Revocation ends active access | Yes | Revocation may take a few seconds to propagate. Disabling a user revokes their app keys but NOT API keys they created. | Revoke API key in Organization Settings > API keys (restorable 7 days); revoke app key in Application Keys (permanent). Rotate: create new key, update services, then revoke. |
| Respond: Stops working when user is removed | Partial | Disabling a user revokes the application keys they created, but API keys they created stay valid. | Where: Organization Settings > Users > Edit > Disable toggle > Save (revokes app keys); then Organization Settings > API Keys > Revoke for API keys the user created · API: DELETE /api/v2/users/{user_id}; DELETE /api/v2/api_keys/{api_key_id} |

## Protect: what an admin can configure

### Admin controls
- **Application key scopes** (Limit scope; all plans; default off). Restricts an application key to the listed authorization scopes instead of all of its owner's permissions. Where: Organization Settings > Application Keys (edit key scopes); Key Management API.
- **API Keys Write permission** (Disable; Custom roles may require an eligible plan (not confirmed); default on). Only roles holding api_keys_write can create or rename API keys (Admin role by default). Where: Organization Settings > Roles (custom roles).
- **User App Keys / Org App Keys Write permissions** (Disable; all plans; default on). Controls who can create and manage their own application keys (user_app_keys) or anyone's keys (org_app_keys_write). Where: Organization Settings > Roles.
- **Service Account Write permission** (Disable; all plans; default on). Limits who can create, disable and use service accounts that own application keys. Where: Organization Settings > Roles; Organization Settings > Service Accounts.
- **One-Time Read (OTR) mode** (Other; all plans; default varies). Shows application key secrets only once at creation; becomes permanent after 3 months enabled. Where: Organization Settings > Application Keys (requires org_app_keys_write + org_management).
- **Actions API access (per application key)** (Limit scope; all plans; default off). Application keys cannot call the Actions APIs unless explicitly enabled per key. Where: Organization Settings > Application Keys or API.
- **IP Allowlist** (Limit network; Pro+ or Enterprise, enabled via support (API reference says Enterprise); default off). Blocks UI, public API and OAuth app access from IPs outside the list; Agent intake and some endpoints are exempt. Where: Organization Settings > Security > IP Allowlist; IP Allowlist API; Terraform ip_allowlist (Org Management permission).

### Not available (vendor states)
- No expiration or maximum lifetime for API or application keys.

- Network: conditional (checked at api_request). Org IP allowlist applies to UI/API, with documented intake/public-dashboard exceptions. Not a per-key rule.
- Lifetime: No built-in expiry. Renewal: API/application keys require explicit rotation or revocation.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: IP allowlist docs still differ on entitlement (account docs: Pro+ or Enterprise, via support; API reference: enterprise-only). Confirm contract. AWS WIF requires the Datadog-AWS integration.

## Detect: what gets logged
- Token prefix: `ddapp_ (new application keys); API keys: null`

### Logs
- Datadog Audit Trail: Request events for API calls plus product events; records @auth_method and key IDs. Default 90-day retention when enabled (3-90 days); 7 days when disabled.
- Organization Settings key list (Last used): Last used timestamp per key; Audit Trail extends history.
- Datadog Logs (datadog.api_key_uuid tag): Ingested logs carry UUID of submitting API key.

### Fields that identify the credential
- `@metadata.api_key.id` (Audit Trail): API key used to authenticate
- `@metadata.app_key.id` (Audit Trail): Application key when @auth_method is api_app_keys
- `@metadata.application_key.id` (Audit Trail): Application key used for API auth
- `datadog.api_key_uuid` (Logs): API key that submitted the log

### Lifecycle events
- create: `@evt.name:Authentication @asset.type:api_key` API key accessed, listed, created or deleted in Org Settings
- create: `@evt.name:Authentication @asset.type:application_key` App key accessed, listed, created or deleted
- change: `@evt.name:"Access Management" @asset.type:application_key` Service account app key created/modified/deleted
- use: `@auth_method:api_app_keys` API request authenticated with key pair
- use: `Dormant application key used` Security Notification, @metadata.dormant_key_age
- revoke: `Token leaked` Security Notification, @metadata.key_leak.detected_at; revoke the key

### Correlate on
`@usr.email`, `@usr.id`, `@network.client.ip`, `@network.client.geoip.as.number`, `@http.useragent`, `@http.url_details.path`, `@metadata.api_key.id`, `@metadata.app_key.id`

### API calls a holder can make, and whether they are logged
- collection: `POST /api/v2/logs/events/search`. Log events (needs logs_read_data) Logged: yes (`@evt.name:"Log Management" @asset.type:logs_query`). Audit Trail event 'Query (Public Beta)'; Audit Trail must be enabled.

### What to look for (analyst guidance)
- App key used after owner deactivated (should be revoked; check API keys created by that user, which stay valid)
- Dormant application key used notification
- Key ID seen from new ASN or country
- Read-heavy calls (logs queries, key listing) from a key normally used for writes
- Token leaked notification for any key

### Sample query (Datadog Audit Trail search)
Find use of a specific application key from unexpected IPs

```
@auth_method:api_app_keys @metadata.app_key.id:<KEY_ID> -@network.client.ip:(<KNOWN_IP_1> OR <KNOWN_IP_2>)
```

## Respond: how to revoke it
- Admin: **Revoke API key / application key**. Revoked API keys can be restored for 7 days; application key revocation is permanent. Where: Organization Settings > API Keys / Application Keys; Key Management API.
- Admin: **Unused Application Keys (Governance Console control)**. Detects application keys unused for a set period (default 30 days) and can automatically revoke them. Where: Governance Console > Controls > Unused Application Keys > Enforce control.
- Admin: **Unused API Keys (Governance Console control)**. Detects API keys unused for a set period and can automatically revoke them. Where: Governance Console > Controls > Unused API Keys > Enforce control.
- Admin: **Leaked API Keys (Governance Console control)**. Detects active API keys found exposed publicly by Datadog token leak detection, with optional enforcement. Where: Governance Console > Controls > Leaked API Keys.

Revoke API key in Organization Settings > API keys (restorable 7 days); revoke app key in Application Keys (permanent). Rotate: create new key, update services, then revoke. Live access ends on revocation: yes. Revocation may take a few seconds to propagate. Disabling a user revokes their app keys but NOT API keys they created.

## No vendor documentation found
- SSO and MFA rules apply
- API key string format/regex
- exact @evt.name value for API request events
- @asset.type for service-account app key list vs org
- No org setting found that blocks personal application keys or forces service-account-only keys.
- Whether the IP allowlist applies to API-key and client-token requests outside telemetry intake is not stated; entitlement differs between account docs (Pro+/Enterprise) and API reference (Enterprise).
- Plan requirement for Agent-based WIF: current WIF page lists no tier; earlier material says Enterprise-only and preview.
- How to delete or disable an identity mapping is not documented on the WIF page; intake mappings are deleted via API.
- Whether custom roles (needed to narrow these permissions) require a specific plan was not confirmed.

## Sources
- [API and Application Keys](https://docs.datadoghq.com/account_management/api-app-keys/) (retrieved 2026-10-09)
- [Workload Identity Federation](https://docs.datadoghq.com/account_management/workload_identity_federation/) (retrieved 2026-10-09)
- [OAuth2 in Datadog](https://docs.datadoghq.com/extend/authorization/oauth2_in_datadog/) (retrieved 2026-10-09)
- [IP Allowlist - Datadog Infrastructure and Application Monitoring](https://docs.datadoghq.com/account_management/org_settings/ip_allowlist/) (retrieved 2026-10-09)
- [IP Allowlist - Datadog Infrastructure and Application Monitoring](https://docs.datadoghq.com/api/latest/ip-allowlist/) (retrieved 2026-10-09)
- [API and Application Keys](https://docs.datadoghq.com/account_management/api-app-keys/) (retrieved 2026-10-09)
- [User Management](https://docs.datadoghq.com/account_management/users/) (retrieved 2026-10-14)
- [Datadog Role Permissions](https://docs.datadoghq.com/account_management/rbac/permissions/) (retrieved 2026-10-12)
- [Datadog Audit Trail](https://docs.datadoghq.com/account_management/audit_trail/) (retrieved 2026-10-12)
- [Audit Trail Events](https://docs.datadoghq.com/account_management/audit_trail/events/) (retrieved 2026-10-12)
- [Audit API reference](https://docs.datadoghq.com/api/latest/audit/) (retrieved 2026-10-14)
- [Users API reference](https://docs.datadoghq.com/api/latest/users/) (retrieved 2026-10-14)
- [Key Management API reference](https://docs.datadoghq.com/api/latest/key-management/) (retrieved 2026-10-14)
- [dd.audit dataset (DDSQL)](https://docs.datadoghq.com/ddsql_reference/data_directory/dd/dd.audit.dataset/) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Personal Access Tokens](https://docs.datadoghq.com/account_management/personal-access-tokens/) (retrieved 2026-10-12)
- [Logs API: Search logs](https://docs.datadoghq.com/api/latest/logs/search-logs-post/) (retrieved 2026-10-12)
- [Governance Console Controls](https://docs.datadoghq.com/account_management/governance_console/controls/) (retrieved 2026-10-14)
- [Governance Console](https://docs.datadoghq.com/account_management/governance_console/) (retrieved 2026-10-14)
- [Credential Management](https://docs.datadoghq.com/getting_started/access_for_enterprises/credential_management/) (retrieved 2026-10-12)
