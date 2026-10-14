# GitHub Enterprise Cloud: GitHub App installation

`github-3` · Signed JWT · service. Classic/fine-grained PATs, OAuth app tokens, GitHub App installation/user tokens, and Actions GITHUB_TOKEN.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Enterprise credential inventory CSV lists github_app_installation rows (the installation, not each 1-hour token). | Where: Enterprise Settings > Authentication security > Credentials > Export CSV; filter credential_type · API: POST /enterprises/{enterprise}/credentials/exports; per org: GET /orgs/{org}/installations |
| Protect: Admin can block or require approval | Yes | App access requests; Restrict GitHub App installation to organization owners | App access requests: Org settings > Third-party Access · Restrict GitHub App installation to organization owners: Org settings > Third-party Access |
| Protect: SSO and MFA rules apply | Not available | Installation tokens do not need SSO authorization, and app-as-installation requests bypass IdP CAP. |  |
| Protect: IP restriction | Conditional (requires GitHub Enterprise Cloud) | GitHub IP allow list covers installation tokens, except for apps installed on a personal user account. If the enterprise uses the IdP (Entra OIDC CAP) allow list instead, requests made as the app or installation are not validated and are always allowed. | IP allow list: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security · Enable IP allow list configuration for installed GitHub Apps: Org settings > Authentication security > IP allow list |
| Protect: Expires automatically | Yes | 1 hour | API: POST /app/installations/{installation_id}/access_tokens returns expires_at (fixed 1 hour) |
| Detect: Usage appears in logs | Yes | hashed_token, programmatic_access_type, token_id, token_scopes, integration, application_client_id, oauth_application_id | GitHub organization/enterprise audit log: Records token-authenticated actions with hashed_token, programmatic_access_type, token_scopes. 180 days; Git events 7 days and only via REST include=git, streaming or export. IP disclosure is opt-in. · Audit log streaming (enterprise): Needed to keep Git events beyond 7 days; api.request events (enterprise setting, streaming only). · App webhook/installation list (REST): GET /orgs/{org}/installations lists installed apps, app_id, permissions, suspended_at. |
| Detect: Data reads appear in logs | Conditional | Enterprise Cloud only; actor appears as hashed_token | Where: Enterprise Settings > Audit log > Export Git Events > pick date range > Download Results; filter JSON on action git.clone and hashed_token · API: GET /enterprises/{enterprise}/audit-log?phrase=action:git.clone&include=git |
| Respond: Revocation ends active access | Yes | Uninstall deactivates all installation tokens; tokens expire in 1 hour anyway. Not covered by enterprise bulk SSO/credential actions. Private-key rotation event name not established. | App owner calls DELETE /installation/token; org owner suspends or uninstalls the app; rotate the app private key so no new tokens can be minted. |
| Respond: Stops working when user is removed | N/A | Installation tokens are tied to the app installation, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **IP allow list** (Limit network; GitHub Enterprise Cloud; default off). Blocks PATs, OAuth app tokens, SSH/deploy keys, GitHub App tokens and GITHUB_TOKEN from non-allowed IPs (not user-installed apps' installation tokens). Where: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security.
- **Enable IP allow list configuration for installed GitHub Apps** (Limit network; GitHub Enterprise Cloud; default off). Adds IPs declared by installed GitHub Apps to the org allow list so app requests from those IPs are permitted. Where: Org settings > Authentication security > IP allow list.
- **App access requests** (Require approval; all plans; default on). Controls whether members/outside collaborators may request installation or approval of unapproved apps. Where: Org settings > Third-party Access.
- **Restrict GitHub App installation to organization owners** (Require approval; all plans; default off). Repository admins cannot install GitHub Apps or add repos to existing installations; they must request it. Where: Org settings > Third-party Access.
- **GitHub App installation repository access** (Limit resources; all plans; default varies). Owners limit an installed app to all or selected repositories. Where: Org settings > GitHub Apps > Configure > Repository access.

### Not available (vendor states)
- Enterprise revoke/delete credential actions do not cover GitHub App installation tokens, deploy keys or GITHUB_TOKEN.
- GitHub Apps are not subject to the OAuth app access policy.

- Network: conditional (checked at api_request). GitHub IP allow list covers installation tokens, except for apps installed on a personal user account. If the enterprise uses the IdP (Entra OIDC CAP) allow list instead, requests made as the app or installation are not validated and are always allowed.
- Lifetime: 1 hour. Renewal: Mint another installation token using the GitHub App private key.
- Keyless option: not_verified. GitHub Apps mint installation tokens using a private key. Actions OIDC is outbound federation to other platforms, not inbound GitHub API federation.
- Conditions: Enterprise Cloud feature scope. Fine-grained PATs, classic PATs and GitHub Apps have different approval/revocation rules.

## Detect: what gets logged
- Token prefix: `ghs_`

### Logs
- GitHub organization/enterprise audit log: Records token-authenticated actions with hashed_token, programmatic_access_type, token_scopes. 180 days; Git events 7 days and only via REST include=git, streaming or export. IP disclosure is opt-in.
- Audit log streaming (enterprise): Needed to keep Git events beyond 7 days; api.request events (enterprise setting, streaming only).
- App webhook/installation list (REST): GET /orgs/{org}/installations lists installed apps, app_id, permissions, suspended_at.

### Fields that identify the credential
- `hashed_token` (audit log): Base64 SHA-256 of the token; search with hashed_token:"..."
- `programmatic_access_type` (audit log): How the actor authenticated
- `token_id` (audit log): Common field; mapping to REST ids not documented
- `token_scopes` (audit log): Scopes of the token, if any
- `integration` (audit log (integration_installation.*)): App name
- `application_client_id` (audit log): App client ID
- `oauth_application_id` (audit log): Associated app id

### Lifecycle events
- create: `integration_installation.create` App installed
- change: `integration_installation.repositories_added` Scope widened
- change: `integration_installation.version_updated` Permissions updated
- change: `integration.update` App registration changed
- revoke: `integration_installation.suspend` Stops tokens
- revoke: `integration_installation.destroy` Uninstall deactivates tokens
- change: `integration.remove_client_secret` Client secret removed

### Correlate on
`actor`, `hashed_token`, `programmatic_access_type`, `integration`, `application_client_id`, `oauth_application_id`, `user_agent`, `repo`, `created_at`

### API calls a holder can make, and whether they are logged
- recon: `GET /app`. app identity associated with the credentials (requires app JWT) Logged: unknown. Reads not in standard audit log
- discovery: `GET /app/installations`. every org/account that installed the app Logged: unknown. Reads not in standard audit log
- discovery: `GET /installation/repositories`. repos the installation access token can reach Logged: unknown. Reads not in standard audit log
- collection (bulk): `GET /repos/{owner}/{repo}/tarball/{ref}`. full source archive of an accessible repo Logged: unknown (`repo.download_zip (candidate)`). API emission of repo.download_zip not stated
- collection (bulk): `git clone with installation token`. full repository history Logged: plan (`git.clone`). Enterprise Cloud only; actor appears as hashed_token

### Public detection rules (community, not vendor documentation)
- [Github Organization App Integration Installed](https://github.com/panther-labs/panther-analysis/blob/develop/rules/github_rules/github_organization_app_integration_installed.yml) (Panther): A GitHub App was installed on the organization.

### What to look for (analyst guidance)
- installation token activity on repos outside the app's normal set
- repositories_added or version_updated followed quickly by bulk clone
- new integration_installation.create by a non-admin actor
- app activity from IPs outside the app's IP allow list
- spike in token minting (many distinct hashed_token values per hour)

### Sample query (GitHub audit log search)
Find installations whose scope or permissions grew.

```
action:integration_installation.repositories_added action:integration_installation.version_updated created:>=2026-09-01
```

## Respond: how to revoke it
- Admin: **Suspend / Uninstall GitHub App**. Temporarily or permanently blocks an installed app from org resources. Where: Org settings > GitHub Apps > Configure > Suspend or Uninstall; enterprise owners also.

App owner calls DELETE /installation/token; org owner suspends or uninstalls the app; rotate the app private key so no new tokens can be minted. Live access ends on revocation: yes. Uninstall deactivates all installation tokens; tokens expire in 1 hour anyway. Not covered by enterprise bulk SSO/credential actions. Private-key rotation event name not established.

## No vendor documentation found
- regex for ghs_APPID_JWT
- audit event for app private key creation/deletion
- whether audit actor for installation token is app bot name
- installation_id field name in audit events
- Whether minting POST /app/installations/{id}/access_tokens is audit-logged
- Whether reads appear in api.request streaming events
- Whether admins can set a maximum lifetime for GitHub App user access tokens or OAuth app tokens (only app-developer settings found).
- Whether GITHUB_TOKEN workflow permission defaults can be made non-overridable.

## Sources
- [GitHub credential types reference](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/github-credential-types) (retrieved 2026-10-09)
- [Configuring OpenID Connect in cloud providers - GitHub Docs](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-cloud-providers) (retrieved 2026-10-09)
- [Managing allowed IP addresses for your organization - GitHub Docs](https://docs.github.com/en/enterprise-cloud%40latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) (retrieved 2026-10-09)
- [Enforcing policies for personal access tokens in your enterprise](https://docs.github.com/en/enterprise-cloud%40latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise) (retrieved 2026-10-09)
- [About support for your IdP's Conditional Access Policy - GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/configuring-authentication-for-enterprise-managed-users/about-support-for-your-idps-conditional-access-policy) (retrieved 2026-10-09)
- [GitHub credential types reference](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/github-credential-types) (retrieved 2026-10-14)
- [Managing deploy keys](https://docs.github.com/en/enterprise-cloud@latest/authentication/connecting-to-github-with-ssh/managing-deploy-keys) (retrieved 2026-10-14)
- [Reviewing credentials in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/reviewing-credentials-in-your-enterprise) (retrieved 2026-10-14)
- [REST API endpoints for enterprise credential inventory](https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/token-inventory) (retrieved 2026-10-14)
- [List app installations for an organization](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/orgs#list-app-installations-for-an-organization) (retrieved 2026-10-14)
- [Generating an installation access token for a GitHub App](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app) (retrieved 2026-10-14)
- [Exporting audit log activity for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/exporting-audit-log-activity-for-your-enterprise) (retrieved 2026-10-14)
- [Using the audit log API for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/using-the-audit-log-api-for-your-enterprise) (retrieved 2026-10-12)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise) (retrieved 2026-10-12)
- [Identifying audit log events performed by an access token](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/identifying-audit-log-events-performed-by-an-access-token) (retrieved 2026-10-12)
- [About authentication to GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github) (retrieved 2026-10-12)
- [Generating an installation access token for a GitHub App](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app) (retrieved 2026-10-12)
- [Audit log events for your organization](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/audit-log-events-for-your-organization) (retrieved 2026-10-12)
- [Audit log for an enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [Searching the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/searching-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [REST API endpoints for GitHub App installations](https://docs.github.com/en/rest/apps/installations) (retrieved 2026-10-12)
- [REST API endpoints for organizations (Get the audit log for an organization)](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/orgs) (retrieved 2026-10-12)
- [Common security incident investigation areas](https://docs.github.com/en/code-security/reference/security-incident-response/investigation-areas) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [REST API endpoints for GitHub Apps](https://docs.github.com/en/rest/apps/apps) (retrieved 2026-10-12)
- [Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) (retrieved 2026-10-12)
- [Managing allowed IP addresses for your organization - GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) (retrieved 2026-10-09)
- [Limiting OAuth app and GitHub App access requests and installations](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/limiting-oauth-app-and-github-app-access-requests-and-installations) (retrieved 2026-10-13)
- [Reviewing and modifying installed GitHub Apps](https://docs.github.com/en/enterprise-cloud@latest/apps/using-github-apps/reviewing-and-modifying-installed-github-apps) (retrieved 2026-10-13)
- [Revoking authorizations or deleting credentials in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/revoke-authorizations-or-tokens) (retrieved 2026-10-12)
- [https://docs.github.com/en/enterprise-cloud@latest/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps](https://docs.github.com/en/enterprise-cloud@latest/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps) (retrieved 2026-10-13)
