# Jamf: Jamf Pro user account bearer token (username/password via /v1/auth/token)

`jamf-2` · Basic credentials · person. A Jamf Pro user account's username and password are sent with basic auth to POST /api/v1/auth/token to get a bearer token used on both APIs. Since 11.17.0 basic auth works only on the token endpoint.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Not available | Jamf says API authentication does not support SSO; the token is obtained with a Jamf Pro username and password. |  |
| Protect: IP restriction | No docs found | Access log records source IP for token requests; no IP restriction found in public docs. |  |
| Protect: Expires automatically | Yes | 20-minute token, renewable indefinitely via keep-alive while valid | API: POST /v1/auth/token returns "expires"; POST /v1/auth/keep-alive issues a new 20-minute token |
| Detect: Usage appears in logs | Yes | username | Where: Jamf Pro > Settings > System > Change management (filter by username); Access log (JSSAccess.log, username/ipAddress/entryPoint) via Jamf Log Stream on Jamf Cloud Premium or on the self-hosted server |
| Detect: Data reads appear in logs | Not available | Not in Access Log for bearer tokens; RestAPIOperation webhook fires if configured. |  |
| Respond: Revocation ends active access | No docs found | Docs do not say whether disabling an account invalidates outstanding bearer tokens. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Password Policy** (Other; all plans; default unknown). Sets lockout attempts, password length/age/reuse for local Jamf Pro accounts used to mint bearer tokens. Where: Settings > System > User accounts & groups > Password Policy.
- **Jamf Pro user account privileges** (Limit scope; all plans; default unknown). Bearer token carries the account's privilege set; CRUD privileges map to POST/GET/PUT/DELETE. Where: Settings > System > User accounts & groups.

### Not available (vendor states)
- No SSO/IdP enforcement for API authentication.

- Network: unknown (checked at unknown). Access log records source IP for token requests; no IP restriction found in public docs.
- Lifetime: 20-minute token, renewable indefinitely via keep-alive while valid. Renewal: POST /v1/auth/keep-alive returns a new token and invalidates the old one; or re-authenticate with the password.
- Keyless option: not_applicable. Jamf: "API authentication does not support the use of SSO." A local (or LDAP) password is needed, so API access does not go through the IdP. The SSO settings also offer a bypass checkbox for the web UI.
- Conditions: Password Policy applies only to local accounts.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Access Log: Token requests logged with username, status, ipAddress, entryPoint=Universal API; individual Classic API calls with bearer tokens are not logged there.
- Change Management log: Records username, object, action for changes.

### Fields that identify the credential
- `username` (Access Log): Jamf Pro account name.

### Lifecycle events
- create: `Successful Login` Access Log status value; entryPoint Universal API for token requests.
- use: `Failed Login` Access Log status value.

### Correlate on
`username`, `ipAddress`, `entryPoint`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/v1/auth`. Account, privileges, sites for the current token Logged: unknown. 
- collection (bulk): `GET /api/v3/computers-inventory`. Paginated computer inventory Logged: unknown. 
- collection (bulk): `GET /JSSResource/... (Classic API)`. Classic API objects Logged: no. Not in Access Log for bearer tokens; RestAPIOperation webhook fires if configured.

### What to look for (analyst guidance)
- Universal API logins from new IPs
- Bursts of Failed Login
- Logins from accounts that normally use SSO via failover/bypass

## Respond: how to revoke it
- Admin: **Invalidate current token**. Invalidates the bearer token presented in the request (self-revoke by the holder). Where: POST /v1/auth/invalidate-token.
- Admin: **Access Status (Jamf Pro user account)**. An admin can set a Jamf Pro user account's Access Status to Disabled, blocking that account's username/password sign-in used to get bearer tokens. Where: Settings > System > User accounts & groups > account > Access Status.

Disable/delete the user account or change its password; holder can call POST /v1/auth/invalidate-token. Live access ends on revocation: unknown. Docs do not say whether disabling an account invalidates outstanding bearer tokens.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- IP restriction
- Revocation ends active access
- Stops working when user is removed
- Effect of account disable on live tokens
- IP allowlisting for Jamf Pro API clients or user API access (none found in public docs).
- Default and maximum Access Token Lifetime for API clients (the doc example shows expires_in 599, but no default is stated).
- Whether Jamf Pro admins can block a user account from using /v1/auth/token while keeping UI access.
- Which identity Change Management logs for actions taken by an API client, and whether /v1/oauth/token requests appear in the Access Log.
- Exact Change Management object/action names for API client create/rotate/disable.
- Jamf Protect API token lifetime and revocation; Jamf School API key expiry, auth header format and revocation behavior.
- Platform API Gateway: revoke/disable controls for an integration and IP restrictions.

## Sources
- [Jamf Pro API Overview](https://developer.jamf.com/jamf-pro/docs/jamf-pro-api-overview) (retrieved 2026-10-14)
- [Classic API Authentication Changes](https://developer.jamf.com/jamf-pro/docs/classic-api-authentication-changes) (retrieved 2026-10-14)
- [SSO with SAML](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/SAML-Based_Single_Sign-On) (retrieved 2026-10-14)
- [Jamf Log Stream](https://developer.jamf.com/jamf-pro/docs/jamf-log-stream) (retrieved 2026-10-14)
- [Keep alive](https://developer.jamf.com/jamf-pro/reference/post_v1-auth-keep-alive) (retrieved 2026-10-14)
- [Configuring the Password Policy](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/Configuring_the_Password_Policy) (retrieved 2026-10-14)
- [Invalidate current token](https://developer.jamf.com/jamf-pro/reference/post_v1-auth-invalidate-token) (retrieved 2026-10-14)
- [Viewing Change Management Logs in Jamf Pro](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/Viewing_Change_Management_Logs_in_Jamf_Pro) (retrieved 2026-10-14)
- [Jamf Premium Cloud](https://learn.jamf.com/r/en-US/technical-articles/Jamf_Premium_Cloud_Prerequisites) (retrieved 2026-10-14)
- [Server Logs (Jamf Pro Security Overview)](https://learn.jamf.com/r/en-US/jamf-pro-security-overview/Server_Logs) (retrieved 2026-10-14)
- [Change Management](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/Change_Management) (retrieved 2026-10-14)
- [Get all the Authorization details associated with the current api](https://developer.jamf.com/jamf-pro/reference/get_v1-auth) (retrieved 2026-10-14)
- [Jamf Pro API reference index](https://developer.jamf.com/jamf-pro/reference/llms.txt) (retrieved 2026-10-14)
- [Webhooks](https://developer.jamf.com/jamf-pro/docs/webhooks-1) (retrieved 2026-10-14)
- [Unlocking a Jamf Pro User Account - Jamf Pro Documentation 11.33.0](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/Unlocking_a_Jamf_Pro_User_Account) (retrieved 2026-10-14)
