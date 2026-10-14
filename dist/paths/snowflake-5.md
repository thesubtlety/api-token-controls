# Snowflake: External OAuth

`snowflake-5` · OAuth · person or service. An external authorization server (Okta, Microsoft Entra ID, PingFederate or a custom server) issues the access token, and the client presents it to Snowflake. Snowflake validates it against the External OAuth security integration (issuer, keys, audience) and maps a token claim to a Snowflake user.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Authentication policy AUTHENTICATION_METHODS; External OAuth integration ENABLED | Command: SQL: ALTER SECURITY INTEGRATION <name> SET ENABLED = FALSE; or AUTHENTICATION_METHODS without 'OAUTH' + ALTER ACCOUNT/USER <name> SET AUTHENTICATION POLICY <policy> |
| Protect: SSO and MFA rules apply | Yes | Tokens come from the customer's authorization server, so its MFA, subnet and approval policies apply when the token is issued. | Where: IdP side (Okta example): Admin Console > Security > API > Authorization Servers > (server) > Access Policies · Command: SQL: token tied to user via EXTERNAL_OAUTH_ISSUER and EXTERNAL_OAUTH_TOKEN_USER_MAPPING_CLAIM on the integration |
| Protect: IP restriction | Conditional | Network policy on the External OAuth integration overrides user and account policies; logged-in sessions from blocked origins cannot run further queries. Older Entra ID and Okta setup pages still say integration-level policies are not supported and to use account-level policies, so verify in the tenant. | Command: SQL: ALTER SECURITY INTEGRATION <name> SET NETWORK_POLICY = '<np>' |
| Protect: Expires automatically | Partial | Set by the external authorization server; Snowflake rejects tokens past exp | Where: Okta: Security > API > Authorization Servers > (server) > Access Policies > Add Rule > 'Access token lifetime is' |
| Detect: Usage appears in logs | Yes | AUTHORIZING_INTEGRATION_NAME, EXTERNAL_OAUTH_TOKEN_USER_MAPPING_CLAIM | Command: SQL: SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY WHERE authorizing_integration_name = '<INTEGRATION>' |
| Detect: Data reads appear in logs | Yes | QUERY_HISTORY view; LOGIN_HISTORY.authorizing_integration_name names the integration | Command: SQL: SELECT ... FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY ah JOIN QUERY_HISTORY qh USING (query_id) JOIN LOGIN_HISTORY lh ON qh.authn_event_id = lh.event_id WHERE lh.authorizing_integration_name = '<INTEGRATION>' |
| Respond: Revocation ends active access | No docs found | Snowflake validates IdP tokens locally; docs do not describe revoking an IdP-issued token in Snowflake, so issued tokens may stay usable until expiry unless the user or integration is disabled. |  |
| Respond: Stops working when user is removed | Yes | The token maps to a Snowflake user. Disabling that user, which SCIM deactivation does, blocks logins and aborts the user's queries. Disabling the user in the IdP also stops new tokens. | Where: Snowsight > Governance & security > Users & roles > (user) ... > Disable User · API: PATCH /scim/v2/Users/{id} with {"op":"replace","value":{"active":false}} · Command: ALTER USER <name> SET DISABLED = TRUE |

## Protect: what an admin can configure

### Admin controls
- **Authentication policy AUTHENTICATION_METHODS** (Disable; not stated; default off). Allow-list of auth methods; omitting PROGRAMMATIC_ACCESS_TOKEN, KEYPAIR, WORKLOAD_IDENTITY or OAUTH blocks that method for the account or user. Where: CREATE/ALTER AUTHENTICATION POLICY ... AUTHENTICATION_METHODS; ALTER ACCOUNT/USER SET AUTHENTICATION POLICY.
- **Authentication policy SECURITY_INTEGRATIONS** (Limit resources; not stated; default off). Limits which SAML/OIDC/External OAuth security integrations can be used. Where: CREATE/ALTER AUTHENTICATION POLICY ... SECURITY_INTEGRATIONS.
- **Network policies (account / user / security integration)** (Limit network; all plans; default off). Restrict inbound access by IP or private endpoint; integration-level policy overrides user and account policies. Where: CREATE NETWORK POLICY; ALTER ACCOUNT/USER/SECURITY INTEGRATION SET NETWORK_POLICY.
- **External OAuth integration ENABLED** (Disable; all plans; default on). Suspends an External OAuth integration. Where: ALTER SECURITY INTEGRATION ... SET ENABLED = FALSE.
- **EXTERNAL_OAUTH_ANY_ROLE_MODE** (Limit scope; all plans; default on). When DISABLE (default), clients cannot switch to roles beyond those in the token. Where: Security integration parameter.
- **EXTERNAL_OAUTH_ISSUER / EXTERNAL_OAUTH_AUDIENCE_LIST** (Limit resources; all plans; default on). Only tokens from the configured issuer and audience values are accepted. Where: Security integration parameters.

- Network: conditional (checked at api_request). Network policy on the External OAuth integration overrides user and account policies; logged-in sessions from blocked origins cannot run further queries. Older Entra ID and Okta setup pages still say integration-level policies are not supported and to use account-level policies, so verify in the tenant.
- Lifetime: Set by the external authorization server; Snowflake rejects tokens past exp. Renewal: The client gets a new access token from the external authorization server (for example with that server's refresh token or client credentials); Snowflake issues no refresh token for this path.
- Keyless option: supported. Snowflake accepts tokens issued by the customer's own OAuth server. Trust is set per integration by issuer, signing keys (JWKS URL or RSA public key) and audience.
- Conditions: Token lifetime, refresh and client grant types are controlled in the external IdP, not Snowflake. Some setup pages conflict with the network-policy page on integration-level policies.

## Detect: what gets logged
- Token prefix: not established

### Logs
- SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY: Successful and failed logins, 365 days, up to 2h latency. INFORMATION_SCHEMA LOGIN_HISTORY table functions cover 7 days. External OAuth logins also record FIRST_AUTHENTICATION_FACTOR = OAUTH_ACCESS_TOKEN; AUTHORIZING_INTEGRATION_NAME names the integration.
- SNOWFLAKE.ACCOUNT_USAGE.SESSIONS: One row per session, 1 year, up to 3h latency; links to login via LOGIN_EVENT_ID. Does not track SQL API transient sessions.
- SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY: Queries per SESSION_ID with AUTHN_EVENT_ID, 365 days, up to 45 min latency.
- IdP token/sign-in logs (e.g. Okta System Log, Entra sign-in logs): Token issuance and revocation happen at the IdP.

### Fields that identify the credential
- `AUTHORIZING_INTEGRATION_NAME` (LOGIN_HISTORY): External OAuth security integration that accepted the token.
- `EXTERNAL_OAUTH_TOKEN_USER_MAPPING_CLAIM` (Security integration config): Claim used to map token to a Snowflake user.

### Lifecycle events
- use: `OAUTH_ACCESS_TOKEN` FIRST_AUTHENTICATION_FACTOR value for OAuth logins.
- auth_fail: `OAUTH_ACCESS_TOKEN_EXPIRED` Error 390318.
- auth_fail: `JWT_TOKEN_INVALID` Error 390144.
- revoke: `ALTER SECURITY INTEGRATION … SET ENABLED = FALSE` Suspends the integration.

### Correlate on
`USER_NAME`, `CLIENT_IP`, `REPORTED_CLIENT_TYPE`, `REPORTED_CLIENT_VERSION`, `EVENT_ID`, `LOGIN_EVENT_ID`, `SESSION_ID`, `AUTHN_EVENT_ID`, `CLIENT_APPLICATION_ID`, `AUTHORIZING_INTEGRATION_NAME`, `ROLE_NAME`

### API calls a holder can make, and whether they are logged
- collection: `POST /api/v2/statements (SELECT)`. Any table data the mapped role can read Logged: yes (`QUERY_HISTORY view; LOGIN_HISTORY.authorizing_integration_name names the integration`). QUERY_HISTORY keeps 365 days. ACCESS_HISTORY needs Enterprise Edition.

### What to look for (analyst guidance)
- External OAuth login with no matching token issuance in the IdP log for that user/time
- Session ROLE_NAME privileged after EXTERNAL_OAUTH_ADD_PRIVILEGED_ROLES_TO_BLOCKED_LIST set to FALSE
- Changes to EXTERNAL_OAUTH_ISSUER, audience, JWS keys URL or user-mapping claim on the integration
- session:role-any (EXTERNAL_OAUTH_ANY_ROLE_MODE) enabled unexpectedly
- Logins continuing after the user was disabled at the IdP (token still within lifetime)

### Sample query (Snowflake SQL (ACCOUNT_USAGE))
Trace queries run through External OAuth sessions from a suspicious IP.

```
SELECT s.session_id, s.user_name, l.client_ip, l.authorizing_integration_name, q.role_name, q.query_text FROM SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY l JOIN SNOWFLAKE.ACCOUNT_USAGE.SESSIONS s ON s.login_event_id = l.event_id JOIN SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY q ON q.session_id = s.session_id WHERE l.first_authentication_factor = 'OAUTH_ACCESS_TOKEN' AND l.authorizing_integration_name = 'OKTA_EXT_OAUTH' AND l.client_ip = '203.0.113.24';
```

## Respond: how to revoke it


Revoke tokens/sessions and disable the user at the IdP; ALTER SECURITY INTEGRATION <int> SET ENABLED = FALSE for issuer compromise; ALTER USER <u> SET DISABLED = TRUE to abort running queries and block login. Live access ends on revocation: unknown. Snowflake validates IdP tokens locally; docs do not describe revoking an IdP-issued token in Snowflake, so issued tokens may stay usable until expiry unless the user or integration is disabled.

## No vendor documentation found
- Admin can list all of them
- Revocation ends active access
- Effect of disabling the integration on open sessions
- Logging of token claims (iss/sub) in Snowflake
- SESSIONS.AUTHENTICATION_METHOD value for External OAuth
- Edition requirements for authentication policies are not stated on the reference pages.
- Whether Snowflake OAuth (as opposed to External OAuth) can be disallowed via AUTHENTICATION_METHODS; the OAUTH value is documented as 'Allows External OAuth'.
- No account-wide policy found to force named key pairs or cap key-pair lifetime; legacy RSA_PUBLIC_KEY keys never expire.
- Docs differ on how to unblock privileged roles for custom OAuth clients (account parameter vs Snowflake Support).
- Whether the WIF quote 'disable it' covers the DEFAULT identity (docs say DEFAULT must use SET/UNSET WORKLOAD_IDENTITY).

## Sources
- [CREATE SECURITY INTEGRATION (External OAuth) | Snowflake Documentation](https://docs.snowflake.com/en/sql-reference/sql/create-security-integration-oauth-external) (retrieved 2026-10-12)
- [External OAuth overview | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/oauth-ext-overview) (retrieved 2026-10-12)
- [Controlling network traffic with network policies | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/network-policies) (retrieved 2026-10-12)
- [Configure Microsoft Entra ID for External OAuth | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/oauth-azure) (retrieved 2026-10-12)
- [Configure a custom client for External OAuth | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/oauth-ext-custom) (retrieved 2026-10-12)
- [Configure Okta for External OAuth | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/oauth-okta) (retrieved 2026-10-12)
- [CREATE AUTHENTICATION POLICY | Snowflake Documentation](https://docs.snowflake.com/en/sql-reference/sql/create-authentication-policy) (retrieved 2026-10-12)
- [Okta SCIM integration](https://docs.snowflake.com/en/user-guide/scim-okta) (retrieved 2026-10-14)
- [ALTER USER](https://docs.snowflake.com/en/sql-reference/sql/alter-user) (retrieved 2026-10-12)
- [ALTER SECURITY INTEGRATION (External OAuth)](https://docs.snowflake.com/en/sql-reference/sql/alter-security-integration-oauth-external) (retrieved 2026-10-12)
- [Authentication policies - Snowflake Documentation](https://docs.snowflake.com/en/user-guide/authentication-policies) (retrieved 2026-10-09)
- [Okta: Configure an access policy](https://developer.okta.com/docs/guides/configure-access-policy/main/) (retrieved 2026-10-14)
- [LOGIN_HISTORY view](https://docs.snowflake.com/en/sql-reference/account-usage/login_history) (retrieved 2026-10-12)
- [ACCESS_HISTORY view](https://docs.snowflake.com/en/sql-reference/account-usage/access_history) (retrieved 2026-10-14)
- [QUERY_HISTORY view](https://docs.snowflake.com/en/sql-reference/account-usage/query_history) (retrieved 2026-10-12)
- [User management](https://docs.snowflake.com/en/user-guide/admin-user-management) (retrieved 2026-10-14)
- [SCIM user API reference](https://docs.snowflake.com/en/user-guide/scim-user-api-reference) (retrieved 2026-10-14)
- [Introduction to OAuth](https://docs.snowflake.com/en/user-guide/oauth) (retrieved 2026-10-12)
- [SESSIONS view](https://docs.snowflake.com/en/sql-reference/account-usage/sessions) (retrieved 2026-10-12)
- [Submitting a request to execute SQL statements](https://docs.snowflake.com/en/developer-guide/sql-api/submitting-requests) (retrieved 2026-10-14)
- [Authenticating to the server (SQL API) - Snowflake Documentation](https://docs.snowflake.com/en/developer-guide/sql-api/authenticating) (retrieved 2026-10-09)
- [Access History](https://docs.snowflake.com/en/user-guide/access-history) (retrieved 2026-10-14)
