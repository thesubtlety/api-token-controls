# Snowflake: Snowflake OAuth

`snowflake-2` · OAuth · person or service. OAuth 2.0 with Snowflake as the authorization server. A partner or custom client sends the user through Snowflake sign-in and consent, then presents the short-lived Snowflake access token; refresh tokens are optional.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Snowflake OAuth integration ENABLED | Command: SQL: ALTER SECURITY INTEGRATION <name> SET ENABLED = FALSE |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | A network policy on the Snowflake OAuth integration covers code exchange, refresh token use and access token use, and overrides user and account policies. User-level policies are not checked on token requests (except the built-in local-application integration). | Command: SQL: ALTER SECURITY INTEGRATION <name> SET NETWORK_POLICY = '<np>' |
| Protect: Expires automatically | Partial | Default 10 min; configurable 1 min–1 h per integration | Command: SQL: ALTER SECURITY INTEGRATION <name> SET OAUTH_ACCESS_TOKEN_VALIDITY = <secs> OAUTH_REFRESH_TOKEN_VALIDITY = <secs> |
| Detect: Usage appears in logs | Yes | AUTHORIZING_INTEGRATION_NAME, LOGIN_EVENT_ID | Command: SQL: SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY WHERE authorizing_integration_name = '<INTEGRATION>' |
| Detect: Data reads appear in logs | Yes | QUERY_HISTORY view; LOGIN_HISTORY.authorizing_integration_name names the OAuth integration | Command: SQL: SELECT ... FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY ah JOIN QUERY_HISTORY qh USING (query_id) JOIN LOGIN_HISTORY lh ON qh.authn_event_id = lh.event_id WHERE lh.authorizing_integration_name = '<INTEGRATION>' |
| Respond: Revocation ends active access | Partial | ALTER USER docs say removal revokes OAuth access tokens for the integration, and SESSIONS has CLOSED_REASON OAUTH_CONSENT_REVOKED; whether all open sessions close is not stated. | ALTER USER <u> REMOVE DELEGATED AUTHORIZATIONS FROM SECURITY INTEGRATION <int> (per user), or REMOVE DELEGATED AUTHORIZATIONS OF ANY ROLE FROM SECURITY INTEGRATION <int>; disable the integration (ENABLED = FALSE) for client-wide compromise; ALTER USER SET DISABLED = TRUE for user compromise. |
| Respond: Stops working when user is removed | Yes | OAuth sessions run as a Snowflake user. Disabling that user, which SCIM deactivation does, aborts the user's queries and blocks new logins. | Where: Snowsight > Governance & security > Users & roles > (user) ... > Disable User · API: PATCH /scim/v2/Users/{id} with {"op":"replace","value":{"active":false}} · Command: ALTER USER <name> SET DISABLED = TRUE |

## Protect: what an admin can configure

### Admin controls
- **Network policies (account / user / security integration)** (Limit network; all plans; default off). Restrict inbound access by IP or private endpoint; integration-level policy overrides user and account policies. Where: CREATE NETWORK POLICY; ALTER ACCOUNT/USER/SECURITY INTEGRATION SET NETWORK_POLICY.
- **Snowflake OAuth integration ENABLED** (Disable; all plans; default on). Suspends a Snowflake OAuth integration. Where: ALTER SECURITY INTEGRATION ... SET ENABLED = FALSE.
- **OAUTH_ISSUE_REFRESH_TOKENS / OAUTH_REFRESH_TOKEN_VALIDITY** (Limit lifetime; all plans; default on). Turns refresh tokens off or sets their validity (custom clients 1 to 90 days, default 90). Where: Security integration parameters.
- **OAUTH_SINGLE_USE_REFRESH_TOKENS_REQUIRED** (Require rotation; all plans; default off). Requires refresh tokens to be single-use. Where: Security integration parameter.
- **OAUTH_ENFORCE_PKCE** (Other; all plans; default off). Requires PKCE for every authorization instead of only when the client sends it. Where: Security integration parameter.

- Network: conditional (checked at mixed). A network policy on the Snowflake OAuth integration covers code exchange, refresh token use and access token use, and overrides user and account policies. User-level policies are not checked on token requests (except the built-in local-application integration).
- Lifetime: Default 10 min; configurable 1 min–1 h per integration. Renewal: Refresh tokens (on by default) default to 90 days (7776000 s); custom clients allow 1–90 days and partner apps 1 h–90 days, then the user must re-authorize. Single-use refresh tokens are optional.
- Keyless option: not_applicable. Snowflake issues the tokens itself; no external token is exchanged. Tokens from an external authorization server use External OAuth (snowflake-5), and cloud workload identities use workload identity federation (snowflake-4).
- Conditions: Avoid treating default PAT safeguards as immutable. Verify client/driver and cloud support for federation.

## Detect: what gets logged
- Token prefix: not established

### Logs
- SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY: Successful and failed logins, 365 days, up to 2h latency. INFORMATION_SCHEMA LOGIN_HISTORY table functions cover 7 days. OAuth logins have FIRST_AUTHENTICATION_FACTOR = OAUTH_ACCESS_TOKEN and AUTHORIZING_INTEGRATION_NAME = the security integration.
- SNOWFLAKE.ACCOUNT_USAGE.SESSIONS: One row per session, 1 year, up to 3h latency; links to login via LOGIN_EVENT_ID. Does not track SQL API transient sessions. CLOSED_REASON includes OAUTH_CONSENT_REVOKED and OAUTH_CRITICAL_CHANGE_INTEGRATION.
- SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY: Queries per SESSION_ID with AUTHN_EVENT_ID, 365 days, up to 45 min latency.

### Fields that identify the credential
- `AUTHORIZING_INTEGRATION_NAME` (LOGIN_HISTORY): Security integration (OAuth client) that granted access.
- `LOGIN_EVENT_ID` (SESSIONS): Links an OAuth session to its login event.

### Lifecycle events
- use: `OAUTH_ACCESS_TOKEN` FIRST_AUTHENTICATION_FACTOR value for OAuth logins, successful or failed.
- auth_fail: `OAUTH_ACCESS_TOKEN_INVALID` Expired or invalid access token at session creation.
- auth_fail: `invalid_grant` Refresh token invalid, expired, revoked, or issued to another client.
- revoke: `ALTER USER … REMOVE DELEGATED AUTHORIZATIONS FROM SECURITY INTEGRATION` Revokes consent and associated OAuth access tokens.
- revoke: `OAUTH_CONSENT_REVOKED` SESSIONS.CLOSED_REASON value.

### Correlate on
`USER_NAME`, `CLIENT_IP`, `REPORTED_CLIENT_TYPE`, `REPORTED_CLIENT_VERSION`, `EVENT_ID`, `LOGIN_EVENT_ID`, `SESSION_ID`, `AUTHN_EVENT_ID`, `CLIENT_APPLICATION_ID`, `AUTHORIZING_INTEGRATION_NAME`, `ROLE_NAME`

### API calls a holder can make, and whether they are logged
- collection: `POST /api/v2/statements (SELECT)`. Any table data the authorized role can read Logged: yes (`QUERY_HISTORY view; LOGIN_HISTORY.authorizing_integration_name names the OAuth integration`). QUERY_HISTORY keeps 365 days. ACCESS_HISTORY needs Enterprise Edition.

### What to look for (analyst guidance)
- OAuth login via an integration (AUTHORIZING_INTEGRATION_NAME) not normally used by that user
- Same user's OAuth logins from two distant CLIENT_IPs within the token lifetime
- OAuth sessions using a privileged ROLE_NAME after OAUTH_ADD_PRIVILEGED_ROLES_TO_BLOCKED_LIST was set to FALSE
- New or altered OAuth security integration followed by logins from new IPs
- Repeated invalid_grant / OAUTH_ACCESS_TOKEN_INVALID failures for one client

### Sample query (Snowflake SQL (ACCOUNT_USAGE))
Find new user/integration/IP combinations for Snowflake OAuth logins.

```
SELECT user_name, authorizing_integration_name, client_ip, COUNT(*) AS logins, MIN(event_timestamp) AS first_seen FROM SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY WHERE first_authentication_factor = 'OAUTH_ACCESS_TOKEN' AND is_success = 'YES' AND event_timestamp > DATEADD(day,-30,CURRENT_TIMESTAMP()) GROUP BY 1,2,3 ORDER BY first_seen DESC;
```

## Respond: how to revoke it


ALTER USER <u> REMOVE DELEGATED AUTHORIZATIONS FROM SECURITY INTEGRATION <int> (per user), or REMOVE DELEGATED AUTHORIZATIONS OF ANY ROLE FROM SECURITY INTEGRATION <int>; disable the integration (ENABLED = FALSE) for client-wide compromise; ALTER USER SET DISABLED = TRUE for user compromise. Live access ends on revocation: partial. ALTER USER docs say removal revokes OAuth access tokens for the integration, and SESSIONS has CLOSED_REASON OAUTH_CONSENT_REVOKED; whether all open sessions close is not stated.

## No vendor documentation found
- Admin can list all of them
- SSO and MFA rules apply
- Access/refresh token format
- Default refresh token validity
- SESSIONS.AUTHENTICATION_METHOD value for OAuth
- FIRST_AUTHENTICATION_FACTOR_ID population for OAuth
- Audit record for refresh token issuance
- Edition requirements for authentication policies are not stated on the reference pages.
- Whether Snowflake OAuth (as opposed to External OAuth) can be disallowed via AUTHENTICATION_METHODS; the OAUTH value is documented as 'Allows External OAuth'.
- No account-wide policy found to force named key pairs or cap key-pair lifetime; legacy RSA_PUBLIC_KEY keys never expire.
- Docs differ on how to unblock privileged roles for custom OAuth clients (account parameter vs Snowflake Support).
- Whether the WIF quote 'disable it' covers the DEFAULT identity (docs say DEFAULT must use SET/UNSET WORKLOAD_IDENTITY).

## Sources
- [Workload identity federation | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/workload-identity-federation) (retrieved 2026-10-09)
- [Using programmatic access tokens for authentication | Snowflake ...](https://docs.snowflake.com/en/user-guide/programmatic-access-tokens) (retrieved 2026-10-09)
- [Overview of Snowflake authentication](https://docs.snowflake.com/en/user-guide/security-authentication-overview) (retrieved 2026-10-09)
- [Snowflake OAuth overview | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/oauth-snowflake-overview) (retrieved 2026-10-12)
- [Authentication policies - Snowflake Documentation](https://docs.snowflake.com/en/user-guide/authentication-policies) (retrieved 2026-10-09)
- [CREATE SECURITY INTEGRATION (Snowflake OAuth) - Snowflake Documentation](https://docs.snowflake.com/en/sql-reference/sql/create-security-integration-oauth-snowflake) (retrieved 2026-10-09)
- [Okta SCIM integration](https://docs.snowflake.com/en/user-guide/scim-okta) (retrieved 2026-10-14)
- [ALTER USER](https://docs.snowflake.com/en/sql-reference/sql/alter-user) (retrieved 2026-10-12)
- [ALTER SECURITY INTEGRATION (Snowflake OAuth)](https://docs.snowflake.com/en/sql-reference/sql/alter-security-integration-oauth-snowflake) (retrieved 2026-10-14)
- [Controlling network traffic with network policies | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/network-policies) (retrieved 2026-10-12)
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
