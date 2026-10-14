# Jamf: Jamf Pro API client (API Roles and Clients, client credentials)

`jamf-1` · OAuth · service. An admin creates an API client with one or more API roles and generates a client secret. The client ID and secret are exchanged at POST /api/v1/oauth/token (grant_type=client_credentials) for a short-lived bearer token. Works for both the Jamf Pro API and the Classic API.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Settings > API Roles and Clients lists clients; GET /v1/api-integrations returns them via API. | Settings > API Roles and Clients lists clients; GET /v1/api-integrations returns them via API. |
| Protect: Admin can block or require approval | Yes | Disable API Client | Disable API Client: Settings > System > API roles and clients > client > Disable API Client; or PUT /v1/api-integrations/{id} enabled=false |
| Protect: SSO and MFA rules apply | Not available | Jamf says API authentication does not support SSO; client credentials are exchanged directly for tokens. |  |
| Protect: IP restriction | No docs found | No IP allowlist for API clients found in public Jamf Pro docs. |  |
| Protect: Expires automatically | Partial | Access token lifetime set per client (Access Token Lifetime, seconds); client secret has no documented expiry | Rotate Client Secret: API client > Rotate Client Secret; POST /v1/api-integrations/{id}/client-credentials · Access Token Lifetime: API client > Access Token Lifetime (accessTokenLifetimeSeconds) |
| Detect: Usage appears in logs | Yes | clientId, authorizedUsername | Change Management log: Settings > Change Management; Jamf Cloud: view in UI only, not exportable except via Jamf Log Stream (Jamf Cloud Premium). Retention set by log flushing. · Access Log: Login and token requests with username, IP, entryPoint. Export via Log Stream (Premium). Flushable. · RestAPIOperation webhook: Fires on authorized Classic API requests; includes authorizedUsername, objectTypeName, restAPIOperationType. |
| Detect: Data reads appear in logs | Yes | GET /v3/computers-inventory | Where: Jamf Pro > Settings > System > Change management (Read operations); Jamf Cloud Premium: stream JAMFChangeManagement via Jamf Log Stream |
| Respond: Revocation ends active access | Partial | Disable/delete leaves valid tokens working until expiry; role edits apply immediately. | Disable or delete the client and rotate its secret; to cut live tokens immediately, remove privileges from the client's API roles (role changes apply to live tokens). |
| Respond: Stops working when user is removed | N/A | API clients are standalone service credentials, not tied to a Jamf Pro user account. |  |

## Protect: what an admin can configure

### Admin controls
- **Disable API Client** (Disable; all plans; default varies). Stops the client from issuing new access tokens; existing tokens stay valid until expiry. Where: Settings > System > API roles and clients > client > Disable API Client; or PUT /v1/api-integrations/{id} enabled=false.
- **Rotate Client Secret** (Require rotation; all plans; default unknown). Invalidates the old secret so it can no longer mint tokens. Where: API client > Rotate Client Secret; POST /v1/api-integrations/{id}/client-credentials.
- **API Roles** (Limit scope; all plans; default unknown). Client privileges are the union of assigned API roles; editing a role's privileges applies to live tokens immediately. Where: Settings > System > API roles and clients > API Roles; /v1/api-roles.
- **Access Token Lifetime** (Limit lifetime; all plans; default unknown). Sets token lifetime in seconds per client; changes do not affect tokens already issued. Where: API client > Access Token Lifetime (accessTokenLifetimeSeconds).
- **Token scope parameter** (Limit scope; all plans; default off). Caller may request a token limited to a subset of the client's roles. Where: scope parameter on POST /v1/oauth/token.

### Not available (vendor states)
- Disabling or deleting an API client does not end access for tokens already issued; there is no documented per-client token revocation.

- Network: unknown (checked at unknown). No IP allowlist for API clients found in public Jamf Pro docs.
- Lifetime: Access token lifetime set per client (Access Token Lifetime, seconds); client secret has no documented expiry. Renewal: Request a new token with the same client ID and secret; secret is rotated manually.
- Keyless option: not_applicable. Static client secret; no workload identity federation documented. Jamf states API authentication does not support SSO.
- Conditions: Requires Create/Update/Delete API Integrations privileges.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Change Management log: Settings > Change Management; Jamf Cloud: view in UI only, not exportable except via Jamf Log Stream (Jamf Cloud Premium). Retention set by log flushing.
- Access Log: Login and token requests with username, IP, entryPoint. Export via Log Stream (Premium). Flushable.
- RestAPIOperation webhook: Fires on authorized Classic API requests; includes authorizedUsername, objectTypeName, restAPIOperationType.

### Fields that identify the credential
- `clientId` (API integrations (GET /v1/api-integrations)): Client ID of the API client.
- `authorizedUsername` (RestAPIOperation webhook): What value appears for an API client is not documented.

### Lifecycle events
No docs found.

### Correlate on
`clientId`, `ipAddress (Access Log)`, `entryPoint`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/v1/jamf-pro-version`. Server version Logged: unknown. 
- discovery (bulk): `GET /api/v1/api-integrations`. All API clients, roles, lifetimes Logged: unknown. 
- collection (bulk): `GET /api/v3/computers-inventory`. Paginated computer inventory Logged: unknown. Change Management records READ operations for some objects; not confirmed for API reads.
- collection (bulk): `GET /api/v3/computers-inventory/filevault`. FileVault recovery data for all computers Logged: unknown. 
- collection: `GET /v3/computers-inventory`. Paginated computer inventory records Logged: yes. Change Management log records Read operations (shown as [READ] entries with username). In Jamf Cloud it is viewable in the UI only; export via Log Stream needs Jamf Cloud Premium.

### What to look for (analyst guidance)
- New API client or newly rotated secret
- Role with broad privileges added to a client
- Classic API reads from unexpected sources via RestAPIOperation webhook

## Respond: how to revoke it
- Admin: **Remove specified API integration**. Deletes the API client; already-issued tokens remain valid until expiry. Where: DELETE /v1/api-integrations/{id} or UI delete.

Disable or delete the client and rotate its secret; to cut live tokens immediately, remove privileges from the client's API roles (role changes apply to live tokens). Live access ends on revocation: partial. Disable/delete leaves valid tokens working until expiry; role edits apply immediately.

## No vendor documentation found
- IP restriction
- Exact Change Management event names for API client actions
- Whether client-credential token requests are recorded in the Access Log
- GET /v1/auth behavior for client-credential tokens (documented for user tokens)
- IP allowlisting for Jamf Pro API clients or user API access (none found in public docs).
- Default and maximum Access Token Lifetime for API clients (the doc example shows expires_in 599, but no default is stated).
- Whether Jamf Pro admins can block a user account from using /v1/auth/token while keeping UI access.
- Which identity Change Management logs for actions taken by an API client, and whether /v1/oauth/token requests appear in the Access Log.
- Exact Change Management object/action names for API client create/rotate/disable.
- Jamf Protect API token lifetime and revocation; Jamf School API key expiry, auth header format and revocation behavior.
- Platform API Gateway: revoke/disable controls for an integration and IP restrictions.

## Sources
- [Client Credentials](https://developer.jamf.com/jamf-pro/docs/client-credentials) (retrieved 2026-10-14)
- [Obtain an access token using an API Client](https://developer.jamf.com/jamf-pro/reference/postoauthtoken) (retrieved 2026-10-14)
- [Jamf Pro API Overview](https://developer.jamf.com/jamf-pro/docs/jamf-pro-api-overview) (retrieved 2026-10-14)
- [Creating an API Client](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/Creating_an_API_Client) (retrieved 2026-10-14)
- [Rotating a Client Secret](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/Rotating_a_Client_Secret) (retrieved 2026-10-14)
- [Create API integration object](https://developer.jamf.com/jamf-pro/reference/postcreateapiintegration) (retrieved 2026-10-14)
- [Disabling an API Client](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/Disabling_an_API_Client) (retrieved 2026-10-14)
- [API Roles and Clients - Jamf Pro Documentation 11.33.0](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/API_Roles_and_Clients) (retrieved 2026-10-14)
- [Get the current API Integrations](https://developer.jamf.com/jamf-pro/reference/get_v1-api-integrations) (retrieved 2026-10-14)
- [Jamf Log Stream](https://developer.jamf.com/jamf-pro/docs/jamf-log-stream) (retrieved 2026-10-14)
- [Viewing Change Management Logs in Jamf Pro](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/Viewing_Change_Management_Logs_in_Jamf_Pro) (retrieved 2026-10-14)
- [Jamf Premium Cloud](https://learn.jamf.com/r/en-US/technical-articles/Jamf_Premium_Cloud_Prerequisites) (retrieved 2026-10-14)
- [Change Management](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/Change_Management) (retrieved 2026-10-14)
- [Webhooks](https://developer.jamf.com/jamf-pro/docs/webhooks-1) (retrieved 2026-10-14)
- [Generating a Client Secret](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/Generating_a_Client_Secret) (retrieved 2026-10-14)
- [Log Flushing](https://learn.jamf.com/r/en-US/jamf-pro-documentation-current/Log_Flushing) (retrieved 2026-10-14)
- [Jamf Pro API reference index](https://developer.jamf.com/jamf-pro/reference/llms.txt) (retrieved 2026-10-14)
- [Return paginated Computer Inventory records](https://developer.jamf.com/jamf-pro/reference/get_v3-computers-inventory) (retrieved 2026-10-14)
