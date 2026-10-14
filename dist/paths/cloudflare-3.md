# Cloudflare: Global API Key (legacy)

`cloudflare-3` · API key / token · person. One key per user (cfk_ prefix for new/rolled keys), sent with X-Auth-Email and X-Auth-Key headers; has every permission the user has on every resource.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | No admin list of Global API Keys found; key use shows in audit logs with actor.context api_key. | API: GET /accounts/{account_id}/logs/audit?actor_context=api_key (lists users whose Global API Key was used; no key list exists) |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | Enable API Access / API Access (member-level) | Enable API Access / API Access (member-level): Members page > Enable API Access; per member: API Access |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Not available | Docs list lack of IP and time limits as a Global API key limitation. |  |
| Protect: Expires automatically | Not available | No expiry option |  |
| Detect: Usage appears in logs | Yes | actor.context, actor.email | Where: Manage Account > Audit Logs · API: GET /accounts/{account_id}/logs/audit?actor_context=api_key&actor_email={email} |
| Detect: Data reads appear in logs | Yes | GET /accounts/{account_id}/members | Where: Manage Account > Audit Logs > set Action type = view · API: GET /accounts/{account_id}/logs/audit?action_type=view&actor_context=api_key |
| Respond: Revocation ends active access | No docs found | Change the Global API Key in My Profile > API Tokens. |  |
| Respond: Stops working when user is removed | Yes | The key has exactly the user's permissions, so removing the member's account access removes the key's access to that account. | Where: Manage Account > Members > expand member > Revoke > Yes, revoke access · API: DELETE /accounts/{account_id}/members/{member_id} |

## Protect: what an admin can configure

### Admin controls
- **Enable API Access / API Access (member-level)** (Disable; Enterprise; default unknown). Enterprise Super Administrators can turn off API access for the whole account or for specific members; member settings override the account setting. Where: Members page > Enable API Access; per member: API Access.

### Not available (vendor states)
- No IP restriction or expiry for the Global API Key.
- Global API Key cannot be limited to specific resources or permissions.

- Network: not_supported (checked at unknown). Docs list lack of IP and time limits as a Global API key limitation.
- Lifetime: No expiry option. Renewal: Change (roll) the key under My Profile > API Tokens > API Keys.
- Keyless option: not_verified. No doc ties Global API Key use to dashboard SSO.
- Conditions: null

## Detect: what gets logged
- Token prefix: `cfk_`

### Logs
- Audit Logs v2: actor.context = api_key

### Fields that identify the credential
- `actor.context` (Audit Logs v2): api_key; no token_id (field only set for api_token/oauth)
- `actor.email` (Audit Logs v2): Owning user

### Lifecycle events
- revoke: `unknown` Key change event name not documented

### Correlate on
`actor.email`, `actor.ip_address`, `actor.context`

### API calls a holder can make, and whether they are logged
- recon: `GET /user`. Email, name, account memberships Logged: unknown. /user endpoints are in v2 coverage
- enumeration (bulk): `GET /zones`. All zones of the user Logged: unknown. actor.context api_key
- collection: `GET /accounts/{account_id}/members`. All account members Logged: yes. Logged as a view action in Audit Logs v2; actor.context is api_key with the user's actor.email/id (no per-key ID).

### What to look for (analyst guidance)
- Any api_key context activity if you have migrated to tokens

## Respond: how to revoke it
- Admin: **Leaked token detection (GitHub Secret Scanning)**. Tokens leaked in public GitHub repos are auto-revoked; private-repo leaks only notify. Where: Automatic.
- Admin: **Change Global API Key**. Replaces the user's Global API Key. Where: My Profile > API Tokens > API Keys > Change.

Change the Global API Key in My Profile > API Tokens. Live access ends on revocation: unknown. 

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- Whether key change is audit logged
- Any account-level setting to block members from creating user API tokens or using the Global API Key.
- Any account-wide policy forcing token expiry or IP filters.
- Whether Super Administrators can list or revoke other members' user API tokens.
- Whether dashboard SSO or Access policies are checked on API token / Global API Key requests (no explicit statement).
- Exact Audit Logs v2 action names for token create/delete/roll.
- Whether Origin CA keys still authenticate after the 2026-09-30 removal date.
- IP restrictions for Access service tokens and for R2 S3 requests.
- Cloudflare OAuth tokens (actor context 'oauth', e.g. Wrangler) were not researched.

## Sources
- [Get Global API key (legacy)](https://developers.cloudflare.com/fundamentals/api/get-started/keys/) (retrieved 2026-10-14)
- [User Details](https://developers.cloudflare.com/api/resources/user/methods/get/) (retrieved 2026-10-14)
- [Set up dashboard SSO](https://developers.cloudflare.com/fundamentals/manage-members/dashboard-sso/) (retrieved 2026-10-14)
- [Audit Logs - version 2](https://developers.cloudflare.com/fundamentals/account/account-security/audit-logs/) (retrieved 2026-10-14)
- [Get account audit logs (Version 2)](https://developers.cloudflare.com/api/resources/accounts/subresources/logs/subresources/audit/methods/list/) (retrieved 2026-10-14)
- [Manage (account members)](https://developers.cloudflare.com/fundamentals/manage-members/manage/) (retrieved 2026-10-14)
- [List Zones](https://developers.cloudflare.com/api/resources/zones/methods/list/) (retrieved 2026-10-14)
- [List Members](https://developers.cloudflare.com/api/resources/accounts/subresources/members/methods/list/) (retrieved 2026-10-14)
- [Token formats](https://developers.cloudflare.com/fundamentals/api/get-started/token-formats/) (retrieved 2026-10-14)
- [Control API Access](https://developers.cloudflare.com/fundamentals/api/how-to/control-api-access/) (retrieved 2026-10-14)
