# Anthropic API: OAuth bearer token (ant CLI login, incl. org:admin)

`anthropic-6` · OAuth · person. Browser login via ant auth login issues a workspace-scoped token; with --scope org:admin it has organization-wide admin access.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No customer IP allowlist for Claude API requests found in fetched docs; the IP addresses page only lists Anthropic's own ranges. |  |
| Protect: Expires automatically | No docs found | Interactive tokens are short-lived (exact value not stated) |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Compliance API Activity Feed (GET /v1/compliance/activities): Must be enabled; 6-year retention; not retroactive. Admin API keys can read it. · Usage and Cost API: Aggregated usage filterable by API key. |
| Detect: Data reads appear in logs | Conditional | Event exists in the Activity Feed; docs do not say which actor type an interactive OAuth token produces. Requires the Compliance API to be enabled. | API: GET /v1/compliance/activities?activity_types[]=org_users_listed (actor type for OAuth tokens not documented) |
| Respond: Revocation ends active access | No docs found | No admin revocation of CLI tokens documented. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Compliance API (Activity Feed)** (Other; Eligible organizations (self-service) or via account team; default off). Must be on for key and federation activity to be recorded. Where: Claude Console > Settings > Security > Compliance API.

- Network: unknown (checked at unknown). No customer IP allowlist for Claude API requests found in fetched docs; the IP addresses page only lists Anthropic's own ranges.
- Lifetime: Interactive tokens are short-lived (exact value not stated). Renewal: Re-export from CLI profile to refresh; mechanism details not documented.
- Keyless option: not_verified. Browser login presumably follows Console sign-in, but docs fetched do not describe SSO enforcement.
- Conditions: Admin-side revocation of issued CLI tokens not documented.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Compliance API Activity Feed (GET /v1/compliance/activities): Must be enabled; 6-year retention; not retroactive. Admin API keys can read it.
- Usage and Cost API: Aggregated usage filterable by API key.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`actor.api_key_id`, `actor.ip_address`, `actor.user_agent`, `workspace id`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/organizations/me`. Organization of the credential Logged: unknown. 
- enumeration (bulk): `GET /v1/organizations/api_keys`. All keys, principals, status, expiry Logged: unknown. 
- collection: `GET /v1/organizations/users`. all organization members (org:admin token has organization-wide access) Logged: plan (`org_users_listed`). Event exists in the Activity Feed; docs do not say which actor type an interactive OAuth token produces. Requires the Compliance API to be enabled.

### What to look for (analyst guidance)
- New platform_api_key_created outside change window
- platform_file_content_downloaded bursts
- Key used from unfamiliar ip_address

## Respond: how to revoke it


Remove the user's admin role or remove the user; locally run ant auth logout. Live access ends on revocation: unknown. No admin revocation of CLI tokens documented.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Revocation ends active access
- Stops working when user is removed
- Logging of OAuth token issuance
- Customer IP allowlisting for Claude API requests (not found in docs).
- Whether keys or OAuth tokens are subject to SSO / IdP conditional access.
- Whether disabling a key or archiving a rule ends already-minted WIF tokens immediately.
- Lifetime and admin revocation of ant CLI OAuth tokens.
- Console UI path for the maximum expiration policy and the member API key creation setting.
- Whether Messages API calls generate Activity Feed events (feed excludes prompt/response text).

## Sources
- [CLI authentication](https://platform.claude.com/docs/en/cli-sdks-libraries/cli/authentication) (retrieved 2026-10-14)
- [Admin API](https://platform.claude.com/docs/en/manage-claude/admin-api) (retrieved 2026-10-14)
- [Compliance API Activity Feed](https://platform.claude.com/docs/en/manage-claude/compliance-activity-feed) (retrieved 2026-10-14)
- [Query compliance activities](https://platform.claude.com/docs/en/api/compliance/activities/list) (retrieved 2026-10-14)
- [List Users](https://platform.claude.com/docs/en/api/organization/users/list) (retrieved 2026-10-14)
- [Set up the Compliance API](https://platform.claude.com/docs/en/manage-claude/compliance-api-access) (retrieved 2026-10-14)
