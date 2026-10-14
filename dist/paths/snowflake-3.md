# Snowflake: Key-pair JWT

`snowflake-3` · Signed JWT · person or service. Snowflake OAuth/External OAuth, key-pair JWT, programmatic access tokens (PATs), and workload identity federation.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | SNOWFLAKE.ACCOUNT_USAGE.CREDENTIALS includes key pairs. | Command: SQL: SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.CREDENTIALS WHERE type = 'KEYPAIR' |
| Protect: Admin can block or require approval | Yes | Authentication policy AUTHENTICATION_METHODS | Command: SQL: CREATE AUTHENTICATION POLICY <p> AUTHENTICATION_METHODS = (... without 'KEYPAIR'); ALTER ACCOUNT/USER <name> SET AUTHENTICATION POLICY <policy> |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Account/user/integration network policies. PAT defaults require network-policy protection, but authentication policy can relax enforcement. | Where: Snowsight > Governance & security > Network policies > Network Policies tab > + Network Policy, then activate · Command: SQL: ALTER USER/ACCOUNT ... SET NETWORK_POLICY = <np> |
| Protect: Expires automatically | Yes | Client sets JWT exp; Snowflake caps it at 1 hour (documented for SQL API) | Command: SQL: ALTER USER <u> ADD KEY PAIR <name> PUBLIC_KEY = '...' DAYS_TO_EXPIRY = <n>; JWT exp claim capped at 1 hour |
| Detect: Usage appears in logs | Yes | RSA_PUBLIC_KEY_FP, RSA_PUBLIC_KEY_2_FP, CREDENTIAL_ID, FIRST_AUTHENTICATION_FACTOR_ID | Command: SQL: SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY WHERE first_authentication_factor_id = '<CREDENTIAL_ID from CREDENTIALS>' |
| Detect: Data reads appear in logs | Yes | QUERY_HISTORY view (join to LOGIN_HISTORY.first_authentication_factor_id) | Command: SQL: SELECT ... FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY ah JOIN QUERY_HISTORY qh USING (query_id) JOIN LOGIN_HISTORY lh ON qh.authn_event_id = lh.event_id WHERE lh.first_authentication_factor_id = '<keypair_credential_id>' |
| Respond: Revocation ends active access | No docs found | Each JWT is valid at most 1 hour; docs do not say whether sessions opened with a removed key end. |  |
| Respond: Stops working when user is removed | Yes | Key pairs are bound to a Snowflake user. Disabling that user, which SCIM deactivation does, aborts the user's queries and blocks new logins. | Where: Snowsight > Governance & security > Users & roles > (user) ... > Disable User · API: PATCH /scim/v2/Users/{id} with {"op":"replace","value":{"active":false}} · Command: ALTER USER <name> SET DISABLED = TRUE |

## Protect: what an admin can configure

### Admin controls
- **Authentication policy AUTHENTICATION_METHODS** (Disable; not stated; default off). Allow-list of auth methods; omitting PROGRAMMATIC_ACCESS_TOKEN, KEYPAIR, WORKLOAD_IDENTITY or OAUTH blocks that method for the account or user. Where: CREATE/ALTER AUTHENTICATION POLICY ... AUTHENTICATION_METHODS; ALTER ACCOUNT/USER SET AUTHENTICATION POLICY.
- **MODIFY PROGRAMMATIC AUTHENTICATION METHODS privilege** (Limit resources; all plans; default on). Only roles with OWNERSHIP or this privilege on a user can manage that user's PATs, key pairs or workload identities. Where: GRANT MODIFY PROGRAMMATIC AUTHENTICATION METHODS ON USER ... TO ROLE.
- **Network policies (account / user / security integration)** (Limit network; all plans; default off). Restrict inbound access by IP or private endpoint; integration-level policy overrides user and account policies. Where: CREATE NETWORK POLICY; ALTER ACCOUNT/USER/SECURITY INTEGRATION SET NETWORK_POLICY.
- **Named key pairs (role restriction and expiration)** (Limit lifetime; all plans; default off). Keys added with ADD KEY PAIR can carry a role restriction and expiry; legacy RSA_PUBLIC_KEY cannot. Where: ALTER USER ... ADD KEY PAIR / REMOVE KEY PAIR.
- **EXPIRE_ROTATED_KEY_PAIR_AFTER_HOURS** (Limit lifetime; all plans; default on). Sets how long a rotated named key stays valid (default 24 hours, 0 = immediate). Where: Parameter EXPIRE_ROTATED_KEY_PAIR_AFTER_HOURS.

- Network: conditional (checked at mixed). Account/user/integration network policies. PAT defaults require network-policy protection, but authentication policy can relax enforcement.
- Lifetime: Client sets JWT exp; Snowflake caps it at 1 hour (documented for SQL API). Renewal: Client signs a new JWT with the private key. Keys do not expire by default; named key pairs can set DAYS_TO_EXPIRY and role restriction. The RSA_PUBLIC_KEY property supports neither.
- Keyless option: not_applicable. Native workload federation for supported cloud identities; External OAuth for external authorization servers. Driver/API support must match the method.
- Conditions: Avoid treating default PAT safeguards as immutable. Verify client/driver and cloud support for federation.

## Detect: what gets logged
- Token prefix: not established

### Logs
- SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY: Successful and failed logins, 365 days, up to 2h latency. INFORMATION_SCHEMA LOGIN_HISTORY table functions cover 7 days.
- SNOWFLAKE.ACCOUNT_USAGE.SESSIONS: One row per session, 1 year, up to 3h latency; links to login via LOGIN_EVENT_ID. Does not track SQL API transient sessions.
- SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY: Queries per SESSION_ID with AUTHN_EVENT_ID, 365 days, up to 45 min latency.
- SNOWFLAKE.ACCOUNT_USAGE.CREDENTIALS: Current credential inventory (PAT, KEYPAIR, WIF types) with LAST_USED_ON; up to 2h latency; deleted credentials are not included. Named key pairs appear with TYPE/DOMAIN KEYPAIR and STATUS ACTIVE/EXPIRED/DISABLED.

### Fields that identify the credential
- `RSA_PUBLIC_KEY_FP` (DESCRIBE USER output): SHA256 fingerprint of key 1; matches the fingerprint in the JWT iss claim.
- `RSA_PUBLIC_KEY_2_FP` (DESCRIBE USER output): Fingerprint of second key slot.
- `CREDENTIAL_ID` (CREDENTIALS): ID of a named key pair (TYPE KEYPAIR).
- `FIRST_AUTHENTICATION_FACTOR_ID` (LOGIN_HISTORY): Credential ID used to authenticate; population for key pairs not confirmed.

### Lifecycle events
- create: `ALTER USER … ADD KEY PAIR` Named key pair; legacy path is SET RSA_PUBLIC_KEY / RSA_PUBLIC_KEY_2.
- change: `ALTER USER … ROTATE KEY PAIR` Prior key valid 24h by default; EXPIRE_ROTATED_KEY_PAIR_AFTER_HOURS = 0 ends it now.
- change: `ALTER USER … MODIFY KEY PAIR` 
- revoke: `ALTER USER … REMOVE KEY PAIR` Or UNSET RSA_PUBLIC_KEY for legacy keys.
- auth_fail: `JWT_TOKEN_INVALID_PUBLIC_KEY_FINGERPRINT_MISMATCH` Error 394304; other JWT errors 390144, 394300-394307.

### Correlate on
`USER_NAME`, `CLIENT_IP`, `REPORTED_CLIENT_TYPE`, `REPORTED_CLIENT_VERSION`, `EVENT_ID`, `LOGIN_EVENT_ID`, `SESSION_ID`, `AUTHN_EVENT_ID`, `CLIENT_APPLICATION_ID`, `RSA_PUBLIC_KEY_FP`, `FIRST_AUTHENTICATION_FACTOR_ID`

### API calls a holder can make, and whether they are logged
- collection: `POST /api/v2/statements (SELECT)`. Any table data the user's role can read Logged: yes (`QUERY_HISTORY view (join to LOGIN_HISTORY.first_authentication_factor_id)`). QUERY_HISTORY keeps 365 days. ACCESS_HISTORY needs Enterprise Edition.

### Public detection rules (community, not vendor documentation)
- [Snowflake user with key-based auth logged in with password auth](https://github.com/panther-labs/panther-analysis/blob/develop/queries/snowflake_queries/snowflake_key_user_password_login.yml) (Panther): A user with an RSA public key configured logged in with a factor other than RSA_KEYPAIR (scheduled query on LOGIN_HISTORY).

### What to look for (analyst guidance)
- New RSA_PUBLIC_KEY / ADD KEY PAIR set on a user by someone other than the usual admin
- Key-pair logins for a service user from a new CLIENT_IP or REPORTED_CLIENT_TYPE
- Fingerprint-mismatch (394304) failures followed by success: attacker trying keys
- Successful logins on the old key after ROTATE (grace period abuse)
- Second key slot (RSA_PUBLIC_KEY_2) populated when the team uses only one

### Sample query (Snowflake SQL (ACCOUNT_USAGE))
Find key registrations, rotations and removals on users.

```
SELECT query_id, start_time, user_name, role_name, query_text FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY WHERE (query_text ILIKE '%RSA_PUBLIC_KEY%' OR query_text ILIKE '%KEY PAIR%') AND query_type ILIKE 'ALTER%' AND start_time > DATEADD(day,-90,CURRENT_TIMESTAMP()) ORDER BY start_time DESC;
```

## Respond: how to revoke it


ALTER USER <u> REMOVE KEY PAIR <name> or UNSET RSA_PUBLIC_KEY / RSA_PUBLIC_KEY_2; or ROTATE KEY PAIR with EXPIRE_ROTATED_KEY_PAIR_AFTER_HOURS = 0; ALTER USER <u> SET DISABLED = TRUE to abort running queries. Live access ends on revocation: unknown. Each JWT is valid at most 1 hour; docs do not say whether sessions opened with a removed key end.

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- FIRST_AUTHENTICATION_FACTOR value for key-pair logins (sample leaves it null)
- Whether FIRST_AUTHENTICATION_FACTOR_ID is populated for key pairs
- SESSIONS.AUTHENTICATION_METHOD value
- Exact QUERY_TYPE for ALTER USER statements
- Edition requirements for authentication policies are not stated on the reference pages.
- Whether Snowflake OAuth (as opposed to External OAuth) can be disallowed via AUTHENTICATION_METHODS; the OAUTH value is documented as 'Allows External OAuth'.
- No account-wide policy found to force named key pairs or cap key-pair lifetime; legacy RSA_PUBLIC_KEY keys never expire.
- Docs differ on how to unblock privileged roles for custom OAuth clients (account parameter vs Snowflake Support).
- Whether the WIF quote 'disable it' covers the DEFAULT identity (docs say DEFAULT must use SET/UNSET WORKLOAD_IDENTITY).

## Sources
- [Workload identity federation | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/workload-identity-federation) (retrieved 2026-10-09)
- [Using programmatic access tokens for authentication | Snowflake ...](https://docs.snowflake.com/en/user-guide/programmatic-access-tokens) (retrieved 2026-10-09)
- [Overview of Snowflake authentication](https://docs.snowflake.com/en/user-guide/security-authentication-overview) (retrieved 2026-10-09)
- [Key-pair authentication and key-pair rotation - Snowflake Documentation](https://docs.snowflake.com/en/user-guide/key-pair-auth) (retrieved 2026-10-09)
- [Authentication policies - Snowflake Documentation](https://docs.snowflake.com/en/user-guide/authentication-policies) (retrieved 2026-10-09)
- [Authenticating to the server (SQL API) - Snowflake Documentation](https://docs.snowflake.com/en/developer-guide/sql-api/authenticating) (retrieved 2026-10-09)
- [ALTER USER ... ADD KEY PAIR - Snowflake Documentation](https://docs.snowflake.com/en/sql-reference/sql/alter-user-add-key-pair) (retrieved 2026-10-09)
- [Okta SCIM integration](https://docs.snowflake.com/en/user-guide/scim-okta) (retrieved 2026-10-14)
- [ALTER USER](https://docs.snowflake.com/en/sql-reference/sql/alter-user) (retrieved 2026-10-12)
- [CREDENTIALS view](https://docs.snowflake.com/en/sql-reference/account-usage/credentials) (retrieved 2026-10-12)
- [CREATE AUTHENTICATION POLICY | Snowflake Documentation](https://docs.snowflake.com/en/sql-reference/sql/create-authentication-policy) (retrieved 2026-10-12)
- [Controlling network traffic with network policies | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/network-policies) (retrieved 2026-10-12)
- [LOGIN_HISTORY view](https://docs.snowflake.com/en/sql-reference/account-usage/login_history) (retrieved 2026-10-12)
- [ACCESS_HISTORY view](https://docs.snowflake.com/en/sql-reference/account-usage/access_history) (retrieved 2026-10-14)
- [QUERY_HISTORY view](https://docs.snowflake.com/en/sql-reference/account-usage/query_history) (retrieved 2026-10-12)
- [User management](https://docs.snowflake.com/en/user-guide/admin-user-management) (retrieved 2026-10-14)
- [SCIM user API reference](https://docs.snowflake.com/en/user-guide/scim-user-api-reference) (retrieved 2026-10-14)
- [Key-pair authentication troubleshooting](https://docs.snowflake.com/en/user-guide/key-pair-auth-troubleshooting) (retrieved 2026-10-12)
- [SESSIONS view](https://docs.snowflake.com/en/sql-reference/account-usage/sessions) (retrieved 2026-10-12)
- [Submitting a request to execute SQL statements](https://docs.snowflake.com/en/developer-guide/sql-api/submitting-requests) (retrieved 2026-10-14)
- [Access History](https://docs.snowflake.com/en/user-guide/access-history) (retrieved 2026-10-14)
