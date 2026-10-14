# HubSpot: Service key

`hubspot-5` · API key / token · service. Account-level API key created in Development > Keys > Service keys (also shown under Settings > Integrations > Service Keys), with selected object scopes. It is sent as a Bearer token and only authenticates REST API requests, not webhooks, UI extensions or other app features.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | All keys are listed at Development > Keys > Service Keys (also Settings > Integrations > Service Keys). | All keys are listed at Development > Keys > Service Keys (also Settings > Integrations > Service Keys). |
| Protect: Admin can block or require approval | Yes | User permission: Developer tools access | User permission: Developer tools access: Settings > Users & Teams > user > permissions (Settings access) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | HubSpot's trusted-IP and allowed-location settings limit account logins (Starter, Professional or Enterprise; Super Admin). The service key docs and launch posts do not mention any source-IP control for API calls made with a service key. |  |
| Protect: Expires automatically | No docs found | No expiry documented; rotation or deletion ends access |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | HubSpot security activity (Account activity API /account-info/v3/activity/security): Records user actions such as PRIVATE_APP_ACCESS_TOKEN_VIEW and INSTALL_INTEGRATION with IP/location. UI shows 30 days; export covers last year. Scope account-info.security.read. · Service key 'View logs': Recent requests for the key from its details page. Retention and fields not documented. |
| Detect: Data reads appear in logs | Yes | GET /crm/v3/objects/contacts | Where: Development > Keys > Service keys > {key} > View logs |
| Respond: Revocation ends active access | Yes | 'Rotate and expire later' keeps the old key valid for 7 days. | Development > Keys > Service keys > key > Rotate > 'Rotate and expire now'; or Delete the key. |
| Respond: Stops working when user is removed | N/A | Service keys are account-level and keep working after the creator leaves. |  |

## Protect: what an admin can configure

### Admin controls
- **User permission: Developer tools access** (Disable; all plans; default off). Controls which non-Super Admin users can access developer features; creating service keys requires it. Where: Settings > Users & Teams > user > permissions (Settings access).
- **Service key scopes** (Limit scope; all plans; default varies). Each key gets only the scopes selected, and only scopes the creating user already has; editable later. Where: Settings > Integrations > Service Keys (or Development > Keys > Service Keys) > key > Edit.
- **Service key Rotate / Delete** (Other; all plans; default unknown). Rotate creates a new key and expires the old one now or in 7 days; Delete removes the key. Where: Settings > Integrations > Service Keys > key > Rotate / Delete.

- Network: unknown (checked at login_only). HubSpot's trusted-IP and allowed-location settings limit account logins (Starter, Professional or Enterprise; Super Admin). The service key docs and launch posts do not mention any source-IP control for API calls made with a service key.
- Lifetime: No expiry documented; rotation or deletion ends access. Renewal: The key is reused until rotated or deleted; rotation can expire the old key immediately or after a 7-day overlap, which can be ended early or cancelled (cancelling revokes the new key).
- Keyless option: not_applicable. Static account key created in the HubSpot UI; no external identity exchange is documented for service keys.
- Conditions: Announced as the replacement for UI-created legacy private apps for in-account integrations; legacy private app creation is disabled on 2026-09-28 (new accounts) and 2026-10-26 (existing accounts). Subject to the same rate limits as privately distributed apps (tiers listed from Free to Enterprise); no separate plan requirement is documented. Separate from project-app static auth tokens (hubspot-3).

## Detect: what gets logged
- Token prefix: `pat-na1-`

### Logs
- HubSpot security activity (Account activity API /account-info/v3/activity/security): Records user actions such as PRIVATE_APP_ACCESS_TOKEN_VIEW and INSTALL_INTEGRATION with IP/location. UI shows 30 days; export covers last year. Scope account-info.security.read.
- Service key 'View logs': Recent requests for the key from its details page. Retention and fields not documented.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`userId`, `actingUser`, `ipAddress`, `createdAt`

### API calls a holder can make, and whether they are logged
- collection: `GET /crm/v3/objects/contacts`. CRM contact records Logged: yes. Per-key request log via View logs on the key's details page; retention not stated.

### What to look for (analyst guidance)
- Service key created by a user with Developer tools access who is not on the integrations team
- Scopes added to an existing key (Edit) without a change ticket
- Key used against object types outside its stated purpose (seen in View logs)
- Key older than 6 months without rotation

### Sample query (HubSpot UI (service key View logs))
Review recent requests made with a suspected key.

```
Development > Keys > Service keys > <key> > View logs; filter by date range
```

## Respond: how to revoke it


Development > Keys > Service keys > key > Rotate > 'Rotate and expire now'; or Delete the key. Live access ends on revocation: yes. 'Rotate and expire later' keeps the old key valid for 7 days.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Audit/security events for service key create, view, scope change, rotate, delete
- View logs fields and retention
- Full token regex
- No IP allowlist for API calls found; "Allowed login IPs" (Settings > Security > Login) is documented only for logins.
- Whether app governance (approval) covers privately distributed OAuth apps and static-auth apps, or only HubSpot Marketplace listings.
- No admin-set token lifetime or mandatory rotation policy found for private app tokens, static tokens, service keys or the developer API key (only manual rotation and reminders).
- No account-wide switch found to block service key creation other than withholding Developer tools access / Super Admin.

## Sources
- [Make API requests using a service key](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/account-service-keys) (retrieved 2026-10-12)
- [HubSpot Service Keys: The Right API Credential for Data Integrations](https://developers.hubspot.com/blog/hubspot-service-keys-the-right-api-credential-for-data-integrations) (retrieved 2026-10-12)
- [Manage login and account access settings](https://knowledge.hubspot.com/account-security/limit-logins-to-trusted-ip-addresses) (retrieved 2026-10-09)
- [Legacy Private App Creation Being Disabled - HubSpot Developer Changelog](https://developers.hubspot.com/changelog/legacy-private-app-creation-sunset) (retrieved 2026-10-12)
- [Service Keys enter public beta for system-to-system integrations](https://developers.hubspot.com/changelog/service-keys) (retrieved 2026-10-13)
- [HubSpot Account activity API](https://developers.hubspot.com/docs/api-reference/account-audit-logs-v3/guide) (retrieved 2026-10-12)
- [HubSpot user permissions guide](https://knowledge.hubspot.com/user-management/hubspot-user-permissions-guide) (retrieved 2026-10-13)
