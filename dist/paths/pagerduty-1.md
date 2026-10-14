# PagerDuty: General Access REST API Key (account API key)

`pagerduty-1` · API key / token · service. 20-character account-level key created by an Admin or Account Owner, sent as 'Authorization: Token token=<key>'. Not tied to the creating user; full or read-only access to all account data.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Integrations > Developer Tools > API Access Keys table lists every general access key with status. | Integrations > Developer Tools > API Access Keys table lists every general access key with status. |
| Protect: Admin can block or require approval | Yes | Disable general access REST API key | Disable general access REST API key: Integrations > Developer Tools > API Access Keys > Disable |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Not available | IP Allow List for User Sessions covers web/mobile logins only; REST API calls are explicitly excluded. |  |
| Protect: Expires automatically | No docs found | No expiry documented |  |
| Detect: Usage appears in logs | Yes | method.truncated_token, actors[] (api_key_reference) | Audit Trail (UI + GET /audit/records): Business, Enterprise for Incident Management, Digital Operations (legacy); 12-month retention; config changes on users, teams, schedules, escalation policies, services, IP allow lists only. Admin / global API token, scope audit_records.read. |
| Detect: Data reads appear in logs | Not available | Audit records cover configuration changes only; reads are not listed as audited. |  |
| Respond: Revocation ends active access | No docs found | Docs say a disabled key stops working with the REST API; timing not stated. Keep one key for IP-allow-list lockout recovery. |  |
| Respond: Stops working when user is removed | N/A | Account API keys are tied to the account, not to the user who created them. |  |

## Protect: what an admin can configure

### Admin controls
- **Disable general access REST API key** (Disable; all plans; default off). Stops the key working with the REST API without deleting it; can be re-enabled. Where: Integrations > Developer Tools > API Access Keys > Disable.
- **Read-only API Key** (Limit scope; all plans; default off). Restricts a general access key to GET calls. Where: Create New API Key > Read-only API Key checkbox.

### Not available (vendor states)
- No IP/network restriction for REST API keys; the IP allow list explicitly excludes REST API calls.

- Network: excluded (checked at login_only). IP Allow List for User Sessions covers web/mobile logins only; REST API calls are explicitly excluded.
- Lifetime: No expiry documented. Renewal: Rotate manually: create new key, update clients, delete old.
- Keyless option: not_applicable. Static shared secret; no workload/OIDC federation documented.
- Conditions: REST API available on current pricing plans; also used for SCIM provisioning.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit Trail (UI + GET /audit/records): Business, Enterprise for Incident Management, Digital Operations (legacy); 12-month retention; config changes on users, teams, schedules, escalation policies, services, IP allow lists only. Admin / global API token, scope audit_records.read.

### Fields that identify the credential
- `method.truncated_token` (Audit record): Last 4 chars of the token when method.type=api_token.
- `actors[] (api_key_reference)` (Audit record): Actor type for API-key actions.

### Lifecycle events
- use: `action=create|update|delete with method.type=api_token` Config changes made with the key; reads not documented as logged.

### Correlate on
`method.type`, `method.truncated_token`, `actors[].type/id`, `execution_context.request_id`, `execution_context.remote_address`

### API calls a holder can make, and whether they are logged
- recon: `GET /abilities`. Account features/plan capabilities Logged: unknown. Audit records cover config changes only.
- enumeration (bulk): `GET /users`. All users, emails, roles Logged: unknown. Reads not documented as audited.
- collection (bulk): `GET /incidents`. All incidents Logged: unknown. 
- collection (bulk): `GET /log_entries`. Incident log entries across the account Logged: unknown. 
- collection (bulk): `POST /analytics/raw/incidents`. Enriched incident data; account keys need no team/service filter Logged: unknown. 
- collection: `GET /users`. All users on the account (names, emails, roles) Logged: no. Audit records cover configuration changes only; reads are not listed as audited.

### What to look for (analyst guidance)
- Config changes with method.type=api_token from unexpected remote_address
- Changes to IP allow lists, users or roles via api_token
- Bulk incident or user reads (not visible in audit)

## Respond: how to revoke it
- Admin: **Delete (Remove) general access REST API key**. Permanently removes the key. Where: Integrations > Developer Tools > API Access Keys > Remove.

Integrations > Developer Tools > API Access Keys: Disable (reversible) or Remove (permanent). Issue a replacement key first if SCIM or recovery depends on it. Live access ends on revocation: unknown. Docs say a disabled key stops working with the REST API; timing not stated. Keep one key for IP-allow-list lockout recovery.

## No vendor documentation found
- SSO and MFA rules apply
- Expires automatically
- Revocation ends active access
- API key create/disable/delete audit events
- Last-used timestamp for account keys
- GET /users/me does not work with account keys, so no whoami for this credential.
- Whether general access or user token keys can be given an expiry, or ever expire.
- Whether SSO enforcement or deprovisioning in the IdP affects existing API keys (only "user leaves the account" disables user keys).
- Any admin setting to block users from creating user token keys or to block Classic User OAuth app authorization.
- Whether API key create/disable/delete events appear in the Audit Trail (the tracked resource list does not include API keys).
- Whether disabling/deleting a key or Revoke All User Tokens ends in-flight access immediately (Revoke All runs in the background).
- Whether private app (client credentials) tokens can be revoked by admins other than the app owner; client secret expiry/rotation.
- Whether read (GET) API calls are logged anywhere customer-visible.
- Whether integration key creation/rotation appears in audit records (support page says integration add/remove is not captured; Audit API lists Integrations as an associated resource of Services).

## Sources
- [Authentication](https://docs.pagerduty.com/developer/authentication) (retrieved 2026-10-14)
- [API Access Keys](https://support.pagerduty.com/main/docs/api-access-keys) (retrieved 2026-10-14)
- [IP Allow List for User Sessions](https://support.pagerduty.com/main/docs/ip-allow-list-for-user-sessions) (retrieved 2026-10-14)
- [OAuth Functionality](https://docs.pagerduty.com/developer/oauth-functionality) (retrieved 2026-10-14)
- [Security Hygiene for the Current Cyber Threat Landscape](https://support.pagerduty.com/main/docs/security-hygiene-for-the-current-cyber-threat-landscape) (retrieved 2026-10-14)
- [SCIM API OpenAPI spec](https://docs.pagerduty.com/api-specs/scim.json) (retrieved 2026-10-14)
- [SCIM User Provisioning](https://support.pagerduty.com/main/docs/scim-user-provisioning) (retrieved 2026-10-14)
- [Audit Trail Reporting](https://support.pagerduty.com/main/docs/audit-trail-reporting) (retrieved 2026-10-14)
- [Audit Records API](https://docs.pagerduty.com/developer/audit-records-api) (retrieved 2026-10-14)
- [REST API OpenAPI spec — List audit records](https://docs.pagerduty.com/api-specs/rest.json) (retrieved 2026-10-14)
- [REST API Rate Limits](https://docs.pagerduty.com/developer/rest-api-rate-limits) (retrieved 2026-10-14)
- [PagerDuty REST API OpenAPI v3 spec - List users](https://github.com/PagerDuty/api-schema/blob/main/reference/REST/openapiv3.json) (retrieved 2026-10-14)
