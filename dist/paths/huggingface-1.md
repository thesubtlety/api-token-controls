# Hugging Face: User access token (fine-grained)

`huggingface-1` · Personal access token · person. hf_ token created by a user with per-resource permissions; sent as bearer token or used as git password. Also used to call private Inference Endpoints.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Org settings token listing and GET /api/organizations/{org}/settings/tokens list all member access tokens. | Org settings token listing and GET /api/organizations/{org}/settings/tokens list all member access tokens. |
| Protect: Admin can block or require approval | Yes (requires Team or Enterprise) | Token Policy: Require administrator approval; Deny token | Token Policy: Require administrator approval: Organization settings > Tokens Management > Token Policy · Deny token: Token review page |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional (requires Enterprise Plus) | Enterprise Plus 'Restrict organization access to your IP ranges only' applies to access tokens for org resources only. | Restrict organization access to your IP ranges only: Organization settings > Network Security (or PATCH /api/organizations/{name}/settings/network-security) |
| Protect: Expires automatically | Not available | Valid until revoked |  |
| Detect: Usage appears in logs | Yes | token id | Organization Audit Logs (UI or GET /api/organizations/{org}/audit-log/export): Team & Enterprise. Membership, settings, repo and token-approval events; anonymized IP. Retention not stated. |
| Detect: Data reads appear in logs | Not available | Org audit log has no download events |  |
| Respond: Revocation ends active access | Yes | Org revoke stops org access; credentials/revoke invalidates everywhere immediately. | Enterprise: revoke org access via API; for full kill submit the token to POST /api/credentials/revoke or have owner delete it. |
| Respond: Stops working when user is removed | Yes | Token access to org resources follows org membership, and SCIM deprovisioning revokes the user's access; the token may still work for the user's own resources. | Where: Organization settings > Members > revoke membership; with SCIM, deprovision in the IdP. For immediate cut-off: revoke the token from Tokens Management · API: SCIM: set user active=false or delete the user via SCIM; POST /api/organizations/{org}/settings/tokens/{token_id}/revoke |

## Protect: what an admin can configure

### Admin controls
- **Token Policy: Require administrator approval** (Require approval; Team or Enterprise; default off). Fine-grained tokens need admin approval for org resources; read/write tokens are blocked. Where: Organization settings > Tokens Management > Token Policy.
- **Deny token** (Disable; Team or Enterprise; default unknown). Removes approval-based org access immediately; reversible. Where: Token review page.
- **Restrict organization access to your IP ranges only** (Limit network; Enterprise Plus; default off). Org resources reachable only from listed CIDRs, including via tokens. Where: Organization settings > Network Security (or PATCH /api/organizations/{name}/settings/network-security).
- **Fine-grained token permissions** (Limit resources; all plans; default varies). Limit token to specific repos/orgs and actions. Where: Token creation form.

- Network: conditional (checked at api_request). Enterprise Plus 'Restrict organization access to your IP ranges only' applies to access tokens for org resources only.
- Lifetime: Valid until revoked. Renewal: User can refresh (rotate) or delete from settings.
- Keyless option: not_verified. Basic SSO prompts members when accessing org resources; docs do not say whether access tokens require an SSO session.
- Conditions: Org deny/revoke only cuts off that org; token keeps working elsewhere. Admin-created tokens are auto-approved.

## Detect: what gets logged
- Token prefix: `hf_`

### Logs
- Organization Audit Logs (UI or GET /api/organizations/{org}/audit-log/export): Team & Enterprise. Membership, settings, repo and token-approval events; anonymized IP. Retention not stated.

### Fields that identify the credential
- `token id` (Org token listing API): Used for org revoke

### Lifecycle events
- create: `org.token_approval.authorization_request` Only with approval policy
- approve: `org.token_approval.authorization_request.authorized` 
- revoke: `org.token_approval.authorization_request.denied` 
- revoke: `org.token_approval.authorization_request.revoked` 

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
- Admin: **Revoke token (org)**. Permanently removes a member token's access to the org only. Where: Token detail page or POST /api/organizations/{name}/settings/tokens/{tokenId}/revoke.
- Admin: **Revoke leaked token everywhere**. Anyone can submit a raw token value; matching tokens are invalidated everywhere immediately. Where: POST /api/credentials/revoke.

Enterprise: revoke org access via API; for full kill submit the token to POST /api/credentials/revoke or have owner delete it. Live access ends on revocation: yes. Org revoke stops org access; credentials/revoke invalidates everywhere immediately.

## No vendor documentation found
- SSO and MFA rules apply
- Token creation/use events are not in the org audit log event list
- Admin-enforced expiry for user access tokens or service account tokens (no setting found; PATs are valid until revoked).
- Whether access tokens require or bypass an SSO session under Basic or Managed SSO.
- Org-level allowlist or block for third-party OAuth apps.
- Org-level control over who can configure Trusted Publishers on org repos.
- Exact audit event name for OAuth Token Exchange issuance (docs say exchanges are logged).
- Whether IP ranges apply to OAuth, Token Exchange and Trusted Publisher tokens.

## Sources
- [User access tokens](https://huggingface.co/docs/hub/security-tokens) (retrieved 2026-10-14)
- [Inference Endpoints configuration - Authentication](https://huggingface.co/docs/inference-endpoints/guides/configuration) (retrieved 2026-10-14)
- [Single Sign-On (SSO)](https://huggingface.co/docs/hub/enterprise-sso) (retrieved 2026-10-14)
- [Network Security](https://huggingface.co/docs/hub/enterprise-network-security) (retrieved 2026-10-14)
- [Trusted Publishers](https://huggingface.co/docs/hub/trusted-publishers) (retrieved 2026-10-14)
- [Tokens Management](https://huggingface.co/docs/hub/enterprise-tokens-management) (retrieved 2026-10-14)
- [User Provisioning (SCIM)](https://huggingface.co/docs/hub/enterprise-scim) (retrieved 2026-10-14)
- [Managing organizations](https://huggingface.co/docs/hub/organizations-managing) (retrieved 2026-10-14)
- [Audit Logs](https://huggingface.co/docs/hub/audit-logs) (retrieved 2026-10-14)
- [Hub OpenAPI](https://huggingface.co/.well-known/openapi.md) (retrieved 2026-10-14)
- [Service Accounts](https://huggingface.co/docs/hub/enterprise-service-accounts) (retrieved 2026-10-14)
