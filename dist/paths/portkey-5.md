# Portkey: SCIM API token

`portkey-5` · API key / token · service. Bearer token generated in Admin Settings > Authentication Settings > SCIM Provisioning, used by the IdP for user/workspace provisioning.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | No docs found | Not documented |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Audit Logs: Enterprise; Admin Settings > Audit Logs or GET /audit-logs (admin key with audit_logs.list); indefinite retention; filter by user_type=api_key. · Request Logs: Gateway request logs with full request/response; retention 3 days Developer, 30 days Production, unlimited Enterprise. |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | No docs found | Regenerate in Admin Settings > Authentication Settings > SCIM Provisioning (revocation of old token not documented). |  |
| Respond: Stops working when user is removed | N/A | The SCIM token is generated at org level in Admin Settings, not tied to a user's account in the docs. |  |

## Protect: what an admin can configure

### Admin controls
No docs found.

- Network: unknown (checked at unknown). Not documented.
- Lifetime: Not documented. Renewal: Generate a new token in the control plane.
- Keyless option: not_applicable. Static token.
- Conditions: SCIM (Enterprise org management).

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit Logs: Enterprise; Admin Settings > Audit Logs or GET /audit-logs (admin key with audit_logs.list); indefinite retention; filter by user_type=api_key.
- Request Logs: Gateway request logs with full request/response; retention 3 days Developer, 30 days Production, unlimited Enterprise.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
No docs found.

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Unexpected user/workspace provisioning

## Respond: how to revoke it


Regenerate in Admin Settings > Authentication Settings > SCIM Provisioning (revocation of old token not documented). Live access ends on revocation: unknown. 

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Revocation behaviour
- SCIM read endpoints
- IP allowlisting for API keys or JWTs
- Name of the org/workspace maximum key TTL setting
- Whether user API keys are disabled when the user is removed or deprovisioned via SCIM
- Whether SSO enforcement affects API keys
- Whether GET (read) API calls appear in audit logs (filter lists only POST/PUT/DELETE)
- Auth cache delay after key deletion
- SCIM token expiry and revocation
- API key token prefix

## Sources
- [SCIM Overview](https://docs.portkey.ai/docs/product/enterprise-offering/org-management/scim/scim) (retrieved 2026-10-14)
