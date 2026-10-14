# Databricks (AWS baseline): OAuth M2M

`databricks-1` · OAuth · service. OAuth user-to-machine and machine-to-machine, external token federation, and legacy personal access tokens.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | OAuth secrets are listed per service principal on its Credentials & secrets tab; no account-wide secret report found. | Where: Account console > User management > Service principals > <SP> > Credentials & secrets (per SP) · API: GET /api/2.0/accounts/{account_id}/servicePrincipals/{service_principal}/credentials/secrets · Command: databricks account service-principal-secrets list SERVICE_PRINCIPAL_ID |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional (requires Enterprise) | Enterprise tier. Separate account/workspace IP lists protect public UI/API access; PrivateLink traffic is not filtered by them. Context-based ingress (Enterprise) can add rules combining identity (e.g. service principal), network source and access type. | IP access lists: Account console IP access lists; workspace IP Access List API · Context-based ingress policies: Account console network policies (account admin) |
| Protect: Expires automatically | Yes | 1 hour | Service principal OAuth secret lifetime: Service principal > Secrets > Generate secret (account or workspace admin) |
| Detect: Usage appears in logs | Yes | request_params.client_id, request_params.secret_id, request_params.service_principal, identity_metadata.run_as | Databricks audit logs (system.access.audit system table / audit log delivery): Account- and workspace-level events; account-level rows have workspace_id 0. No general retention stated on the table page; events of a deleted workspace older than 14 days are removed. · Service principal secrets list API: Returns id, secret_hash, status, create_time, expire_time per secret; metadata only. |
| Detect: Data reads appear in logs | Yes | workspace.workspaceExport | API: SQL: SELECT * FROM system.access.audit WHERE service_name='workspace' AND action_name='workspaceExport' (filter user_identity.email) |
| Respond: Revocation ends active access | Partial | Docs do not say whether deleting a secret invalidates issued access tokens (1-hour lifetime). SP deactivation blocks all its tokens. | Delete the secret (DELETE /api/2.0/accounts/{account_id}/servicePrincipals/{service_principal}/credentials/secrets/{secret_id}); to stop tokens already minted, deactivate the service principal via the Account Service Principals API, then rotate. |
| Respond: Stops working when user is removed | N/A | Credential belongs to a service principal, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **IP access lists** (Limit network; Enterprise; default off). Restrict account console/account APIs and workspace/workspace APIs to approved IPs. Where: Account console IP access lists; workspace IP Access List API.
- **Context-based ingress policies** (Limit network; Enterprise; default off). Account-level allow/deny rules combining identity, network source and request scope, e.g. pinning service principals to trusted networks. Where: Account console network policies (account admin).
- **Service principal OAuth secret lifetime** (Limit lifetime; all plans; default on). Each OAuth secret gets a lifetime set at creation, max 730 days. Where: Service principal > Secrets > Generate secret (account or workspace admin).
- **OAuth secret scopes** (Limit scope; all plans; default unknown). Admins choose API scopes when generating a secret; they cannot be changed later. Where: Service principal > Secrets > Generate secret.

- Network: conditional (checked at api_request). Enterprise tier. Separate account/workspace IP lists protect public UI/API access; PrivateLink traffic is not filtered by them. Context-based ingress (Enterprise) can add rules combining identity (e.g. service principal), network source and access type.
- Lifetime: 1 hour. Renewal: Re-mint a 1-hour access token with the service principal client ID and OAuth secret (SDK/CLI do this automatically). The OAuth secret has a set lifetime of up to 730 days and can be scoped.
- Keyless option: supported. External IdP tokens exchange into Databricks OAuth using configured issuer/audience/subject trust; workload CI/runtime federation supported.
- Conditions: AWS IP-access-list docs require Enterprise tier. Azure/GCP capabilities and licensing must be checked separately.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Databricks audit logs (system.access.audit system table / audit log delivery): Account- and workspace-level events; account-level rows have workspace_id 0. No general retention stated on the table page; events of a deleted workspace older than 14 days are removed.
- Service principal secrets list API: Returns id, secret_hash, status, create_time, expire_time per secret; metadata only.

### Fields that identify the credential
- `request_params.client_id` (system.access.audit (accounts.mintOAuthToken)): Service principal application ID used in the client_credentials grant
- `request_params.secret_id` (system.access.audit (servicePrincipalCredentials.create/delete)): Which OAuth secret was created or deleted
- `request_params.service_principal` (system.access.audit (servicePrincipalCredentials)): Owning service principal
- `identity_metadata.run_as` (system.access.audit): Identity used for authorization on API calls

### Lifecycle events
- create: `servicePrincipalCredentials.create` OAuth secret generated; params include lifetime
- use: `accounts.mintOAuthToken` Token minted; params grant_type, scope, expires_in, client_id
- use: `accounts.accountInHouseOAuthClientAuthentication` OAuth client authenticated at account level
- use: `accounts.oidcTokenAuthorization` API call authorized with an OAuth token
- change: `servicePrincipalCredentials.list` Admin enumerated secrets
- revoke: `servicePrincipalCredentials.delete` Secret deleted

### Correlate on
`user_identity.email`, `identity_metadata.run_by`, `identity_metadata.run_as`, `source_ip_address`, `user_agent`, `session_id`, `workspace_id`, `request_params`, `request_params.client_id`, `request_params.secret_id`

### API calls a holder can make, and whether they are logged
- collection: `GET /api/2.0/workspace/export`. Notebook or whole-directory contents (source code, sometimes embedded secrets/results) Logged: yes (`workspace.workspaceExport`). Audit log / system.access.audit; user_identity shows the caller. Docs describe the event as a notebook export.

### What to look for (analyst guidance)
- mintOAuthToken for a client_id from a source_ip_address outside the workload's known egress range
- new servicePrincipalCredentials.create on a long-lived SP shortly followed by token minting from a new IP
- SP secret created by a non-automation admin identity
- mintOAuthToken with grant_type client_credentials at unusual volume or hours for a batch SP
- servicePrincipalCredentials.list by an unexpected admin (reconnaissance)

### Sample query (Databricks SQL (system.access.audit))
See where and how often a service principal mints OAuth tokens

```
SELECT event_time, request_params['client_id'] AS client_id, source_ip_address, user_agent, response.statusCode FROM system.access.audit WHERE service_name = 'accounts' AND action_name = 'mintOAuthToken' AND event_date >= current_date() - INTERVAL 30 DAYS AND request_params['client_id'] = '<sp-application-id>' ORDER BY event_time DESC
```

## Respond: how to revoke it
- Admin: **Deactivate a service principal**. Deactivated service principals cannot authenticate; their OAuth secrets and tokens stop working until reactivated. Where: Account Service Principals API (account level); Workspace Service Principals API (workspace level).

Delete the secret (DELETE /api/2.0/accounts/{account_id}/servicePrincipals/{service_principal}/credentials/secrets/{secret_id}); to stop tokens already minted, deactivate the service principal via the Account Service Principals API, then rotate. Live access ends on revocation: partial. Docs do not say whether deleting a secret invalidates issued access tokens (1-hour lifetime). SP deactivation blocks all its tokens.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- OAuth secret prefix/regex
- whether deleting a secret revokes issued access tokens
- which secret_id was used to mint a given token (mintOAuthToken params list no secret_id)
- authenticationMethod values
- exact retention of system.access.audit
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
- [List service principal secrets (Account API)](https://docs.databricks.com/api/account/serviceprincipalsecrets/list) (retrieved 2026-10-14)
- [account service-principal-secrets command group](https://docs.databricks.com/aws/en/dev-tools/cli/reference/account-service-principal-secrets-commands) (retrieved 2026-10-14)
- [Audit log system table reference](https://docs.databricks.com/aws/en/admin/system-tables/audit-logs) (retrieved 2026-10-12)
- [Audit log reference (Account-level authentication events)](https://docs.databricks.com/aws/en/admin/account-settings/audit-logs) (retrieved 2026-10-12)
- [Service Principal Secrets API - Delete](https://docs.databricks.com/api/account/serviceprincipalsecrets/delete) (retrieved 2026-10-12)
- [Manage service principals](https://docs.databricks.com/aws/en/admin/users-groups/manage-service-principals) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Export a workspace object | Databricks API Reference](https://docs.databricks.com/api/workspace/workspace/export) (retrieved 2026-10-14)
