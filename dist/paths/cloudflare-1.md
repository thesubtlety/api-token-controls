# Cloudflare: User API tokens

`cloudflare-1` · Personal access token · person. Bearer token (cfut_ prefix) created under My Profile > API Tokens. Acts for one user with a subset of that user's permissions, scoped per account/zone/permission group.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | GET /user/tokens lists only tokens the caller created; admins see other users' token use only via audit log actor.token_id. | GET /user/tokens lists only tokens the caller created; admins see other users' token use only via audit log actor.token_id. |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | Enable API Access / API Access (member-level) | Enable API Access / API Access (member-level): Members page > Enable API Access; per member: API Access |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Per-token Client IP Address Filtering on API requests; off by default; not applied to the Verify Token endpoint. | Client IP Address Filtering: API token > Client IP Address Filtering; condition.request.ip |
| Protect: Expires automatically | Partial | Never expires by default; optional not_before/expires_on TTL Admin control: TTL (not_before / expires_on). | TTL (not_before / expires_on): API token > TTL |
| Detect: Usage appears in logs | Yes | actor.token_id, actor.token_name, actor.context, ActorTokenDetails | Audit Logs v2: All plans; 18 months; API GET /accounts/{account_id}/logs/audit; dashboard hides view actions by default and queries 90 days. · Logpush audit_logs_v2 dataset: Enterprise needed beyond 18 months. |
| Detect: Data reads appear in logs | Yes | GET /accounts/{account_id}/members | Where: Manage Account > Audit Logs > remove the 'Action type is not view' filter (or set Action type = view) · API: GET /accounts/{account_id}/logs/audit?action_type=view&actor_token_id={token_id}&since=...&before=... |
| Respond: Revocation ends active access | No docs found | Roll invalidates the previous token; propagation time not stated. |  |
| Respond: Stops working when user is removed | Yes | User tokens inherit the user's permissions; docs warn a user token breaks when the user's policies are revoked. R2 docs say user tokens go inactive when the user is removed. | Where: Manage Account > Members > expand member > Revoke > Yes, revoke access · API: DELETE /accounts/{account_id}/members/{member_id} |

## Protect: what an admin can configure

### Admin controls
- **Client IP Address Filtering** (Limit network; all plans; default off). Token only works from listed CIDRs (verify endpoint excepted). Where: API token > Client IP Address Filtering; condition.request.ip.
- **TTL (not_before / expires_on)** (Limit lifetime; all plans; default off). Sets when a token starts and stops being valid. Where: API token > TTL.
- **Token permissions and resources** (Limit scope; all plans; default varies). Limits a token to chosen permission groups, accounts, zones or R2 buckets. Where: API token > Permissions / Resources.
- **Enable API Access / API Access (member-level)** (Disable; Enterprise; default unknown). Enterprise Super Administrators can turn off API access for the whole account or for specific members; member settings override the account setting. Where: Members page > Enable API Access; per member: API Access.

### Not available (vendor states)
- IP filter does not apply to the Verify Token endpoint.

- Network: supported (checked at api_request). Per-token Client IP Address Filtering on API requests; off by default; not applied to the Verify Token endpoint.
- Lifetime: Never expires by default; optional not_before/expires_on TTL. Renewal: Roll generates a new secret with the same permissions and invalidates the old one.
- Keyless option: not_verified. Dashboard SSO is a login control. Docs tell admins to keep an API token to disable SSO if the IdP locks them out, which implies tokens are not checked against the IdP; no doc states this outright.
- Conditions: null

## Detect: what gets logged
- Token prefix: `cfut_`

### Logs
- Audit Logs v2: All plans; 18 months; API GET /accounts/{account_id}/logs/audit; dashboard hides view actions by default and queries 90 days.
- Logpush audit_logs_v2 dataset: Enterprise needed beyond 18 months.

### Fields that identify the credential
- `actor.token_id` (Audit Logs v2): When actor.context is api_token or oauth
- `actor.token_name` (Audit Logs v2): 
- `actor.context` (Audit Logs v2): api_token / api_key / origin_ca_key / dash / oauth
- `ActorTokenDetails` (Logpush audit_logs_v2): 

### Lifecycle events
- create: `unknown` Token create is a /user action; exact action name not documented
- revoke: `unknown` Delete/roll exact action names not documented

### Correlate on
`actor.token_id`, `actor.ip_address`, `raw.cf_ray_id`, `actor.email`

### API calls a holder can make, and whether they are logged
- recon: `GET /user/tokens/verify`. Token id, status, expiry Logged: unknown. IP filter not applied to this endpoint
- discovery (bulk): `GET /accounts`. Accounts reachable Logged: unknown. v2 logs view actions on /accounts endpoints, with some exclusions
- enumeration (bulk): `GET /zones`. All zones Logged: unknown. v2 logs view actions on /zones endpoints, with some exclusions
- collection (bulk): `GET /zones/{zone_id}/dns_records/export`. Full BIND zone file Logged: unknown. Possibly a view action; not confirmed per endpoint
- recon (bulk): `GET /accounts/{account_id}/logs/audit`. Audit trail Logged: unknown. 
- collection: `GET /accounts/{account_id}/members`. All account members Logged: yes. Audit Logs v2 records view actions on /accounts endpoints (action type view, hidden in dashboard by default; available via API/Logpush). actor.context api_token and actor.token_id identify the token.

### What to look for (analyst guidance)
- view actions from a token on many zones
- token used from new IP
- token minting tokens (API Tokens Write)
- GitHub leak notification email

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **Delete / roll API token**. Deleting or rolling invalidates the token secret. Where: DELETE /user/tokens/{token_id}; DELETE /accounts/{account_id}/tokens/{token_id}; PUT /user/tokens/{token_id}/value.
- Admin: **Remove member from account**. User tokens become inactive when the user is removed. Where: Manage Account > Members.
- Admin: **Leaked token detection (GitHub Secret Scanning)**. Tokens leaked in public GitHub repos are auto-revoked; private-repo leaks only notify. Where: Automatic.

Delete or roll the token (DELETE /user/tokens/{token_id}); remove the user from the account if needed. Live access ends on revocation: unknown. Roll invalidates the previous token; propagation time not stated.

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- Exact create/delete action strings
- Per-endpoint audit coverage of GET calls
- Any account-level setting to block members from creating user API tokens or using the Global API Key.
- Any account-wide policy forcing token expiry or IP filters.
- Whether Super Administrators can list or revoke other members' user API tokens.
- Whether dashboard SSO or Access policies are checked on API token / Global API Key requests (no explicit statement).
- Exact Audit Logs v2 action names for token create/delete/roll.
- Whether Origin CA keys still authenticate after the 2026-09-30 removal date.
- IP restrictions for Access service tokens and for R2 S3 requests.
- Cloudflare OAuth tokens (actor context 'oauth', e.g. Wrangler) were not researched.

## Sources
- [Create API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) (retrieved 2026-10-14)
- [Set up dashboard SSO](https://developers.cloudflare.com/fundamentals/manage-members/dashboard-sso/) (retrieved 2026-10-14)
- [Restrict tokens](https://developers.cloudflare.com/fundamentals/api/how-to/restrict-tokens/) (retrieved 2026-10-14)
- [Create tokens via API](https://developers.cloudflare.com/fundamentals/api/how-to/create-via-api/) (retrieved 2026-10-14)
- [Roll tokens](https://developers.cloudflare.com/fundamentals/api/how-to/roll-token/) (retrieved 2026-10-14)
- [Roll Token](https://developers.cloudflare.com/api/resources/user/subresources/tokens/subresources/value/methods/update/) (retrieved 2026-10-14)
- [R2 Authentication](https://developers.cloudflare.com/r2/api/tokens/) (retrieved 2026-10-14)
- [SCIM provisioning](https://developers.cloudflare.com/fundamentals/account/account-security/scim-setup/) (retrieved 2026-10-14)
- [List Tokens (user)](https://developers.cloudflare.com/api/resources/user/subresources/tokens/methods/list/) (retrieved 2026-10-14)
- [Audit Logs - version 2](https://developers.cloudflare.com/fundamentals/account/account-security/audit-logs/) (retrieved 2026-10-14)
- [Get account audit logs (Version 2)](https://developers.cloudflare.com/api/resources/accounts/subresources/logs/subresources/audit/methods/list/) (retrieved 2026-10-14)
- [Manage (account members)](https://developers.cloudflare.com/fundamentals/manage-members/manage/) (retrieved 2026-10-14)
- [Token formats](https://developers.cloudflare.com/fundamentals/api/get-started/token-formats/) (retrieved 2026-10-14)
- [Audit Logs V2 (Logpush dataset)](https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/account/audit_logs_v2/) (retrieved 2026-10-14)
- [Delete Token](https://developers.cloudflare.com/api/resources/user/subresources/tokens/methods/delete/) (retrieved 2026-10-14)
- [Verify Token](https://developers.cloudflare.com/api/resources/user/subresources/tokens/methods/verify/) (retrieved 2026-10-14)
- [List Accounts](https://developers.cloudflare.com/api/resources/accounts/methods/list/) (retrieved 2026-10-14)
- [List Zones](https://developers.cloudflare.com/api/resources/zones/methods/list/) (retrieved 2026-10-14)
- [Export DNS Records](https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/export/) (retrieved 2026-10-14)
- [List Members](https://developers.cloudflare.com/api/resources/accounts/subresources/members/methods/list/) (retrieved 2026-10-14)
- [Account API tokens](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/) (retrieved 2026-10-14)
- [Delete Token (account)](https://developers.cloudflare.com/api/resources/accounts/subresources/tokens/methods/delete/) (retrieved 2026-10-14)
- [Control API Access](https://developers.cloudflare.com/fundamentals/api/how-to/control-api-access/) (retrieved 2026-10-14)
