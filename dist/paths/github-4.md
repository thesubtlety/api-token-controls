# GitHub Enterprise Cloud: GitHub App user token

`github-4` · OAuth · person. Classic/fine-grained PATs, OAuth app tokens, GitHub App installation/user tokens, and Actions GITHUB_TOKEN.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Enterprise credential inventory CSV includes github_app_user_token. | Where: Enterprise Settings > Authentication security > Credentials > Export CSV; filter credential_type · API: POST /enterprises/{enterprise}/credentials/exports |
| Protect: Admin can block or require approval | Yes | Restrict GitHub App installation to organization owners | Restrict GitHub App installation to organization owners: Org settings > Third-party Access |
| Protect: SSO and MFA rules apply | Yes | SSO authorization is granted only when the user authorizes during an active SAML/OIDC session; CAP checks the app server IP for requests on a user's behalf. | Where: Org Settings > Authentication security > Require SAML SSO authentication (or Enterprise Settings > Authentication security > Require SAML authentication); EMU OIDC: Authentication security > IP allow list configuration > Identity Provider (CAP) · API: GET /orgs/{org}/credential-authorizations |
| Protect: IP restriction | Conditional (requires GitHub Enterprise Cloud) | Allowlist covers authenticated web/API/Git. Exceptions exist, including installation tokens for apps installed on a personal user account. | IP allow list: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security · Enable IP allow list configuration for installed GitHub Apps: Org settings > Authentication security > IP allow list |
| Protect: Expires automatically | Yes | 8 hours by default | Where: App settings > Edit > Optional Features > User-to-server token expiration > Opt-in (8 h token, 6-month refresh token) |
| Detect: Usage appears in logs | Yes | hashed_token, programmatic_access_type, token_id, token_scopes, integration, application_client_id, oauth_application_id | Where: Enterprise Settings > Audit log; search hashed_token:"<base64 SHA-256>" (hash from token or credential inventory CSV) · API: GET /enterprises/{enterprise}/audit-log?phrase=hashed_token:"<URI-escaped hash>" |
| Detect: Data reads appear in logs | Conditional | Enterprise Cloud only, 7-day retention via API | Where: Enterprise Settings > Audit log > Export Git Events > pick date range > Download Results; filter JSON on action git.clone and hashed_token · API: GET /enterprises/{enterprise}/audit-log?phrase=action:git.clone&include=git |
| Respond: Revocation ends active access | Yes | Revoking authorization revokes all its tokens across all orgs. Org owners cannot revoke user authorizations or their SSO authorization directly. | User revokes app authorization; app owner DELETE /applications/{client_id}/token or /grant; anyone posts ghu_/ghr_ to revocation API; org owner suspends/uninstalls the app; integration.revoke_all_tokens. |
| Respond: Stops working when user is removed | Yes | Offboarded users' app authorizations can no longer be used against enterprise/org resources. | Where: Org > People > select member > Remove from organization; Enterprise > People > ... > Remove from enterprise; EMU: deprovision in IdP (SCIM) · API: DELETE /orgs/{org}/members/{username}; EMU: DELETE /scim/v2/enterprises/{enterprise}/Users/{scim_user_id} |

## Protect: what an admin can configure

### Admin controls
- **Require SAML SSO authentication for all members** (Require SSO; GitHub Enterprise Cloud; default off). Members must authenticate via the IdP; classic PATs and SSH keys must be SSO-authorized, and OAuth/GitHub App user authorizations need an active SSO session. Where: Org settings > Authentication security > SAML single sign-on; or enterprise-level SAML.
- **Revoke SSO authorizations / Delete keys and tokens** (Other; GitHub Enterprise Cloud (SAML SSO or EMU); default unknown). Owners revoke SSO authorizations (SAML) or delete credentials (EMU only) per user, per credential type, or in bulk. Where: Org settings > Authentication security; enterprise incident response; REST API.
- **IP allow list** (Limit network; GitHub Enterprise Cloud; default off). Blocks PATs, OAuth app tokens, SSH/deploy keys, GitHub App tokens and GITHUB_TOKEN from non-allowed IPs (not user-installed apps' installation tokens). Where: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security.
- **Enable IP allow list configuration for installed GitHub Apps** (Limit network; GitHub Enterprise Cloud; default off). Adds IPs declared by installed GitHub Apps to the org allow list so app requests from those IPs are permitted. Where: Org settings > Authentication security > IP allow list.
- **Restrict GitHub App installation to organization owners** (Require approval; all plans; default off). Repository admins cannot install GitHub Apps or add repos to existing installations; they must request it. Where: Org settings > Third-party Access.
- **GitHub App installation repository access** (Limit resources; all plans; default varies). Owners limit an installed app to all or selected repositories. Where: Org settings > GitHub Apps > Configure > Repository access.

- Network: conditional (checked at api_request). Allowlist covers authenticated web/API/Git. Exceptions exist, including installation tokens for apps installed on a personal user account.
- Lifetime: 8 hours by default. Renewal: Single-use refresh token, valid 6 months; using it invalidates the old access and refresh tokens. If the app owner opted out of expiring user tokens, tokens do not expire.
- Keyless option: not_verified. GitHub Apps mint installation tokens using a private key. Actions OIDC is outbound federation to other platforms, not inbound GitHub API federation.
- Conditions: Enterprise Cloud feature scope. Fine-grained PATs, classic PATs and GitHub Apps have different approval/revocation rules.

## Detect: what gets logged
- Token prefix: `ghu_`

### Logs
- GitHub organization/enterprise audit log: Records token-authenticated actions with hashed_token, programmatic_access_type, token_scopes. 180 days; Git events 7 days and only via REST include=git, streaming or export. IP disclosure is opt-in.
- GitHub user security log: Token owner's own log: PAT/OAuth create, update, destroy events. Owner-visible only.
- Audit log streaming (enterprise): Needed to keep Git events beyond 7 days; api.request events (enterprise setting, streaming only).

### Fields that identify the credential
- `hashed_token` (audit log): Base64 SHA-256 of the token; search with hashed_token:"..."
- `programmatic_access_type` (audit log): How the actor authenticated
- `token_id` (audit log): Common field; mapping to REST ids not documented
- `token_scopes` (audit log): Scopes of the token, if any
- `integration` (audit/security log): App name
- `application_client_id` (audit log (integration.revoke_tokens)): App client ID
- `oauth_application_id` (security log (oauth_authorization.*)): App id

### Lifecycle events
- create: `oauth_authorization.create` User authorized app
- change: `oauth_authorization.update` Authorization changed
- revoke: `oauth_authorization.destroy` Authorization removed/expired
- revoke: `integration.revoke_tokens` Token(s) revoked
- revoke: `integration.revoke_all_tokens` All user tokens revoked
- create: `org_credential_authorization.grant` SSO auth (auto during SAML/OIDC session)

### Correlate on
`actor`, `actor_id`, `user_agent`, `actor_ip`, `actor_location`, `hashed_token`, `programmatic_access_type`, `token_id`, `request_id`, `org`, `repo`, `created_at`, `integration`, `application_client_id`

### API calls a holder can make, and whether they are logged
- recon: `GET /user`. login and profile of the authorizing user Logged: unknown. Reads not in standard audit log
- discovery: `GET /user/installations/{installation_id}/repositories`. repos both the user and the app installation can access Logged: unknown. Reads not in standard audit log
- collection (bulk): `GET /repos/{owner}/{repo}/tarball/{ref}`. full source archive of an accessible repo Logged: unknown (`repo.download_zip (candidate)`). API emission not stated
- collection (bulk): `git clone with user access token`. full repository history Logged: plan (`git.clone`). Enterprise Cloud only, 7-day retention via API

### Public detection rules (community, not vendor documentation)
- [GitHub OAuth Application Authorized](https://github.com/elastic/detection-rules/blob/main/rules/integrations/github/persistence_github_oauth_application_authorized.toml) (Elastic): A user authorized an OAuth application (new OAuth authorization).

### What to look for (analyst guidance)
- ghr_ refresh from a new IP/user_agent after the user's session ended
- app acting as user on repos user never touches
- user token still active after user offboarding (never-expire setting)
- many oauth_authorization.create for one app in short window (consent phishing)

### Sample query (GitHub audit log search)
Track app-wide user-token revocations; for use, search the user token's hashed_token.

```
action:integration.revoke_all_tokens created:>=2026-09-01
```

## Respond: how to revoke it
- Admin: **Suspend / Uninstall GitHub App**. Temporarily or permanently blocks an installed app from org resources. Where: Org settings > GitHub Apps > Configure > Suspend or Uninstall; enterprise owners also.

User revokes app authorization; app owner DELETE /applications/{client_id}/token or /grant; anyone posts ghu_/ghr_ to revocation API; org owner suspends/uninstalls the app; integration.revoke_all_tokens. Live access ends on revocation: yes. Revoking authorization revokes all its tokens across all orgs. Org owners cannot revoke user authorizations or their SSO authorization directly.

## No vendor documentation found
- ghu_ regex and dedicated secret-scanning type
- whether revoking ghu_ also revokes its ghr_
- refresh event name
- refresh-token use event
- Whether reads appear in api.request streaming events
- Whether admins can set a maximum lifetime for GitHub App user access tokens or OAuth app tokens (only app-developer settings found).
- Whether GITHUB_TOKEN workflow permission defaults can be made non-overridable.

## Sources
- [GitHub credential types reference](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/github-credential-types) (retrieved 2026-10-09)
- [Configuring OpenID Connect in cloud providers - GitHub Docs](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-cloud-providers) (retrieved 2026-10-09)
- [Managing allowed IP addresses for your organization - GitHub Docs](https://docs.github.com/en/enterprise-cloud%40latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) (retrieved 2026-10-09)
- [Enforcing policies for personal access tokens in your enterprise](https://docs.github.com/en/enterprise-cloud%40latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise) (retrieved 2026-10-09)
- [Refreshing user access tokens - GitHub Docs](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens) (retrieved 2026-10-09)
- [GitHub credential types reference](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/github-credential-types) (retrieved 2026-10-14)
- [About support for your IdP's Conditional Access Policy - GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/configuring-authentication-for-enterprise-managed-users/about-support-for-your-idps-conditional-access-policy) (retrieved 2026-10-09)
- [About user offboarding on GitHub Enterprise Cloud](https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/user-offboarding) (retrieved 2026-10-14)
- [Deprovisioning and reinstating users with SCIM](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/deprovisioning-and-reinstating-users) (retrieved 2026-10-14)
- [Reviewing credentials in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/reviewing-credentials-in-your-enterprise) (retrieved 2026-10-14)
- [REST API endpoints for enterprise credential inventory](https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/token-inventory) (retrieved 2026-10-14)
- [Enforcing SAML single sign-on for your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization/enforcing-saml-single-sign-on-for-your-organization) (retrieved 2026-10-14)
- [Configuring SAML single sign-on for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/using-saml-for-enterprise-iam/configuring-saml-single-sign-on-for-your-enterprise) (retrieved 2026-10-14)
- [About authentication with single sign-on](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-single-sign-on/about-authentication-with-single-sign-on) (retrieved 2026-10-14)
- [Restricting network traffic to your enterprise with an IP allow list](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/hardening-security-for-your-enterprise/restricting-network-traffic-to-your-enterprise-with-an-ip-allow-list) (retrieved 2026-10-14)
- [List SAML SSO authorizations for an organization](https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/orgs#list-saml-sso-authorizations-for-an-organization) (retrieved 2026-10-14)
- [Refreshing user access tokens](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens) (retrieved 2026-10-14)
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
- [Token expiration and revocation - GitHub Docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation) (retrieved 2026-10-09)
- [REST API endpoints for OAuth authorizations](https://docs.github.com/en/rest/apps/oauth-applications) (retrieved 2026-10-12)
- [Revoking authorizations or deleting credentials in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/revoke-authorizations-or-tokens) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Searching the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/searching-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [REST API endpoints for users](https://docs.github.com/en/rest/users/users) (retrieved 2026-10-12)
- [REST API endpoints for GitHub App installations](https://docs.github.com/en/rest/apps/installations) (retrieved 2026-10-12)
- [Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) (retrieved 2026-10-12)
- [Streaming the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [Authorizing a personal access token for use with single sign-on](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-single-sign-on/authorizing-a-personal-access-token-for-use-with-single-sign-on) (retrieved 2026-10-13)
- [Managing allowed IP addresses for your organization - GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) (retrieved 2026-10-09)
- [Limiting OAuth app and GitHub App access requests and installations](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/limiting-oauth-app-and-github-app-access-requests-and-installations) (retrieved 2026-10-13)
- [Reviewing and modifying installed GitHub Apps](https://docs.github.com/en/enterprise-cloud@latest/apps/using-github-apps/reviewing-and-modifying-installed-github-apps) (retrieved 2026-10-13)
