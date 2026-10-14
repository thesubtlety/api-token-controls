# LiteLLM: SCIM token

`litellm-5` · API key / token · service. Bearer token created under Settings > Admin Settings > SCIM, used by the IdP to call /scim endpoints.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | allowed_ips applies to proxy endpoints; /scim/v2 routes use the same user_api_key_auth path that runs the IP check (from source). Docs do not name /scim routes explicitly. Enterprise. | Where: config.yaml general_settings: allowed_ips: ["<ip>"] (Enterprise) |
| Protect: Expires automatically | No docs found | Not documented |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Audit Logs (LiteLLM_AuditLog): Enterprise; on by default with license, else store_audit_logs: true. UI Logs -> Audit Logs; export via audit_log_callbacks (e.g. S3). Retention is your DB. · Spend logs (LiteLLM_SpendLogs): Per-request rows with key hash; no prompt content by default; can be disabled; retention via maximum_spend_logs_retention_period. |
| Detect: Data reads appear in logs | Not available | Audit logs track only Create, Update, Delete and Regenerate on keys, teams, users and models; reads are outside that scope. Enterprise. |  |
| Respond: Revocation ends active access | No docs found | Not documented; manage in Settings > Admin Settings > SCIM. |  |
| Respond: Stops working when user is removed | N/A | Token is created for the IdP provisioning connection, not a person. |  |

## Protect: what an admin can configure

### Admin controls
No docs found.

- Network: supported (checked at api_request). allowed_ips applies to proxy endpoints; /scim/v2 routes use the same user_api_key_auth path that runs the IP check (from source). Docs do not name /scim routes explicitly. Enterprise.
- Lifetime: Not documented. Renewal: Create a new token in the UI; rotation/revocation steps not documented.
- Keyless option: not_applicable. Static token held by the IdP.
- Conditions: SCIM setup.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit Logs (LiteLLM_AuditLog): Enterprise; on by default with license, else store_audit_logs: true. UI Logs -> Audit Logs; export via audit_log_callbacks (e.g. S3). Retention is your DB.
- Spend logs (LiteLLM_SpendLogs): Per-request rows with key hash; no prompt content by default; can be disabled; retention via maximum_spend_logs_retention_period.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
No docs found.

### API calls a holder can make, and whether they are logged
- collection: `GET /scim/v2/Users`. Proxy users and emails Logged: no. Audit logs track only Create, Update, Delete and Regenerate on keys, teams, users and models; reads are outside that scope. Enterprise.

### What to look for (analyst guidance)
- Unexpected SCIM user/team changes

## Respond: how to revoke it


Not documented; manage in Settings > Admin Settings > SCIM. Live access ends on revocation: unknown. 

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- Expires automatically
- Revocation ends active access
- Revocation steps
- Logging of SCIM calls
- SCIM endpoints a holder could read (e.g. user lists) not documented in fetched pages
- Whether /key/delete and /key/block take effect instantly or after an auth-cache TTL (only SCIM deprovisioning is documented as clearing the cache).
- Master key expiry and SCIM token expiry, rotation and revocation steps.
- Whether management GET calls (/key/info, /key/list, /spend/logs) are logged anywhere besides server logs.
- Whether allowed_ips applies to /scim routes.

## Sources
- [SCIM with LiteLLM](https://docs.litellm.ai/docs/tutorials/scim_litellm) (retrieved 2026-10-14)
- [IP Address Filtering](https://docs.litellm.ai/docs/proxy/ip_address) (retrieved 2026-10-14)
- [LiteLLM source: SCIM v2 routes](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/management_endpoints/scim/scim_v2.py) (retrieved 2026-10-14)
- [LiteLLM source: pre_db_read_auth_checks](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/auth/auth_utils.py) (retrieved 2026-10-14)
- [Audit Logs](https://docs.litellm.ai/docs/proxy/multiple_admins) (retrieved 2026-10-14)
