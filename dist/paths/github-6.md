# GitHub Enterprise Cloud: OAuth app user access token

`github-6` · OAuth · person. A classic OAuth app gets a gho_ user access token through the web or device flow and sends it as Authorization: Bearer. The token acts as the user, limited by the granted scopes.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Enterprise credential inventory CSV includes oauth_app_user_token. | Where: Enterprise Settings > Authentication security > Credentials > Export CSV; filter credential_type · API: POST /enterprises/{enterprise}/credentials/exports |
| Protect: Admin can block or require approval | Yes | OAuth app access restrictions; App access requests | OAuth app access restrictions: Org settings > Third-party Access > OAuth app policy · App access requests: Org settings > Third-party Access |
| Protect: SSO and MFA rules apply | Yes | OAuth app tokens get SSO authorization automatically only during an active SAML/OIDC session; CAP checks the app server IP for user-context requests. | Where: Org Settings > Authentication security > Require SAML SSO authentication (or Enterprise Settings > Authentication security > Require SAML authentication); EMU OIDC: Authentication security > IP allow list configuration > Identity Provider (CAP) · API: GET /orgs/{org}/credential-authorizations |
| Protect: IP restriction | Conditional (requires GitHub Enterprise Cloud) | The organization/enterprise IP allow list (Enterprise Cloud only) covers OAuth app tokens. Unlike GitHub Apps, OAuth app IPs cannot be added automatically. With the IdP (Entra OIDC CAP) allow list, GitHub sends the app server's IP for validation, and admins can exempt authorized OAuth apps. | IP allow list: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security |
| Protect: Expires automatically | Not available | Long-lived; revoked after 1 year unused. App can opt in to 8-hour expiring tokens |  |
| Detect: Usage appears in logs | Yes | hashed_token, programmatic_access_type, token_id, token_scopes, oauth_application_id, oauth_application_name, hashed_token, token_last_eight | Where: Enterprise Settings > Audit log; search hashed_token:"<base64 SHA-256>" (hash from token or credential inventory CSV) · API: GET /enterprises/{enterprise}/audit-log?phrase=hashed_token:"<URI-escaped hash>" |
| Detect: Data reads appear in logs | Conditional | Enterprise Cloud only; OAuth app id recorded on some events | Where: Enterprise Settings > Audit log > Export Git Events > pick date range > Download Results; filter JSON on action git.clone and hashed_token · API: GET /enterprises/{enterprise}/audit-log?phrase=action:git.clone&include=git |
| Respond: Revocation ends active access | Yes | Revoking authorization kills all its tokens. Org owners cannot revoke an OAuth token's SSO authorization; denying app access blocks org data. | User revokes authorization; app owner DELETE /applications/{client_id}/token or /grant or revoke all tokens; anyone posts value to revocation API; org owner denies the app's org access; reset client secret. |
| Respond: Stops working when user is removed | Yes | Offboarded users' app authorizations can no longer be used against enterprise/org resources. | Where: Org > People > select member > Remove from organization; Enterprise > People > ... > Remove from enterprise; EMU: deprovision in IdP (SCIM) · API: DELETE /orgs/{org}/members/{username}; EMU: DELETE /scim/v2/enterprises/{enterprise}/Users/{scim_user_id} |

## Protect: what an admin can configure

### Admin controls
- **Require SAML SSO authentication for all members** (Require SSO; GitHub Enterprise Cloud; default off). Members must authenticate via the IdP; classic PATs and SSH keys must be SSO-authorized, and OAuth/GitHub App user authorizations need an active SSO session. Where: Org settings > Authentication security > SAML single sign-on; or enterprise-level SAML.
- **Revoke SSO authorizations / Delete keys and tokens** (Other; GitHub Enterprise Cloud (SAML SSO or EMU); default unknown). Owners revoke SSO authorizations (SAML) or delete credentials (EMU only) per user, per credential type, or in bulk. Where: Org settings > Authentication security; enterprise incident response; REST API.
- **IP allow list** (Limit network; GitHub Enterprise Cloud; default off). Blocks PATs, OAuth app tokens, SSH/deploy keys, GitHub App tokens and GITHUB_TOKEN from non-allowed IPs (not user-installed apps' installation tokens). Where: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security.
- **OAuth app access restrictions** (Require approval; all plans; default on). Unapproved OAuth apps cannot access private org resources; members must request owner approval. Where: Org settings > Third-party Access > OAuth app policy.
- **App access requests** (Require approval; all plans; default on). Controls whether members/outside collaborators may request installation or approval of unapproved apps. Where: Org settings > Third-party Access.

- Network: conditional (checked at api_request). The organization/enterprise IP allow list (Enterprise Cloud only) covers OAuth app tokens. Unlike GitHub Apps, OAuth app IPs cannot be added automatically. With the IdP (Entra OIDC CAP) allow list, GitHub sends the app server's IP for validation, and admins can exempt authorized OAuth apps.
- Lifetime: Long-lived; revoked after 1 year unused. App can opt in to 8-hour expiring tokens. Renewal: By default the same token is reused until revoked or unused for one year. If the app requires expiring tokens or requests offline_access, a refresh token (expires after six months unused) issues a new 8-hour token.
- Keyless option: not_verified. The token is obtained by user authorization in the web or device flow. SAML/OIDC SSO authorization is granted automatically during an active SSO session, but no inbound token exchange is documented for this path.
- Conditions: IP allow lists and SAML SSO need Enterprise Cloud. Admins cannot revoke SSO authorization for individual OAuth app tokens, and these authorizations are not visible in the UI.

## Detect: what gets logged
- Token prefix: `gho_`

### Logs
- GitHub organization/enterprise audit log: Records token-authenticated actions with hashed_token, programmatic_access_type, token_scopes. 180 days; Git events 7 days and only via REST include=git, streaming or export. IP disclosure is opt-in.
- GitHub user security log: Token owner's own log: PAT/OAuth create, update, destroy events. Owner-visible only.
- Audit log streaming (enterprise): Needed to keep Git events beyond 7 days; api.request events (enterprise setting, streaming only).
- Enterprise credential inventory export: CSV with hashed_token, credential_id and SSH key fingerprint to match against audit events.

### Fields that identify the credential
- `hashed_token` (audit log): Base64 SHA-256 of the token; search with hashed_token:"..."
- `programmatic_access_type` (audit log): How the actor authenticated
- `token_id` (audit log): Common field; mapping to REST ids not documented
- `token_scopes` (audit log): Scopes of the token, if any
- `oauth_application_id` (audit/security log): OAuth app id
- `oauth_application_name` (security log): OAuth app name
- `hashed_token` (REST check-a-token response): Token hash returned by POST /applications/{client_id}/token
- `token_last_eight` (REST check-a-token response): Last 8 chars

### Lifecycle events
- create: `oauth_authorization.create` User authorized app
- create: `oauth_access.create` Token generated
- change: `oauth_access.regenerate` Token regenerated
- revoke: `oauth_access.revoke` Token revoked
- revoke: `oauth_access.destroy` Token deleted
- revoke: `oauth_authorization.destroy` Authorization deleted/expired
- revoke: `oauth_application.revoke_tokens` App owner revoked tokens
- revoke: `oauth_application.revoke_all_tokens` All tokens
- change: `oauth_application.reset_secret` Client secret reset

### Correlate on
`actor`, `actor_id`, `user_agent`, `actor_ip`, `actor_location`, `hashed_token`, `programmatic_access_type`, `token_id`, `request_id`, `org`, `repo`, `created_at`, `oauth_application_id`, `oauth_application_name`

### API calls a holder can make, and whether they are logged
- recon: `GET /user`. login, profile; X-OAuth-Scopes response header lists the granted OAuth scopes Logged: unknown. Reads not in standard audit log
- discovery: `GET /user/repos`. repositories the OAuth user can reach Logged: unknown. Reads not in standard audit log
- collection (bulk): `GET /repos/{owner}/{repo}/tarball/{ref}`. full source archive of a repo Logged: unknown (`repo.download_zip (candidate)`). API emission not stated
- collection (bulk): `git clone with gho_ token`. full repository history Logged: plan (`git.clone`). Enterprise Cloud only; OAuth app id recorded on some events

### Public detection rules (community, not vendor documentation)
- [GitHub Org Authentication Method Changed](https://github.com/panther-labs/panther-analysis/blob/develop/rules/github_rules/github_org_auth_modified.yml) (Panther): Org authentication setting changes, including turning OAuth app access restrictions on or off (the rule also covers SAML and 2FA changes).
- [High Number of Cloned GitHub Repos From PAT](https://github.com/elastic/detection-rules/blob/main/rules/integrations/github/execution_github_high_number_of_cloned_repos_from_pat.toml) (Elastic): Many private repository clones made with an OAuth access token or fine-grained PAT.
- [GitHub OAuth Application Authorized](https://github.com/elastic/detection-rules/blob/main/rules/integrations/github/persistence_github_oauth_application_authorized.toml) (Elastic): A user authorized an OAuth application (new OAuth authorization).

### What to look for (analyst guidance)
- new oauth_authorization.create for an unknown app across many users (consent phishing)
- token used from a different ASN than the app's servers
- device-flow authorizations by users who do not use that tool
- use of scopes (repo, admin:org) beyond what the app needs

### Sample query (GitHub audit log search)
Spot new OAuth app grants in the window; pivot on oauth_application_id.

```
action:oauth_authorization.create created:>=2026-09-01
```

## Respond: how to revoke it
- Admin: **Deny access to a previously approved OAuth app**. Owners remove an approved OAuth app's access to the org. Where: Org settings > Third-party Access > OAuth app policy.

User revokes authorization; app owner DELETE /applications/{client_id}/token or /grant or revoke all tokens; anyone posts value to revocation API; org owner denies the app's org access; reset client secret. Live access ends on revocation: yes. Revoking authorization kills all its tokens. Org owners cannot revoke an OAuth token's SSO authorization; denying app access blocks org data.

## No vendor documentation found
- gho_ regex/length
- whether org audit log shows oauth_access.* (documented in security log)
- failed-auth event
- Whether reads appear in api.request streaming events
- Whether admins can set a maximum lifetime for GitHub App user access tokens or OAuth app tokens (only app-developer settings found).
- Whether GITHUB_TOKEN workflow permission defaults can be made non-overridable.

## Sources
- [Authorizing OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps) (retrieved 2026-10-12)
- [GitHub credential types reference](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/github-credential-types) (retrieved 2026-10-09)
- [Managing allowed IP addresses for your organization - GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) (retrieved 2026-10-09)
- [Managing allowed IP addresses for your organization](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) (retrieved 2026-10-12)
- [About support for your IdP's Conditional Access Policy](https://docs.github.com/enterprise-cloud@latest/admin/identity-and-access-management/using-enterprise-managed-users-for-iam/about-support-for-your-idps-conditional-access-policy) (retrieved 2026-10-12)
- [Token expiration and revocation - GitHub Docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation) (retrieved 2026-10-09)
- [About OAuth app access restrictions](https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions) (retrieved 2026-10-12)
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
- [REST API endpoints for OAuth authorizations](https://docs.github.com/en/rest/apps/oauth-applications) (retrieved 2026-10-12)
- [Revoking authorizations or deleting credentials in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/respond-to-incidents/revoke-authorizations-or-tokens) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Responding to a security incident](https://docs.github.com/en/code-security/tutorials/secure-your-organization/respond-to-a-security-incident) (retrieved 2026-10-12)
- [Searching the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/searching-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [Scopes for OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps) (retrieved 2026-10-12)
- [REST API endpoints for users](https://docs.github.com/en/rest/users/users) (retrieved 2026-10-12)
- [Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) (retrieved 2026-10-12)
- [Streaming the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [Authorizing a personal access token for use with single sign-on](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-single-sign-on/authorizing-a-personal-access-token-for-use-with-single-sign-on) (retrieved 2026-10-13)
- [About OAuth app access restrictions](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions) (retrieved 2026-10-13)
- [Limiting OAuth app and GitHub App access requests and installations](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/limiting-oauth-app-and-github-app-access-requests-and-installations) (retrieved 2026-10-13)
