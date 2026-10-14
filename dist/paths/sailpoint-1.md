# SailPoint Identity Security Cloud: Personal access token (PAT)

`sailpoint-1` · Personal access token · person. A PAT is a client ID and secret tied to a user. The holder posts them to /oauth/token (client credentials) and gets a JWT bearer token that acts with the owner's user level, narrowed by scopes.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Org admins see non-managed PATs on Admin > Global > Security Settings > Personal Access Tokens; GET /personal-access-tokens without owner-id returns all tenant PATs (needs idn:all-personal-access-tokens:read). Managed PATs are not on the UI page. | Org admins see non-managed PATs on Admin > Global > Security Settings > Personal Access Tokens; GET /personal-access-tokens without owner-id returns all tenant PATs (needs idn:all-personal-access-tokens:read). Managed PATs are not on the UI page. |
| Protect: Admin can block or require approval | Not available | No setting to stop users from creating PATs; docs say any user can create one (limited to the user's own user levels and 10 tokens per user). |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | PAT API calls follow the owner's identity-profile Network Settings (CIDR network, country allow/block list) when Off Network / Untrusted Geographies is set on that profile. Stated in the Non-Employee Risk Management docs for PATs generated in Identity Security. The tenant docs say these restrictions are skipped for SSO users; whether that exception affects PAT calls is not stated. | Where: Admin > Global > System Settings > Network Settings (Network Definition / Trusted Countries); then Admin > Identity Management > Identity Profiles > profile > Block Access From: Off Network / Untrusted Geographies · API: PATCH /v2026/auth-org/network-config |
| Protect: Expires automatically | Yes | PAT: 6 months default, can be never-expiring; bearer token 43200s default | PAT expiration date: PAT form expiration date; expirationDate / userAwareTokenNeverExpires in API · accessTokenValiditySeconds: POST/PATCH /personal-access-tokens, /oauth-clients · Support/Services PAT auto-deletion: Granting Support Access |
| Detect: Usage appears in logs | Yes | client_id, lastUsed | Search > Events (events index, POST /search): Kept one year plus current month; older up to 5 years via support request. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Docs say scope changes don't affect existing bearer tokens; deletion effect on live bearer tokens (default 12h) not documented. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Org Admin Personal Access Tokens page** (Other; all plans; default on). Org Admins view all non-managed PATs with owner, scopes, expiry and last used, and can update expiry. Where: Admin > Global > Security Settings > Personal Access Tokens.
- **PAT expiration date** (Limit lifetime; all plans; default on). Set or update PAT expiry; default 6 months, blank means never expires. Where: PAT form expiration date; expirationDate / userAwareTokenNeverExpires in API.
- **accessTokenValiditySeconds** (Limit lifetime; all plans; default varies). Sets how long each issued bearer token lives (PAT default 43200s). Where: POST/PATCH /personal-access-tokens, /oauth-clients.
- **Scopes** (Limit scope; all plans; default varies). Select scopes to narrow access below the user level; UI default is a no-authorization scope, API default is sp:scopes:all. Where: Scopes checkboxes on PAT / API client forms.
- **Support/Services PAT auto-deletion** (Limit lifetime; all plans; default on). PATs created by SailPoint Support/Services accounts are deleted when tenant access expires. Where: Granting Support Access.

### Not available (vendor states)
- No setting to stop users from creating PATs; docs say any user can create one (limited to the user's own user levels and 10 tokens per user).

- Network: conditional (checked at unknown). PAT API calls follow the owner's identity-profile Network Settings (CIDR network, country allow/block list) when Off Network / Untrusted Geographies is set on that profile. Stated in the Non-Employee Risk Management docs for PATs generated in Identity Security. The tenant docs say these restrictions are skipped for SSO users; whether that exception affects PAT calls is not stated.
- Lifetime: PAT: 6 months default, can be never-expiring; bearer token 43200s default. Renewal: Holder re-exchanges the PAT secret for new bearer tokens until the PAT expires or is deleted. Expired PATs can be restored for 3 months.
- Keyless option: not_verified. Docs do not state whether PAT use is subject to the IdP. The token exchange is non-interactive, so IdP conditional access is not consulted at use time per the flow description.
- Conditions: Org Admin for org-wide view; idn:all-personal-access-tokens:read for API listing

## Detect: what gets logged
- Token prefix: not established

### Logs
- Search > Events (events index, POST /search): Kept one year plus current month; older up to 5 years via support request.

### Fields that identify the credential
- `client_id` (JWT access token claims): Equals PAT id
- `lastUsed` (GET /personal-access-tokens): Updated once a day

### Lifecycle events
No docs found.

### Correlate on
`actor.name`, `technicalName`, `trackingNumber`, `client_id (JWT claim)`

### API calls a holder can make, and whether they are logged
- recon: `GET /v2025/tenant`. Tenant details Logged: unknown. Not documented
- enumeration (bulk): `GET /v2025/identities`. All identities Logged: unknown. userAuth only
- collection (bulk): `POST /v2025/search`. Identities, access, events; searchAfter pages past 10,000 Logged: unknown. Not documented
- discovery (bulk): `GET /v2025/personal-access-tokens`. PATs (all tenant if owner-id omitted) Logged: unknown. Not documented

### What to look for (analyst guidance)
- PATs or clients with sp:scopes:all or no expiry
- lastUsed on stale tokens (updated once a day)
- High-volume POST /search with searchAfter paging

## Respond: how to revoke it
- Admin: **Delete personal access token**. Owner deletes a PAT from Preferences; admins can delete via DELETE /personal-access-tokens/{id}. Where: Preferences > Personal Access Tokens > Delete; DELETE /personal-access-tokens/{id}.

Delete the PAT (owner UI or DELETE /personal-access-tokens/{id}). Live access ends on revocation: unknown. Docs say scope changes don't affect existing bearer tokens; deletion effect on live bearer tokens (default 12h) not documented.

## No vendor documentation found
- SSO and MFA rules apply
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- PAT audit event names
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
- [Managing API Settings - Non-Employee Risk Management Admin Help](https://documentation.sailpoint.com/ne-admin/help/setup/api.html) (retrieved 2026-10-14)
- [Restricting Tenant Access](https://documentation.sailpoint.com/saas/help/access/restrict_access.html) (retrieved 2026-10-14)
- [SailPoint ISC API v2025 - Create personal access token](https://developer.sailpoint.com/redoc/sailpoint-api-v2025-light.html) (retrieved 2026-10-14)
- [SailPoint API spec: /auth-org/network-config](https://github.com/sailpoint-oss/api-specs/blob/main/idn/v2026/paths/auth-org-network-config.yaml) (retrieved 2026-10-14)
- [Searchable Fields](https://documentation.sailpoint.com/saas/help/search/searchable-fields.html) (retrieved 2026-10-14)
- [Audit Reports and Monitoring](https://documentation.sailpoint.com/saas/help/common/audit-reports.html) (retrieved 2026-10-14)
- [Rate Limiting](https://developer.sailpoint.com/docs/api/rate-limit) (retrieved 2026-10-14)
- [Authorization](https://developer.sailpoint.com/docs/api/authorization) (retrieved 2026-10-14)
