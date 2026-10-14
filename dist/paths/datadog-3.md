# Datadog: AWS workload federation

`datadog-3` · Federated identity · service. Organization API key, often combined with a user/service-account application key; OAuth for supported apps; workload federation for supported scenarios.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Identity mappings can be listed (Organization Settings > Workload Identity Federation, or GET /api/v2/cloud_auth/aws/persona_mapping); issued JWTs are not listed. | Identity mappings can be listed (Organization Settings > Workload Identity Federation, or GET /api/v2/cloud_auth/aws/persona_mapping); issued JWTs are not listed. |
| Protect: Admin can block or require approval | Yes | Workload Identity Federation Write permission | Workload Identity Federation Write permission: Organization Settings > Roles |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Org IP allowlist applies to UI/API, with documented intake/public-dashboard exceptions. Not a per-key rule. | Where: Organization Settings > Security > IP Allowlist (org-wide) · API: PATCH /api/v2/ip_allowlist |
| Protect: Expires automatically | Yes | Short-lived JWT; Datadog returns an expiry with the token; official Go client assumes 15 minutes if none is returned | API: Read the expires attribute in the POST /api/v2/delegated-token response; not configurable (Go client assumes 15 min if absent) |
| Detect: Usage appears in logs | Yes | arn_pattern, account_identifier | Datadog Audit Trail: Request events for API calls plus product events; records @auth_method and key IDs. Default 90-day retention when enabled (3-90 days); 7 days when disabled. · AWS CloudTrail (customer side): Role sessions whose credentials sign the STS GetCallerIdentity request. |
| Detect: Data reads appear in logs | Yes | @evt.name:"Log Management" @asset.type:logs_query | Where: Audit Trail explorer; query @evt.name:"Log Management" @asset.type:logs_query · API: POST /api/v2/audit/events/search with that query |
| Respond: Revocation ends active access | No docs found | JWT lifetime not documented; Agent may fall back to configured static API key. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Workload Identity Federation identity and intake mappings** (Limit resources; Not stated on page; requires Datadog-AWS integration; default off). Only AWS role ARNs matched by a mapping can authenticate, and each identity mapping grants exactly one Datadog user or service account's permissions. Where: Organization Settings > Workload Identity Federation > Identity Mappings / Intake Mappings; cloud_auth API.
- **Workload Identity Federation Write permission** (Disable; all plans; default on). Only roles with this permission can add, change or remove federation mappings (Admin role by default). Where: Organization Settings > Roles.

- Network: conditional (checked at mixed). Org IP allowlist applies to UI/API, with documented intake/public-dashboard exceptions. Not a per-key rule.
- Lifetime: Short-lived JWT; Datadog returns an expiry with the token; official Go client assumes 15 minutes if none is returned. Renewal: Terraform provider re-signs an AWS STS request to get a new temporary JWT. Agent receives a Datadog-managed API key that Datadog rotates; on failure the Agent falls back to the API key in datadog.yaml.
- Keyless option: limited. AWS identity (assumed-role ARN) maps to a Datadog user/service account for a temporary JWT (Terraform) or to an intake mapping for a managed API key (Agent). AWS is the only supported cloud; Agent flow not on US1-FED/US2-FED sites.
- Conditions: IP documentation differs on entitlement (Pro+ via support vs Enterprise). Confirm contract. AWS WIF requires supported integration/configuration.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Datadog Audit Trail: Request events for API calls plus product events; records @auth_method and key IDs. Default 90-day retention when enabled (3-90 days); 7 days when disabled.
- AWS CloudTrail (customer side): Role sessions whose credentials sign the STS GetCallerIdentity request.

### Fields that identify the credential
- `arn_pattern` (cloud_auth persona_mapping / intake_mapping config): Assumed-role ARN pattern mapped to Datadog identity
- `account_identifier` (cloud_auth persona_mapping config): Datadog user email or service account mapped to

### Lifecycle events
No docs found.

### Correlate on
`@usr.email`, `@usr.id`, `@network.client.ip`, `@http.useragent`

### API calls a holder can make, and whether they are logged
- collection: `POST /api/v2/logs/events/search`. Log events, as the mapped user or service account Logged: yes (`@evt.name:"Log Management" @asset.type:logs_query`). WIF JWT is used for later API calls as the mapped identity; logs query appears as Audit Trail 'Query (Public Beta)' event.

### What to look for (analyst guidance)
- New or broadened arn_pattern (wildcard) in a persona or intake mapping
- Mapping to a human user instead of a service account
- Federated identity calling from IPs outside the AWS workload's range
- Agent falling back to static API key in datadog.yaml

### Sample query (Datadog Audit Trail search)
Changes to AWS federation mappings

```
@http.url_details.path:/api/v2/cloud_auth/aws/*
```

## Respond: how to revoke it


Delete intake mapping (DELETE /api/v2/cloud_auth/aws/intake_mapping/<MAPPING_UUID>); remove persona mapping; disable mapped service account; revoke the AWS role session on the AWS side. Live access ends on revocation: unknown. JWT lifetime not documented; Agent may fall back to configured static API key.

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- Stops working when user is removed
- @auth_method value for federated JWT
- JWT lifetime
- audit event names for mapping changes
- credential id field for federated sessions
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
- [datadog-api-client-go: delegated_auth.go](https://github.com/DataDog/datadog-api-client-go/blob/master/api/datadog/delegated_auth.go) (retrieved 2026-10-14)
- [Datadog Audit Trail](https://docs.datadoghq.com/account_management/audit_trail/) (retrieved 2026-10-12)
- [Audit Trail Events](https://docs.datadoghq.com/account_management/audit_trail/events/) (retrieved 2026-10-12)
- [Audit API reference](https://docs.datadoghq.com/api/latest/audit/) (retrieved 2026-10-14)
- [dd.audit dataset (DDSQL)](https://docs.datadoghq.com/ddsql_reference/data_directory/dd/dd.audit.dataset/) (retrieved 2026-10-12)
- [Logs API: Search logs](https://docs.datadoghq.com/api/latest/logs/search-logs-post/) (retrieved 2026-10-12)
- [Datadog Role Permissions](https://docs.datadoghq.com/account_management/rbac/permissions/) (retrieved 2026-10-12)
