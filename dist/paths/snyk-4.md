# Snyk: Service account using OAuth 2.0 (oauth_client_secret / oauth_private_key_jwt)

`snyk-4` · OAuth · service. client_credentials grant at POST /oauth2/token with a client secret or a private_key_jwt client assertion; returns a short-lived bearer token used like any Snyk token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Same service account list in Settings > Service accounts and GET /rest/groups/{groupId}/service_accounts (includes auth_type). | Same service account list in Settings > Service accounts and GET /rest/groups/{groupId}/service_accounts (includes auth_type). |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | Service account creation restricted to admins | Where: Group > Settings > Member roles > open role > clear service account create permissions > Update Role Permissions |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Snyk docs describe no customer-configurable IP allowlist for API callers; IP lists in docs cover Snyk scanners reaching your targets. |  |
| Protect: Expires automatically | Yes | Access token 1h default, 1h-24h via API | access_token_ttl_seconds: Service account API (not UI) · Manage client secret (create/delete/replace): POST /rest/{groups/orgs}/{id}/service_accounts/{serviceaccount_id}/secrets |
| Detect: Usage appears in logs | Yes | client_id / service account id | Snyk audit logs (Group/Org search API): Enterprise; past 90 days; GET /rest/groups/{group_id}/audit_logs/search and /rest/orgs/{org_id}/audit_logs/search; api.access hidden unless requested via events=api.access. · Event forwarding (Amazon EventBridge, AWS CloudTrail Lake): Platform audit events, Enterprise; use for retention beyond 90 days. |
| Detect: Data reads appear in logs | Conditional | Reads have no explicit action event. | API: GET https://api.snyk.io/rest/groups/{group_id}/audit_logs/search?version={version}&events=api.access&user_id={user_id} (or /rest/orgs/{org_id}/audit_logs/search) |
| Respond: Revocation ends active access | Partial | Deleting revokes credentials; whether already-issued access tokens (up to TTL) stop working on secret replace is not stated. | Replace secret (POST .../secrets mode replace) or delete the service account. |
| Respond: Stops working when user is removed | N/A | Service accounts are system users tied to the Group or Organization, not to a person. |  |

## Protect: what an admin can configure

### Admin controls
- **Service account role** (Limit scope; Enterprise; default varies). The assigned Group or Org role (incl. custom roles) sets what the token can do; Group Viewer gives read-only. Where: Group/Org Settings > Service accounts > Role; role_id in POST /service_accounts.
- **Service account creation restricted to admins** (Require approval; Enterprise; default on). Only Group admins (Group accounts) or Org Admins/Group admins (Org accounts) can create service accounts. Where: Role permissions group.service_account.create / org.service_account.create.
- **access_token_ttl_seconds** (Limit lifetime; Enterprise; default varies). Lifetime of OAuth access tokens issued to the service account (default 1h, 1h-24h). Where: Service account API (not UI).
- **Manage client secret (create/delete/replace)** (Require rotation; Enterprise; default unknown). Rotate or delete OAuth service account secrets; replace is the compromise response. Where: POST /rest/{groups|orgs}/{id}/service_accounts/{serviceaccount_id}/secrets.
- **Audit logs** (Other; Enterprise; default on). Group and Org audit log search (90 days) incl. service account and app lifecycle and api.access events. Where: GET /rest/{groups|orgs}/{id}/audit_logs/search.

- Network: unknown (checked at unknown). Snyk docs describe no customer-configurable IP allowlist for API callers; IP lists in docs cover Snyk scanners reaching your targets.
- Lifetime: Access token 1h default, 1h-24h via API. Renewal: Client re-requests a token with its secret or a new signed JWT; secrets rotate via /secrets (max two active).
- Keyless option: limited. private_key_jwt: Snyk verifies JWTs signed with customer keys published at a customer-hosted HTTPS JWKS URL. Not cloud workload identity federation.
- Conditions: Enterprise plan; created via API or Group UI.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Snyk audit logs (Group/Org search API): Enterprise; past 90 days; GET /rest/groups/{group_id}/audit_logs/search and /rest/orgs/{org_id}/audit_logs/search; api.access hidden unless requested via events=api.access.
- Event forwarding (Amazon EventBridge, AWS CloudTrail Lake): Platform audit events, Enterprise; use for retention beyond 90 days.

### Fields that identify the credential
- `client_id / service account id` (service account API): Whether audit events carry client_id is not documented.

### Lifecycle events
- create: `group.service_account.create` 
- create: `org.service_account.create` 
- revoke: `group.service_account.delete` 
- revoke: `org.service_account.delete` 
- use: `api.access` Exists in Group and Org event lists; excluded by default; described as high-volume low-information.

### Correlate on
`user_id`, `org_id`, `group_id`, `project_id`, `created`

### API calls a holder can make, and whether they are logged
- recon: `GET /rest/self`. Identity of the token holder Logged: plan (`api.access`). Enterprise; api.access hidden by default; per-call detail not documented.
- discovery (bulk): `GET /rest/orgs`. Organizations the token can access Logged: plan (`api.access`). Same as above.
- enumeration (bulk): `GET /rest/orgs/{org_id}/projects`. Projects / monitored repos and images Logged: plan (`api.access`). Reads have no explicit action event.
- collection (bulk): `GET /rest/orgs/{org_id}/issues`. All vulnerability findings for the Org Logged: plan (`api.access`). Reads have no explicit action event.

### Public detection rules (community, not vendor documentation)
- [Snyk Service Account Change](https://github.com/panther-labs/panther-analysis/blob/develop/rules/snyk_rules/snyk_svcacct_change.yml) (Panther): A Snyk group or org service account was created, deleted, edited, or had its membership changed.

### What to look for (analyst guidance)
- Second client secret added unexpectedly
- JWKS URL pointing to unfamiliar host
- access_token_ttl_seconds raised to 24h

## Respond: how to revoke it
- Admin: **Delete service account**. Deletes the account and invalidates its token or credentials immediately. Where: Settings > Service accounts > Delete; DELETE /rest/{groups|orgs}/{id}/service_accounts/{serviceaccount_id}.

Replace secret (POST .../secrets mode replace) or delete the service account. Live access ends on revocation: partial. Deleting revokes credentials; whether already-issued access tokens (up to TTL) stop working on secret replace is not stated.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Audit event for secret rotation
- Whether issued access tokens are revoked on secret replace
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
- [Service accounts using OAuth 2.0](https://docs.snyk.io/platform-administration/service-accounts/service-accounts-using-oauth-2.0) (retrieved 2026-10-14)
- [Manage service accounts using the Snyk API](https://docs.snyk.io/platform-administration/service-accounts/manage-service-accounts-using-the-snyk-api) (retrieved 2026-10-14)
- [Snyk REST API OpenAPI spec 2026-03-25 (AccessTokenTtlSeconds / service account attributes)](https://api.snyk.io/rest/openapi/2026-03-25) (retrieved 2026-10-14)
- [Service accounts](https://docs.snyk.io/platform-administration/service-accounts/service-accounts) (retrieved 2026-10-14)
- [User role management](https://docs.snyk.io/platform-administration/user-management/user-role-management) (retrieved 2026-10-14)
- [Retrieve audit logs of user-initiated activity by API for an Org or Group](https://docs.snyk.io/platform-administration/user-management/user-management-with-the-api/retrieve-audit-logs-of-user-initiated-activity-by-api-for-an-org-or-group) (retrieved 2026-10-14)
- [Search Audit Logs v1 to REST migration guide](https://docs.snyk.io/developer-tools/snyk-api/api-end-of-life-eol-process-and-migration-guides/guides-to-migration/search-audit-logs-group-and-org-v1-api-to-ga-rest-audit-logs-api-migration-guide) (retrieved 2026-10-14)
- [Audit Logs (API reference)](https://docs.snyk.io/developer-tools/snyk-api/reference/audit-logs) (retrieved 2026-10-14)
- [Snyk REST API spec (rest-spec.json, linked from docs.snyk.io API reference)](https://558411700-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FIEEjSXQQu36y0vmFV8zf%2Fuploads%2Fgit-blob-c1151c14af94bd6daf3db0c2cf3424397eb0191a%2Frest-spec.json?alt=media) (retrieved 2026-10-14)
- [About the REST API](https://docs.snyk.io/developer-tools/snyk-api/rest-api/about-the-rest-api) (retrieved 2026-10-14)
- [Snyk API token permissions users can control](https://docs.snyk.io/developer-tools/snyk-api/authentication-for-api/snyk-api-token-permissions-users-can-control) (retrieved 2026-10-14)
