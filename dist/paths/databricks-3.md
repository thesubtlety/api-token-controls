# Databricks (AWS baseline): Legacy PAT

`databricks-3` · Personal access token · person or service · legacy. OAuth user-to-machine and machine-to-machine, external token federation, and legacy personal access tokens.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Account console > Security > Token report; workspace Token Management API (databricks token-management list). | Account console > Security > Token report; workspace Token Management API (databricks token-management list). |
| Protect: Admin can block or require approval | Yes (requires Premium or above) | Personal Access Tokens (workspace toggle) | Personal Access Tokens (workspace toggle): Workspace Settings > Advanced > Personal Access Tokens |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional (requires Enterprise) | Enterprise tier. Separate account/workspace IP lists protect public UI/API access; PrivateLink traffic is not filtered by them. Context-based ingress (Enterprise) can add rules combining identity (e.g. service principal), network source and access type. | IP access lists: Account console IP access lists; workspace IP Access List API · Context-based ingress policies: Account console network policies (account admin) |
| Protect: Expires automatically | Yes | Default maximum 730 days; admins can reduce it (new tokens only). Unused PATs are auto-revoked after 90 days. | maxTokenLifetimeDays: Workspace configuration API / CLI (no UI) · Automatic revocation of unused PATs: Automatic (not configurable per docs) |
| Detect: Usage appears in logs | Yes | request_params.tokenId, request_params.tokenHash, request_params.userId, request_params.tokenCreatedBy, token_id | Databricks audit logs (system.access.audit system table / audit log delivery): Account- and workspace-level events; account-level rows have workspace_id 0. No general retention stated on the table page; events of a deleted workspace older than 14 days are removed. · Account console token report / Token Management API: Lists token_id, owner_id, created_by_id, creation_time, expiry_time, last_used_day; filter by owner, workspace, last used. |
| Detect: Data reads appear in logs | Yes | workspace.workspaceExport | API: SQL: SELECT * FROM system.access.audit WHERE service_name='workspace' AND action_name='workspaceExport' (filter user_identity.email) |
| Respond: Revocation ends active access | Yes | PAT is the bearer credential itself; docs do not state propagation delay. Tokens of deactivated users are not auto-revoked. | Revoke: databricks token-management delete TOKEN_ID (DELETE /api/2.0/token-management/tokens/{token_id}) or account console token report > Revoke; owner can run databricks tokens revoke --token-id. Deactivate owner if compromised. |
| Respond: Stops working when user is removed | Yes | Tokens of a deactivated user stop working (they remain but cannot authenticate); SCIM removal deactivates the user. | Where: Remove the user from the IdP account-level SCIM connector (deactivates the user) · API: PATCH /api/2.1/accounts/{account_id}/scim/v2/Users/{id} with active=false |

## Protect: what an admin can configure

### Admin controls
- **Personal Access Tokens (workspace toggle)** (Disable; Premium or above; default on). Turns off PAT authentication for a workspace; existing tokens are not deleted. Where: Workspace Settings > Advanced > Personal Access Tokens.
- **Personal access token permissions (CAN USE)** (Limit resources; Premium or above; default varies). Restricts which users, groups and service principals can create and use PATs. Where: Workspace Settings > Advanced > Personal Access Tokens > Permissions; Permissions API.
- **maxTokenLifetimeDays** (Limit lifetime; Premium or above; default on). Caps lifetime of new PATs (default 730 days); does not affect existing tokens. Where: Workspace configuration API / CLI (no UI).
- **Automatic revocation of unused PATs** (Limit lifetime; all plans; default on). PATs not used for 90 days are revoked automatically. Where: Automatic (not configurable per docs).
- **IP access lists** (Limit network; Enterprise; default off). Restrict account console/account APIs and workspace/workspace APIs to approved IPs. Where: Account console IP access lists; workspace IP Access List API.
- **Context-based ingress policies** (Limit network; Enterprise; default off). Account-level allow/deny rules combining identity, network source and request scope, e.g. pinning service principals to trusted networks. Where: Account console network policies (account admin).

- Network: conditional (checked at api_request). Enterprise tier. Separate account/workspace IP lists protect public UI/API access; PrivateLink traffic is not filtered by them. Context-based ingress (Enterprise) can add rules combining identity (e.g. service principal), network source and access type.
- Lifetime: Default maximum 730 days; admins can reduce it (new tokens only). Unused PATs are auto-revoked after 90 days.. Renewal: Admins can impose a shorter PAT maximum, control who can create/use PATs and revoke them. Setting custom max to 0 restores 730-day system default.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: AWS IP-access-list docs require Enterprise tier. Azure/GCP capabilities and licensing must be checked separately.

## Detect: what gets logged
- Token prefix: `dapi`

### Logs
- Databricks audit logs (system.access.audit system table / audit log delivery): Account- and workspace-level events; account-level rows have workspace_id 0. No general retention stated on the table page; events of a deleted workspace older than 14 days are removed.
- Account console token report / Token Management API: Lists token_id, owner_id, created_by_id, creation_time, expiry_time, last_used_day; filter by owner, workspace, last used.

### Fields that identify the credential
- `request_params.tokenId` (system.access.audit (accounts.tokenLogin)): Token used to authenticate
- `request_params.tokenHash` (system.access.audit (generateDbToken/revokeDbToken/changeDbTokenState)): Hash of the token in lifecycle events
- `request_params.userId` (system.access.audit (token management events)): Token owner
- `request_params.tokenCreatedBy` (system.access.audit (generateDbToken)): Creator (on-behalf-of tokens for SPs)
- `token_id` (Token Management API): Use to revoke

### Lifecycle events
- create: `accounts.generateDbToken` Params tokenExpirationTime, tokenCreatedBy, tokenHash, userId
- use: `accounts.tokenLogin` Params tokenId, user, authenticationMethod
- change: `accounts.updateDbToken` Scopes changed
- change: `accounts.updateOnBehalfOfToken` On-behalf-of token changed
- revoke: `accounts.changeDbTokenState` Token disabled
- revoke: `accounts.revokeDbToken` Token dropped; also on user removal
- revoke: `accounts.garbageCollectDbToken` Expired token cleanup; includes tokenFirstAccessed

### Correlate on
`user_identity.email`, `identity_metadata.run_by`, `identity_metadata.run_as`, `source_ip_address`, `user_agent`, `session_id`, `workspace_id`, `request_params`, `request_params.tokenId`, `request_params.tokenHash`, `request_params.userId`

### API calls a holder can make, and whether they are logged
- collection: `GET /api/2.0/workspace/export`. Notebook or whole-directory contents (source code, sometimes embedded secrets/results) Logged: yes (`workspace.workspaceExport`). Audit log / system.access.audit; user_identity shows the caller. Docs describe the event as a notebook export.

### Public detection rules (community, not vendor documentation)
- [Databricks Long-Lifetime Token Generated](https://github.com/panther-labs/panther-analysis/blob/develop/rules/databricks_rules/databricks_long_lifetime_token_generated.yml) (Panther): A personal access token was generated with a lifetime over 72 hours.
- [Databricks Access Token Revoked](https://github.com/panther-labs/panther-analysis/blob/develop/rules/databricks_rules/databricks_access_token_revoked.yml) (Panther): A Databricks access token was revoked.
- [Databricks TruffleHog Scan Detected](https://github.com/panther-labs/panther-analysis/blob/develop/rules/databricks_rules/databricks_trufflehog_scan_detected.yml) (Panther): Any Databricks API request with a TruffleHog user agent, which indicates a leaked token being validated.
- [Databricks Non-SSO Login Detected](https://github.com/panther-labs/panther-analysis/blob/develop/rules/databricks_rules/databricks_non_sso_login.yml) (Panther): Successful logins that did not use SAML SSO, including token logins with a PAT.

### What to look for (analyst guidance)
- tokenLogin for a tokenId from a new source_ip_address or user_agent
- tokenLogin for a token owned by a deactivated or IdP-removed user
- generateDbToken with long tokenExpirationTime created right after an interactive login from an unusual IP
- dormant token (old last_used_day) suddenly active
- burst of generateDbToken across workspaces by one user
- GitHub secret scanning alert for databricks_access_token

### Sample query (Databricks SQL (system.access.audit))
Find PATs used from new IPs or user agents

```
SELECT request_params['tokenId'] AS token_id, user_identity.email, source_ip_address, user_agent, min(event_time) AS first_seen, count(*) AS uses FROM system.access.audit WHERE service_name = 'accounts' AND action_name = 'tokenLogin' AND event_date >= current_date() - INTERVAL 7 DAYS GROUP BY ALL ORDER BY first_seen DESC
```

## Respond: how to revoke it
- Admin: **Token report and revoke (account console)**. Account admins list PATs across workspaces and revoke them. Where: Account console > Security > Token report; databricks token-management delete.

Revoke: databricks token-management delete TOKEN_ID (DELETE /api/2.0/token-management/tokens/{token_id}) or account console token report > Revoke; owner can run databricks tokens revoke --token-id. Deactivate owner if compromised. Live access ends on revocation: yes. PAT is the bearer credential itself; docs do not state propagation delay. Tokens of deactivated users are not auto-revoked.

## No vendor documentation found
- SSO and MFA rules apply
- official PAT regex/length
- relationship between tokenLogin tokenId and lifecycle tokenHash
- authenticationMethod values
- revocation propagation delay
- exact audit_level value for workspace events
- No account-wide switch to disable PATs across all workspaces was found; the toggle is per workspace.
- Whether IP access lists explicitly cover PAT/OAuth API calls is implied (workspace-level APIs) but not stated.
- Whether context-based ingress rules can distinguish auth method (PAT vs OAuth) is not stated.
- How to update or delete federation policies, and how to revoke an individual OAuth secret, were not covered on the fetched pages.
- TTL min/max ranges, and whether built-in databricks-cli app follows app-connection TTL defaults, not confirmed.
- Single-use refresh token details page returned 404; defaults per app not confirmed.
- Azure/GCP capabilities and tiers not checked.

## Sources
- [Authenticate access to Databricks using OAuth token federation ...](https://docs.databricks.com/aws/en/dev-tools/auth/oauth-federation) (retrieved 2026-10-09)
- [Authenticate with an identity provider token - Databricks](https://docs.databricks.com/aws/en/dev-tools/auth/oauth-federation-exchange) (retrieved 2026-10-09)
- [Authorize service principal access to Databricks with OAuth ...](https://docs.databricks.com/aws/en/dev-tools/auth/oauth-m2m) (retrieved 2026-10-09)
- [Monitor and revoke personal access tokens - Databricks on AWS](https://docs.databricks.com/aws/en/admin/access-control/tokens) (retrieved 2026-10-09)
- [Manage IP access lists - Databricks on AWS](https://docs.databricks.com/aws/en/security/network/front-end/ip-access-list) (retrieved 2026-10-09)
- [Manage personal access token permissions - Databricks on AWS](https://docs.databricks.com/aws/en/security/auth/api-access-permissions) (retrieved 2026-10-09)
- [Context-based ingress control - Databricks on AWS](https://docs.databricks.com/aws/en/security/network/front-end/context-based-ingress) (retrieved 2026-10-09)
- [Authenticate with Databricks personal access tokens (legacy) - Databricks on AWS](https://docs.databricks.com/aws/en/dev-tools/auth/pat) (retrieved 2026-10-09)
- [Manage users | Databricks on AWS](https://docs.databricks.com/aws/en/admin/users-groups/users) (retrieved 2026-10-14)
- [Sync users and groups from your identity provider using SCIM | Databricks on AWS](https://docs.databricks.com/aws/en/admin/users-groups/scim/) (retrieved 2026-10-14)
- [Audit log system table reference](https://docs.databricks.com/aws/en/admin/system-tables/audit-logs) (retrieved 2026-10-12)
- [Audit log reference (Account-level authentication events)](https://docs.databricks.com/aws/en/admin/account-settings/audit-logs) (retrieved 2026-10-12)
- [Tokens CLI (legacy)](https://docs.databricks.com/dev-tools/cli/tokens-cli.html) (retrieved 2026-10-12)
- [Token Management API - Delete a token](https://docs.databricks.com/api/workspace/tokenmanagement/delete) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Export a workspace object | Databricks API Reference](https://docs.databricks.com/api/workspace/workspace/export) (retrieved 2026-10-14)
