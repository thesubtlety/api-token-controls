# HubSpot: Static auth token (developer platform)

`hubspot-3` · API key / token · service. Bearer access token for a project-based app configured with auth type static and private distribution in app-hsmeta.json. The token appears on the app's Distribution tab after install.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Apps are listed on the Development > Projects page; the token is shown per app on its Distribution tab, with no org-wide token list. | Apps are listed on the Development > Projects page; the token is shown per app on its Distribution tab, with no org-wide token list. |
| Protect: Admin can block or require approval | Yes | User permission: Developer tools access | User permission: Developer tools access: Settings > Users & Teams > user > permissions (Settings access) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | HubSpot's trusted-IP setting limits account logins (Starter, Professional or Enterprise; Super Admin). Its effect on API calls with static auth tokens is not documented. |  |
| Protect: Expires automatically | No docs found | Static; expiry not documented (rotation every 6 months recommended) |  |
| Detect: Usage appears in logs | Yes | objectId | HubSpot security activity (Account activity API /account-info/v3/activity/security): Records user actions such as PRIVATE_APP_ACCESS_TOKEN_VIEW and INSTALL_INTEGRATION with IP/location. UI shows 30 days; export covers last year. Scope account-info.security.read. · HubSpot centralized audit log (/account-info/v3/activity/audit-logs): Enterprise only. User actions incl. CRITICAL_ACTION subcategories. Records HubSpot-user actions, not API calls. |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | No docs found | Fetched docs do not describe expire-now vs expire-later semantics for static tokens. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **User permission: App Marketplace access** (Other; all plans; default unknown). Only Super Admins and users with this permission (plus matching scope permissions) can install apps. Where: Settings > Users & Teams > user > permissions (Settings access).
- **Deselect optional scopes at install** (Limit scope; all plans; default unknown). The installing user can clear optional scopes before connecting the app. Where: Install consent screen (Connect app).
- **User permission: Developer tools access** (Disable; all plans; default off). Controls which non-Super Admin users can access developer features; creating service keys requires it. Where: Settings > Users & Teams > user > permissions (Settings access).
- **Static auth token view/rotate restricted** (Other; all plans; default on). Only Super Admins or users with a developer seat on the account can view or rotate the static token. Where: Development > Projects > app > Distribution tab.

- Network: unknown (checked at login_only). HubSpot's trusted-IP setting limits account logins (Starter, Professional or Enterprise; Super Admin). Its effect on API calls with static auth tokens is not documented.
- Lifetime: Static; expiry not documented (rotation every 6 months recommended). Renewal: The token is reused for API calls and rotated from the Distribution tab; whether the old token is invalidated immediately is not documented.
- Keyless option: not_applicable. Static token tied to a single installed account; no external identity exchange is documented.
- Conditions: Installs in 1 standard account at a time plus up to 10 developer test accounts. Static auth apps cannot use user-level access. Distinct from legacy private app tokens (hubspot-1), whose UI creation HubSpot disables in Sept/Oct 2026, and from account service keys (hubspot-5), which are not tied to an app.

## Detect: what gets logged
- Token prefix: not established

### Logs
- HubSpot security activity (Account activity API /account-info/v3/activity/security): Records user actions such as PRIVATE_APP_ACCESS_TOKEN_VIEW and INSTALL_INTEGRATION with IP/location. UI shows 30 days; export covers last year. Scope account-info.security.read.
- HubSpot centralized audit log (/account-info/v3/activity/audit-logs): Enterprise only. User actions incl. CRITICAL_ACTION subcategories. Records HubSpot-user actions, not API calls.

### Fields that identify the credential
- `objectId` (security activity): Object of INSTALL_INTEGRATION; ID type not documented

### Lifecycle events
- create: `INSTALL_INTEGRATION` Install of the static-token app into the account (assumed to be logged like other integrations; not confirmed for static apps)

### Correlate on
`userId`, `actingUser`, `objectId`, `ipAddress`, `countryCode`, `createdAt`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Static token app installed into a production account by someone without a developer seat
- Reinstall via Reinstall URL that adds scopes without a change ticket
- Token viewed or rotated by an unexpected super admin
- Token older than 6 months (HubSpot recommends 6-month rotation)

### Sample query (HubSpot Account activity API (query parameters))
Find installs of privately distributed apps, including static-token apps.

```
GET /account-info/v3/activity/security?fromTimestamp=2026-09-01T00:00:00Z&toTimestamp=2026-10-12T00:00:00Z  -- filter type == 'INSTALL_INTEGRATION'
```

## Respond: how to revoke it


Super admin or developer seat: rotate the token on the app's Distribution tab; or uninstall the app from the account. Live access ends on revocation: unknown. Fetched docs do not describe expire-now vs expire-later semantics for static tokens.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- Token format/prefix
- Audit/security event name for static token view or rotation
- API call logs for project-based apps
- Rotation grace period semantics
- Not researched
- No IP allowlist for API calls found; "Allowed login IPs" (Settings > Security > Login) is documented only for logins.
- Whether app governance (approval) covers privately distributed OAuth apps and static-auth apps, or only HubSpot Marketplace listings.
- No admin-set token lifetime or mandatory rotation policy found for private app tokens, static tokens, service keys or the developer API key (only manual rotation and reminders).
- No account-wide switch found to block service key creation other than withholding Developer tools access / Super Admin.

## Sources
- [Authentication overview - HubSpot docs](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/overview) (retrieved 2026-10-09)
- [Manage apps in HubSpot - HubSpot docs](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/manage-apps-in-hubspot) (retrieved 2026-10-12)
- [Manage login and account access settings](https://knowledge.hubspot.com/account-security/limit-logins-to-trusted-ip-addresses) (retrieved 2026-10-09)
- [Legacy Private App Creation Being Disabled - HubSpot Developer Changelog](https://developers.hubspot.com/changelog/legacy-private-app-creation-sunset) (retrieved 2026-10-12)
- [HubSpot Service Keys: The Right API Credential for Data Integrations](https://developers.hubspot.com/blog/hubspot-service-keys-the-right-api-credential-for-data-integrations) (retrieved 2026-10-12)
- [HubSpot Account activity API](https://developers.hubspot.com/docs/api-reference/account-audit-logs-v3/guide) (retrieved 2026-10-12)
- [HubSpot KB: View and export account activity history](https://knowledge.hubspot.com/account-management/view-and-export-account-activity-history) (retrieved 2026-10-12)
- [HubSpot user permissions guide](https://knowledge.hubspot.com/user-management/hubspot-user-permissions-guide) (retrieved 2026-10-13)
