# Cloudflare: Origin CA key (Service Key, deprecated)

`cloudflare-4` · API key / token · person · legacy. Key starting v1.0- sent in X-AUTH-USER-SERVICE-KEY for the Origin CA certificates API and Keyless SSL. Scheduled for removal on 2026-09-30.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | No admin list of Origin CA keys found; use shows in audit logs with actor.context origin_ca_key. | API: GET /accounts/{account_id}/logs/audit?actor_context=origin_ca_key (shows users whose key was used; no key list exists) |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No IP option documented. |  |
| Protect: Expires automatically | Not available | Valid until Change; service ends 2026-09-30 per deprecation notice |  |
| Detect: Usage appears in logs | Yes | actor.context | Where: Manage Account > Audit Logs · API: GET /accounts/{account_id}/logs/audit?actor_context=origin_ca_key |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | Yes | Change immediately invalidates all prior values. | Where: User Profile > API Tokens > API Keys > Origin CA Key > Change |
| Respond: Stops working when user is removed | Yes | The key reaches every account the user can access, so removing the user's membership removes that account from its reach. | Where: Manage Account > Members > expand member > Revoke > Yes, revoke access (removes that account from the key's reach) · API: DELETE /accounts/{account_id}/members/{member_id} |

## Protect: what an admin can configure

### Admin controls
No docs found.

### Not available (vendor states)
- Changing the Origin CA key is not recorded in Audit Logs.

- Network: unknown (checked at unknown). No IP option documented.
- Lifetime: Valid until Change; service ends 2026-09-30 per deprecation notice. Renewal: Each view shows a different value; all are valid until Change.
- Keyless option: not_verified. No doc ties it to SSO.
- Conditions: Verify whether keys still work after 2026-09-30.

## Detect: what gets logged
- Token prefix: `v1.0-`

### Logs
- Audit Logs v2: actor.context = origin_ca_key for actions; key changes not logged.

### Fields that identify the credential
- `actor.context` (Audit Logs v2): origin_ca_key

### Lifecycle events
No docs found.

### Correlate on
`actor.email`, `actor.ip_address`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Any origin_ca_key activity after the deprecation date

## Respond: how to revoke it
- Admin: **Change Origin CA key**. Immediately invalidates all previously shown Origin CA key values. Where: User Profile > API Tokens > API Keys > Origin CA Key > Change.

Click Change on the Origin CA key; move integrations to an API token with SSL and Certificates Edit. Live access ends on revocation: yes. Change immediately invalidates all prior values.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Post-EOL behavior
- Origin CA certificate API calls not researched
- Any account-level setting to block members from creating user API tokens or using the Global API Key.
- Any account-wide policy forcing token expiry or IP filters.
- Whether Super Administrators can list or revoke other members' user API tokens.
- Whether dashboard SSO or Access policies are checked on API token / Global API Key requests (no explicit statement).
- Exact Audit Logs v2 action names for token create/delete/roll.
- Whether Origin CA keys still authenticate after the 2026-09-30 removal date.
- IP restrictions for Access service tokens and for R2 S3 requests.
- Cloudflare OAuth tokens (actor context 'oauth', e.g. Wrangler) were not researched.

## Sources
- [Get Origin CA keys](https://developers.cloudflare.com/fundamentals/api/get-started/ca-keys/) (retrieved 2026-10-14)
- [API deprecations](https://developers.cloudflare.com/fundamentals/api/reference/deprecations/) (retrieved 2026-10-14)
- [Audit Logs - version 2](https://developers.cloudflare.com/fundamentals/account/account-security/audit-logs/) (retrieved 2026-10-14)
- [Get account audit logs (Version 2)](https://developers.cloudflare.com/api/resources/accounts/subresources/logs/subresources/audit/methods/list/) (retrieved 2026-10-14)
- [Manage (account members)](https://developers.cloudflare.com/fundamentals/manage-members/manage/) (retrieved 2026-10-14)
