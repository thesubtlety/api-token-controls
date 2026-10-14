# Stripe: Secret / restricted API key

`stripe-1` · API key / token · service. Account-level secret (sk_live_/sk_test_) or restricted (rk_live_/rk_test_) API key, sent in the Authorization header on each request. This includes managed keys that a hosting platform or an approved Stripe App creates through the API, and restricted keys a Stripe App generates for a user at install. Organization keys and OAuth tokens are separate paths.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | The API keys page in the Dashboard (Standard keys and Restricted keys lists) shows all keys for the account. | The API keys page in the Dashboard (Standard keys and Restricted keys lists) shows all keys for the account. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Access policies, which replaced the older per-key IP address restrictions, can be attached to standard (secret) and restricted keys. A policy either allows IPv4 addresses/CIDR ranges, or (advanced) allows ASNs and countries and blocks anonymous VPN, proxy and Tor sources. Stripe blocks requests that fail the policy. | Access policies (IP addresses / Advanced): Developers > Access policies; API keys > key ⋯ > Manage access policy |
| Protect: Expires automatically | Partial | Until revoked/expired/rolled Admin control: Rotate API key (scheduled). | Rotate API key (scheduled): Developers > API keys > key ⋯ > Rotate key |
| Detect: Usage appears in logs | Yes | actor.api_key.id, details.api_key.id, details.api_key.new_key, details.api_key.managed_by.application.id, request.id | Activity Logs API (/v2/iam/activity_logs): Public preview. Key lifecycle (api_key_created/updated/deleted/viewed) with actor and key details. 6-month retention; >=10 min delay; rotation events may be missing for some accounts. No IP field documented. · Dashboard security history: Dashboard view of the same security history; exact fields not documented. · Workbench request logs (per key: View request logs): Per-request API logs filterable by date, status, method, endpoint, IP address, source, account, API version, error code/type. Retention not documented; no export API documented. · Events (/v1/events, webhooks): Object changes caused by API calls; request.id ties event to request. 30-day list window. · Connect webhooks v2.iam.api_key.* (managed keys): For app-managed keys: v2.iam.api_key.created/updated/rotated/expired on connected accounts. |
| Detect: Data reads appear in logs | Yes | GET /v1/customers | Where: Developers > API keys > ⋯ on the key > View request logs (opens Workbench Logs); filter Method GET, API endpoint /v1/customers |
| Respond: Revocation ends active access | Yes | Rotation defaults allow old key to keep working up to 7 days; choose 'Now' for compromise. Keys are bearer secrets with no sessions, so expiry stops all further use. Stripe may proactively deactivate detected exposed keys. | Dashboard > API keys > Rotate key with Expiration 'Now' (deletes old key) or Expire key. Managed keys: rotate in Dashboard or on hosting platform. Then review the key's request logs, and apply an access policy to the replacement key. |
| Respond: Stops working when user is removed | N/A | Keys belong to the account, not a user; Stripe tells you to rotate keys yourself when people with access leave. |  |

## Protect: what an admin can configure

### Admin controls
- **Restricted API key permissions** (Limit scope; all plans; default on). Each resource is set to None, Read or Write; default None. Where: Developers > API keys > Create restricted key.
- **Access policies (IP addresses / Advanced)** (Limit network; all plans; default off). Blocks key use outside allowed IPs/CIDRs, ASNs or countries, or from VPNs, proxies and Tor. Where: Developers > Access policies; API keys > key ⋯ > Manage access policy.
- **Rotate API key (scheduled)** (Require rotation; all plans; default off). Revokes a key with a replacement, immediately or at a chosen expiration up to 7 days. Where: Developers > API keys > key ⋯ > Rotate key.
- **Limited access for dormant keys** (Other; all plans; default on). Keys unused for transfers/payouts for 180 days lose those abilities until restored. Where: Automatic; restore via API keys > key ⋯ > Restore access.
- **Team roles (API key management)** (Limit resources; all plans; default on). Only Administrator, Super Administrator and Developer roles can create, view, edit and delete API keys. Where: Settings > Team and security > Team.
- **Approval rules (agent-tagged keys)** (Other; all plans; default varies). Pauses or blocks sensitive actions by agent-tagged keys until a reviewer approves; default rules cover refunds and subscription cancellations. Where: Settings > Approvals > Create rule (Administrator by default).

### Not available (vendor states)
- Unrestricted secret keys cannot be permission-limited.

- Network: supported (checked at api_request). Access policies, which replaced the older per-key IP address restrictions, can be attached to standard (secret) and restricted keys. A policy either allows IPv4 addresses/CIDR ranges, or (advanced) allows ASNs and countries and blocks anonymous VPN, proxy and Tor sources. Stripe blocks requests that fail the policy.
- Lifetime: Until revoked/expired/rolled. Renewal: The same key is reused until it is expired or rotated. A Dashboard rotation can keep the old key working for up to 7 days; managed keys are rotated by the managing platform.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: Stripe recommends restricted keys over unrestricted secret keys. Managed API keys (preview) are created and rotated by a hosting platform such as Vercel, or by an approved Stripe App with the api_key_write permission; they appear on the API keys tab, can't be revealed, and the account owner can expire them at any time. On uninstall the user chooses whether to keep or expire them. Agent-tagged restricted keys are subject to approval rules. Dashboard SSO/session controls are separate from key access policies.

## Detect: what gets logged
- Token prefix: `sk_live_ | rk_live_ | sk_test_ | rk_test_`

### Logs
- Activity Logs API (/v2/iam/activity_logs): Public preview. Key lifecycle (api_key_created/updated/deleted/viewed) with actor and key details. 6-month retention; >=10 min delay; rotation events may be missing for some accounts. No IP field documented.
- Dashboard security history: Dashboard view of the same security history; exact fields not documented.
- Workbench request logs (per key: View request logs): Per-request API logs filterable by date, status, method, endpoint, IP address, source, account, API version, error code/type. Retention not documented; no export API documented.
- Events (/v1/events, webhooks): Object changes caused by API calls; request.id ties event to request. 30-day list window.
- Connect webhooks v2.iam.api_key.* (managed keys): For app-managed keys: v2.iam.api_key.created/updated/rotated/expired on connected accounts.

### Fields that identify the credential
- `actor.api_key.id` (Activity Logs API (v2.iam.activity_log)): API key that performed a security action (e.g., created another key)
- `details.api_key.id` (Activity Logs API): Key that was created/updated/deleted/viewed (example id prefix mk_)
- `details.api_key.new_key` (Activity Logs API): Replacement key id when rotated
- `details.api_key.managed_by.application.id` (Activity Logs API): Application that manages the key (managed keys)
- `request.id` (Activity Logs API / Event object): API request that instigated the action; pivot to Workbench request logs

### Lifecycle events
- create: `api_key_created` Activity Logs; also emitted for rotation replacement
- use: `api_key_viewed` Live key secret revealed in Dashboard; sandbox reveals not logged
- change: `api_key_updated` Name/note/policy changes
- revoke: `api_key_deleted` Old key on rotation or deletion
- create: `v2.iam.api_key.created` Managed keys, Connect webhook
- change: `v2.iam.api_key.rotated` Managed keys, Connect webhook
- revoke: `v2.iam.api_key.expired` Managed keys, Connect webhook

### Correlate on
`actor.api_key.id`, `details.api_key.id`, `request.id`, `context`, `actor.user.email`, `request.idempotency_key`, `account`

### API calls a holder can make, and whether they are logged
- collection: `GET /v1/customers`. Customer records (names, emails, metadata) Logged: yes. Workbench request log (Dashboard > Workbench > Logs), not Security history; retention not stated. Per-key view via the key's 'View request logs' menu.

### What to look for (analyst guidance)
- Workbench requests for the key from an IP/ASN never seen before, or blocked by an access policy
- api_key_viewed or api_key_created by a user outside the normal admin set, or right after a role change
- api_key_created where actor.type=api_key (a key minting another key)
- Key that was idle for months suddenly creating payouts/transfers or payout destinations
- sk_/rk_ live key requests to endpoints outside the key's normal endpoint set (e.g., customers list export, refunds)
- Old key still sending requests during the 7-day rotation grace window after a leak

### Sample query (Stripe Activity Logs API (HTTP GET))
Pull key lifecycle actions to find unexpected key creation or live-key reveals.

```
curl -G https://api.stripe.com/v2/iam/activity_logs -H "Authorization: Bearer $RAK_ACTIVITY_LOGS_READ" -H "Stripe-Version: 2026-09-30.preview" -d "action_groups[]=api_key"  # then flag type in (api_key_created, api_key_viewed) and actor.type=api_key
```

## Respond: how to revoke it
- Admin: **Expire API key**. Expiring a secret or restricted key stops all API calls with it. Where: Developers > API keys > key ⋯ > Expire key.
- Admin: **Expire managed API keys**. The user can expire app-managed keys at any time, and choose keep or expire on uninstall. Where: Dashboard API keys page.

Dashboard > API keys > Rotate key with Expiration 'Now' (deletes old key) or Expire key. Managed keys: rotate in Dashboard or on hosting platform. Then review the key's request logs, and apply an access policy to the replacement key. Live access ends on revocation: yes. Rotation defaults allow old key to keep working up to 7 days; choose 'Now' for compromise. Keys are bearer secrets with no sessions, so expiry stops all further use. Stripe may proactively deactivate detected exposed keys.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Exact sk_/rk_ token length/charset
- Workbench request log retention and export/API access
- Field names in Workbench request logs (only filter labels documented)
- Whether Activity Log records the API key used on ordinary (non-security) requests
- Dashboard security history field names
- Logging of auth failures with an expired/invalid key
- No account setting found to forbid creating unrestricted secret keys or to require key expiry.
- Whether access policies and approval rules can be attached to organization API keys.
- Whether uninstalling a Stripe App immediately revokes its OAuth refresh tokens is not stated.
- Which organization roles can create org API keys or service principals, and how to disable a service principal.
- Approval rules' actor condition for service principals is mentioned on the service principals page but not described on the approvals page.

## Sources
- [API keys | Stripe Documentation](https://docs.stripe.com/keys) (retrieved 2026-10-09)
- [OAuth 2.0 | Stripe Documentation](https://docs.stripe.com/stripe-apps/api-authentication/oauth) (retrieved 2026-10-09)
- [Managed API keys | Stripe Documentation](https://docs.stripe.com/keys/managed-api-keys) (retrieved 2026-10-12)
- [How Workbench works](https://docs.stripe.com/workbench/overview) (retrieved 2026-10-12)
- [Activity logs](https://docs.stripe.com/activity-logs) (retrieved 2026-10-12)
- [The Activity Log object](https://docs.stripe.com/api/v2/iam/activity-logs/object?api-version=2026-09-30.preview) (retrieved 2026-10-12)
- [List Activity Logs](https://docs.stripe.com/api/v2/iam/activity-logs/list?api-version=2026-09-30.preview) (retrieved 2026-10-12)
- [The Event object](https://docs.stripe.com/api/events/object) (retrieved 2026-10-12)
- [List all events](https://docs.stripe.com/api/events/list) (retrieved 2026-10-12)
- [Best practices for managing secret API keys](https://docs.stripe.com/keys-best-practices) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Managed API keys](https://docs.stripe.com/stripe-apps/api-authentication/managed-api-keys) (retrieved 2026-10-12)
- [Protecting against compromised API keys](https://support.stripe.com/questions/protecting-against-compromised-api-keys) (retrieved 2026-10-12)
- [List all customers | Stripe API Reference](https://docs.stripe.com/api/customers/list) (retrieved 2026-10-14)
- [Restricted API keys](https://docs.stripe.com/keys/restricted-api-keys) (retrieved 2026-10-12)
- [User roles](https://docs.stripe.com/get-started/account/teams/roles) (retrieved 2026-10-13)
- [Set up two-party approvals](https://docs.stripe.com/account/approvals) (retrieved 2026-10-13)
