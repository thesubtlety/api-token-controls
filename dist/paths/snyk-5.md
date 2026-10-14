# Snyk: Snyk Apps (OAuth 2.0 apps: user or tenant context)

`snyk-5` · OAuth · person or service. OAuth 2.0 apps created in an Org. Interactive installs use authorization code (PKCE) and get access + refresh tokens sent as `Authorization: bearer`; apps can also be installed for unattended client_credentials use.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Admins can list apps the Organization created (GET /rest/orgs/{orgId}/apps/creations); the Authorized Snyk Apps page shows only the viewing user's authorizations. | Admins can list apps the Organization created (GET /rest/orgs/{orgId}/apps/creations); the Authorized Snyk Apps page shows only the viewing user's authorizations. |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | Install Apps (Snyk Apps management permission) | Install Apps (Snyk Apps management permission): Group > Settings > Member roles > Snyk Apps management > Install Apps |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Snyk docs describe no customer-configurable IP allowlist for API callers; IP lists in docs cover Snyk scanners reaching your targets. |  |
| Protect: Expires automatically | Yes | Access token TTL set per app (1h-24h); refresh token single-use | API: Set access_token_ttl_seconds (3600-86400) in POST https://api.snyk.io/rest/orgs/{org_id}/apps/creations or PATCH /rest/orgs/{org_id}/apps/creations/{app_id} |
| Detect: Usage appears in logs | Yes | client_id / install_id | Snyk audit logs (Group/Org search API): Enterprise; past 90 days; GET /rest/groups/{group_id}/audit_logs/search and /rest/orgs/{org_id}/audit_logs/search; api.access hidden unless requested via events=api.access. · Event forwarding (Amazon EventBridge, AWS CloudTrail Lake): Platform audit events, Enterprise; use for retention beyond 90 days. |
| Detect: Data reads appear in logs | Conditional | Reads have no explicit action event. | API: GET https://api.snyk.io/rest/groups/{group_id}/audit_logs/search?version={version}&events=api.access&user_id={user_id} (or /rest/orgs/{org_id}/audit_logs/search) |
| Respond: Revocation ends active access | Partial | Refresh token revoked immediately; whether issued access tokens die before TTL is not stated. | Revoke the install (UI or DELETE /rest/groups/{group_id}/apps/installs/{install_id}), revoke refresh token via POST /oauth2/revoke, or delete the app. |
| Respond: Stops working when user is removed | Partial | User-context apps lose access when the installing user deactivates their account; tenant-context apps are not tied to the user. | Where: Group > Members > Delete member (user-context apps lose access when the installing user deactivates); tenant-context: Authorized Snyk Apps page > Revoke · API: DELETE https://api.snyk.io/rest/orgs/{org_id}/apps/installs/{install_id}?version={version} |

## Protect: what an admin can configure

### Admin controls
- **Snyk App scopes** (Limit scope; all plans; default varies). App permissions are fixed Org-level scopes, and an installer cannot grant scopes beyond their own permissions. Where: scopes on POST /rest/orgs/{org_id}/apps/creations.
- **Audit logs** (Other; Enterprise; default on). Group and Org audit log search (90 days) incl. service account and app lifecycle and api.access events. Where: GET /rest/{groups|orgs}/{id}/audit_logs/search.
- **Install Apps (Snyk Apps management permission)** (Disable; Enterprise; default varies). Role permission that allows installing Snyk Apps; the pre-defined Org Collaborator role does not have it, and custom roles can leave it off. Where: Group > Settings > Member roles > Snyk Apps management > Install Apps.

- Network: unknown (checked at unknown). Snyk docs describe no customer-configurable IP allowlist for API callers; IP lists in docs cover Snyk scanners reaching your targets.
- Lifetime: Access token TTL set per app (1h-24h); refresh token single-use. Renewal: Refresh token exchanged for new pair; old one invalid.
- Keyless option: not_applicable. 
- Conditions: 

## Detect: what gets logged
- Token prefix: not established

### Logs
- Snyk audit logs (Group/Org search API): Enterprise; past 90 days; GET /rest/groups/{group_id}/audit_logs/search and /rest/orgs/{org_id}/audit_logs/search; api.access hidden unless requested via events=api.access.
- Event forwarding (Amazon EventBridge, AWS CloudTrail Lake): Platform audit events, Enterprise; use for retention beyond 90 days.

### Fields that identify the credential
- `client_id / install_id` (apps installs API): Audit payload fields not documented.

### Lifecycle events
- create: `org.app.create` App created in Org
- modify: `org.app.edit` 
- revoke: `org.app.delete` 
- create: `org.app_bot.create` Meaning not documented
- use: `api.access` Exists in Group and Org event lists; excluded by default; described as high-volume low-information.

### Correlate on
`user_id`, `org_id`, `group_id`, `project_id`, `created`

### API calls a holder can make, and whether they are logged
- recon: `GET /rest/self`. Identity of the token holder Logged: plan (`api.access`). Enterprise; api.access hidden by default; per-call detail not documented.
- discovery (bulk): `GET /rest/orgs`. Organizations the token can access Logged: plan (`api.access`). Same as above.
- enumeration (bulk): `GET /rest/orgs/{org_id}/projects`. Projects / monitored repos and images Logged: plan (`api.access`). Reads have no explicit action event.
- collection (bulk): `GET /rest/orgs/{org_id}/issues`. All vulnerability findings for the Org Logged: plan (`api.access`). Reads have no explicit action event.

### What to look for (analyst guidance)
- Tenant-context app with broad scopes
- New install via client credentials
- App installed by a user who later left (tenant context persists)

## Respond: how to revoke it
- Admin: **Revoke authorized Snyk App**. User revokes an app from Authorized Snyk Apps; admins can delete Group/Org installs by API. Where: Account Settings > Authorized Snyk Apps > Revoke; DELETE /rest/groups/{group_id}/apps/installs/{install_id}; DELETE /rest/self/apps/installs/{install_id}.
- Admin: **Delete App / replace clientSecret**. Deleting an app revokes its credentials and all installs; replacing the secret invalidates the old one at once. Where: DELETE /rest/orgs/{orgId}/apps/creations/{app_id}; POST .../apps/creations/{app_id}/secrets.
- Admin: **OAuth2 revoke endpoint**. Revokes a specific refresh token immediately. Where: POST https://api.snyk.io/oauth2/revoke.

Revoke the install (UI or DELETE /rest/groups/{group_id}/apps/installs/{install_id}), revoke refresh token via POST /oauth2/revoke, or delete the app. Live access ends on revocation: partial. Refresh token revoked immediately; whether issued access tokens die before TTL is not stated.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Audit events for app install/revoke
- Access token invalidation on revoke
- Whether GET /rest/orgs works for app tokens
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
- [About Snyk Apps](https://docs.snyk.io/developer-tools/snyk-api/using-specific-snyk-apis/snyk-apps-apis/about-snyk-apps) (retrieved 2026-10-14)
- [Authentication for API](https://docs.snyk.io/developer-tools/snyk-api/authentication-for-api) (retrieved 2026-10-14)
- [Set up the authorization code exchange](https://docs.snyk.io/developer-tools/snyk-api/using-specific-snyk-apis/snyk-apps-apis/set-up-a-snyk-app-using-the-oauth2-api/set-up-the-authorization-code-exchange) (retrieved 2026-10-14)
- [Snyk REST API OpenAPI spec 2026-03-25 (AccessTokenTtlSeconds / service account attributes)](https://api.snyk.io/rest/openapi/2026-03-25) (retrieved 2026-10-14)
- [Set up the refresh token exchange](https://docs.snyk.io/developer-tools/snyk-api/using-specific-snyk-apis/snyk-apps-apis/set-up-a-snyk-app-using-the-oauth2-api/set-up-the-refresh-token-exchange) (retrieved 2026-10-14)
- [Scopes to request](https://docs.snyk.io/developer-tools/snyk-api/using-specific-snyk-apis/snyk-apps-apis/scopes-to-request) (retrieved 2026-10-14)
- [Manage App details](https://docs.snyk.io/developer-tools/snyk-api/using-specific-snyk-apis/snyk-apps-apis/manage-app-details) (retrieved 2026-10-14)
- [Snyk REST API spec (rest-spec.json, linked from docs.snyk.io API reference)](https://558411700-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FIEEjSXQQu36y0vmFV8zf%2Fuploads%2Fgit-blob-c1151c14af94bd6daf3db0c2cf3424397eb0191a%2Frest-spec.json?alt=media) (retrieved 2026-10-14)
- [Create a Snyk App using the Snyk API](https://docs.snyk.io/developer-tools/snyk-api/using-specific-snyk-apis/snyk-apps-apis/create-a-snyk-app-using-the-snyk-api) (retrieved 2026-10-14)
- [Retrieve audit logs of user-initiated activity by API for an Org or Group](https://docs.snyk.io/platform-administration/user-management/user-management-with-the-api/retrieve-audit-logs-of-user-initiated-activity-by-api-for-an-org-or-group) (retrieved 2026-10-14)
- [Search Audit Logs v1 to REST migration guide](https://docs.snyk.io/developer-tools/snyk-api/api-end-of-life-eol-process-and-migration-guides/guides-to-migration/search-audit-logs-group-and-org-v1-api-to-ga-rest-audit-logs-api-migration-guide) (retrieved 2026-10-14)
- [Audit Logs (API reference)](https://docs.snyk.io/developer-tools/snyk-api/reference/audit-logs) (retrieved 2026-10-14)
- [Manage users in a Group](https://docs.snyk.io/platform-administration/snyk-hierarchy/groups/manage-users-in-a-group) (retrieved 2026-10-14)
- [Revoke compromised refresh tokens](https://docs.snyk.io/developer-tools/snyk-api/using-specific-snyk-apis/snyk-apps-apis/set-up-a-snyk-app-using-the-oauth2-api/revoke-compromised-refresh-tokens) (retrieved 2026-10-14)
- [About the REST API](https://docs.snyk.io/developer-tools/snyk-api/rest-api/about-the-rest-api) (retrieved 2026-10-14)
- [Pre-defined roles](https://docs.snyk.io/platform-administration/user-management/pre-defined-roles) (retrieved 2026-10-14)
- [Integration Editor/Implementor role template](https://docs.snyk.io/platform-administration/user-management/custom-role-templates/integration-editor-implementor-role-template) (retrieved 2026-10-14)
