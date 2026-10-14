# PagerDuty: User Token REST API Key (personal REST API key)

`pagerduty-2` · Personal access token · person. 20-character key created by a user in My Profile > User Settings > API Access; requests run with that user's permissions. Same Token header format as account keys.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes (requires Plans with Advanced Permissions (Professional, Business, Enterprise for Incident Management, Digital Operations legacy, PD Reliability Platform)) | Base role: personal REST API key permission | Base role: personal REST API key permission: People > Users > user base role |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Not available | IP allow list does not restrict REST API calls. |  |
| Protect: Expires automatically | No docs found | No expiry documented; disabled if user leaves |  |
| Detect: Usage appears in logs | Yes | method.truncated_token, actors[] (user_reference) | Audit Trail (UI + GET /audit/records): Business, Enterprise for Incident Management, Digital Operations (legacy); 12-month retention; config changes on users, teams, schedules, escalation policies, services, IP allow lists only. Admin / global API token, scope audit_records.read. |
| Detect: Data reads appear in logs | Not available | Audit records cover configuration changes only. |  |
| Respond: Revocation ends active access | No docs found | Admins cannot remove keys of Admins/Global Admins/Account Owner; those users must remove their own. |  |
| Respond: Stops working when user is removed | Yes | Docs say a user API key is disabled when the user leaves the account. | Where: People > Users > user name > Delete User (Advanced Permissions accounts go through the Offboarding flow) · API: DELETE /users/{id} |

## Protect: what an admin can configure

### Admin controls
- **User permissions bound user tokens** (Limit scope; Advanced Permissions accounts; default on). User token requests are limited to the user's own permissions. Where: User role / Advanced Permissions.
- **Base role: personal REST API key permission** (Disable; Plans with Advanced Permissions (Professional, Business, Enterprise for Incident Management, Digital Operations legacy, PD Reliability Platform); default varies). Under Advanced Permissions, every base role except Limited Stakeholder can create personal REST API keys; assigning Limited Stakeholder removes the ability. Where: People > Users > user base role.

### Not available (vendor states)
- No IP/network restriction for user token keys.
- Admins cannot delete user token keys belonging to the Account Owner, Admins or Global Admins.

- Network: excluded (checked at login_only). IP allow list does not restrict REST API calls.
- Lifetime: No expiry documented; disabled if user leaves. Renewal: Lost or rotated keys are deleted and recreated.
- Keyless option: not_applicable. Static secret; none documented.
- Conditions: Advanced Permissions accounts only. No admin setting to disable user key creation is documented.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit Trail (UI + GET /audit/records): Business, Enterprise for Incident Management, Digital Operations (legacy); 12-month retention; config changes on users, teams, schedules, escalation policies, services, IP allow lists only. Admin / global API token, scope audit_records.read.

### Fields that identify the credential
- `method.truncated_token` (Audit record): Last 4 chars.
- `actors[] (user_reference)` (Audit record): Presumed acting user; not explicitly documented for user keys.

### Lifecycle events
- use: `action=create|update|delete with method.type=api_token` Config changes only.

### Correlate on
`method.type`, `method.truncated_token`, `actors[].type/id`, `execution_context.request_id`, `execution_context.remote_address`

### API calls a holder can make, and whether they are logged
- recon: `GET /users/me`. Owning user and role Logged: unknown. 
- enumeration (bulk): `GET /users`. Users visible to the owner Logged: unknown. 
- collection (bulk): `GET /incidents`. Incidents the user can see Logged: unknown. 
- collection: `GET /users`. Users the key owner can see Logged: no. Audit records cover configuration changes only.

### What to look for (analyst guidance)
- Check last used date in User Settings API Access table
- Admin-user tokens used for config changes

## Respond: how to revoke it
- Admin: **Delete another user's API user token**. Admins/Account Owner can delete other users' personal keys, except keys of Account Owner, Admins or Global Admins. Where: User Settings > API Access > Remove.

User or Admin: User Settings > API Access > Remove. Removing the user from the account disables their keys. Live access ends on revocation: unknown. Admins cannot remove keys of Admins/Global Admins/Account Owner; those users must remove their own.

## No vendor documentation found
- Admin can list all of them
- SSO and MFA rules apply
- Expires automatically
- Revocation ends active access
- Key create/delete audit events
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
- [Authentication](https://docs.pagerduty.com/developer/authentication) (retrieved 2026-10-14)
- [IP Allow List for User Sessions](https://support.pagerduty.com/main/docs/ip-allow-list-for-user-sessions) (retrieved 2026-10-14)
- [OAuth Functionality](https://docs.pagerduty.com/developer/oauth-functionality) (retrieved 2026-10-14)
- [Advanced Permissions](https://support.pagerduty.com/main/docs/advanced-permissions) (retrieved 2026-10-14)
- [Manage Users](https://support.pagerduty.com/main/docs/manage-users) (retrieved 2026-10-14)
- [PagerDuty REST API OpenAPI v3 spec - List users](https://github.com/PagerDuty/api-schema/blob/main/reference/REST/openapiv3.json) (retrieved 2026-10-14)
- [Audit Trail Reporting](https://support.pagerduty.com/main/docs/audit-trail-reporting) (retrieved 2026-10-14)
- [Audit Records API](https://docs.pagerduty.com/developer/audit-records-api) (retrieved 2026-10-14)
- [REST API OpenAPI spec — List audit records](https://docs.pagerduty.com/api-specs/rest.json) (retrieved 2026-10-14)
- [REST API Rate Limits](https://docs.pagerduty.com/developer/rest-api-rate-limits) (retrieved 2026-10-14)
- [Advanced Permissions](https://docs.pagerduty.com/account-admin/advanced-permissions) (retrieved 2026-10-14)
