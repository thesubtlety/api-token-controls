# Snowflake: Programmatic access token

`snowflake-1` · Personal access token · person or service. Snowflake OAuth/External OAuth, key-pair JWT, programmatic access tokens (PATs), and workload identity federation.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | SNOWFLAKE.ACCOUNT_USAGE.CREDENTIALS WHERE type = 'PAT' lists PATs for all users. | Where: Snowsight > Governance & security > Users & roles > (user) > Programmatic access tokens (per user) · Command: SQL: SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.CREDENTIALS WHERE type = 'PAT'; per user: SHOW USER PROGRAMMATIC ACCESS TOKENS FOR USER <name> |
| Protect: Admin can block or require approval | Yes | Authentication policy AUTHENTICATION_METHODS | Command: SQL: CREATE AUTHENTICATION POLICY <p> AUTHENTICATION_METHODS = (... without 'PROGRAMMATIC_ACCESS_TOKEN'); ALTER ACCOUNT/USER <name> SET AUTHENTICATION POLICY <policy> |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Account/user network policies. By default PERSON and SERVICE users need a network policy to use a PAT; SERVICE_AGENT users do not. Authentication policy NETWORK_POLICY_EVALUATION can drop the requirement or skip enforcement. | Where: Snowsight > Governance & security > Network policies > Network Policies tab > + Network Policy, then activate · Command: SQL: ALTER USER/ACCOUNT ... SET NETWORK_POLICY = <np>; PAT requirement: ALTER AUTHENTICATION POLICY <p> SET PAT_POLICY = (NETWORK_POLICY_EVALUATION = ENFORCED_REQUIRED) |
| Protect: Expires automatically | Yes | Default 15 days; default max 365 days | Command: SQL: ALTER AUTHENTICATION POLICY <p> SET PAT_POLICY = (DEFAULT_EXPIRY_IN_DAYS = n MAX_EXPIRY_IN_DAYS = m); per-token expiry: EXPIRATION_DATE in ACCOUNT_USAGE.CREDENTIALS |
| Detect: Usage appears in logs | Yes | FIRST_AUTHENTICATION_FACTOR_ID, CREDENTIAL_ID, NAME, PAT_NAME | Command: SQL: SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY WHERE first_authentication_factor_id = '<CREDENTIAL_ID from CREDENTIALS>' |
| Detect: Data reads appear in logs | Yes | QUERY_HISTORY view (join SESSIONS and LOGIN_HISTORY.first_authentication_factor_id to tie queries to the PAT) | Command: SQL: SELECT ... FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY ah JOIN QUERY_HISTORY qh USING (query_id) JOIN LOGIN_HISTORY lh ON qh.authn_event_id = lh.event_id WHERE lh.first_authentication_factor_id = '<pat_credential_id>' (or join SESSIONS on login_event_id) |
| Respond: Revocation ends active access | No docs found | Docs do not say whether sessions opened with a PAT end on removal. ALTER USER SET DISABLED = TRUE aborts running queries. Removed PATs drop out of CREDENTIALS, so snapshot the row before removing. |  |
| Respond: Stops working when user is removed | Yes | Disabling a user, which is what Okta SCIM deactivation does, automatically disables the user's PATs and aborts the user's running queries. | Where: Snowsight > Governance & security > Users & roles > (user) ... > Disable User · API: PATCH /scim/v2/Users/{id} with {"op":"replace","value":{"active":false}} · Command: ALTER USER <name> SET DISABLED = TRUE |

## Protect: what an admin can configure

### Admin controls
- **Authentication policy AUTHENTICATION_METHODS** (Disable; not stated; default off). Allow-list of auth methods; omitting PROGRAMMATIC_ACCESS_TOKEN, KEYPAIR, WORKLOAD_IDENTITY or OAUTH blocks that method for the account or user. Where: CREATE/ALTER AUTHENTICATION POLICY ... AUTHENTICATION_METHODS; ALTER ACCOUNT/USER SET AUTHENTICATION POLICY.
- **PAT_POLICY MAX_EXPIRY_IN_DAYS / DEFAULT_EXPIRY_IN_DAYS** (Limit lifetime; not stated; default on). Sets the default (15 days) and maximum (365 days) PAT lifetime; lowering the max breaks longer existing tokens. Where: Authentication policy PAT_POLICY.
- **PAT network policy requirement (NETWORK_POLICY_EVALUATION)** (Limit network; not stated; default on). By default a user must be subject to a network policy to create or use PATs; admins can relax this. Where: Authentication policy PAT_POLICY NETWORK_POLICY_EVALUATION (ENFORCED_REQUIRED default).
- **PAT role restriction requirement** (Limit scope; not stated; default on). Service-user PATs must name a single role by default; admins can also require it for person users. Where: PAT_POLICY REQUIRE_ROLE_RESTRICTION_FOR_SERVICE_USERS / REQUIRE_ROLE_RESTRICTION_FOR_PERSON_USERS.
- **MODIFY PROGRAMMATIC AUTHENTICATION METHODS privilege** (Limit resources; all plans; default on). Only roles with OWNERSHIP or this privilege on a user can manage that user's PATs, key pairs or workload identities. Where: GRANT MODIFY PROGRAMMATIC AUTHENTICATION METHODS ON USER ... TO ROLE.
- **Network policies (account / user / security integration)** (Limit network; all plans; default off). Restrict inbound access by IP or private endpoint; integration-level policy overrides user and account policies. Where: CREATE NETWORK POLICY; ALTER ACCOUNT/USER/SECURITY INTEGRATION SET NETWORK_POLICY.

- Network: conditional (checked at api_request). Account/user network policies. By default PERSON and SERVICE users need a network policy to use a PAT; SERVICE_AGENT users do not. Authentication policy NETWORK_POLICY_EVALUATION can drop the requirement or skip enforcement.
- Lifetime: Default 15 days; default max 365 days. Renewal: No refresh; rotate the PAT (new secret, extended expiry) or generate a new one. Lowering the policy maximum makes existing longer-lived PATs fail.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: Avoid treating default PAT safeguards as immutable. Verify client/driver and cloud support for federation.

## Detect: what gets logged
- Token prefix: not established

### Logs
- SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY: Successful and failed logins, 365 days, up to 2h latency. INFORMATION_SCHEMA LOGIN_HISTORY table functions cover 7 days. PAT logins have FIRST_AUTHENTICATION_FACTOR = PROGRAMMATIC_ACCESS_TOKEN.
- SNOWFLAKE.ACCOUNT_USAGE.SESSIONS: One row per session, 1 year, up to 3h latency; links to login via LOGIN_EVENT_ID. Does not track SQL API transient sessions.
- SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY: Queries per SESSION_ID with AUTHN_EVENT_ID, 365 days, up to 45 min latency.
- SNOWFLAKE.ACCOUNT_USAGE.CREDENTIALS: Current credential inventory (PAT, KEYPAIR, WIF types) with LAST_USED_ON; up to 2h latency; deleted credentials are not included. PAT rows have TYPE 'PAT'; ADDITIONAL_DETAILS has ROLE_RESTRICTION, ROTATED_TO.
- GitHub secret scanning partner program: Leaked PATs in public GitHub repos are reported to Snowflake, which auto-disables them.

### Fields that identify the credential
- `FIRST_AUTHENTICATION_FACTOR_ID` (LOGIN_HISTORY): Credential ID of the PAT used; join to CREDENTIALS.CREDENTIAL_ID.
- `CREDENTIAL_ID` (CREDENTIALS): System ID of the PAT.
- `NAME` (CREDENTIALS): PAT name chosen at creation.
- `PAT_NAME` (SYSTEM$DECODE_PAT output): Name of the PAT for a given secret (with USER_NAME, STATE).

### Lifecycle events
- create: `ALTER USER … ADD PROGRAMMATIC ACCESS TOKEN` SQL command; find in QUERY_HISTORY.QUERY_TEXT. Default expiry 15 days, max 365.
- use: `PROGRAMMATIC_ACCESS_TOKEN` FIRST_AUTHENTICATION_FACTOR value in LOGIN_HISTORY (success and failure).
- change: `ALTER USER … ROTATE PROGRAMMATIC ACCESS TOKEN` New secret, same name; old secret expires per EXPIRE_ROTATED_TOKEN_AFTER_HOURS.
- change: `ALTER USER … MODIFY PROGRAMMATIC ACCESS TOKEN` Sets DISABLED and other properties.
- revoke: `ALTER USER … REMOVE PROGRAMMATIC ACCESS TOKEN` Irreversible.

### Correlate on
`USER_NAME`, `CLIENT_IP`, `REPORTED_CLIENT_TYPE`, `REPORTED_CLIENT_VERSION`, `EVENT_ID`, `LOGIN_EVENT_ID`, `SESSION_ID`, `AUTHN_EVENT_ID`, `CLIENT_APPLICATION_ID`, `FIRST_AUTHENTICATION_FACTOR_ID`, `CREDENTIAL_ID`, `CREATED_BY`

### API calls a holder can make, and whether they are logged
- collection: `POST /api/v2/statements (SELECT)`. Any table data the token's role can read Logged: yes (`QUERY_HISTORY view (join SESSIONS and LOGIN_HISTORY.first_authentication_factor_id to tie queries to the PAT)`). QUERY_HISTORY keeps 365 days. ACCESS_HISTORY (objects and columns read) needs Enterprise Edition.

### What to look for (analyst guidance)
- PAT login from a CLIENT_IP never seen for that FIRST_AUTHENTICATION_FACTOR_ID
- PAT created by a CREATED_BY user different from the token owner, especially on a service user
- PAT created with long expiry (near 365 days) or with network policy bypass (ADDITIONAL_DETAILS.MINS_TO_BYPASS_NETWORK_POLICY_REQUIREMENT)
- Burst of failed PROGRAMMATIC_ACCESS_TOKEN logins against many users
- PAT use right after creation from an IP unlike the creator's session
- CREDENTIALS STATUS = DISABLED from GitHub auto-disable: review earlier use of that token

### Sample query (Snowflake SQL (ACCOUNT_USAGE))
List PAT logins with token name, creator and source IP for the last 30 days.

```
SELECT login.event_timestamp, login.user_name, login.client_ip, cred.name, cred.created_by FROM SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY login JOIN SNOWFLAKE.ACCOUNT_USAGE.CREDENTIALS cred ON login.first_authentication_factor_id = cred.credential_id WHERE login.first_authentication_factor = 'PROGRAMMATIC_ACCESS_TOKEN' AND login.event_timestamp > DATEADD(day,-30,CURRENT_TIMESTAMP()) ORDER BY login.event_timestamp DESC;
```

## Respond: how to revoke it
- Admin: **Disable / revoke PAT**. Admins can disable or remove a PAT; disabling a user's login disables their PATs. Where: ALTER USER ... MODIFY / REMOVE PROGRAMMATIC ACCESS TOKEN.

Identify owner of a found secret with SELECT SYSTEM$DECODE_PAT('<secret>'); run ALTER USER <u> REMOVE PROGRAMMATIC ACCESS TOKEN <name> (or MODIFY … SET DISABLED = TRUE to preserve for review). For wider compromise, ALTER USER <u> SET DISABLED = TRUE, which aborts running queries and disables the user's PATs. Live access ends on revocation: unknown. Docs do not say whether sessions opened with a PAT end on removal. ALTER USER SET DISABLED = TRUE aborts running queries. Removed PATs drop out of CREDENTIALS, so snapshot the row before removing.

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- PAT secret prefix/regex
- SESSIONS.AUTHENTICATION_METHOD value for PAT sessions
- Whether existing sessions end when a PAT is removed or disabled
- Native audit event name for PAT create/remove beyond QUERY_HISTORY text
- Edition requirements for authentication policies are not stated on the reference pages.
- Whether Snowflake OAuth (as opposed to External OAuth) can be disallowed via AUTHENTICATION_METHODS; the OAUTH value is documented as 'Allows External OAuth'.
- No account-wide policy found to force named key pairs or cap key-pair lifetime; legacy RSA_PUBLIC_KEY keys never expire.
- Docs differ on how to unblock privileged roles for custom OAuth clients (account parameter vs Snowflake Support).
- Whether the WIF quote 'disable it' covers the DEFAULT identity (docs say DEFAULT must use SET/UNSET WORKLOAD_IDENTITY).

## Sources
- [Workload identity federation | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/workload-identity-federation) (retrieved 2026-10-09)
- [Using programmatic access tokens for authentication | Snowflake ...](https://docs.snowflake.com/en/user-guide/programmatic-access-tokens) (retrieved 2026-10-09)
- [Overview of Snowflake authentication](https://docs.snowflake.com/en/user-guide/security-authentication-overview) (retrieved 2026-10-09)
- [Authentication policies - Snowflake Documentation](https://docs.snowflake.com/en/user-guide/authentication-policies) (retrieved 2026-10-09)
- [Okta SCIM integration](https://docs.snowflake.com/en/user-guide/scim-okta) (retrieved 2026-10-14)
- [ALTER USER](https://docs.snowflake.com/en/sql-reference/sql/alter-user) (retrieved 2026-10-12)
- [CREDENTIALS view](https://docs.snowflake.com/en/sql-reference/account-usage/credentials) (retrieved 2026-10-12)
- [SHOW USER PROGRAMMATIC ACCESS TOKENS](https://docs.snowflake.com/en/sql-reference/sql/show-user-programmatic-access-tokens) (retrieved 2026-10-14)
- [CREATE AUTHENTICATION POLICY | Snowflake Documentation](https://docs.snowflake.com/en/sql-reference/sql/create-authentication-policy) (retrieved 2026-10-12)
- [Controlling network traffic with network policies | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/network-policies) (retrieved 2026-10-12)
- [LOGIN_HISTORY view](https://docs.snowflake.com/en/sql-reference/account-usage/login_history) (retrieved 2026-10-12)
- [ACCESS_HISTORY view](https://docs.snowflake.com/en/sql-reference/account-usage/access_history) (retrieved 2026-10-14)
- [QUERY_HISTORY view](https://docs.snowflake.com/en/sql-reference/account-usage/query_history) (retrieved 2026-10-12)
- [SESSIONS view](https://docs.snowflake.com/en/sql-reference/account-usage/sessions) (retrieved 2026-10-12)
- [User management](https://docs.snowflake.com/en/user-guide/admin-user-management) (retrieved 2026-10-14)
- [SCIM user API reference](https://docs.snowflake.com/en/user-guide/scim-user-api-reference) (retrieved 2026-10-14)
- [SYSTEM$DECODE_PAT](https://docs.snowflake.com/en/sql-reference/functions/system_decode_pat) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Authenticating to the server (SQL API) - Snowflake Documentation](https://docs.snowflake.com/en/developer-guide/sql-api/authenticating) (retrieved 2026-10-09)
- [Submitting a request to execute SQL statements](https://docs.snowflake.com/en/developer-guide/sql-api/submitting-requests) (retrieved 2026-10-14)
- [Access History](https://docs.snowflake.com/en/user-guide/access-history) (retrieved 2026-10-14)
