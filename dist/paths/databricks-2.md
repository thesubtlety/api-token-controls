# Databricks (AWS baseline): External token federation

`databricks-2` · Federated identity · person or service. OAuth user-to-machine and machine-to-machine, external token federation, and legacy personal access tokens.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Partial | Tokens are issued by your own IdP, so its policies apply at issuance; Databricks does not describe SSO checks on the exchanged token. | Where: Account console > Security > Identity provider setup > Federation policies > Create policy (issuer, audiences, subject); per SP: User management > <SP> > Credentials & secrets > Federation policies · API: POST /api/2.0/accounts/{account_id}/federationPolicies |
| Protect: IP restriction | Conditional (requires Enterprise) | Enterprise tier. Separate account/workspace IP lists protect public UI/API access; PrivateLink traffic is not filtered by them. Context-based ingress (Enterprise) can add rules combining identity (e.g. service principal), network source and access type. | IP access lists: Account console IP access lists; workspace IP Access List API · Context-based ingress policies: Account console network policies (account admin) |
| Protect: Expires automatically | Partial | Derived from external token lifetime | Where: Set in your IdP: Databricks token copies the subject token exp claim |
| Detect: Usage appears in logs | Yes | request_params.policy_id, request_params.service_principal_id, request_params.client_id, identity_metadata.run_as | Databricks audit logs (system.access.audit system table / audit log delivery): Account- and workspace-level events; account-level rows have workspace_id 0. No general retention stated on the table page; events of a deleted workspace older than 14 days are removed. · External IdP / workload identity provider logs: Issuance of the federated JWT happens at the IdP; Databricks logs only the exchange and use. |
| Detect: Data reads appear in logs | Yes | workspace.workspaceExport | API: SQL: SELECT * FROM system.access.audit WHERE service_name='workspace' AND action_name='workspaceExport' (filter user_identity.email) |
| Respond: Revocation ends active access | Partial | Docs do not state whether deleting a policy invalidates already-exchanged Databricks tokens; those expire at the JWT exp (commonly one hour). SP deactivation blocks its tokens. | Delete or tighten the federation policy (deleteFederationPolicy); deactivate the mapped service principal or user; revoke/rotate trust at the external IdP. |
| Respond: Stops working when user is removed | Yes | A deactivated user or service principal cannot authenticate to Databricks APIs; SCIM removal deactivates the user. | Where: Remove the user from the IdP account-level SCIM connector (deactivates the user) · API: PATCH /api/2.1/accounts/{account_id}/scim/v2/Users/{id} with active=false |

## Protect: what an admin can configure

### Admin controls
- **IP access lists** (Limit network; Enterprise; default off). Restrict account console/account APIs and workspace/workspace APIs to approved IPs. Where: Account console IP access lists; workspace IP Access List API.
- **Context-based ingress policies** (Limit network; Enterprise; default off). Account-level allow/deny rules combining identity, network source and request scope, e.g. pinning service principals to trusted networks. Where: Account console network policies (account admin).
- **Service principal federation policy** (Limit resources; all plans; default off). Binds a service principal to tokens from a given issuer, audience and subject. Where: Account console > service principal > Credentials & secrets; Federation Policy API/CLI (account admin).
- **Account-wide federation policy** (Limit resources; all plans; default off). Allows tokens from a registered IdP to map to Databricks users or service principals; only trusted IdPs should be added. Where: Account console > Security > federation policy; Account Federation Policy API.

- Network: conditional (checked at api_request). Enterprise tier. Separate account/workspace IP lists protect public UI/API access; PrivateLink traffic is not filtered by them. Context-based ingress (Enterprise) can add rules combining identity (e.g. service principal), network source and access type.
- Lifetime: Derived from external token lifetime. Renewal: Repeat token exchange using a valid external identity token.
- Keyless option: supported. External IdP tokens exchange into Databricks OAuth using configured issuer/audience/subject trust; workload CI/runtime federation supported.
- Conditions: AWS IP-access-list docs require Enterprise tier. Azure/GCP capabilities and licensing must be checked separately.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Databricks audit logs (system.access.audit system table / audit log delivery): Account- and workspace-level events; account-level rows have workspace_id 0. No general retention stated on the table page; events of a deleted workspace older than 14 days are removed.
- External IdP / workload identity provider logs: Issuance of the federated JWT happens at the IdP; Databricks logs only the exchange and use.

### Fields that identify the credential
- `request_params.policy_id` (system.access.audit (accounts.*FederationPolicy)): Federation policy created/changed/deleted
- `request_params.service_principal_id` (system.access.audit (accounts.*FederationPolicy)): Present for service principal (workload identity) policies
- `request_params.client_id` (system.access.audit (accounts.mintOAuthToken)): Service principal UUID for workload identity federation exchanges
- `identity_metadata.run_as` (system.access.audit): Databricks identity the federated token maps to

### Lifecycle events
- create: `accounts.createFederationPolicy` Account-wide or SP federation policy created
- change: `accounts.updateFederationPolicy` Issuer/audience/subject changes
- revoke: `accounts.deleteFederationPolicy` Policy removed
- use: `accounts.mintOAuthToken` Token minted; grant_type would be the token-exchange URN
- use: `accounts.oidcTokenAuthorization` API call authorized with OAuth token

### Correlate on
`user_identity.email`, `identity_metadata.run_by`, `identity_metadata.run_as`, `source_ip_address`, `user_agent`, `session_id`, `workspace_id`, `request_params`, `request_params.policy_id`, `request_params.service_principal_id`, `request_params.client_id`, `request_params.grant_type`

### API calls a holder can make, and whether they are logged
- collection: `GET /api/2.0/workspace/export`. Notebook or whole-directory contents (source code, sometimes embedded secrets/results) Logged: yes (`workspace.workspaceExport`). Audit log / system.access.audit; user_identity shows the caller. Docs describe the event as a notebook export.

### What to look for (analyst guidance)
- createFederationPolicy or updateFederationPolicy adding an unfamiliar issuer or broad audience
- policy change by an admin outside change windows followed by token-exchange mints
- token-exchange mintOAuthToken from IPs not belonging to the CI/cloud workload
- account-wide policy subject_claim changed (could let one IdP user map to another Databricks user)
- federated tokens used after IdP-side workload was decommissioned

### Sample query (Databricks SQL (system.access.audit))
Review who changed federation trust and for which service principal

```
SELECT event_time, action_name, user_identity.email, request_params['policy_id'] AS policy_id, request_params['service_principal_id'] AS sp_id, source_ip_address FROM system.access.audit WHERE service_name = 'accounts' AND action_name IN ('createFederationPolicy','updateFederationPolicy','deleteFederationPolicy') ORDER BY event_time DESC
```

## Respond: how to revoke it
- Admin: **Deactivate a service principal**. Deactivated service principals cannot authenticate; their OAuth secrets and tokens stop working until reactivated. Where: Account Service Principals API (account level); Workspace Service Principals API (workspace level).

Delete or tighten the federation policy (deleteFederationPolicy); deactivate the mapped service principal or user; revoke/rotate trust at the external IdP. Live access ends on revocation: partial. Docs do not state whether deleting a policy invalidates already-exchanged Databricks tokens; those expire at the JWT exp (commonly one hour). SP deactivation blocks its tokens.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- whether mintOAuthToken is logged for token-exchange grants (only documented as in-house OAuth token minted)
- policy issuer/audience values in audit request_params
- external JWT subject/issuer in Databricks audit rows
- effect of policy deletion on issued tokens
- federated token prefix/regex
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
- [Manage users | Databricks on AWS](https://docs.databricks.com/aws/en/admin/users-groups/users) (retrieved 2026-10-14)
- [Sync users and groups from your identity provider using SCIM | Databricks on AWS](https://docs.databricks.com/aws/en/admin/users-groups/scim/) (retrieved 2026-10-14)
- [Manage service principals](https://docs.databricks.com/aws/en/admin/users-groups/manage-service-principals) (retrieved 2026-10-12)
- [Configure a federation policy](https://docs.databricks.com/aws/en/dev-tools/auth/oauth-federation-policy) (retrieved 2026-10-12)
- [Create account federation policy (Account API)](https://docs.databricks.com/api/account/accountfederationpolicy/create) (retrieved 2026-10-14)
- [Audit log system table reference](https://docs.databricks.com/aws/en/admin/system-tables/audit-logs) (retrieved 2026-10-12)
- [Audit log reference (Account-level authentication events)](https://docs.databricks.com/aws/en/admin/account-settings/audit-logs) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Export a workspace object | Databricks API Reference](https://docs.databricks.com/api/workspace/workspace/export) (retrieved 2026-10-14)
