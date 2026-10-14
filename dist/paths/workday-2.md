# Workday: API Client for Integrations with refresh token (Manage Refresh Tokens for Integrations)

`workday-2` · OAuth · service. Admin registers an API Client for Integrations, then generates a refresh token bound to an ISU. The holder exchanges client ID, secret and refresh token for access tokens at /ccx/oauth2/<tenant>/token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | A View API Clients report exists; docs only show it used to find the REST endpoint, not to list every client and token. | Where: View API Clients report; per client: related actions > API Client > Manage Refresh Tokens for Integrations |
| Protect: Admin can block or require approval | Yes | OAuth 2.0 Clients Enabled | OAuth 2.0 Clients Enabled: Edit Tenant Setup - Security > OAuth 2.0 Settings |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Public docs do not say whether authentication policy IP rules apply to OAuth token issuance or bearer requests. |  |
| Protect: Expires automatically | Partial | Non-Expiring Refresh Tokens option; access/refresh expiry configurable | Non-Expiring Refresh Tokens: Register API Client for Integrations > Non-Expiring Refresh Tokens · Manage Refresh Tokens for Integrations: API client related actions > API Client > Manage Refresh Tokens for Integrations |
| Detect: Usage appears in logs | Yes | System Account | Where: View User Activity report (filter System Account = the bound ISU) · API: GET https://<tenantHostname>/privacy/v1/activityLogging (spec basePath)?from=...&to=...&systemAccount=<account> |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Workday says compromised access tokens can be replayed within their lifetime. |  |
| Respond: Stops working when user is removed | N/A | The refresh token is generated for an ISU, not a person. |  |

## Protect: what an admin can configure

### Admin controls
- **OAuth 2.0 Clients Enabled** (Disable; all plans; default unknown). Tenant-wide switch that allows OAuth 2.0 clients to call the Workday API. Where: Edit Tenant Setup - Security > OAuth 2.0 Settings.
- **Scope (Functional Areas)** (Limit scope; all plans; default varies). Limits an API client to selected functional areas. Where: Register API Client / Register API Client for Integrations.
- **Integration System Security Group domain permissions** (Limit resources; all plans; default varies). ISU access is limited to domains granted to its security group. Where: Create Security Group (Integration System Security Group) + Maintain Permissions for Security Group.
- **Non-Expiring Refresh Tokens** (Limit lifetime; all plans; default off). When checked, refresh tokens do not expire; leave unchecked to keep expiry. Where: Register API Client for Integrations > Non-Expiring Refresh Tokens.
- **Manage Refresh Tokens for Integrations** (Require rotation; all plans; default unknown). Regenerates the refresh token for a client and ISU. Where: API client related actions > API Client > Manage Refresh Tokens for Integrations.

- Network: unknown (checked at unknown). Public docs do not say whether authentication policy IP rules apply to OAuth token issuance or bearer requests.
- Lifetime: Non-Expiring Refresh Tokens option; access/refresh expiry configurable. Renewal: Access tokens are obtained with the refresh token; admins can regenerate the refresh token from the client.
- Keyless option: not_verified. Refresh token is minted by an admin for the ISU without an interactive sign-in; docs do not address IdP conditional access.
- Conditions: OAuth 2.0 Clients Enabled must be on in tenant setup.

## Detect: what gets logged
- Token prefix: not established

### Logs
- View User Activity / /activityLogging: Records acting account (the bound ISU); opt-in; 30 days.
- View User or Task or Object Audit Trail: Configuration changes by account/task/object; event names for API clients not public.

### Fields that identify the credential
- `System Account` (User Activity): Shows the ISU, not the API client ID (client field not documented).

### Lifecycle events
No docs found.

### Correlate on
`ISU user name`, `Client ID`, `IP Address`

### API calls a holder can make, and whether they are logged
- collection (bulk): `SOAP Human_Resources Get_Workers (bearer token)`. Worker data within ISU security Logged: unknown. GET requests are not logged per web service limits page.

### What to look for (analyst guidance)
- Refresh token regenerated outside change windows
- Client with Non-Expiring Refresh Tokens used from new IPs

## Respond: how to revoke it
- Admin: **Disable OAuth 2.0 client**. Disable a compromised API client to stop further use of its credentials. Where: API client related actions (exact task name not public).

Disable the affected OAuth 2.0 client; regenerate the refresh token; review the ISU's security groups. Live access ends on revocation: unknown. Workday says compromised access tokens can be replayed within their lifetime.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Whether disabling the client revokes outstanding access tokens
- Audit event names
- REST whoami endpoint not readable in public docs
- Whether authentication-policy IP rules are enforced on each API request or only at sign-in/token issuance (authentication policy pages require login).
- Whether disabling an API client or regenerating a refresh token invalidates already-issued access tokens (docs say tokens can be replayed within their lifetime).
- Exact task names to disable/delete an API client and to revoke a refresh token.
- Default access-token lifetime for integration clients.
- Whether ISU password authentication bypasses SAML SSO / IdP conditional access.
- Whether User Activity Logging records web service (SOAP/REST) calls made by ISUs; the activityLogging REST API reference requires login.
- Audit event names for API client creation, refresh token generation, or client disablement.

## Sources
- [Register API Client for Data Lake (Refresh Token Grant)](https://doc.workday.com/admin-guide/en-us/workday-data-cloud/data-out/workday-data-lake/register-api-client-for-data-lake--refresh-token-g.html) (retrieved 2026-10-14)
- [Register API Client for Data Lake (JWT Bearer Grant)](https://doc.workday.com/admin-guide/en-us/workday-data-cloud/data-out/workday-data-lake/register-api-client-for-data-lake--jwt-bearer-gran.html) (retrieved 2026-10-14)
- [Workday AI Admin Guide PDF (FAQ: Agent Security)](https://doc.workday.com/content/dam/fmdita-outputs/pdfs/admin-guide/en-us/Admin-Guide-Workday-AI.pdf) (retrieved 2026-10-14)
- [Reference: Edit Tenant Setup - Security](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/tenant-setup/dan1370796470031.html) (retrieved 2026-10-14)
- [Set Up Live Data Query ISU Authentication in Workday](https://doc.workday.com/admin-guide/en-us/workday-data-cloud/data-out/workday-live-data-query-/set-up-live-data-query-isu-authentication.html) (retrieved 2026-10-14)
- [Connect to Workday Using ISU Name and Password (Peakon)](https://doc.workday.com/peakon/en-us/workday-peakon-employee-voice/integrations/workday-integration/gen1667304794785.html) (retrieved 2026-10-14)
- [Obtain the Workday REST API Endpoint](https://doc.workday.com/admin-guide/en-us/workday-studio/integration-design/common-components/the-prismanalytics-subassembly/qjw1533213809425.html) (retrieved 2026-10-14)
- [Concept: User Activity Logging](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/user-activity-logging/unv1636547598141.html) (retrieved 2026-10-14)
- [Workday REST API reference: privacy v1 GET /activityLogging](https://community.workday.com/sites/default/files/file-hosting/restapi/index.html#privacy/v1/get-/activityLogging) (retrieved 2026-10-14)
- [Reference: Auditing-Related Reports](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/auditing/wln1467042699742.html) (retrieved 2026-10-14)
- [Workday Web Services v47.0 Human_Resources Get_Workers](https://community.workday.com/sites/default/files/file-hosting/productionapi/Human_Resources/v47.0/Get_Workers.html) (retrieved 2026-10-14)
- [Reference: Integrations, EIB, and Web Service Limits](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/it-administrator-resources/limitations-and-availability/dan1370797408285.html) (retrieved 2026-10-14)
