# CircleCI: Contexts and project environment variables (stored secrets)

`circleci-4` · API key / token · service. Third-party secrets stored in CircleCI and injected into jobs. The API returns only names or masked values; the realistic way to read them is to run a job that uses them.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /context and GET /context/{context_id}/environment-variable, GET /project/{project-slug}/envvar, and the CircleCI Environment Inspector list variable names (values are masked). | GET /context and GET /context/{context_id}/environment-variable, GET /project/{project-slug}/envvar, and the CircleCI Environment Inspector list variable names (values are masked). |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | The target system enforces network rules. With the IP ranges feature (Performance or Scale), job traffic comes from published CircleCI ranges that the target can allowlist. | Where: In .circleci/config.yml set circleci_ip_ranges: true on the job; allowlist jobs.knownips.circleci.com ranges at the target · Command: dig all.knownips.circleci.com A +short |
| Protect: Expires automatically | Not available | Static until rotated |  |
| Detect: Usage appears in logs | Yes | target | Where: Org > Security > Audit Logs > Request audit logs (CSV); filter action context.secrets.accessed, target = context |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | Not available | Leaked values stay valid until rotated at the issuing system. |  |
| Respond: Stops working when user is removed | N/A | Secrets belong to the context or project. To use a context, the actor running the workflow must be an org member with access to the context. |  |

## Protect: what an admin can configure

### Admin controls
- **Context restrictions (security group, project, expression)** (Limit resources; all plans; default off). Limit which users, projects and pipeline conditions can use a context. Where: Org > Contexts; POST /context/{context_id}/restrictions.

- Network: conditional (checked at api_request). The target system enforces network rules. With the IP ranges feature (Performance or Scale), job traffic comes from published CircleCI ranges that the target can allowlist.
- Lifetime: Static until rotated. Renewal: Rotate at source and update the variable.
- Keyless option: not_applicable. Secrets for external systems.
- Conditions: Security group restrictions only for github-type orgs.

## Detect: what gets logged
- Token prefix: not established

### Logs
- CircleCI audit logs: context and env var change events; context.secrets.accessed.

### Fields that identify the credential
- `target` (audit log): Context or project.

### Lifecycle events
- create: `context.env_var.store` 
- revoke: `context.env_var.delete` 
- use: `context.secrets.accessed` 
- create: `project.env_var.create` 
- revoke: `project.env_var.delete` 

### Correlate on
`context id`, `project`, `actor.id`

### API calls a holder can make, and whether they are logged
- enumeration (bulk): `GET /api/v2/context/{context_id}/environment-variable`. variable names only Logged: unknown. 

### What to look for (analyst guidance)
- Context accessed by a new project or branch
- Masking bypass in step output (base64, reformatting)

## Respond: how to revoke it


Block new work, rotate the secret at its source, update the variable, add context restrictions. Live access ends on revocation: no. Leaked values stay valid until rotated at the issuing system.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Data reads appear in logs
- Any org-admin setting to block, list or revoke members' personal API tokens.
- Any org setting to disable OAuth Dynamic Client Registration tokens.
- Any inbound IP allowlist for the CircleCI API or web app.
- Whether personal API token create/delete or API reads appear in audit logs (not in the published event list).
- Whether an SSO-authorized token stops working when the IdP session ends or the user is removed from the IdP.
- Project API token expiry.

## Sources
- [CircleCI API v2 OpenAPI](https://circleci.com/api/v2/openapi.json) (retrieved 2026-10-14)
- [Analyze pipelines during an incident](https://circleci.com/docs/guides/orchestrate/analyze-pipelines-during-an-incident/) (retrieved 2026-10-14)
- [Restrict your pipeline traffic to specific IP ranges](https://circleci.com/docs/guides/security/ip-ranges/) (retrieved 2026-10-14)
- [Pause or stop pipelines during an incident](https://circleci.com/docs/guides/orchestrate/pause-pipelines-during-an-incident/) (retrieved 2026-10-14)
- [Using contexts](https://circleci.com/docs/guides/security/contexts/) (retrieved 2026-10-14)
- [Audit logs](https://circleci.com/docs/guides/security/audit-logs/) (retrieved 2026-10-14)
