# Jamf: Jamf Protect API client (client ID + API client password)

`jamf-4` · API key / token · service. Created in Jamf Protect > Administrative > API Clients. The client ID and API client password are posted as JSON to the tenant's /token endpoint for an access token used against /graphql. Jamf recommends the Platform API Gateway instead.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Jamf Protect > Administrative > API Clients shows the tenant's API clients (max five). | Jamf Protect > Administrative > API Clients shows the tenant's API clients (max five). |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented publicly. |  |
| Protect: Expires automatically | No docs found | Not documented publicly |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Where: Jamf Protect > Administrative > Audit Logs > select entries > Export Selected (CSV) · API: POST https://<tenant>.protect.jamfcloud.com/graphql query listAuditLogsByDate |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | No docs found | Delete the API client in Administrative > API Clients. |  |
| Respond: Stops working when user is removed | N/A | Protect API clients are created under Administrative > API Clients and are not tied to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Jamf Protect API client role** (Limit scope; all plans; default unknown). Each Protect API client is assigned a role such as Read Only; max five clients. Where: Jamf Protect > Administrative > API Clients.

- Network: unknown (checked at unknown). Not documented publicly.
- Lifetime: Not documented publicly. Renewal: New token requested with the same client ID and password.
- Keyless option: not_verified. 
- Conditions: 

## Detect: what gets logged
- Token prefix: not established

### Logs
- Jamf Protect Audit Logs: Kept one year, CSV export; records user, operation, arguments, IPs, resource ID.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`User`, `IP's`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- New API client created (max five)

## Respond: how to revoke it


Delete the API client in Administrative > API Clients. Live access ends on revocation: unknown. 

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Whether API-client activity appears in Protect audit logs
- GraphQL queries for bulk read are not documented on public pages fetched
- IP allowlisting for Jamf Pro API clients or user API access (none found in public docs).
- Default and maximum Access Token Lifetime for API clients (the doc example shows expires_in 599, but no default is stated).
- Whether Jamf Pro admins can block a user account from using /v1/auth/token while keeping UI access.
- Which identity Change Management logs for actions taken by an API client, and whether /v1/oauth/token requests appear in the Access Log.
- Exact Change Management object/action names for API client create/rotate/disable.
- Jamf Protect API token lifetime and revocation; Jamf School API key expiry, auth header format and revocation behavior.
- Platform API Gateway: revoke/disable controls for an integration and IP restrictions.

## Sources
- [Creating an API Client in Jamf Protect](https://learn.jamf.com/r/en-US/jamf-protect-documentation/Creating_an_API_Client_in_Jamf_Protect) (retrieved 2026-10-14)
- [Move an existing integration to the Platform API Gateway](https://developer.jamf.com/platform-api/reference/move-an-existing-integration-to-the-platform-api-gateway) (retrieved 2026-10-14)
- [Exporting Audit Logs (Jamf Protect)](https://learn.jamf.com/r/en-US/jamf-protect-documentation/Exporting_Audit_Logs) (retrieved 2026-10-14)
- [Audit Logs (Jamf Protect)](https://learn.jamf.com/r/en-US/jamf-protect-documentation/Audit_Logs) (retrieved 2026-10-14)
- [jamf/jamfprotect list_audit_logs.py (official example)](https://github.com/jamf/jamfprotect/blob/main/jamf_protect_api/scripts/python/list_audit_logs.py) (retrieved 2026-10-14)
