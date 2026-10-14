# PagerDuty: Events API integration key (routing key)

`pagerduty-5` · API key / token · service. 32-character key on a service (or Event Orchestration) integration, sent in the event body as routing_key to https://events.pagerduty.com/v2/enqueue. Can only send events (create/ack/resolve alerts, change events), not read data.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Keys are shown per service on the service's Integrations tab; no account-wide key list found. | Where: Services > Service Directory > service > Integrations tab > expand integration > Integration Key (per service) · API: GET /services?include[]=integrations (per-service integrations); GET /event_orchestrations/{id}/integrations (orchestration routing keys) |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Not available | IP allow list does not affect Events API traffic. |  |
| Protect: Expires automatically | No docs found | No expiry documented |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Incident/alert log entries (GET /log_entries): Events produce alerts/incidents; no per-key audit documented. Audit Trail does not capture integration add/remove. |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | Yes | Rotation overwrites the key immediately; old key presumably rejected (not stated). | Services > service > Integrations > Edit Integration > Generate a new integration key, or Delete Integration. |
| Respond: Stops working when user is removed | N/A | Integration keys belong to a service integration, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Generate a new integration key** (Require rotation; all plans; default unknown). Overwrites the integration key immediately. Where: Services > Service Directory > service > Integrations > Edit Integration > Generate a new integration key.
- **Manager role required for integration keys** (Other; all plans; default on). Only users with a Manager role or above can generate Events API integration keys. Where: User base role.

### Not available (vendor states)
- No IP restriction on Events API traffic.

- Network: excluded (checked at login_only). IP allow list does not affect Events API traffic.
- Lifetime: No expiry documented. Renewal: 'Generate a new integration key' overwrites the key immediately.
- Keyless option: not_applicable. Static key in payload.
- Conditions: Events API available on all accounts.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Incident/alert log entries (GET /log_entries): Events produce alerts/incidents; no per-key audit documented. Audit Trail does not capture integration add/remove.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`method.type`, `method.truncated_token`, `actors[].type/id`, `execution_context.request_id`, `execution_context.remote_address`

### API calls a holder can make, and whether they are logged
- recon: `POST https://events.pagerduty.com/v2/enqueue`. Key validity (202 vs error); cannot read data Logged: unknown. Creates alerts/incidents visible in the service.

### What to look for (analyst guidance)
- Unexpected incidents/alerts or change events on a service
- Spikes near 120 events/min per key

## Respond: how to revoke it
- Admin: **Delete Integration**. Deletes the integration and its key; cannot be recovered. Where: Services > service > Integrations > Delete Integration.

Services > service > Integrations > Edit Integration > Generate a new integration key, or Delete Integration. Live access ends on revocation: yes. Rotation overwrites the key immediately; old key presumably rejected (not stated).

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Expires automatically
- Data reads appear in logs
- Any log of Events API sends by key beyond the resulting alerts/incidents
- Audit coverage of key rotation
- No read endpoints for integration keys.
- Whether general access or user token keys can be given an expiry, or ever expire.
- Whether SSO enforcement or deprovisioning in the IdP affects existing API keys (only "user leaves the account" disables user keys).
- Any admin setting to block users from creating user token keys or to block Classic User OAuth app authorization.
- Whether API key create/disable/delete events appear in the Audit Trail (the tracked resource list does not include API keys).
- Whether disabling/deleting a key or Revoke All User Tokens ends in-flight access immediately (Revoke All runs in the background).
- Whether private app (client credentials) tokens can be revoked by admins other than the app owner; client secret expiry/rotation.
- Whether read (GET) API calls are logged anywhere customer-visible.
- Whether integration key creation/rotation appears in audit records (support page says integration add/remove is not captured; Audit API lists Integrations as an associated resource of Services).

## Sources
- [API Access Keys](https://support.pagerduty.com/main/docs/api-access-keys) (retrieved 2026-10-14)
- [Events API v2 OpenAPI spec](https://docs.pagerduty.com/api-specs/events-v2.json) (retrieved 2026-10-14)
- [IP Allow List for User Sessions](https://support.pagerduty.com/main/docs/ip-allow-list-for-user-sessions) (retrieved 2026-10-14)
- [Services and Integrations](https://support.pagerduty.com/main/docs/services-and-integrations) (retrieved 2026-10-14)
- [PagerDuty REST API OpenAPI v3 spec - List users](https://github.com/PagerDuty/api-schema/blob/main/reference/REST/openapiv3.json) (retrieved 2026-10-14)
- [Audit Trail Reporting](https://support.pagerduty.com/main/docs/audit-trail-reporting) (retrieved 2026-10-14)
- [Events API Rate Limits](https://docs.pagerduty.com/developer/events-api-rate-limits) (retrieved 2026-10-14)
