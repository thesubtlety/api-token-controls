# Jamf: Jamf School API key

`jamf-5` · API key / token · service. A static API key created under Organization > Settings > API authorizes all API calls to https://{yourURL}.jamfcloud.com/api, limited to the methods selected for the key.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Organization > Settings > API is where API keys are created and edited. | Organization > Settings > API is where API keys are created and edited. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented publicly. |  |
| Protect: Expires automatically | No docs found | No expiry documented |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Jamf School Audit Log: Retained 15 months; Organization > Audit Log; GET <domain>/audit-logs/v1 (3 months per request). |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Delete is not explicitly documented. |  |
| Respond: Stops working when user is removed | N/A | API keys are created at the organization level, not tied to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Jamf School API key methods** (Limit scope; all plans; default unknown). Each key is limited to the API methods selected for it. Where: Organization > Settings > API > Add API Key.

- Network: unknown (checked at unknown). Not documented publicly.
- Lifetime: No expiry documented. Renewal: Key is reused on every call.
- Keyless option: not_applicable. Static key.
- Conditions: 

## Detect: what gets logged
- Token prefix: not established

### Logs
- Jamf School Audit Log: Retained 15 months; Organization > Audit Log; GET <domain>/audit-logs/v1 (3 months per request).

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`IP Address`, `Who`

### API calls a holder can make, and whether they are logged
- collection (bulk): `GET <domain>/audit-logs/v1`. Audit log entries (3 months per request) Logged: unknown. 

### What to look for (analyst guidance)
- New API key with broad methods

## Respond: how to revoke it


Remove the key under Organization > Settings > API. Live access ends on revocation: unknown. Delete is not explicitly documented.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Whether API key calls are attributed in the audit log
- IP allowlisting for Jamf Pro API clients or user API access (none found in public docs).
- Default and maximum Access Token Lifetime for API clients (the doc example shows expires_in 599, but no default is stated).
- Whether Jamf Pro admins can block a user account from using /v1/auth/token while keeping UI access.
- Which identity Change Management logs for actions taken by an API client, and whether /v1/oauth/token requests appear in the Access Log.
- Exact Change Management object/action names for API client create/rotate/disable.
- Jamf Protect API token lifetime and revocation; Jamf School API key expiry, auth header format and revocation behavior.
- Platform API Gateway: revoke/disable controls for an integration and IP restrictions.

## Sources
- [Jamf School API](https://learn.jamf.com/r/en-US/jamf-school-documentation/Jamf_School_API) (retrieved 2026-10-14)
- [Audit Log (Jamf School)](https://learn.jamf.com/r/en-US/jamf-school-documentation/Jamf_School_Audit_Log) (retrieved 2026-10-14)
