# Hugging Face: OAuth Token Exchange (org-bound app, RFC 8693)

`huggingface-5` · OAuth · person or service. Backend uses an org-bound OAuth app's client credentials to mint hf_oauth_ tokens for any member by email, without the member's consent.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | No token list; all token exchanges appear in the org audit logs. | Where: Organization settings > Audit Logs (token exchanges are logged); download as JSON · API: GET https://huggingface.co/api/organizations/{org}/audit-log/export |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not addressed in docs. |  |
| Protect: Expires automatically | Yes | 8 h default, up to 30 days; no refresh | Token Exchange token duration: OAuth app settings |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Organization Audit Logs (UI or GET /api/organizations/{org}/audit-log/export): Team & Enterprise. Membership, settings, repo and token-approval events; anonymized IP. Retention not stated. |
| Detect: Data reads appear in logs | Not available | Org audit log has no download events |  |
| Respond: Revocation ends active access | No docs found | Effect of secret refresh on issued tokens not stated. |  |
| Respond: Stops working when user is removed | Partial | Issuance checks current org membership, so a removed user gets no new tokens; already-issued tokens are not addressed (they expire after 8 h by default). | Where: Organization settings > Members > revoke membership (or SCIM deprovision). Issued tokens are not revoked; they expire per the OAuth app's duration (8 h default) · API: SCIM: set user active=false or delete the user via SCIM |

## Protect: what an admin can configure

### Admin controls
- **Token Exchange token duration** (Limit lifetime; Enterprise; default on). Admins set issued token duration (8 h default, max 30 days) and can refresh the client secret. Where: OAuth app settings.
- **Token Exchange OAuth app set up by Hugging Face support** (Other; Enterprise; default off). Token Exchange only works through an org-bound OAuth app with the token-exchange privilege, which Hugging Face support sets up on request. Where: Contact Hugging Face support.

- Network: unknown (checked at unknown). Not addressed in docs.
- Lifetime: 8 h default, up to 30 days; no refresh. Renewal: Re-run the exchange.
- Keyless option: limited. Bridges an internal directory by email; not OIDC federation.
- Conditions: Enterprise plan.

## Detect: what gets logged
- Token prefix: `hf_oauth_`

### Logs
- Organization Audit Logs (UI or GET /api/organizations/{org}/audit-log/export): Team & Enterprise. Membership, settings, repo and token-approval events; anonymized IP. Retention not stated.

### Fields that identify the credential
No docs found.

### Lifecycle events
- create: `token exchange (name not documented)` Docs say all exchanges are logged in org audit logs

### Correlate on
`token id (24-char, org token settings)`, `username`, `anonymized IP/location`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/whoami-v2`. User, orgs and auth method of the token Logged: no. Not among the documented audit event types
- collection (bulk): `GET /{namespace}/{repo}/resolve/{rev}/{path}`. File contents (models, datasets) Logged: no. Org audit log has no download events

### What to look for (analyst guidance)
- Token exchanges for members who are not using the integration

## Respond: how to revoke it


Refresh the OAuth app client secret; issued tokens expire per configured duration. Live access ends on revocation: unknown. Effect of secret refresh on issued tokens not stated.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Revocation ends active access
- Event name for exchanges
- Admin-enforced expiry for user access tokens or service account tokens (no setting found; PATs are valid until revoked).
- Whether access tokens require or bypass an SSO session under Basic or Managed SSO.
- Org-level allowlist or block for third-party OAuth apps.
- Org-level control over who can configure Trusted Publishers on org repos.
- Exact audit event name for OAuth Token Exchange issuance (docs say exchanges are logged).
- Whether IP ranges apply to OAuth, Token Exchange and Trusted Publisher tokens.

## Sources
- [Sign in with Hugging Face](https://huggingface.co/docs/hub/oauth) (retrieved 2026-10-14)
- [Audit Logs](https://huggingface.co/docs/hub/audit-logs) (retrieved 2026-10-14)
- [Managing organizations](https://huggingface.co/docs/hub/organizations-managing) (retrieved 2026-10-14)
- [User Provisioning (SCIM)](https://huggingface.co/docs/hub/enterprise-scim) (retrieved 2026-10-14)
- [Hub OpenAPI](https://huggingface.co/.well-known/openapi.md) (retrieved 2026-10-14)
