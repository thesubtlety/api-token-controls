# Workday: API Client (Authorization Code Grant, user-delegated)

`workday-4` · OAuth · person. A registered API client uses the authorization code grant; a Workday user signs in and the app gets access and refresh tokens acting as that user.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | View API Clients report lists API clients; no documented list of user-issued tokens. | Where: View API Clients report |
| Protect: Admin can block or require approval | Yes | OAuth 2.0 Clients Enabled | OAuth 2.0 Clients Enabled: Edit Tenant Setup - Security > OAuth 2.0 Settings |
| Protect: SSO and MFA rules apply | Partial | Users enrolled in Workday MFA must pass a second factor during the authorization-code sign-in; docs do not say later token use is re-checked. | Where: Manage Authentication Policies > Authentication Ruleset: rule for the users' security group > Allowed Authentication Types |
| Protect: IP restriction | No docs found | Authentication policies apply at user sign-in; per-request enforcement for bearer tokens is not documented publicly. |  |
| Protect: Expires automatically | Partial | Optional Non-Expiring Refresh Tokens; Enforce 60 Minute Access Token Expiry; session timeouts apply | Non-Expiring Refresh Tokens: Register API Client for Integrations > Non-Expiring Refresh Tokens · Enforce 60 Minute Access Token Expiry: Register API Client |
| Detect: Usage appears in logs | Yes | System Account | Where: View User Activity report (filter System Account = the consenting user) · API: GET https://<tenantHostname>/privacy/v1/activityLogging (spec basePath)?from=...&to=...&systemAccount=<account> |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Disable the API client; reset the user's sessions/password as needed. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **OAuth 2.0 Clients Enabled** (Disable; all plans; default unknown). Tenant-wide switch that allows OAuth 2.0 clients to call the Workday API. Where: Edit Tenant Setup - Security > OAuth 2.0 Settings.
- **Scope (Functional Areas)** (Limit scope; all plans; default varies). Limits an API client to selected functional areas. Where: Register API Client / Register API Client for Integrations.
- **Non-Expiring Refresh Tokens** (Limit lifetime; all plans; default off). When checked, refresh tokens do not expire; leave unchecked to keep expiry. Where: Register API Client for Integrations > Non-Expiring Refresh Tokens.
- **Enforce 60 Minute Access Token Expiry** (Limit lifetime; all plans; default off). Caps OAuth 2.0 authentication at 60 minutes for the client. Where: Register API Client.

- Network: unknown (checked at unknown). Authentication policies apply at user sign-in; per-request enforcement for bearer tokens is not documented publicly.
- Lifetime: Optional Non-Expiring Refresh Tokens; Enforce 60 Minute Access Token Expiry; session timeouts apply. Renewal: App refreshes access tokens with the user's refresh token.
- Keyless option: supported. The user signs in through normal Workday sign-in; MFA-enrolled users must complete MFA. After consent, refresh tokens are used without re-authentication.
- Conditions: OAuth 2.0 Clients Enabled must be on.

## Detect: what gets logged
- Token prefix: not established

### Logs
- View User Activity / /activityLogging: Acting account is the consenting user.
- Update Audit: User sign-ons.

### Fields that identify the credential
- `System Account` (User Activity): The user, not the client.

### Lifecycle events
No docs found.

### Correlate on
`Workday account`, `Client ID`, `IP Address`

### API calls a holder can make, and whether they are logged
- collection (bulk): `SOAP Human_Resources Get_Workers (bearer token)`. Worker data visible to the user Logged: unknown. 

### What to look for (analyst guidance)
- User activity from a third-party client's IPs outside business use
- Unusual report downloads (Activity Category DOWNLOAD)

## Respond: how to revoke it
- Admin: **Disable OAuth 2.0 client**. Disable a compromised API client to stop further use of its credentials. Where: API client related actions (exact task name not public).

Disable the API client; reset the user's sessions/password as needed. Live access ends on revocation: unknown. null

## No vendor documentation found
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- How to revoke one user's refresh token for a client
- whoami endpoint
- Whether authentication-policy IP rules are enforced on each API request or only at sign-in/token issuance (authentication policy pages require login).
- Whether disabling an API client or regenerating a refresh token invalidates already-issued access tokens (docs say tokens can be replayed within their lifetime).
- Exact task names to disable/delete an API client and to revoke a refresh token.
- Default access-token lifetime for integration clients.
- Whether ISU password authentication bypasses SAML SSO / IdP conditional access.
- Whether User Activity Logging records web service (SOAP/REST) calls made by ISUs; the activityLogging REST API reference requires login.
- Audit event names for API client creation, refresh token generation, or client disablement.

## Sources
- [Connect to Workday Using OAuth (Peakon)](https://doc.workday.com/peakon/en-us/workday-peakon-employee-voice/integrations/workday-integration/nfa1667304944189.html) (retrieved 2026-10-14)
- [Enable Multifactor Authentication in Workday Studio](https://doc.workday.com/admin-guide/en-us/workday-studio/integration-deployment/multifactor-authentication-in-workday-studio/kuh1623937418623.html) (retrieved 2026-10-14)
- [Steps: Set Up Workday Mobile Applications](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/mobile-setup/dan1370797996359.html) (retrieved 2026-10-14)
- [Reference: Edit Tenant Setup - Security](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/tenant-setup/dan1370796470031.html) (retrieved 2026-10-14)
- [Connect to Workday Using ISU Name and Password (Peakon)](https://doc.workday.com/peakon/en-us/workday-peakon-employee-voice/integrations/workday-integration/gen1667304794785.html) (retrieved 2026-10-14)
- [Obtain the Workday REST API Endpoint](https://doc.workday.com/admin-guide/en-us/workday-studio/integration-design/common-components/the-prismanalytics-subassembly/qjw1533213809425.html) (retrieved 2026-10-14)
- [Example: Maintain Access to Payment Elections (authentication policy)](https://doc.workday.com/admin-guide/en-us/financial-management/expenses/configuration-examples/yuj1547597493242.html) (retrieved 2026-10-14)
- [Concept: User Activity Logging](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/user-activity-logging/unv1636547598141.html) (retrieved 2026-10-14)
- [Workday REST API reference: privacy v1 GET /activityLogging](https://community.workday.com/sites/default/files/file-hosting/restapi/index.html#privacy/v1/get-/activityLogging) (retrieved 2026-10-14)
- [Workday AI Admin Guide PDF (FAQ: Agent Security)](https://doc.workday.com/content/dam/fmdita-outputs/pdfs/admin-guide/en-us/Admin-Guide-Workday-AI.pdf) (retrieved 2026-10-14)
- [Workday Web Services v47.0 Human_Resources Get_Workers](https://community.workday.com/sites/default/files/file-hosting/productionapi/Human_Resources/v47.0/Get_Workers.html) (retrieved 2026-10-14)
- [Register API Client for Data Lake (Refresh Token Grant)](https://doc.workday.com/admin-guide/en-us/workday-data-cloud/data-out/workday-data-lake/register-api-client-for-data-lake--refresh-token-g.html) (retrieved 2026-10-14)
