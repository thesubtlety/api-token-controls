# Glean: Indexing API token

`glean-3` · API key / token · service. Glean-issued bearer token for /api/index/v1 (push documents, permissions, datasources). Global or limited to selected datasources. OAuth is not accepted.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin console > Platform > API tokens (Indexing Tokens tab). | Admin console > Platform > API tokens (Indexing Tokens tab). |
| Protect: Admin can block or require approval | Yes | Token creation roles | Token creation roles: Admin console > User roles |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Optional per-token Greenlisted IPs (CIDR); requests from other IPs get 403. | Greenlisted IPs: Indexing token creation > Greenlisted IPs |
| Protect: Expires automatically | Yes | Expiry date required at creation | Expires On (required): Indexing token creation · Rotation Period: Indexing token creation > Rotation Settings |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Where: Admin console → Users & permissions → Audit logs; filter, Export to CSV (config changes only) |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | No docs found | After a rotation the old secret works for 10 more minutes. |  |
| Respond: Stops working when user is removed | N/A | Indexing tokens give service-level access, not user access. |  |

## Protect: what an admin can configure

### Admin controls
- **Token creation roles** (Require approval; all plans; default on). Only admin roles or API Token Creator can create tokens; global scope needs Super Admin. Where: Admin console > User roles.
- **Greenlisted IPs** (Limit network; all plans; default off). Per-token CIDR allowlist enforced on Indexing API requests. Where: Indexing token creation > Greenlisted IPs.
- **Expires On (required)** (Limit lifetime; all plans; default on). Indexing tokens must have an expiry date. Where: Indexing token creation.
- **Rotation Period** (Require rotation; all plans; default off). Token must be rotated via /rotatetoken within the set period (min 24h). Where: Indexing token creation > Rotation Settings.

### Not available (vendor states)
- OAuth/federated auth is not available for the Indexing API; only static Glean-issued tokens.

- Network: supported (checked at api_request). Optional per-token Greenlisted IPs (CIDR); requests from other IPs get 403.
- Lifetime: Expiry date required at creation. Renewal: Optional rotation via /rotatetoken (min period 24h); old secret works 10 more minutes.
- Keyless option: not_applicable. Glean-issued only.
- Conditions: Revoke from the API tokens page.

## Detect: what gets logged
- Token prefix: `glean_`

### Logs
- Admin audit logs: Config changes; 30 days default.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`datasource name`

### API calls a holder can make, and whether they are logged
- recon: `POST /api/index/v1/getdatasourceconfig`. Datasource config Logged: unknown. 

### What to look for (analyst guidance)
- 403 IP not allowed errors
- Unexpected permission or document updates in a datasource

## Respond: how to revoke it
- Admin: **Revoke API token**. Revokes a Glean-issued token. Where: Admin console > Platform > API tokens.

Revoke the token in API tokens (Indexing tab). Live access ends on revocation: unknown. After a rotation the old secret works for 10 more minutes.

## No vendor documentation found
- SSO and MFA rules apply
- Data reads appear in logs
- Revocation ends active access
- Logging of indexing API calls
- Whether revoking a Glean-issued API token takes effect immediately
- Whether user deprovisioning revokes that user's Glean-issued API tokens
- Whether admin audit logs record API token create/revoke (coverage list does not mention tokens)
- Per-token IP allowlist for Client API tokens
- Default OAuth server state (admin docs: off; developer docs: on)
- Where the tenant-wide IP greenlist is configured and whether customers manage it
- EMA token lifetime

## Sources
- [Indexing API Authentication](https://developers.glean.com/api-info/indexing/authentication/overview) (retrieved 2026-10-14)
- [Token Rotation](https://developers.glean.com/api-info/indexing/authentication/token-rotation) (retrieved 2026-10-14)
- [Rotate token](https://developers.glean.com/api/indexing-api/rotate-token) (retrieved 2026-10-14)
- [API Tokens | Glean Docs](https://docs.glean.com/administration/developer/api-tokens) (retrieved 2026-10-14)
- [Audit Logs | Glean Docs](https://docs.glean.com/administration/management/audit-logs/admin-audit-logs) (retrieved 2026-10-14)
- [Get datasource config](https://developers.glean.com/api/indexing-api/get-datasource-config) (retrieved 2026-10-14)
- [Glean-Issued Tokens for Client API](https://developers.glean.com/api-info/client/authentication/glean-issued) (retrieved 2026-10-14)
- [Administrator Roles](https://docs.glean.com/administration/identity/roles/admin-roles) (retrieved 2026-10-14)
