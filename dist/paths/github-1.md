# GitHub Enterprise Cloud: Classic PAT

`github-1` · Personal access token · person. Classic/fine-grained PATs, OAuth app tokens, GitHub App installation/user tokens, and Actions GITHUB_TOKEN.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Enterprise Settings > Authentication security > Credentials 'Export CSV' lists classic_pat credentials enterprise-wide (enterprise owners; org owners have no direct visibility). | Enterprise Settings > Authentication security > Credentials 'Export CSV' lists classic_pat credentials enterprise-wide (enterprise owners; org owners have no direct visibility). |
| Protect: Admin can block or require approval | Yes | Restrict personal access tokens (classic) from accessing your organizations; Restrict access via personal access tokens (enterprise policy) | Restrict personal access tokens (classic) from accessing your organizations: Org settings > Personal access tokens > Settings > Tokens (classic) tab · Restrict access via personal access tokens (enterprise policy): Enterprise settings > Policies > Personal access tokens |
| Protect: SSO and MFA rules apply | Yes | With SAML/OIDC SSO, a classic PAT must be SSO-authorized for the org before it can reach org resources; with EMU OIDC, IdP CAP IP conditions are checked on each PAT authentication. | Where: Org Settings > Authentication security > Require SAML SSO authentication (or Enterprise Settings > Authentication security > Require SAML authentication); user authorizes token via Developer settings > Personal access tokens > Configure SSO; admin reviews under People > member > SAML identity linked > Authorized credentials · API: GET /orgs/{org}/credential-authorizations |
| Protect: IP restriction | Conditional (requires GitHub Enterprise Cloud) | Allowlist covers authenticated web/API/Git. Exceptions exist, including installation tokens for apps installed on a personal user account. | IP allow list: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security |
| Protect: Expires automatically | Partial | User-chosen expiry or none; classic PATs have no expiration requirement unless an enterprise/org owner sets a maximum lifetime. Revoked if unused for one year. | Set maximum lifetimes for personal access tokens: Org settings > Personal access tokens > Settings (per token type); Enterprise settings > Policies > Personal access tokens |
| Detect: Usage appears in logs | Yes | hashed_token, programmatic_access_type, token_id, token_scopes, managed_hashed_token, managed_token_id | Where: Enterprise Settings > Audit log; search hashed_token:"<base64 SHA-256>" (hash from token or credential inventory CSV) · API: GET /enterprises/{enterprise}/audit-log?phrase=hashed_token:"<URI-escaped hash>" |
| Detect: Data reads appear in logs | Conditional | Git events: Enterprise Cloud only, via REST API/streaming/export, 7-day retention via API; actor token visible as hashed_token | Where: Enterprise Settings > Audit log > Export Git Events > pick date range > Download Results; filter JSON on action git.clone and hashed_token · API: GET /enterprises/{enterprise}/audit-log?phrase=action:git.clone&include=git |
| Respond: Revocation ends active access | Yes | Deleting/revoking ends the token. SSO revoke only blocks SSO-protected orgs; token still works elsewhere. Org owners cannot list classic PATs. | Owner deletes token in settings; anyone with the value can POST it to the credential revocation API; org/enterprise owners revoke its SSO authorization or restrict classic PAT access by policy; EMU owners can delete credentials. |
| Respond: Stops working when user is removed | Yes | Offboarded users' PATs can no longer access enterprise/org resources; EMU hard-deprovisioning deletes them. | Where: Org > People > select member > Remove from organization; Enterprise > People > ... > Remove from enterprise; EMU: deprovision in IdP (SCIM) · API: DELETE /orgs/{org}/members/{username}; EMU: DELETE /scim/v2/enterprises/{enterprise}/Users/{scim_user_id} |

## Protect: what an admin can configure

### Admin controls
- **Restrict personal access tokens (classic) from accessing your organizations** (Disable; all plans; default off). Blocks classic PATs from org-owned resources; public resources stay reachable. Where: Org settings > Personal access tokens > Settings > Tokens (classic) tab.
- **Restrict access via personal access tokens (enterprise policy)** (Disable; GitHub Enterprise Cloud; default off). Enterprise owners block classic and/or fine-grained PATs from all enterprise orgs; orgs cannot override. Where: Enterprise settings > Policies > Personal access tokens.
- **Set maximum lifetimes for personal access tokens** (Limit lifetime; all plans; default varies). Blocks member PATs whose lifetime exceeds the limit from org resources; tokens are not revoked. Enterprise can set a ceiling. Where: Org settings > Personal access tokens > Settings (per token type); Enterprise settings > Policies > Personal access tokens.
- **Require SAML SSO authentication for all members** (Require SSO; GitHub Enterprise Cloud; default off). Members must authenticate via the IdP; classic PATs and SSH keys must be SSO-authorized, and OAuth/GitHub App user authorizations need an active SSO session. Where: Org settings > Authentication security > SAML single sign-on; or enterprise-level SAML.
- **Revoke SSO authorizations / Delete keys and tokens** (Other; GitHub Enterprise Cloud (SAML SSO or EMU); default unknown). Owners revoke SSO authorizations (SAML) or delete credentials (EMU only) per user, per credential type, or in bulk. Where: Org settings > Authentication security; enterprise incident response; REST API.
- **IP allow list** (Limit network; GitHub Enterprise Cloud; default off). Blocks PATs, OAuth app tokens, SSH/deploy keys, GitHub App tokens and GITHUB_TOKEN from non-allowed IPs (not user-installed apps' installation tokens). Where: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security.

### Not available (vendor states)
- Classic PATs cannot be put under an approval workflow; only fine-grained PATs can.

- Network: conditional (checked at api_request). Allowlist covers authenticated web/API/Git. Exceptions exist, including installation tokens for apps installed on a personal user account.
- Lifetime: User-chosen expiry or none; classic PATs have no expiration requirement unless an enterprise/org owner sets a maximum lifetime. Revoked if unused for one year.. Renewal: No refresh token. An expired or revoked PAT cannot be restored; the owner creates a new token. PATs unused for one year are revoked automatically.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: Enterprise Cloud feature scope. Fine-grained PATs, classic PATs and GitHub Apps have different approval/revocation rules.

## Detect: what gets logged
- Token prefix: `ghp_`

### Logs
- GitHub organization/enterprise audit log: Records token-authenticated actions with hashed_token, programmatic_access_type, token_scopes. 180 days; Git events 7 days and only via REST include=git, streaming or export. IP disclosure is opt-in.
- GitHub user security log: Token owner's own log: PAT/OAuth create, update, destroy events. Owner-visible only.
- Audit log streaming (enterprise): Needed to keep Git events beyond 7 days; api.request events (enterprise setting, streaming only).
- Enterprise credential inventory export: CSV with hashed_token, credential_id and SSH key fingerprint to match against audit events.
- Secret scanning alerts: secret_scanning_alert.* events; GitHub auto-revokes tokens pushed to public repos/gists.

### Fields that identify the credential
- `hashed_token` (audit log): Base64 SHA-256 of the token; search with hashed_token:"..."
- `programmatic_access_type` (audit log): How the actor authenticated
- `token_id` (audit log): Common field; mapping to REST ids not documented
- `token_scopes` (audit log): Scopes of the token, if any
- `managed_hashed_token` (audit log (org_credential_authorization.*)): Hash of the SSO-authorized credential
- `managed_token_id` (audit log (org_credential_authorization.*)): Id of the SSO-authorized credential

### Lifecycle events
- create: `org_credential_authorization.grant` Member authorized the PAT for SAML/OIDC SSO in the org
- revoke: `oauth_authorization.destroy` Docs: may appear when a PAT expires or is revoked (security log)
- revoke: `org_credential_authorization.revoke` Owner revoked SSO authorization
- revoke: `org_credential_authorization.deauthorize` Member removed SSO authorization
- revoke: `oauth_access.destroy` Emitted by enterprise 'delete tokens' action
- use: `secret_scanning_alert.create` Leak detected (exposure, not use)
- use: `git.clone` Git events carry token data (public preview); REST include=git/export only

### Correlate on
`actor`, `actor_id`, `user_agent`, `actor_ip`, `actor_location`, `hashed_token`, `programmatic_access_type`, `token_id`, `request_id`, `org`, `repo`, `created_at`, `transport_protocol_name`

### API calls a holder can make, and whether they are logged
- recon: `GET /user`. login, profile; X-OAuth-Scopes response header lists classic/OAuth token scopes Logged: unknown. REST GETs are not in the standard audit log; api.request exists only via Enterprise Cloud streaming with API Request Events enabled, limited to security-relevant endpoints
- discovery: `GET /user/repos`. repositories the token's user can reach Logged: unknown. Reads not in standard audit log; see api.request streaming note
- collection (bulk): `GET /repos/{owner}/{repo}/tarball/{ref} (or /zipball/{ref})`. redirect URL to a full source archive of the repo Logged: unknown (`repo.download_zip (candidate)`). Docs define repo.download_zip for ZIP source-archive downloads but do not state the API zipball/tarball emits it; tarball not addressed
- collection (bulk): `git clone https://github.com/{owner}/{repo}.git`. full repository history Logged: plan (`git.clone`). Git events: Enterprise Cloud only, via REST API/streaming/export, 7-day retention via API; actor token visible as hashed_token

### Public detection rules (community, not vendor documentation)
- [GitHub Secret Scanning Alert Created](https://github.com/panther-labs/panther-analysis/blob/develop/rules/github_rules/github_secret_scanning_alert_created.yml) (Panther): GitHub secret scanning raised an alert for a secret found in a repository, which includes leaked GitHub tokens.
- [Github Push Protection Bypass Detected](https://github.com/SigmaHQ/sigma/blob/master/rules/application/github/audit/github_push_protection_bypass_detected.yml) (Sigma): A user bypassed secret scanning push protection and pushed a detected secret.

### What to look for (analyst guidance)
- hashed_token seen from new country/ASN or user_agent unlike the owner's tooling
- burst of git.clone across many repos by one hashed_token
- classic PAT use after owner left org or after SSO revoke attempt
- token_scopes include admin:org, delete_repo or workflow on a token used only for read
- use shortly after secret_scanning_alert.create or public_leak

### Sample query (GitHub audit log search)
All web/API events by one leaked classic PAT (hash with: echo -n TOKEN | openssl dgst -sha256 -binary | base64); add include=git via REST for Git events.

```
hashed_token:"EH4L8o6PfCqipALbL+QT62lyqUtnI7ql0SPbkaQnjv8" created:>=2026-09-01
```

## Respond: how to revoke it


Owner deletes token in settings; anyone with the value can POST it to the credential revocation API; org/enterprise owners revoke its SSO authorization or restrict classic PAT access by policy; EMU owners can delete credentials. Live access ends on revocation: yes. Deleting/revoking ends the token. SSO revoke only blocks SSO-protected orgs; token still works elsewhere. Org owners cannot list classic PATs.

## No vendor documentation found
- regex/length for ghp_ tokens
- enumerated values of programmatic_access_type
- event for classic PAT creation in security log
- failed-auth event for invalid/revoked token
- relation between audit token_id and other ids
- actor_ip not listed in current cloud field docs (seen in GHES example)
- Whether GET /user or repo-listing reads appear in api.request streaming events
- Whether the API tarball/zipball download emits repo.download_zip
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
- [Viewing and managing a member's SAML access to your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/granting-access-to-your-organization-with-saml-single-sign-on/viewing-and-managing-a-members-saml-access-to-your-organization) (retrieved 2026-10-14)
- [List SAML SSO authorizations for an organization](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/orgs#list-saml-sso-authorizations-for-an-organization) (retrieved 2026-10-14)
- [Identifying audit log events performed by an access token](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/identifying-audit-log-events-performed-by-an-access-token) (retrieved 2026-10-12)
- [Exporting audit log activity for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/exporting-audit-log-activity-for-your-enterprise) (retrieved 2026-10-14)
- [Using the audit log API for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/using-the-audit-log-api-for-your-enterprise) (retrieved 2026-10-12)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise) (retrieved 2026-10-12)
- [Removing a member from your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-membership-in-your-organization/removing-a-member-from-your-organization) (retrieved 2026-10-14)
- [Remove an organization member](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/members#remove-an-organization-member) (retrieved 2026-10-14)
- [Removing a member from your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/removing-a-member-from-your-enterprise) (retrieved 2026-10-14)
- [About authentication to GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github) (retrieved 2026-10-12)
- [Audit log events for your organization](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/audit-log-events-for-your-organization) (retrieved 2026-10-12)
- [Security log events](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/security-log-events) (retrieved 2026-10-12)
- [Audit log for an enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [Displaying IP addresses in the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/displaying-ip-addresses-in-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [REST API endpoints for enterprise audit logs (GHES 3.13 example)](https://docs.github.com/en/enterprise-server@3.13/rest/enterprise-admin/audit-log) (retrieved 2026-10-12)
- [Searching the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/searching-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [Responding to a security incident](https://docs.github.com/en/code-security/tutorials/secure-your-organization/respond-to-a-security-incident) (retrieved 2026-10-12)
- [Revoking authorizations or deleting credentials in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/revoke-authorizations-or-tokens) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Common security incident investigation areas](https://docs.github.com/en/code-security/reference/security-incident-response/investigation-areas) (retrieved 2026-10-12)
- [REST API endpoints for organizations (Get the audit log for an organization)](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/orgs) (retrieved 2026-10-12)
- [Scopes for OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps) (retrieved 2026-10-12)
- [REST API endpoints for users](https://docs.github.com/en/rest/users/users) (retrieved 2026-10-12)
- [Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) (retrieved 2026-10-12)
- [Permissions required for fine-grained personal access tokens - GitHub Docs](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens) (retrieved 2026-10-12)
- [REST API endpoints for repository contents](https://docs.github.com/en/rest/repos/contents) (retrieved 2026-10-12)
- [Streaming the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [Setting a personal access token policy for your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization) (retrieved 2026-10-13)
- [Managing allowed IP addresses for your organization - GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) (retrieved 2026-10-09)
