# SailPoint Identity Security Cloud: API client (API key) - client credentials

`sailpoint-2` · OAuth · service. An admin creates an API client (client ID and secret) under API Management. The client calls /oauth/token with the client credentials grant and gets a JWT with no user context.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin > Global > Security Settings > API Management lists all API clients (also GET /oauth-clients). | Admin > Global > Security Settings > API Management lists all API clients (also GET /oauth-clients). |
| Protect: Admin can block or require approval | Yes | API client enabled flag | API client enabled flag: PATCH /oauth-clients/{id} (enabled) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Network Settings (CIDR network definition, country allow/block lists) restrict sign-in per identity profile and are skipped under SSO. Docs do not say they apply to /oauth/token or API calls. |  |
| Protect: Expires automatically | Partial | Client secret: no documented expiry; per-client accessTokenValiditySeconds Admin control: accessTokenValiditySeconds. | accessTokenValiditySeconds: POST/PATCH /personal-access-tokens, /oauth-clients |
| Detect: Usage appears in logs | Yes | client_id, lastUsed | Search > Events (events index, POST /search): Kept one year plus current month; older up to 5 years via support request. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Not documented whether issued access tokens die at once. |  |
| Respond: Stops working when user is removed | N/A | Docs say API keys (client credentials) are not tied to a specific person. |  |

## Protect: what an admin can configure

### Admin controls
- **accessTokenValiditySeconds** (Limit lifetime; all plans; default varies). Sets how long each issued bearer token lives (PAT default 43200s). Where: POST/PATCH /personal-access-tokens, /oauth-clients.
- **Scopes** (Limit scope; all plans; default varies). Select scopes to narrow access below the user level; UI default is a no-authorization scope, API default is sp:scopes:all. Where: Scopes checkboxes on PAT / API client forms.
- **API client enabled flag** (Disable; all plans; default on). OAuth client objects carry an enabled flag that can be patched. Where: PATCH /oauth-clients/{id} (enabled).

- Network: unknown (checked at unknown). Network Settings (CIDR network definition, country allow/block lists) restrict sign-in per identity profile and are skipped under SSO. Docs do not say they apply to /oauth/token or API calls.
- Lifetime: Client secret: no documented expiry; per-client accessTokenValiditySeconds. Renewal: Holder reuses the client secret to get new access tokens.
- Keyless option: not_applicable. Client credentials tokens are issued without user involvement, so no IdP sign-in occurs.
- Conditions: sp:oauth-client:manage; Support/Services accounts cannot create via UI

## Detect: what gets logged
- Token prefix: not established

### Logs
- Search > Events (events index, POST /search): Kept one year plus current month; older up to 5 years via support request.

### Fields that identify the credential
- `client_id` (JWT access token claims): No user_id/identity_id for client credentials
- `lastUsed` (GET /oauth-clients): Updated once a day

### Lifecycle events
No docs found.

### Correlate on
`actor.name`, `technicalName`, `trackingNumber`, `client_id (JWT claim)`

### API calls a holder can make, and whether they are logged
- recon: `GET /v2025/tenant`. Tenant details Logged: unknown. Not documented
- collection (bulk): `POST /v2025/search`. Identities, access, events; searchAfter pages past 10,000 Logged: unknown. Not documented
- discovery (bulk): `GET /v2025/personal-access-tokens`. PATs (all tenant if owner-id omitted) Logged: unknown. Not documented
- enumeration (bulk): `GET /v2025/accounts`. Source accounts Logged: unknown. Supports applicationAuth

### What to look for (analyst guidance)
- PATs or clients with sp:scopes:all or no expiry
- lastUsed on stale tokens (updated once a day)
- High-volume POST /search with searchAfter paging

## Respond: how to revoke it
- Admin: **Delete API client (Bulk Delete)**. Delete API clients on the API Management tab or via DELETE /oauth-clients/{id}. Where: Admin > Global > Security Settings > API Management > Bulk Delete.

Delete via API Management Bulk Delete or DELETE /oauth-clients/{id}; or PATCH enabled=false. Live access ends on revocation: unknown. Not documented whether issued access tokens die at once.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- API client audit event names
- Whether API calls are logged
- Whether reads produce audit events
- Any org setting to disable PAT creation or require approval for PATs/API clients
- Any admin-enforced maximum PAT lifetime (API states no upper limit on expirationDate but the doc only says this, not that no policy exists)
- Whether Network Settings IP/geo restrictions apply to /oauth/token or API calls
- Whether deleting a PAT or API client invalidates already-issued bearer tokens (scope changes do not affect existing bearer tokens)
- Audit event names for PAT/API client create, use, delete (published sample list is partial and lists none)
- Whether API read calls (search, list identities) produce audit events
- Whether disabling the owning identity stops its PATs
- VA key lifetime, rotation and use logging

## Sources
- [Managing API Keys and Personal Access Tokens](https://documentation.sailpoint.com/saas/help/common/api_keys.html) (retrieved 2026-10-14)
- [Authentication](https://developer.sailpoint.com/docs/api/authentication) (retrieved 2026-10-14)
- [Restricting Tenant Access](https://documentation.sailpoint.com/saas/help/access/restrict_access.html) (retrieved 2026-10-14)
- [SailPoint ISC API v2025 - Create personal access token](https://developer.sailpoint.com/redoc/sailpoint-api-v2025-light.html) (retrieved 2026-10-14)
- [Searchable Fields](https://documentation.sailpoint.com/saas/help/search/searchable-fields.html) (retrieved 2026-10-14)
- [Rate Limiting](https://developer.sailpoint.com/docs/api/rate-limit) (retrieved 2026-10-14)
- [Authorization](https://developer.sailpoint.com/docs/api/authorization) (retrieved 2026-10-14)
