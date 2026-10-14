# GitLab.com: Personal / project / group token

`gitlab-1` · Personal access token · person or service. Personal/project/group access tokens, OAuth bearer, CI_JOB_TOKEN and deployment credentials for limited endpoints.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Group > Secure > Credentials lists PATs of enterprise users plus group/project tokens and service accounts only (Ultimate). | Group > Secure > Credentials lists PATs of enterprise users plus group/project tokens and service accounts only (Ultimate). |
| Protect: Admin can block or require approval | Yes | Require fine-grained personal access tokens after a specific date; Disable personal access tokens (enterprise users); Users can create group access tokens and project access tokens in this group | Require fine-grained personal access tokens after a specific date: Top-level group > Settings > General > Permissions and group features · Disable personal access tokens (enterprise users): Group > Settings > General > Permissions and group features > Enterprise users · Users can create group access tokens and project access tokens in this group: Top-level group > Settings > General > Permissions and group features |
| Protect: SSO and MFA rules apply | Partial | SAML SSO enforcement does not cover API requests, except Git-related endpoints when the Git/Dependency Proxy option is on; project and group access tokens are never SSO-checked. | Where: Group > Settings > SAML SSO > Configuration: Disable password and passkey authentication for enterprise users; Enforce SSO-only authentication for Git and Dependency Proxy activity for this group > Save changes |
| Protect: IP restriction | Conditional (requires Premium or Ultimate) | Group restriction covers UI/API/Git, including service-account and project/group tokens. Runner coordination and other documented exceptions remain. | Restrict access by IP address: Top-level group > Settings > General > Permissions and group features |
| Protect: Expires automatically | Partial | Normally ≤365 days; service-account exceptions | Where: User avatar > Edit profile > Access > Personal access tokens > Expiration date (default and max 365 days); service accounts: Group > Settings > General > Permissions and group features > Require expiration dates for service accounts; view expiry: Group > Secure > Credentials · API: GET /personal_access_tokens/:id (expires_at); GET /groups/:id/access_tokens |
| Detect: Usage appears in logs | Yes | id, user_id, last_used_ips, previous_personal_access_token_id, author_id | Where: Group > Secure > Credentials (usage patterns, enterprise users); user: Access > Personal access tokens > token details panel · API: GET /personal_access_tokens?user_id=<id> (last_used_at, last_used_ips) |
| Detect: Data reads appear in logs | Yes | repository_download_operation | Where: Project > Secure > Audit events; filter by user and date, look for repository_download_operation · API: GET /projects/:id/audit_events |
| Respond: Revocation ends active access | Yes | Revocation is immediate. Rotation revokes the old token at once. Rotating a revoked token revokes the whole token family. Blocking/deleting an enterprise user auto-revokes their PATs. | DELETE /personal_access_tokens/:id (or self); DELETE /projects/:id/access_tokens/:token_id or groups equivalent; or revoke in UI. Admins can revoke any user's PAT; Self-Managed admins can identify a leaked value via POST /admin/token. |
| Respond: Stops working when user is removed | Partial | Deleting or blocking an enterprise user revokes their PATs; project/group tokens are not tied to a user; non-enterprise users not covered. | API: DELETE /groups/:id/enterprise_users/:user_id (deleting or blocking an enterprise user revokes their PATs) |

## Protect: what an admin can configure

### Admin controls
- **Require fine-grained personal access tokens after a specific date** (Disable; all plans; default off). After the date, legacy PATs cannot access the top-level group, subgroups or projects; group/project/service-account tokens are exempt. Where: Top-level group > Settings > General > Permissions and group features.
- **Disable personal access tokens (enterprise users)** (Disable; Premium or Ultimate; default off). Stops the group's enterprise users from creating PATs and disables their existing PATs; service account PATs unaffected. Where: Group > Settings > General > Permissions and group features > Enterprise users.
- **Users can create group access tokens and project access tokens in this group** (Disable; Premium or Ultimate; default on). Clearing it blocks new group/project access tokens across the group; existing ones stay valid. Where: Top-level group > Settings > General > Permissions and group features.
- **Restrict access by IP address** (Limit network; Premium or Ultimate; default off). Limits UI and API access to the group to listed CIDRs, including group/project tokens, deploy keys and CI clone operations. Where: Top-level group > Settings > General > Permissions and group features.
- **Enforce SSO-only authentication for Git and Dependency Proxy activity** (Require SSO; Premium or Ultimate; default off). Git over HTTPS/SSH and Git-related API calls by users need an active SSO session; not enforced for bot tokens or CI jobs. Where: Group > Settings > SAML SSO.
- **Credentials inventory (revoke tokens)** (Other; Ultimate; default unknown). Top-level group owners view and revoke enterprise users' PATs and group/project access tokens. Where: Group > Secure > Credentials inventory.

### Not available (vendor states)
- Web SSO enforcement does not cover project/group access tokens, service accounts or deploy keys.

- Network: conditional (checked at api_request). Group restriction covers UI/API/Git, including service-account and project/group tokens. Runner coordination and other documented exceptions remain.
- Lifetime: Normally ≤365 days; service-account exceptions. Renewal: No refresh token. Rotate the token (new token, same scopes; the old one becomes inactive immediately) or create a new one before expiry.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: Group IP controls require Premium/Ultimate. Do not transfer Self-Managed 400-day/configuration options to GitLab.com.

## Detect: what gets logged
- Token prefix: `glpat-`

### Logs
- GitLab audit events (group/project/instance): Retained indefinitely. Group/project events need Premium/Ultimate; API date range max 30 days per query. Streaming needs Ultimate.
- Token API usage fields (last_used_at, last_used_ips): Last five distinct IPs per token; usage time updates every 10 min, IPs every minute.
- api_json.log / production_json.log: Self-Managed only. Per-request remote_ip, ua, user_id, username, route/path; correlation_id in production_json.log.
- Secret detection automatic response: Leaked PATs in public or Ultimate projects are revoked and owner emailed; no audit record documented.

### Fields that identify the credential
- `id` (Personal/project/group access tokens API): Token ID; use for revoke/rotate
- `user_id` (Personal/project access tokens API): Owner, or the project/group bot user for project/group tokens
- `last_used_ips` (Personal/project access tokens API): Up to five most recent distinct IPs
- `previous_personal_access_token_id` (Token information API (admin)): Links rotated token to predecessor
- `author_id` (Audit events API): User or bot that acted

### Lifecycle events
- create: `personal_access_token_created` 
- create: `project_access_token_created` 
- create: `group_access_token_created` 
- use: `personal_access_token_used_from_unseen_ip` First use from new IP
- use: `api_request_access_with_scope` Only a subset of API requests with an audited scope
- use: `issue_created_by_project_bot` Example bot-activity event for project tokens
- revoke: `personal_access_token_revoked` 
- revoke: `project_access_token_deleted` 
- revoke: `group_access_token_deleted` 
- auth_fail: `project_access_token_creation_failed` Creation failure, not auth failure

### Correlate on
`author_id`, `details.author_name`, `details.ip_address`, `entity_id`, `entity_type`, `details.target_id`, `last_used_ips`, `user_id`, `remote_ip`, `ua`, `correlation_id`

### API calls a holder can make, and whether they are logged
- recon: `GET /personal_access_tokens/self`. scopes, expires_at, active, last_used_at, last_used_ips for the calling token Logged: unknown. No documented audit event for token self-introspection
- discovery: `GET /personal_access_tokens/self/associations`. groups and projects the calling token can access Logged: unknown. No documented read event
- enumeration: `GET /projects?membership=true`. projects the token's user is a member of Logged: unknown. Audit event list documents no read/listing events
- collection (bulk): `GET /projects/:id/repository/archive[.format]`. full repository file archive (tar/zip) Logged: yes (`repository_download_operation`). Premium/Ultimate to save to DB; Ultimate to stream. public projects: public_repository_download_operation (not saved to DB)

### What to look for (analyst guidance)
- personal_access_token_used_from_unseen_ip for a token normally used only from CI runners
- project/group bot user acting on projects outside its usual set
- token created then used within minutes from a different IP than the creator session
- rotate attempted on an already revoked token (family-wide revocation fired)
- PAT with api scope and no expiry created shortly before mass clone/archive activity
- use after the owning enterprise user was blocked or deleted

### Sample query (GitLab REST API (personal access tokens list))
List active tokens used recently, then review last_used_ips per token

```
GET /api/v4/personal_access_tokens?state=active&last_used_after=2026-10-01T00:00:00Z&sort=last_used_desc
```

## Respond: how to revoke it


DELETE /personal_access_tokens/:id (or self); DELETE /projects/:id/access_tokens/:token_id or groups equivalent; or revoke in UI. Admins can revoke any user's PAT; Self-Managed admins can identify a leaked value via POST /admin/token. Live access ends on revocation: yes. Revocation is immediate. Rotation revokes the old token at once. Rotating a revoked token revokes the whole token family. Blocking/deleting an enterprise user auto-revokes their PATs.

## No vendor documentation found
- audit event for PAT rotation or expiry
- whether audit event details carry the token ID
- routable token regex
- failed-auth event for invalid/revoked token
- Whether project/group access tokens can use the /self introspection endpoints (docs cover only personal access tokens)
- Whether a GitLab.com group owner can block or allowlist third-party OAuth applications that members authorize (no group-level control found).
- Whether a GitLab.com group owner can set a shorter maximum token lifetime than the 365-day default (docs describe this only for administrators/Self-Managed).

## Sources
- [Personal access tokens | GitLab Docs](https://docs.gitlab.com/user/profile/personal_access_tokens/) (retrieved 2026-10-09)
- [OAuth 2.0 identity provider API | GitLab Docs](https://docs.gitlab.com/api/oauth2/) (retrieved 2026-10-09)
- [OpenID Connect (OIDC) Authentication Using ID Tokens | GitLab Docs](https://docs.gitlab.com/ci/secrets/id_token_authentication/) (retrieved 2026-10-09)
- [Group access and permissions | GitLab Docs](https://docs.gitlab.com/user/group/access_and_permissions/) (retrieved 2026-10-09)
- [SAML SSO for GitLab.com groups](https://docs.gitlab.com/user/group/saml_sso/) (retrieved 2026-10-13)
- [Credentials inventory](https://docs.gitlab.com/user/group/credentials_inventory/) (retrieved 2026-10-13)
- [Personal access tokens API](https://docs.gitlab.com/api/personal_access_tokens/) (retrieved 2026-10-12)
- [Group access tokens API](https://docs.gitlab.com/api/group_access_tokens/) (retrieved 2026-10-14)
- [Audit event types](https://docs.gitlab.com/user/compliance/audit_event_types/) (retrieved 2026-10-12)
- [Audit events](https://docs.gitlab.com/user/compliance/audit_events/) (retrieved 2026-10-12)
- [Audit events API](https://docs.gitlab.com/api/audit_events/) (retrieved 2026-10-12)
- [Group enterprise users API](https://docs.gitlab.com/api/group_enterprise_users/) (retrieved 2026-10-14)
- [GitLab token overview](https://docs.gitlab.com/security/tokens/) (retrieved 2026-10-12)
- [Project access tokens API](https://docs.gitlab.com/api/project_access_tokens/) (retrieved 2026-10-12)
- [Token information API](https://docs.gitlab.com/api/admin/token/) (retrieved 2026-10-12)
- [Automatic response to leaked secrets](https://docs.gitlab.com/user/application_security/secret_detection/automatic_response/) (retrieved 2026-10-12)
- [Customize pipeline secret detection](https://docs.gitlab.com/user/application_security/secret_detection/pipeline/configure/) (retrieved 2026-10-12)
- [Log system](https://docs.gitlab.com/administration/logs/) (retrieved 2026-10-12)
- [Projects API](https://docs.gitlab.com/api/projects/) (retrieved 2026-10-12)
- [Repositories API](https://docs.gitlab.com/api/repositories/) (retrieved 2026-10-12)
- [Fine-grained personal access tokens](https://docs.gitlab.com/auth/tokens/fine_grained_access_tokens/) (retrieved 2026-10-12)
- [Group access tokens](https://docs.gitlab.com/user/group/settings/group_access_tokens/) (retrieved 2026-10-13)
