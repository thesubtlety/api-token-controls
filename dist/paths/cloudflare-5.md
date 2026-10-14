# Cloudflare: Access service tokens

`cloudflare-5` · Basic credentials · service. Client ID + Client Secret (cfast_ prefix for new secrets) sent as CF-Access-Client-Id/CF-Access-Client-Secret headers to reach apps protected by Cloudflare Access.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Zero Trust > Access controls > Service credentials > Service Tokens; API: GET /{accounts_or_zones}/{account_or_zone_id}/access/service_tokens. | Zero Trust > Access controls > Service credentials > Service Tokens; API: GET /{accounts_or_zones}/{account_or_zone_id}/access/service_tokens. |
| Protect: Admin can block or require approval | Yes (requires Cloudflare Zero Trust) | Automatically clean up inactive service tokens | Automatically clean up inactive service tokens: Zero Trust > Access controls > Access settings > Manage service tokens |
| Protect: SSO and MFA rules apply | Not available | Service tokens are used with Service Auth policies, which do not require an IdP login. |  |
| Protect: IP restriction | Yes | Add an IP ranges Require rule to the Service Auth policy of each Access application; IP ranges are checked at login and continuously. Not a property of the token itself. | Where: Zero Trust > Access controls > Policies > (Service Auth policy) > add Require rule, selector 'IP ranges' |
| Protect: Expires automatically | Yes | Duration chosen at creation; optional auto-disable/delete after 30-365 days of inactivity | Service Token Duration: Zero Trust > Access controls > Service credentials > Service Tokens · Rotate service token secret: Service Tokens > Rotate secret |
| Detect: Usage appears in logs | Yes | service token name / Client ID | API: POST /client/v4/graphql, dataset accessLoginRequestsAdaptiveGroups, filter on serviceTokenId |
| Detect: Data reads appear in logs | Conditional | Per-request logs need Enterprise HTTP request logs/Logpush; Access authentication logs record only the authentication, not app actions. | API: Enterprise HTTP request logs via Logpush (filter ClientRequestHost/ClientRequestURI for the app) |
| Respond: Revocation ends active access | Yes | Revoking Access sessions alone is not enough. | Delete the service token (DELETE .../access/service_tokens/{id}); disabling also stops the old secret during a rotation grace period. |
| Respond: Stops working when user is removed | N/A | Service tokens are account-level credentials for automated systems, not tied to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Service Token Duration** (Limit lifetime; Cloudflare Zero Trust; default unknown). Sets the service token's expiration date. Where: Zero Trust > Access controls > Service credentials > Service Tokens.
- **Automatically clean up inactive service tokens** (Disable; Cloudflare Zero Trust; default off). Disables or deletes tokens unused for 30-365 days. Where: Zero Trust > Access controls > Access settings > Manage service tokens.
- **Strict service token authentication** (Other; Cloudflare Zero Trust; default varies). Only Service Auth policies authorize token requests, no session cookie is issued, and failures are logged. Where: Zero Trust > Access controls > Access settings; strict_service_token_auth.
- **Rotate service token secret** (Require rotation; Cloudflare Zero Trust; default unknown). Issues a new secret with an optional grace period for the old one. Where: Service Tokens > Rotate secret.

### Not available (vendor states)
- Revoking existing Access sessions does not stop a valid service token; only deletion does.

- Network: supported (checked at api_request). Add an IP ranges Require rule to the Service Auth policy of each Access application; IP ranges are checked at login and continuously. Not a property of the token itself.
- Lifetime: Duration chosen at creation; optional auto-disable/delete after 30-365 days of inactivity. Renewal: Refresh or edit duration; rotate secret with a 1 hour to 30 day grace period.
- Keyless option: not_applicable. Service Auth policies authorize the token without an IdP login.
- Conditions: Needs Cloudflare Zero Trust (Access).

## Detect: what gets logged
- Token prefix: `cfast_`

### Logs
- Access authentication logs: Failed requests for recognized tokens logged in strict mode.
- Audit Logs v2: Admin changes to service tokens (create/rotate/delete) via API.

### Fields that identify the credential
- `service token name / Client ID` (Access authentication logs): Docs say the name identifies events in logs; exact field name not given

### Lifecycle events
No docs found.

### Correlate on
`Client ID`, `token name`

### API calls a holder can make, and whether they are logged
- collection: `HTTP request to an Access-protected application path (customer app)`. Whatever the protected application returns Logged: plan. Per-request logs need Enterprise HTTP request logs/Logpush; Access authentication logs record only the authentication, not app actions.

### What to look for (analyst guidance)
- Failed auth with expired/disabled token
- Token used on apps it is not authorized for

## Respond: how to revoke it
- Admin: **Disable / delete service token**. Disable stops authentication; delete revokes for good. Where: Service Tokens > Disable token / Delete; DELETE .../access/service_tokens/{id}.

Delete the service token (DELETE .../access/service_tokens/{id}); disabling also stops the old secret during a rotation grace period. Live access ends on revocation: yes. Revoking Access sessions alone is not enough.

## No vendor documentation found
- Exact Access log field names
- Calls depend on the protected application
- Any account-level setting to block members from creating user API tokens or using the Global API Key.
- Any account-wide policy forcing token expiry or IP filters.
- Whether Super Administrators can list or revoke other members' user API tokens.
- Whether dashboard SSO or Access policies are checked on API token / Global API Key requests (no explicit statement).
- Exact Audit Logs v2 action names for token create/delete/roll.
- Whether Origin CA keys still authenticate after the 2026-09-30 removal date.
- IP restrictions for Access service tokens and for R2 S3 requests.
- Cloudflare OAuth tokens (actor context 'oauth', e.g. Wrangler) were not researched.

## Sources
- [Service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/) (retrieved 2026-10-14)
- [Access policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/) (retrieved 2026-10-14)
- [List service tokens](https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/service_tokens/methods/list/) (retrieved 2026-10-14)
- [Manage Access policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/policy-management/) (retrieved 2026-10-14)
- [Access authentication logs](https://developers.cloudflare.com/cloudflare-one/insights/logs/dashboard-logs/access-authentication-logs/) (retrieved 2026-10-14)
- [Querying Access login events with GraphQL](https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-access-login-events/) (retrieved 2026-10-14)
- [Delete a service token](https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/service_tokens/methods/delete/) (retrieved 2026-10-14)
