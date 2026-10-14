# MuleSoft Anypoint: Environment / business group client ID and client secret

`mulesoft-4` · OAuth · service. Each environment and the root business group has a client ID/secret used to pair customer-hosted Mule runtimes and API gateways; organization clients can get tokens via client_credentials. Root business group credentials grant permissions across all child business groups.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Access Management > Environments shows each environment's client ID; Organization tab shows org/business group credentials. | Access Management > Environments shows each environment's client ID; Organization tab shows org/business group credentials. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Not available | The org IP allowlist covers only user sign-ins with Anypoint credentials; environment credentials are not covered. No other IP control documented. |  |
| Protect: Expires automatically | No docs found | No expiry documented |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Anypoint Platform audit log (Access Management > Audit Log, Audit Log Query API): Default retention 1 year (6 years for orgs before 2023-07-10), configurable 30-2190 days; export via Telemetry Exporter needs Anypoint Integration Advanced or Titanium. |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | No docs found | Reset environment client_secret per KB or contact support. |  |
| Respond: Stops working when user is removed | N/A | Credentials belong to an environment or business group, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Reset environment client_secret** (Require rotation; all plans; default unknown). Change environment secret via KB procedure or support. Where: Salesforce Help article / support.

- Network: excluded (checked at login_only). The org IP allowlist covers only user sign-ins with Anypoint credentials; environment credentials are not covered. No other IP control documented.
- Lifetime: No expiry documented. Renewal: Secret is reused; reset via KB procedure or support.
- Keyless option: not_applicable. Static shared secret.
- Conditions: Organization Administrator permission.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Anypoint Platform audit log (Access Management > Audit Log, Audit Log Query API): Default retention 1 year (6 years for orgs before 2023-07-10), configurable 30-2190 days; export via Telemetry Exporter needs Anypoint Integration Advanced or Titanium.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`Environment`

### API calls a holder can make, and whether they are logged
- recon: `POST https://anypoint.mulesoft.com/accounts/oauth2/token (client_credentials)`. Bearer token for org client Logged: unknown. 

### What to look for (analyst guidance)
- Unknown Mule runtime or gateway registering to an environment

## Respond: how to revoke it


Reset environment client_secret per KB or contact support. Live access ends on revocation: unknown. 

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- No audit event documented for viewing or resetting environment client secrets
- What APIs an environment client token can call
- Whether IP allowlist applies to connected app token requests or API calls with an issued token
- Whether deleting a client-credentials app or rotating its secret invalidates unexpired access tokens
- Whether a client-credentials app's tokens can be revoked without deleting it (Revoke Authorization is documented for user authorizations)
- Exact UI setting name for disabling connected apps org-wide
- Whether read/GET API calls are audit logged
- Environment client secret rotation procedure (help.salesforce.com KB 001115221 did not render)
- Bearer token format/prefix
- Whether IdP conditional access applies to connected app tokens (not stated)

## Sources
- [Anypoint Platform Environments](https://docs.mulesoft.com/access-management/environments) (retrieved 2026-10-14)
- [Managing Business Groups in Anypoint Platform](https://docs.mulesoft.com/access-management/organization) (retrieved 2026-10-14)
- [Access Management API - Authentication](https://anypoint.mulesoft.com/exchange/portals/anypoint-platform/f1e97bc6-315a-4490-82a7-23abe036327a.anypoint-platform/access-management-api/minor/1.0/pages/Authentication) (retrieved 2026-10-14)
- [Managing IP Allowlists in Access Management](https://docs.mulesoft.com/access-management/managing-ip-allowlists) (retrieved 2026-10-14)
- [Configuring Organization Credentials in Mule Runtime 4](https://docs.mulesoft.com/mule-gateway/mule-gateway-org-credentials-mule4) (retrieved 2026-10-14)
