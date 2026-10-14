# SailPoint Identity Security Cloud: API client - authorization code / refresh token

`sailpoint-3` · OAuth · person. A user signs in at the tenant authorize endpoint; the app exchanges the code for a JWT and, if the client has REFRESH_TOKEN, a refresh token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | The API Management page lists the API clients with their grant types; no page or endpoint was found that lists the refresh tokens issued to users. | The API Management page lists the API clients with their grant types; no page or endpoint was found that lists the refresh tokens issued to users. |
| Protect: Admin can block or require approval | Yes | API client enabled flag | API client enabled flag: PATCH /oauth-clients/{id} (enabled) |
| Protect: SSO and MFA rules apply | Partial | The user signs in to the tenant during the authorization code flow, which docs say works with SSO and strong authentication; refresh-token use afterwards is not described as re-checked. | Where: Admin > Global > Security Settings > Service Provider (remote IdP for SSO); or Admin > Identity Management > Identity Profiles > Sign-in Method = Multifactor Authentication |
| Protect: IP restriction | No docs found | Network Settings (CIDR network definition, country allow/block lists) restrict sign-in per identity profile and are skipped under SSO. Docs do not say they apply to /oauth/token or API calls. |  |
| Protect: Expires automatically | Yes | Refresh token default 1 month (UI); per-client refreshTokenValiditySeconds | accessTokenValiditySeconds: POST/PATCH /personal-access-tokens, /oauth-clients · Refresh Token validity: New API Client > Refresh Token dropdown |
| Detect: Usage appears in logs | Yes | client_id | Search > Events (events index, POST /search): Kept one year plus current month; older up to 5 years via support request. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Refresh token revocation endpoint not documented. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **accessTokenValiditySeconds** (Limit lifetime; all plans; default varies). Sets how long each issued bearer token lives (PAT default 43200s). Where: POST/PATCH /personal-access-tokens, /oauth-clients.
- **Scopes** (Limit scope; all plans; default varies). Select scopes to narrow access below the user level; UI default is a no-authorization scope, API default is sp:scopes:all. Where: Scopes checkboxes on PAT / API client forms.
- **API client enabled flag** (Disable; all plans; default on). OAuth client objects carry an enabled flag that can be patched. Where: PATCH /oauth-clients/{id} (enabled).
- **Refresh Token validity** (Limit lifetime; all plans; default on). Choose refresh token lifetime when enabling the Refresh Token grant (default 1 month). Where: New API Client > Refresh Token dropdown.

- Network: unknown (checked at unknown). Network Settings (CIDR network definition, country allow/block lists) restrict sign-in per identity profile and are skipped under SSO. Docs do not say they apply to /oauth/token or API calls.
- Lifetime: Refresh token default 1 month (UI); per-client refreshTokenValiditySeconds. Renewal: Refresh grant returns new access and refresh tokens.
- Keyless option: supported. Initial authorization goes through the tenant login, which works with SSO. Refresh token use is not documented to re-check the IdP.
- Conditions: sp:oauth-client:manage

## Detect: what gets logged
- Token prefix: not established

### Logs
- Search > Events (events index, POST /search): Kept one year plus current month; older up to 5 years via support request.

### Fields that identify the credential
- `client_id` (JWT claims): identity_id/user_id identify the user

### Lifecycle events
No docs found.

### Correlate on
`actor.name`, `technicalName`, `trackingNumber`, `client_id (JWT claim)`

### API calls a holder can make, and whether they are logged
- recon: `GET /v2025/tenant`. Tenant details Logged: unknown. Not documented
- enumeration (bulk): `GET /v2025/identities`. All identities Logged: unknown. Acts as signed-in user
- collection (bulk): `POST /v2025/search`. Identities, access, events; searchAfter pages past 10,000 Logged: unknown. Not documented
- discovery (bulk): `GET /v2025/personal-access-tokens`. PATs (all tenant if owner-id omitted) Logged: unknown. Not documented

### What to look for (analyst guidance)
- PATs or clients with sp:scopes:all or no expiry
- lastUsed on stale tokens (updated once a day)
- High-volume POST /search with searchAfter paging

## Respond: how to revoke it
- Admin: **Delete API client (Bulk Delete)**. Delete API clients on the API Management tab or via DELETE /oauth-clients/{id}. Where: Admin > Global > Security Settings > API Management > Bulk Delete.

Delete or disable the API client. Live access ends on revocation: unknown. Refresh token revocation endpoint not documented.

## No vendor documentation found
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- Per-user refresh token revocation
- Audit event names
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
- [Authentication](https://developer.sailpoint.com/docs/api/authentication) (retrieved 2026-10-14)
- [Managing API Keys and Personal Access Tokens](https://documentation.sailpoint.com/saas/help/common/api_keys.html) (retrieved 2026-10-14)
- [Restricting Tenant Access](https://documentation.sailpoint.com/saas/help/access/restrict_access.html) (retrieved 2026-10-14)
- [SailPoint ISC API v2025 - Create personal access token](https://developer.sailpoint.com/redoc/sailpoint-api-v2025-light.html) (retrieved 2026-10-14)
- [Configuring SailPoint as a Service Provider](https://documentation.sailpoint.com/saas/help/common/config_isc_service_provider.html) (retrieved 2026-10-14)
- [API Authentication](https://developer.sailpoint.com/docs/api/authentication/) (retrieved 2026-10-14)
- [Configuring Multifactor Authentication](https://documentation.sailpoint.com/saas/help/common/strong_auth.html) (retrieved 2026-10-14)
- [Searchable Fields](https://documentation.sailpoint.com/saas/help/search/searchable-fields.html) (retrieved 2026-10-14)
- [Rate Limiting](https://developer.sailpoint.com/docs/api/rate-limit) (retrieved 2026-10-14)
- [Authorization](https://developer.sailpoint.com/docs/api/authorization) (retrieved 2026-10-14)
