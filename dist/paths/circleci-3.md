# CircleCI: OpenID Connect ID tokens (jobs)

`circleci-3` · Federated identity · service. Each job gets signed OIDC ID tokens in $CIRCLE_OIDC_TOKEN and $CIRCLE_OIDC_TOKEN_V2, issued by https://oidc.circleci.com/org/<org-id>, for exchange with AWS, GCP and others.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Pass secrets to builds from forked pull requests | Pass secrets to builds from forked pull requests: Project settings > Advanced |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | The relying cloud provider enforces network rules. With the IP ranges feature (Performance or Scale), job traffic comes from published CircleCI ranges that the target can allowlist. | Where: In .circleci/config.yml set circleci_ip_ranges: true on the job; allowlist jobs.knownips.circleci.com ranges at the target · Command: dig all.knownips.circleci.com A +short |
| Protect: Expires automatically | Yes | 1 hour | Command: Decode $CIRCLE_OIDC_TOKEN and read the exp claim (iat + 1 hour); fixed, not configurable |
| Detect: Usage appears in logs | Yes | oidc.circleci.com/context-ids, project-id claims | Cloud provider logs: e.g. AWS AssumeRoleWithWebIdentity; CircleCI side shows job events. |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | Partial | Cloud session credentials last per provider settings. | Tighten trust policy; tokens expire within 1 hour. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Context restrictions (security group, project, expression)** (Limit resources; all plans; default off). Limit which users, projects and pipeline conditions can use a context. Where: Org > Contexts; POST /context/{context_id}/restrictions.
- **OIDC trust policy claims** (Limit scope; all plans; default varies). Cloud-side trust policy conditions on CircleCI token claims. Where: Cloud provider IAM trust policy.
- **Pass secrets to builds from forked pull requests** (Disable; all plans; default unknown). OIDC tokens are generated for forked-PR builds only when this project setting is on. Where: Project settings > Advanced.

- Network: conditional (checked at api_request). The relying cloud provider enforces network rules. With the IP ranges feature (Performance or Scale), job traffic comes from published CircleCI ranges that the target can allowlist.
- Lifetime: 1 hour. Renewal: New token per job.
- Keyless option: supported. Outbound federation; the cloud trust policy restricts by claims such as project ID, branch, and context IDs.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- Cloud provider logs: e.g. AWS AssumeRoleWithWebIdentity; CircleCI side shows job events.

### Fields that identify the credential
- `oidc.circleci.com/context-ids, project-id claims` (cloud provider): 

### Lifecycle events
- use: `workflow-job-start` Job that received the token.

### Correlate on
`project-id claim`, `job ID`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Role assumption from projects/branches outside the intended set

## Respond: how to revoke it


Tighten trust policy; tokens expire within 1 hour. Live access ends on revocation: partial. Cloud session credentials last per provider settings.

## No vendor documentation found
- Admin can list all of them
- SSO and MFA rules apply
- Data reads appear in logs
- Stops working when user is removed
- Holder calls the cloud provider, not CircleCI
- Any org-admin setting to block, list or revoke members' personal API tokens.
- Any org setting to disable OAuth Dynamic Client Registration tokens.
- Any inbound IP allowlist for the CircleCI API or web app.
- Whether personal API token create/delete or API reads appear in audit logs (not in the published event list).
- Whether an SSO-authorized token stops working when the IdP session ends or the user is removed from the IdP.
- Project API token expiry.

## Sources
- [Use OpenID Connect tokens in jobs](https://circleci.com/docs/guides/permissions-authentication/openid-connect-tokens/) (retrieved 2026-10-14)
- [Restrict your pipeline traffic to specific IP ranges](https://circleci.com/docs/guides/security/ip-ranges/) (retrieved 2026-10-14)
- [Using contexts](https://circleci.com/docs/guides/security/contexts/) (retrieved 2026-10-14)
