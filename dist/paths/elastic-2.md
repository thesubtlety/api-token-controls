# Elastic Cloud: Elasticsearch API key (personal/user API key, incl. Serverless project API keys)

`elastic-2` · API key / token · person or service. Base64 id:api_key sent as 'Authorization: ApiKey' to Elasticsearch/Kibana. Holds a snapshot of the creator's privileges, or the intersection with given role descriptors.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Kibana API Keys management page shows all users' keys to manage_api_key holders; GET /_security/api_key returns all keys. | Kibana API Keys management page shows all users' keys to manage_api_key holders; GET /_security/api_key returns all keys. |
| Protect: Admin can block or require approval | Yes | xpack.security.authc.api_key.enabled | Where: Self-managed: elasticsearch.yml xpack.security.authc.api_key.enabled: false (static, restart). ECH: Edit > Elasticsearch > Manage user settings and extensions |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | ECH/Serverless IP filters gate all deployment traffic (403); self-managed uses xpack.security.http.filter.*. Not per key. | IP filters (network security policies): Organization > Network security > IP filter; apply to deployments |
| Protect: Expires automatically | Yes | No expiry by default (Kibana quick-create: 90 days) | API key expiration (Elasticsearch): Kibana API keys > Create API key; expiration field |
| Detect: Usage appears in logs | Yes | apikey.id, apikey.name, authentication.type | Where: ECH: deployment Edit > Elasticsearch > Manage user settings and extensions > add xpack.security.audit.enabled: true; view in monitoring deployment Discover (elastic-cloud-logs-*), filter apikey.id / authentication.type: API_KEY · API: PUT _cluster/settings {"persistent":{"xpack.security.audit.enabled":true}} (9.5+) |
| Detect: Data reads appear in logs | Conditional | Audit log, subscription-gated | Where: Same audit log; filter event.action access_granted and apikey.id (access_granted is in the default include list) |
| Respond: Revocation ends active access | Yes | Invalidated keys fail authentication. | DELETE /_security/api_key with ids, or by username/realm_name to kill all of a user's keys. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **xpack.security.authc.api_key.enabled** (Disable; all plans; default off). Turns off the built-in API key service for the cluster. Where: elasticsearch.yml (static).
- **Role descriptors / access on API key** (Limit scope; all plans; default off). Restricts the key to given privileges and indices. Where: POST /_security/api_key role_descriptors; POST /_security/cross_cluster/api_key access.
- **API key expiration (Elasticsearch)** (Limit lifetime; all plans; default off). Optional expiry; none by default. Where: Kibana API keys > Create API key; expiration field.
- **IP filters (network security policies)** (Limit network; all plans; default off). Rejects deployment/project traffic from non-allowed IPs with 403. Where: Organization > Network security > IP filter; apply to deployments.

- Network: conditional (checked at api_request). ECH/Serverless IP filters gate all deployment traffic (403); self-managed uses xpack.security.http.filter.*. Not per key.
- Lifetime: No expiry by default (Kibana quick-create: 90 days). Renewal: Reused until expiry or invalidation.
- Keyless option: not_verified. Key is owned by a user in a realm (e.g. SAML) but works independently of IdP sessions; docs do not state behavior when the IdP user is removed.
- Conditions: Static setting; availability on ECH user settings not verified.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Elasticsearch audit log: Disabled by default; subscription-gated; on ECH requires logging and monitoring to a monitoring deployment.

### Fields that identify the credential
- `apikey.id` (Elasticsearch audit log): Present for API key authentication
- `apikey.name` (Elasticsearch audit log): null
- `authentication.type` (Elasticsearch audit log): API_KEY

### Lifecycle events
- create: `create_apikey` Needs security_config_change event type
- modify: `change_apikey` Needs security_config_change
- use: `authentication_success` null
- use: `access_granted` Per-action authorization
- revoke: `invalidate_apikeys` Needs security_config_change

### Correlate on
`apikey.id`, `user.name`, `user.realm`, `origin.address`, `request.id`

### API calls a holder can make, and whether they are logged
- recon: `GET /_security/_authenticate`. Identity, roles, api_key info Logged: plan (`authentication_success`). If audit logging enabled
- enumeration (bulk): `GET /_security/api_key`. Own keys, or all keys with read_security/manage_api_key Logged: plan (`access_granted`). 
- collection (bulk): `GET /_search`. Documents Logged: plan (`access_granted`). Audit log, subscription-gated

### What to look for (analyst guidance)
- Keys without expiry created by admins
- authentication.type API_KEY from new origin.address
- Bulk _search or scroll by API key

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **Invalidate API keys**. Invalidated keys fail authentication; can target by owner, user or realm. Where: DELETE /_security/api_key; Kibana API keys > Delete.

DELETE /_security/api_key with ids, or by username/realm_name to kill all of a user's keys. Live access ends on revocation: yes. Invalidated keys fail authentication.

## No vendor documentation found
- SSO and MFA rules apply
- Stops working when user is removed
- IP restriction for the Elastic Cloud API (api.elastic-cloud.com) used with Cloud API keys.
- Whether an org can block creation of Cloud API keys with no expiry (Never).
- Org-level audit log of Cloud API key creation/use outside FedRAMP Moderate.
- Whether ES API keys owned by a SAML user stop working when the user is removed in the IdP.
- Whether xpack.security.authc.api_key.enabled can be set in ECH user settings.
- Whether Cloud API key revocation affects in-flight requests.

## Sources
- [Elasticsearch API keys](https://www.elastic.co/docs/deploy-manage/api-keys/elasticsearch-api-keys) (retrieved 2026-10-14)
- [Create an API key](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-security-create-api-key) (retrieved 2026-10-14)
- [Serverless project API keys](https://www.elastic.co/docs/deploy-manage/api-keys/serverless-project-api-keys) (retrieved 2026-10-14)
- [Manage IP filters in ECH or Serverless](https://www.elastic.co/docs/deploy-manage/security/ip-filtering-cloud) (retrieved 2026-10-14)
- [Security settings in Elasticsearch](https://www.elastic.co/docs/reference/elasticsearch/configuration-reference/security-settings) (retrieved 2026-10-14)
- [Get API key information](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-security-get-api-key) (retrieved 2026-10-14)
- [Enable audit logging](https://www.elastic.co/docs/deploy-manage/security/logging-configuration/enabling-audit-logs) (retrieved 2026-10-14)
- [Stack monitoring on ECH and ECE](https://www.elastic.co/docs/deploy-manage/monitor/stack-monitoring/ece-ech-stack-monitoring) (retrieved 2026-10-14)
- [Elasticsearch audit events](https://www.elastic.co/docs/reference/elasticsearch/elasticsearch-audit-events) (retrieved 2026-10-14)
- [Auditing security settings](https://www.elastic.co/docs/reference/elasticsearch/configuration-reference/auding-settings) (retrieved 2026-10-14)
- [Invalidate API keys](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-security-invalidate-api-key) (retrieved 2026-10-14)
- [Enable audit logging](https://www.elastic.co/docs/deploy-manage/monitor/stack-audit-logging/enabling-audit-logs) (retrieved 2026-10-14)
- [Elasticsearch API (OpenAPI) - Create a cross-cluster API key](https://www.elastic.co/docs/api/doc/elasticsearch.json) (retrieved 2026-10-14)
