# Smartsheet: OAuth 2.0 app (authorization code; access + refresh tokens)

`smartsheet-2` · OAuth · person. Three-legged authorization-code flow: user signs in and consents to scopes, app exchanges code with client ID and secret at POST /token. Access token is a bearer token limited by scopes and the user's sharing permissions.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | No admin list of OAuth grants found; Event Reporting ACCESS_TOKEN - AUTHORIZE events include the app's client Id. | API: GET https://api.smartsheet.com/2.0/events?since=<date>; keep objectType=ACCESS_TOKEN, action=AUTHORIZE; additionalDetails.appClientId identifies the app |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Partial | Same external-collaborator API rule applies; no doc ties OAuth token issuance or use to SSO for internal users. | Where: Admin Center > Settings > Secure External Access > Require work accounts with single sign-on (SSO) = On (external collaborators only) |
| Protect: IP restriction | No docs found | No doc found on IP restrictions for OAuth tokens. |  |
| Protect: Expires automatically | Yes | Access token ~7 days; Enterprise plan-wide expiration also applies to OAuth tokens; refresh token lifetime not documented | API Access Token expiration period: Admin Center > Security & Control > API Access Token tile > Expiration period |
| Detect: Usage appears in logs | Yes | appClientId, appName, tokenDisplayValue, requestUserId | Event Reporting: Same plan gate; AUTHORIZE events carry appClientId and appName. OAuth tokens are not on the Admin Center API page. |
| Detect: Data reads appear in logs | Conditional | Event Reporting add-on; carries accessTokenName and API_* source. | API: GET https://api.smartsheet.com/2.0/events?since=<date>; keep objectType=SHEET, action=LOAD; match additionalDetails.accessTokenName |
| Respond: Revocation ends active access | Yes | Requires holding a token for the app. Whether user deactivation or a UI action revokes OAuth grants is not documented. | Call DELETE /token?deleteAllForApiClient=true with a token for that app and user; or set a short plan-wide expiration. |
| Respond: Stops working when user is removed | Yes | SCIM offboarding neutralizes the user's OAuth tokens; manual deactivation revokes the user's access tokens. | Where: Admin Center > Users and Groups > Seat Types and True-up > user row ⋮ > Deactivate · API: POST https://api.smartsheet.com/2.0/users/{userId}/deactivate |

## Protect: what an admin can configure

### Admin controls
- **API Access Token expiration period** (Limit lifetime; Enterprise; default off). Sets one expiration for all existing and future user and OAuth tokens in the plan; expired tokens are revoked. Where: Admin Center > Security & Control > API Access Token tile > Expiration period.
- **OAuth access scopes** (Limit scope; all plans; default varies). App gets only consented scopes, still bounded by the user's sharing permissions. Where: scope parameter on GET https://app.smartsheet.com/b/authorize.

### Not available (vendor states)
- Per-user or per-role token expiration
- Visibility of OAuth token usage on the Admin Center API page

- Network: unknown (checked at unknown). No doc found on IP restrictions for OAuth tokens.
- Lifetime: Access token ~7 days; Enterprise plan-wide expiration also applies to OAuth tokens; refresh token lifetime not documented. Renewal: POST /token with grant_type=refresh_token returns a new access and refresh token pair.
- Keyless option: limited. Consent requires the user to sign in through the normal Smartsheet sign-in (which may be SAML). After that, refresh tokens issue new access tokens with no user involvement; docs don't say SSO policy is re-checked at refresh.
- Conditions: No documented admin allowlist/blocklist for third-party OAuth apps.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Event Reporting: Same plan gate; AUTHORIZE events carry appClientId and appName. OAuth tokens are not on the Admin Center API page.

### Fields that identify the credential
- `appClientId` (ACCESS_TOKEN - AUTHORIZE): App the token was granted to.
- `appName` (ACCESS_TOKEN - AUTHORIZE): App name.
- `tokenDisplayValue` (ACCESS_TOKEN events): Not unique.
- `requestUserId` (all events): Consenting user.

### Lifecycle events
- create: `ACCESS_TOKEN - AUTHORIZE` User consent.
- renew: `ACCESS_TOKEN - REFRESH` Refresh token used.
- revoke: `ACCESS_TOKEN - REVOKE` 

### Correlate on
`appClientId`, `requestUserId`, `tokenDisplayValue`, `source`

### API calls a holder can make, and whether they are logged
- recon: `GET /users/me`. Token owner profile; extra fields for System Admins Logged: unknown. No event type documented for this call.
- discovery (bulk): `GET /users`. Org user list; admin attributes for System Admins Logged: unknown. 
- enumeration (bulk): `GET /sheets`. All sheets the user can access Logged: unknown. 
- enumeration (bulk): `GET /workspaces`. Workspaces the user can access Logged: unknown. 
- enumeration (bulk): `GET /search`. Full-text hits across accessible sheets Logged: unknown. 
- collection: `GET /sheets/{sheetId}`. Full sheet data Logged: plan (`SHEET - LOAD`). Event Reporting add-on; carries accessTokenName and API_* source.
- discovery (bulk): `GET /events`. Org audit log (System Admin only) Logged: unknown. Requires Event Reporting.

### What to look for (analyst guidance)
- AUTHORIZE for an unfamiliar appClientId, especially with ADMIN_USERS or READ_EVENTS in accessScopes.
- REFRESH continuing after the user left.

## Respond: how to revoke it
- Admin: **Revoke access token (DELETE /token)**. Revokes the token used to make the call; later calls with it fail. Where: DELETE /token.
- Admin: **deleteAllForApiClient**. Revokes every token for the same app client ID and user. Where: DELETE /token?deleteAllForApiClient=true.

Call DELETE /token?deleteAllForApiClient=true with a token for that app and user; or set a short plan-wide expiration. Live access ends on revocation: yes. Requires holding a token for the app. Whether user deactivation or a UI action revokes OAuth grants is not documented.

## No vendor documentation found
- Admin can block or require approval
- IP restriction
- Refresh token lifetime.
- Admin-side app revocation path.
- Per-endpoint required scopes are not listed on endpoint pages; mapping inferred from scope descriptions.
- Whether SAML-only sign-in, domain-level SAML or domain strict blocks or re-checks existing or new personal tokens (docs are silent; only sign-in and sessions are described).
- Any admin setting to stop users from creating API tokens.
- Any admin path to revoke one specific token of another user without deactivating the user.
- Whether password change, user removal (vs deactivation), or seat downgrade revokes tokens.
- Whether deactivation revokes OAuth app tokens (doc says tokens 'they've generated').
- IP allowlisting for API access.
- Whether Safe Sharing, Enterprise Plan Manager, or User Auto-Provisioning affect tokens.
- Admin control over which third-party OAuth apps users may authorize.
- Numeric API rate limits.
- How Assume-User (impersonated) calls are attributed in Event Reporting.

## Sources
- [Authentication](https://developers.smartsheet.com/api/smartsheet/guides/basics/authentication) (retrieved 2026-10-13)
- [OAuth](https://developers.smartsheet.com/api/smartsheet/guides/advanced-topics/oauth) (retrieved 2026-10-13)
- [Gets or refreshes an access token](https://developers.smartsheet.com/api/smartsheet/openapi/tokens/tokens-getorrefresh) (retrieved 2026-10-13)
- [Admin Center: Configure access token expiration time](https://help.smartsheet.com/articles/2483100-configure-access-token-expiration-time) (retrieved 2026-10-13)
- [View API users and usage data](https://help.smartsheet.com/articles/2483686-view-api-users-and-usage-data) (retrieved 2026-10-13)
- [Governance policies for external collaborators](https://help.smartsheet.com/articles/2483128-governance-policies-external-collaborators) (retrieved 2026-10-14)
- [Smartsheet Security Capabilities, Practices, and Safeguards (2026-10)](https://www.smartsheet.com/sites/default/files/2026-10/Security-Capabilities-Practices-and-Safeguards.pdf) (retrieved 2026-10-14)
- [Deactivating and reactivating users](https://help.smartsheet.com/learning-track/system-admin-user-management/deactivating-and-reactivating-users) (retrieved 2026-10-14)
- [Event types](https://developers.smartsheet.com/api/smartsheet/event-types) (retrieved 2026-10-13)
- [Smartsheet API OpenAPI description (List events)](https://developers.smartsheet.com/_spec/api/smartsheet/openapi.yaml) (retrieved 2026-10-14)
- [Admin Center: Configure Require work accounts with SSO](https://help.smartsheet.com/articles/2483524-admin-center-configure-require-work-accounts-sso) (retrieved 2026-10-14)
- [Deactivate or reactivate users](https://help.smartsheet.com/articles/2483484-admin-center-deactivate-or-reactivate-users) (retrieved 2026-10-13)
- [Revoke access token](https://developers.smartsheet.com/api/smartsheet/openapi/tokens/tokens-delete) (retrieved 2026-10-13)
- [Get current user](https://developers.smartsheet.com/api/smartsheet/openapi/users/get-current-user) (retrieved 2026-10-13)
- [List users](https://developers.smartsheet.com/api/smartsheet/openapi/users/list-users) (retrieved 2026-10-13)
- [List sheets](https://developers.smartsheet.com/api/smartsheet/openapi/sheets/list-sheets) (retrieved 2026-10-13)
- [Search everything](https://developers.smartsheet.com/api/smartsheet/openapi/search/list-search) (retrieved 2026-10-13)
- [Get sheet](https://developers.smartsheet.com/api/smartsheet/openapi/sheets/getsheet) (retrieved 2026-10-13)
- [List workspaces](https://developers.smartsheet.com/api/smartsheet/openapi/workspaces/list-workspaces) (retrieved 2026-10-13)
- [List events](https://developers.smartsheet.com/api/smartsheet/openapi/events/list-events) (retrieved 2026-10-13)
- [Error codes](https://developers.smartsheet.com/api/smartsheet/error-codes) (retrieved 2026-10-13)
