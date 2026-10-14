# Snyk: Snyk API token (legacy personal API token)

`snyk-2` · API key / token · person. One per-user key from General account settings, sent as `Authorization: token`. Snyk calls it legacy and not recommended.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Snyk docs describe no customer-configurable IP allowlist for API callers; IP lists in docs cover Snyk scanners reaching your targets. |  |
| Protect: Expires automatically | Not available | Never expires |  |
| Detect: Usage appears in logs | Yes | userId / user_id | Snyk audit logs (Group/Org search API): Enterprise; past 90 days; GET /rest/groups/{group_id}/audit_logs/search and /rest/orgs/{org_id}/audit_logs/search; api.access hidden unless requested via events=api.access. · Event forwarding (Amazon EventBridge, AWS CloudTrail Lake): Platform audit events, Enterprise; use for retention beyond 90 days. |
| Detect: Data reads appear in logs | Conditional | Reads have no explicit action event. | API: GET https://api.snyk.io/rest/groups/{group_id}/audit_logs/search?version={version}&events=api.access&user_id={user_id} (or /rest/orgs/{org_id}/audit_logs/search) |
| Respond: Revocation ends active access | Yes | Integrations using the key stop immediately. | Where: app.snyk.io/account > General Account Settings > Auth Token > Revoke & Regenerate (token owner only) |
| Respond: Stops working when user is removed | Partial | Removing a user from a Group removes their access to its Organizations and Projects, but docs do not say the token itself is revoked. | Where: Group > Members > trash icon next to user > Delete member · API: DELETE https://api.snyk.io/rest/groups/{group_id}/memberships/{membership_id}?version={version}&cascade=true; per Org: DELETE https://api.snyk.io/v1/org/{orgId}/members/update/{userId} |

## Protect: what an admin can configure

### Admin controls
- **Audit logs** (Other; Enterprise; default on). Group and Org audit log search (90 days) incl. service account and app lifecycle and api.access events. Where: GET /rest/{groups|orgs}/{id}/audit_logs/search.

### Not available (vendor states)
- Legacy personal API tokens cannot be given an expiry; they never expire.

- Network: unknown (checked at unknown). Snyk docs describe no customer-configurable IP allowlist for API callers; IP lists in docs cover Snyk scanners reaching your targets.
- Lifetime: Never expires. Renewal: Revoke & Regenerate replaces the key; old key stops working.
- Keyless option: not_applicable. Static key.
- Conditions: API use Enterprise only.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Snyk audit logs (Group/Org search API): Enterprise; past 90 days; GET /rest/groups/{group_id}/audit_logs/search and /rest/orgs/{org_id}/audit_logs/search; api.access hidden unless requested via events=api.access.
- Event forwarding (Amazon EventBridge, AWS CloudTrail Lake): Platform audit events, Enterprise; use for retention beyond 90 days.

### Fields that identify the credential
- `userId / user_id` (audit logs): Identifies the acting user; whether a service account appears here is not documented.

### Lifecycle events
- use: `api.access` Exists in Group and Org event lists; excluded by default; described as high-volume low-information.

### Correlate on
`user_id`, `org_id`, `group_id`, `project_id`, `created`

### API calls a holder can make, and whether they are logged
- recon: `GET /rest/self`. Identity of the token holder Logged: plan (`api.access`). Enterprise; api.access hidden by default; per-call detail not documented.
- discovery (bulk): `GET /rest/orgs`. Organizations the token can access Logged: plan (`api.access`). Same as above.
- enumeration (bulk): `GET /rest/orgs/{org_id}/projects`. Projects / monitored repos and images Logged: plan (`api.access`). Reads have no explicit action event.
- collection (bulk): `GET /rest/orgs/{org_id}/issues`. All vulnerability findings for the Org Logged: plan (`api.access`). Reads have no explicit action event.

### What to look for (analyst guidance)
- Long-lived key used from new automation
- api.access spikes for one user_id

## Respond: how to revoke it
- Admin: **Revoke & Regenerate**. The owner invalidates the legacy API token and gets a new one; integrations stop immediately. Where: app.snyk.io/account > General > Revoke & Regenerate.

Owner clicks Revoke & Regenerate at app.snyk.io/account. Live access ends on revocation: yes. Integrations using the key stop immediately.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Audit event for Revoke & Regenerate
- Admin ability to force revoke
- Exact fields recorded in api.access
- Whether PATs, legacy API tokens or service account tokens bypass SSO / IdP conditional access (not stated).
- Any admin setting to disable PATs or legacy API tokens, or to revoke another user's personal token (none documented).
- Whether removing a user from a Group/Org or the IdP invalidates their PAT/legacy token (not stated).
- Any customer IP allowlist for API requests (none documented).
- Audit event names for PAT and legacy token create/revoke (not in the documented event lists).
- Contents of api.access events (which fields identify the token or service account).
- Admin approval or allowlist for Snyk App installation.
- Token string prefixes / formats.
- Refresh token lifetime for Snyk Apps.

## Sources
- [Authentication for API](https://docs.snyk.io/developer-tools/snyk-api/authentication-for-api) (retrieved 2026-10-14)
- [Getting started](https://docs.snyk.io/getting-started-guides/getting-started) (retrieved 2026-10-14)
- [Revoke and regenerate a Snyk API token](https://docs.snyk.io/developer-tools/snyk-api/authentication-for-api/revoke-and-regenerate-a-snyk-api-token) (retrieved 2026-10-14)
- [Manage users in a Group](https://docs.snyk.io/platform-administration/snyk-hierarchy/groups/manage-users-in-a-group) (retrieved 2026-10-14)
- [Retrieve audit logs of user-initiated activity by API for an Org or Group](https://docs.snyk.io/platform-administration/user-management/user-management-with-the-api/retrieve-audit-logs-of-user-initiated-activity-by-api-for-an-org-or-group) (retrieved 2026-10-14)
- [Search Audit Logs v1 to REST migration guide](https://docs.snyk.io/developer-tools/snyk-api/api-end-of-life-eol-process-and-migration-guides/guides-to-migration/search-audit-logs-group-and-org-v1-api-to-ga-rest-audit-logs-api-migration-guide) (retrieved 2026-10-14)
- [Audit Logs (API reference)](https://docs.snyk.io/developer-tools/snyk-api/reference/audit-logs) (retrieved 2026-10-14)
- [Snyk REST API spec (rest-spec.json, linked from docs.snyk.io API reference)](https://558411700-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FIEEjSXQQu36y0vmFV8zf%2Fuploads%2Fgit-blob-c1151c14af94bd6daf3db0c2cf3424397eb0191a%2Frest-spec.json?alt=media) (retrieved 2026-10-14)
- [Remove members from Groups and Orgs using the API](https://docs.snyk.io/platform-administration/user-management/user-management-with-the-api/remove-members-from-groups-and-orgs-using-the-api) (retrieved 2026-10-14)
- [Snyk REST API OpenAPI spec 2026-03-25 (AccessTokenTtlSeconds / service account attributes)](https://api.snyk.io/rest/openapi/2026-03-25) (retrieved 2026-10-14)
- [About the REST API](https://docs.snyk.io/developer-tools/snyk-api/rest-api/about-the-rest-api) (retrieved 2026-10-14)
