# GitLab.com: CI_JOB_TOKEN

`gitlab-3` · Job token · service. Personal/project/group access tokens, OAuth bearer, CI_JOB_TOKEN and deployment credentials for limited endpoints.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Not available | Docs say Git activity from CI/CD jobs is not SSO-checked. |  |
| Protect: IP restriction | Conditional (requires Premium or Ultimate) | Group IP restriction applies to Git clones by CI/CD jobs, but does not work with GitLab.com hosted runners and does not cover runner job requests. Use self-managed runners with allowlisted IPs. Job-token API coverage is not stated. | Restrict access by IP address: Top-level group > Settings > General > Permissions and group features |
| Protect: Expires automatically | Yes | While the job runs | Where: Fixed: valid only while the job runs; no setting |
| Detect: Usage appears in logs | Yes | author_id, user_id | Job token Authentication log (Settings > CI/CD > Job token permissions): Shows max 100 authentication events · GitLab audit events (group/project/instance): Retained indefinitely. Group/project events need Premium/Ultimate; API date range max 30 days per query. Streaming needs Ultimate. · api_json.log / production_json.log: Self-Managed only. Per-request remote_ip, ua, user_id, username, route/path; correlation_id in production_json.log. |
| Detect: Data reads appear in logs | Yes | repository_download_operation | Where: Project > Secure > Audit events; filter by user and date, look for repository_download_operation · API: GET /projects/:id/audit_events |
| Respond: Revocation ends active access | Yes | Token is invalid once the job is no longer running. Allowlist changes limit cross-project reach. | Where: Project > Build > Pipelines > job > Cancel; limit reach: Settings > CI/CD > Job token permissions > CI/CD job token allowlist · API: POST /projects/:id/jobs/:job_id/cancel |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Restrict access by IP address** (Limit network; Premium or Ultimate; default off). Limits UI and API access to the group to listed CIDRs, including group/project tokens, deploy keys and CI clone operations. Where: Top-level group > Settings > General > Permissions and group features.
- **CI/CD job token allowlist** (Limit resources; all plans; default on). Only jobs from the project itself and allowlisted groups/projects can use a job token against this project. Where: Project > Settings > CI/CD > Job token permissions.
- **Fine-grained permissions for job tokens** (Limit scope; all plans; default off). Limits allowlisted job tokens to a set of REST API endpoints. Where: Project > Settings > CI/CD > Job token permissions (allowlist entry).
- **Allow Git push requests to the repository** (Limit scope; all plans; default off). Off by default; when off job tokens cannot push to the repository. Where: Project > Settings > CI/CD > Job token permissions; projects API.
- **Limit job token scope for public or internal projects (feature visibility)** (Limit resources; all plans; default off). Setting features to 'Only project members' stops non-allowlisted job tokens reading artifacts, registries, releases or the repo. Where: Project > Settings > General > Visibility, project features, permissions.

### Not available (vendor states)
- Group IP restrictions do not cover runner registration or job requests.

- Network: conditional (checked at api_request). Group IP restriction applies to Git clones by CI/CD jobs, but does not work with GitLab.com hosted runners and does not cover runner job requests. Use self-managed runners with allowlisted IPs. Job-token API coverage is not stated.
- Lifetime: While the job runs. Renewal: A new job receives its own job token.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: Group IP controls require Premium/Ultimate. Do not transfer Self-Managed 400-day/configuration options to GitLab.com.

## Detect: what gets logged
- Token prefix: `glcbt-`

### Logs
- Job token Authentication log (Settings > CI/CD > Job token permissions): Shows max 100 authentication events
- GitLab audit events (group/project/instance): Retained indefinitely. Group/project events need Premium/Ultimate; API date range max 30 days per query. Streaming needs Ultimate.
- api_json.log / production_json.log: Self-Managed only. Per-request remote_ip, ua, user_id, username, route/path; correlation_id in production_json.log.

### Fields that identify the credential
- `author_id` (Audit events API): User whose access the token carries (pipeline triggerer)
- `user_id` (api_json.log): Triggering user on API calls

### Lifecycle events
- use: `user_authenticated_using_job_token` Streamed only, not saved to database
- change: `secure_ci_job_token_project_added` Inbound allowlist widened
- change: `secure_ci_job_token_group_added` Group added to allowlist
- change: `secure_ci_job_token_inbound_disabled` Inbound restriction turned off
- change: `secure_ci_job_token_policies_updated` Fine-grained permissions changed
- revoke: `secure_ci_job_token_project_removed` 

### Correlate on
`author_id`, `details.ip_address`, `entity_id`, `entity_path`, `remote_ip`, `ua`, `user_id`, `route`

### API calls a holder can make, and whether they are logged
- recon: `GET /job (JOB-TOKEN header)`. the job generated by this CI_JOB_TOKEN; confirms token validity (valid only while the job runs) Logged: unknown. No documented audit event for this read
- collection (bulk): `GET /projects/:id/repository/archive[.format]`. full repository file archive for accessible projects Logged: yes (`repository_download_operation`). Premium/Ultimate to save to DB; Ultimate to stream
- collection (bulk): `GET job-artifact download endpoints`. job artifacts from accessible projects Logged: unknown (`job_artifact_downloaded`). job_artifact_downloaded is documented but 'Saved to database: No'

### What to look for (analyst guidance)
- job token use from an IP that is not a known runner egress
- job token used after its job finished (should fail)
- secure_ci_job_token_inbound_disabled or allowlist group add shortly before cross-project access
- authentication-log entries from projects not in normal dependency graph
- jobs from forks/MRs touching other projects' APIs

### Sample query (GitLab REST API (project audit events))
Pull 30 days of project events and filter for secure_ci_job_token_* changes

```
GET /api/v4/projects/:id/audit_events?created_after=2026-09-12T00:00:00Z&created_before=2026-10-12T00:00:00Z
```

## Respond: how to revoke it


Cancel the running job; tighten inbound allowlist (remove projects/groups, re-enable inbound scope); restrict fine-grained job token permissions; block the triggering user if their access is abused. Live access ends on revocation: yes. Token is invalid once the job is no longer running. Allowlist changes limit cross-project reach.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- Stops working when user is removed
- job token regex
- fields in the job token Authentication log
- stored audit record for job token use
- token ID field for job tokens
- Whether a download triggered under CI_JOB_TOKEN records the job/pipeline rather than a user actor in audit details
- Whether a GitLab.com group owner can block or allowlist third-party OAuth applications that members authorize (no group-level control found).
- Whether a GitLab.com group owner can set a shorter maximum token lifetime than the 365-day default (docs describe this only for administrators/Self-Managed).

## Sources
- [Personal access tokens | GitLab Docs](https://docs.gitlab.com/user/profile/personal_access_tokens/) (retrieved 2026-10-09)
- [OAuth 2.0 identity provider API | GitLab Docs](https://docs.gitlab.com/api/oauth2/) (retrieved 2026-10-09)
- [OpenID Connect (OIDC) Authentication Using ID Tokens | GitLab Docs](https://docs.gitlab.com/ci/secrets/id_token_authentication/) (retrieved 2026-10-09)
- [Group access and permissions | GitLab Docs](https://docs.gitlab.com/user/group/access_and_permissions/) (retrieved 2026-10-09)
- [SAML SSO for GitLab.com groups](https://docs.gitlab.com/user/group/saml_sso/) (retrieved 2026-10-13)
- [GitLab CI/CD job token](https://docs.gitlab.com/ci/jobs/ci_job_token/) (retrieved 2026-10-12)
- [Audit event types](https://docs.gitlab.com/user/compliance/audit_event_types/) (retrieved 2026-10-12)
- [Audit events](https://docs.gitlab.com/user/compliance/audit_events/) (retrieved 2026-10-12)
- [Audit events API](https://docs.gitlab.com/api/audit_events/) (retrieved 2026-10-12)
- [CI/CD Jobs](https://docs.gitlab.com/ci/jobs/) (retrieved 2026-10-14)
- [Jobs API](https://docs.gitlab.com/api/jobs/) (retrieved 2026-10-12)
- [GitLab token overview](https://docs.gitlab.com/security/tokens/) (retrieved 2026-10-12)
- [Detected secrets](https://docs.gitlab.com/user/application_security/secret_detection/detected_secrets/) (retrieved 2026-10-12)
- [Log system](https://docs.gitlab.com/administration/logs/) (retrieved 2026-10-12)
