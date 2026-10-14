# Stripe: Workload Identity Federation (service principal)

`stripe-4` · Federated identity · service. A workload on AWS or Google Cloud gets an identity token from its cloud provider and exchanges it, using the service principal's client ID (oacli_...), for a short-lived Stripe access token used to call the API. During the preview, the Ruby and TypeScript SDKs handle the exchange; requests name the target account with Stripe-Context.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Organization > Developers > API authentication > Service principals page. | Organization > Developers > API authentication > Service principals page. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Stripe says access policies can be applied to service principals, but the WIF page does not describe how they are enforced on exchanged tokens. Without a policy, tokens can be used from anywhere; only a trusted workload can obtain them. | Access policies (IP addresses / Advanced): Developers > Access policies; API keys > key ⋯ > Manage access policy |
| Protect: Expires automatically | Yes | 1 hour |  |
| Detect: Usage appears in logs | Yes | sts:IdentityTokenAudience, sub | Workbench request logs: Requests made with the exchanged token; service-principal attribution fields not documented. · AWS CloudTrail / Google Cloud audit logs: Workload side: AWS sts:GetWebIdentityToken calls with audience https://access.stripe.com/wif; GCP identity token minting for the service account. · Activity Logs API: No documented service principal action types. |
| Detect: Data reads appear in logs | Yes | GET /v1/customers | Where: Workbench > Logs; filter Method GET, API endpoint /v1/customers, Account |
| Respond: Revocation ends active access | No docs found | Exchanged tokens expire in 1 hour; docs do not say whether deleting the service principal revokes tokens already issued. |  |
| Respond: Stops working when user is removed | N/A | A service principal is a non-human identity. |  |

## Protect: what an admin can configure

### Admin controls
- **Access policies (IP addresses / Advanced)** (Limit network; all plans; default off). Blocks key use outside allowed IPs/CIDRs, ASNs or countries, or from VPNs, proxies and Tor. Where: Developers > Access policies; API keys > key ⋯ > Manage access policy.
- **Approval rules (agent-tagged keys)** (Other; all plans; default varies). Pauses or blocks sensitive actions by agent-tagged keys until a reviewer approves; default rules cover refunds and subscription cancellations. Where: Settings > Approvals > Create rule (Administrator by default).
- **Service principal subject and permissions** (Limit resources; Private preview; requires a Stripe organization; default off). Only workloads matching the trusted IdP and subject get tokens, limited to assigned permissions. Where: Organization > Developers > API authentication > Service principals.

- Network: conditional (checked at unknown). Stripe says access policies can be applied to service principals, but the WIF page does not describe how they are enforced on exchanged tokens. Without a policy, tokens can be used from anywhere; only a trusted workload can obtain them.
- Lifetime: 1 hour. Renewal: No refresh token is documented; the SDK exchanges a fresh cloud identity token for a new access token, so continued access depends on the workload keeping its cloud identity and on the service principal's trust settings.
- Keyless option: supported. Trust is set on an organization-level service principal by the provider's issuer URL and the workload's subject: the IAM role ARN on AWS (outbound identity federation, audience https://access.stripe.com/wif) or the service account's numeric unique ID on Google Cloud.
- Conditions: Private preview; requires a Stripe organization. Only the Ruby and TypeScript SDKs (preview builds) are supported, and service principals support only WIF as an authentication method during the preview. Which roles can create service principals, and how to revoke or disable one, were not found.

## Detect: what gets logged
- Token prefix: `oacli_ (client ID, not a secret)`

### Logs
- Workbench request logs: Requests made with the exchanged token; service-principal attribution fields not documented.
- AWS CloudTrail / Google Cloud audit logs: Workload side: AWS sts:GetWebIdentityToken calls with audience https://access.stripe.com/wif; GCP identity token minting for the service account.
- Activity Logs API: No documented service principal action types.

### Fields that identify the credential
- `sts:IdentityTokenAudience` (AWS IAM policy condition (CloudTrail context)): Value https://access.stripe.com/wif identifies Stripe-bound token requests
- `sub` (Cloud identity token): IAM role ARN (AWS) or numeric service account unique ID (GCP) registered as the service principal subject

### Lifecycle events
No docs found.

### Correlate on
`sub`, `Stripe-Context`, `request.id`, `context`

### API calls a holder can make, and whether they are logged
- collection: `GET /v1/customers`. Customer records, if the service principal was granted that permission Logged: yes. Workbench request log (Dashboard > Workbench > Logs), not Security history; retention not stated. Private preview; docs do not say how service-principal requests are labeled.

### What to look for (analyst guidance)
- sts:GetWebIdentityToken for audience https://access.stripe.com/wif from a role/session that is not the expected workload
- New subject added to a service principal, or new trusted identity provider issuer URL
- GCP: unexpected principals granted Service Account OpenID Connect Identity Token Creator on the Stripe-caller service account
- Stripe API calls with Stripe-Context for accounts the workload never targets
- Local/laptop assumption of the workload role (assumed-role session names from humans)

### Sample query (Stripe Events API (HTTP GET))
Per-account sweep of recent payouts in accounts the service principal can reach; no Stripe-side service-principal filter is documented.

```
curl -G https://api.stripe.com/v1/events -H "Authorization: Bearer $WIF_ACCESS_TOKEN" -H "Stripe-Context: acct_EXAMPLE0001" -d "type=payout.*" -d "created[gte]=1788998400"
```

## Respond: how to revoke it


Cloud side: remove the WIF inline policy / revoke role sessions (AWS) or remove token-creator grants and disable the service account (GCP). Stripe side: edit or delete the service principal / subject in Organization > Developers > API authentication > Service principals. Live access ends on revocation: unknown. Exchanged tokens expire in 1 hour; docs do not say whether deleting the service principal revokes tokens already issued.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Revocation ends active access
- Stripe-side log fields identifying a service principal on requests
- Lifecycle events for service principal/identity provider changes
- Token exchange endpoint and failure logging
- Whether deleting a service principal revokes live tokens
- Issued access token prefix
- CloudTrail field names for GetWebIdentityToken (not researched; vendor-side hunt query omitted)
- No account setting found to forbid creating unrestricted secret keys or to require key expiry.
- Whether access policies and approval rules can be attached to organization API keys.
- Whether uninstalling a Stripe App immediately revokes its OAuth refresh tokens is not stated.
- Which organization roles can create org API keys or service principals, and how to disable a service principal.
- Approval rules' actor condition for service principals is mentioned on the service principals page but not described on the approvals page.

## Sources
- [Workload Identity Federation | Stripe Documentation](https://docs.stripe.com/workload-identity-federation) (retrieved 2026-10-12)
- [Service principals | Stripe Documentation](https://docs.stripe.com/service-principals) (retrieved 2026-10-12)
- [How Workbench works](https://docs.stripe.com/workbench/overview) (retrieved 2026-10-12)
- [List all customers | Stripe API Reference](https://docs.stripe.com/api/customers/list) (retrieved 2026-10-14)
- [API keys | Stripe Documentation](https://docs.stripe.com/keys) (retrieved 2026-10-09)
- [Set up two-party approvals](https://docs.stripe.com/account/approvals) (retrieved 2026-10-13)
