# JFrog: Identity tokens (user-scoped reference tokens)

`jfrog-2` · Personal access token · person. Any user can generate an identity token from their profile; it carries the user's own permissions and is shown as a short reference token usable as Bearer, X-JFrog-Art-Api header or basic-auth password.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admins can view identity tokens in the UI and via Get Tokens. | Admins can view identity tokens in the UI and via Get Tokens. |
| Protect: Admin can block or require approval | Yes | Allow Created Users Access To Profile Page | Allow Created Users Access To Profile Page: Administration > Authentication Providers > SAML SSO settings |
| Protect: SSO and MFA rules apply | Not available | Same token model; IdP disablement does not reach JFrog without SCIM. |  |
| Protect: IP restriction | Yes | Same JPD-wide MyJFrog allowlist. | IP/CIDR Allowlist: MyJFrog > Security > Allowlist; MyJFrog IP allowlist API |
| Protect: Expires automatically | Partial | Follows admin default/max expiry; UI default not documented | Token default expiry: PUT /access/api/v1/config/token/default_expiry · token.max-expiry: access.config YAML token.max-expiry (default 0 = no limit) |
| Detect: Usage appears in logs | Yes | token description / ID | Where: Administration > Artifactory > System Logs (access log; auth type = TOKEN, filter by username). SaaS: Request log in the jfrog-logs repository |
| Detect: Data reads appear in logs | Yes | POST /artifactory/api/search/aql | Where: Request log (jfrog-logs repo on SaaS): filter Request method=POST and Request URL containing api/search/aql, plus Username |
| Respond: Revocation ends active access | Yes | User disable revokes tokens. | Where: Edit Profile > identity token row > x > Revoke; admin: User Management > Access Tokens > Revoke · API: DELETE /access/api/v1/tokens/{tokenId} |
| Respond: Stops working when user is removed | Yes | Identity tokens are revoked when the user is deleted or disabled. | Where: Administration > User Management > Users (disable or delete the user) · API: DELETE /access/api/v2/users/{username}; SCIM: PATCH /access/api/v1/scim/v2/Users/{username} or DELETE /access/api/v1/scim/v2/Users/{username} |

## Protect: what an admin can configure

### Admin controls
- **Token default expiry** (Limit lifetime; all plans; default on). Sets the default expiry for new tokens. Where: PUT /access/api/v1/config/token/default_expiry.
- **token.max-expiry** (Limit lifetime; all plans; default off). Caps non-admin token lifetime and blocks non-expiring tokens when set above 0. Where: access.config YAML token.max-expiry (default 0 = no limit).
- **IP/CIDR Allowlist** (Limit network; Enterprise X or Enterprise+; default off). Only listed IPs/JPDs can reach the JPD. Where: MyJFrog > Security > Allowlist; MyJFrog IP allowlist API.
- **Allow Created Users Access To Profile Page** (Disable; all plans; default unknown). When cleared, users auto-created through SAML cannot reach their profile page, where identity tokens and API keys are generated. Where: Administration > Authentication Providers > SAML SSO settings.

- Network: supported (checked at api_request). Same JPD-wide MyJFrog allowlist.
- Lifetime: Follows admin default/max expiry; UI default not documented. Renewal: Generate another identity token; users can hold many.
- Keyless option: limited. Disabling/deleting the JFrog user revokes identity tokens; IdP-side disablement only propagates if SCIM is set up.
- Conditions: null

## Detect: what gets logged
- Token prefix: `cmVmd`

### Logs
- Audit Trail Log: Token create/delete.
- Request/Access logs: Use by username.

### Fields that identify the credential
- `token description / ID` (Identity tokens list): Shown in user profile and admin view.

### Lifecycle events
- create: `C TKN` 
- revoke: `D TKN` 

### Correlate on
`username`

### API calls a holder can make, and whether they are logged
- recon: `GET /access/api/v1/tokens/me`. token details Logged: yes. Request log.
- collection (bulk): `POST /artifactory/api/search/aql`. artifacts user can read Logged: yes. Request log.

### What to look for (analyst guidance)
- Many identity tokens for one user
- Identity tokens used from new IPs

## Respond: how to revoke it
- Admin: **Revoke Token by ID / Access Tokens page**. Admin revokes any token; users revoke their own. Where: Administration > User Management > Access Tokens; DELETE /access/api/v1/tokens/{tokenId}.
- Admin: **Revoke Token by Value**. Admin revokes a leaked JWT or reference token by its value. Where: POST /access/api/v1/tokens/revoke.
- Admin: **Disable/delete user (with SCIM)**. Deleting or disabling a user revokes their identity tokens; SCIM pushes IdP deprovisioning. Where: User Management > Users; SCIM.

Revoke in profile/admin UI or disable the user. Live access ends on revocation: yes. User disable revokes tokens.

## No vendor documentation found
- Whether SaaS customers can change token.max-expiry, token.allow-refreshable or revocable-expiry-threshold (documented only as Access YAML settings).
- A setting to stop non-admin users creating identity tokens.
- Default and maximum lifetime of UI-generated identity tokens.
- Whether the IP allowlist covers the MyJFrog portal API.
- Whether MyJFrog audit logs record API token generation (event names not listed).
- Reference token length: Access Tokens page says 128 characters, Identity Tokens page says 64.

## Sources
- [Identity Tokens](https://docs.jfrog.com/user-management/docs/identity-tokens) (retrieved 2026-10-14)
- [Access Tokens](https://docs.jfrog.com/administration/docs/access-tokens) (retrieved 2026-10-14)
- [JFrog Authentication and Token Management Overview](https://docs.jfrog.com/administration/docs/jfrog-authentication-and-token-management-overview) (retrieved 2026-10-14)
- [Configure Cloud Security](https://docs.jfrog.com/administration/docs/configure-cloud-security) (retrieved 2026-10-14)
- [Put Token Default Expiry Value](https://docs.jfrog.com/administration/reference/settokendefaultexpiry) (retrieved 2026-10-14)
- [Get Tokens](https://docs.jfrog.com/administration/reference/gettokens) (retrieved 2026-10-14)
- [Access Log](https://docs.jfrog.com/administration/docs/access-log) (retrieved 2026-10-14)
- [Cloud Log Collection](https://docs.jfrog.com/administration/docs/cloud-log-collection) (retrieved 2026-10-14)
- [Log Files Location and Naming](https://docs.jfrog.com/administration/docs/log-files-location-and-naming) (retrieved 2026-10-14)
- [Artifactory Query Language (AQL)](https://docs.jfrog.com/artifactory/reference/searchaql) (retrieved 2026-10-14)
- [Revoke Token by ID](https://docs.jfrog.com/administration/reference/revoketokenbyid) (retrieved 2026-10-14)
- [Manage Users](https://docs.jfrog.com/administration/docs/manage-users-2) (retrieved 2026-10-14)
- [Delete User](https://docs.jfrog.com/administration/reference/deleteuser) (retrieved 2026-10-14)
- [DISABLE User (SCIM)](https://docs.jfrog.com/administration/reference/patchscimuser) (retrieved 2026-10-14)
- [DELETE User (SCIM)](https://docs.jfrog.com/administration/reference/deletescimuser) (retrieved 2026-10-14)
- [Audit Trail Log](https://docs.jfrog.com/administration/docs/audit-trail-log) (retrieved 2026-10-14)
- [JFrog Cloud Log Streaming](https://docs.jfrog.com/administration/docs/jfrog-cloud-log-streaming) (retrieved 2026-10-14)
- [Get Token by ID](https://docs.jfrog.com/administration/reference/gettokenbyid) (retrieved 2026-10-14)
- [Revoke Token by Value](https://docs.jfrog.com/administration/reference/revoketokenbyvalue) (retrieved 2026-10-14)
- [SAML SSO](https://docs.jfrog.com/administration/docs/saml-sso) (retrieved 2026-10-14)
