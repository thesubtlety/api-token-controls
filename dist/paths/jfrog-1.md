# JFrog: Access tokens (scoped tokens: admin, user, group and project scopes; reference token form)

`jfrog-1` · Signed JWT · person or service. JWT issued by JFrog Access, sent as Bearer; a 'reference token' alias can be used as a password for basic auth. Admins can mint tokens for any subject, including non-existent (transient) users and CI jobs. Tokens can also authenticate on other JPDs in the same circle of trust.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Administration > User Management > Access Tokens page and GET /access/api/v1/tokens (admins see all). | Administration > User Management > Access Tokens page and GET /access/api/v1/tokens (admins see all). |
| Protect: Admin can block or require approval | Yes | token.allow-refreshable | Command: Self-managed: set token.allow-refreshable: false in $JFROG_HOME/artifactory/var/etc/artifactory/access.config.latest.yml |
| Protect: SSO and MFA rules apply | Not available | Tokens are not re-checked against the IdP; a user disabled in the IdP may still refresh tokens unless SCIM pushes the change. |  |
| Protect: IP restriction | Yes | MyJFrog IP/CIDR allowlist blocks all traffic to the JPD from non-listed IPs (Enterprise X/Enterprise+). Off by default. | IP/CIDR Allowlist: MyJFrog > Security > Allowlist; MyJFrog IP allowlist API |
| Protect: Expires automatically | Yes | Default 1h; expiry 0 = never expires unless admin sets a max expiry | Token default expiry: PUT /access/api/v1/config/token/default_expiry · token.max-expiry: access.config YAML token.max-expiry (default 0 = no limit) |
| Detect: Usage appears in logs | Yes | Entity Name (TKN), token_id / last_used, Username | Where: Administration > Artifactory > System Logs (access log; auth type field = TOKEN, filter by username). SaaS: download Audit Trail and Request logs from the jfrog-logs repository · API: POST /access/api/v1/logshipping/config {"enabled": true} (enable Cloud Log Collection) |
| Detect: Data reads appear in logs | Yes | POST /artifactory/api/search/aql | Where: Request log (jfrog-logs repo on SaaS): filter Request method=POST and Request URL containing api/search/aql, plus Username |
| Respond: Revocation ends active access | Partial | Tokens below the revocable threshold (default 6h) cannot be revoked and run to expiry. | Where: Administration > User Management > Access Tokens > select token > Revoke · API: DELETE /access/api/v1/tokens/{tokenId}; DELETE /access/api/v1/tokens/revoke (by token value) |
| Respond: Stops working when user is removed | Partial | SCIM deprovisioning disables the user and blocks refreshes; JFrog says to revoke active tokens explicitly for immediate termination. | Where: Administration > User Management > Users (disable/delete user), then revoke the user's tokens under User Management > Access Tokens · API: PATCH /access/api/v1/scim/v2/Users/{username} (disable) or DELETE /access/api/v2/users/{username}; then DELETE /access/api/v1/tokens/{tokenId} |

## Protect: what an admin can configure

### Admin controls
- **Token default expiry** (Limit lifetime; all plans; default on). Sets the default expiry for new tokens. Where: PUT /access/api/v1/config/token/default_expiry.
- **token.max-expiry** (Limit lifetime; all plans; default off). Caps non-admin token lifetime and blocks non-expiring tokens when set above 0. Where: access.config YAML token.max-expiry (default 0 = no limit).
- **token.allow-refreshable** (Disable; all plans; default unknown). Stops creation of refreshable tokens. Where: access.config YAML token.allow-refreshable=false.
- **IP/CIDR Allowlist** (Limit network; Enterprise X or Enterprise+; default off). Only listed IPs/JPDs can reach the JPD. Where: MyJFrog > Security > Allowlist; MyJFrog IP allowlist API.

### Not available (vendor states)
- Tokens with expiry shorter than the revocable threshold (default 6 hours) cannot be revoked.

- Network: supported (checked at api_request). MyJFrog IP/CIDR allowlist blocks all traffic to the JPD from non-listed IPs (Enterprise X/Enterprise+). Off by default.
- Lifetime: Default 1h; expiry 0 = never expires unless admin sets a max expiry. Renewal: Optional refresh token; otherwise create a new token.
- Keyless option: limited. Tokens are independent of the IdP session. Without SCIM, a user removed from the IdP can keep refreshing tokens.
- Conditions: Max expiry, refreshable and revocable thresholds are documented as Access YAML settings; SaaS customer control not documented.

## Detect: what gets logged
- Token prefix: `cmVmd`

### Logs
- Audit Trail Log (access-security-audit): Token create/update/delete; via Cloud Log Collection (all SaaS licenses, jfrog-logs repo, up to 24h delay) or Log Streaming (Enterprise+).
- Artifactory Request Log: Every HTTP request with username and remote address.
- Artifactory Access Log: Logins, deploys with auth type APIKEY or TOKEN; SaaS omits DOWNLOAD events by default.

### Fields that identify the credential
- `Entity Name (TKN)` (Audit Trail Log): Token entity; exact ID content not documented.
- `token_id / last_used` (Get Tokens API): Inventory, not a log.
- `Username` (Request Log): No token ID field.

### Lifecycle events
- create: `C TKN` Event Type C on entity TKN.
- revoke: `D TKN` Event Type D on entity TKN.
- use: `ACCEPTED LOGIN` Access log with type TOKEN.

### Correlate on
`username/subject`, `Trace ID`, `remote IP`

### API calls a holder can make, and whether they are logged
- recon: `GET /access/api/v1/tokens/me`. current token's subject, scope, expiry Logged: yes. Request log records all HTTP requests.
- discovery (bulk): `GET /artifactory/api/repositories`. repository list Logged: yes. Request log.
- collection (bulk): `POST /artifactory/api/search/aql`. artifact metadata across repos Logged: yes. Request log; body not logged per documented fields.

### What to look for (analyst guidance)
- Tokens with no expiry or for transient subjects
- Admin-scoped tokens created outside change windows
- Large AQL queries or mass downloads in the request log

## Respond: how to revoke it
- Admin: **Revoke Token by ID / Access Tokens page**. Admin revokes any token; users revoke their own. Where: Administration > User Management > Access Tokens; DELETE /access/api/v1/tokens/{tokenId}.
- Admin: **Revoke Token by Value**. Admin revokes a leaked JWT or reference token by its value. Where: POST /access/api/v1/tokens/revoke.
- Admin: **Disable/delete user (with SCIM)**. Deleting or disabling a user revokes their identity tokens; SCIM pushes IdP deprovisioning. Where: User Management > Users; SCIM.

Revoke by ID or by value; disable the user; for refreshable tokens without SCIM, disable the JFrog user directly. Live access ends on revocation: partial. Tokens below the revocable threshold (default 6h) cannot be revoked and run to expiry.

## No vendor documentation found
- Exact token identifier in audit trail entries
- Whether SaaS customers can change token.max-expiry, token.allow-refreshable or revocable-expiry-threshold (documented only as Access YAML settings).
- A setting to stop non-admin users creating identity tokens.
- Default and maximum lifetime of UI-generated identity tokens.
- Whether the IP allowlist covers the MyJFrog portal API.
- Whether MyJFrog audit logs record API token generation (event names not listed).
- Reference token length: Access Tokens page says 128 characters, Identity Tokens page says 64.

## Sources
- [Access Tokens](https://docs.jfrog.com/administration/docs/access-tokens) (retrieved 2026-10-14)
- [JFrog Authentication and Token Management Overview](https://docs.jfrog.com/administration/docs/jfrog-authentication-and-token-management-overview) (retrieved 2026-10-14)
- [Configure Cloud Security](https://docs.jfrog.com/administration/docs/configure-cloud-security) (retrieved 2026-10-14)
- [Revoke Token by ID](https://docs.jfrog.com/administration/reference/revoketokenbyid) (retrieved 2026-10-14)
- [Get Tokens](https://docs.jfrog.com/administration/reference/gettokens) (retrieved 2026-10-14)
- [Access Log](https://docs.jfrog.com/administration/docs/access-log) (retrieved 2026-10-14)
- [Cloud Log Collection](https://docs.jfrog.com/administration/docs/cloud-log-collection) (retrieved 2026-10-14)
- [Log Files Location and Naming](https://docs.jfrog.com/administration/docs/log-files-location-and-naming) (retrieved 2026-10-14)
- [Audit Trail Log](https://docs.jfrog.com/administration/docs/audit-trail-log) (retrieved 2026-10-14)
- [Artifactory Query Language (AQL)](https://docs.jfrog.com/artifactory/reference/searchaql) (retrieved 2026-10-14)
- [Revoke Token by Value](https://docs.jfrog.com/administration/reference/revoketokenbyvalue) (retrieved 2026-10-14)
- [DISABLE User (SCIM)](https://docs.jfrog.com/administration/reference/patchscimuser) (retrieved 2026-10-14)
- [Manage Users](https://docs.jfrog.com/administration/docs/manage-users-2) (retrieved 2026-10-14)
- [Delete User](https://docs.jfrog.com/administration/reference/deleteuser) (retrieved 2026-10-14)
- [Identity Tokens](https://docs.jfrog.com/user-management/docs/identity-tokens) (retrieved 2026-10-14)
- [JFrog Cloud Log Streaming](https://docs.jfrog.com/administration/docs/jfrog-cloud-log-streaming) (retrieved 2026-10-14)
- [Get Token by ID](https://docs.jfrog.com/administration/reference/gettokenbyid) (retrieved 2026-10-14)
- [Get Repositories by Type and Project](https://docs.jfrog.com/artifactory/reference/getrepositoriesbytypeandproject) (retrieved 2026-10-14)
- [Put Token Default Expiry Value](https://docs.jfrog.com/administration/reference/settokendefaultexpiry) (retrieved 2026-10-14)
