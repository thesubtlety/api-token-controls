# GitHub Enterprise Cloud: Deploy key

`github-7` · SSH key · service. An SSH key pair whose public key is attached to a single repository; the private key stays on the server and authenticates Git operations over SSH. Keys are read-only by default, and write access can be granted when the key is added.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Only per repository via GET /repos/{owner}/{repo}/keys or repo settings; deploy keys are not in the enterprise credential inventory types. | Only per repository via GET /repos/{owner}/{repo}/keys or repo settings; deploy keys are not in the enterprise credential inventory types. |
| Protect: Admin can block or require approval | Yes | Deploy keys (allow/disallow creation); Enforcing a policy for deploy keys (enterprise) | Deploy keys (allow/disallow creation): Org settings > Repository > Deploy keys; Enterprise settings > Policies > Repository > Deploy keys · Enforcing a policy for deploy keys (enterprise): Enterprise settings > Policies > Repository > Deploy keys |
| Protect: SSO and MFA rules apply | Not available | Deploy keys are repository-scoped, are not SSO-authorized, and IdP CAP IP conditions do not apply to them. |  |
| Protect: IP restriction | Conditional (requires GitHub Enterprise Cloud) | An organization or enterprise IP allow list (GitHub Enterprise Cloud only) covers SSH keys, including deploy keys, for organization-owned repositories. IdP conditional access policy (CAP) IP conditions, used with OIDC for Enterprise Managed Users, do not apply to deploy keys because they do not act on behalf of a user. | IP allow list: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security |
| Protect: Expires automatically | Not available | No expiry; valid until deleted or disabled |  |
| Detect: Usage appears in logs | Yes | fingerprint, deploy_key_fingerprint, read_only, hashed_token, last_used, added_by | GitHub organization/enterprise audit log: Records token-authenticated actions with hashed_token, programmatic_access_type, token_scopes. 180 days; Git events 7 days and only via REST include=git, streaming or export. IP disclosure is opt-in. · Audit log streaming (enterprise): Needed to keep Git events beyond 7 days; api.request events (enterprise setting, streaming only). · Enterprise credential inventory export: CSV with hashed_token, credential_id and SSH key fingerprint to match against audit events. · Deploy keys REST: GET /repos/{owner}/{repo}/keys: id, title, read_only, added_by, last_used, enabled. |
| Detect: Data reads appear in logs | Conditional | Git events Enterprise Cloud only; deploy-key token attribution is in public preview | Where: Enterprise Settings > Audit log > Export Git Events; filter JSON on action git.clone and hashed_token (deploy-key token data is public preview) · API: GET /enterprises/{enterprise}/audit-log?phrase=action:git.clone&include=git |
| Respond: Revocation ends active access | Yes | Org-wide disable disables existing keys immediately. Not covered by enterprise bulk credential actions or SSO revoke. | Repo admin deletes the key (UI or DELETE /repos/{owner}/{repo}/keys/{key_id}); org owner disables deploy keys org-wide; enterprise policy can disable them. |
| Respond: Stops working when user is removed | N/A | Deploy keys are tied to the repository; they stay active when the creating user is removed. |  |

## Protect: what an admin can configure

### Admin controls
- **IP allow list** (Limit network; GitHub Enterprise Cloud; default off). Blocks PATs, OAuth app tokens, SSH/deploy keys, GitHub App tokens and GITHUB_TOKEN from non-allowed IPs (not user-installed apps' installation tokens). Where: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security.
- **Deploy keys (allow/disallow creation)** (Disable; all plans; default off). Disallowing deploy keys blocks creation and disables existing deploy keys in all org repos. Where: Org settings > Repository > Deploy keys; Enterprise settings > Policies > Repository > Deploy keys.
- **Enforcing a policy for deploy keys (enterprise)** (Disable; GitHub Enterprise Cloud; default varies). Enterprise owners allow, restrict, or delegate deploy key creation for all orgs; disabling disables existing keys. Where: Enterprise settings > Policies > Repository > Deploy keys.

- Network: conditional (checked at api_request). An organization or enterprise IP allow list (GitHub Enterprise Cloud only) covers SSH keys, including deploy keys, for organization-owned repositories. IdP conditional access policy (CAP) IP conditions, used with OIDC for Enterprise Managed Users, do not apply to deploy keys because they do not act on behalf of a user.
- Lifetime: No expiry; valid until deleted or disabled. Renewal: The same key is reused until a repository admin deletes it or deploy keys are disabled by policy; removing the user who added it does not deactivate it.
- Keyless option: not_applicable. Static SSH key registered on the repository; no external identity exchange is involved.
- Conditions: One key per repository; a key can't be reused across repositories. New organizations disallow deploy key creation by default. A write-enabled key can do what an organization member with admin access can do on that repository. A key created through the API with a personal access token or OAuth app token is deleted when that token is deleted or revoked; keys created with GitHub App tokens are not. Keys are not tied to organization membership.

## Detect: what gets logged
- Token prefix: not established

### Logs
- GitHub organization/enterprise audit log: Records token-authenticated actions with hashed_token, programmatic_access_type, token_scopes. 180 days; Git events 7 days and only via REST include=git, streaming or export. IP disclosure is opt-in.
- Audit log streaming (enterprise): Needed to keep Git events beyond 7 days; api.request events (enterprise setting, streaming only).
- Enterprise credential inventory export: CSV with hashed_token, credential_id and SSH key fingerprint to match against audit events.
- Deploy keys REST: GET /repos/{owner}/{repo}/keys: id, title, read_only, added_by, last_used, enabled.

### Fields that identify the credential
- `fingerprint` (audit log (public_key.*)): Key fingerprint
- `deploy_key_fingerprint` (audit log (e.g. protected_branch events)): Deploy key that acted
- `read_only` (audit log / REST): Write-capable if false
- `hashed_token` (audit log): Token data for deploy keys is public preview
- `last_used` (Deploy keys REST): Last use time
- `added_by` (Deploy keys REST): Who added it

### Lifecycle events
- create: `public_key.create` Deploy key or SSH key added
- change: `public_key.update` Key updated
- revoke: `public_key.delete` Key removed
- use: `git.clone` 7-day retention unless streamed
- use: `git.push` Write keys only

### Correlate on
`actor`, `fingerprint`, `deploy_key_fingerprint`, `repo`, `transport_protocol_name`, `actor_ip`, `created_at`

### API calls a holder can make, and whether they are logged
- recon: `ssh -T git@github.com`. greeting confirms the key authenticates; a deploy key authenticates to its single repository Logged: unknown. No documented audit event for an SSH auth test
- collection (bulk): `git clone git@github.com:{owner}/{repo}.git`. full history of the one repository the key is attached to Logged: plan (`git.clone`). Git events Enterprise Cloud only; deploy-key token attribution is in public preview

### Public detection rules (community, not vendor documentation)
- [GitHub User Access Key Created](https://github.com/panther-labs/panther-analysis/blob/develop/rules/github_rules/github_user_access_key_created.yml) (Panther): A new SSH public key was added (user SSH key or deploy key).

### What to look for (analyst guidance)
- public_key.create with read_only false on a repo that only needs reads
- git.push via a deploy key outside deploy windows
- clone by a deploy key from an IP that is not the deploy server
- deploy key added by a user who is not a repo admin normally

### Sample query (GitHub audit log search)
Find deploy keys added to a repo; check read_only and title.

```
action:public_key.create repo:octo-org/app created:>=2026-09-01
```

## Respond: how to revoke it


Repo admin deletes the key (UI or DELETE /repos/{owner}/{repo}/keys/{key_id}); org owner disables deploy keys org-wide; enterprise policy can disable them. Live access ends on revocation: yes. Org-wide disable disables existing keys immediately. Not covered by enterprise bulk credential actions or SSO revoke.

## No vendor documentation found
- fingerprint hash format in audit events
- whether git.* events include deploy key fingerprint
- failed SSH auth event
- Exact ssh -T greeting wording for a deploy key (docs show the user form only)
- Whether deploy keys can call the REST API (not addressed in fetched docs)
- Whether admins can set a maximum lifetime for GitHub App user access tokens or OAuth app tokens (only app-developer settings found).
- Whether GITHUB_TOKEN workflow permission defaults can be made non-overridable.

## Sources
- [Managing deploy keys - GitHub Docs](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) (retrieved 2026-10-12)
- [Managing allowed IP addresses for your organization - GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) (retrieved 2026-10-09)
- [About support for your IdP's Conditional Access Policy - GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/configuring-authentication-for-enterprise-managed-users/about-support-for-your-idps-conditional-access-policy) (retrieved 2026-10-09)
- [Restricting deploy keys in your organization - GitHub Enterprise Cloud Docs](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/restricting-deploy-keys-in-your-organization) (retrieved 2026-10-12)
- [Enforcing repository management policies in your enterprise - GitHub Enterprise Cloud Docs](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise) (retrieved 2026-10-12)
- [REST API endpoints for deploy keys - GitHub Docs](https://docs.github.com/en/rest/deploy-keys/deploy-keys) (retrieved 2026-10-12)
- [Permissions required for fine-grained personal access tokens - GitHub Docs](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens) (retrieved 2026-10-12)
- [Audit log events for your organization - GitHub Enterprise Cloud Docs](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/audit-log-events-for-your-organization) (retrieved 2026-10-12)
- [Managing deploy keys](https://docs.github.com/en/enterprise-cloud@latest/authentication/connecting-to-github-with-ssh/managing-deploy-keys) (retrieved 2026-10-14)
- [REST API endpoints for deploy keys](https://docs.github.com/en/enterprise-cloud@latest/rest/deploy-keys/deploy-keys) (retrieved 2026-10-14)
- [Reviewing credentials in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/reviewing-credentials-in-your-enterprise) (retrieved 2026-10-14)
- [Exporting audit log activity for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/exporting-audit-log-activity-for-your-enterprise) (retrieved 2026-10-14)
- [Using the audit log API for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/using-the-audit-log-api-for-your-enterprise) (retrieved 2026-10-12)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise) (retrieved 2026-10-12)
- [Identifying audit log events performed by an access token](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/identifying-audit-log-events-performed-by-an-access-token) (retrieved 2026-10-12)
- [GitHub credential types reference](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/github-credential-types) (retrieved 2026-10-09)
- [Audit log events for your organization](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/audit-log-events-for-your-organization) (retrieved 2026-10-12)
- [REST API endpoints for organizations (Get the audit log for an organization)](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/orgs) (retrieved 2026-10-12)
- [Restricting deploy keys in your organization](https://docs.github.com/en/organizations/managing-organization-settings/restricting-deploy-keys-in-your-organization) (retrieved 2026-10-12)
- [Common security incident investigation areas](https://docs.github.com/en/code-security/reference/security-incident-response/investigation-areas) (retrieved 2026-10-12)
- [Audit log for an enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Testing your SSH connection](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/testing-your-ssh-connection) (retrieved 2026-10-12)
