# SailPoint Identity Security Cloud: Virtual appliance (VA) key and keyPassphrase

`sailpoint-4` · OAuth · service. Creating a VA generates a VA key that appears as type VA on the API Management page. Each VA holds an RSA private key derived from the cluster keyPassphrase that decrypts source credentials.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | VA keys appear on the API Management page with Type 'VA'. | VA keys appear on the API Management page with Type 'VA'. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No documented IP binding for VA keys. |  |
| Protect: Expires automatically | No docs found | Not documented |  |
| Detect: Usage appears in logs | No docs found | No log source found. |  |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | No docs found | Rotation of keyPassphrase not covered here. |  |
| Respond: Stops working when user is removed | N/A | The VA key is created with the virtual appliance, not tied to a user. |  |

## Protect: what an admin can configure

### Admin controls
No docs found.

- Network: unknown (checked at unknown). No documented IP binding for VA keys.
- Lifetime: Not documented. Renewal: Not documented.
- Keyless option: not_applicable. Machine credential on customer-hosted appliance.
- Conditions: Admin access to Connections > Virtual Appliances

## Detect: what gets logged
- Token prefix: not established

### Logs
No docs found.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
No docs found.

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- VA key use from outside the appliance network

## Respond: how to revoke it
- Admin: **Delete VA**. Deleting the VA removes its VA key. Where: Admin > Connections > Virtual Appliances > Edit > Virtual Appliances > Delete.

Delete the VA, then shut down the VA instance. Live access ends on revocation: unknown. Rotation of keyPassphrase not covered here.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Usage appears in logs
- Data reads appear in logs
- Revocation ends active access
- VA key logging
- VA key rotation
- Not researched
- Any org setting to disable PAT creation or require approval for PATs/API clients
- Any admin-enforced maximum PAT lifetime (API states no upper limit on expirationDate but the doc only says this, not that no policy exists)
- Whether Network Settings IP/geo restrictions apply to /oauth/token or API calls
- Whether deleting a PAT or API client invalidates already-issued bearer tokens (scope changes do not affect existing bearer tokens)
- Audit event names for PAT/API client create, use, delete (published sample list is partial and lists none)
- Whether API read calls (search, list identities) produce audit events
- Whether disabling the owning identity stops its PATs
- VA key lifetime, rotation and use logging

## Sources
- [Managing API Keys and Personal Access Tokens](https://documentation.sailpoint.com/saas/help/common/api_keys.html) (retrieved 2026-10-14)
- [Deploying Virtual Appliances](https://documentation.sailpoint.com/saas/help/va/deploy_va.html) (retrieved 2026-10-14)
- [Managing Virtual Appliances](https://documentation.sailpoint.com/saas/help/va/manage_va.html) (retrieved 2026-10-14)
