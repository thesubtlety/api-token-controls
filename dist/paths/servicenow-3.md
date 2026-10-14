# ServiceNow: API key

`servicenow-3` · API key / token · person or service. Basic username/password; API key/HMAC via plugin; OAuth bearer including code + PKCE, client credentials and Third-Party ID Token Flow.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | All > System Web Services > API Access Policies > REST API Key lists the instance's API keys. | All > System Web Services > API Access Policies > REST API Key lists the instance's API keys. |
| Protect: Admin can block or require approval | Yes | REST API access policy; api_service_admin role (API key / HMAC configuration) | REST API access policy: All > System Web Services > REST API Access Policies (map Inbound Authentication Profiles) · api_service_admin role (API key / HMAC configuration): User roles |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | REST API access policies can allow only selected authentication types and source IP ranges. | API access policy with adaptive authentication filter criteria (IP): REST API Access Policies + Adaptive Authentication filter criteria · Adaptive authentication policies: All > Adaptive Authentication > Authentication Policies / Filter Criteria · IP Address Access Control: All > System Security > IP Address Access Control (plugin com.snc.ipauthenticator) |
| Protect: Expires automatically | Partial | Optional expiry; blank = no expiry | REST API Key: Expiry, Active, Auth Scope: All > System Web Services > API Access Policies > REST API Key |
| Detect: Usage appears in logs | Yes | Token, User, Name | Transaction log (System Logs > Transactions): Records requests with Created by, URL, IP address, HTTP Response Code. Retention not stated in docs. · REST API Key records (API Access Policies > REST API Key): Key with User, Active, Expiry, Auth Scope. Plugin com.glide.tokenbased_auth. |
| Detect: Data reads appear in logs | Yes | Transaction Log [syslog_transaction]; Transaction Log [syslog_transaction] | Where: All > System Logs > Transactions; filter Created by = the integration user, then URL (e.g. the REST path called) |
| Respond: Revocation ends active access | No docs found | Each request presents the key, so deactivation should stop use; not confirmed in docs. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **REST API access policy** (Disable; all plans; default off). Per REST API (or globally), lists the inbound authentication profiles allowed, so unlisted credential types such as Basic are refused. Where: All > System Web Services > REST API Access Policies (map Inbound Authentication Profiles).
- **API access policy with adaptive authentication filter criteria (IP)** (Limit network; all plans; default off). An access policy can combine an allowed auth type with filter criteria such as an IP range; other auth types or IPs are denied. Where: REST API Access Policies + Adaptive Authentication filter criteria.
- **Adaptive authentication policies** (Limit network; all plans; default unknown). Allows or denies authentication by IP address, role or group, including for inbound REST API requests. Where: All > Adaptive Authentication > Authentication Policies / Filter Criteria.
- **IP Address Access Control** (Limit network; all plans; default off). Instance-wide allow/deny IP rules for inbound traffic regardless of credential type. Where: All > System Security > IP Address Access Control (plugin com.snc.ipauthenticator).
- **REST API Auth Scope** (Limit scope; all plans; default off). Once an API has an auth scope, only OAuth entities (or API keys) carrying that scope can call it; the useraccount scope bypasses this. Where: System Web Services > REST API Auth Scope; link scope to OAuth entity / REST API Key.
- **REST API Key: Expiry, Active, Auth Scope** (Limit lifetime; Plugin com.glide.tokenbased_auth; default off). Each API key can be deactivated, given an expiry (empty means never) and limited by auth scope. Where: All > System Web Services > API Access Policies > REST API Key.
- **API key / HMAC require a specific API access policy** (Limit resources; Plugin com.glide.tokenbased_auth; default off). Token-based auth works only on APIs where an access policy lists the API key or HMAC profile; it cannot be added to the global policy. Where: REST API Access Policies > add API Key / HMAC authentication profile.
- **api_service_admin role (API key / HMAC configuration)** (Disable; all plans; default on). Creating API keys and HMAC secrets requires the api_service_admin and adaptive_auth_policy_admin roles; users without them cannot create these credentials. Where: User roles.

- Network: conditional (checked at api_request). REST API access policies can allow only selected authentication types and source IP ranges.
- Lifetime: Optional expiry; blank = no expiry. Renewal: The same API key is reused until its optional expiry; a blank expiry means no expiration. Deactivate the key record to revoke.
- Keyless option: not_applicable. Inbound Third-Party ID Token Flow trusts external providers such as Entra or Okta, subject to configured trust.
- Conditions: Release/plugin dependent. API key/HMAC requires com.glide.tokenbased_auth and API-specific policy. Documentation reviewed is Brazil.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Transaction log (System Logs > Transactions): Records requests with Created by, URL, IP address, HTTP Response Code. Retention not stated in docs.
- REST API Key records (API Access Policies > REST API Key): Key with User, Active, Expiry, Auth Scope. Plugin com.glide.tokenbased_auth.

### Fields that identify the credential
- `Token` (REST API Key): Key value
- `User` (REST API Key): Account the key acts as
- `Name` (REST API Key): Key label

### Lifecycle events
No docs found.

### Correlate on
`Created by`, `IP address`, `URL`, `HTTP Response Code`, `Created`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/now/table/sys_user?sysparm_limit=1 (header x-sn-apikey: {key})`. Confirms the API key maps to a user and that user's read reach; identity behind the key Logged: yes (`Transaction Log [syslog_transaction]`). Request logged with Created by = associated user, URL, IP. API key auth requires API Key and HMAC Authentication plugin
- enumeration (bulk): `GET /api/now/table/sys_db_object (x-sn-apikey)`. Table/schema inventory accessible to the key's user Logged: yes (`Transaction Log [syslog_transaction]`). GET logged
- collection (bulk): `GET /api/now/table/{tableName}?sysparm_limit=10000 (x-sn-apikey)`. Bulk record data from readable tables Logged: yes (`Transaction Log [syslog_transaction]`). Each Table API GET logged; retention ~56 days default
- collection: `GET /api/now/stats/{tableName}?sysparm_count=true&sysparm_group_by={field}`. Aggregate counts/sums grouped by field; sizing data without pulling all rows Logged: yes (`Transaction Log [syslog_transaction]`). Aggregate GET logged as a transaction

### What to look for (analyst guidance)
- Keys with empty Expiry tied to admin users
- API key passed as query parameter (leaks into proxies and logs)
- Key's user making calls outside the scoped APIs
- New REST API Key created outside change process

### Sample query (ServiceNow list filter (UI field labels))
Find calls by an API key's user from unexpected IPs

```
System Logs > Transactions: Created by = svc.apikey ^ Created in Last 7 days ^ IP address NOT IN <known integration egress IPs>
```

## Respond: how to revoke it


Set the REST API Key Active to false or delete it; lock or deactivate the key's user; tighten REST API access policy. Live access ends on revocation: unknown. Each request presents the key, so deactivation should stop use; not confirmed in docs.

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- Stops working when user is removed
- Transaction log table/column names (only UI labels fetched)
- login/login.failed event names (only community sources)
- Transaction log retention
- REST API Key table name
- Whether key ID is logged per request
- Whether REST API Access Policies are enforced for a given key (affects which tables are reachable)
- Whether request bodies are stored in the transaction log
- Which authentication types the default Global REST API policy allows; the Brazil page names the Global Blocking Policy but does not list them.
- No documented ServiceNow switch to disable Basic authentication instance-wide other than access policies; absence not stated by ServiceNow.
- Whether adaptive authentication is active by default.
- Default of Enforce Token Restrictions on OIDC provider records (OAuth registry default is unselected).
- ServiceNow docs are SPA-rendered; quotes over ~125 characters were captured as exact fragments.

## Sources
- [OAuth Inbound - ServiceNow](https://www.servicenow.com/docs/r/platform-security/authentication/oauth-inbound.html) (retrieved 2026-10-09)
- [Create an endpoint for clients to access the instance](https://www.servicenow.com/docs/r/platform-security/authentication/t_CreateEndpointforExternalClients.html) (retrieved 2026-10-09)
- [Token-based authentication - ServiceNow](https://www.servicenow.com/docs/r/platform-security/authentication/token-based-auth-api.html) (retrieved 2026-10-09)
- [Configure API key - Token-based authentication](https://www.servicenow.com/docs/r/platform-security/authentication/configure-api-key.html) (retrieved 2026-10-09)
- [REST API access policies - ServiceNow](https://www.servicenow.com/docs/r/platform-security/authentication/inbound-authentication-profile.html) (retrieved 2026-10-09)
- [API access policy - ServiceNow](https://www.servicenow.com/docs/r/platform-security/authentication/api-access-policy.html) (retrieved 2026-10-09)
- [Transaction logs (Zurich)](https://www.servicenow.com/docs/r/zurich/platform-security/r_TransactionLogs.html) (retrieved 2026-10-14)
- [API Key and HMAC Authentication for inbound REST APIs](https://www.servicenow.com/docs/r/platform-security/authentication/api-key-and-hmac-rest-apis.html) (retrieved 2026-10-12)
- [Transaction logs](https://www.servicenow.com/docs/r/platform-security/r_TransactionLogs.html) (retrieved 2026-10-12)
- [Configure API key - Token-based authentication](https://docs.servicenow.com/bundle/xanadu-platform-security/page/integrate/authentication/task/configure-api-key.html) (retrieved 2026-10-12)
- [Table API | ServiceNow](https://www.servicenow.com/docs/r/api-reference/rest-apis/c_TableAPI.html) (retrieved 2026-10-12)
- [Aggregate API | ServiceNow](https://www.servicenow.com/docs/r/api-reference/rest-apis/c_AggregateAPI.html) (retrieved 2026-10-12)
- [Log history | ServiceNow](https://www.servicenow.com/docs/r/platform-security/r_LogHistory.html) (retrieved 2026-10-12)
- [Create API access policy (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/create-api-access-policy.html) (retrieved 2026-10-13)
- [Adaptive authentication (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/adaptive-authentication.html) (retrieved 2026-10-13)
- [IP address access control (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/t_AccessControl.html) (retrieved 2026-10-13)
- [REST API Auth Scope (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/rest-api-auth-scope.html) (retrieved 2026-10-13)
- [Configure HMAC - Token-based authentication](https://www.servicenow.com/docs/r/platform-security/authentication/configure-hmac.html) (retrieved 2026-10-09)
