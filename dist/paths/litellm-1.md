# LiteLLM: Master key (LITELLM_MASTER_KEY)

`litellm-1` · API key / token · service. A single static bearer secret set in config or env. It is the proxy admin credential: it calls admin APIs, mints other keys, and by default also logs into the Admin UI.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Not available | Disabling env-credential UI login does not stop the master key on the API. |  |
| Protect: SSO and MFA rules apply | Not available | disable_env_credential_login only stops master-key login on the Admin UI page; the master key keeps authenticating admin API calls and is the documented recovery path when UI login is locked down. |  |
| Protect: IP restriction | Conditional (requires Enterprise) | general_settings.allowed_ips restricts which IPs can call any proxy endpoint (Enterprise). Not per-key. | allowed_ips: general_settings.allowed_ips |
| Protect: Expires automatically | Not available | No expiry documented; valid until changed and proxy restarted |  |
| Detect: Usage appears in logs | Yes | changed_by_api_key | Audit Logs (LiteLLM_AuditLog): Enterprise; on by default with license, else store_audit_logs: true. UI Logs -> Audit Logs; export via audit_log_callbacks (e.g. S3). Retention is your DB. · Spend logs (LiteLLM_SpendLogs): Per-request rows with key hash; no prompt content by default; can be disabled; retention via maximum_spend_logs_retention_period. |
| Detect: Data reads appear in logs | Yes | LiteLLM_SpendLogs row | Where: Admin UI > Logs (filter by key alias) · API: GET /spend/logs/v2?start_date=...&end_date=...&api_key=<value> |
| Respond: Revocation ends active access | Yes | Restart loads the new value; old value no longer matches. | POST /key/block or /key/delete; for master key, change LITELLM_MASTER_KEY and restart all instances. |
| Respond: Stops working when user is removed | N/A | Single deployment-wide secret set in config/env, not tied to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **allowed_ips** (Limit network; Enterprise; default off). Only listed client IPs can call proxy endpoints; others get 403. Where: general_settings.allowed_ips.
- **disable_env_credential_login** (Other; all plans; default off). Stops the master key and UI_USERNAME/UI_PASSWORD from logging into the Admin UI; API use of the master key continues. Where: general_settings.disable_env_credential_login: true.
- **store_audit_logs** (Other; Enterprise; default varies). Records create/update/delete/regenerate of keys, teams, users, models. Where: litellm_settings.store_audit_logs.

### Not available (vendor states)
- Failed-login rate limiting does not cover use of the master key as an API bearer token.
- Disabling env-credential UI login does not stop the master key on the API.

- Network: conditional (checked at api_request). general_settings.allowed_ips restricts which IPs can call any proxy endpoint (Enterprise). Not per-key.
- Lifetime: No expiry documented; valid until changed and proxy restarted. Renewal: Set a new value in env/config and restart all instances (or POST /key/regenerate with new_master_key when no salt key).
- Keyless option: not_applicable. Static shared secret; SSO covers only the Admin UI and the master key keeps working on the API.
- Conditions: Self-hosted; operator-managed.

## Detect: what gets logged
- Token prefix: `sk-`

### Logs
- Audit Logs (LiteLLM_AuditLog): Enterprise; on by default with license, else store_audit_logs: true. UI Logs -> Audit Logs; export via audit_log_callbacks (e.g. S3). Retention is your DB.
- Spend logs (LiteLLM_SpendLogs): Per-request rows with key hash; no prompt content by default; can be disabled; retention via maximum_spend_logs_retention_period.

### Fields that identify the credential
- `changed_by_api_key` (Audit log): Hashed key used

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
- Any admin action attributed to the master key
- UI logins with env credentials (banner shown while enabled)

## Respond: how to revoke it
- Admin: **Master key rotation**. Replace the master key value and restart every proxy instance. Where: LITELLM_MASTER_KEY / general_settings.master_key; POST /key/regenerate with new_master_key when no salt key.

POST /key/block or /key/delete; for master key, change LITELLM_MASTER_KEY and restart all instances. Live access ends on revocation: yes. Restart loads the new value; old value no longer matches.

## No vendor documentation found
- Admin can list all of them
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
- [Quick Start (Admin UI)](https://docs.litellm.ai/docs/proxy/ui) (retrieved 2026-10-14)
- [Production Best Practices](https://docs.litellm.ai/docs/proxy/prod) (retrieved 2026-10-14)
- [Spend Tracking](https://docs.litellm.ai/docs/proxy/cost_tracking) (retrieved 2026-10-14)
- [Getting Started with UI Logs](https://docs.litellm.ai/docs/proxy/ui_logs) (retrieved 2026-10-14)
- [Audit Logs](https://docs.litellm.ai/docs/proxy/multiple_admins) (retrieved 2026-10-14)
- [StandardLoggingPayload spec](https://docs.litellm.ai/docs/proxy/logging_spec) (retrieved 2026-10-14)
- [SCIM with LiteLLM](https://docs.litellm.ai/docs/tutorials/scim_litellm) (retrieved 2026-10-14)
- [Deleted Keys & Teams Audit Logs](https://docs.litellm.ai/docs/proxy/deleted_keys_teams) (retrieved 2026-10-14)
- [What is stored in the DB](https://docs.litellm.ai/docs/proxy/db_info) (retrieved 2026-10-14)
- [Role-based Access Controls (RBAC)](https://docs.litellm.ai/docs/proxy/access_control) (retrieved 2026-10-14)
