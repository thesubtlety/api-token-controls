# Elastic Cloud: Cross-cluster API key

`elastic-3` · API key / token · service. Created on the remote cluster and stored in the local cluster keystore; authenticates only on the remote cluster interface (port 9443), not REST.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /_security/api_key returns all API keys regardless of ownership for read_security/manage_api_key holders. | GET /_security/api_key returns all API keys regardless of ownership for read_security/manage_api_key holders. |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | manage_security privilege (cross-cluster API key creation) | Where: Kibana > Roles management page > Create role / edit role: withhold manage_security cluster privilege · API: PUT /_security/role/{name} |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Remote cluster filters (ECH) and xpack.security.remote_cluster.filter.* (self-managed); deployment IP filters. | IP filters (network security policies): Organization > Network security > IP filter; apply to deployments |
| Protect: Expires automatically | Yes | Never expires by default | API key expiration (Elasticsearch): Kibana API keys > Create API key; expiration field |
| Detect: Usage appears in logs | Yes | apikey.id | Where: Enable audit logging on the remote (fulfilling) cluster (Manage user settings > xpack.security.audit.enabled: true); filter apikey.id |
| Detect: Data reads appear in logs | Conditional | Elasticsearch audit log (access_granted is in the default include list once auditing is enabled); needs a qualifying subscription. Key identified by apikey.id. | Where: Remote cluster audit log: filter access_granted and apikey.id |
| Respond: Revocation ends active access | Yes | Invalidate via DELETE /_security/api_key on the remote cluster. | Invalidate via DELETE /_security/api_key on the remote cluster. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Role descriptors / access on API key** (Limit scope; all plans; default off). Restricts the key to given privileges and indices. Where: POST /_security/api_key role_descriptors; POST /_security/cross_cluster/api_key access.
- **API key expiration (Elasticsearch)** (Limit lifetime; all plans; default off). Optional expiry; none by default. Where: Kibana API keys > Create API key; expiration field.
- **IP filters (network security policies)** (Limit network; all plans; default off). Rejects deployment/project traffic from non-allowed IPs with 403. Where: Organization > Network security > IP filter; apply to deployments.
- **manage_security privilege (cross-cluster API key creation)** (Disable; Enterprise; default varies). Creating or updating a cross-cluster API key needs manage_security and an Enterprise license; users without it cannot create one. Where: Elasticsearch role cluster privileges.

- Network: supported (checked at api_request). Remote cluster filters (ECH) and xpack.security.remote_cluster.filter.* (self-managed); deployment IP filters.
- Lifetime: Never expires by default. Renewal: Replace key in local keystore to rotate.
- Keyless option: not_applicable. Cluster-to-cluster credential.
- Conditions: Enterprise license

## Detect: what gets logged
- Token prefix: not established

### Logs
- Elasticsearch audit log (remote cluster): Same gating as above.

### Fields that identify the credential
- `apikey.id` (Elasticsearch audit log): null

### Lifecycle events
- create: `create_apikey` Needs security_config_change
- revoke: `invalidate_apikeys` null

### Correlate on
`apikey.id`, `origin.address`

### API calls a holder can make, and whether they are logged
- collection: `GET /<index>/_search (cross-cluster search into the remote cluster)`. Documents in remote indices the key grants search access to Logged: plan (`access_granted`). Elasticsearch audit log (access_granted is in the default include list once auditing is enabled); needs a qualifying subscription. Key identified by apikey.id.

### What to look for (analyst guidance)
- Cross-cluster key with broad index patterns
- Unknown remote cluster connecting

## Respond: how to revoke it
- Admin: **Invalidate API keys**. Invalidated keys fail authentication; can target by owner, user or realm. Where: DELETE /_security/api_key; Kibana API keys > Delete.

Invalidate via DELETE /_security/api_key on the remote cluster. Live access ends on revocation: yes. null

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
- [Elasticsearch API (OpenAPI) - Create a cross-cluster API key](https://www.elastic.co/docs/api/doc/elasticsearch.json) (retrieved 2026-10-14)
- [Add remote clusters using API key authentication](https://www.elastic.co/docs/deploy-manage/remote-clusters/remote-clusters-api-key) (retrieved 2026-10-14)
- [Manage IP filters in ECH or Serverless](https://www.elastic.co/docs/deploy-manage/security/ip-filtering-cloud) (retrieved 2026-10-14)
- [Elasticsearch API keys](https://www.elastic.co/docs/deploy-manage/api-keys/elasticsearch-api-keys) (retrieved 2026-10-14)
- [Get API key information](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-security-get-api-key) (retrieved 2026-10-14)
- [Create a cross-cluster API key](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-security-create-cross-cluster-api-key) (retrieved 2026-10-14)
- [Role management using Kibana](https://www.elastic.co/docs/deploy-manage/users-roles/cluster-or-deployment-auth/kibana-role-management) (retrieved 2026-10-14)
- [Create or update roles](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-security-put-role) (retrieved 2026-10-14)
- [Enable audit logging](https://www.elastic.co/docs/deploy-manage/security/logging-configuration/enabling-audit-logs) (retrieved 2026-10-14)
- [Elasticsearch audit events](https://www.elastic.co/docs/reference/elasticsearch/elasticsearch-audit-events) (retrieved 2026-10-14)
- [Stack monitoring on ECH and ECE](https://www.elastic.co/docs/deploy-manage/monitor/stack-monitoring/ece-ech-stack-monitoring) (retrieved 2026-10-14)
- [Invalidate API keys](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-security-invalidate-api-key) (retrieved 2026-10-14)
- [Run a search](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-search) (retrieved 2026-10-14)
- [Enable audit logging](https://www.elastic.co/docs/deploy-manage/monitor/stack-audit-logging/enabling-audit-logs) (retrieved 2026-10-14)
- [Auditing security settings](https://www.elastic.co/docs/reference/elasticsearch/configuration-reference/auding-settings) (retrieved 2026-10-14)
- [Create an API key](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-security-create-api-key) (retrieved 2026-10-14)
