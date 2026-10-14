# LiteLLM: OIDC / JWT-based auth (incl. Kubernetes ServiceAccount tokens)

`litellm-4` · Signed JWT · person or service. With enable_jwt_auth, the proxy accepts IdP-signed JWTs as bearer tokens, validated against configured JWKS URLs; claims map to users, teams and admin scope.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | enable_jwt_auth | enable_jwt_auth: general_settings.enable_jwt_auth in config.yaml |
| Protect: SSO and MFA rules apply | Partial | Tokens are issued by the operator's own OpenID provider, so IdP policy applies at issuance; LiteLLM only verifies signature and claims at use. | Where: config.yaml general_settings: enable_jwt_auth: true; env JWT_PUBLIC_KEY_URL=<IdP JWKS URL>, JWT_AUDIENCE; or litellm_jwtauth.issuers per issuer. IdP MFA/SSO policy applies at token issuance. |
| Protect: IP restriction | Conditional (requires Enterprise) | Proxy-wide allowed_ips only (Enterprise). | allowed_ips: general_settings.allowed_ips |
| Protect: Expires automatically | Yes | Set by the IdP via exp; proxy checks exp | Where: Set token lifetime at the OpenID provider (exp claim); proxy verifies exp on every request |
| Detect: Usage appears in logs | Yes | user_api_key_user_id / user_api_key_team_id | Audit Logs (LiteLLM_AuditLog): Enterprise; on by default with license, else store_audit_logs: true. UI Logs -> Audit Logs; export via audit_log_callbacks (e.g. S3). Retention is your DB. · Spend logs (LiteLLM_SpendLogs): Per-request rows with key hash; no prompt content by default; can be disabled; retention via maximum_spend_logs_retention_period. |
| Detect: Data reads appear in logs | Yes | LiteLLM_SpendLogs row | Where: Admin UI > Logs · API: GET /spend/logs/v2?start_date=...&end_date=...&user_id=<value> |
| Respond: Revocation ends active access | Partial | Issued JWTs remain valid until exp unless the issuer is removed; JWKS cached for public_key_ttl. | Where: Remove the issuer from JWT_PUBLIC_KEY_URL / litellm_jwtauth.issuers in config, or rotate IdP signing keys; restart the proxy or wait public_key_ttl (default 600s) |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **allowed_ips** (Limit network; Enterprise; default off). Only listed client IPs can call proxy endpoints; others get 403. Where: general_settings.allowed_ips.
- **JWT audience/issuer validation** (Limit scope; Enterprise; default off). JWT_AUDIENCE/JWT_ISSUER or litellm_jwtauth.issuers restrict which tokens are accepted; unset means any token from listed providers is accepted. Where: JWT_AUDIENCE, JWT_ISSUER, litellm_jwtauth.issuers.
- **enable_jwt_auth** (Disable; Enterprise; default off). JWT tokens are only checked when this config setting is on; leaving it unset means JWT auth is not accepted. Where: general_settings.enable_jwt_auth in config.yaml.

- Network: conditional (checked at api_request). Proxy-wide allowed_ips only (Enterprise).
- Lifetime: Set by the IdP via exp; proxy checks exp. Renewal: Client obtains a new JWT from its IdP.
- Keyless option: supported. Any OIDC issuer with JWKS, including Kubernetes service account tokens. Audience/issuer checks are optional unless configured.
- Conditions: Enterprise license.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit Logs (LiteLLM_AuditLog): Enterprise; on by default with license, else store_audit_logs: true. UI Logs -> Audit Logs; export via audit_log_callbacks (e.g. S3). Retention is your DB.
- Spend logs (LiteLLM_SpendLogs): Per-request rows with key hash; no prompt content by default; can be disabled; retention via maximum_spend_logs_retention_period.

### Fields that identify the credential
- `user_api_key_user_id / user_api_key_team_id` (Spend logs): Mapped from JWT claims

### Lifecycle events
No docs found.

### Correlate on
`JWT sub / team claim`, `user_api_key_user_id`

### API calls a holder can make, and whether they are logged
- collection: `POST /v1/chat/completions`. Model access Logged: yes (`LiteLLM_SpendLogs row`). 
- enumeration: `POST /key/generate`. Mint a virtual key with the JWT (shown in docs) Logged: plan (`create (LiteLLM_VerificationToken)`). Audit logs need Enterprise/store_audit_logs

### What to look for (analyst guidance)
- Tokens from unexpected issuer when JWT_AUDIENCE/JWT_ISSUER unset

## Respond: how to revoke it


Revoke at the IdP, remove the issuer/JWKS URL from config, or rotate signing keys. Live access ends on revocation: partial. Issued JWTs remain valid until exp unless the issuer is removed; JWKS cached for public_key_ttl.

## No vendor documentation found
- Admin can list all of them
- Stops working when user is removed
- Exact log fields for JWT-authenticated requests
- Whether /key/delete and /key/block take effect instantly or after an auth-cache TTL (only SCIM deprovisioning is documented as clearing the cache).
- Master key expiry and SCIM token expiry, rotation and revocation steps.
- Whether management GET calls (/key/info, /key/list, /spend/logs) are logged anywhere besides server logs.
- Whether allowed_ips applies to /scim routes.

## Sources
- [OIDC - JWT-based Auth](https://docs.litellm.ai/docs/proxy/token_auth) (retrieved 2026-10-14)
- [IP Address Filtering](https://docs.litellm.ai/docs/proxy/ip_address) (retrieved 2026-10-14)
- [Spend Tracking](https://docs.litellm.ai/docs/proxy/cost_tracking) (retrieved 2026-10-14)
- [Getting Started with UI Logs](https://docs.litellm.ai/docs/proxy/ui_logs) (retrieved 2026-10-14)
- [What is stored in the DB](https://docs.litellm.ai/docs/proxy/db_info) (retrieved 2026-10-14)
- [Audit Logs](https://docs.litellm.ai/docs/proxy/multiple_admins) (retrieved 2026-10-14)
