# HubSpot: Developer API key

`hubspot-4` · API key / token · service. Account-level key passed as the hapikey query parameter, usually with appId, for app features and settings that require it (for example the custom channels API). It is not a general CRM data credential.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Only one key per account; it is shown at Development > Keys > Developer API key. | Only one key per account; it is shown at Development > Keys > Developer API key. |
| Protect: Admin can block or require approval | Yes | User permission: Developer tools access | User permission: Developer tools access: Settings > Users & Teams > user > permissions (Settings access) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | HubSpot's trusted-IP setting limits account logins. Its effect on calls made with a developer API key is not documented. |  |
| Protect: Expires automatically | No docs found | Static; expiry not documented |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | None documented for developer API key use: Fetched docs list no call log or audit events for developer API keys. |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | No docs found | Docs say the key can be deactivated at any time; timing of enforcement not stated. |  |
| Respond: Stops working when user is removed | N/A | The developer API key belongs to the account, not to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **User permission: Developer tools access** (Disable; all plans; default off). Controls which non-Super Admin users can access developer features; creating service keys requires it. Where: Settings > Users & Teams > user > permissions (Settings access).

- Network: unknown (checked at login_only). HubSpot's trusted-IP setting limits account logins. Its effect on calls made with a developer API key is not documented.
- Lifetime: Static; expiry not documented. Renewal: The key is reused until deactivated; deactivate it and generate a new one to rotate.
- Keyless option: not_applicable. Static account key; no external identity exchange is documented.
- Conditions: Still documented in current developer-platform docs; no current deprecation notice found. Separate from the account API keys (hapikey) sunset in 2022.

## Detect: what gets logged
- Token prefix: not established

### Logs
- None documented for developer API key use: Fetched docs list no call log or audit events for developer API keys.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`appId (request parameter)`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- hapikey appearing in proxy/web server logs, referrers or URL-capturing tools (query-string credential)
- Unexpected changes to app features that require the key (e.g., custom channels registrations) for an appId
- Key not rotated after a developer leaves

### Sample query (none (no vendor log))
Find where the query-string key was used or leaked.

```
Search own proxy/web logs for 'hapikey=' in request URLs to api.hubapi.com
```

## Respond: how to revoke it
- Admin: **Developer API key deactivate/regenerate**. The single per-account developer API key can be deactivated and replaced at any time. Where: Development > Keys > Developer API key.

Development > Keys > Developer API key: deactivate the key and generate a new one. Live access ends on revocation: unknown. Docs say the key can be deactivated at any time; timing of enforcement not stated.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Any HubSpot log of developer API key use or rotation
- Key format/prefix
- Whether deactivation is immediate
- Not researched
- No IP allowlist for API calls found; "Allowed login IPs" (Settings > Security > Login) is documented only for logins.
- Whether app governance (approval) covers privately distributed OAuth apps and static-auth apps, or only HubSpot Marketplace listings.
- No admin-set token lifetime or mandatory rotation policy found for private app tokens, static tokens, service keys or the developer API key (only manual rotation and reminders).
- No account-wide switch found to block service key creation other than withholding Developer tools access / Super Admin.

## Sources
- [Manage apps in HubSpot - HubSpot docs](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/manage-apps-in-hubspot) (retrieved 2026-10-12)
- [Authentication overview - HubSpot docs](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/overview) (retrieved 2026-10-09)
- [Manage login and account access settings](https://knowledge.hubspot.com/account-security/limit-logins-to-trusted-ip-addresses) (retrieved 2026-10-09)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [HubSpot user permissions guide](https://knowledge.hubspot.com/user-management/hubspot-user-permissions-guide) (retrieved 2026-10-13)
