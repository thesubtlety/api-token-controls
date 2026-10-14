# Zendesk Support: OAuth

`zendesk-1` · OAuth · person or service. OAuth bearer: authorization code or client credentials. Legacy API tokens via Basic email/token are being retired; unavailable to accounts created from 28 July 2026.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin Center > Apps and integrations > APIs > OAuth clients > View tokens, and GET /api/v2/oauth/tokens?all=true for admins. | Admin Center > Apps and integrations > APIs > OAuth clients > View tokens, and GET /api/v2/oauth/tokens?all=true for admins. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Account IP restrictions cover API/mobile/web access. Customer bypass and unsupported-endpoint exceptions require review. | IP restrictions: Admin Center > Account > Security > Advanced |
| Protect: Expires automatically | Yes | Default 30 min (5 min–48 h) for clients created on/after 2026-04-30; older clients may issue non-expiring tokens | OAuth client Expire tokens: Admin Center > Apps and integrations > APIs > OAuth clients > client > Expire tokens |
| Detect: Usage appears in logs | Yes | authorization_type, id, client_id, token, used_at, user_id |  · Zendesk Access Logs (/api/v2/access_logs): ADPP add-on; 90 days; per-request user_id, IP, client, authorization_type ('bearer' for OAuth). No client_id field. · Zendesk Audit Logs (/api/v2/audit_logs): Enterprise; kept indefinitely; config changes and logins with actor and IP. · OAuth Tokens API (/api/v2/oauth/tokens?all=true): Inventory, not a log: per token client_id, user_id, created_at, expires_at, used_at, scopes; first 10 chars of token. |
| Detect: Data reads appear in logs | Conditional | Recorded in the access log only with the ADPP add-on, after it is turned on; 90-day window; shows actor and authorization type, not a token ID. | Where: Admin Center > Account > Logs > Access log > Filter: Category = Users, Summary = Show user; Authorization type = bearer · API: GET /api/v2/access_logs?filter[start]=...&filter[end]=...&filter[user_id]=<id> (authorization_type field) |
| Respond: Revocation ends active access | Yes | Revoking a token record ends that token. Effect of client deletion on existing tokens not documented. Non-expiring legacy tokens persist until revoked. | DELETE /api/v2/oauth/tokens/{id} (or POST /api/v2/oauth/tokens/delete_many); for a leaked client secret, PUT /api/v2/oauth/clients/{id}/generate_secret or DELETE the client. |
| Respond: Stops working when user is removed | Partial | If the creating admin loses access, client_credentials tokens stop but authorization_code tokens keep working; nothing says what happens when the authorizing user is removed. | Where: Admin Center > People > Team > Team members > agent > Manage in Support > User type = End user (then delete); revoke the user's OAuth tokens via API · API: GET /api/v2/oauth/tokens?all=true; DELETE /api/v2/oauth/tokens/{oauth_token_id}; DELETE /api/v2/users/{user_id} |

## Protect: what an admin can configure

### Admin controls
- **IP restrictions** (Limit network; All Suites Team+ / Support Team+; default off). Blocks API calls, sign-ins and page access from outside allowed IPs; customers (not agents/admins) can be exempted. Where: Admin Center > Account > Security > Advanced.
- **OAuth client Scopes (allowed scopes)** (Limit scope; All Suites Team+ / Support Team+; default off). Caps the scopes a client may request; empty means all scopes; only affects new tokens. Where: Admin Center > Apps and integrations > APIs > OAuth clients > client > Scopes.
- **OAuth client Expire tokens** (Limit lifetime; All Suites Team+ / Support Team+; default varies). Assigns a default expiration to all tokens from the client, including existing ones; permanent once on; preset for clients created after Apr 30 2026. Where: Admin Center > Apps and integrations > APIs > OAuth clients > client > Expire tokens.
- **Manage APIs permission / user role** (Limit scope; all plans; default unknown). Only admins or agents with Manage APIs can create tokens via API; token access follows the requester's current role. Where: Admin Center > People > Team > Roles (Manage APIs permission).

### Not available (vendor states)
- Narrowing a client's allowed scopes does not shrink existing tokens.

- Network: conditional (checked at api_request). Account IP restrictions cover API/mobile/web access. Customer bypass and unsupported-endpoint exceptions require review.
- Lifetime: Default 30 min (5 min–48 h) for clients created on/after 2026-04-30; older clients may issue non-expiring tokens. Renewal: Authorization code: single-use rotating refresh token, TTL 7–90 days (default 30 days). Client credentials: no refresh token; run the client credentials flow again. Existing local clients must adopt refresh tokens by 1 April 2027.
- Keyless option: not_supported. SSO via SAML/OIDC/JWT does not by itself provide external identity exchange for the Support management API.
- Conditions: Check IP entitlement and OAuth client creation date/type. API-token retirement applies to Support/Ticketing, Help Center and Voice; other Zendesk products differ.

## Detect: what gets logged
- Token prefix: not established

### Logs
- undefined: undefined
- Zendesk Access Logs (/api/v2/access_logs): ADPP add-on; 90 days; per-request user_id, IP, client, authorization_type ('bearer' for OAuth). No client_id field.
- Zendesk Audit Logs (/api/v2/audit_logs): Enterprise; kept indefinitely; config changes and logins with actor and IP.
- OAuth Tokens API (/api/v2/oauth/tokens?all=true): Inventory, not a log: per token client_id, user_id, created_at, expires_at, used_at, scopes; first 10 chars of token.

### Fields that identify the credential
- `authorization_type` (access log): 'bearer' marks OAuth token use
- `id` (OAuth Tokens API): Token record ID used for revocation
- `client_id` (OAuth Tokens API): OAuth client that owns the token
- `token` (OAuth Tokens API): First 10 characters only; match against a leaked token
- `used_at` (OAuth Tokens API): Last time the token authenticated
- `user_id` (OAuth Tokens API / access log): User the token acts as (client credentials: the client creator)

### Lifecycle events
No docs found.

### Correlate on
`user_id`, `ip_address`, `client`, `authorization_type`, `url`, `method`, `status`, `timestamp`, `client_id`, `actor_id`

### API calls a holder can make, and whether they are logged
- collection: `GET /api/v2/users/{user_id}`. user profile Logged: plan (`Show user`). Recorded in the access log only with the ADPP add-on, after it is turned on; 90-day window; shows actor and authorization type, not a token ID.

### What to look for (analyst guidance)
- bearer requests for a user_id from a new IP or client string
- Token used_at recent for a client or user expected to be idle
- Client-credentials activity attributed to an admin who did not run it
- Bulk export-style URLs (search, incremental exports) under bearer auth outside normal hours
- New OAuth client created shortly before unusual bearer traffic

### Sample query (Zendesk Access Logs API filter parameters)
See every OAuth-authenticated request for one user, with IP and client.

```
GET /api/v2/access_logs?filter[start]=2026-10-01T00:00:00Z&filter[end]=2026-10-12T00:00:00Z&filter[user_id]=123&filter[graphql]=true  -- keep rows where authorization_type == 'bearer'
```

## Respond: how to revoke it
- Admin: **View and delete OAuth tokens**. Admins can list a client's tokens, view their scopes, and delete (revoke) individual tokens. Where: Admin Center > Apps and integrations > APIs > OAuth clients > View tokens > Delete.
- Admin: **Delete OAuth client**. Deleting a client deactivates every access token it issued; permanent. Where: Admin Center > Apps and integrations > APIs > OAuth clients > Delete.

DELETE /api/v2/oauth/tokens/{id} (or POST /api/v2/oauth/tokens/delete_many); for a leaked client secret, PUT /api/v2/oauth/clients/{id}/generate_secret or DELETE the client. Live access ends on revocation: yes. Revoking a token record ends that token. Effect of client deletion on existing tokens not documented. Non-expiring legacy tokens persist until revoked.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Audit log source_type/action values for OAuth client and token create/revoke
- client_id in access logs
- Effect of deleting an OAuth client on live tokens
- Token format/prefix
- No account-wide switch to disable OAuth found; OAuth "is managed separately" from the API configuration page.
- Whether admins can block or scope third-party global OAuth clients (marketplace apps) beyond deleting their tokens.
- Whether requiring SSO affects API token or OAuth token use.
- Plan requirement for the Manage APIs custom-role permission (custom roles are typically Enterprise) not confirmed.

## Sources
- [Creating and using OAuth access tokens with the API - Zendesk](https://developer.zendesk.com/documentation/authentication/creating-and-using-oauth-tokens-with-the-api/) (retrieved 2026-10-09)
- [Using OAuth to authenticate API requests | Zendesk Developer Docs](https://developer.zendesk.com/documentation/authentication/api-tokens-to-oauth/) (retrieved 2026-10-09)
- [Announcing the required expiration of global OAuth access and refresh ...](https://support.zendesk.com/hc/en-us/articles/10212201463962-Announcing-the-required-expiration-of-global-OAuth-access-and-refresh-tokens) (retrieved 2026-10-09)
- [Announcing the removal of API tokens as an authentication method for API requests – Zendesk help](https://support.zendesk.com/hc/en-us/articles/10840968198042-Announcing-the-removal-of-API-tokens-as-an-authentication-method-for-API-requests) (retrieved 2026-10-09)
- [OAuth Tokens for Grant Types | Zendesk Developer Docs](https://developer.zendesk.com/api-reference/ticketing/oauth/grant_type_tokens/) (retrieved 2026-10-09)
- [Restricting access to Zendesk using IP restrictions – Zendesk help](https://support.zendesk.com/hc/en-us/articles/4408894156186) (retrieved 2026-10-09)
- [Using OAuth to authenticate API requests | Zendesk Developer Docs](https://developer.zendesk.com/documentation/authentication/api-tokens-to-oauth/) (retrieved 2026-10-09)
- [Working with OAuth refresh tokens | Zendesk Developer Docs](https://developer.zendesk.com/documentation/authentication/refresh-token/) (retrieved 2026-10-09)
- [Using OAuth authentication with your application](https://support.zendesk.com/hc/en-us/articles/4408845965210-Using-OAuth-authentication-with-your-application) (retrieved 2026-10-14)
- [Managing OAuth token access to the API](https://support.zendesk.com/hc/en-us/articles/8889508417946-Managing-OAuth-token-access-to-the-API) (retrieved 2026-10-14)
- [Zendesk OAuth Tokens API](https://developer.zendesk.com/api-reference/ticketing/oauth/oauth_tokens/) (retrieved 2026-10-12)
- [Using the access log to monitor agent activity (ADPP add-on)](https://support.zendesk.com/hc/en-us/articles/6066010357530-Using-the-access-log-to-monitor-agent-activity-ADPP-add-on) (retrieved 2026-10-14)
- [Access log use cases and workflows (ADPP add-on)](https://support.zendesk.com/hc/en-us/articles/9972142485530-Access-log-use-cases-and-workflows-ADPP-add-on) (retrieved 2026-10-14)
- [Zendesk Access Logs API](https://developer.zendesk.com/api-reference/ticketing/account-configuration/access_logs/) (retrieved 2026-10-12)
- [Downgrading and removing an agent](https://support.zendesk.com/hc/en-us/articles/4408888690842-Downgrading-and-removing-an-agent) (retrieved 2026-10-14)
- [Users](https://developer.zendesk.com/api-reference/ticketing/users/users/) (retrieved 2026-10-14)
- [Zendesk Audit Logs API](https://developer.zendesk.com/api-reference/ticketing/account-configuration/audit_logs/) (retrieved 2026-10-12)
- [Zendesk OAuth Clients API](https://developer.zendesk.com/api-reference/ticketing/oauth/oauth_clients/) (retrieved 2026-10-12)
- [Migrating from API tokens to OAuth access tokens](https://developer.zendesk.com/documentation/authentication/oauth-migration/) (retrieved 2026-10-12)
- [Using OAuth authentication with your application](https://support.zendesk.com/hc/en-us/articles/4408845965210) (retrieved 2026-10-13)
- [Managing OAuth token access to the API](https://support.zendesk.com/hc/en-us/articles/8889508417946) (retrieved 2026-10-13)
- [Creating and using OAuth tokens with the API](https://developer.zendesk.com/documentation/api-basics/authentication/creating-and-using-oauth-tokens-with-the-api/) (retrieved 2026-10-13)
