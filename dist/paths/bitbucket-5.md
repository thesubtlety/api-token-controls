# Bitbucket Cloud: SSH keys (personal SSH keys and repository/project access keys)

`bitbucket-5` · API key / token · person or service. Public keys registered on a user account (Git access as that user) or as repository/project access keys (deploy keys) for Git over SSH.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Per user via GET /users/{selected_user}/ssh-keys, or per repository/project settings; no org-wide list. | Per user via GET /users/{selected_user}/ssh-keys, or per repository/project settings; no org-wide list. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Premium allowlist blocks clone/push/pull of private repositories from non-allowlisted IPs. | Restrict access to certain IP addresses: Workspace settings > Access controls > Restrict access to certain IP addresses |
| Protect: Expires automatically | Yes | Personal SSH keys accept an optional expires_on date when added via API; default no expiry. Not documented for access keys. | Where: Personal Bitbucket settings > Security > SSH keys > Add key > Expiry: Expires on (date picker) |
| Detect: Usage appears in logs | Yes | key | Where: Workspace settings > Security: Audit log; filter 'SSH key added/removed', 'Repository/Project Access key added/removed' |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | In-flight SSH sessions not documented. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Restrict access to certain IP addresses** (Limit network; Premium; default off). Only allowlisted IPs can view private content or clone/push/pull private repos. Where: Workspace settings > Access controls > Restrict access to certain IP addresses.

- Network: supported (checked at api_request). Premium allowlist blocks clone/push/pull of private repositories from non-allowlisted IPs.
- Lifetime: Personal SSH keys accept an optional expires_on date when added via API; default no expiry. Not documented for access keys.. Renewal: Key stays valid until removed.
- Keyless option: not_verified. Docs reviewed do not state whether SSO applies to SSH Git access.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- Bitbucket workspace audit log: 30 days.

### Fields that identify the credential
- `key` (workspace audit log): Field names not documented.

### Lifecycle events
- create: `SSH key added` User key.
- revoke: `SSH key removed` User key.
- create: `Repository Access key added` Deploy key.
- revoke: `Repository Access key removed` Deploy key.

### Correlate on
`key fingerprint`, `user`, `repository`

### API calls a holder can make, and whether they are logged
- collection (bulk): `git clone git@bitbucket.org:{workspace}/{repo}.git`. source code Logged: unknown. 

### What to look for (analyst guidance)
- SSH or access key added outside change windows
- Access keys added to many repositories

## Respond: how to revoke it
- Admin: **Delete deploy key / SSH key**. Remove an SSH or deploy key via UI or API. Where: DELETE /repositories/{workspace}/{repo_slug}/deploy-keys/{key_id}; DELETE /users/{selected_user}/ssh-keys/{key_id}.

Delete key via UI or DELETE API. Live access ends on revocation: unknown. In-flight SSH sessions not documented.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- Git clone/pull activity logging
- Whether the workspace IP allowlist is enforced on REST API calls (docs only mention viewing content and Git clone/push/pull).
- Whether API tokens or OAuth tokens are checked against IdP SSO or conditional access at use time.
- Whether the workspace audit log records access token creation, rotation or revocation (no such events listed).
- Lifetime of the Pipelines OIDC token.
- OAuth access token lifetime: developer docs say 1 hour, support docs say 2 hours.
- Any admin approval workflow for users authorizing third-party OAuth consumers.

## Sources
- [Bitbucket REST API - SSH](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-ssh/) (retrieved 2026-10-14)
- [Bitbucket REST API - Deployments](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-deployments/) (retrieved 2026-10-14)
- [Configure SSH and two-step verification](https://support.atlassian.com/bitbucket-cloud/docs/configure-ssh-and-two-step-verification/) (retrieved 2026-10-14)
- [Control access to private content in a workspace](https://support.atlassian.com/bitbucket-cloud/docs/control-access-to-private-content-in-a-workspace/) (retrieved 2026-10-14)
- [Bitbucket Cloud OpenAPI spec (POST /users/{selected_user}/ssh-keys)](https://dac-static.atlassian.com/cloud/bitbucket/swagger.v3.json) (retrieved 2026-10-14)
- [Set up personal SSH keys on Linux](https://support.atlassian.com/bitbucket-cloud/docs/set-up-personal-ssh-keys-on-linux/) (retrieved 2026-10-14)
- [Bitbucket Cloud audit log events](https://support.atlassian.com/bitbucket-cloud/kb/bitbucket-cloud-audit-log-events/) (retrieved 2026-10-14)
