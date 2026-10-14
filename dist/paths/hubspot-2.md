# HubSpot: OAuth

`hubspot-2` · OAuth · person. OAuth 2.0 authorization-code flow for project-based apps (and existing legacy public apps) installed in multiple accounts. The app exchanges the code for a 30-minute access token, sent as a Bearer token, and a refresh token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Settings > Integrations > Connected Apps lists connected and approved apps, not individual tokens. | Settings > Integrations > Connected Apps lists connected and approved apps, not individual tokens. |
| Protect: Admin can block or require approval | Yes | App governance: Approve apps | App governance: Approve apps: Settings > Integrations > Connected Apps > select app > Approve |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Trusted-IP documentation restricts account logins; API-call enforcement for private-app/OAuth tokens was not established. |  |
| Protect: Expires automatically | Yes | 30 minutes | API: Read expires_in from POST /oauth/v1/token response, or GET /oauth/v1/access-tokens/{token} (returns expires_in) |
| Detect: Usage appears in logs | Yes | objectId, client_id, app_id, user_id, hub_id | HubSpot security activity (Account activity API /account-info/v3/activity/security): Records user actions such as PRIVATE_APP_ACCESS_TOKEN_VIEW and INSTALL_INTEGRATION with IP/location. UI shows 30 days; export covers last year. Scope account-info.security.read. · HubSpot centralized audit log (/account-info/v3/activity/audit-logs): Enterprise only. User actions incl. CRITICAL_ACTION subcategories. Records HubSpot-user actions, not API calls. · OAuth token introspection (POST /oauth/v3/token/introspect): Not a log; maps a found access or refresh token to hub_id, user_id, user, client_id, app_id, scopes. |
| Detect: Data reads appear in logs | Yes | GET /crm/objects/2026-03/contacts | Where: (App developer account) Development > Legacy apps > {app} > Monitoring > API calls tab; filter method GET and request URL |
| Respond: Revocation ends active access | Partial | Deleting a refresh token does not delete access tokens already issued; those last up to 30 minutes. Effect of uninstall on live access tokens not documented. | Uninstall the app from Settings > Integrations > Connected apps; app owner deletes refresh token (DELETE /oauth/v1/refresh-tokens/{token}); rotate client secret if it leaked. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **App governance: Approve apps** (Require approval; All products and plans; default on). Marketplace apps must be approved by a Super Admin before non-admin users can install them; users submit requests. Where: Settings > Integrations > Connected Apps > select app > Approve.
- **App governance: Limit installation (Install Permissions)** (Other; All products and plans; default varies). Restricts which users/teams may install an approved app (Admins, specific users/teams, or everyone). Where: Settings > Integrations > Connected Apps > Manage access > Install Permissions.
- **App governance: Customize optional data permissions** (Limit scope; All products and plans; default varies). Turns optional scopes on or off for an approved app for all users; required scopes cannot be removed. Where: Settings > Integrations > Connected Apps > Approve / Manage access > data permissions.
- **User permission: App Marketplace access** (Other; all plans; default unknown). Only Super Admins and users with this permission (plus matching scope permissions) can install apps. Where: Settings > Users & Teams > user > permissions (Settings access).
- **Deselect optional scopes at install** (Limit scope; all plans; default unknown). The installing user can clear optional scopes before connecting the app. Where: Install consent screen (Connect app).

### Not available (vendor states)
- Required data permissions (scopes) of an app cannot be turned off by the admin.

- Network: unknown (checked at login_only). Trusted-IP documentation restricts account logins; API-call enforcement for private-app/OAuth tokens was not established.
- Lifetime: 30 minutes. Renewal: Use the refresh token to get a new 30-minute access token. HubSpot describes refresh tokens as not expiring for now; they stop working when the app is uninstalled or the token is revoked.
- Keyless option: not_verified. General CRM API federation is not established. Client credentials documented for selected developer-platform functions is not a general CRM grant.
- Conditions: Privately distributed OAuth apps install in up to 10 allowlisted accounts; marketplace apps up to 25 before listing. Creation of legacy public apps ended on 2026-06-23; existing ones keep working. User-level access requires OAuth and a new app (account-level apps cannot be converted).

## Detect: what gets logged
- Token prefix: not established

### Logs
- HubSpot security activity (Account activity API /account-info/v3/activity/security): Records user actions such as PRIVATE_APP_ACCESS_TOKEN_VIEW and INSTALL_INTEGRATION with IP/location. UI shows 30 days; export covers last year. Scope account-info.security.read.
- HubSpot centralized audit log (/account-info/v3/activity/audit-logs): Enterprise only. User actions incl. CRITICAL_ACTION subcategories. Records HubSpot-user actions, not API calls.
- OAuth token introspection (POST /oauth/v3/token/introspect): Not a log; maps a found access or refresh token to hub_id, user_id, user, client_id, app_id, scopes.

### Fields that identify the credential
- `objectId` (security activity): Object of INSTALL_INTEGRATION (installed app); exact ID type not documented
- `client_id` (token introspect): OAuth app client id
- `app_id` (token introspect): HubSpot app ID
- `user_id` (token introspect): Installing user
- `hub_id` (token introspect): Portal/account

### Lifecycle events
- create: `INSTALL_INTEGRATION` User installed an integration (OAuth app) in the account

### Correlate on
`userId`, `actingUser`, `objectId`, `ipAddress`, `countryCode`, `createdAt`, `client_id`, `app_id`, `hub_id`, `user_id`

### API calls a holder can make, and whether they are logged
- collection: `GET /crm/objects/2026-03/contacts`. CRM contact records Logged: yes. Request logs are under Development > Monitoring > Logs for the app; this view is in the app developer's account, not an installing-account audit log.

### What to look for (analyst guidance)
- INSTALL_INTEGRATION by a non-admin or from a new IP/country
- Install of an unverified app (no verified domain) shortly before data exports
- Refresh token use continuing after the installing user was deactivated
- Several accounts/users installing the same unfamiliar app in a short window
- invalid_grant / BAD_REFRESH_TOKEN bursts in the app backend (stolen or replayed refresh tokens)

### Sample query (HubSpot Account activity API (query parameters))
Find recent OAuth app installs and who approved them.

```
GET /account-info/v3/activity/security?fromTimestamp=2026-09-01T00:00:00Z&toTimestamp=2026-10-12T00:00:00Z  -- filter type == 'INSTALL_INTEGRATION'; join objectId to installed apps list
```

## Respond: how to revoke it
- Admin: **App governance: Revoke approval**. Removes the app from approved apps and uninstalls it for every user. Where: Settings > Integrations > Connected Apps > Manage access > Revoke Approval.
- Admin: **Uninstall an app for a specific user**. Uninstalls an approved app from one user's install; the user can reinstall unless approval is revoked. Where: Settings > Integrations > Connected Apps > Manage access > Installed by > Uninstall.

Uninstall the app from Settings > Integrations > Connected apps; app owner deletes refresh token (DELETE /oauth/v1/refresh-tokens/{token}); rotate client secret if it leaked. Live access ends on revocation: partial. Deleting a refresh token does not delete access tokens already issued; those last up to 30 minutes. Effect of uninstall on live access tokens not documented.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Stops working when user is removed
- Event names for app uninstall or token revocation
- Whether API calls by OAuth apps are logged for the customer
- Access token format/prefix
- Whether uninstall revokes live access tokens
- No IP allowlist for API calls found; "Allowed login IPs" (Settings > Security > Login) is documented only for logins.
- Whether app governance (approval) covers privately distributed OAuth apps and static-auth apps, or only HubSpot Marketplace listings.
- No admin-set token lifetime or mandatory rotation policy found for private app tokens, static tokens, service keys or the developer API key (only manual rotation and reminders).
- No account-wide switch found to block service key creation other than withholding Developer tools access / Super Admin.

## Sources
- [Manage OAuth access tokens (latest API) - HubSpot docs](https://developers.hubspot.com/docs/api-reference/latest/authentication/manage-oauth-tokens) (retrieved 2026-10-09)
- [Legacy private apps - HubSpot docs](https://developers.hubspot.com/docs/apps/legacy-apps/private-apps/overview) (retrieved 2026-10-09)
- [Authentication overview - HubSpot docs](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/overview) (retrieved 2026-10-09)
- [Manage OAuth access tokens with the 2026-09 API - HubSpot docs](https://developers.hubspot.com/docs/api-reference/latest/authentication/manage-oauth-tokens) (retrieved 2026-10-09)
- [Manage login and account access settings](https://knowledge.hubspot.com/account-security/limit-logins-to-trusted-ip-addresses) (retrieved 2026-10-09)
- [Production-Ready OAuth Token Management for HubSpot Integrations - HubSpot Developers blog](https://developers.hubspot.com/blog/oauth-token-management-hubspot-integrations) (retrieved 2026-10-09)
- [Manage apps in HubSpot - HubSpot docs](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/manage-apps-in-hubspot) (retrieved 2026-10-12)
- [Legacy apps](https://developers.hubspot.com/docs/apps/legacy-apps/overview) (retrieved 2026-10-12)
- [Manage access to apps](https://knowledge.hubspot.com/integrations/manage-access-to-apps) (retrieved 2026-10-13)
- [OAuth quickstart guide](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/oauth/oauth-quickstart-guide) (retrieved 2026-10-14)
- [OAuth v1 API guide](https://developers.hubspot.com/docs/api-reference/auth-oauth-v1/guide) (retrieved 2026-10-14)
- [Legacy public apps](https://developers.hubspot.com/docs/apps/legacy-apps/public-apps/overview) (retrieved 2026-10-14)
- [HubSpot Account activity API](https://developers.hubspot.com/docs/api-reference/account-audit-logs-v3/guide) (retrieved 2026-10-12)
- [HubSpot KB: View and export account activity history](https://knowledge.hubspot.com/account-management/view-and-export-account-activity-history) (retrieved 2026-10-12)
- [HubSpot: Manage OAuth tokens (v3)](https://developers.hubspot.com/docs/api-reference/legacy/authentication/manage-oauth-tokens) (retrieved 2026-10-12)
- [HubSpot OAuth v1 tokens](https://developers.hubspot.com/docs/api-reference/legacy/authentication/oauth-tokens/v1/guide) (retrieved 2026-10-12)
- [API usage guidelines and limits - HubSpot docs](https://developers.hubspot.com/docs/developer-tooling/platform/usage-guidelines) (retrieved 2026-10-14)
