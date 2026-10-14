# Okta (management API): SSWS API token

`okta-1` · API key / token · person. SSWS API tokens; scoped OAuth bearer. Service apps use client credentials authenticated with private_key_jwt.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin Console Security > API > Tokens tab lists tokens; GET /api/v1/api-tokens lists metadata of all active API tokens. | Admin Console Security > API > Tokens tab lists tokens; GET /api/v1/api-tokens lists metadata of all active API tokens. |
| Protect: Admin can block or require approval | Yes | Admin roles that can create API tokens (custom role needs Manage Users permission) | Where: Security > Administrators: assign only roles that may create tokens (super/org/group/group membership/read-only admin); for custom roles, grant or withhold Manage API tokens |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Per-token IP/network-zone restrictions apply to SSWS API calls. Do not automatically extend that control to OAuth tokens. | Token network restriction (API calls made with this token must originate from): Admin Console > Security > API > Tokens > Create token, or token > Security > Edit ('Token can be used from') |
| Protect: Expires automatically | Not available | 30 days unused; use resets clock; period fixed per org |  |
| Detect: Usage appears in logs | Yes | transaction.detail.requestApiTokenId, actor.id, client.id | Okta System Log (Admin Console / GET /api/v1/logs): Records admin/API actions with token or client context; 90-day retention; export to SIEM or Log Streaming for longer. |
| Detect: Data reads appear in logs | Not available | GET not in System Log. |  |
| Respond: Revocation ends active access | Yes | SSWS tokens are validated per request, so revocation stops use. Unused tokens expire after 30 days. Review what the token created (other tokens, OAuth apps, admin roles). | Revoke by ID: Security > API > Tokens, or DELETE /api/v1/api-tokens/{apiTokenId}. Deactivating the owning user deprovisions all their tokens. Add a network condition (PUT /api/v1/api-tokens/{apiTokenId}) to restrict use while investigating. |
| Respond: Stops working when user is removed | Yes | Deactivating the creating user deprovisions all API tokens that user created. | Where: Directory > People > More Actions > Deactivate > select creator > Deactivate Selected · API: POST /api/v1/users/{id}/lifecycle/deactivate |

## Protect: what an admin can configure

### Admin controls
- **Token network restriction (API calls made with this token must originate from)** (Limit network; all plans; default off). Restricts where an SSWS token can be used from: any IP, or in/not in specific IP-based network zones. Where: Admin Console > Security > API > Tokens > Create token, or token > Security > Edit ('Token can be used from').
- **Admin role assignment (token inherits creator permissions)** (Limit scope; all plans; default varies). An SSWS token acts with the creating admin's current permissions, so limiting that admin's roles limits the token; only certain admin roles can create tokens. Where: Admin Console > Security > Administrators (roles of the creating user).
- **Token rate limits** (Other; all plans; default on). Caps the share of each API rate limit a single SSWS token can consume (default 50%). Where: Admin Console > Security > API > Tokens > token > Token rate limits > Edit.
- **Admin roles that can create API tokens (custom role needs Manage Users permission)** (Disable; all plans; default unknown). Only super, org, group, group membership and read-only admins, or custom admin roles that include the Manage Users permission, can create SSWS tokens; other users cannot. Where: Admin role assignment / custom admin role permissions.

### Not available (vendor states)
- Cannot change the 30-day idle expiry of SSWS tokens (no shorter or absolute lifetime).
- Cannot use blocklist zones or non-IP zones to restrict SSWS tokens.

- Network: supported (checked at api_request). Per-token IP/network-zone restrictions apply to SSWS API calls. Do not automatically extend that control to OAuth tokens.
- Lifetime: 30 days unused; use resets clock; period fixed per org. Renewal: Each use extends the 30-day inactivity window. No refresh token is involved.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: Org authorization-server rules govern Okta APIs. Custom authorization-server lifetime policies do not govern these tokens.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Okta System Log (Admin Console / GET /api/v1/logs): Records admin/API actions with token or client context; 90-day retention; export to SIEM or Log Streaming for longer.

### Fields that identify the credential
- `transaction.detail.requestApiTokenId` (Okta System Log): Token ID of the SSWS token that caused the event; matches id in Security > API and /api/v1/api-tokens.
- `actor.id` (Okta System Log): Admin user who owns the token; token inherits that user's privileges.
- `client.id` (Okta System Log): For SSWS requests, the ID of the agent making the request.

### Lifecycle events
- create: `system.api_token.create` New unscoped API token generated.
- change: `system.api_token.enable` Enable API token.
- change: `system.api_token.update` Token changed (e.g. network condition); validity unchanged.
- revoke: `system.api_token.revoke` Revoke API token.
- auth_fail: `system.api_token.request_outside_allowed_range` Request from outside the token's allowed network zone.

### Correlate on
`transaction.detail.requestApiTokenId`, `actor.id`, `actor.alternateId`, `client.ipAddress`, `client.userAgent.rawUserAgent`, `client.id`, `client.zone`, `securityContext.asNumber`, `securityContext.asOrg`, `request.ipChain`, `transaction.id`, `uuid`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/v1/users/me`. Profile of the admin user who created the SSWS token (token owner, not a session user) Logged: no. System Log does not record GET calls; token 'last used' in Admin Console still updates.
- recon: `GET /api/v1/users/{userId}/roles`. Admin role assignments held by the token owner Logged: no. GET not in System Log.
- enumeration (bulk): `GET /api/v1/users`. All users and their profiles (listUsers) Logged: no. GET not in System Log; rate-limit dashboard can show top-consuming tokens.
- discovery (bulk): `GET /api/v1/apps`. All app integrations (listApplications) Logged: no. GET not in System Log.
- collection (bulk): `GET /api/v1/logs`. System Log events; lets the holder read the same telemetry defenders use (listLogEvents) Logged: no. GET not in System Log.

### Public detection rules (community, not vendor documentation)
- [Okta API Key Created](https://github.com/panther-labs/panther-analysis/blob/develop/rules/okta_rules/okta_api_key_created.yml) (Panther): Successful creation of an Okta API (SSWS) token.
- [Okta API Key Revoked](https://github.com/panther-labs/panther-analysis/blob/develop/rules/okta_rules/okta_api_key_revoked.yml) (Panther): Successful revocation of an Okta API (SSWS) token.
- [Okta API Token Created](https://github.com/SigmaHQ/sigma/blob/master/rules/identity/okta/okta_api_token_created.yml) (Sigma): Any Okta API token creation event.
- [Okta API Token Revoked](https://github.com/SigmaHQ/sigma/blob/master/rules/identity/okta/okta_api_token_revoked.yml) (Sigma): Any Okta API token revocation event.
- [Okta Rate Limits](https://github.com/panther-labs/panther-analysis/blob/develop/rules/okta_rules/okta_rate_limits.yml) (Panther): Okta rate-limit violation events, which API tokens and OAuth clients trigger when they make unusually many requests.

### What to look for (analyst guidance)
- Token ID seen from an IP/ASN outside the integration's usual hosts
- system.api_token.request_outside_allowed_range spikes (stolen token tried from attacker infra)
- Browser user agent on events carrying requestApiTokenId
- Token used for admin changes (role grants, MFA reset, new tokens) it never made before
- system.api_token.create by an admin right after an unusual sign-in
- Activity under a token whose owning admin was recently deactivated or had role removed

### Sample query (Okta System Log filter (/api/v1/logs filter))
All actions by one SSWS token from any IP other than the known integration host.

```
transaction.detail.requestApiTokenId eq "00T94e3cn9kSEO3c51s5" and client.ipAddress ne "203.0.113.10"
```

## Respond: how to revoke it
- Admin: **Revoke token**. Admins can revoke any SSWS API token. Where: Admin Console > Security > API > Tokens > trash icon, or token page > Revoke token.
- Admin: **Deactivate token owner**. Deactivating the user who created a token makes Okta reject the token. Where: Admin Console > Directory > People > deactivate user.

Revoke by ID: Security > API > Tokens, or DELETE /api/v1/api-tokens/{apiTokenId}. Deactivating the owning user deprovisions all their tokens. Add a network condition (PUT /api/v1/api-tokens/{apiTokenId}) to restrict use while investigating. Live access ends on revocation: yes. SSWS tokens are validated per request, so revocation stops use. Unused tokens expire after 30 days. Review what the token created (other tokens, OAuth apps, admin roles).

## No vendor documentation found
- SSO and MFA rules apply
- Documented token secret format/regex
- Dedicated event for invalid/failed SSWS token use (only outside-zone event found)
- Whether every API-token event carries requestApiTokenId (read-only GETs may not be logged)
- Per-endpoint rate limits for /users, /apps, /logs (bucket table not retrieved)
- Whether any Okta add-on logs management-API reads
- Whether any org-wide switch exists to disable SSWS token creation entirely (docs only show role-based limits on who can create tokens).
- Whether network zones can restrict where OAuth service apps call Okta APIs from (org authorization server policies were not confirmed).
- Default state of the Public client app admins setting.

## Sources
- [Implement OAuth for Okta with a service app](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/main/) (retrieved 2026-10-09)
- [Create an API token - Okta Developer](https://developer.okta.com/docs/guides/create-an-api-token/main/) (retrieved 2026-10-09)
- [Okta Management API OpenAPI spec (official, GitHub) - List all API token metadata](https://raw.githubusercontent.com/okta/okta-management-openapi-spec/master/dist/current/management-minimal.yaml) (retrieved 2026-10-14)
- [Manage Okta API tokens](https://help.okta.com/en-us/content/topics/security/api.htm) (retrieved 2026-10-13)
- [Role permissions](https://help.okta.com/oie/en-us/content/topics/security/custom-admin-role/about-role-permissions.htm) (retrieved 2026-10-14)
- [Deactivate and delete user accounts](https://help.okta.com/oie/en-us/content/topics/users-groups-profiles/usgp-deactivate-user-account.htm) (retrieved 2026-10-14)
- [Okta Management API OpenAPI spec (vendor-owned okta-sdk-java repo)](https://raw.githubusercontent.com/okta/okta-sdk-java/master/src/swagger/api.yaml) (retrieved 2026-10-12)
- [System Log query](https://developer.okta.com/docs/reference/system-log-query/) (retrieved 2026-10-12)
- [Okta Data Retention Policy](https://support.okta.com/help/s/article/Okta-Data-Retention-Policy) (retrieved 2026-10-12)
- [Okta Event Types](https://developer.okta.com/docs/reference/api/event-types/) (retrieved 2026-10-12)
- [Okta Management API - Users](https://developer.okta.com/docs/api/openapi/okta-management/management/tag/User/) (retrieved 2026-10-12)
- [Do API calls generate events in system logs](https://support.okta.com/help/s/article/Do-API-calls-generate-events-in-system-logs) (retrieved 2026-10-12)
- [Admin dashboard shows recent activity for an API token but no logs](https://support.okta.com/help/s/article/okta-admin-dashboard-shows-recent-activity-for-an-api-token-but-there-are-no-corresponding-logs) (retrieved 2026-10-12)
- [Okta OAuth 2.0 scopes](https://developer.okta.com/docs/api/oauth2/) (retrieved 2026-10-12)
- [Okta rate limit best practices](https://developer.okta.com/docs/reference/rl-best-practices/) (retrieved 2026-10-12)
- [Minimum Permissions for Custom Administrator Roles to Create Okta API Tokens](https://support.okta.com/help/s/article/minimum-rights-for-custom-admin-roles-to-create-api-tokens?language=en_US) (retrieved 2026-10-14)
