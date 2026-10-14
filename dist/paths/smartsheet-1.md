# Smartsheet: Personal API access token

`smartsheet-1` · Personal access token · person. User generates a raw token in Personal Settings > API Access; it is sent as an Authorization: Bearer header and acts with the user's full access. Shown once. Tokens are per environment (commercial, Regions, Gov).

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | No admin token list found; Event Reporting ACCESS_TOKEN - AUTHORIZE events (Enterprise/AWM add-on) show tokens being created. | API: GET https://api.smartsheet.com/2.0/events?since=<date>; keep objectType=ACCESS_TOKEN, action=AUTHORIZE (Event Reporting add-on, System Admin) |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Partial | Only documented case: API calls by external collaborators to items protected by 'Require work accounts with SSO' fail unless exempt; docs are silent on SSO for internal users' tokens. | Where: Admin Center > Settings > Secure External Access > Require work accounts with single sign-on (SSO) = On (external collaborators only) |
| Protect: IP restriction | No docs found | No Smartsheet doc found describing IP allowlisting for API tokens. Event Reporting records source IP only for WEB_APP events. |  |
| Protect: Expires automatically | Partial | No expiry by default; Enterprise admins can set one plan-wide expiration | API Access Token expiration period: Admin Center > Security & Control > API Access Token tile > Expiration period |
| Detect: Usage appears in logs | Yes | accessTokenName, tokenDisplayValue, requestUserId, source, tokenUserId | Event Reporting (GET /events, List filtered events, SIEM): Premium add-on for Enterprise/AWM; System Admin; six months from enablement. Built-in SIEM streaming needs Safeguard or Advance Platinum. · Admin Center API page: Business/Enterprise; last 30 days, refreshed daily; user-generated tokens only; call counts per endpoint and user; CSV export; excludes deactivated/removed users. |
| Detect: Data reads appear in logs | Conditional | Event Reporting add-on; carries accessTokenName and API_* source. | API: GET https://api.smartsheet.com/2.0/events?since=<date>; keep objectType=SHEET, action=LOAD; match additionalDetails.accessTokenName |
| Respond: Revocation ends active access | Yes | Revoked token fails on later calls. Admin revocation of a single token of another user is not documented. | Owner deletes the token under Personal Settings > API Access, or call DELETE /token with it. Admin: deactivate the user (revokes all their tokens), then reissue as needed. |
| Respond: Stops working when user is removed | Yes | Deactivating a user (manually or via SCIM directory sync) immediately revokes the user's API access tokens. | Where: Admin Center > Users and Groups > Seat Types and True-up > user row ⋮ > Deactivate · API: POST https://api.smartsheet.com/2.0/users/{userId}/deactivate |

## Protect: what an admin can configure

### Admin controls
- **API Access Token expiration period** (Limit lifetime; Enterprise; default off). Sets one expiration for all existing and future user and OAuth tokens in the plan; expired tokens are revoked. Where: Admin Center > Security & Control > API Access Token tile > Expiration period.
- **Admin Center API page** (Other; Business, Enterprise; default on). Shows users with active tokens used in last 30 days and endpoint call counts; view-only. Where: Admin Center > API (Endpoints, API users tabs).

### Not available (vendor states)
- Per-user or per-role token expiration
- Revoking tokens from the Admin Center API page

- Network: unknown (checked at unknown). No Smartsheet doc found describing IP allowlisting for API tokens. Event Reporting records source IP only for WEB_APP events.
- Lifetime: No expiry by default; Enterprise admins can set one plan-wide expiration. Renewal: Personal tokens cannot be refreshed or extended; user generates a new one.
- Keyless option: not_verified. API calls need only the bearer token. SAML, domain-level SAML and domain strict docs describe sign-in methods and sessions only and say nothing about existing or new API tokens. No doc states tokens are blocked or re-checked under SAML-only sign-in. IdP deprovisioning via Directory Integration deactivates the user, and deactivation revokes the user's tokens.
- Conditions: Token creation requires Business, Enterprise or AWM. No documented setting to block users from creating tokens or for an admin to revoke one specific token of another user.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Event Reporting (GET /events, List filtered events, SIEM): Premium add-on for Enterprise/AWM; System Admin; six months from enablement. Built-in SIEM streaming needs Safeguard or Advance Platinum.
- Admin Center API page: Business/Enterprise; last 30 days, refreshed daily; user-generated tokens only; call counts per endpoint and user; CSV export; excludes deactivated/removed users.

### Fields that identify the credential
- `accessTokenName` (Event Reporting (all events)): Present on API calls when the token was named at creation.
- `tokenDisplayValue` (ACCESS_TOKEN events): Mnemonic shown in UI; not unique.
- `requestUserId` (Event Reporting (all events)): User whose data the token can access (token owner).
- `source` (Event Reporting (all events)): API_UNDEFINED_APP / API_INTEGRATED_APP / API_ODBC_DRIVER vs WEB_APP.
- `tokenUserId` (ACCESS_TOKEN - REVOKE): Owner of revoked token.

### Lifecycle events
- create: `ACCESS_TOKEN - AUTHORIZE` Includes tokenName, tokenDisplayValue, tokenExpirationTimestamp, accessScopes.
- use: `SHEET - LOAD` Sheet loaded via API.
- use: `REPORT - LOAD` Report loaded via API.
- use: `ATTACHMENT - LOAD` Attachment viewed or downloaded.
- revoke: `ACCESS_TOKEN - REVOKE` Includes tokenUserId.
- revoke: `USER - DEACTIVATE` Deactivation revokes all the user's tokens; no per-token event documented for this.

### Correlate on
`requestUserId`, `accessTokenName`, `tokenDisplayValue`, `source`, `additionalDetails.emailAddress`

### API calls a holder can make, and whether they are logged
- recon: `GET /users/me`. Token owner profile; extra fields for System Admins Logged: unknown. No event type documented for this call.
- discovery (bulk): `GET /users`. Org user list; admin attributes for System Admins Logged: unknown. 
- enumeration (bulk): `GET /sheets`. All sheets the user can access Logged: unknown. 
- enumeration (bulk): `GET /workspaces`. Workspaces the user can access Logged: unknown. 
- enumeration (bulk): `GET /search`. Full-text hits across accessible sheets Logged: unknown. 
- collection: `GET /sheets/{sheetId}`. Full sheet data Logged: plan (`SHEET - LOAD`). Event Reporting add-on; carries accessTokenName and API_* source.
- discovery (bulk): `GET /events`. Org audit log (System Admin only) Logged: unknown. Requires Event Reporting.

### What to look for (analyst guidance)
- ACCESS_TOKEN - AUTHORIZE for users who don't normally use the API, especially System Admins (Assume-User).
- Bursts of SHEET - LOAD / ATTACHMENT - LOAD with an API_* source.
- No source IP on API events; pivot on accessTokenName and requestUserId instead.
- New user appearing on the Admin Center API users tab.

## Respond: how to revoke it
- Admin: **Revoke (delete) API access token**. User deletes their own token in the UI. Where: Account > Personal Settings > API Access > Manage API Access Tokens.
- Admin: **Revoke access token (DELETE /token)**. Revokes the token used to make the call; later calls with it fail. Where: DELETE /token.
- Admin: **Deactivate user**. Blocks the user and immediately revokes all API access tokens they generated. Where: Admin Center > Users and Groups > Seat Types and True-up > Deactivate; or POST /users/{userId}/deactivate.
- Admin: **Directory Integration (Okta / Entra ID SCIM)**. Removing or unassigning the user in the IdP deactivates them on next sync, which revokes their tokens. Where: Admin Center > Security & Controls > Directory Integration.

Owner deletes the token under Personal Settings > API Access, or call DELETE /token with it. Admin: deactivate the user (revokes all their tokens), then reissue as needed. Live access ends on revocation: yes. Revoked token fails on later calls. Admin revocation of a single token of another user is not documented.

## No vendor documentation found
- Admin can block or require approval
- IP restriction
- Whether list/search calls (GET /sheets, GET /search, GET /users) produce events.
- How impersonated (Assume-User) calls are attributed.
- Numeric rate limit.
- Whether list/search calls are logged.
- Whether SAML-only sign-in, domain-level SAML or domain strict blocks or re-checks existing or new personal tokens (docs are silent; only sign-in and sessions are described).
- Any admin setting to stop users from creating API tokens.
- Any admin path to revoke one specific token of another user without deactivating the user.
- Whether password change, user removal (vs deactivation), or seat downgrade revokes tokens.
- Whether deactivation revokes OAuth app tokens (doc says tokens 'they've generated').
- IP allowlisting for API access.
- Whether Safe Sharing, Enterprise Plan Manager, or User Auto-Provisioning affect tokens.
- Admin control over which third-party OAuth apps users may authorize.
- Refresh token lifetime.
- Numeric API rate limits.
- How Assume-User (impersonated) calls are attributed in Event Reporting.

## Sources
- [Get Started](https://developers.smartsheet.com/api/smartsheet/guides/getting-started) (retrieved 2026-10-13)
- [Authentication](https://developers.smartsheet.com/api/smartsheet/guides/basics/authentication) (retrieved 2026-10-13)
- [Generate an API access token](https://help.smartsheet.com/articles/2482389-generate-API-key) (retrieved 2026-10-13)
- [SAML and SSO for Smartsheet overview (Enterprise only)](https://help.smartsheet.com/articles/2476661-saml-sso-overview-enterprise) (retrieved 2026-10-13)
- [Configure SAML for domain-level single sign-on to Smartsheet](https://help.smartsheet.com/articles/2483123-domain-level-saml-configuration) (retrieved 2026-10-13)
- [Activate strict domain-level sign-in](https://help.smartsheet.com/articles/2483310-activate-strict-domain-level-login) (retrieved 2026-10-13)
- [Use Okta SCIM with Smartsheet](https://help.smartsheet.com/articles/2482731-configure-Okta-SCIM) (retrieved 2026-10-13)
- [Deactivate or reactivate users](https://help.smartsheet.com/articles/2483484-admin-center-deactivate-or-reactivate-users) (retrieved 2026-10-13)
- [Event types](https://developers.smartsheet.com/api/smartsheet/event-types) (retrieved 2026-10-13)
- [Admin Center: Configure access token expiration time](https://help.smartsheet.com/articles/2483100-configure-access-token-expiration-time) (retrieved 2026-10-13)
- [View API users and usage data](https://help.smartsheet.com/articles/2483686-view-api-users-and-usage-data) (retrieved 2026-10-13)
- [User Impersonation](https://developers.smartsheet.com/api/smartsheet/guides/advanced-topics/user-impersonation) (retrieved 2026-10-13)
- [Manage Smartsheet users through Entra ID](https://help.smartsheet.com/articles/2479786-manage-smartsheet-users-through-azure-active-directory) (retrieved 2026-10-13)
- [Governance policies for external collaborators](https://help.smartsheet.com/articles/2483128-governance-policies-external-collaborators) (retrieved 2026-10-14)
- [Deactivating and reactivating users](https://help.smartsheet.com/learning-track/system-admin-user-management/deactivating-and-reactivating-users) (retrieved 2026-10-14)
- [Smartsheet Security Capabilities, Practices, and Safeguards (2026-10)](https://www.smartsheet.com/sites/default/files/2026-10/Security-Capabilities-Practices-and-Safeguards.pdf) (retrieved 2026-10-14)
- [Smartsheet API OpenAPI description (List events)](https://developers.smartsheet.com/_spec/api/smartsheet/openapi.yaml) (retrieved 2026-10-14)
- [Admin Center: Configure Require work accounts with SSO](https://help.smartsheet.com/articles/2483524-admin-center-configure-require-work-accounts-sso) (retrieved 2026-10-14)
- [Revoke access token](https://developers.smartsheet.com/api/smartsheet/openapi/tokens/tokens-delete) (retrieved 2026-10-13)
- [Events](https://developers.smartsheet.com/api/smartsheet/openapi/events) (retrieved 2026-10-13)
- [List events](https://developers.smartsheet.com/api/smartsheet/openapi/events/list-events) (retrieved 2026-10-13)
- [Event Reporting overview](https://help.smartsheet.com/articles/2479296-event-reporting-monitor-how-your-organization-uses-data) (retrieved 2026-10-13)
- [Get current user](https://developers.smartsheet.com/api/smartsheet/openapi/users/get-current-user) (retrieved 2026-10-13)
- [List users](https://developers.smartsheet.com/api/smartsheet/openapi/users/list-users) (retrieved 2026-10-13)
- [List sheets](https://developers.smartsheet.com/api/smartsheet/openapi/sheets/list-sheets) (retrieved 2026-10-13)
- [Search everything](https://developers.smartsheet.com/api/smartsheet/openapi/search/list-search) (retrieved 2026-10-13)
- [Get sheet](https://developers.smartsheet.com/api/smartsheet/openapi/sheets/getsheet) (retrieved 2026-10-13)
- [List workspaces](https://developers.smartsheet.com/api/smartsheet/openapi/workspaces/list-workspaces) (retrieved 2026-10-13)
- [Error codes](https://developers.smartsheet.com/api/smartsheet/error-codes) (retrieved 2026-10-13)
- [Deactivate user](https://developers.smartsheet.com/api/smartsheet/openapi/users/deactivate-user) (retrieved 2026-10-13)
