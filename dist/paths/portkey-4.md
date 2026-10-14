# Portkey: JWT Authentication

`portkey-4` · Signed JWT · person or service. Clients send an RS256 JWT instead of an API key; Portkey validates it against JWKS configured on the organisation. Claims carry org, workspace and scopes.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | Yes | exp claim required; set by issuer | Where: Set by the issuer via the JWT exp claim (mandatory); check exp in the token payload |
| Detect: Usage appears in logs | Yes | email_id / sub / uid | Audit Logs: Enterprise; Admin Settings > Audit Logs or GET /audit-logs (admin key with audit_logs.list); indefinite retention; filter by user_type=api_key. · Request Logs: Gateway request logs with full request/response; retention 3 days Developer, 30 days Production, unlimited Enterprise. |
| Detect: Data reads appear in logs | Conditional | Audit action 'Export' exists (Enterprise) | Where: Admin Settings > Audit Logs > filter Action = Export · API: GET https://api.portkey.ai/v1/audit-logs?action=<export> |
| Respond: Revocation ends active access | Partial | Valid JWTs work until exp unless JWKS removed. | Where: Admin Settings > Organisation > Authentication > remove the key (kid) from JWKS URL/JWKS JSON; then revoke at the issuer |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **JWKS configuration** (Limit scope; Enterprise; default off). Only JWTs signed by configured JWKS are accepted; remove JWKS to stop JWT auth. Where: Admin Settings > Organisation > Authentication.

- Network: unknown (checked at unknown). Not documented.
- Lifetime: exp claim required; set by issuer. Renewal: Client mints/obtains a new JWT.
- Keyless option: supported. Any issuer whose JWKS URL/JSON is configured; user identified from email_id, sub or uid.
- Conditions: Enterprise.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit Logs: Enterprise; Admin Settings > Audit Logs or GET /audit-logs (admin key with audit_logs.list); indefinite retention; filter by user_type=api_key.
- Request Logs: Gateway request logs with full request/response; retention 3 days Developer, 30 days Production, unlimited Enterprise.

### Fields that identify the credential
- `email_id / sub / uid` (Request logs/metrics): User attribution precedence

### Lifecycle events
No docs found.

### Correlate on
`email_id`, `sub`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/models`. Models available to the key Logged: unknown. 
- enumeration (bulk): `GET /v1/api-keys`. API keys in scope Logged: unknown. Audit method filter lists only POST/PUT/DELETE
- enumeration (bulk): `GET /v1/integrations`. Stored provider integrations Logged: unknown. 
- collection (bulk): `POST /v1/logs/exports`. Bulk export of request logs (full prompts/responses) Logged: plan (`Export`). Audit action 'Export' exists (Enterprise)

### What to look for (analyst guidance)
- JWTs with broad scopes or long exp

## Respond: how to revoke it


Remove or rotate the JWKS entry; revoke at issuer. Live access ends on revocation: partial. Valid JWTs work until exp unless JWKS removed.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Stops working when user is removed
- JWKS cache duration
- Whoami endpoint
- IP allowlisting for API keys or JWTs
- Name of the org/workspace maximum key TTL setting
- Whether user API keys are disabled when the user is removed or deprovisioned via SCIM
- Whether SSO enforcement affects API keys
- Whether GET (read) API calls appear in audit logs (filter lists only POST/PUT/DELETE)
- Auth cache delay after key deletion
- SCIM token expiry and revocation
- API key token prefix

## Sources
- [JWT Authentication](https://docs.portkey.ai/docs/product/enterprise-offering/org-management/jwt) (retrieved 2026-10-14)
- [Audit Logs](https://docs.portkey.ai/docs/product/enterprise-offering/audit-logs) (retrieved 2026-10-14)
- [List Audit Logs](https://docs.portkey.ai/docs/api-reference/admin-api/control-plane/audit-logs/list-audit-logs) (retrieved 2026-10-14)
- [List Models](https://docs.portkey.ai/docs/api-reference/inference-api/models/models) (retrieved 2026-10-14)
- [List API Keys](https://docs.portkey.ai/docs/api-reference/admin-api/control-plane/api-keys/list-api-keys) (retrieved 2026-10-14)
- [Create a Log Export](https://docs.portkey.ai/docs/api-reference/admin-api/data-plane/logs/log-exports-beta/create-a-log-export) (retrieved 2026-10-14)
- [Logs](https://docs.portkey.ai/docs/product/observability/logs) (retrieved 2026-10-14)
- [API Keys (AuthN and AuthZ)](https://docs.portkey.ai/docs/product/enterprise-offering/org-management/api-keys-authn-and-authz) (retrieved 2026-10-14)
