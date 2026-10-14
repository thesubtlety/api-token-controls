# Workday: API Client with JWT Bearer Grant (x509 public key)

`workday-3` · Signed JWT · service. Admin registers an API client with Client Grant Type Jwt Bearer Grant, uploads an x509 public key and binds an ISU. The holder of the private key signs JWT assertions to get access tokens.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | View API Clients report; coverage of all clients not described. | Where: View API Clients report |
| Protect: Admin can block or require approval | Yes | OAuth 2.0 Clients Enabled | OAuth 2.0 Clients Enabled: Edit Tenant Setup - Security > OAuth 2.0 Settings |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented publicly. |  |
| Protect: Expires automatically | Partial | Key valid until the x509 certificate expires or is replaced; access token expiry configurable |  |
| Detect: Usage appears in logs | Yes | System Account | Where: View User Activity report (filter System Account = the bound ISU) · API: GET https://<tenantHostname>/privacy/v1/activityLogging (spec basePath)?from=...&to=...&systemAccount=<account> |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Access tokens already issued may be replayable until expiry. |  |
| Respond: Stops working when user is removed | N/A | The JWT bearer client is bound to an ISU, a non-person account. |  |

## Protect: what an admin can configure

### Admin controls
- **OAuth 2.0 Clients Enabled** (Disable; all plans; default unknown). Tenant-wide switch that allows OAuth 2.0 clients to call the Workday API. Where: Edit Tenant Setup - Security > OAuth 2.0 Settings.
- **Scope (Functional Areas)** (Limit scope; all plans; default varies). Limits an API client to selected functional areas. Where: Register API Client / Register API Client for Integrations.
- **Integration System Security Group domain permissions** (Limit resources; all plans; default varies). ISU access is limited to domains granted to its security group. Where: Create Security Group (Integration System Security Group) + Maintain Permissions for Security Group.
- **Enable Security Emails** (Other; all plans; default unknown). Needed for X.509 certificate expiration notifications. Where: Edit Tenant Setup - Security > Security Email Settings.

- Network: unknown (checked at unknown). Not documented publicly.
- Lifetime: Key valid until the x509 certificate expires or is replaced; access token expiry configurable. Renewal: Each JWT assertion yields a new access token; no stored refresh token.
- Keyless option: not_verified. No interactive sign-in; docs do not address SSO or conditional access.
- Conditions: Expiry emails for x509 certificates require Enable Security Emails.

## Detect: what gets logged
- Token prefix: not established

### Logs
- View User Activity / /activityLogging: Acting account is the bound ISU.

### Fields that identify the credential
- `System Account` (User Activity): ISU name.

### Lifecycle events
No docs found.

### Correlate on
`ISU user name`, `Client ID`, `x509 certificate name`

### API calls a holder can make, and whether they are logged
- collection (bulk): `SOAP Human_Resources Get_Workers (bearer token)`. Worker data within ISU security Logged: unknown. 

### What to look for (analyst guidance)
- New x509 public key added to an API client
- Token requests for the client from unexpected networks

## Respond: how to revoke it
- Admin: **Disable OAuth 2.0 client**. Disable a compromised API client to stop further use of its credentials. Where: API client related actions (exact task name not public).

Disable the API client and replace the x509 public key. Live access ends on revocation: unknown. Access tokens already issued may be replayable until expiry.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Audit event names for x509 key changes
- whoami endpoint
- Whether authentication-policy IP rules are enforced on each API request or only at sign-in/token issuance (authentication policy pages require login).
- Whether disabling an API client or regenerating a refresh token invalidates already-issued access tokens (docs say tokens can be replayed within their lifetime).
- Exact task names to disable/delete an API client and to revoke a refresh token.
- Default access-token lifetime for integration clients.
- Whether ISU password authentication bypasses SAML SSO / IdP conditional access.
- Whether User Activity Logging records web service (SOAP/REST) calls made by ISUs; the activityLogging REST API reference requires login.
- Audit event names for API client creation, refresh token generation, or client disablement.

## Sources
- [Set Up Live Data Query ISU Authentication in Workday](https://doc.workday.com/admin-guide/en-us/workday-data-cloud/data-out/workday-live-data-query-/set-up-live-data-query-isu-authentication.html) (retrieved 2026-10-14)
- [Register API Client for Data Lake (JWT Bearer Grant)](https://doc.workday.com/admin-guide/en-us/workday-data-cloud/data-out/workday-data-lake/register-api-client-for-data-lake--jwt-bearer-gran.html) (retrieved 2026-10-14)
- [Reference: Edit Tenant Setup - Security](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/tenant-setup/dan1370796470031.html) (retrieved 2026-10-14)
- [Workday AI Admin Guide PDF (FAQ: Agent Security)](https://doc.workday.com/content/dam/fmdita-outputs/pdfs/admin-guide/en-us/Admin-Guide-Workday-AI.pdf) (retrieved 2026-10-14)
- [Connect to Workday Using ISU Name and Password (Peakon)](https://doc.workday.com/peakon/en-us/workday-peakon-employee-voice/integrations/workday-integration/gen1667304794785.html) (retrieved 2026-10-14)
- [Obtain the Workday REST API Endpoint](https://doc.workday.com/admin-guide/en-us/workday-studio/integration-design/common-components/the-prismanalytics-subassembly/qjw1533213809425.html) (retrieved 2026-10-14)
- [Concept: User Activity Logging](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/user-activity-logging/unv1636547598141.html) (retrieved 2026-10-14)
- [Workday REST API reference: privacy v1 GET /activityLogging](https://community.workday.com/sites/default/files/file-hosting/restapi/index.html#privacy/v1/get-/activityLogging) (retrieved 2026-10-14)
- [Workday Web Services v47.0 Human_Resources Get_Workers](https://community.workday.com/sites/default/files/file-hosting/productionapi/Human_Resources/v47.0/Get_Workers.html) (retrieved 2026-10-14)
- [Register API Client for Data Lake (Refresh Token Grant)](https://doc.workday.com/admin-guide/en-us/workday-data-cloud/data-out/workday-data-lake/register-api-client-for-data-lake--refresh-token-g.html) (retrieved 2026-10-14)
