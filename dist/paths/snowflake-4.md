# Snowflake: Workload identity federation

`snowflake-4` · Federated identity · service. Snowflake OAuth/External OAuth, key-pair JWT, programmatic access tokens (PATs), and workload identity federation.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | SNOWFLAKE.ACCOUNT_USAGE.CREDENTIALS includes workload identity federation credentials. | Command: SQL: SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.CREDENTIALS WHERE domain = 'WORKLOAD_IDENTITY_FEDERATION_METHOD' |
| Protect: Admin can block or require approval | Yes | Authentication policy AUTHENTICATION_METHODS; Disable named workload identity | Command: SQL: AUTHENTICATION_METHODS without 'WORKLOAD_IDENTITY' + ALTER ACCOUNT/USER <name> SET AUTHENTICATION POLICY <policy>; one identity: ALTER USER <u> MODIFY WORKLOAD IDENTITY <name> SET DISABLED = TRUE |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Account/user/integration network policies. PAT defaults require network-policy protection, but authentication policy can relax enforcement. | Where: Snowsight > Governance & security > Network policies > Network Policies tab > + Network Policy, then activate · Command: SQL: ALTER USER/ACCOUNT ... SET NETWORK_POLICY = <np> |
| Protect: Expires automatically | Partial | Cloud identity / driver dependent |  |
| Detect: Usage appears in logs | Yes | CREDENTIAL_ID, TYPE, FIRST_AUTHENTICATION_FACTOR_ID | SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY: Successful and failed logins, 365 days, up to 2h latency. INFORMATION_SCHEMA LOGIN_HISTORY table functions cover 7 days. Docs say to use it with CREDENTIALS to audit WIF services. · SNOWFLAKE.ACCOUNT_USAGE.SESSIONS: One row per session, 1 year, up to 3h latency; links to login via LOGIN_EVENT_ID. Does not track SQL API transient sessions. · SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY: Queries per SESSION_ID with AUTHN_EVENT_ID, 365 days, up to 45 min latency. · SNOWFLAKE.ACCOUNT_USAGE.CREDENTIALS: Current credential inventory (PAT, KEYPAIR, WIF types) with LAST_USED_ON; up to 2h latency; deleted credentials are not included. WIF rows: DOMAIN WORKLOAD_IDENTITY_FEDERATION_METHOD, TYPE AWS/AZURE/GCP/OIDC. · Cloud provider logs (AWS CloudTrail, Azure Monitor, GCP): Record the workload's token issuance on the provider side. |
| Detect: Data reads appear in logs | Yes | QUERY_HISTORY view (join to LOGIN_HISTORY.first_authentication_factor_id) | Command: SQL: SELECT ... FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY ah JOIN QUERY_HISTORY qh USING (query_id) JOIN LOGIN_HISTORY lh ON qh.authn_event_id = lh.event_id WHERE lh.first_authentication_factor_id = '<wif_credential_id>' |
| Respond: Revocation ends active access | No docs found | Snowflake caches issuer signing keys up to 60 minutes; session behavior after removal is not documented. |  |
| Respond: Stops working when user is removed | N/A | Workload identities attach to service users, not people. Disabling the service user still blocks it. |  |

## Protect: what an admin can configure

### Admin controls
- **Authentication policy AUTHENTICATION_METHODS** (Disable; not stated; default off). Allow-list of auth methods; omitting PROGRAMMATIC_ACCESS_TOKEN, KEYPAIR, WORKLOAD_IDENTITY or OAUTH blocks that method for the account or user. Where: CREATE/ALTER AUTHENTICATION POLICY ... AUTHENTICATION_METHODS; ALTER ACCOUNT/USER SET AUTHENTICATION POLICY.
- **MODIFY PROGRAMMATIC AUTHENTICATION METHODS privilege** (Limit resources; all plans; default on). Only roles with OWNERSHIP or this privilege on a user can manage that user's PATs, key pairs or workload identities. Where: GRANT MODIFY PROGRAMMATIC AUTHENTICATION METHODS ON USER ... TO ROLE.
- **Network policies (account / user / security integration)** (Limit network; all plans; default off). Restrict inbound access by IP or private endpoint; integration-level policy overrides user and account policies. Where: CREATE NETWORK POLICY; ALTER ACCOUNT/USER/SECURITY INTEGRATION SET NETWORK_POLICY.
- **WORKLOAD_IDENTITY_POLICY (ALLOWED_PROVIDERS / ALLOWED_AWS_ACCOUNTS / ALLOWED_AZURE_ISSUERS / ALLOWED_OIDC_ISSUERS)** (Limit resources; not stated; default off). Restricts WIF to chosen providers, AWS accounts, Entra tenants or OIDC issuers. Where: Authentication policy WORKLOAD_IDENTITY_POLICY.
- **Disable named workload identity** (Disable; all plans; default unknown). Disables one workload identity on a service user. Where: ALTER USER ... MODIFY WORKLOAD IDENTITY.

- Network: conditional (checked at mixed). Account/user/integration network policies. PAT defaults require network-policy protection, but authentication policy can relax enforcement.
- Lifetime: Cloud identity / driver dependent. Renewal: Workload presents a fresh cloud-provider/OIDC credential to authenticate again. Only SERVICE/SERVICE_AGENT users; authentication policies can limit allowed providers/issuers.
- Keyless option: supported. Native workload federation for supported cloud identities; External OAuth for external authorization servers. Driver/API support must match the method.
- Conditions: Avoid treating default PAT safeguards as immutable. Verify client/driver and cloud support for federation.

## Detect: what gets logged
- Token prefix: not established

### Logs
- SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY: Successful and failed logins, 365 days, up to 2h latency. INFORMATION_SCHEMA LOGIN_HISTORY table functions cover 7 days. Docs say to use it with CREDENTIALS to audit WIF services.
- SNOWFLAKE.ACCOUNT_USAGE.SESSIONS: One row per session, 1 year, up to 3h latency; links to login via LOGIN_EVENT_ID. Does not track SQL API transient sessions.
- SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY: Queries per SESSION_ID with AUTHN_EVENT_ID, 365 days, up to 45 min latency.
- SNOWFLAKE.ACCOUNT_USAGE.CREDENTIALS: Current credential inventory (PAT, KEYPAIR, WIF types) with LAST_USED_ON; up to 2h latency; deleted credentials are not included. WIF rows: DOMAIN WORKLOAD_IDENTITY_FEDERATION_METHOD, TYPE AWS/AZURE/GCP/OIDC.
- Cloud provider logs (AWS CloudTrail, Azure Monitor, GCP): Record the workload's token issuance on the provider side.

### Fields that identify the credential
- `CREDENTIAL_ID` (CREDENTIALS): ID of the workload identity binding.
- `TYPE` (CREDENTIALS): AWS, AZURE, GCP or OIDC.
- `FIRST_AUTHENTICATION_FACTOR_ID` (LOGIN_HISTORY): Credential ID used to authenticate; population for WIF not confirmed.

### Lifecycle events
- create: `ALTER USER … SET WORKLOAD_IDENTITY` Creates DEFAULT identity (ARN / ISSUER / SUBJECT / OIDC_AUDIENCE_LIST).
- create: `ALTER USER … ADD WORKLOAD IDENTITY` Additional named identity.
- change: `ALTER USER … MODIFY WORKLOAD IDENTITY` Rename, disable, comment; TYPE/ARN/ISSUER/SUBJECT are immutable.
- revoke: `ALTER USER … REMOVE WORKLOAD IDENTITY` Named identities; DEFAULT uses UNSET WORKLOAD_IDENTITY.

### Correlate on
`USER_NAME`, `CLIENT_IP`, `REPORTED_CLIENT_TYPE`, `REPORTED_CLIENT_VERSION`, `EVENT_ID`, `LOGIN_EVENT_ID`, `SESSION_ID`, `AUTHN_EVENT_ID`, `CLIENT_APPLICATION_ID`, `CREDENTIAL_ID`, `FIRST_AUTHENTICATION_FACTOR_ID`

### API calls a holder can make, and whether they are logged
- collection: `POST /api/v2/statements (SELECT)`. Any table data the service user's role can read Logged: yes (`QUERY_HISTORY view (join to LOGIN_HISTORY.first_authentication_factor_id)`). QUERY_HISTORY keeps 365 days. ACCESS_HISTORY needs Enterprise Edition.

### What to look for (analyst guidance)
- Identity added to a service user with a broad ISSUER/SUBJECT or no OIDC_AUDIENCE_LIST
- WIF logins from CLIENT_IP outside the expected cloud region/provider range
- Changes to a user's WORKLOAD_IDENTITY not matched by an infrastructure change ticket
- WIF user switched to TYPE = SERVICE_AGENT
- Login activity for the WIF user with no matching token issuance in CloudTrail/Azure/GCP logs

### Sample query (Snowflake SQL (ACCOUNT_USAGE))
Inventory WIF bindings, who created them and when they were last used.

```
SELECT c.user_name, c.name, c.type, c.status, c.created_by, c.created_on, c.last_used_on FROM SNOWFLAKE.ACCOUNT_USAGE.CREDENTIALS c WHERE c.domain = 'WORKLOAD_IDENTITY_FEDERATION_METHOD' ORDER BY c.created_on DESC;
```

## Respond: how to revoke it


ALTER USER <u> REMOVE WORKLOAD IDENTITY <name> or MODIFY … to disable; UNSET WORKLOAD_IDENTITY for DEFAULT; ALTER USER <u> SET DISABLED = TRUE; also revoke the cloud role/federated credential on the provider side. Live access ends on revocation: unknown. Snowflake caches issuer signing keys up to 60 minutes; session behavior after removal is not documented.

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- FIRST_AUTHENTICATION_FACTOR value for WIF logins
- Whether FIRST_AUTHENTICATION_FACTOR_ID is populated for WIF
- STATUS values for WIF credentials beyond the generic list
- SESSIONS.AUTHENTICATION_METHOD value
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
- [ALTER USER](https://docs.snowflake.com/en/sql-reference/sql/alter-user) (retrieved 2026-10-12)
- [CREDENTIALS view](https://docs.snowflake.com/en/sql-reference/account-usage/credentials) (retrieved 2026-10-12)
- [CREATE AUTHENTICATION POLICY | Snowflake Documentation](https://docs.snowflake.com/en/sql-reference/sql/create-authentication-policy) (retrieved 2026-10-12)
- [ALTER USER ... MODIFY WORKLOAD IDENTITY](https://docs.snowflake.com/en/sql-reference/sql/alter-user-modify-workload-identity) (retrieved 2026-10-14)
- [Controlling network traffic with network policies | Snowflake Documentation](https://docs.snowflake.com/en/user-guide/network-policies) (retrieved 2026-10-12)
- [ACCESS_HISTORY view](https://docs.snowflake.com/en/sql-reference/account-usage/access_history) (retrieved 2026-10-14)
- [QUERY_HISTORY view](https://docs.snowflake.com/en/sql-reference/account-usage/query_history) (retrieved 2026-10-12)
- [LOGIN_HISTORY view](https://docs.snowflake.com/en/sql-reference/account-usage/login_history) (retrieved 2026-10-12)
- [SESSIONS view](https://docs.snowflake.com/en/sql-reference/account-usage/sessions) (retrieved 2026-10-12)
- [Submitting a request to execute SQL statements](https://docs.snowflake.com/en/developer-guide/sql-api/submitting-requests) (retrieved 2026-10-14)
- [Authenticating to the server (SQL API) - Snowflake Documentation](https://docs.snowflake.com/en/developer-guide/sql-api/authenticating) (retrieved 2026-10-09)
- [Access History](https://docs.snowflake.com/en/user-guide/access-history) (retrieved 2026-10-14)
