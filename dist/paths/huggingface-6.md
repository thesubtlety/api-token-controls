# Hugging Face: Trusted Publisher / CI/CD identity token

`huggingface-6` · Federated identity · person or service. CI job exchanges its OIDC ID token at /oauth/token for a 1-hour hf_jwt_ (repo write) or hf_oauth_ (user read-only) token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Publishers are listed per repo under Settings > Trusted Publishers (and per account under CI/CD Access); no org-wide list documented. | Publishers are listed per repo under Settings > Trusted Publishers (and per account under CI/CD Access); no org-wide list documented. |
| Protect: Admin can block or require approval | Yes | Write role required to manage trusted publishers | Write role required to manage trusted publishers: Repo Settings > Trusted Publishers |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not addressed. |  |
| Protect: Expires automatically | Yes | 60 minutes | Where: Fixed at 60 minutes from exchange; not configurable · API: POST https://huggingface.co/oauth/token response field expires_in (3600) |
| Detect: Usage appears in logs | Yes | [OIDC] system user with issuer/subject | Organization Audit Logs (UI or GET /api/organizations/{org}/audit-log/export): Team & Enterprise. Membership, settings, repo and token-approval events; anonymized IP. Retention not stated. |
| Detect: Data reads appear in logs | Not available | Org audit log has no download events |  |
| Respond: Revocation ends active access | No docs found | Tokens expire within 60 minutes. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Write role required to manage trusted publishers** (Disable; all plans; default on). Only users with the Write role on a repo can add or remove its trusted publishers. Where: Repo Settings > Trusted Publishers.

- Network: unknown (checked at unknown). Not addressed.
- Lifetime: 60 minutes. Renewal: No refresh token; re-exchange.
- Keyless option: supported. GitHub Actions, GitLab CI, CircleCI, Bitbucket, any OIDC provider; exact claim matching.
- Conditions: No org-level policy documented.

## Detect: what gets logged
- Token prefix: `hf_jwt_`

### Logs
- Organization Audit Logs (UI or GET /api/organizations/{org}/audit-log/export): Team & Enterprise. Membership, settings, repo and token-approval events; anonymized IP. Retention not stated.

### Fields that identify the credential
- `[OIDC] system user with issuer/subject` (Repo commit history): Push attribution

### Lifecycle events
- create: `publisher added/removed (name not documented)` Docs say adding/removing is logged

### Correlate on
`token id (24-char, org token settings)`, `username`, `anonymized IP/location`

### API calls a holder can make, and whether they are logged
- collection (bulk): `GET /{namespace}/{repo}/resolve/{rev}/{path}`. File contents (models, datasets) Logged: no. Org audit log has no download events

### What to look for (analyst guidance)
- Token never rotated or unused for long periods in org token listing
- Unexpected org.token_approval.authorization_request

## Respond: how to revoke it


Remove the trusted publisher from repo settings (or CI/CD identity from account). Live access ends on revocation: unknown. Tokens expire within 60 minutes.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Revocation ends active access
- Stops working when user is removed
- Audit event names
- Admin-enforced expiry for user access tokens or service account tokens (no setting found; PATs are valid until revoked).
- Whether access tokens require or bypass an SSO session under Basic or Managed SSO.
- Org-level allowlist or block for third-party OAuth apps.
- Org-level control over who can configure Trusted Publishers on org repos.
- Exact audit event name for OAuth Token Exchange issuance (docs say exchanges are logged).
- Whether IP ranges apply to OAuth, Token Exchange and Trusted Publisher tokens.

## Sources
- [Trusted Publishers](https://huggingface.co/docs/hub/trusted-publishers) (retrieved 2026-10-14)
- [Audit Logs](https://huggingface.co/docs/hub/audit-logs) (retrieved 2026-10-14)
- [Hub OpenAPI](https://huggingface.co/.well-known/openapi.md) (retrieved 2026-10-14)
