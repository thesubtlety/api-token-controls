# GitHub Enterprise Cloud: Fine-grained PAT

`github-2` · Personal access token · person. Classic/fine-grained PATs, OAuth app tokens, GitHub App installation/user tokens, and Actions GITHUB_TOKEN.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Org owners can view fine-grained PATs in org settings; enterprise credential inventory CSV includes fine_grained_pat. | Org owners can view fine-grained PATs in org settings; enterprise credential inventory CSV includes fine_grained_pat. |
| Protect: Admin can block or require approval | Yes | Fine-grained personal access tokens (restrict access); Restrict access via personal access tokens (enterprise policy); Require approval of fine-grained personal access tokens | Fine-grained personal access tokens (restrict access): Org settings > Personal access tokens > Settings > Fine-grained tokens tab · Restrict access via personal access tokens (enterprise policy): Enterprise settings > Policies > Personal access tokens · Require approval of fine-grained personal access tokens: Org settings > Personal access tokens > Settings > Fine-grained tokens; enterprise policy can force on/off |
| Protect: SSO and MFA rules apply | Yes | Fine-grained PATs support SSO authorization and must be authorized for SSO-enforced orgs; EMU OIDC CAP IP conditions apply to PAT authentication. | Where: Org Settings > Authentication security > Require SAML SSO authentication; fine-grained PATs are authorized at creation; admin lists them under Org Settings > Personal access tokens > Active tokens · API: GET /orgs/{org}/credential-authorizations |
| Protect: IP restriction | Conditional (requires GitHub Enterprise Cloud) | Allowlist covers authenticated web/API/Git. Exceptions exist, including installation tokens for apps installed on a personal user account. | IP allow list: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security |
| Protect: Expires automatically | Partial | 1–366 days or no expiry; the default org/enterprise maximum-lifetime policy is 366 days and can block no-expiry tokens. | Set maximum lifetimes for personal access tokens: Org settings > Personal access tokens > Settings (per token type); Enterprise settings > Policies > Personal access tokens |
| Detect: Usage appears in logs | Yes | hashed_token, programmatic_access_type, token_id, token_scopes, user_programmatic_access_id, user_programmatic_access_name, user_programmatic_access_request_id, token_id, token_last_used_at | GitHub organization/enterprise audit log: Records token-authenticated actions with hashed_token, programmatic_access_type, token_scopes. 180 days; Git events 7 days and only via REST include=git, streaming or export. IP disclosure is opt-in. · GitHub user security log: Token owner's own log: PAT/OAuth create, update, destroy events. Owner-visible only. · Audit log streaming (enterprise): Needed to keep Git events beyond 7 days; api.request events (enterprise setting, streaming only). · Enterprise credential inventory export: CSV with hashed_token, credential_id and SSH key fingerprint to match against audit events. · Org fine-grained PAT inventory (REST): GET /orgs/{org}/personal-access-tokens: token_id, token_name, token_expires_at, token_last_used_at. GitHub App auth only. |
| Detect: Data reads appear in logs | Conditional | Enterprise Cloud only, REST/streaming/export, 7-day retention via API | Where: Enterprise Settings > Audit log > Export Git Events > pick date range > Download Results; filter JSON on action git.clone and hashed_token · API: GET /enterprises/{enterprise}/audit-log?phrase=action:git.clone&include=git |
| Respond: Revocation ends active access | Partial | Org-owner revoke leaves SSH keys created by the token working and public reads allowed; user can reassign resource owner. Full delete or API revocation kills it. | Where: Org Settings > Personal access tokens > Active tokens > token > Revoke · API: POST /orgs/{org}/personal-access-tokens/{pat_id} {"action":"revoke"} (GitHub App only); full revoke of a leaked value: POST /credentials/revoke |
| Respond: Stops working when user is removed | Yes | Offboarded users' PATs can no longer access enterprise/org resources; EMU hard-deprovisioning deletes fine-grained PATs. | Where: Org > People > select member > Remove from organization; Enterprise > People > ... > Remove from enterprise; EMU: deprovision in IdP (SCIM) · API: DELETE /orgs/{org}/members/{username}; EMU: DELETE /scim/v2/enterprises/{enterprise}/Users/{scim_user_id} |

## Protect: what an admin can configure

### Admin controls
- **Fine-grained personal access tokens (restrict access)** (Disable; all plans; default off). Blocks fine-grained PATs from org-owned resources. Where: Org settings > Personal access tokens > Settings > Fine-grained tokens tab.
- **Restrict access via personal access tokens (enterprise policy)** (Disable; GitHub Enterprise Cloud; default off). Enterprise owners block classic and/or fine-grained PATs from all enterprise orgs; orgs cannot override. Where: Enterprise settings > Policies > Personal access tokens.
- **Require approval of fine-grained personal access tokens** (Require approval; all plans; default on). An org owner must approve each fine-grained PAT before it can access org resources (owner-created tokens exempt). Where: Org settings > Personal access tokens > Settings > Fine-grained tokens; enterprise policy can force on/off.
- **Set maximum lifetimes for personal access tokens** (Limit lifetime; all plans; default varies). Blocks member PATs whose lifetime exceeds the limit from org resources; tokens are not revoked. Enterprise can set a ceiling. Where: Org settings > Personal access tokens > Settings (per token type); Enterprise settings > Policies > Personal access tokens.
- **Revoke SSO authorizations / Delete keys and tokens** (Other; GitHub Enterprise Cloud (SAML SSO or EMU); default unknown). Owners revoke SSO authorizations (SAML) or delete credentials (EMU only) per user, per credential type, or in bulk. Where: Org settings > Authentication security; enterprise incident response; REST API.
- **Review and revoke fine-grained personal access tokens** (Other; all plans; default unknown). Org owners view and revoke any fine-grained PAT's access to the org. Where: Org settings > Personal access tokens > Active tokens; REST API (GitHub Apps only).
- **IP allow list** (Limit network; GitHub Enterprise Cloud; default off). Blocks PATs, OAuth app tokens, SSH/deploy keys, GitHub App tokens and GITHUB_TOKEN from non-allowed IPs (not user-installed apps' installation tokens). Where: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security.

- Network: conditional (checked at api_request). Allowlist covers authenticated web/API/Git. Exceptions exist, including installation tokens for apps installed on a personal user account.
- Lifetime: 1–366 days or no expiry; the default org/enterprise maximum-lifetime policy is 366 days and can block no-expiry tokens.. Renewal: No refresh token. An expired or revoked PAT cannot be restored; the owner creates a new token. PATs unused for one year are revoked automatically.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: Enterprise Cloud feature scope. Fine-grained PATs, classic PATs and GitHub Apps have different approval/revocation rules.

## Detect: what gets logged
- Token prefix: `github_pat_`

### Logs
- GitHub organization/enterprise audit log: Records token-authenticated actions with hashed_token, programmatic_access_type, token_scopes. 180 days; Git events 7 days and only via REST include=git, streaming or export. IP disclosure is opt-in.
- GitHub user security log: Token owner's own log: PAT/OAuth create, update, destroy events. Owner-visible only.
- Audit log streaming (enterprise): Needed to keep Git events beyond 7 days; api.request events (enterprise setting, streaming only).
- Enterprise credential inventory export: CSV with hashed_token, credential_id and SSH key fingerprint to match against audit events.
- Org fine-grained PAT inventory (REST): GET /orgs/{org}/personal-access-tokens: token_id, token_name, token_expires_at, token_last_used_at. GitHub App auth only.

### Fields that identify the credential
- `hashed_token` (audit log): Base64 SHA-256 of the token; search with hashed_token:"..."
- `programmatic_access_type` (audit log): How the actor authenticated
- `token_id` (audit log): Common field; mapping to REST ids not documented
- `token_scopes` (audit log): Scopes of the token, if any
- `user_programmatic_access_id` (audit log (personal_access_token.*)): Fine-grained PAT id in grant/revoke events
- `user_programmatic_access_name` (audit/security log): Token name
- `user_programmatic_access_request_id` (audit log): Access request id
- `token_id` (REST /orgs/{org}/personal-access-tokens): Token id in org inventory
- `token_last_used_at` (REST /orgs/{org}/personal-access-tokens): Last use time

### Lifecycle events
- create: `personal_access_token.create` Security log
- create: `personal_access_token.request_created` Org approval required
- change: `personal_access_token.access_granted` Token granted org access
- change: `personal_access_token.update` pat_field_changed
- change: `personal_access_token.credential_regenerated` Regenerated
- revoke: `personal_access_token.request_denied` Request denied
- revoke: `personal_access_token.access_revoked` Org revoked; still reads public org resources
- revoke: `personal_access_token.destroy` Owner deleted
- revoke: `personal_access_token.credential_revoked` Revoked by GitHub Advanced Security

### Correlate on
`actor`, `actor_id`, `user_agent`, `actor_ip`, `actor_location`, `hashed_token`, `programmatic_access_type`, `token_id`, `request_id`, `org`, `repo`, `created_at`, `user_programmatic_access_id`, `user_programmatic_access_name`, `repository_selection`

### API calls a holder can make, and whether they are logged
- recon: `GET /user`. login, profile (fine-grained token does not return X-OAuth-Scopes header) Logged: unknown. Reads not in standard audit log; see api.request streaming note
- discovery: `GET /user/repos`. repositories within the token's selected resources Logged: unknown. Reads not in standard audit log
- collection (bulk): `GET /repos/{owner}/{repo}/tarball/{ref} (or /zipball/{ref})`. redirect URL to a full source archive of the repo Logged: unknown (`repo.download_zip (candidate)`). repo.download_zip documented for ZIP source archives; API emission not stated
- collection (bulk): `git clone over HTTPS with token`. full repository history Logged: plan (`git.clone`). Enterprise Cloud only, REST/streaming/export, 7-day retention via API

### Public detection rules (community, not vendor documentation)
- [GitHub Secret Scanning Alert Created](https://github.com/panther-labs/panther-analysis/blob/develop/rules/github_rules/github_secret_scanning_alert_created.yml) (Panther): GitHub secret scanning raised an alert for a secret found in a repository, which includes leaked GitHub tokens.
- [Github Push Protection Bypass Detected](https://github.com/SigmaHQ/sigma/blob/master/rules/application/github/audit/github_push_protection_bypass_detected.yml) (Sigma): A user bypassed secret scanning push protection and pushed a detected secret.
- [New GitHub Personal Access Token (PAT) Added](https://github.com/elastic/detection-rules/blob/main/rules/integrations/github/persistence_new_pat_created.toml) (Elastic): A fine-grained personal access token was granted access to the organization.
- [High Number of Cloned GitHub Repos From PAT](https://github.com/elastic/detection-rules/blob/main/rules/integrations/github/execution_github_high_number_of_cloned_repos_from_pat.toml) (Elastic): Many private repository clones made with an OAuth access token or fine-grained PAT.

### What to look for (analyst guidance)
- access_granted or update widening repository_selection to all right before bulk reads
- token_last_used_at recent on a token whose owner is offboarded
- request_created from a user who never used PATs before
- use of a no-expiration token not touched in months
- SSH keys created by the token still in use after access_revoked

### Sample query (GitHub audit log search)
Find fine-grained PATs newly granted org access, then pivot on user_programmatic_access_id and hashed_token.

```
action:personal_access_token.access_granted created:>=2026-09-01
```

## Respond: how to revoke it


Owner deletes token; anyone posts value to revocation API; org owner revokes it (UI or REST via GitHub App); restrict PAT access by org/enterprise policy. Live access ends on revocation: partial. Org-owner revoke leaves SSH keys created by the token working and public reads allowed; user can reassign resource owner. Full delete or API revocation kills it.

## No vendor documentation found
- regex/length for github_pat_
- whether audit token_id equals REST token_id/user_programmatic_access_id
- failed-auth event
- programmatic_access_type values
- Fine-grained tokens do not emit X-OAuth-Scopes per fetched docs; no documented self-introspection of granted permissions found
- Whether reads appear in api.request events
- Whether admins can set a maximum lifetime for GitHub App user access tokens or OAuth app tokens (only app-developer settings found).
- Whether GITHUB_TOKEN workflow permission defaults can be made non-overridable.

## Sources
- [GitHub credential types reference](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/github-credential-types) (retrieved 2026-10-09)
- [Configuring OpenID Connect in cloud providers - GitHub Docs](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-cloud-providers) (retrieved 2026-10-09)
- [Managing allowed IP addresses for your organization - GitHub Docs](https://docs.github.com/en/enterprise-cloud%40latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) (retrieved 2026-10-09)
- [Enforcing policies for personal access tokens in your enterprise](https://docs.github.com/en/enterprise-cloud%40latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise) (retrieved 2026-10-09)
- [Enforcing policies for personal access tokens in your enterprise - GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise) (retrieved 2026-10-09)
- [Token expiration and revocation - GitHub Docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation) (retrieved 2026-10-09)
- [GitHub credential types reference](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/github-credential-types) (retrieved 2026-10-14)
- [About support for your IdP's Conditional Access Policy - GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/configuring-authentication-for-enterprise-managed-users/about-support-for-your-idps-conditional-access-policy) (retrieved 2026-10-09)
- [About user offboarding on GitHub Enterprise Cloud](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/user-offboarding) (retrieved 2026-10-14)
- [Deprovisioning and reinstating users with SCIM](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/deprovisioning-and-reinstating-users) (retrieved 2026-10-14)
- [Reviewing credentials in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/reviewing-credentials-in-your-enterprise) (retrieved 2026-10-14)
- [Enforcing SAML single sign-on for your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization/enforcing-saml-single-sign-on-for-your-organization) (retrieved 2026-10-14)
- [Configuring SAML single sign-on for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/configuring-saml-single-sign-on-for-your-enterprise) (retrieved 2026-10-14)
- [Authorizing a personal access token for use with single sign-on](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-single-sign-on/authorizing-a-personal-access-token-for-use-with-single-sign-on) (retrieved 2026-10-13)
- [Reviewing and revoking personal access tokens in your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/reviewing-and-revoking-personal-access-tokens-in-your-organization) (retrieved 2026-10-13)
- [Exporting audit log activity for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/exporting-audit-log-activity-for-your-enterprise) (retrieved 2026-10-14)
- [Using the audit log API for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/using-the-audit-log-api-for-your-enterprise) (retrieved 2026-10-12)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise) (retrieved 2026-10-12)
- [Identifying audit log events performed by an access token](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/identifying-audit-log-events-performed-by-an-access-token) (retrieved 2026-10-12)
- [REST API endpoints for personal access tokens](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/personal-access-tokens) (retrieved 2026-10-14)
- [Revocation](https://docs.github.com/en/enterprise-cloud@latest/rest/credentials/revoke) (retrieved 2026-10-14)
- [Removing a member from your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-membership-in-your-organization/removing-a-member-from-your-organization) (retrieved 2026-10-14)
- [Remove an organization member](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/members#remove-an-organization-member) (retrieved 2026-10-14)
- [Removing a member from your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/removing-a-member-from-your-enterprise) (retrieved 2026-10-14)
- [About authentication to GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github) (retrieved 2026-10-12)
- [Audit log events for your organization](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/audit-log-events-for-your-organization) (retrieved 2026-10-12)
- [Security log events](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/security-log-events) (retrieved 2026-10-12)
- [Audit log for an enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [Searching the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/searching-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [Responding to a security incident](https://docs.github.com/en/code-security/tutorials/secure-your-organization/respond-to-a-security-incident) (retrieved 2026-10-12)
- [Revoking authorizations or deleting credentials in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/revoke-authorizations-or-tokens) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [REST API endpoints for personal access tokens (organizations)](https://docs.github.com/en/rest/orgs/personal-access-tokens) (retrieved 2026-10-12)
- [Reviewing and revoking personal access tokens in your organization](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/reviewing-and-revoking-personal-access-tokens-in-your-organization) (retrieved 2026-10-12)
- [REST API endpoints for users](https://docs.github.com/en/rest/users/users) (retrieved 2026-10-12)
- [Permissions required for fine-grained personal access tokens - GitHub Docs](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens) (retrieved 2026-10-12)
- [Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) (retrieved 2026-10-12)
- [Streaming the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [Setting a personal access token policy for your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization) (retrieved 2026-10-13)
- [Managing allowed IP addresses for your organization - GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) (retrieved 2026-10-09)
