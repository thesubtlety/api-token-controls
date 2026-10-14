# HubSpot: Private app token

`hubspot-1` · API key / token · service · legacy. Static access token for a legacy (non-project) private app, sent as a Bearer token in the Authorization header. HubSpot implements it on top of OAuth, so client libraries accept it as an access token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Super admins see private apps under Development > Legacy apps; GET /account-info/v3/api-usage/daily/private-apps reports usage for all private apps. | Super admins see private apps under Development > Legacy apps; GET /account-info/v3/api-usage/daily/private-apps reports usage for all private apps. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Trusted-IP documentation restricts account logins; API-call enforcement for private-app/OAuth tokens was not established. |  |
| Protect: Expires automatically | Not available | Long-lived; explicit rotation/revocation |  |
| Detect: Usage appears in logs | Yes | objectId, targetObjectId, appId | HubSpot security activity (Account activity API /account-info/v3/activity/security): Records user actions such as PRIVATE_APP_ACCESS_TOKEN_VIEW and INSTALL_INTEGRATION with IP/location. UI shows 30 days; export covers last year. Scope account-info.security.read. · HubSpot centralized audit log (/account-info/v3/activity/audit-logs): Enterprise only. User actions incl. CRITICAL_ACTION subcategories. Records HubSpot-user actions, not API calls. · Private app Logs tab (API call logs): Per-app API calls for 30 days; filter by method/response/URL; CSV export. No request body, URL params or response payload for successful calls. |
| Detect: Data reads appear in logs | Yes | GET /crm/v3/objects/contacts | Where: Development > Legacy apps > {private app} > Logs tab; Method = GET, search request URL '/crm/v3/objects/contacts'; Export logs (CSV) for 30 days |
| Respond: Revocation ends active access | Yes | 'Rotate and expire later' leaves the old token valid for 7 days; use expire now for incidents. | Private app > Auth > Rotate > 'Rotate and expire now'; or delete the private app (token permanently revoked). Then update the integration with the new token. |
| Respond: Stops working when user is removed | Partial | Removing the user who created the private app makes some (not all) API calls with its token fail. | Where: Settings > Users & Teams > {user} > Actions > Deactivate user, then Actions > Remove from account · API: DELETE /settings/v3/users/{userId} |

## Protect: what an admin can configure

### Admin controls
- **Legacy private app scopes** (Limit scope; all plans; default varies). Super Admin selects which scopes the private app token can use; editable after creation. Where: Development > Legacy apps > app > Scopes / Edit app.
- **Legacy private app token Rotate** (Other; all plans; default unknown). Issues a new token and expires the old one immediately or after 7 days; Super Admins get a reminder after 180 days without rotation. Where: Development > Legacy apps > app > Auth > Rotate.
- **Super Admin required for private apps** (Other; all plans; default on). Only Super Admins can access and create private apps, so withholding Super Admin removes the ability; there is no account-wide off switch. Where: User permissions: Super Admin.

- Network: unknown (checked at login_only). Trusted-IP documentation restricts account logins; API-call enforcement for private-app/OAuth tokens was not established.
- Lifetime: Long-lived; explicit rotation/revocation. Renewal: Rotate the private-app token explicitly, immediately or with a 7-day transition.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: UI creation of new legacy private apps is disabled on 2026-09-28 for accounts created on or after that date and on 2026-10-26 for older accounts; existing legacy private apps keep working. HubSpot points new in-account integrations to service keys (hubspot-5). Migrating a non-project legacy private app to platform 2026.09 is not currently supported. Up to 20 private apps per account.

## Detect: what gets logged
- Token prefix: not established

### Logs
- HubSpot security activity (Account activity API /account-info/v3/activity/security): Records user actions such as PRIVATE_APP_ACCESS_TOKEN_VIEW and INSTALL_INTEGRATION with IP/location. UI shows 30 days; export covers last year. Scope account-info.security.read.
- HubSpot centralized audit log (/account-info/v3/activity/audit-logs): Enterprise only. User actions incl. CRITICAL_ACTION subcategories. Records HubSpot-user actions, not API calls.
- Private app Logs tab (API call logs): Per-app API calls for 30 days; filter by method/response/URL; CSV export. No request body, URL params or response payload for successful calls.

### Fields that identify the credential
- `objectId` (security activity): Private app ID on PRIVATE_APP_ACCESS_TOKEN_VIEW (also in infoUrl /private-apps/{hubId}/{appId}/auth)
- `targetObjectId` (audit log): Private app ID on CRITICAL_ACTION / PRIVATE_APP_ACCESS_TOKEN_VIEW
- `appId` (POST /oauth/v2/private-apps/get/access-token-info): Maps a found token to its private app, plus userId (creator), hubId, scopes

### Lifecycle events
- use: `PRIVATE_APP_ACCESS_TOKEN_VIEW` A user revealed the token in the UI (security activity type / audit subCategory). Possible exfil point.

### Correlate on
`userId`, `actingUser`, `objectId`, `targetObjectId`, `ipAddress`, `countryCode`, `regionCode`, `createdAt`, `occurredAt`, `appId`, `hubId`

### API calls a holder can make, and whether they are logged
- collection: `GET /crm/v3/objects/contacts`. CRM contact records Logged: yes. Shown in the private app's Logs tab for 30 days; request body, URL parameters and response payload are not stored; rate-limit-exempt calls are not logged.

### What to look for (analyst guidance)
- PRIVATE_APP_ACCESS_TOKEN_VIEW by a user who does not own the integration, or from a new country/IP
- Token view followed within hours by API calls in the Logs tab from new patterns (new endpoints, export-heavy reads)
- Private app whose creator was removed (calls failing with USER_DOES_NOT_HAVE_PERMISSIONS) yet still active
- Token not rotated in 180+ days (HubSpot reminder emails)
- Scopes broadened on a private app with no change ticket

### Sample query (HubSpot Account activity API (query parameters))
Find who revealed private app tokens, from where, before a suspected leak.

```
GET /account-info/v3/activity/security?fromTimestamp=2026-09-01T00:00:00Z&toTimestamp=2026-10-12T00:00:00Z  -- filter results where type == 'PRIVATE_APP_ACCESS_TOKEN_VIEW'
```

## Respond: how to revoke it
- Admin: **Delete legacy private app**. Deleting the app permanently revokes its access token. Where: Development > Legacy apps > app > Auth > Delete.

Private app > Auth > Rotate > 'Rotate and expire now'; or delete the private app (token permanently revoked). Then update the integration with the new token. Live access ends on revocation: yes. 'Rotate and expire later' leaves the old token valid for 7 days; use expire now for incidents.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Token prefix/regex
- Event names for private app create, scope change, rotation and deletion
- Whether private app API calls appear in account audit log
- Client IP of API calls in Logs tab
- No IP allowlist for API calls found; "Allowed login IPs" (Settings > Security > Login) is documented only for logins.
- Whether app governance (approval) covers privately distributed OAuth apps and static-auth apps, or only HubSpot Marketplace listings.
- No admin-set token lifetime or mandatory rotation policy found for private app tokens, static tokens, service keys or the developer API key (only manual rotation and reminders).
- No account-wide switch found to block service key creation other than withholding Developer tools access / Super Admin.

## Sources
- [Manage OAuth access tokens (latest API) - HubSpot docs](https://developers.hubspot.com/docs/api-reference/latest/authentication/manage-oauth-tokens) (retrieved 2026-10-09)
- [Legacy private apps - HubSpot docs](https://developers.hubspot.com/docs/apps/legacy-apps/private-apps/overview) (retrieved 2026-10-09)
- [Authentication overview - HubSpot docs](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/overview) (retrieved 2026-10-09)
- [Manage login and account access settings](https://knowledge.hubspot.com/account-security/limit-logins-to-trusted-ip-addresses) (retrieved 2026-10-09)
- [Legacy Private App Creation Being Disabled - HubSpot Developer Changelog](https://developers.hubspot.com/changelog/legacy-private-app-creation-sunset) (retrieved 2026-10-12)
- [Deactivate and remove HubSpot users](https://knowledge.hubspot.com/user-management/remove-hubspot-users) (retrieved 2026-10-14)
- [HubSpot User Provisioning API v3 (official OpenAPI spec)](https://github.com/HubSpot/HubSpot-public-api-spec-collection/blob/main/PublicApiSpecs/Settings/User%20Provisioning/Rollouts/144927/v3/userProvisioning.json) (retrieved 2026-10-14)
- [HubSpot Account activity API](https://developers.hubspot.com/docs/api-reference/account-audit-logs-v3/guide) (retrieved 2026-10-12)
- [HubSpot KB: View and export account activity history](https://knowledge.hubspot.com/account-management/view-and-export-account-activity-history) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [API usage guidelines and limits - HubSpot docs](https://developers.hubspot.com/docs/developer-tooling/platform/usage-guidelines) (retrieved 2026-10-14)
