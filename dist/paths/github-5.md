# GitHub Enterprise Cloud: Actions GITHUB_TOKEN

`github-5` · Job token · service. Classic/fine-grained PATs, OAuth app tokens, GitHub App installation/user tokens, and Actions GITHUB_TOKEN.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Actions policies (disable GitHub Actions) | Actions policies (disable GitHub Actions): Org settings > Actions > General > Policies; enterprise policy can override |
| Protect: SSO and MFA rules apply | Not available | GITHUB_TOKEN is repository-scoped and marked as not supporting SSO authorization in the credential types table; SSO bulk actions do not affect it. |  |
| Protect: IP restriction | Conditional (requires GitHub Enterprise Cloud) | Allow list explicitly covers the Actions GITHUB_TOKEN. Jobs must run on self-hosted runners or GitHub-hosted larger runners with static IP ranges that are added to the list. | IP allow list: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security |
| Protect: Expires automatically | Yes | Job duration | Where: Not configurable: token expires when the job finishes (max 24 h refresh) |
| Detect: Usage appears in logs | Yes | workflow_run_id, job_workflow_ref, secrets_passed, runner_name, hashed_token | GitHub organization/enterprise audit log: Records token-authenticated actions with hashed_token, programmatic_access_type, token_scopes. 180 days; Git events 7 days and only via REST include=git, streaming or export. IP disclosure is opt-in. · Audit log streaming (enterprise): Needed to keep Git events beyond 7 days; api.request events (enterprise setting, streaming only). · Workflow run logs: Only step stdout; correlate with audit log. |
| Detect: Data reads appear in logs | Conditional | Enterprise Cloud only; GITHUB_TOKEN scoped to the one repo | Where: Enterprise Settings > Audit log > Export Git Events; filter JSON on action git.clone and repo · API: GET /enterprises/{enterprise}/audit-log?phrase=action:git.clone&include=git |
| Respond: Revocation ends active access | Partial | No manual revocation; token dies at job end. Not affected by enterprise bulk credential actions. Rotate any other secrets exposed to the job. | Where: Repo > Actions > workflow > run > Cancel workflow · API: POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel · Command: gh run cancel <run-id> |
| Respond: Stops working when user is removed | N/A | The token belongs to a workflow job and expires when the job ends. |  |

## Protect: what an admin can configure

### Admin controls
- **IP allow list** (Limit network; GitHub Enterprise Cloud; default off). Blocks PATs, OAuth app tokens, SSH/deploy keys, GitHub App tokens and GITHUB_TOKEN from non-allowed IPs (not user-installed apps' installation tokens). Where: Org settings > Authentication security > IP allow list; Enterprise settings > Authentication security.
- **Workflow permissions (default GITHUB_TOKEN permissions)** (Limit scope; all plans; default varies). Sets the default GITHUB_TOKEN to read-only contents/packages or read/write; workflows can still change it via the permissions key. Where: Org/Enterprise settings > Actions > General > Workflow permissions.
- **Allow GitHub Actions to create and approve pull requests** (Limit scope; all plans; default off). When off, GITHUB_TOKEN cannot create or approve pull requests. Where: Org/Enterprise settings > Actions > General > Workflow permissions.
- **Send write tokens to workflows from pull requests (fork PRs)** (Limit scope; all plans; default off). Controls whether fork pull-request workflows get a write GITHUB_TOKEN; otherwise it is read-only. Where: Org/Enterprise settings > Actions > General > Fork pull request workflows.
- **Actions policies (disable GitHub Actions)** (Disable; all plans; default off). Disabling Actions for all or selected repositories prevents workflows (and their GITHUB_TOKEN) from running. Where: Org settings > Actions > General > Policies; enterprise policy can override.

### Not available (vendor states)
- Admins cannot stop repo writers from raising GITHUB_TOKEN permissions in the workflow file above the default.

- Network: conditional (checked at api_request). Allow list explicitly covers the Actions GITHUB_TOKEN. Jobs must run on self-hosted runners or GitHub-hosted larger runners with static IP ranges that are added to the list.
- Lifetime: Job duration. Renewal: The platform supplies a token for the workflow job.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: Enterprise Cloud feature scope. Fine-grained PATs, classic PATs and GitHub Apps have different approval/revocation rules.

## Detect: what gets logged
- Token prefix: `ghs_`

### Logs
- GitHub organization/enterprise audit log: Records token-authenticated actions with hashed_token, programmatic_access_type, token_scopes. 180 days; Git events 7 days and only via REST include=git, streaming or export. IP disclosure is opt-in.
- Audit log streaming (enterprise): Needed to keep Git events beyond 7 days; api.request events (enterprise setting, streaming only).
- Workflow run logs: Only step stdout; correlate with audit log.

### Fields that identify the credential
- `workflow_run_id` (audit log (workflows.*)): Run that received the token
- `job_workflow_ref` (audit log (workflows.prepared_workflow_job)): Workflow file/ref
- `secrets_passed` (audit log (workflows.prepared_workflow_job)): Secrets provided to the job
- `runner_name` (audit log): Runner that held the token
- `hashed_token` (audit log): Common field; GITHUB_TOKEN-specific use not documented

### Lifecycle events
- create: `workflows.prepared_workflow_job` Job start; token minted; streaming/export/REST only
- revoke: `workflows.completed_workflow_run` Run done; token expires at job end
- revoke: `workflows.cancel_workflow_run` Cancel run
- change: `org.set_default_workflow_permissions` Default token permissions changed (org)
- change: `repo.set_default_workflow_permissions` Default token permissions changed (repo)
- change: `repo.set_workflow_permission_can_approve_pr` Token may approve PRs

### Correlate on
`actor`, `workflow_run_id`, `job_workflow_ref`, `runner_name`, `runner_labels`, `is_hosted_runner`, `repo`, `created_at`

### API calls a holder can make, and whether they are logged
- recon: `GET /rate_limit`. remaining quota; confirms token is live (installation token tied to the workflow repo) Logged: unknown. Reads not in standard audit log
- collection (bulk): `GET /repos/{owner}/{repo}/tarball/{ref}`. archive of the workflow's own repository (token limited to that repo) Logged: unknown (`repo.download_zip (candidate)`). API emission not stated
- collection (bulk): `git clone of the workflow repo with GITHUB_TOKEN`. full history of the workflow's repository Logged: plan (`git.clone`). Enterprise Cloud only; GITHUB_TOKEN scoped to the one repo

### Public detection rules (community, not vendor documentation)
- [GitHub Workflow Permissions Modified](https://github.com/panther-labs/panther-analysis/blob/develop/rules/github_rules/github_workflow_permission_modified.yml) (Panther): Changes to the organization default GITHUB_TOKEN workflow permissions.
- [GitHub Workflow Dispatched by GitHub Actions Bot](https://github.com/panther-labs/panther-analysis/blob/develop/rules/github_rules/github_workflow_dispatch_by_github_bot.yml) (Panther): github-actions[bot] using a server-to-server token (GITHUB_TOKEN) to start a workflow via workflow_dispatch, a sign of a stolen GITHUB_TOKEN being replayed.

### What to look for (analyst guidance)
- workflow runs from unfamiliar actors or new branches
- default_workflow_permissions switched to write before a suspicious run
- job on a newly registered self-hosted runner (org.register_self_hosted_runner)
- workflow file changes in .github/workflows followed by runs passing extra secrets_passed

### Sample query (GitHub audit log REST (phrase))
List jobs (and secrets passed) in the incident window.

```
GET /orgs/octo-org/audit-log?phrase=action:workflows.prepared_workflow_job+repo:octo-org/app+created:>=2026-09-01
```

## Respond: how to revoke it


Cancel in-progress runs; disable Actions for repo/org; remove self-hosted runners; set default workflow permissions to read. Live access ends on revocation: partial. No manual revocation; token dies at job end. Not affected by enterprise bulk credential actions. Rotate any other secrets exposed to the job.

## No vendor documentation found
- Admin can list all of them
- actor/programmatic_access_type recorded for GITHUB_TOKEN API calls
- whether GITHUB_TOKEN hashed_token appears in audit events
- per-job token id field
- GITHUB_TOKEN is scoped to the workflow repo, so cross-repo discovery is not possible
- Whether reads appear in api.request streaming events
- Whether admins can set a maximum lifetime for GitHub App user access tokens or OAuth app tokens (only app-developer settings found).
- Whether GITHUB_TOKEN workflow permission defaults can be made non-overridable.

## Sources
- [GitHub credential types reference](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/github-credential-types) (retrieved 2026-10-09)
- [Configuring OpenID Connect in cloud providers - GitHub Docs](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-cloud-providers) (retrieved 2026-10-09)
- [Managing allowed IP addresses for your organization - GitHub Docs](https://docs.github.com/en/enterprise-cloud%40latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) (retrieved 2026-10-09)
- [Enforcing policies for personal access tokens in your enterprise](https://docs.github.com/en/enterprise-cloud%40latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise) (retrieved 2026-10-09)
- [Managing allowed IP addresses for your organization - GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) (retrieved 2026-10-09)
- [GitHub credential types reference](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/github-credential-types) (retrieved 2026-10-14)
- [GITHUB_TOKEN](https://docs.github.com/en/enterprise-cloud@latest/actions/concepts/security/github_token) (retrieved 2026-10-14)
- [Exporting audit log activity for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/exporting-audit-log-activity-for-your-enterprise) (retrieved 2026-10-14)
- [Using the audit log API for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/using-the-audit-log-api-for-your-enterprise) (retrieved 2026-10-12)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise) (retrieved 2026-10-12)
- [Identifying audit log events performed by an access token](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/identifying-audit-log-events-performed-by-an-access-token) (retrieved 2026-10-12)
- [Canceling a workflow run](https://docs.github.com/en/enterprise-cloud@latest/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/canceling-a-workflow) (retrieved 2026-10-14)
- [Cancel a workflow run](https://docs.github.com/en/enterprise-cloud@latest/rest/actions/workflow-runs#cancel-a-workflow-run) (retrieved 2026-10-14)
- [gh run cancel](https://cli.github.com/manual/gh_run_cancel) (retrieved 2026-10-14)
- [GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token) (retrieved 2026-10-12)
- [Audit log events for your organization](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/audit-log-events-for-your-organization) (retrieved 2026-10-12)
- [Common security incident investigation areas](https://docs.github.com/en/code-security/reference/security-incident-response/investigation-areas) (retrieved 2026-10-12)
- [Responding to a security incident](https://docs.github.com/en/code-security/tutorials/secure-your-organization/respond-to-a-security-incident) (retrieved 2026-10-12)
- [Audit log for an enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/about-the-audit-log-for-your-enterprise) (retrieved 2026-10-12)
- [Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) (retrieved 2026-10-12)
- [Disabling or limiting GitHub Actions for your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization) (retrieved 2026-10-13)
- [Enforcing policies for GitHub Actions in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise) (retrieved 2026-10-13)
