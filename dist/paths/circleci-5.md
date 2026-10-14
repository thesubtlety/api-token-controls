# CircleCI: Checkout keys (deploy keys and user keys) and additional SSH keys

`circleci-5` · API key / token · service. SSH private keys held by CircleCI: deploy/user keys for checking out code from the VCS, and additional keys for deploying to other hosts.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Per project only: GET /project/{project-slug}/checkout-key lists checkout keys, and Project Settings > SSH Keys shows all keys. | Per project only: GET /project/{project-slug}/checkout-key lists checkout keys, and Project Settings > SSH Keys shows all keys. |
| Protect: Admin can block or require approval | Yes | GitHub organization deploy key restriction | GitHub organization deploy key restriction: GitHub organization settings |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | The VCS or target host enforces network rules. With the IP ranges feature (Performance or Scale), job traffic comes from published CircleCI ranges that the target can allowlist. | Where: In .circleci/config.yml set circleci_ip_ranges: true on the job; allowlist jobs.knownips.circleci.com ranges at the VCS/target host · Command: dig all.knownips.circleci.com A +short |
| Protect: Expires automatically | Not available | No expiry documented |  |
| Detect: Usage appears in logs | Yes | fingerprint | Where: Org > Security > Audit Logs > Request audit logs (CSV); filter actions checkout-key.* and project.ssh_key.* (records key changes) |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | Partial | Key works at the VCS until its public key is removed there. | Delete key in CircleCI and the public key at GitHub/Bitbucket/GitLab. |
| Respond: Stops working when user is removed | Partial | Deploy keys are not tied to a user. User keys stay until rotated, unless the user revokes the GitHub OAuth integration that created them, which removes them. | Where: Project Settings > SSH Keys > user key > X; then delete the CircleCI key in GitHub user settings · API: DELETE /api/v2/project/{project-slug}/checkout-key/{fingerprint} |

## Protect: what an admin can configure

### Admin controls
- **GitHub organization deploy key restriction** (Disable; all plans; default unknown). A GitHub org owner can restrict or disable deploy keys across repos, which can disable or remove CircleCI deploy keys. This is a GitHub setting. Where: GitHub organization settings.

- Network: conditional (checked at api_request). The VCS or target host enforces network rules. With the IP ranges feature (Performance or Scale), job traffic comes from published CircleCI ranges that the target can allowlist.
- Lifetime: No expiry documented. Renewal: Rotate by deleting and re-adding the key pair.
- Keyless option: not_applicable. SSH keys.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- CircleCI audit logs: 

### Fields that identify the credential
- `fingerprint` (checkout-key API): 

### Lifecycle events
- create: `checkout-key.create` 
- revoke: `checkout-key.delete` 
- create: `project.ssh_key.create` 
- revoke: `project.ssh_key.delete` 

### Correlate on
`fingerprint`, `project`

### API calls a holder can make, and whether they are logged
- enumeration: `GET /api/v2/project/{project-slug}/checkout-key`. checkout key fingerprints and public keys Logged: unknown. 

### What to look for (analyst guidance)
- User keys added (act with a user's VCS access)

## Respond: how to revoke it
- Admin: **Rotate/delete checkout or SSH key**. Delete the key in CircleCI and its public key at the VCS. Where: Project Settings > SSH Keys; DELETE /project/{project-slug}/checkout-key/{fingerprint}.

Delete key in CircleCI and the public key at GitHub/Bitbucket/GitLab. Live access ends on revocation: partial. Key works at the VCS until its public key is removed there.

## No vendor documentation found
- SSO and MFA rules apply
- Data reads appear in logs
- Any org-admin setting to block, list or revoke members' personal API tokens.
- Any org setting to disable OAuth Dynamic Client Registration tokens.
- Any inbound IP allowlist for the CircleCI API or web app.
- Whether personal API token create/delete or API reads appear in audit logs (not in the published event list).
- Whether an SSO-authorized token stops working when the IdP session ends or the user is removed from the IdP.
- Project API token expiry.

## Sources
- [Add additional SSH keys to CircleCI](https://circleci.com/docs/guides/integration/add-ssh-key/) (retrieved 2026-10-14)
- [Analyze pipelines during an incident](https://circleci.com/docs/guides/orchestrate/analyze-pipelines-during-an-incident/) (retrieved 2026-10-14)
- [Restrict your pipeline traffic to specific IP ranges](https://circleci.com/docs/guides/security/ip-ranges/) (retrieved 2026-10-14)
- [Rotate project SSH keys](https://circleci.com/docs/guides/security/rotate-project-ssh-keys/) (retrieved 2026-10-14)
- [CircleCI API v2 OpenAPI](https://circleci.com/api/v2/openapi.json) (retrieved 2026-10-14)
- [Users, organizations, and integrations guide](https://circleci.com/docs/guides/permissions-authentication/users-organizations-and-integrations-guide/) (retrieved 2026-10-14)
- [Audit logs](https://circleci.com/docs/guides/security/audit-logs/) (retrieved 2026-10-14)
