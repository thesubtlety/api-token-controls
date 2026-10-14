# Stripe: Organization API key

`stripe-3` · API key / token · service. A secret key (prefix sk_org) created at the Stripe organization level and sent as a bearer token. Requests must include Stripe-Version, and Stripe-Context to name the target account; one key can reach any account in the organization.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | API keys tab of the organization Dashboard. | Where: Organization Dashboard > API keys tab (dashboard.stripe.com/org/api-keys/secret) |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Access policies (IPv4/CIDR, ASN, country, proxy/Tor blocking) are documented for account-level standard and restricted keys. The docs reviewed do not say whether they can be attached to organization keys. |  |
| Protect: Expires automatically | Not available | No default expiration (stated for Stripe API keys generally) |  |
| Detect: Usage appears in logs | Yes | details.api_key.id, context, request.id | Workbench request logs (organization view): Org-level logs identify which account in the organization each request/error applies to; filter by account, IP, endpoint, source. · Activity Logs API: API key actions are per account (context); whether org-key lifecycle appears is not documented. · Events (/v1/events): Object changes in the targeted account; context field carries authentication context. |
| Detect: Data reads appear in logs | Yes | GET /v1/balance (with Stripe-Context header) | Where: Workbench > Logs (organization); filter API endpoint /v1/balance, Method GET, Account |
| Respond: Revocation ends active access | No docs found | Org-key rotate/expire semantics are not separately documented; assume same as account keys (7-day grace unless expired now). |  |
| Respond: Stops working when user is removed | N/A | Organization keys work at the organization level and are not tied to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Organization API key permissions** (Limit scope; Requires a Stripe organization; default unknown). Org keys can be restricted to read or write specific resources. Where: Organization Dashboard > API keys tab.

- Network: unknown (checked at unknown). Access policies (IPv4/CIDR, ASN, country, proxy/Tor blocking) are documented for account-level standard and restricted keys. The docs reviewed do not say whether they can be attached to organization keys.
- Lifetime: No default expiration (stated for Stripe API keys generally). Renewal: The same static key is reused on every request until it is expired or replaced; rotation and expiry steps are documented only for account-level keys.
- Keyless option: not_applicable. Static secret key; no external identity exchange is involved.
- Conditions: Requires a Stripe organization with multiple accounts. Stripe advises using an organization key only for cross-account or organization operations. Which organization roles can create keys was not found.

## Detect: what gets logged
- Token prefix: `sk_org`

### Logs
- Workbench request logs (organization view): Org-level logs identify which account in the organization each request/error applies to; filter by account, IP, endpoint, source.
- Activity Logs API: API key actions are per account (context); whether org-key lifecycle appears is not documented.
- Events (/v1/events): Object changes in the targeted account; context field carries authentication context.

### Fields that identify the credential
- `details.api_key.id` (Activity Logs API): If org keys are logged (not confirmed)
- `context` (Activity Logs API / Event object): Target account; matches Stripe-Context value
- `request.id` (Event object): Pivot to request logs

### Lifecycle events
No docs found.

### Correlate on
`Stripe-Context`, `context`, `request.id`, `account`

### API calls a holder can make, and whether they are logged
- collection: `GET /v1/balance (with Stripe-Context header)`. Balance of any account in the organization Logged: yes. Workbench request log (Dashboard > Workbench > Logs), not Security history; retention not stated. Organization view identifies the target account.

### What to look for (analyst guidance)
- One sk_org key touching many accounts (Stripe-Context values) it normally never reaches
- Stripe-Context using platform/connected path format (acct_x/acct_y) not seen before
- Org key requests from IPs outside known servers
- Org key used where only one account is needed (violates documented guidance) - review scope
- Write calls (refunds, payouts) from an org key normally used for reporting

### Sample query (Stripe Events API (HTTP GET, org key))
Per-account sweep of recent refunds to check for org-key misuse; repeat per Stripe-Context.

```
curl -G https://api.stripe.com/v1/events -u "$SK_ORG:" -H "Stripe-Version: 2026-09-30" -H "Stripe-Context: acct_EXAMPLE0001" -d "type=refund.*" -d "created[gte]=1788998400"
```

## Respond: how to revoke it


Organization Dashboard > API keys tab (org/api-keys/secret): rotate or expire the sk_org key; then review org-level Workbench logs per account. Live access ends on revocation: unknown. Org-key rotate/expire semantics are not separately documented; assume same as account keys (7-day grace unless expired now).

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Revocation ends active access
- Org-key lifecycle events (Activity Logs coverage for sk_org)
- Org-key rotation/expire grace behavior
- Whether access policies apply to org keys
- Request log field naming the org key used
- sk_org token length/format
- Secret scanning partner coverage for sk_org
- No account setting found to forbid creating unrestricted secret keys or to require key expiry.
- Whether access policies and approval rules can be attached to organization API keys.
- Whether uninstalling a Stripe App immediately revokes its OAuth refresh tokens is not stated.
- Which organization roles can create org API keys or service principals, and how to disable a service principal.
- Approval rules' actor condition for service principals is mentioned on the service principals page but not described on the approvals page.

## Sources
- [Organization API keys | Stripe Documentation](https://docs.stripe.com/keys/organization-api-keys) (retrieved 2026-10-12)
- [API keys | Stripe Documentation](https://docs.stripe.com/keys) (retrieved 2026-10-09)
- [Workload Identity Federation | Stripe Documentation](https://docs.stripe.com/workload-identity-federation) (retrieved 2026-10-12)
- [Manage access to your organization | Stripe Documentation](https://docs.stripe.com/get-started/account/orgs/team) (retrieved 2026-10-12)
- [How Workbench works](https://docs.stripe.com/workbench/overview) (retrieved 2026-10-12)
- [The Event object](https://docs.stripe.com/api/events/object) (retrieved 2026-10-12)
