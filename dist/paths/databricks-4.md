# Databricks (AWS baseline): OAuth U2M

`databricks-4` · OAuth · person. A user signs in through the browser and consents; the CLI, SDK or app then receives a Databricks OAuth access token (and refresh token) and sends it as a bearer token. Works at account level or for one workspace; the CLI caches tokens in ~/.databricks/token-cache.json.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Users can view their own consent per app (/api/2.0/oauth-app-integrations/<id>/user-consent/me); no admin-wide token list found. | Users can view their own consent per app (/api/2.0/oauth-app-integrations/<id>/user-consent/me); no admin-wide token list found. |
| Protect: Admin can block or require approval | Yes | App connections (disable published or custom OAuth apps) | App connections (disable published or custom OAuth apps): Account console > Settings > App connections > Remove; published-app-integration / custom-app-integration CLI |
| Protect: SSO and MFA rules apply | Partial | Issuance needs a browser sign-in, which uses SSO when account SSO is on; existing refresh tokens keep working. | Where: Account console > Security > Identity provider setup > Authentication > single sign-on |
| Protect: IP restriction | Conditional (requires Enterprise) | Account and workspace IP access lists cover the UI and REST APIs at each level and require the Enterprise tier. Private IPs from PrivateLink traffic are not filtered by them. | IP access lists: Account console IP access lists; workspace IP Access List API · Context-based ingress policies: Account console network policies (account admin) |
| Protect: Expires automatically | Yes | Default 1 h; app integrations accept 5 min–24 h | App connection token TTLs: Account console > Settings > App connections > edit app · Single-use refresh tokens: Custom/published app integration API |
| Detect: Usage appears in logs | Yes | request_params.client_id, request_params.integration_id, identity_metadata.acting_resource_display_name, user_identity.email | Databricks audit logs (system.access.audit system table / audit log delivery): Account- and workspace-level events; account-level rows have workspace_id 0. No general retention stated on the table page; events of a deleted workspace older than 14 days are removed. · Endpoint file ~/.databricks/token-cache.json: Cached access/refresh tokens on the user's machine; theft target. |
| Detect: Data reads appear in logs | Yes | workspace.workspaceExport | API: SQL: SELECT * FROM system.access.audit WHERE service_name='workspace' AND action_name='workspaceExport' (filter user_identity.email) |
| Respond: Revocation ends active access | Partial | Revoking consent doesn't invalidate existing tokens; refresh tokens work until expiry. No documented per-token revoke for OAuth tokens. Access tokens last one hour. | Deactivate the user (account level); delete or disable the OAuth app integration; shorten refresh_token_ttl_in_minutes / enable single-use refresh tokens and absolute_session_lifetime_in_minutes; delete local token-cache.json. |
| Respond: Stops working when user is removed | Yes | Tokens of a deactivated user cannot authenticate; SCIM removal deactivates the user. | Where: Remove the user from the IdP account-level SCIM connector (deactivates the user) · API: PATCH /api/2.1/accounts/{account_id}/scim/v2/Users/{id} with active=false |

## Protect: what an admin can configure

### Admin controls
- **IP access lists** (Limit network; Enterprise; default off). Restrict account console/account APIs and workspace/workspace APIs to approved IPs. Where: Account console IP access lists; workspace IP Access List API.
- **Context-based ingress policies** (Limit network; Enterprise; default off). Account-level allow/deny rules combining identity, network source and request scope, e.g. pinning service principals to trusted networks. Where: Account console network policies (account admin).
- **App connections (disable published or custom OAuth apps)** (Disable; all plans; default varies). Removing an app connection disables it and breaks existing connections. Where: Account console > Settings > App connections > Remove; published-app-integration / custom-app-integration CLI.
- **App connection token TTLs** (Limit lifetime; all plans; default on). Sets access token (default 60 min) and refresh token (default 10080 min) lifetimes for custom apps. Where: Account console > Settings > App connections > edit app.
- **Single-use refresh tokens** (Require rotation; all plans; default varies). Makes refresh tokens single-use for an app integration; API only. Where: Custom/published app integration API.

- Network: conditional (checked at api_request). Account and workspace IP access lists cover the UI and REST APIs at each level and require the Enterprise tier. Private IPs from PrivateLink traffic are not filtered by them.
- Lifetime: Default 1 h; app integrations accept 5 min–24 h. Renewal: Refresh tokens get new access tokens; app-connection default refresh TTL is 10080 min (7 days), configurable 5 min–90 days. With single-use refresh tokens (rotation) each new refresh token gets a fresh TTL, optionally capped by an absolute session lifetime (Beta).
- Keyless option: not_applicable. The user signs in interactively (which can go through the account's SSO); no external token is exchanged on this path. Token exchange of external IdP tokens is the separate external token federation path.
- Conditions: TTL defaults and ranges are documented for app connections generally; whether the built-in databricks-cli app uses the same defaults was not confirmed. Single-use refresh tokens are on by default only for some partner apps.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Databricks audit logs (system.access.audit system table / audit log delivery): Account- and workspace-level events; account-level rows have workspace_id 0. No general retention stated on the table page; events of a deleted workspace older than 14 days are removed.
- Endpoint file ~/.databricks/token-cache.json: Cached access/refresh tokens on the user's machine; theft target.

### Fields that identify the credential
- `request_params.client_id` (system.access.audit (mintOAuthAuthorizationCode/mintOAuthToken)): OAuth app, e.g. databricks-cli
- `request_params.integration_id` (system.access.audit (oauth2.deleteCustomAppIntegration)): App integration
- `identity_metadata.acting_resource_display_name` (system.access.audit): For an OAuth app, the app name
- `user_identity.email` (system.access.audit): Signed-in user

### Lifecycle events
- create: `accounts.mintOAuthAuthorizationCode` Authorization code minted; param client_id
- create: `accounts.mintOAuthToken` Token minted; grant_type, scope, expires_in, client_id
- use: `accounts.oidcBrowserLogin` Browser login step
- use: `accounts.oidcTokenAuthorization` API call authorized via OAuth token
- create: `oauth2.createCustomAppIntegration` Custom OAuth app (redirect_url, token_access_policy)
- change: `oauth2.updateCustomAppIntegration` Redirect URL or TTL change
- revoke: `oauth2.deleteCustomAppIntegration` App removed

### Correlate on
`user_identity.email`, `identity_metadata.run_by`, `identity_metadata.run_as`, `source_ip_address`, `user_agent`, `session_id`, `workspace_id`, `request_params`, `request_params.client_id`, `identity_metadata.acting_resource_display_name`

### API calls a holder can make, and whether they are logged
- collection: `GET /api/2.0/workspace/export`. Notebook or whole-directory contents (source code, sometimes embedded secrets/results) Logged: yes (`workspace.workspaceExport`). Audit log / system.access.audit; user_identity shows the caller. Docs describe the event as a notebook export.

### What to look for (analyst guidance)
- mintOAuthToken (refresh) for a user from an IP never seen in that user's oidcBrowserLogin events (stolen token-cache.json)
- refresh grants continuing long after the user's last interactive login
- updateCustomAppIntegration changing redirect_url to an unknown host
- new custom app integration with long refresh_token_ttl_in_minutes
- user_agent mismatch between login and later API calls

### Sample query (Databricks SQL (system.access.audit))
Compare token-mint IPs to browser-login IPs per user

```
SELECT user_identity.email, request_params['client_id'] AS client_id, request_params['grant_type'] AS grant_type, source_ip_address, user_agent, count(*) AS n FROM system.access.audit WHERE service_name = 'accounts' AND action_name IN ('mintOAuthToken','oidcBrowserLogin') AND event_date >= current_date() - INTERVAL 14 DAYS GROUP BY ALL ORDER BY user_identity.email
```

## Respond: how to revoke it


Deactivate the user (account level); delete or disable the OAuth app integration; shorten refresh_token_ttl_in_minutes / enable single-use refresh tokens and absolute_session_lifetime_in_minutes; delete local token-cache.json. Live access ends on revocation: partial. Revoking consent doesn't invalidate existing tokens; refresh tokens work until expiry. No documented per-token revoke for OAuth tokens. Access tokens last one hour.

## No vendor documentation found
- token format/prefix
- grant_type values logged for refresh (sample uses refresh_token as illustration)
- per-token revocation API for U2M tokens
- whether deactivating a user immediately blocks existing OAuth access tokens (documented only for SPs)
- whether deleting an app integration invalidates its tokens
- No account-wide switch to disable PATs across all workspaces was found; the toggle is per workspace.
- Whether IP access lists explicitly cover PAT/OAuth API calls is implied (workspace-level APIs) but not stated.
- Whether context-based ingress rules can distinguish auth method (PAT vs OAuth) is not stated.
- How to update or delete federation policies, and how to revoke an individual OAuth secret, were not covered on the fetched pages.
- TTL min/max ranges, and whether built-in databricks-cli app follows app-connection TTL defaults, not confirmed.
- Single-use refresh token details page returned 404; defaults per app not confirmed.
- Azure/GCP capabilities and tiers not checked.

## Sources
- [Authorize user access to Databricks with OAuth | Databricks on AWS](https://docs.databricks.com/aws/en/dev-tools/auth/oauth-u2m) (retrieved 2026-10-12)
- [Manage IP access lists - Databricks on AWS](https://docs.databricks.com/aws/en/security/network/front-end/ip-access-list) (retrieved 2026-10-09)
- [Enable or disable partner OAuth applications | Databricks on AWS](https://docs.databricks.com/aws/en/integrations/enable-disable-oauth) (retrieved 2026-10-12)
- [Create Custom OAuth App Integration | Databricks REST API](https://docs.databricks.com/api/o-auth/v1/create-custom-o-auth-app-integration.md) (retrieved 2026-10-12)
- [Single-use refresh tokens | Databricks on AWS](https://docs.databricks.com/aws/en/integrations/single-use-tokens) (retrieved 2026-10-12)
- [Configure SSO in - Databricks on AWS](https://docs.databricks.com/aws/en/security/auth/single-sign-on/) (retrieved 2026-10-09)
- [Manage users | Databricks on AWS](https://docs.databricks.com/aws/en/admin/users-groups/users) (retrieved 2026-10-14)
- [Sync users and groups from your identity provider using SCIM | Databricks on AWS](https://docs.databricks.com/aws/en/admin/users-groups/scim/) (retrieved 2026-10-14)
- [Configure SSO using SAML](https://docs.databricks.com/aws/en/security/auth/single-sign-on/saml) (retrieved 2026-10-14)
- [Audit log system table reference](https://docs.databricks.com/aws/en/admin/system-tables/audit-logs) (retrieved 2026-10-12)
- [Audit log reference (Account-level authentication events)](https://docs.databricks.com/aws/en/admin/account-settings/audit-logs) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Export a workspace object | Databricks API Reference](https://docs.databricks.com/api/workspace/workspace/export) (retrieved 2026-10-14)
- [Context-based ingress control - Databricks on AWS](https://docs.databricks.com/aws/en/security/network/front-end/context-based-ingress) (retrieved 2026-10-09)
