# Bitbucket Cloud: Access tokens (repository, project, workspace)

`bitbucket-3` · API key / token · service. Admin-created bearer token tied to one repository, project or workspace rather than a user. Acts as its own 'user' identity named after the token in UI and logs.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Each repository, project or workspace has its own Access tokens settings page; no org-wide list documented. | Each repository, project or workspace has its own Access tokens settings page; no org-wide list documented. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Not available | Access tokens don't require two-step verification and are not tied to a user. |  |
| Protect: IP restriction | Conditional (requires Premium) | Premium workspace IP allowlist covers private content and Git operations; API enforcement for access tokens is not documented. | Restrict access to certain IP addresses: Workspace settings > Access controls > Restrict access to certain IP addresses |
| Protect: Expires automatically | Partial | Admin-set max (365 days default); 'No expiry' allowed if policy permits | Require access token expiry: Workspace settings > Security > Access tokens > Access token expiry date range |
| Detect: Usage appears in logs | Yes | Access token name (shown as user) | Access tokens page: Shows name, created date, last accessed date and scopes. · Bitbucket UI/logs as token user: Actions appear under the token's name as a user. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Yes | Content the token created remains. | Revoke on the container's Access tokens page. |
| Respond: Stops working when user is removed | N/A | Linked to a repository, project or workspace, not a user account. |  |

## Protect: what an admin can configure

### Admin controls
- **Require access token expiry** (Limit lifetime; all plans; default on). Sets the maximum expiry range for all access tokens in the workspace, its projects and repositories. Where: Workspace settings > Security > Access tokens > Access token expiry date range.
- **Access token scopes** (Limit scope; all plans; default varies). Scopes and resource container are fixed at creation. Where: Token creation dialog.
- **Restrict access to certain IP addresses** (Limit network; Premium; default off). Only allowlisted IPs can view private content or clone/push/pull private repos. Where: Workspace settings > Access controls > Restrict access to certain IP addresses.

- Network: conditional (checked at unknown). Premium workspace IP allowlist covers private content and Git operations; API enforcement for access tokens is not documented.
- Lifetime: Admin-set max (365 days default); 'No expiry' allowed if policy permits. Renewal: Rotate to refresh secret and expiry without changing scopes.
- Keyless option: not_applicable. Not tied to a user, so IdP SSO does not apply; docs state they do not require 2SV.
- Conditions: Premium for workspace/project tokens.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Access tokens page: Shows name, created date, last accessed date and scopes.
- Bitbucket UI/logs as token user: Actions appear under the token's name as a user.

### Fields that identify the credential
- `Access token name (shown as user)` (Bitbucket UI / activity): Commits, PR comments and merges attributed to the token.

### Lifecycle events
No docs found.

### Correlate on
`access token name`, `repository/project/workspace`

### API calls a holder can make, and whether they are logged
- discovery (bulk): `GET /2.0/repositories/{workspace}`. repositories the token can see Logged: unknown. Last accessed date updates on the token page.
- collection (bulk): `git clone https://x-token-auth:{token}@bitbucket.org/{workspace}/{repo}.git`. source code Logged: unknown. 

### What to look for (analyst guidance)
- Last accessed date recent on a token believed unused
- Tokens with No expiry
- Workspace tokens with admin scopes

## Respond: how to revoke it
- Admin: **Revoke access token**. Admin revokes a repository/project/workspace access token; apps using it lose access. Where: Repository/Project/Workspace settings > Access tokens > Revoke.

Revoke on the container's Access tokens page. Live access ends on revocation: yes. Content the token created remains.

## No vendor documentation found
- Admin can block or require approval
- Data reads appear in logs
- Audit events for create/revoke/rotate are not in the published event list
- Whoami behavior for access tokens
- Whether the workspace IP allowlist is enforced on REST API calls (docs only mention viewing content and Git clone/push/pull).
- Whether API tokens or OAuth tokens are checked against IdP SSO or conditional access at use time.
- Whether the workspace audit log records access token creation, rotation or revocation (no such events listed).
- Lifetime of the Pipelines OIDC token.
- OAuth access token lifetime: developer docs say 1 hour, support docs say 2 hours.
- Any admin approval workflow for users authorizing third-party OAuth consumers.

## Sources
- [Access tokens | Bitbucket Cloud](https://support.atlassian.com/bitbucket-cloud/docs/access-tokens/) (retrieved 2026-10-14)
- [The Bitbucket Cloud REST API](https://developer.atlassian.com/cloud/bitbucket/rest/intro/) (retrieved 2026-10-14)
- [Control access to private content in a workspace](https://support.atlassian.com/bitbucket-cloud/docs/control-access-to-private-content-in-a-workspace/) (retrieved 2026-10-14)
- [Require access token expiry](https://support.atlassian.com/bitbucket-cloud/docs/require-access-token-expiry/) (retrieved 2026-10-14)
- [Create an access token for a repository](https://support.atlassian.com/bitbucket-cloud/docs/create-a-repository-access-token/) (retrieved 2026-10-14)
- [Access tokens for a repository](https://support.atlassian.com/bitbucket-cloud/docs/repository-access-tokens/) (retrieved 2026-10-14)
- [Revoke an access token for a repository](https://support.atlassian.com/bitbucket-cloud/docs/revoke-a-repository-access-token/) (retrieved 2026-10-14)
- [Bitbucket Cloud audit log events](https://support.atlassian.com/bitbucket-cloud/kb/bitbucket-cloud-audit-log-events/) (retrieved 2026-10-14)
- [Bitbucket REST API - Repositories](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-repositories/) (retrieved 2026-10-14)
- [API tokens | Bitbucket Cloud](https://support.atlassian.com/bitbucket-cloud/docs/api-tokens/) (retrieved 2026-10-14)
