# 1Password: Connect server access token

`onepassword-2` · Signed JWT · service. Apps send a bearer token to a self-hosted Connect server. The server itself authenticates to 1Password with the 1password-credentials.json file. Tokens are ES256-signed and valid only for their server.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | 1Password.com Developer > Connect servers > (Secrets Automation environment) lists that environment's access tokens. | 1Password.com Developer > Connect servers > (Secrets Automation environment) lists that environment's access tokens. |
| Protect: Admin can block or require approval | Yes (requires Teams or Business) | Secrets Automation managers / environment permissions | Secrets Automation managers / environment permissions: Developer > Permissions > Secrets Automation |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Connect server runs in customer infrastructure; network exposure is the customer's choice. No vendor IP control for tokens documented. |  |
| Protect: Expires automatically | Yes | Optional 30/90/180 days; otherwise no expiry stated | Connect token Expires After: Developer > Connect servers > [environment] > New Token > Expires After |
| Detect: Usage appears in logs | Yes | actor.jti, actor.id | Connect GET /v1/activity: Per-server API request log with actor.jti, ip, userAgent, action, result · Item usage report / itemusages: Used by = Connect server name, not token; action Display / server-fetch; can lose data when offline |
| Detect: Data reads appear in logs | Yes | server-fetch | API: POST /api/v2/itemusages (Events API; filter results on action = "server-fetch") |
| Respond: Revocation ends active access | No docs found | Immediate effect not stated. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Vault permissions at creation** (Limit scope; all plans; default varies). Vaults and read/write/share permissions are chosen at creation and cannot be changed later. Where: Service account wizard / op service-account create --vault; Connect New Token.
- **Secrets Automation managers / environment permissions** (Require approval; Teams or Business; default unknown). Limits which groups can manage Connect servers and tokens, globally or per environment. Where: Developer > Permissions > Secrets Automation.
- **Connect token Expires After** (Limit lifetime; all plans; default unknown). Token is revoked automatically after 30, 90 or 180 days. Where: Developer > Connect servers > [environment] > New Token > Expires After.

### Not available (vendor states)
- Connect tokens cannot be changed or updated; rotation means create new and revoke old.

- Network: unknown (checked at unknown). Connect server runs in customer infrastructure; network exposure is the customer's choice. No vendor IP control for tokens documented.
- Lifetime: Optional 30/90/180 days; otherwise no expiry stated. Renewal: Create new, update references, revoke old.
- Keyless option: not_applicable. Bearer token issued by 1Password; no IdP involvement documented.
- Conditions: Available to all 1Password customers since Feb 27, 2025.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Connect GET /v1/activity: Per-server API request log with actor.jti, ip, userAgent, action, result
- Item usage report / itemusages: Used by = Connect server name, not token; action Display / server-fetch; can lose data when offline

### Fields that identify the credential
- `actor.jti` (Connect /v1/activity): Token UUID
- `actor.id` (Connect /v1/activity): Connect server UUID

### Lifecycle events
No docs found.

### Correlate on
`actor.jti`, `actor.ip`, `requestID`, `Connect server name`

### API calls a holder can make, and whether they are logged
- discovery: `GET /v1/vaults`. Vaults the token can access Logged: yes. Connect /v1/activity records READ on VAULT
- enumeration (bulk): `GET /v1/vaults/{vaultUUID}/items`. Items in vault Logged: yes. Connect /v1/activity
- collection: `GET /v1/vaults/{vaultUUID}/items/{itemUUID}`. Item fields/secrets Logged: yes (`server-fetch`). /v1/activity plus item usage report

### What to look for (analyst guidance)
- Requests from unexpected IPs in /v1/activity
- Bursts of READ across many vaults
- DENY results

## Respond: how to revoke it
- Admin: **Revoke (Connect token)**. Revokes a Connect server access token. Where: Developer > Connect servers > [environment] > gear > Revoke.

Developer > Connect servers > environment > gear > Revoke; or remove vault access from the environment. Live access ends on revocation: unknown. Immediate effect not stated.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Revocation ends active access
- Stops working when user is removed
- Audit log event names for Connect token create/revoke
- Retention of /v1/activity
- Whether Business firewall rules apply to service account, Connect, Events API or Users API requests.
- Whether Unlock with SSO / IdP policies affect service accounts (service_account_sso_denied is undocumented).
- Whether audit log records Connect token, Events API token, SCIM credential regeneration or OAuth application create/revoke (only service account and satoken events are listed).
- Whether Events API, Users API or SCIM calls themselves are logged anywhere customer-visible.
- Whether a revoked Connect token or regenerated SCIM token stops working immediately.
- Maximum value for service account --expires-in.
- Whether the itemusages Events API feed includes service account item access (usage reports do).

## Sources
- [About 1Password Connect Server security](https://www.1password.dev/connect/security) (retrieved 2026-10-14)
- [Manage Connect servers](https://www.1password.dev/connect/manage-connect) (retrieved 2026-10-14)
- [1Password Events API reference](https://www.1password.dev/events-api/reference) (retrieved 2026-10-14)
- [Item usage actions](https://www.1password.dev/events-api/item-usage-actions) (retrieved 2026-10-14)
- [1Password Connect Server API reference](https://www.1password.dev/connect/api-reference) (retrieved 2026-10-14)
- [Get started with 1Password Service Accounts](https://www.1password.dev/service-accounts/get-started) (retrieved 2026-10-14)
