# ServiceNow: OAuth

`servicenow-1` · OAuth · person or service. Basic username/password; API key/HMAC via plugin; OAuth bearer including code + PKCE, client credentials and Third-Party ID Token Flow.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | System OAuth > Manage Tokens (oauth_credential table) shows all tokens; admin-only module. | System OAuth > Manage Tokens (oauth_credential table) shows all tokens; admin-only module. |
| Protect: Admin can block or require approval | Yes | REST API access policy; OAuth application registry Active; glide.oauth.inbound.client.credential.grant_type.enabled | REST API access policy: All > System Web Services > REST API Access Policies (map Inbound Authentication Profiles) · OAuth application registry Active: All > System OAuth > Application Registry > [client] > Active · glide.oauth.inbound.client.credential.grant_type.enabled: sys_properties.list > New property glide.oauth.inbound.client.credential.grant_type.enabled |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | REST API access policies can allow only selected authentication types and source IP ranges. | API access policy with adaptive authentication filter criteria (IP): REST API Access Policies + Adaptive Authentication filter criteria · Adaptive authentication policies: All > Adaptive Authentication > Authentication Policies / Filter Criteria · IP Address Access Control: All > System Security > IP Address Access Control (plugin com.snc.ipauthenticator) |
| Protect: Expires automatically | Yes | Default 30 min; configurable | Access / Refresh Token Lifespan: All > System OAuth > Application Registry > [client] > Access Token Lifespan / Refresh Token Lifespan |
| Detect: Usage appears in logs | Yes | Type, Expires, Created by | Transaction log (System Logs > Transactions): Records requests with Created by, URL, IP address, HTTP Response Code. Retention not stated in docs. · oauth_credential table (System OAuth > Manage Tokens): Issued access/refresh tokens with Type and Expires; admins can Revoke Access. |
| Detect: Data reads appear in logs | Yes | Transaction Log [syslog_transaction]; Transaction Log [syslog_transaction] | Where: All > System Logs > Transactions; filter Created by = the integration user, then URL (e.g. the REST path called) |
| Respond: Revocation ends active access | Partial | oauth_revoke_token.do or Manage Tokens > Revoke Access marks the given token expired. Docs do not say that revoking a refresh token also expires access tokens already issued from it (default 30-minute life). | Where: System OAuth > Manage Tokens > (token Name) > Revoke Access · API: https://<instance>/oauth_revoke_token.do?token=<access or refresh token> |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **REST API access policy** (Disable; all plans; default off). Per REST API (or globally), lists the inbound authentication profiles allowed, so unlisted credential types such as Basic are refused. Where: All > System Web Services > REST API Access Policies (map Inbound Authentication Profiles).
- **API access policy with adaptive authentication filter criteria (IP)** (Limit network; all plans; default off). An access policy can combine an allowed auth type with filter criteria such as an IP range; other auth types or IPs are denied. Where: REST API Access Policies + Adaptive Authentication filter criteria.
- **Adaptive authentication policies** (Limit network; all plans; default unknown). Allows or denies authentication by IP address, role or group, including for inbound REST API requests. Where: All > Adaptive Authentication > Authentication Policies / Filter Criteria.
- **IP Address Access Control** (Limit network; all plans; default off). Instance-wide allow/deny IP rules for inbound traffic regardless of credential type. Where: All > System Security > IP Address Access Control (plugin com.snc.ipauthenticator).
- **Enforce Token Restrictions (OAuth application registry)** (Limit scope; all plans; default unknown). Tokens from this OAuth client work only on APIs whose access policy allows its authentication profile; otherwise they reach any API the user's ACLs allow. Where: All > System OAuth > Application Registry > [client] > Enforce Token Restrictions.
- **REST API Auth Scope** (Limit scope; all plans; default off). Once an API has an auth scope, only OAuth entities (or API keys) carrying that scope can call it; the useraccount scope bypasses this. Where: System Web Services > REST API Auth Scope; link scope to OAuth entity / REST API Key.
- **Access / Refresh Token Lifespan** (Limit lifetime; all plans; default varies). Sets per-client access token (default 1800 s) and refresh token (default 100 days) lifetimes. Where: All > System OAuth > Application Registry > [client] > Access Token Lifespan / Refresh Token Lifespan.
- **OAuth application registry Active** (Disable; all plans; default on). Deactivating the registry entry stops the OAuth client. Where: All > System OAuth > Application Registry > [client] > Active.
- **glide.oauth.inbound.client.credential.grant_type.enabled** (Disable; all plans; default off). Inbound OAuth client credentials grant is only available after an admin creates this property and sets it to true. Where: sys_properties.list > New property glide.oauth.inbound.client.credential.grant_type.enabled.

- Network: supported (checked at api_request). REST API access policies can allow only selected authentication types and source IP ranges.
- Lifetime: Default 30 min; configurable. Renewal: OAuth refresh tokens default to 100 days (8,640,000 s), set per application registry entry.
- Keyless option: not_verified. Inbound Third-Party ID Token Flow trusts external providers such as Entra or Okta, subject to configured trust.
- Conditions: Release/plugin dependent. API key/HMAC requires com.glide.tokenbased_auth and API-specific policy. Documentation reviewed is Brazil.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Transaction log (System Logs > Transactions): Records requests with Created by, URL, IP address, HTTP Response Code. Retention not stated in docs.
- oauth_credential table (System OAuth > Manage Tokens): Issued access/refresh tokens with Type and Expires; admins can Revoke Access.

### Fields that identify the credential
- `Type` (oauth_credential): Access Token or Refresh Token
- `Expires` (oauth_credential): Expiry time
- `Created by` (Transaction log): User the token acts as

### Lifecycle events
No docs found.

### Correlate on
`Created by`, `IP address`, `URL`, `HTTP Response Code`, `Created`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/now/table/sys_user?sysparm_query=user_name={me}&sysparm_limit=1`. The authenticating/integration user's own record (user_name, email, roles summary); whose context the OAuth token runs as Logged: yes (`Transaction Log [syslog_transaction]`). Transaction log records each request (Created by, URL, IP address, Type incl. REST, HTTP Response Code). Default rotation: weekly, 8 rotations (~56 days)
- enumeration (bulk): `GET /api/now/table/sys_db_object  (or sys_dictionary)`. List of tables/schema in the instance; targeting map for data pull Logged: yes (`Transaction Log [syslog_transaction]`). GET requests appear in transaction log with URL and user
- collection (bulk): `GET /api/now/table/{tableName}?sysparm_limit=10000&sysparm_offset=N`. Bulk record data from any table the user can read (e.g. incident, sys_user); paginates via offset/Link header Logged: yes (`Transaction Log [syslog_transaction]`). Each Table API GET logged as a REST transaction (URL, Output length, Created by, IP). Retention ~56 days default (weekly x8)
- collection: `GET /api/now/attachment/{sys_id}/file`. Binary file content of attachments; data exfiltration beyond field values Logged: yes (`Transaction Log [syslog_transaction]`). Attachment download request logged as a transaction

### What to look for (analyst guidance)
- Spike in oauth_credential rows for one OAuth client
- REST transactions by an integration user from a new IP address
- Large Table API reads (URL with high sysparm_limit) by OAuth users
- Refresh tokens with very long Expires for broad clients

### Sample query (ServiceNow list filter (UI field labels))
Find integration-user REST calls from unexpected IPs

```
System Logs > Transactions: Created by = integration.user ^ Created in Last 7 days ^ IP address NOT IN <known integration egress IPs>
```

## Respond: how to revoke it


Revoke Access on the token record in Manage Tokens, or call oauth_revoke_token.do with the token; deactivate the OAuth application registry entry; lock the user. Live access ends on revocation: partial. oauth_revoke_token.do or Manage Tokens > Revoke Access marks the given token expired. Docs do not say that revoking a refresh token also expires access tokens already issued from it (default 30-minute life).

## No vendor documentation found
- SSO and MFA rules apply
- Stops working when user is removed
- Transaction log table/column names (only UI labels fetched)
- login/login.failed event names (only community sources)
- Transaction log retention
- oauth_credential column names for user and client
- Default token lifetimes (page fetched only in German)
- Whether syslog_transaction records request/response bodies (docs do not confirm)
- Whether REST transactions are retained the full 56 days on every instance (rotation configurable)
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
- [Manage OAuth tokens (Australia)](https://www.servicenow.com/docs/r/platform-security/authentication/t_ManageTokens.html) (retrieved 2026-10-14)
- [Transaction logs (Zurich)](https://www.servicenow.com/docs/r/zurich/platform-security/r_TransactionLogs.html) (retrieved 2026-10-14)
- [Manage OAuth tokens (Zurich)](https://www.servicenow.com/docs/r/zurich/platform-security/authentication/t_ManageTokens.html) (retrieved 2026-10-14)
- [Revoke an OAuth token (Zurich)](https://www.servicenow.com/docs/r/zurich/platform-security/authentication/t_RevokeOAuthToken.html) (retrieved 2026-10-14)
- [Transaction logs](https://www.servicenow.com/docs/r/platform-security/r_TransactionLogs.html) (retrieved 2026-10-12)
- [Manage OAuth tokens](https://www.servicenow.com/docs/r/8yND1KuvF7tjP~F577YThQ/tRbtHD1JlT~rcClYeZ2viA) (retrieved 2026-10-12)
- [Revoke an OAuth token](https://www.servicenow.com/docs/r/8yND1KuvF7tjP~F577YThQ/hMCUQrOe2CEAjaIJdG03MA) (retrieved 2026-10-12)
- [Revoke an OAuth token (Australia)](https://www.servicenow.com/docs/r/platform-security/authentication/t_RevokeOAuthToken.html) (retrieved 2026-10-14)
- [Table API | ServiceNow](https://www.servicenow.com/docs/r/api-reference/rest-apis/c_TableAPI.html) (retrieved 2026-10-12)
- [Log history | ServiceNow](https://www.servicenow.com/docs/r/platform-security/r_LogHistory.html) (retrieved 2026-10-12)
- [Attachment API | ServiceNow](https://www.servicenow.com/docs/r/api-reference/rest-apis/c_AttachmentAPI.html) (retrieved 2026-10-12)
- [Create API access policy (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/create-api-access-policy.html) (retrieved 2026-10-13)
- [Adaptive authentication (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/adaptive-authentication.html) (retrieved 2026-10-13)
- [IP address access control (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/t_AccessControl.html) (retrieved 2026-10-13)
- [REST API Auth Scope (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/rest-api-auth-scope.html) (retrieved 2026-10-13)
- [Create the Client Credentials system property (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/create-cc-sys-prop.html) (retrieved 2026-10-13)
