# Hugging Face: Service account access token

`huggingface-3` · Personal access token · service. Fine-grained token issued by admins to an organization-owned service account that cannot sign in interactively.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Org settings > Service Accounts, where admins see and manage each account's tokens. | Org settings > Service Accounts, where admins see and manage each account's tokens. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional (requires Enterprise Plus) | Subject to org IP ranges (Enterprise Plus) unless an admin enables 'Bypass IP restrictions and the Content Access Policy' on that token. | Restrict organization access to your IP ranges only: Organization settings > Network Security (or PATCH /api/organizations/{name}/settings/network-security) |
| Protect: Expires automatically | No docs found | No expiry documented |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Organization Audit Logs (UI or GET /api/organizations/{org}/audit-log/export): Team & Enterprise. Membership, settings, repo and token-approval events; anonymized IP. Retention not stated. |
| Detect: Data reads appear in logs | Not available | Org audit log has no download events |  |
| Respond: Revocation ends active access | Yes | Old value stops working immediately on rotate. | Rotate or delete the token in Service Accounts settings. |
| Respond: Stops working when user is removed | N/A | Service accounts belong to the org, not a person. |  |

## Protect: what an admin can configure

### Admin controls
- **Restrict organization access to your IP ranges only** (Limit network; Enterprise Plus; default off). Org resources reachable only from listed CIDRs, including via tokens. Where: Organization settings > Network Security (or PATCH /api/organizations/{name}/settings/network-security).
- **Bypass IP restrictions and the Content Access Policy** (Other; Enterprise Plus; default off). Per-token exemption from IP ranges and content policy; admin-only. Where: Service account token form.
- **Fine-grained token permissions** (Limit resources; all plans; default varies). Limit token to specific repos/orgs and actions. Where: Token creation form.
- **Service Accounts (org admin only)** (Other; Enterprise; default on). Only organization administrators can create service accounts and issue their tokens. Where: Organization settings > Service Accounts.

- Network: conditional (checked at api_request). Subject to org IP ranges (Enterprise Plus) unless an admin enables 'Bypass IP restrictions and the Content Access Policy' on that token.
- Lifetime: No expiry documented. Renewal: Rotate replaces the value; old value stops working immediately.
- Keyless option: not_applicable. Non-interactive identity; no SSO login.
- Conditions: Enterprise / Enterprise Plus.

## Detect: what gets logged
- Token prefix: `hf_`

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
- enumeration (bulk): `GET /api/models/{namespace}/{repo}/tree/{rev}/{path}`. Files in a repo Logged: no. Not among documented audit event types
- collection (bulk): `GET /{namespace}/{repo}/resolve/{rev}/{path}`. File contents (models, datasets) Logged: no. Org audit log has no download events

### What to look for (analyst guidance)
- Token never rotated or unused for long periods in org token listing
- Unexpected org.token_approval.authorization_request

## Respond: how to revoke it
- Admin: **Revoke leaked token everywhere**. Anyone can submit a raw token value; matching tokens are invalidated everywhere immediately. Where: POST /api/credentials/revoke.
- Admin: **Service account token rotate / delete**. Rotate invalidates the old value immediately; delete revokes permanently. Where: Organization settings > Service Accounts.

Rotate or delete the token in Service Accounts settings. Live access ends on revocation: yes. Old value stops working immediately on rotate.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Expires automatically
- Service account token lifecycle events are not in the audit log event list
- Admin-enforced expiry for user access tokens or service account tokens (no setting found; PATs are valid until revoked).
- Whether access tokens require or bypass an SSO session under Basic or Managed SSO.
- Org-level allowlist or block for third-party OAuth apps.
- Org-level control over who can configure Trusted Publishers on org repos.
- Exact audit event name for OAuth Token Exchange issuance (docs say exchanges are logged).
- Whether IP ranges apply to OAuth, Token Exchange and Trusted Publisher tokens.

## Sources
- [Service Accounts](https://huggingface.co/docs/hub/enterprise-service-accounts) (retrieved 2026-10-14)
- [Network Security](https://huggingface.co/docs/hub/enterprise-network-security) (retrieved 2026-10-14)
- [Audit Logs](https://huggingface.co/docs/hub/audit-logs) (retrieved 2026-10-14)
- [Hub OpenAPI](https://huggingface.co/.well-known/openapi.md) (retrieved 2026-10-14)
- [User access tokens](https://huggingface.co/docs/hub/security-tokens) (retrieved 2026-10-14)
