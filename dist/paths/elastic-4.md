# Elastic Cloud: Service account token

`elastic-4` · API key / token · service. Bearer token for a service account (e.g. elastic/fleet-server, elastic/kibana) with fixed privileges.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Get service accounts API, then get service account credentials API per account (includes file-backed tokens). | Get service accounts API, then get service account credentials API per account (includes file-backed tokens). |
| Protect: Admin can block or require approval | Not available | Built-in service accounts cannot be disabled. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Only via deployment IP filters / HTTP filters; not per token. | IP filters (network security policies): Organization > Network security > IP filter; apply to deployments |
| Protect: Expires automatically | Not available | Never expires |  |
| Detect: Usage appears in logs | Yes | authentication.token.name, authentication.token.type | Where: Enable audit logging (xpack.security.audit.enabled: true); filter authentication.token.name |
| Detect: Data reads appear in logs | Conditional | Elasticsearch audit log (access_granted is in the default include list once auditing is enabled); needs a qualifying subscription. Token identified by authentication.token.name. | Where: Audit log: filter access_granted and authentication.token.name |
| Respond: Revocation ends active access | Yes | Index-backed token cache clears automatically when the security index changes (for example, a token delete); file-backed cache clears on file change. No derived tokens. | Delete the token via API; file-backed tokens need the service_tokens file edited. |
| Respond: Stops working when user is removed | N/A | Service accounts are for external services, not individual users. |  |

## Protect: what an admin can configure

### Admin controls
- **IP filters (network security policies)** (Limit network; all plans; default off). Rejects deployment/project traffic from non-allowed IPs with 403. Where: Organization > Network security > IP filter; apply to deployments.

### Not available (vendor states)
- Service tokens cannot be given an expiry.
- Built-in service accounts cannot be disabled.

- Network: conditional (checked at api_request). Only via deployment IP filters / HTTP filters; not per token.
- Lifetime: Never expires. Renewal: Create new token and delete old one.
- Keyless option: not_applicable. Service-only credential, not usable by people.
- Conditions: User-managed service accounts appear in current API reference with an enabled flag.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Elasticsearch audit log: Same gating.

### Fields that identify the credential
- `authentication.token.name` (Elasticsearch audit log): null
- `authentication.token.type` (Elasticsearch audit log): null

### Lifecycle events
- create: `create_service_token` Needs security_config_change
- revoke: `delete_service_token` Needs security_config_change

### Correlate on
`user.name (e.g. elastic/fleet-server)`, `authentication.token.name`, `origin.address`

### API calls a holder can make, and whether they are logged
- recon: `GET /_security/_authenticate`. Service account and token name Logged: plan (`authentication_success`). 
- collection: `GET /<index>/_search`. Documents in indices covered by the service account's fixed privileges Logged: plan (`access_granted`). Elasticsearch audit log (access_granted is in the default include list once auditing is enabled); needs a qualifying subscription. Token identified by authentication.token.name.

### What to look for (analyst guidance)
- Service token used from outside Fleet/Kibana hosts
- New token names

## Respond: how to revoke it
- Admin: **Delete service account tokens**. Deletes a named service token. Where: DELETE /_security/service/{namespace}/{service}/credential/token/{name}.

Delete the token via API; file-backed tokens need the service_tokens file edited. Live access ends on revocation: yes. Index-backed token cache clears automatically when the security index changes (for example, a token delete); file-backed cache clears on file change. No derived tokens.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction for the Elastic Cloud API (api.elastic-cloud.com) used with Cloud API keys.
- Whether an org can block creation of Cloud API keys with no expiry (Never).
- Org-level audit log of Cloud API key creation/use outside FedRAMP Moderate.
- Whether ES API keys owned by a SAML user stop working when the user is removed in the IdP.
- Whether xpack.security.authc.api_key.enabled can be set in ECH user settings.
- Whether Cloud API key revocation affects in-flight requests.

## Sources
- [Service accounts](https://www.elastic.co/docs/deploy-manage/users-roles/cluster-or-deployment-auth/service-accounts) (retrieved 2026-10-14)
- [Manage IP filters in ECH or Serverless](https://www.elastic.co/docs/deploy-manage/security/ip-filtering-cloud) (retrieved 2026-10-14)
- [Elasticsearch API (OpenAPI) - Create a cross-cluster API key](https://www.elastic.co/docs/api/doc/elasticsearch.json) (retrieved 2026-10-14)
- [Enable audit logging](https://www.elastic.co/docs/deploy-manage/security/logging-configuration/enabling-audit-logs) (retrieved 2026-10-14)
- [Elasticsearch audit events](https://www.elastic.co/docs/reference/elasticsearch/elasticsearch-audit-events) (retrieved 2026-10-14)
- [Stack monitoring on ECH and ECE](https://www.elastic.co/docs/deploy-manage/monitor/stack-monitoring/ece-ech-stack-monitoring) (retrieved 2026-10-14)
- [Clear service account token caches](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-security-clear-cached-service-tokens) (retrieved 2026-10-14)
- [Run a search](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-search) (retrieved 2026-10-14)
- [Enable audit logging](https://www.elastic.co/docs/deploy-manage/monitor/stack-audit-logging/enabling-audit-logs) (retrieved 2026-10-14)
- [Auditing security settings](https://www.elastic.co/docs/reference/elasticsearch/configuration-reference/auding-settings) (retrieved 2026-10-14)
