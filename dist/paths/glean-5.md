# Glean: External IdP OAuth token (X-Glean-Auth-Type: OAUTH)

`glean-5` · Federated identity · person. Access tokens issued by the customer's IdP (Google, Entra ID, Okta, OneLogin) and sent with X-Glean-Auth-Type: OAUTH. Glean checks issuer and client_id.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Enable IDP OAuth for API access | Enable IDP OAuth for API access: Settings > Third-party access (OAuth) |
| Protect: SSO and MFA rules apply | Yes | The customer's IdP issues these tokens, so IdP assignments and policies decide whether a user gets one. | Where: Register the OAuth app in the IdP and assign users/policies there; Admin console → Settings → Third‑party access (OAuth) → Enable IDP OAuth for API access → Manage Settings |
| Protect: IP restriction | Conditional | Tenant VPC firewall greenlist plus whatever the IdP enforces at issuance. | Where: No self-serve setting; send Glean the allowed CIDRs and Glean enables IP green listing (tenant-wide) |
| Protect: Expires automatically | Partial | Set by the IdP | Where: Set access/refresh token lifetime in the IdP's OAuth app policy (not in Glean) |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Where: Query the glean-customer-event log (bucket/warehouse; ask account team for location); filter IsRestClientApi = true |
| Detect: Data reads appear in logs | Yes | SEARCH | Where: In glean-customer-event log, filter jsonPayload.type = SEARCH and IsRestClientApi = true |
| Respond: Revocation ends active access | Partial | Revocation follows the IdP's policies. Docs do not say whether Glean checks revocation for each request or accepts tokens until they expire. | Where: Revoke in the IdP; or Admin console → Settings → Third‑party access (OAuth) → Manage Settings → remove client ID from Allowed clientID(s), or toggle off Enable IDP OAuth for API access |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Tenant-wide IP greenlist** (Limit network; all plans; default unknown). VPC firewall allowlist for the tenant; MCP also checks at app layer. Where: Not documented (Glean-managed).
- **Enable IDP OAuth for API access** (Disable; all plans; default off). Turns on acceptance of IdP tokens for listed client IDs. Where: Settings > Third-party access (OAuth).

- Network: conditional (checked at api_request). Tenant VPC firewall greenlist plus whatever the IdP enforces at issuance.
- Lifetime: Set by the IdP. Renewal: IdP refresh tokens.
- Keyless option: supported. Admin registers issuer and allowed client IDs; IdP policy governs issuance.
- Conditions: Revocation follows the IdP.

## Detect: what gets logged
- Token prefix: not established

### Logs
- IdP sign-in/token logs: Issuance logged by IdP.
- GCE logs: Usage.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`client_id`, `user identity`

### API calls a holder can make, and whether they are logged
- collection (bulk): `POST /rest/api/v1/search`. User-visible documents Logged: yes (`SEARCH`). GCE

### What to look for (analyst guidance)
- Tokens from a client ID not on the allowed list (rejected)

## Respond: how to revoke it


Revoke in IdP; remove client ID or disable IdP OAuth in Glean. Live access ends on revocation: partial. Revocation follows the IdP's policies. Docs do not say whether Glean checks revocation for each request or accepts tokens until they expire.

## No vendor documentation found
- Admin can list all of them
- Stops working when user is removed
- Whether revoking a Glean-issued API token takes effect immediately
- Whether user deprovisioning revokes that user's Glean-issued API tokens
- Whether admin audit logs record API token create/revoke (coverage list does not mention tokens)
- Per-token IP allowlist for Client API tokens
- Default OAuth server state (admin docs: off; developer docs: on)
- Where the tenant-wide IP greenlist is configured and whether customers manage it
- EMA token lifetime

## Sources
- [OAuth with IdP-issued tokens](https://docs.glean.com/administration/oauth/oauth-idp) (retrieved 2026-10-14)
- [MCP Security, Data Flow, and Permissions](https://docs.glean.com/administration/platform/mcp/security) (retrieved 2026-10-14)
- [About Glean SSO](https://docs.glean.com/administration/identity/sso/about) (retrieved 2026-10-14)
- [Glean web application firewall on AWS](https://docs.glean.com/security/cloud-prem/aws/aws-waf) (retrieved 2026-10-14)
- [Glean Customer Event logs overview](https://docs.glean.com/administration/gce-logs/data-dictionary) (retrieved 2026-10-14)
- [Event schemas | Glean Customer Event logs](https://docs.glean.com/administration/gce-logs/data-dictionary-detailed) (retrieved 2026-10-14)
- [MCP usage tracking and analytics](https://docs.glean.com/administration/platform/mcp/analytics) (retrieved 2026-10-14)
