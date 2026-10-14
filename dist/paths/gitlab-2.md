# GitLab.com: OAuth

`gitlab-2` · OAuth · person. Personal/project/group access tokens, OAuth bearer, CI_JOB_TOKEN and deployment credentials for limited endpoints.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Partial | API requests are not SSO-checked, except Git-related endpoints when the Git/Dependency Proxy SSO option is on. | Where: Group > Settings > SAML SSO > Enforce SSO-only authentication for Git and Dependency Proxy activity for this group (Git-related API only) |
| Protect: IP restriction | Conditional (requires Premium or Ultimate) | Group restriction covers UI/API/Git, including service-account and project/group tokens. Runner coordination and other documented exceptions remain. | Restrict access by IP address: Top-level group > Settings > General > Permissions and group features |
| Protect: Expires automatically | Yes | 2 hours on GitLab.com (configurable only by Self-Managed/Dedicated admins) | API: POST /oauth/token response expires_in (7200); GET /oauth/token/info shows expires_in |
| Detect: Usage appears in logs | Yes | application.uid, resource_owner_id, scope, author_id | GitLab audit events (group/project/instance): Retained indefinitely. Group/project events need Premium/Ultimate; API date range max 30 days per query. Streaming needs Ultimate. · api_json.log / production_json.log: Self-Managed only. Per-request remote_ip, ua, user_id, username, route/path; correlation_id in production_json.log. · /oauth/token/info: Returns resource_owner_id, scope, expires_in, application.uid, created_at for a live token · User profile > Access > Applications (Authorized applications): Per-user list of authorized OAuth apps with Revoke |
| Detect: Data reads appear in logs | Yes | repository_download_operation | Where: Project > Secure > Audit events; filter by user and date, look for repository_download_operation · API: GET /projects/:id/audit_events |
| Respond: Revocation ends active access | Partial | Deleting the app removes all tokens. Effect of revoking a refresh token on outstanding access tokens is not documented; access tokens expire after 2 hours. | User revokes the app under Access > Applications > Authorized applications; app owner calls POST /oauth/revoke with client_id, client_secret, token; delete the application to remove all grants and tokens; Renew secret to stop the app from obtaining new tokens. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Restrict access by IP address** (Limit network; Premium or Ultimate; default off). Limits UI and API access to the group to listed CIDRs, including group/project tokens, deploy keys and CI clone operations. Where: Top-level group > Settings > General > Permissions and group features.
- **Enforce SSO-only authentication for Git and Dependency Proxy activity** (Require SSO; Premium or Ultimate; default off). Git over HTTPS/SSH and Git-related API calls by users need an active SSO session; not enforced for bot tokens or CI jobs. Where: Group > Settings > SAML SSO.

### Not available (vendor states)
- Group SSO enforcement does not apply to API requests (PAT or OAuth).

- Network: conditional (checked at api_request). Group restriction covers UI/API/Git, including service-account and project/group tokens. Runner coordination and other documented exceptions remain.
- Lifetime: 2 hours on GitLab.com (configurable only by Self-Managed/Dedicated admins). Renewal: Refresh exchange invalidates the previous access/refresh pair.
- Keyless option: not_verified. CI OIDC ID tokens federate outward to external services. CI_JOB_TOKEN is a native short-lived credential, not generic external federation.
- Conditions: Group IP controls require Premium/Ultimate. Do not transfer Self-Managed 400-day/configuration options to GitLab.com.

## Detect: what gets logged
- Token prefix: not established

### Logs
- GitLab audit events (group/project/instance): Retained indefinitely. Group/project events need Premium/Ultimate; API date range max 30 days per query. Streaming needs Ultimate.
- api_json.log / production_json.log: Self-Managed only. Per-request remote_ip, ua, user_id, username, route/path; correlation_id in production_json.log.
- /oauth/token/info: Returns resource_owner_id, scope, expires_in, application.uid, created_at for a live token
- User profile > Access > Applications (Authorized applications): Per-user list of authorized OAuth apps with Revoke

### Fields that identify the credential
- `application.uid` (/oauth/token/info): OAuth client ID that owns the token
- `resource_owner_id` (/oauth/token/info): User the token acts as
- `scope` (/oauth/token/info): Granted scopes
- `author_id` (Audit events API): User acting

### Lifecycle events
- create: `oauth_application_created` App registration
- create: `user_authorized_oauth_application` User grants consent
- change: `oauth_application_updated` Redirect URI/scopes change
- use: `api_request_access_with_scope` Subset of requests with audited scope
- revoke: `oauth_application_deleted` Removes all grants and tokens
- use: `authenticated_with_oauth` Sign-in with OAuth (OmniAuth), not API token use
- auth_fail: `omniauth_login_failed` OmniAuth sign-in failure

### Correlate on
`application.uid`, `resource_owner_id`, `author_id`, `details.ip_address`, `details.target_id`, `remote_ip`, `ua`, `user_id`

### API calls a holder can make, and whether they are logged
- recon: `GET /oauth/token/info`. resource_owner_id, scope, expires_in, application for the OAuth token Logged: unknown. Doorkeeper introspection; no documented audit event
- discovery: `GET /projects?membership=true`. projects the OAuth user is a member of Logged: unknown. No documented read/listing event
- collection (bulk): `GET /projects/:id/repository/archive[.format]`. full repository file archive (tar/zip) Logged: yes (`repository_download_operation`). Premium/Ultimate to save to DB; Ultimate to stream; public projects use public_repository_download_operation (not saved)

### What to look for (analyst guidance)
- user_authorized_oauth_application for an app created minutes earlier (consent phishing)
- oauth_application_updated changing redirect URI followed by new authorizations
- many users authorizing the same non-trusted app in a short window
- API activity for a user from IPs never seen in their interactive sessions
- refresh-token use from a host different from the app's normal egress

### Sample query (GitLab REST API (OAuth token info))
Identify the app (application.uid), user (resource_owner_id) and scope of a found token

```
GET /oauth/token/info with header Authorization: Bearer <suspect token>
```

## Respond: how to revoke it


User revokes the app under Access > Applications > Authorized applications; app owner calls POST /oauth/revoke with client_id, client_secret, token; delete the application to remove all grants and tokens; Renew secret to stop the app from obtaining new tokens. Live access ends on revocation: partial. Deleting the app removes all tokens. Effect of revoking a refresh token on outstanding access tokens is not documented; access tokens expire after 2 hours.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- Stops working when user is removed
- OAuth access/refresh token prefix
- audit event for OAuth token revocation
- whether revoking refresh token kills access tokens
- target_type value for OAuth events
- Whether archive downloads over Git (git clone via OAuth) emit the same repository_download_operation event
- Whether a GitLab.com group owner can block or allowlist third-party OAuth applications that members authorize (no group-level control found).
- Whether a GitLab.com group owner can set a shorter maximum token lifetime than the 365-day default (docs describe this only for administrators/Self-Managed).

## Sources
- [Personal access tokens | GitLab Docs](https://docs.gitlab.com/user/profile/personal_access_tokens/) (retrieved 2026-10-09)
- [OAuth 2.0 identity provider API | GitLab Docs](https://docs.gitlab.com/api/oauth2/) (retrieved 2026-10-09)
- [OpenID Connect (OIDC) Authentication Using ID Tokens | GitLab Docs](https://docs.gitlab.com/ci/secrets/id_token_authentication/) (retrieved 2026-10-09)
- [Group access and permissions | GitLab Docs](https://docs.gitlab.com/user/group/access_and_permissions/) (retrieved 2026-10-09)
- [Configure GitLab as an OAuth 2.0 authentication identity provider | GitLab Docs](https://docs.gitlab.com/integration/oauth_provider/) (retrieved 2026-10-09)
- [SAML SSO for GitLab.com groups](https://docs.gitlab.com/user/group/saml_sso/) (retrieved 2026-10-13)
- [Audit event types](https://docs.gitlab.com/user/compliance/audit_event_types/) (retrieved 2026-10-12)
- [Audit events](https://docs.gitlab.com/user/compliance/audit_events/) (retrieved 2026-10-12)
- [Audit events API](https://docs.gitlab.com/api/audit_events/) (retrieved 2026-10-12)
- [GitLab token overview](https://docs.gitlab.com/security/tokens/) (retrieved 2026-10-12)
- [Log system](https://docs.gitlab.com/administration/logs/) (retrieved 2026-10-12)
- [Projects API](https://docs.gitlab.com/api/projects/) (retrieved 2026-10-12)
- [Repositories API](https://docs.gitlab.com/api/repositories/) (retrieved 2026-10-12)
