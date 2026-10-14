# Anthropic API: Personal API key

`anthropic-1` · API key / token · person. Static sk-ant-api... secret linked to a user; every request acts as that user with their roles. Scoped to one workspace or all workspaces the user can use.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admins can list all keys with GET /v1/organizations/api_keys (List API Keys); each entry shows the principal, so personal keys are identifiable. | Admins can list all keys with GET /v1/organizations/api_keys (List API Keys); each entry shows the principal, so personal keys are identifiable. |
| Protect: Admin can block or require approval | Yes | Disable / Re-enable API key; Member API key creation setting | Disable / Re-enable API key: Console Settings > API keys, or POST /v1/organizations/api_keys/{api_key_id} status=inactive · Member API key creation setting: Org setting; UI path not stated |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No customer IP allowlist for Claude API requests found in fetched docs; the IP addresses page only lists Anthropic's own ranges. |  |
| Protect: Expires automatically | Partial | Chosen at creation (3h/1d/7d/30d/custom/Never); org max expiration policy can remove Never | Where: Console > API keys (platform.claude.com/settings/keys): expiration chosen at Create key; table shows each key's expiration · API: GET /v1/organizations/api_keys (expires_at) |
| Detect: Usage appears in logs | Yes | actor.api_key_id | Compliance API Activity Feed (GET /v1/compliance/activities): Must be enabled; 6-year retention; not retroactive. Admin API keys can read it. · Usage and Cost API: Aggregated usage filterable by API key. |
| Detect: Data reads appear in logs | Yes | platform_file_content_downloaded | API: GET /v1/compliance/activities?activity_types[]=platform_file_content_downloaded; match actor.api_key_id client-side (actor_ids[] accepts only user_ IDs) |
| Respond: Revocation ends active access | No docs found | Docs say the key stops working but give no timing. |  |
| Respond: Stops working when user is removed | Yes | Personal keys are archived and stop working when the user is removed from the organization. | API: DELETE /v1/organizations/users/{user_id} (400 if SCIM manages membership; remove in IdP instead) · Command: ant organization:users remove --user-id <user_id> |

## Protect: what an admin can configure

### Admin controls
- **Maximum expiration policy** (Limit lifetime; all plans; default off). Console limits key expiration to the policy maximum and removes Never. Where: Organization policy (UI path not stated).
- **Disable / Re-enable API key** (Disable; all plans; default unknown). Reversibly sets the key to inactive. Where: Console Settings > API keys, or POST /v1/organizations/api_keys/{api_key_id} status=inactive.
- **Workspace-scoped keys** (Limit resources; all plans; default varies). A key created for one workspace only works there and cannot reach the Admin API. Where: Key creation.
- **Member API key creation setting** (Disable; all plans; default unknown). Org setting that allows members to create new API keys (changes logged as api_key_creation_enabled). Where: Org setting; UI path not stated.
- **Compliance API (Activity Feed)** (Other; Eligible organizations (self-service) or via account team; default off). Must be on for key and federation activity to be recorded. Where: Claude Console > Settings > Security > Compliance API.

- Network: unknown (checked at unknown). No customer IP allowlist for Claude API requests found in fetched docs; the IP addresses page only lists Anthropic's own ranges.
- Lifetime: Chosen at creation (3h/1d/7d/30d/custom/Never); org max expiration policy can remove Never. Renewal: Expired keys cannot be reactivated; create a new key.
- Keyless option: not_verified. Fetched docs do not say whether API keys are subject to SSO or IdP conditional access.
- Conditions: An org-wide (unscoped) personal key also works on the Admin API with the user's permissions.

## Detect: what gets logged
- Token prefix: `sk-ant-api`

### Logs
- Compliance API Activity Feed (GET /v1/compliance/activities): Must be enabled; 6-year retention; not retroactive. Admin API keys can read it.
- Usage and Cost API: Aggregated usage filterable by API key.

### Fields that identify the credential
- `actor.api_key_id` (Activity Feed (api_actor)): Customer-issued API key

### Lifecycle events
- create: `platform_api_key_created` 
- update: `platform_api_key_updated` Includes status changes

### Correlate on
`actor.api_key_id`, `actor.ip_address`, `actor.user_agent`, `workspace id`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/models`. Key is valid; available models Logged: unknown. 
- collection (bulk): `GET /v1/files then GET /v1/files/{file_id}/content`. Files uploaded to the workspace Logged: yes (`platform_file_content_downloaded`). Requires Compliance API enabled
- recon: `GET /v1/organizations/me`. Organization of the credential Logged: unknown. 

### What to look for (analyst guidance)
- New platform_api_key_created outside change window
- platform_file_content_downloaded bursts
- Key used from unfamiliar ip_address

## Respond: how to revoke it
- Admin: **Delete API key (archive)**. Permanently archives the key. Where: Console Settings > API keys, or Update API Key status=archived.
- Admin: **Archive workspace**. Archives every key created for the workspace within seconds. Where: Console Settings > Workspaces or Admin API.
- Admin: **Remove user / archive service account**. Personal keys stop on user removal; service account keys stop on account archive. Where: Console or Admin API.

Disable (reversible) or delete (archive) the key; or remove the user from the org. Live access ends on revocation: unknown. Docs say the key stops working but give no timing.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Revocation ends active access
- Per-request inference events
- Customer IP allowlisting for Claude API requests (not found in docs).
- Whether keys or OAuth tokens are subject to SSO / IdP conditional access.
- Whether disabling a key or archiving a rule ends already-minted WIF tokens immediately.
- Lifetime and admin revocation of ant CLI OAuth tokens.
- Console UI path for the maximum expiration policy and the member API key creation setting.
- Whether Messages API calls generate Activity Feed events (feed excludes prompt/response text).

## Sources
- [Authentication](https://platform.claude.com/docs/en/manage-claude/authentication) (retrieved 2026-10-14)
- [Admin API](https://platform.claude.com/docs/en/manage-claude/admin-api) (retrieved 2026-10-14)
- [Workspaces](https://platform.claude.com/docs/en/manage-claude/workspaces) (retrieved 2026-10-14)
- [List API Keys](https://platform.claude.com/docs/en/api/organization/api_keys/list) (retrieved 2026-10-14)
- [Compliance API Activity Feed](https://platform.claude.com/docs/en/manage-claude/compliance-activity-feed) (retrieved 2026-10-14)
- [Query compliance activities](https://platform.claude.com/docs/en/api/compliance/activities/list) (retrieved 2026-10-14)
- [User management](https://platform.claude.com/docs/en/manage-claude/user-management) (retrieved 2026-10-14)
- [Admin API overview](https://platform.claude.com/docs/en/manage-claude/administration-api) (retrieved 2026-10-14)
- [Compliance API FAQ](https://platform.claude.com/docs/en/manage-claude/compliance-faq) (retrieved 2026-10-14)
- [Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) (retrieved 2026-10-14)
- [API overview](https://platform.claude.com/docs/en/api/overview) (retrieved 2026-10-14)
- [API Keys (Admin API reference)](https://platform.claude.com/docs/en/api/organization/api_keys) (retrieved 2026-10-14)
- [Manage WIF with the Admin API](https://platform.claude.com/docs/en/manage-claude/wif-admin-api) (retrieved 2026-10-14)
- [Set up the Compliance API](https://platform.claude.com/docs/en/manage-claude/compliance-api-access) (retrieved 2026-10-14)
