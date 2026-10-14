# MuleSoft Anypoint: API client application credentials (client ID / secret for API instances)

`mulesoft-5` · API key / token · service. Client applications registered in Exchange get a client ID and optional secret to call customer APIs protected by a client ID enforcement policy. These authenticate to customer APIs, not to Anypoint Platform APIs.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | API Manager > API instance > Contracts lists contracts per instance; not all clients appear in the UI, and GET /accounts/api/organizations/{orgId}/clients is documented for the org-wide client count. | API Manager > API instance > Contracts lists contracts per instance; not all clients appear in the UI, and GET /accounts/api/organizations/{orgId}/clients is documented for the org-wide client count. |
| Protect: Admin can block or require approval | Yes | Contract approval | Where: API Manager > (API instance) > SLA tiers: set tier to manual approval; then API Manager > API Administration > (instance) > Contracts > Approve / Reject |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Only if the API owner applies the IP Allowlist policy to the API instance; applies to calls to that API, not platform-wide. | IP Allowlist policy: API Manager > API instance > Policies > IP Allowlist |
| Protect: Expires automatically | No docs found | No expiry documented |  |
| Detect: Usage appears in logs | Yes | App ID | Anypoint Platform audit log (Access Management > Audit Log, Audit Log Query API): Default retention 1 year (6 years for orgs before 2023-07-10), configurable 30-2190 days; export via Telemetry Exporter needs Anypoint Integration Advanced or Titanium. |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | No docs found | Revoke blocks the client app from the API. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Contract approval** (Require approval; all plans; default varies). Instance owner approves access requests before credentials work against the API. Where: Exchange Request access / API Manager.
- **IP Allowlist policy** (Limit network; all plans; default off). Gateway policy that only lets listed IPs or ranges call a managed API instance. Where: API Manager > API instance > Policies > IP Allowlist.

- Network: conditional (checked at api_request). Only if the API owner applies the IP Allowlist policy to the API instance; applies to calls to that API, not platform-wide.
- Lifetime: No expiry documented. Renewal: Secret reusable; reset is an audited action.
- Keyless option: not_applicable. Static credentials; external client providers (e.g. Entra ID, PingFederate) can be used instead.
- Conditions: Root org Organization Administrator for revoke/delete.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Anypoint Platform audit log (Access Management > Audit Log, Audit Log Query API): Default retention 1 year (6 years for orgs before 2023-07-10), configurable 30-2190 days; export via Telemetry Exporter needs Anypoint Integration Advanced or Titanium.

### Fields that identify the credential
- `App ID` (audit log Application entries): 

### Lifecycle events
- create: `Create application` Logged at root org
- rotate: `Reset client secret` Action Edit - reset client secret
- other: `Approve application` Action Edit - contract approval
- revoke: `Revoke application` Action Edit - contract revoke
- revoke: `Delete application` 

### Correlate on
`App ID`, `API version ID`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Contract requests or tier changes for sensitive API instances

## Respond: how to revoke it
- Admin: **Revoke API contract**. Blocks a client application from calling the API instance. Where: API Manager > API instance > Contracts > Revoke.

Revoke the contract in API Manager, then reset secret or delete the app. Live access ends on revocation: unknown. Revoke blocks the client app from the API.

## No vendor documentation found
- SSO and MFA rules apply
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- Gateway-side request logging depends on customer runtime
- Calls depend on the customer's own APIs
- Whether IP allowlist applies to connected app token requests or API calls with an issued token
- Whether deleting a client-credentials app or rotating its secret invalidates unexpired access tokens
- Whether a client-credentials app's tokens can be revoked without deleting it (Revoke Authorization is documented for user authorizations)
- Exact UI setting name for disabling connected apps org-wide
- Whether read/GET API calls are audit logged
- Environment client secret rotation procedure (help.salesforce.com KB 001115221 did not render)
- Bearer token format/prefix
- Whether IdP conditional access applies to connected app tokens (not stated)

## Sources
- [Requesting Access](https://docs.mulesoft.com/exchange/to-request-access) (retrieved 2026-10-14)
- [IP Allowlist Policy](https://docs.mulesoft.com/mule-gateway/policies-included-ip-allowlist) (retrieved 2026-10-14)
- [Audit Logging in Anypoint Platform](https://docs.mulesoft.com/access-management/audit-logging) (retrieved 2026-10-14)
- [Revoke and Delete API Contracts](https://docs.mulesoft.com/api-manager/latest/remove-client-app-latest-task) (retrieved 2026-10-14)
- [Manage Client Applications](https://docs.mulesoft.com/exchange/about-my-applications) (retrieved 2026-10-14)
- [Troubleshooting Anypoint Platform Access](https://docs.mulesoft.com/access-management/troubleshooting-anypoint-platform-access) (retrieved 2026-10-14)
- [Reviewing SLA Tiers Concepts](https://docs.mulesoft.com/api-manager/latest/defining-sla-tiers) (retrieved 2026-10-14)
- [Approve or Reject Access Requests](https://docs.mulesoft.com/api-manager/latest/manage-client-apps-latest-task) (retrieved 2026-10-14)
