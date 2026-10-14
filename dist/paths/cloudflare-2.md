# Cloudflare: Account API tokens

`cloudflare-2` · API key / token · service. Bearer token (cfat_ prefix) owned by the account, not a user; acts as a service principal with its own permissions.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Super Administrators see all account API tokens on Manage account > Account API tokens; API: GET /accounts/{account_id}/tokens. | Super Administrators see all account API tokens on Manage account > Account API tokens; API: GET /accounts/{account_id}/tokens. |
| Protect: Admin can block or require approval | Yes | API Token Provisioning capability | API Token Provisioning capability: Manage Account > Members roles |
| Protect: SSO and MFA rules apply | Not available | Cloudflare tells admins to keep an Account API token as a way to call the API and disable SSO if locked out, so these tokens work outside dashboard SSO. |  |
| Protect: IP restriction | Yes | Client IP filter (request.ip condition) available via API; dashboard flow documents only optional expiry. | Client IP Address Filtering: API token > Client IP Address Filtering; condition.request.ip |
| Protect: Expires automatically | Partial | Valid until revoked or optional expiration date Admin control: TTL (not_before / expires_on). | TTL (not_before / expires_on): API token > TTL |
| Detect: Usage appears in logs | Yes | actor.token_id, actor.token_name | Where: Manage Account > Audit Logs > filter on token · API: GET /accounts/{account_id}/logs/audit?actor_token_id={token_id} (or actor_token_name=...; actor_type=account) |
| Detect: Data reads appear in logs | Yes | GET /accounts/{account_id}/members | Where: Manage Account > Audit Logs > set Action type = view · API: GET /accounts/{account_id}/logs/audit?action_type=view&actor_token_id={token_id} |
| Respond: Revocation ends active access | No docs found | Token survives member removal; must be deleted. |  |
| Respond: Stops working when user is removed | N/A | Account API tokens are owned by the account and keep working after the creating user leaves. |  |

## Protect: what an admin can configure

### Admin controls
- **Client IP Address Filtering** (Limit network; all plans; default off). Token only works from listed CIDRs (verify endpoint excepted). Where: API token > Client IP Address Filtering; condition.request.ip.
- **TTL (not_before / expires_on)** (Limit lifetime; all plans; default off). Sets when a token starts and stops being valid. Where: API token > TTL.
- **Token permissions and resources** (Limit scope; all plans; default varies). Limits a token to chosen permission groups, accounts, zones or R2 buckets. Where: API token > Permissions / Resources.
- **API Token Provisioning capability** (Require approval; all plans; default unknown). Only members with this capability or Super Administrator can create account tokens. Where: Manage Account > Members roles.

- Network: supported (checked at api_request). Client IP filter (request.ip condition) available via API; dashboard flow documents only optional expiry.
- Lifetime: Valid until revoked or optional expiration date. Renewal: Roll or recreate; survives member removal.
- Keyless option: not_applicable. Not tied to a user, so dashboard SSO does not apply.
- Conditions: Some products do not support account tokens yet.

## Detect: what gets logged
- Token prefix: `cfat_`

### Logs
- Audit Logs v2: 18 months; also Logpush.

### Fields that identify the credential
- `actor.token_id` (Audit Logs v2): 
- `actor.token_name` (Audit Logs v2): 

### Lifecycle events
- create: `unknown` Account token metadata includes creator attribution

### Correlate on
`actor.token_id`, `actor.ip_address`, `raw.cf_ray_id`

### API calls a holder can make, and whether they are logged
- recon: `GET /accounts/{account_id}/tokens/verify`. Token status Logged: unknown. 
- collection: `GET /accounts/{account_id}/members`. All account members Logged: yes. Logged as a view action in Audit Logs v2 with actor_type "account" and actor.token_id.

### What to look for (analyst guidance)
- Account token created by non-admin with provisioning capability
- Use from new IP

## Respond: how to revoke it
- Admin: **Delete / roll API token**. Deleting or rolling invalidates the token secret. Where: DELETE /user/tokens/{token_id}; DELETE /accounts/{account_id}/tokens/{token_id}; PUT /user/tokens/{token_id}/value.
- Admin: **Leaked token detection (GitHub Secret Scanning)**. Tokens leaked in public GitHub repos are auto-revoked; private-repo leaks only notify. Where: Automatic.

DELETE /accounts/{account_id}/tokens/{token_id} or roll. Live access ends on revocation: unknown. Token survives member removal; must be deleted.

## No vendor documentation found
- Revocation ends active access
- Exact create/delete action strings
- Other calls as cloudflare-1 within granted permissions
- Any account-level setting to block members from creating user API tokens or using the Global API Key.
- Any account-wide policy forcing token expiry or IP filters.
- Whether Super Administrators can list or revoke other members' user API tokens.
- Whether dashboard SSO or Access policies are checked on API token / Global API Key requests (no explicit statement).
- Exact Audit Logs v2 action names for token create/delete/roll.
- Whether Origin CA keys still authenticate after the 2026-09-30 removal date.
- IP restrictions for Access service tokens and for R2 S3 requests.
- Cloudflare OAuth tokens (actor context 'oauth', e.g. Wrangler) were not researched.

## Sources
- [Account API tokens](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/) (retrieved 2026-10-14)
- [Set up dashboard SSO](https://developers.cloudflare.com/fundamentals/manage-members/dashboard-sso/) (retrieved 2026-10-14)
- [Create tokens via API](https://developers.cloudflare.com/fundamentals/api/how-to/create-via-api/) (retrieved 2026-10-14)
- [Restrict tokens](https://developers.cloudflare.com/fundamentals/api/how-to/restrict-tokens/) (retrieved 2026-10-14)
- [R2 Authentication](https://developers.cloudflare.com/r2/api/tokens/) (retrieved 2026-10-14)
- [List Tokens (account)](https://developers.cloudflare.com/api/resources/accounts/subresources/tokens/methods/list/) (retrieved 2026-10-14)
- [Audit Logs - version 2](https://developers.cloudflare.com/fundamentals/account/account-security/audit-logs/) (retrieved 2026-10-14)
- [Get account audit logs (Version 2)](https://developers.cloudflare.com/api/resources/accounts/subresources/logs/subresources/audit/methods/list/) (retrieved 2026-10-14)
- [Delete Token (account)](https://developers.cloudflare.com/api/resources/accounts/subresources/tokens/methods/delete/) (retrieved 2026-10-14)
- [Verify Token (account)](https://developers.cloudflare.com/api/resources/accounts/subresources/tokens/methods/verify/) (retrieved 2026-10-14)
- [List Members](https://developers.cloudflare.com/api/resources/accounts/subresources/members/methods/list/) (retrieved 2026-10-14)
- [Create API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) (retrieved 2026-10-14)
- [Roll tokens](https://developers.cloudflare.com/fundamentals/api/how-to/roll-token/) (retrieved 2026-10-14)
- [Delete Token](https://developers.cloudflare.com/api/resources/user/subresources/tokens/methods/delete/) (retrieved 2026-10-14)
- [Roll Token](https://developers.cloudflare.com/api/resources/user/subresources/tokens/subresources/value/methods/update/) (retrieved 2026-10-14)
- [Token formats](https://developers.cloudflare.com/fundamentals/api/get-started/token-formats/) (retrieved 2026-10-14)
