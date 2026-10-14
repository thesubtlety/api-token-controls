# Datadog: Client token

`datadog-4` · API key / token · service. Org-level token set as clientToken in browser and mobile SDKs to submit RUM events and logs. It is meant to be visible client-side, unlike API keys.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Organization Settings > Client Tokens tab lists the org's client tokens. | Organization Settings > Client Tokens tab lists the org's client tokens. |
| Protect: Admin can block or require approval | Yes | Client Tokens Write permission | Client Tokens Write permission: Organization Settings > Roles; Organization Settings > Client Tokens |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | The org IP allowlist (Pro+ or Enterprise, via support) covers the UI and API but excludes data ingest endpoints. Client-token intake is not named either way; since end-user browsers send this traffic, source-IP limits would not normally fit. |  |
| Protect: Expires automatically | Not available | No built-in expiry |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Organization Settings > Client Tokens: Lists tokens; no documented usage logging · Datadog Audit Trail: May record @asset.type:public_api_key events; not confirmed to be client tokens. |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | Yes | Deletion is permanent; deactivating the creator does not disable it. Token is public by design, so treat as abuse/injection risk, not secret leak. | Delete the token in Organization Settings > Client Tokens and ship a new token in the SDK config. |
| Respond: Stops working when user is removed | Not available | Client tokens stay active when the user who created them is deactivated. |  |

## Protect: what an admin can configure

### Admin controls
- **Client Tokens Write permission** (Disable; all plans; default on). Only roles with client_tokens_write can create or edit client tokens (Standard role by default). Where: Organization Settings > Roles; Organization Settings > Client Tokens.

### Not available (vendor states)
- No expiration for RUM client tokens, and they survive deactivation of the creating user.

- Network: unknown (checked at unknown). The org IP allowlist (Pro+ or Enterprise, via support) covers the UI and API but excludes data ingest endpoints. Client-token intake is not named either way; since end-user browsers send this traffic, source-IP limits would not normally fit.
- Lifetime: No built-in expiry. Renewal: The token is reused until deleted; rotate by creating a new token and updating the client.
- Keyless option: not_applicable. Static public token embedded in client code; no external identity exchange applies.
- Conditions: Tokens stay active after the creating user is deactivated, so review them separately from user offboarding. An authenticated proxy can hide the token from end users.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Organization Settings > Client Tokens: Lists tokens; no documented usage logging
- Datadog Audit Trail: May record @asset.type:public_api_key events; not confirmed to be client tokens.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
No docs found.

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Spike in RUM sessions or browser logs from unexpected application names or origins
- Logs/RUM ingestion volume or cost spike tied to one token
- Client token reused in an app it was not issued for

### Sample query (Datadog Audit Trail search)
Org Settings access/creation/deletion of public API keys (may cover client tokens; unconfirmed)

```
@evt.name:Authentication @asset.type:public_api_key
```

## Respond: how to revoke it


Delete the token in Organization Settings > Client Tokens and ship a new token in the SDK config. Live access ends on revocation: yes. Deletion is permanent; deactivating the creator does not disable it. Token is public by design, so treat as abuse/injection risk, not secret leak.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- token format
- audit event name for client token create/delete
- usage field identifying client token
- whether public_api_key equals client token
- Not researched
- No org setting found that blocks personal application keys or forces service-account-only keys.
- Whether the IP allowlist applies to API-key and client-token requests outside telemetry intake is not stated; entitlement differs between account docs (Pro+/Enterprise) and API reference (Enterprise).
- Plan requirement for Agent-based WIF: current WIF page lists no tier; earlier material says Enterprise-only and preview.
- How to delete or disable an identity mapping is not documented on the WIF page; intake mappings are deleted via API.
- Whether custom roles (needed to narrow these permissions) require a specific plan was not confirmed.

## Sources
- [API and Application Keys](https://docs.datadoghq.com/account_management/api-app-keys/) (retrieved 2026-10-09)
- [Browser Log Collection](https://docs.datadoghq.com/logs/log_collection/javascript/) (retrieved 2026-10-12)
- [Datadog Role Permissions](https://docs.datadoghq.com/account_management/rbac/permissions/) (retrieved 2026-10-12)
- [IP Allowlist - Datadog Infrastructure and Application Monitoring](https://docs.datadoghq.com/account_management/org_settings/ip_allowlist/) (retrieved 2026-10-09)
- [Credential Management](https://docs.datadoghq.com/getting_started/access_for_enterprises/credential_management/) (retrieved 2026-10-12)
- [Audit Trail Events](https://docs.datadoghq.com/account_management/audit_trail/events/) (retrieved 2026-10-12)
