# LiteLLM: Virtual keys (user and team keys)

`litellm-2` · API key / token · person or service. sk- bearer keys created via /key/generate or the Admin UI, optionally owned by a user and/or team. Management-route rights follow the owning user's role, so an admin-owned key can call admin endpoints.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin UI Virtual Keys page / GET /key/list; the proxy_admin_viewer role can view all keys. | Admin UI Virtual Keys page / GET /key/list; the proxy_admin_viewer role can view all keys. |
| Protect: Admin can block or require approval | Yes | key/block; key_generation_settings | key/block: POST /key/block · key_generation_settings: litellm_settings.key_generation_settings |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional (requires Enterprise) | Only the proxy-wide allowed_ips list (Enterprise); no per-key IP list documented. | allowed_ips: general_settings.allowed_ips |
| Protect: Expires automatically | Partial | Optional duration per key; can be 'Never expires'; admins can cap via upperbound_key_generate_params or custom_key_policy | upperbound_key_generate_params: litellm_settings.upperbound_key_generate_params · custom_key_policy: general_settings.custom_key_policy · Scheduled key rotation (auto_rotate): auto_rotate + rotation_interval on key; LITELLM_KEY_ROTATION_ENABLED=true |
| Detect: Usage appears in logs | Yes | changed_by_api_key, user_api_key_hash, object_id (table_name=LiteLLM_VerificationToken) | Audit Logs (LiteLLM_AuditLog): Enterprise; on by default with license, else store_audit_logs: true. UI Logs -> Audit Logs; export via audit_log_callbacks (e.g. S3). Retention is your DB. · Spend logs (LiteLLM_SpendLogs): Per-request rows with key hash; no prompt content by default; can be disabled; retention via maximum_spend_logs_retention_period. |
| Detect: Data reads appear in logs | Yes | LiteLLM_SpendLogs row | Where: Admin UI > Logs (filter by key alias) · API: GET /spend/logs/v2?start_date=...&end_date=...&api_key=<value> |
| Respond: Revocation ends active access | Partial | Block/delete is immediate on the worker that handles it. Without Redis, other workers keep accepting the key until their cache entry expires (user_api_key_cache_ttl, default 60 s). SCIM deprovisioning is documented as immediate. | POST /key/block or /key/delete; for master key, change LITELLM_MASTER_KEY and restart all instances. |
| Respond: Stops working when user is removed | Yes | User-only keys are deleted when the user is deleted, and SCIM deprovisioning blocks the user's keys and clears them from the auth cache. Team service-account keys persist (see litellm-3). | API: POST /user/delete {"user_ids": [...]} (deletes user-only keys); SCIM: PATCH/PUT /scim/v2/Users/{id} active=false or DELETE /scim/v2/Users/{id} (blocks keys) |

## Protect: what an admin can configure

### Admin controls
- **key/block** (Disable; all plans; default off). Blocks a virtual key; /key/unblock re-enables it. Where: POST /key/block.
- **key_generation_settings** (Disable; all plans; default off). Limits which user or team roles may create personal or team keys, and can require params. Where: litellm_settings.key_generation_settings.
- **upperbound_key_generate_params** (Limit lifetime; all plans; default off). Rejects key requests above a max duration, budget or rate limit. Where: litellm_settings.upperbound_key_generate_params.
- **custom_key_policy** (Limit lifetime; all plans; default off). Custom Python hook that can deny any key create, update or regenerate (e.g. require expiry within 7 days). Where: general_settings.custom_key_policy.
- **allowed_routes** (Limit scope; all plans; default off). Restricts which proxy routes a key can call, including admin-owned keys. Where: allowed_routes on /key/generate or /key/update.
- **team_member_permissions** (Limit scope; all plans; default on). Controls which key-management routes team members may call; default is read-only key info. Where: team_member_permissions on the team.
- **allowed_ips** (Limit network; Enterprise; default off). Only listed client IPs can call proxy endpoints; others get 403. Where: general_settings.allowed_ips.
- **Scheduled key rotation (auto_rotate)** (Require rotation; Enterprise; default off). Background job regenerates keys on rotation_interval and invalidates the old string. Where: auto_rotate + rotation_interval on key; LITELLM_KEY_ROTATION_ENABLED=true.
- **store_audit_logs** (Other; Enterprise; default varies). Records create/update/delete/regenerate of keys, teams, users, models. Where: litellm_settings.store_audit_logs.

- Network: conditional (checked at api_request). Only the proxy-wide allowed_ips list (Enterprise); no per-key IP list documented.
- Lifetime: Optional duration per key; can be 'Never expires'; admins can cap via upperbound_key_generate_params or custom_key_policy. Renewal: POST /key/{key}/regenerate (Enterprise) issues a new secret; old one revoked immediately unless grace_period; optional scheduled auto_rotate.
- Keyless option: not_applicable. Static keys; SSO is for the Admin UI only. JWT auth is the documented alternative to long-lived keys.
- Conditions: Rotation and audit logs need Enterprise.

## Detect: what gets logged
- Token prefix: `sk-`

### Logs
- Audit Logs (LiteLLM_AuditLog): Enterprise; on by default with license, else store_audit_logs: true. UI Logs -> Audit Logs; export via audit_log_callbacks (e.g. S3). Retention is your DB.
- Spend logs (LiteLLM_SpendLogs): Per-request rows with key hash; no prompt content by default; can be disabled; retention via maximum_spend_logs_retention_period.

### Fields that identify the credential
- `changed_by_api_key` (Audit log): Hashed key that performed the admin action
- `user_api_key_hash` (Spend logs / logging payload): sha256 hash of virtual key
- `object_id (table_name=LiteLLM_VerificationToken)` (Audit log): Key affected by the action

### Lifecycle events
- create: `create (LiteLLM_VerificationToken)` Audit log action create
- modify: `update (LiteLLM_VerificationToken)` Includes block/unblock via update
- revoke: `delete (LiteLLM_VerificationToken)` Also shown in Deleted Keys view
- rotate: `Regenerate` Listed as tracked action
- use: `LiteLLM_SpendLogs row` LLM requests only

### Correlate on
`user_api_key_hash`, `user_api_key_alias`, `user_api_key_user_id`, `user_api_key_team_id`, `x-litellm-call-id`

### API calls a holder can make, and whether they are logged
- recon: `GET /key/info?key=<key>`. Key spend, models, expiry, metadata Logged: unknown. Not in audit log action list (create/update/delete/regenerate)
- enumeration (bulk): `GET /key/list`. Keys visible to caller Logged: unknown. Admin-owned keys can call management routes
- collection (bulk): `GET /spend/logs`. Request logs; prompts only if store_prompts_in_spend_logs Logged: unknown. 
- collection: `POST /chat/completions`. Model access on proxy credit Logged: yes (`LiteLLM_SpendLogs row`). Unless disable_spend_logs

### What to look for (analyst guidance)
- Key created by an admin-owned key with no user_id
- New keys with no duration (never expire)
- Spend spikes per key hash
- Requests from IPs outside normal ranges (if logged by your ingress)

## Respond: how to revoke it
- Admin: **key/delete**. Deletes a virtual key; deletion is recorded in audit logs and the Deleted Keys view. Where: POST /key/delete; Admin UI Keys page.
- Admin: **Key regenerate (rotation)**. Issues a new secret; old secret is revoked immediately unless a grace_period is set. Where: POST /key/{key}/regenerate.
- Admin: **SCIM user deprovisioning**. Deprovisioning a user blocks all keys they own and clears them from the auth cache. Where: IdP SCIM push / DELETE /scim/v2/Users/{id}.

POST /key/block or /key/delete; for master key, change LITELLM_MASTER_KEY and restart all instances. Live access ends on revocation: partial. Block/delete is immediate on the worker that handles it. Without Redis, other workers keep accepting the key until their cache entry expires (user_api_key_cache_ttl, default 60 s). SCIM deprovisioning is documented as immediate.

## No vendor documentation found
- SSO and MFA rules apply
- Whether management reads are audited
- Whether management GETs are logged
- Whether /key/delete and /key/block take effect instantly or after an auth-cache TTL (only SCIM deprovisioning is documented as clearing the cache).
- Master key expiry and SCIM token expiry, rotation and revocation steps.
- Whether management GET calls (/key/info, /key/list, /spend/logs) are logged anywhere besides server logs.
- Whether allowed_ips applies to /scim routes.

## Sources
- [Virtual Keys](https://docs.litellm.ai/docs/proxy/virtual_keys) (retrieved 2026-10-14)
- [Rotating the Master Key](https://docs.litellm.ai/docs/proxy/master_key_rotations) (retrieved 2026-10-14)
- [Security Best Practices](https://docs.litellm.ai/docs/proxy/security_best_practices) (retrieved 2026-10-14)
- [IP Address Filtering](https://docs.litellm.ai/docs/proxy/ip_address) (retrieved 2026-10-14)
- [Role-based Access Controls (RBAC)](https://docs.litellm.ai/docs/proxy/access_control) (retrieved 2026-10-14)
- [SCIM with LiteLLM](https://docs.litellm.ai/docs/tutorials/scim_litellm) (retrieved 2026-10-14)
- [Spend Tracking](https://docs.litellm.ai/docs/proxy/cost_tracking) (retrieved 2026-10-14)
- [Getting Started with UI Logs](https://docs.litellm.ai/docs/proxy/ui_logs) (retrieved 2026-10-14)
- [LiteLLM source: /user/delete endpoint docstring](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/management_endpoints/internal_user_endpoints.py) (retrieved 2026-10-14)
- [Audit Logs](https://docs.litellm.ai/docs/proxy/multiple_admins) (retrieved 2026-10-14)
- [StandardLoggingPayload spec](https://docs.litellm.ai/docs/proxy/logging_spec) (retrieved 2026-10-14)
- [Deleted Keys & Teams Audit Logs](https://docs.litellm.ai/docs/proxy/deleted_keys_teams) (retrieved 2026-10-14)
- [What is stored in the DB](https://docs.litellm.ai/docs/proxy/db_info) (retrieved 2026-10-14)
- [What Needs Redis](https://docs.litellm.ai/docs/proxy/redis_requirements) (retrieved 2026-10-14)
- [Production Best Practices](https://docs.litellm.ai/docs/proxy/prod) (retrieved 2026-10-14)
