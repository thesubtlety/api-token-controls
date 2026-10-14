# Snyk: Personal Access Token (PAT)

`snyk-1` · Personal access token · person. User-created token sent as `Authorization: token <PAT>` or via SNYK_TOKEN for CLI/IDE. Acts as the user. API use needs Enterprise; Free/Team tokens work only for CLI/IDE/CI.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Only the owning user can list their own PATs (Personal access tokens tab, GET /self/personal_access_tokens); no admin-wide listing documented. | Only the owning user can list their own PATs (Personal access tokens tab, GET /self/personal_access_tokens); no admin-wide listing documented. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Snyk docs describe no customer-configurable IP allowlist for API callers; IP lists in docs cover Snyk scanners reaching your targets. |  |
| Protect: Expires automatically | Yes | User picks expiry, max 90 days | PAT expiry (max 90 days): Account settings > Personal access tokens |
| Detect: Usage appears in logs | Yes | userId / user_id | Snyk audit logs (Group/Org search API): Enterprise; past 90 days; GET /rest/groups/{group_id}/audit_logs/search and /rest/orgs/{org_id}/audit_logs/search; api.access hidden unless requested via events=api.access. · Event forwarding (Amazon EventBridge, AWS CloudTrail Lake): Platform audit events, Enterprise; use for retention beyond 90 days. |
| Detect: Data reads appear in logs | Conditional | Reads have no explicit action event. | API: GET https://api.snyk.io/rest/groups/{group_id}/audit_logs/search?version={version}&events=api.access&user_id={user_id} (or /rest/orgs/{org_id}/audit_logs/search) |
| Respond: Revocation ends active access | No docs found | Docs say revocation cannot be reverted but do not say whether in-flight access ends instantly. |  |
| Respond: Stops working when user is removed | Partial | Removing a user from a Group removes their access to its Organizations and Projects, but docs do not say the PAT itself is revoked. | Where: Group > Members > trash icon next to user > Delete member · API: DELETE https://api.snyk.io/rest/groups/{group_id}/memberships/{membership_id}?version={version}&cascade=true; per Org: DELETE https://api.snyk.io/v1/org/{orgId}/members/update/{userId} |

## Protect: what an admin can configure

### Admin controls
- **PAT expiry (max 90 days)** (Limit lifetime; all plans; default on). Every PAT has an expiry no later than 90 days; users choose the date. Where: Account settings > Personal access tokens.
- **Audit logs** (Other; Enterprise; default on). Group and Org audit log search (90 days) incl. service account and app lifecycle and api.access events. Where: GET /rest/{groups|orgs}/{id}/audit_logs/search.

### Not available (vendor states)
- PATs cannot be created through the API (UI only), so no admin-driven issuance flow.

- Network: unknown (checked at unknown). Snyk docs describe no customer-configurable IP allowlist for API callers; IP lists in docs cover Snyk scanners reaching your targets.
- Lifetime: User picks expiry, max 90 days. Renewal: Create a new PAT before the old one expires (up to 3 active).
- Keyless option: not_applicable. Static bearer token; no workload identity federation.
- Conditions: API access Enterprise only.

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
- api.access from a user outside working pattern
- Bulk reads of /orgs/{org_id}/issues or projects across many Orgs
- New PAT appearing in GET /self/personal_access_tokens (owner only)

## Respond: how to revoke it
- Admin: **Revoke PAT**. The owner revokes a PAT in the UI or via DELETE /self/personal_access_tokens/{id}. Where: Account settings > Personal access tokens > Revoke; DELETE /rest/self/personal_access_tokens/{personal_access_token_id}.

Owner revokes in Account settings > Personal access tokens or DELETE /rest/self/personal_access_tokens/{id}. Admins can only remove the user from Group/Orgs. Live access ends on revocation: unknown. Docs say revocation cannot be reverted but do not say whether in-flight access ends instantly.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Revocation ends active access
- PAT create/revoke audit event names
- Whether admin removal of the user kills the PAT
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
- [Authenticate to use the CLI](https://docs.snyk.io/developer-tools/snyk-cli/authenticate-to-use-the-cli) (retrieved 2026-10-14)
- [Personal Access Tokens (PATs)](https://docs.snyk.io/developer-tools/snyk-api/authentication-for-api/personal-access-tokens-pats) (retrieved 2026-10-14)
- [Manage users in a Group](https://docs.snyk.io/platform-administration/snyk-hierarchy/groups/manage-users-in-a-group) (retrieved 2026-10-14)
- [PersonalAccessToken (API reference)](https://docs.snyk.io/developer-tools/snyk-api/reference/personalaccesstoken) (retrieved 2026-10-14)
- [Retrieve audit logs of user-initiated activity by API for an Org or Group](https://docs.snyk.io/platform-administration/user-management/user-management-with-the-api/retrieve-audit-logs-of-user-initiated-activity-by-api-for-an-org-or-group) (retrieved 2026-10-14)
- [Search Audit Logs v1 to REST migration guide](https://docs.snyk.io/developer-tools/snyk-api/api-end-of-life-eol-process-and-migration-guides/guides-to-migration/search-audit-logs-group-and-org-v1-api-to-ga-rest-audit-logs-api-migration-guide) (retrieved 2026-10-14)
- [Audit Logs (API reference)](https://docs.snyk.io/developer-tools/snyk-api/reference/audit-logs) (retrieved 2026-10-14)
- [Snyk REST API spec (rest-spec.json, linked from docs.snyk.io API reference)](https://558411700-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FIEEjSXQQu36y0vmFV8zf%2Fuploads%2Fgit-blob-c1151c14af94bd6daf3db0c2cf3424397eb0191a%2Frest-spec.json?alt=media) (retrieved 2026-10-14)
- [Remove members from Groups and Orgs using the API](https://docs.snyk.io/platform-administration/user-management/user-management-with-the-api/remove-members-from-groups-and-orgs-using-the-api) (retrieved 2026-10-14)
- [Snyk REST API OpenAPI spec 2026-03-25 (AccessTokenTtlSeconds / service account attributes)](https://api.snyk.io/rest/openapi/2026-03-25) (retrieved 2026-10-14)
- [Event forwarding](https://docs.snyk.io/developer-tools/integrations/event-forwarding) (retrieved 2026-10-14)
- [About the REST API](https://docs.snyk.io/developer-tools/snyk-api/rest-api/about-the-rest-api) (retrieved 2026-10-14)
