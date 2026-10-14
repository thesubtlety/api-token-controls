# Bitbucket Cloud: Bitbucket Pipelines OpenID Connect (OIDC) tokens

`bitbucket-6` · Federated identity · service. A Pipelines step with oidc enabled gets a signed OIDC token in BITBUCKET_STEP_OIDC_TOKEN, which it exchanges with AWS, GCP or Vault for cloud credentials.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Pipelines oidc option | Command: bitbucket-pipelines.yml: set oidc: false on the step |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Restriction to Bitbucket Pipelines IP ranges is configured in the resource server's trust policy (AWS, GCP, Vault); Bitbucket itself has no setting. | Where: AWS IAM > role > Trust relationships: add a source-IP condition listing Bitbucket Pipelines IP ranges |
| Protect: Expires automatically | No docs found | Per-step token; lifetime not documented |  |
| Detect: Usage appears in logs | Yes | token claims (repository, deployment environment) | Cloud provider logs (e.g. AWS CloudTrail AssumeRoleWithWebIdentity): Use is visible at the resource server, not Bitbucket. |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | Partial | Already-issued cloud credentials last until their own expiry. | Tighten or delete the trust policy at the resource server; set oidc false. |
| Respond: Stops working when user is removed | N/A | Issued by Bitbucket Pipelines to a pipeline step for use at a resource server, not tied to a user's account. |  |

## Protect: what an admin can configure

### Admin controls
- **Pipelines oidc option** (Disable; all plans; default unknown). Set oidc to false in bitbucket-pipelines.yml to stop issuing the step OIDC token. Where: bitbucket-pipelines.yml step/global oidc.

- Network: conditional (checked at token_issuance). Restriction to Bitbucket Pipelines IP ranges is configured in the resource server's trust policy (AWS, GCP, Vault); Bitbucket itself has no setting.
- Lifetime: Per-step token; lifetime not documented. Renewal: New token each step.
- Keyless option: supported. Outbound federation; trust and claim conditions are enforced by the resource server.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- Cloud provider logs (e.g. AWS CloudTrail AssumeRoleWithWebIdentity): Use is visible at the resource server, not Bitbucket.

### Fields that identify the credential
- `token claims (repository, deployment environment)` (resource server): Claims shown on the Pipelines OpenID Connect settings page.

### Lifecycle events
No docs found.

### Correlate on
`repository UUID claim`, `pipeline step`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Role assumption from a branch or environment not in the trust policy
- Pipeline YAML changes that add oidc: true

## Respond: how to revoke it


Tighten or delete the trust policy at the resource server; set oidc false. Live access ends on revocation: partial. Already-issued cloud credentials last until their own expiry.

## No vendor documentation found
- Admin can list all of them
- SSO and MFA rules apply
- Expires automatically
- Data reads appear in logs
- Token lifetime
- Bitbucket-side logging of token issuance
- Holder calls the cloud provider, not Bitbucket
- Whether the workspace IP allowlist is enforced on REST API calls (docs only mention viewing content and Git clone/push/pull).
- Whether API tokens or OAuth tokens are checked against IdP SSO or conditional access at use time.
- Whether the workspace audit log records access token creation, rotation or revocation (no such events listed).
- Lifetime of the Pipelines OIDC token.
- OAuth access token lifetime: developer docs say 1 hour, support docs say 2 hours.
- Any admin approval workflow for users authorizing third-party OAuth consumers.

## Sources
- [Integrate Pipelines with resource servers using OIDC](https://support.atlassian.com/bitbucket-cloud/docs/integrate-pipelines-with-resource-servers-using-oidc/) (retrieved 2026-10-14)
- [Deploy on AWS using Bitbucket Pipelines OpenID Connect](https://support.atlassian.com/bitbucket-cloud/docs/deploy-on-aws-using-bitbucket-pipelines-openid-connect/) (retrieved 2026-10-14)
