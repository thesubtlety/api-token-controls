# Atlassian Jira / Confluence Cloud: OAuth 3LO

`atlassian-2` · OAuth · person. Email + API token via Basic; scoped API tokens; delegated OAuth 2.0 (3LO) bearer tokens. Forge has a separate app model.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Connected apps page lists installed apps and can filter by installed by user, but does not list individual user grants or tokens. | Connected apps page lists installed apps and can filter by installed by user, but does not list individual user grants or tokens. |
| Protect: Admin can block or require approval | Yes | Block user apps (user-installed apps) | Block user apps (user-installed apps): Atlassian Administration > Apps > [site] > Connected apps > settings > Block user apps |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional (requires Premium (Jira, JSM, Confluence, Compass) or Enterprise (Analytics, Focus)) | Atlassian's app IP allowlist explicitly does not apply to OAuth 2.0 (3LO) apps, Connect apps, or Forge apps. Rovo MCP Server requests are a separate case and must come from allowlisted IPs. | IP allowlists: admin.atlassian.com > Security > Device security > IP allowlists |
| Protect: Expires automatically | Partial | Short-lived; honor expires_in | Where: Not configurable; read expires_in in the token response. Refresh tokens rotate and have a limited life |
| Detect: Usage appears in logs | Yes | attributes.actor.auth.authType, attributes.actor.app.id, attributes.actor.onBehalfOf.id, attributes.actor.auth.tokenId | Atlassian organization audit log (Admin > Insights > Audit log; Organizations REST API /v1/orgs/{orgId}/events and /events-stream): Requires Atlassian Guard Standard/Premium or an Enterprise plan; 180-day retention, default view 7 days. API token activities only for managed (claimed-domain) accounts. Third-party app actions logged as 'Third-party app Jira API request' / 'Third-party app Confluence API request'. · Connected apps (user profile) and Admin > Apps (Marketplace and third-party apps): User-level grant list; admin sees installed 3LO apps and can uninstall. |
| Detect: Data reads appear in logs | Conditional | Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries.; Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries. | Where: Atlassian Administration > Insights > Audit log; filter activity "Viewed Jira issue" / "Viewed Confluence page" and the user · API: GET https://api.atlassian.com/admin/v1/orgs/{orgId}/events?action=<activity>&actor=<accountId> |
| Respond: Revocation ends active access | Yes | Docs say access tokens work until expiry or revocation and the app cannot work after the user revokes consent. Only the user can revoke a single grant; admins can only uninstall the app. No timing stated. | Where: Atlassian Administration > Apps > Atlassian apps > (site) > Connected apps > Uninstall (revokes all users; admins cannot revoke one user's grant) |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **IP allowlists** (Limit network; Premium (Jira, JSM, Confluence, Compass) or Enterprise (Analytics, Focus); default off). Users outside allowed IPs/locations cannot reach Jira/Confluence content, including via the APIs. Where: admin.atlassian.com > Security > Device security > IP allowlists.
- **Block user apps (user-installed apps)** (Disable; all plans; default off). Restricts app installation to admins so end users cannot grant third-party (3LO) apps access. Where: Atlassian Administration > Apps > [site] > Connected apps > settings > Block user apps.
- **Marketplace and custom app access control (data security policy)** (Limit resources; Any plan to block all; Atlassian Guard Standard/Premium for selective allow; default off). Blocks eligible installed apps from user-generated content, org-wide or in selected spaces; finer allow-lists need Guard. Where: Atlassian Administration > Security > Data protection > Data security policy > Marketplace and custom app access.

- Network: excluded (checked at unknown). Atlassian's app IP allowlist explicitly does not apply to OAuth 2.0 (3LO) apps, Connect apps, or Forge apps. Rovo MCP Server requests are a separate case and must come from allowlisted IPs.
- Lifetime: Short-lived; honor expires_in. Renewal: Rotating refresh token with 90-day inactivity expiry.
- Keyless option: not_verified. General inbound external-IdP token exchange is not established for product REST APIs. SAML SSO alone does not replace API credentials.
- Conditions: Product IP allowlisting requires Premium/Enterprise. SAML SSO typically requires Atlassian Guard Standard or an included entitlement.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Atlassian organization audit log (Admin > Insights > Audit log; Organizations REST API /v1/orgs/{orgId}/events and /events-stream): Requires Atlassian Guard Standard/Premium or an Enterprise plan; 180-day retention, default view 7 days. API token activities only for managed (claimed-domain) accounts. Third-party app actions logged as 'Third-party app Jira API request' / 'Third-party app Confluence API request'.
- Connected apps (user profile) and Admin > Apps (Marketplace and third-party apps): User-level grant list; admin sees installed 3LO apps and can uninstall.

### Fields that identify the credential
- `attributes.actor.auth.authType` (Org audit log events API): enum includes api-token, auth-token-for-2LO, auth-token-for-3LO
- `attributes.actor.app.id` (Org audit log events API): app acting
- `attributes.actor.onBehalfOf.id` (Org audit log events API): user the app acts for
- `attributes.actor.auth.tokenId` (Org audit log events API): ID of the authentication token

### Lifecycle events
- use: `Third-party app Jira API request` App actions category
- use: `Third-party app Confluence API request` App actions category
- revoke: `Deactivated account` consenting user disabled
- use: `Logged in to account` interactive login preceding consent

### Correlate on
`attributes.actor.app.id`, `attributes.actor.onBehalfOf.id`, `attributes.actor.auth.authType`, `attributes.location.ip`, `attributes.container[].id`, `ALQL: app, actor, "auth type" = oauth, "ip address"`

### API calls a holder can make, and whether they are logged
- recon: `GET https://api.atlassian.com/oauth/token/accessible-resources`. Sites (cloudid) and the scopes the token holds on each Logged: unknown. Needed to build api.atlassian.com/ex/jira/{cloudId} URLs.
- recon: `GET https://api.atlassian.com/me`. Public profile of the authorizing user Logged: unknown. 
- enumeration (bulk): `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/users/search`. All users in the site Logged: unknown. 
- discovery (bulk): `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/project/search`. Projects visible to the principal Logged: unknown. 
- collection (bulk): `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/search/jql`. Issues matching JQL, paged with nextPageToken Logged: plan. Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries.
- collection (bulk): `GET https://api.atlassian.com/ex/confluence/{cloudId}/wiki/api/v2/pages`. Confluence pages (bodies via body-format) Logged: plan. Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries.

### What to look for (analyst guidance)
- new 3LO app making Third-party app Jira/Confluence API requests for a user who never used it
- app acting onBehalfOf a user after the user is deactivated
- burst of read requests across many projects shortly after consent (consent phishing)
- same app/user pair from a new ASN or country
- refresh failures (invalid_grant) at the app after password reset, followed by renewed consent

### Sample query (Atlassian audit log ALQL)
List OAuth-authenticated activity tied to one user to spot unexpected apps or IPs.

```
created >= "2026-09-12" AND "auth type" = oauth AND actor = "Fran Perez" ORDER BY created desc
```

## Respond: how to revoke it
- Admin: **Uninstall connected app**. Uninstalling a 3LO app from the site revokes all users' grants. Where: Atlassian Administration > Apps > [site] > Connected apps > Manage authorization > Uninstall.

User revokes the grant on their Connected apps screen; admin uninstalls the 3LO app (revokes all users) and can enable 'Block user apps'; reset password / deactivate the user. Live access ends on revocation: yes. Docs say access tokens work until expiry or revocation and the app cannot work after the user revokes consent. Only the user can revoke a single grant; admins can only uninstall the app. No timing stated.

## No vendor documentation found
- SSO and MFA rules apply
- Stops working when user is removed
- token prefix/format
- access token lifetime (returned per token as expires_in)
- activity key values for third-party app API requests
- consent/grant created or revoked audit events
- whether ALQL auth type 'oauth' covers 3LO only or also 2LO
- user agent field
- Whether 3LO API reads appear in the org audit log
- Per-endpoint OAuth point costs
- Whether IP allowlists apply to service account credentials calling api.atlassian.com.
- Whether OAuth 2.0 service account client secrets expire or can be given an expiry (no official statement found; access tokens last 60 minutes).
- Whether the authentication-policy API token block also applies to service accounts.
- No per-app allow/block list for 3LO user grants was found in official docs (only the global Block user apps toggle).

## Sources
- [Manage API tokens for your Atlassian account](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/) (retrieved 2026-10-09)
- [OAuth 2.0 (3LO) apps - Atlassian](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/) (retrieved 2026-10-09)
- [Security for other integrations - Atlassian](https://developer.atlassian.com/cloud/jira/platform/security-for-other-integrations/) (retrieved 2026-10-09)
- [Scope of IP allowlists in Atlassian Cloud](https://support.atlassian.com/atlassian-cloud/kb/what-is-the-scope-of-ip-allowlists-in-atlassian-cloud/) (retrieved 2026-10-09)
- [Understand user API tokens - Atlassian Support](https://support.atlassian.com/organization-administration/docs/understand-user-api-tokens/) (retrieved 2026-10-09)
- [Manage your organization's Marketplace and third-party apps](https://support.atlassian.com/security-and-access-policies/docs/manage-your-users-third-party-apps/) (retrieved 2026-10-09)
- [Specify IP addresses for app access - Atlassian Support](https://support.atlassian.com/security-and-access-policies/docs/specify-ip-addresses-for-product-access/) (retrieved 2026-10-09)
- [View and filter installed apps](https://support.atlassian.com/organization-administration/docs/viewing-and-filtering-installed-apps/) (retrieved 2026-10-14)
- [Implementing the refresh token flow](https://developer.atlassian.com/cloud/oauth/getting-started/refresh-tokens/) (retrieved 2026-10-14)
- [View audit log activities](https://support.atlassian.com/security-and-access-policies/docs/view-audit-log-activities/) (retrieved 2026-10-12)
- [Audit log activities database](https://support.atlassian.com/security-and-access-policies/docs/audit-log-activities-database/) (retrieved 2026-10-12)
- [Organizations REST API: Events](https://developer.atlassian.com/cloud/admin/organization/rest/api-group-events/) (retrieved 2026-10-12)
- [ALQL fields](https://support.atlassian.com/security-and-access-policies/docs/alql-fields/) (retrieved 2026-10-12)
- [What is advanced search in audit log?](https://support.atlassian.com/security-and-access-policies/docs/what-is-advanced-search-in-audit-log/) (retrieved 2026-10-12)
- [Jira Cloud REST v3 OpenAPI](https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json) (retrieved 2026-10-12)
- [Confluence Cloud REST v2 OpenAPI](https://dac-static.atlassian.com/cloud/confluence/openapi-v2.v3.json) (retrieved 2026-10-12)
- [Jira rate limiting](https://developer.atlassian.com/cloud/jira/platform/rate-limiting/) (retrieved 2026-10-12)
- [Track organization activities from the audit log](https://support.atlassian.com/security-and-access-policies/docs/track-organization-activities-from-the-audit-log/) (retrieved 2026-10-12)
- [What activities does the audit log include?](https://support.atlassian.com/security-and-access-policies/docs/accessing-audit-log-activities/) (retrieved 2026-10-12)
- [Block Marketplace and custom app access | Atlassian Support](https://support.atlassian.com/security-and-access-policies/docs/block-app-access/) (retrieved 2026-10-13)
