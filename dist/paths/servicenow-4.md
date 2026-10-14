# ServiceNow: Basic credentials

`servicenow-4` · Basic credentials · person. Basic username/password; API key/HMAC via plugin; OAuth bearer including code + PKCE, client credentials and Third-Party ID Token Flow.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | REST API access policy | REST API access policy: All > System Web Services > REST API Access Policies (map Inbound Authentication Profiles) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | REST API access policies can allow only selected authentication types and source IP ranges. | API access policy with adaptive authentication filter criteria (IP): REST API Access Policies + Adaptive Authentication filter criteria · Adaptive authentication policies: All > Adaptive Authentication > Authentication Policies / Filter Criteria · IP Address Access Control: All > System Security > IP Address Access Control (plugin com.snc.ipauthenticator) |
| Protect: Expires automatically | Not available | Until password change/account disablement |  |
| Detect: Usage appears in logs | Yes | Created by | Transaction log (System Logs > Transactions): Records requests with Created by, URL, IP address, HTTP Response Code. Retention not stated in docs. |
| Detect: Data reads appear in logs | Yes | Transaction Log [syslog_transaction] | Where: All > System Logs > Transactions; filter Created by = the integration user, then URL (e.g. the REST path called) |
| Respond: Revocation ends active access | No docs found | Existing sessions may persist; session termination not covered in fetched docs. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **REST API access policy** (Disable; all plans; default off). Per REST API (or globally), lists the inbound authentication profiles allowed, so unlisted credential types such as Basic are refused. Where: All > System Web Services > REST API Access Policies (map Inbound Authentication Profiles).
- **API access policy with adaptive authentication filter criteria (IP)** (Limit network; all plans; default off). An access policy can combine an allowed auth type with filter criteria such as an IP range; other auth types or IPs are denied. Where: REST API Access Policies + Adaptive Authentication filter criteria.
- **Adaptive authentication policies** (Limit network; all plans; default unknown). Allows or denies authentication by IP address, role or group, including for inbound REST API requests. Where: All > Adaptive Authentication > Authentication Policies / Filter Criteria.
- **IP Address Access Control** (Limit network; all plans; default off). Instance-wide allow/deny IP rules for inbound traffic regardless of credential type. Where: All > System Security > IP Address Access Control (plugin com.snc.ipauthenticator).

- Network: supported (checked at api_request). REST API access policies can allow only selected authentication types and source IP ranges.
- Lifetime: Until password change/account disablement. Renewal: The same username and password are reused on each request. Access ends when the password changes or the account is disabled.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: Release/plugin dependent. API key/HMAC requires com.glide.tokenbased_auth and API-specific policy. Documentation reviewed is Brazil.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Transaction log (System Logs > Transactions): Records requests with Created by, URL, IP address, HTTP Response Code. Retention not stated in docs.

### Fields that identify the credential
- `Created by` (Transaction log): Authenticated username

### Lifecycle events
No docs found.

### Correlate on
`Created by`, `IP address`, `URL`, `HTTP Response Code`, `Created`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/now/table/sys_user?sysparm_query=user_name={me}&sysparm_limit=1 (Authorization: Basic)`. The basic-auth user's own record and role summary; identity and reach Logged: yes (`Transaction Log [syslog_transaction]`). Request logged with Created by, URL, IP, HTTP Response Code
- collection (bulk): `GET /api/now/table/{tableName}?sysparm_limit=10000&sysparm_offset=N`. Bulk record data from readable tables (e.g. incident, cmdb_ci) Logged: yes (`Transaction Log [syslog_transaction]`). Each Table API GET logged; retention ~56 days default

### What to look for (analyst guidance)
- Basic-auth API calls from an interactive user account
- Password spraying: many failed requests across users from one IP address
- Successful REST call from a new IP after failures
- Service account used from a browser

### Sample query (ServiceNow list filter (UI field labels))
Find Basic-auth service account calls from unexpected IPs

```
System Logs > Transactions: Created by = svc.basic ^ Created in Last 7 days ^ IP address NOT IN <known integration egress IPs>
```

## Respond: how to revoke it


Reset the password; lock or deactivate the user; restrict account to web service access or move it to OAuth/API key with access policy. Live access ends on revocation: unknown. Existing sessions may persist; session termination not covered in fetched docs.

## No vendor documentation found
- Admin can list all of them
- SSO and MFA rules apply
- Revocation ends active access
- Stops working when user is removed
- Transaction log table/column names (only UI labels fetched)
- login/login.failed event names (only community sources)
- Transaction log retention
- Failed login event and its fields
- Field marking auth method per request
- sys_user_has_role is a community/third-party source, not ServiceNow official docs
- Whether request bodies are stored
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
- [Transaction logs](https://www.servicenow.com/docs/r/platform-security/r_TransactionLogs.html) (retrieved 2026-10-12)
- [Table API | ServiceNow](https://www.servicenow.com/docs/r/api-reference/rest-apis/c_TableAPI.html) (retrieved 2026-10-12)
- [Log history | ServiceNow](https://www.servicenow.com/docs/r/platform-security/r_LogHistory.html) (retrieved 2026-10-12)
- [Create API access policy (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/create-api-access-policy.html) (retrieved 2026-10-13)
- [Adaptive authentication (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/adaptive-authentication.html) (retrieved 2026-10-13)
- [IP address access control (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/t_AccessControl.html) (retrieved 2026-10-13)
