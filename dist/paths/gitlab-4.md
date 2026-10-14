# GitLab.com: Fine-grained personal access token

`gitlab-4` · Personal access token · person. A personal access token limited to selected resources (groups/projects, user, global) and specific permissions. It is sent like other PATs, for example in the PRIVATE-TOKEN header.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Credentials inventory lists PATs of enterprise users only on GitLab.com (Ultimate). | Where: Group > Secure > Credentials |
| Protect: Admin can block or require approval | Yes | Require fine-grained personal access tokens after a specific date; Disable personal access tokens (enterprise users) | Require fine-grained personal access tokens after a specific date: Top-level group > Settings > General > Permissions and group features · Disable personal access tokens (enterprise users): Group > Settings > General > Permissions and group features > Enterprise users |
| Protect: SSO and MFA rules apply | Partial | Same as PATs: API not SSO-checked except Git-related endpoints under the Git/Dependency Proxy option. | Where: Group > Settings > SAML SSO > Disable password and passkey authentication for enterprise users; Enforce SSO-only authentication for Git and Dependency Proxy activity for this group |
| Protect: IP restriction | Conditional (requires Premium or Ultimate) | Top-level group IP restriction (Premium/Ultimate) covers the UI and API for that group's resources. The page does not name personal access tokens explicitly; runner job requests and other listed exceptions are excluded. | Restrict access by IP address: Top-level group > Settings > General > Permissions and group features |
| Protect: Expires automatically | Yes | Default 365 days; ≤365 days unless admin changes the maximum | Where: User avatar > Edit profile > Access > Personal access tokens > Generate token > Fine-grained token > Expiration date; view: Group > Secure > Credentials · API: GET /personal_access_tokens/:id (expires_at) |
| Detect: Usage appears in logs | Yes | id, granular_scopes, last_used_ips, user_id | Where: Group > Secure > Credentials (usage patterns); user: Access > Personal access tokens > token details panel · API: GET /personal_access_tokens?user_id=<id> (last_used_at, last_used_ips, granular_scopes) |
| Detect: Data reads appear in logs | Yes | repository_download_operation | Where: Project > Secure > Audit events; filter by user and date, look for repository_download_operation · API: GET /projects/:id/audit_events |
| Respond: Revocation ends active access | Yes | Revocation is immediate; rotation revokes the previous token. | DELETE /personal_access_tokens/:id or revoke in UI; admins can revoke any user's token. |
| Respond: Stops working when user is removed | Partial | Enterprise users' PATs are revoked when the account is deleted or blocked; other users not covered. | API: DELETE /groups/:id/enterprise_users/:user_id (deleting or blocking an enterprise user revokes their PATs) |

## Protect: what an admin can configure

### Admin controls
- **Require fine-grained personal access tokens after a specific date** (Disable; all plans; default off). After the date, legacy PATs cannot access the top-level group, subgroups or projects; group/project/service-account tokens are exempt. Where: Top-level group > Settings > General > Permissions and group features.
- **Disable personal access tokens (enterprise users)** (Disable; Premium or Ultimate; default off). Stops the group's enterprise users from creating PATs and disables their existing PATs; service account PATs unaffected. Where: Group > Settings > General > Permissions and group features > Enterprise users.
- **Restrict access by IP address** (Limit network; Premium or Ultimate; default off). Limits UI and API access to the group to listed CIDRs, including group/project tokens, deploy keys and CI clone operations. Where: Top-level group > Settings > General > Permissions and group features.
- **Enforce SSO-only authentication for Git and Dependency Proxy activity** (Require SSO; Premium or Ultimate; default off). Git over HTTPS/SSH and Git-related API calls by users need an active SSO session; not enforced for bot tokens or CI jobs. Where: Group > Settings > SAML SSO.
- **Credentials inventory (revoke tokens)** (Other; Ultimate; default unknown). Top-level group owners view and revoke enterprise users' PATs and group/project access tokens. Where: Group > Secure > Credentials inventory.

### Not available (vendor states)
- Fine-grained token enforcement does not cover service account, group or project access tokens.

- Network: conditional (checked at api_request). Top-level group IP restriction (Premium/Ultimate) covers the UI and API for that group's resources. The page does not name personal access tokens explicitly; runner job requests and other listed exceptions are excluded.
- Lifetime: Default 365 days; ≤365 days unless admin changes the maximum. Renewal: No refresh token. The user rotates the token (new token, old one becomes inactive immediately) or creates a new one before expiry.
- Keyless option: not_applicable. This is a static user-created token. Evaluate a separate federation path where listed.
- Conditions: Beta in 18.10, GA in 19.2 (all tiers). Full REST coverage; GraphQL covers the most common types and mutations. Enforcement does not apply to service account, group or project access tokens, and existing legacy PATs keep working until they expire.

## Detect: what gets logged
- Token prefix: `glpat-`

### Logs
- GitLab audit events (group/project/instance): Retained indefinitely. Group/project events need Premium/Ultimate; API date range max 30 days per query. Streaming needs Ultimate.
- Token API usage fields (last_used_at, last_used_ips): Last five distinct IPs per token; usage time updates every 10 min, IPs every minute.
- api_json.log / production_json.log: Self-Managed only. Per-request remote_ip, ua, user_id, username, route/path; correlation_id in production_json.log.

### Fields that identify the credential
- `id` (Personal access tokens API): Token ID
- `granular_scopes` (Personal access tokens API): Present only for fine-grained tokens; identifies the type
- `last_used_ips` (Personal access tokens API): Last five distinct IPs
- `user_id` (Personal access tokens API): Owner

### Lifecycle events
- create: `personal_access_token_created` 
- use: `personal_access_token_used_from_unseen_ip` 
- change: `personal_access_token_settings_updated` Namespace fine-grained PAT settings changed
- revoke: `personal_access_token_revoked` 

### Correlate on
`author_id`, `details.ip_address`, `user_id`, `last_used_ips`, `remote_ip`, `ua`, `route`

### API calls a holder can make, and whether they are logged
- recon: `GET /personal_access_tokens/self`. scopes, granular_scopes, expires_at, active for the calling fine-grained token Logged: unknown. No documented audit event for self-introspection
- discovery: `GET /personal_access_tokens/self/associations`. groups and projects the token can access (reflects its selected resources) Logged: unknown. No documented read event
- collection (bulk): `GET /projects/:id/repository/archive[.format]`. full repository file archive within the token's selected resources Logged: yes (`repository_download_operation`). Premium/Ultimate to save to DB; Ultimate to stream

### What to look for (analyst guidance)
- token with granular_scopes used from an unseen IP
- fine-grained token with sudo capability created by an admin outside change window
- personal_access_token_settings_updated relaxing enforcement before legacy-token activity
- token used against projects outside its granted boundary (should 403; repeated 403s = probing)
- instance on a version affected by the 19.x scope-bypass fix

### Sample query (GitLab REST API (personal access tokens list))
List new tokens; check granular_scopes and last_used_ips

```
GET /api/v4/personal_access_tokens?state=active&created_after=2026-10-01T00:00:00Z
```

## Respond: how to revoke it


DELETE /personal_access_tokens/:id or revoke in UI; admins can revoke any user's token. Live access ends on revocation: yes. Revocation is immediate; rotation revokes the previous token.

## No vendor documentation found
- distinct prefix or format for fine-grained tokens
- audit event distinguishing fine-grained token creation
- Whether audit event details record which token (fine-grained vs classic) performed the download
- Whether a GitLab.com group owner can block or allowlist third-party OAuth applications that members authorize (no group-level control found).
- Whether a GitLab.com group owner can set a shorter maximum token lifetime than the 365-day default (docs describe this only for administrators/Self-Managed).

## Sources
- [Fine-grained personal access tokens](https://docs.gitlab.com/auth/tokens/fine_grained_access_tokens/) (retrieved 2026-10-12)
- [Personal access tokens | GitLab Docs](https://docs.gitlab.com/user/profile/personal_access_tokens/) (retrieved 2026-10-09)
- [Group access and permissions | GitLab Docs](https://docs.gitlab.com/user/group/access_and_permissions/) (retrieved 2026-10-09)
- [GitLab 19.2 release notes](https://docs.gitlab.com/releases/19/gitlab-19-2-released/) (retrieved 2026-10-12)
- [SAML SSO for GitLab.com groups](https://docs.gitlab.com/user/group/saml_sso/) (retrieved 2026-10-13)
- [Credentials inventory](https://docs.gitlab.com/user/group/credentials_inventory/) (retrieved 2026-10-13)
- [Personal access tokens API](https://docs.gitlab.com/api/personal_access_tokens/) (retrieved 2026-10-12)
- [Audit event types](https://docs.gitlab.com/user/compliance/audit_event_types/) (retrieved 2026-10-12)
- [Audit events](https://docs.gitlab.com/user/compliance/audit_events/) (retrieved 2026-10-12)
- [Audit events API](https://docs.gitlab.com/api/audit_events/) (retrieved 2026-10-12)
- [Group enterprise users API](https://docs.gitlab.com/api/group_enterprise_users/) (retrieved 2026-10-14)
- [GitLab token overview](https://docs.gitlab.com/security/tokens/) (retrieved 2026-10-12)
- [Customize pipeline secret detection](https://docs.gitlab.com/user/application_security/secret_detection/pipeline/configure/) (retrieved 2026-10-12)
- [Log system](https://docs.gitlab.com/administration/logs/) (retrieved 2026-10-12)
- [Repositories API](https://docs.gitlab.com/api/repositories/) (retrieved 2026-10-12)
