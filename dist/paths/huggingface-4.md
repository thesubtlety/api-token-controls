# Hugging Face: OAuth app access token (Sign in with HF)

`huggingface-4` · OAuth · person. User authorizes an OAuth/OIDC app (with or without client secret, incl. device code) for scopes such as read-repos, write-repos, inference-api.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Network Security text names access tokens generally; OAuth tokens not addressed. |  |
| Protect: Expires automatically | Yes | Spaces OAuth: default 8 h, max 30 days via hf_oauth_expiration_minutes; non-Spaces apps not stated | Where: Space README.md YAML metadata: hf_oauth_expiration_minutes (default 480, max 43200) |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Organization Audit Logs (UI or GET /api/organizations/{org}/audit-log/export): Team & Enterprise. Membership, settings, repo and token-approval events; anonymized IP. Retention not stated. |
| Detect: Data reads appear in logs | Not available | Org audit log has no download events |  |
| Respond: Revocation ends active access | No docs found | User revokes the app in their settings (path not documented). |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **hf_oauth_expiration_minutes** (Limit lifetime; all plans; default on). Sets OAuth token lifetime for a Space's Sign in with HF (default 480 min, max 43200 min). Where: Space README.md metadata.

- Network: unknown (checked at unknown). Network Security text names access tokens generally; OAuth tokens not addressed.
- Lifetime: Spaces OAuth: default 8 h, max 30 days via hf_oauth_expiration_minutes; non-Spaces apps not stated. Renewal: Not documented for interactive flows.
- Keyless option: not_verified. Basic SSO prompts members when accessing org resources; docs do not say whether access tokens require an SSO session.
- Conditions: 

## Detect: what gets logged
- Token prefix: `hf_oauth_`

### Logs
- Organization Audit Logs (UI or GET /api/organizations/{org}/audit-log/export): Team & Enterprise. Membership, settings, repo and token-approval events; anonymized IP. Retention not stated.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`token id (24-char, org token settings)`, `username`, `anonymized IP/location`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/whoami-v2`. User, orgs and auth method of the token Logged: no. Not among the documented audit event types
- collection (bulk): `GET /{namespace}/{repo}/resolve/{rev}/{path}`. File contents (models, datasets) Logged: no. Org audit log has no download events

### What to look for (analyst guidance)
- Token never rotated or unused for long periods in org token listing
- Unexpected org.token_approval.authorization_request

## Respond: how to revoke it


User revokes the app in their settings (path not documented). Live access ends on revocation: unknown. 

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Revocation ends active access
- Stops working when user is removed
- Admin revocation of user-granted OAuth apps
- Admin-enforced expiry for user access tokens or service account tokens (no setting found; PATs are valid until revoked).
- Whether access tokens require or bypass an SSO session under Basic or Managed SSO.
- Org-level allowlist or block for third-party OAuth apps.
- Org-level control over who can configure Trusted Publishers on org repos.
- Exact audit event name for OAuth Token Exchange issuance (docs say exchanges are logged).
- Whether IP ranges apply to OAuth, Token Exchange and Trusted Publisher tokens.

## Sources
- [Sign in with Hugging Face](https://huggingface.co/docs/hub/oauth) (retrieved 2026-10-14)
- [Single Sign-On (SSO)](https://huggingface.co/docs/hub/enterprise-sso) (retrieved 2026-10-14)
- [Network Security](https://huggingface.co/docs/hub/enterprise-network-security) (retrieved 2026-10-14)
- [Adding a Sign-In with HF button to your Space](https://huggingface.co/docs/hub/spaces-oauth) (retrieved 2026-10-14)
- [Audit Logs](https://huggingface.co/docs/hub/audit-logs) (retrieved 2026-10-14)
- [Hub OpenAPI](https://huggingface.co/.well-known/openapi.md) (retrieved 2026-10-14)
