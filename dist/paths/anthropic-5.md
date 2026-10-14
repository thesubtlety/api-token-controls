# Anthropic API: Workload Identity Federation access token

`anthropic-5` · Federated identity · service. Workload exchanges an IdP JWT at POST /v1/oauth/token for a short-lived token acting as a service account, per a federation rule.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Admins can list service accounts, federation issuers and federation rules via the Admin API list endpoints, but not individual minted tokens. | Where: Console > Workload identity (platform.claude.com/settings/workload-identity-federation) · API: GET /v1/organizations/service_accounts; GET /v1/organizations/federation_issuers; GET /v1/organizations/federation_rules · Command: ant organization:service-accounts list; ant organization:federation:issuers list; ant organization:federation:rules list --issuer-id <fdis_id> |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Partial | Token issuance depends on a JWT from your own IdP, so IdP controls such as conditional access apply at exchange time; org SSO/MFA does not apply to the minted token. | Where: Console > Workload identity > rule match conditions (subject_prefix, audience, claims, CEL condition); conditional access is set in your IdP |
| Protect: IP restriction | No docs found | No customer IP allowlist for Claude API requests found in fetched docs; the IP addresses page only lists Anthropic's own ranges. |  |
| Protect: Expires automatically | Yes | Rule token_lifetime_seconds 60-86400, capped by 2x remaining IdP JWT lifetime | Where: Console > Workload identity > Connect workload (wizard sets token_lifetime_seconds, default 600) · API: POST /v1/organizations/federation_rules/{rule_id} with token_lifetime_seconds (60-86400) |
| Detect: Usage appears in logs | Yes | service account id (svac_...) | Compliance API Activity Feed (GET /v1/compliance/activities): Must be enabled; 6-year retention; not retroactive. Admin API keys can read it. · Usage and Cost API: Aggregated usage filterable by API key. |
| Detect: Data reads appear in logs | Yes | platform_file_content_downloaded | API: GET /v1/compliance/activities?activity_types[]=platform_file_content_downloaded; match actor.api_key_id client-side (actor_ids[] accepts only user_ IDs) |
| Respond: Revocation ends active access | Partial | Archiving a federation rule stops new exchanges immediately, but tokens already minted stay valid until they expire (default 3600s, max 86400s). | API: POST /v1/organizations/federation_rules/{rule_id}/archive (also /federation_issuers/{id}/archive, /service_accounts/{id}/archive) · Command: ant organization:federation:rules archive --federation-rule-id <fdrl_id> |
| Respond: Stops working when user is removed | N/A | Tokens act as a service account, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Federation rule token_lifetime_seconds** (Limit lifetime; all plans; default on). Sets minted token lifetime 60-86400 s. Where: Federation rule.
- **Compliance API (Activity Feed)** (Other; Eligible organizations (self-service) or via account team; default off). Must be on for key and federation activity to be recorded. Where: Claude Console > Settings > Security > Compliance API.

- Network: unknown (checked at unknown). No customer IP allowlist for Claude API requests found in fetched docs; the IP addresses page only lists Anthropic's own ranges.
- Lifetime: Rule token_lifetime_seconds 60-86400, capped by 2x remaining IdP JWT lifetime. Renewal: SDK re-exchanges automatically before expiry.
- Keyless option: supported. AWS, Google Cloud, Azure and standards-compliant OIDC issuers (GitHub Actions, Kubernetes, SPIFFE, Entra ID, Okta).
- Conditions: Issuer sets maximum accepted IdP token lifetime (1h default).

## Detect: what gets logged
- Token prefix: not established

### Logs
- Compliance API Activity Feed (GET /v1/compliance/activities): Must be enabled; 6-year retention; not retroactive. Admin API keys can read it.
- Usage and Cost API: Aggregated usage filterable by API key.

### Fields that identify the credential
- `service account id (svac_...)` (Activity Feed): Actor attribution for WIF calls not verified

### Lifecycle events
- use: `platform_federated_authentication` Token exchange attempt
- revoke: `platform_federation_rule_archived` 

### Correlate on
`actor.api_key_id`, `actor.ip_address`, `actor.user_agent`, `workspace id`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/models`. Key is valid; available models Logged: unknown. 
- collection (bulk): `GET /v1/files then GET /v1/files/{file_id}/content`. Files uploaded to the workspace Logged: yes (`platform_file_content_downloaded`). Requires Compliance API enabled

### What to look for (analyst guidance)
- New platform_api_key_created outside change window
- platform_file_content_downloaded bursts
- Key used from unfamiliar ip_address

## Respond: how to revoke it
- Admin: **Remove user / archive service account**. Personal keys stop on user removal; service account keys stop on account archive. Where: Console or Admin API.
- Admin: **Archive federation rule / issuer**. Archived rules reject token exchange. Where: Console or POST /v1/organizations/federation_rules/{id}/archive (org:admin token).

Archive the federation rule (then issuer/service account). Live access ends on revocation: partial. Archiving a federation rule stops new exchanges immediately, but tokens already minted stay valid until they expire (default 3600s, max 86400s).

## No vendor documentation found
- Admin can block or require approval
- IP restriction
- Effect on live tokens
- Customer IP allowlisting for Claude API requests (not found in docs).
- Whether keys or OAuth tokens are subject to SSO / IdP conditional access.
- Whether disabling a key or archiving a rule ends already-minted WIF tokens immediately.
- Lifetime and admin revocation of ant CLI OAuth tokens.
- Console UI path for the maximum expiration policy and the member API key creation setting.
- Whether Messages API calls generate Activity Feed events (feed excludes prompt/response text).

## Sources
- [Authentication](https://platform.claude.com/docs/en/manage-claude/authentication) (retrieved 2026-10-14)
- [Workload Identity Federation](https://platform.claude.com/docs/en/manage-claude/workload-identity-federation) (retrieved 2026-10-14)
- [WIF reference](https://platform.claude.com/docs/en/manage-claude/wif-reference) (retrieved 2026-10-14)
- [Admin API](https://platform.claude.com/docs/en/manage-claude/admin-api) (retrieved 2026-10-14)
- [Manage WIF with the Admin API](https://platform.claude.com/docs/en/manage-claude/wif-admin-api) (retrieved 2026-10-14)
- [Compliance API Activity Feed](https://platform.claude.com/docs/en/manage-claude/compliance-activity-feed) (retrieved 2026-10-14)
- [Query compliance activities](https://platform.claude.com/docs/en/api/compliance/activities/list) (retrieved 2026-10-14)
- [Archive Federation Rule](https://platform.claude.com/docs/en/api/organization/federation/rules/archive) (retrieved 2026-10-14)
- [API overview](https://platform.claude.com/docs/en/api/overview) (retrieved 2026-10-14)
- [Set up the Compliance API](https://platform.claude.com/docs/en/manage-claude/compliance-api-access) (retrieved 2026-10-14)
