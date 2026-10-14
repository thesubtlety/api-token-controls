# ServiceNow: Third-party ID token

`servicenow-2` · Federated identity · person or service. Basic username/password; API key/HMAC via plugin; OAuth bearer including code + PKCE, client credentials and Third-Party ID Token Flow.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | REST API access policy | REST API access policy: All > System Web Services > REST API Access Policies (map Inbound Authentication Profiles) |
| Protect: SSO and MFA rules apply | Yes | The credential is an ID token issued by the org's external OIDC IdP and accepted through the Multi-Provider SSO option. | Where: All > System OAuth > Application Registry > New > Configure an OIDC provider to verify ID tokens (User Claim / User Field map the token to a sys_user); MFA is enforced at the external IdP |
| Protect: IP restriction | Conditional | REST API access policies can allow only selected authentication types and source IP ranges. | API access policy with adaptive authentication filter criteria (IP): REST API Access Policies + Adaptive Authentication filter criteria · Adaptive authentication policies: All > Adaptive Authentication > Authentication Policies / Filter Criteria · IP Address Access Control: All > System Security > IP Address Access Control (plugin com.snc.ipauthenticator) |
| Protect: Expires automatically | Partial | External IdP token presented directly; lifetime set by the external IdP | Where: Lifetime is set in the external IdP; ServiceNow allows Clock Skew (default 300s) on the OIDC provider record under System OAuth > Application Registry |
| Detect: Usage appears in logs | Yes | Created by, Type | Transaction log (System Logs > Transactions): Records requests with Created by, URL, IP address, HTTP Response Code. Retention not stated in docs. · oauth_credential table: Tokens issued after the ID token is accepted. |
| Detect: Data reads appear in logs | Yes | Transaction Log [syslog_transaction] | Where: All > System Logs > Transactions; filter Created by = the integration user, then URL (e.g. the REST path called) |
| Respond: Revocation ends active access | No docs found | Upstream ID token revocation does not reach tokens ServiceNow already issued. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **REST API access policy** (Disable; all plans; default off). Per REST API (or globally), lists the inbound authentication profiles allowed, so unlisted credential types such as Basic are refused. Where: All > System Web Services > REST API Access Policies (map Inbound Authentication Profiles).
- **API access policy with adaptive authentication filter criteria (IP)** (Limit network; all plans; default off). An access policy can combine an allowed auth type with filter criteria such as an IP range; other auth types or IPs are denied. Where: REST API Access Policies + Adaptive Authentication filter criteria.
- **Adaptive authentication policies** (Limit network; all plans; default unknown). Allows or denies authentication by IP address, role or group, including for inbound REST API requests. Where: All > Adaptive Authentication > Authentication Policies / Filter Criteria.
- **IP Address Access Control** (Limit network; all plans; default off). Instance-wide allow/deny IP rules for inbound traffic regardless of credential type. Where: All > System Security > IP Address Access Control (plugin com.snc.ipauthenticator).
- **OIDC provider for third-party ID tokens (Active, audience, user claim, JTI)** (Limit scope; all plans; default off). Third-party ID tokens are accepted only via an active OIDC provider record that pins the audience, maps a user claim and can verify JTI. Where: All > System OAuth > Application Registry > New > Configure an OIDC provider to verify ID tokens (or Machine Identity Console > Inbound integrations).
- **Enforce Token Restrictions (OIDC provider)** (Limit scope; all plans; default unknown). Third-party ID tokens work only on APIs whose access policy enables the ID token authentication profile. Where: OIDC provider record > Enforce Token Restrictions.

- Network: conditional (checked at api_request). REST API access policies can allow only selected authentication types and source IP ranges.
- Lifetime: External IdP token presented directly; lifetime set by the external IdP. Renewal: The client gets a fresh token from the external IdP; renewal follows the IdP's token and session policy.
- Keyless option: supported. Inbound Third-Party ID Token Flow trusts external providers such as Entra or Okta, subject to configured trust.
- Conditions: Release/plugin dependent. API key/HMAC requires com.glide.tokenbased_auth and API-specific policy. Documentation reviewed is Brazil.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Transaction log (System Logs > Transactions): Records requests with Created by, URL, IP address, HTTP Response Code. Retention not stated in docs.
- oauth_credential table: Tokens issued after the ID token is accepted.

### Fields that identify the credential
- `Created by` (Transaction log): Mapped ServiceNow user
- `Type` (oauth_credential): Access/Refresh

### Lifecycle events
No docs found.

### Correlate on
`Created by`, `IP address`, `URL`, `HTTP Response Code`, `Created`

### API calls a holder can make, and whether they are logged
- recon: `POST /oauth_token.do (external OIDC provider ID token) -> REST call with mapped session`. Validates a third-party OIDC ID token (aud=client_id) and maps it to a ServiceNow user for inbound API access Logged: yes (`Transaction Log [syslog_transaction]`). The resulting authenticated inbound request is logged as a transaction (Created by = mapped user, URL, IP)
- recon: `GET /api/now/table/sys_user?sysparm_query=user_name={mapped}&sysparm_limit=1`. The mapped user's own record and role summary; confirms identity mapped from the ID token Logged: yes (`Transaction Log [syslog_transaction]`). Logged as REST transaction with mapped user
- enumeration (bulk): `GET /api/now/table/sys_db_object`. Table inventory for the mapped user's permissions Logged: yes (`Transaction Log [syslog_transaction]`). GET logged with URL and user
- collection (bulk): `GET /api/now/table/{tableName}?sysparm_limit=10000&sysparm_offset=N`. Bulk record data from readable tables; offset paging Logged: yes (`Transaction Log [syslog_transaction]`). Each Table API GET logged; retention ~56 days default

### What to look for (analyst guidance)
- Requests mapped to users who have no activity at the external IdP
- Auto-provisioned sys_user records appearing right after ID token use
- Calls from IPs outside the calling app's hosts

### Sample query (ServiceNow list filter (UI field labels))
Review API activity of a user mapped from an external ID token

```
System Logs > Transactions: Created by = idp.mapped.user ^ Created in Last 7 days ^ IP address NOT IN <known integration egress IPs>
```

## Respond: how to revoke it


Disable the OIDC provider / third-party ID token integration; revoke issued tokens in Manage Tokens or via oauth_revoke_token.do; revoke the upstream IdP session. Live access ends on revocation: unknown. Upstream ID token revocation does not reach tokens ServiceNow already issued.

## No vendor documentation found
- Admin can list all of them
- Revocation ends active access
- Stops working when user is removed
- Transaction log table/column names (only UI labels fetched)
- login/login.failed event names (only community sources)
- Transaction log retention
- Log record identifying the external issuer/subject used
- Third-party ID token configuration fields (doc fetch returned no detail)
- Whether the ID-token validation itself emits a distinct audit record separate from the request transaction
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
- [Configure an OAuth OIDC provider for accepting third-party token (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/add-OIDC-entity.html) (retrieved 2026-10-13)
- [Configure an OAuth OIDC provider for accepting third-party token (Zurich)](https://www.servicenow.com/docs/r/zurich/platform-security/authentication/add-OIDC-entity.html) (retrieved 2026-10-14)
- [Transaction logs (Zurich)](https://www.servicenow.com/docs/r/zurich/platform-security/r_TransactionLogs.html) (retrieved 2026-10-14)
- [Transaction logs](https://www.servicenow.com/docs/r/platform-security/r_TransactionLogs.html) (retrieved 2026-10-12)
- [Manage OAuth tokens](https://www.servicenow.com/docs/r/8yND1KuvF7tjP~F577YThQ/tRbtHD1JlT~rcClYeZ2viA) (retrieved 2026-10-12)
- [Revoke an OAuth token](https://www.servicenow.com/docs/r/8yND1KuvF7tjP~F577YThQ/hMCUQrOe2CEAjaIJdG03MA) (retrieved 2026-10-12)
- [Configure an OAuth OIDC provider for accepting third-party token](https://www.servicenow.com/docs/r/oL66E_cwDD_tnWQYzYPRdA/oiWU7k64PbKeLQDEtCKTVw) (retrieved 2026-10-12)
- [Table API | ServiceNow](https://www.servicenow.com/docs/r/api-reference/rest-apis/c_TableAPI.html) (retrieved 2026-10-12)
- [Log history | ServiceNow](https://www.servicenow.com/docs/r/platform-security/r_LogHistory.html) (retrieved 2026-10-12)
- [Create API access policy (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/create-api-access-policy.html) (retrieved 2026-10-13)
- [Adaptive authentication (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/adaptive-authentication.html) (retrieved 2026-10-13)
- [IP address access control (Brazil)](https://www.servicenow.com/docs/r/platform-security/authentication/t_AccessControl.html) (retrieved 2026-10-13)
