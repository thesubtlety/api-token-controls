# Anthropic API: Admin API key

`anthropic-4` · API key / token · person. sk-ant-admin... key sent in x-api-key for the Admin, Usage and Cost, Rate Limits APIs and the Compliance Activity Feed.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin API keys are listed on the Admin keys page (platform.claude.com/settings/admin-keys) in the Claude Console. No API list endpoint for admin keys was found. | Admin API keys are listed on the Admin keys page (platform.claude.com/settings/admin-keys) in the Claude Console. No API list endpoint for admin keys was found. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No customer IP allowlist for Claude API requests found in fetched docs; the IP addresses page only lists Anthropic's own ranges. |  |
| Protect: Expires automatically | Partial | Same expiration choice as API keys at creation | Where: Console > Admin keys (platform.claude.com/settings/admin-keys) > Create admin key > choose key expiration |
| Detect: Usage appears in logs | Yes | actor.admin_api_key_id | Compliance API Activity Feed (GET /v1/compliance/activities): Must be enabled; 6-year retention; not retroactive. Admin API keys can read it. · Usage and Cost API: Aggregated usage filterable by API key. |
| Detect: Data reads appear in logs | Conditional | Activity Feed has an org_users_listed event with an admin_api_key_actor type (admin_api_key_id); docs do not explicitly tie the event to this endpoint. Recording starts only once the Compliance API is enabled. | API: GET /v1/compliance/activities?activity_types[]=org_users_listed; match actor.type=admin_api_key_actor and actor.admin_api_key_id |
| Respond: Revocation ends active access | Yes | Deleting an Admin API key takes effect on the next request, with no grace period. | Deactivate or delete the admin key in Console > Settings > Admin keys. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Maximum expiration policy** (Limit lifetime; all plans; default off). Console limits key expiration to the policy maximum and removes Never. Where: Organization policy (UI path not stated).
- **Compliance API (Activity Feed)** (Other; Eligible organizations (self-service) or via account team; default off). Must be on for key and federation activity to be recorded. Where: Claude Console > Settings > Security > Compliance API.

- Network: unknown (checked at unknown). No customer IP allowlist for Claude API requests found in fetched docs; the IP addresses page only lists Anthropic's own ranges.
- Lifetime: Same expiration choice as API keys at creation. Renewal: Create a new admin key.
- Keyless option: not_verified. Fetched docs do not say whether API keys are subject to SSO or IdP conditional access.
- Conditions: Claude Enterprise (claude.ai) uses separate scoped keys; out of scope here.

## Detect: what gets logged
- Token prefix: `sk-ant-admin01-`

### Logs
- Compliance API Activity Feed (GET /v1/compliance/activities): Must be enabled; 6-year retention; not retroactive. Admin API keys can read it.
- Usage and Cost API: Aggregated usage filterable by API key.

### Fields that identify the credential
- `actor.admin_api_key_id` (Activity Feed (admin_api_key_actor)): 

### Lifecycle events
- create: `admin_api_key_created` 
- update: `admin_api_key_updated` Rename or activate/deactivate
- revoke: `admin_api_key_deleted` 

### Correlate on
`actor.api_key_id`, `actor.ip_address`, `actor.user_agent`, `workspace id`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/organizations/me`. Organization of the credential Logged: unknown. 
- enumeration (bulk): `GET /v1/organizations/api_keys`. All keys, principals, status, expiry Logged: unknown. 
- collection: `GET /v1/organizations/users`. all organization members Logged: plan (`org_users_listed`). Activity Feed has an org_users_listed event with an admin_api_key_actor type (admin_api_key_id); docs do not explicitly tie the event to this endpoint. Recording starts only once the Compliance API is enabled.

### Public detection rules (community, not vendor documentation)
- [Anthropic Admin API Key Created](https://github.com/panther-labs/panther-analysis/blob/develop/rules/anthropic_rules/anthropic_admin_api_key_created.yml) (Panther): An Anthropic Admin API key was created.
- [Anthropic Admin API Key Deleted](https://github.com/panther-labs/panther-analysis/blob/develop/rules/anthropic_rules/anthropic_admin_api_key_deleted.yml) (Panther): An Anthropic Admin API key was deleted.

### What to look for (analyst guidance)
- New platform_api_key_created outside change window
- platform_file_content_downloaded bursts
- Key used from unfamiliar ip_address

## Respond: how to revoke it


Deactivate or delete the admin key in Console > Settings > Admin keys. Live access ends on revocation: yes. Deleting an Admin API key takes effect on the next request, with no grace period.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Stops working when user is removed
- Whether Admin API reads are logged
- Customer IP allowlisting for Claude API requests (not found in docs).
- Whether keys or OAuth tokens are subject to SSO / IdP conditional access.
- Whether disabling a key or archiving a rule ends already-minted WIF tokens immediately.
- Lifetime and admin revocation of ant CLI OAuth tokens.
- Console UI path for the maximum expiration policy and the member API key creation setting.
- Whether Messages API calls generate Activity Feed events (feed excludes prompt/response text).

## Sources
- [Admin API](https://platform.claude.com/docs/en/manage-claude/admin-api) (retrieved 2026-10-14)
- [Create an Admin API key](https://platform.claude.com/docs/en/manage-claude/admin-api-keys) (retrieved 2026-10-14)
- [Authentication](https://platform.claude.com/docs/en/manage-claude/authentication) (retrieved 2026-10-14)
- [Compliance API Activity Feed](https://platform.claude.com/docs/en/manage-claude/compliance-activity-feed) (retrieved 2026-10-14)
- [Set up the Compliance API](https://platform.claude.com/docs/en/manage-claude/compliance-api-access) (retrieved 2026-10-14)
- [Query compliance activities](https://platform.claude.com/docs/en/api/compliance/activities/list) (retrieved 2026-10-14)
- [List Users](https://platform.claude.com/docs/en/api/organization/users/list) (retrieved 2026-10-14)
