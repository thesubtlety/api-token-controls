# Atlassian Jira / Confluence Cloud: API token (product REST)

`atlassian-1` · API key / token · person or service. Email + API token via Basic; scoped API tokens; delegated OAuth 2.0 (3LO) bearer tokens. Forge has a separate app model.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Atlassian Administration > Insights > API token activity (and the Get API tokens API) lists tokens created by managed accounts only. | Atlassian Administration > Insights > API token activity (and the Get API tokens API) lists tokens created by managed accounts only. |
| Protect: Admin can block or require approval | Yes | User API tokens (authentication policy); API token access for external users | User API tokens (authentication policy): Atlassian Administration > Security > User security > Authentication policies > Edit > Block members from creating a new or using an existing API token · API token access for external users: Atlassian Administration > Security > User security > External users > API token access for external users > Block |
| Protect: SSO and MFA rules apply | Not available | Atlassian says API tokens and scripts keep working after SAML SSO is enforced; token use is governed by the separate User API tokens policy setting. |  |
| Protect: IP restriction | Yes | Site IP allowlists cover Jira/Confluence REST access. Organization administration and provisioning APIs have separate coverage and are excluded from site rules. | IP allowlists: admin.atlassian.com > Security > Device security > IP allowlists |
| Protect: Expires automatically | Yes | Default 365 days; choose 1–365 days | User API token expiration (authentication policy): Atlassian Administration > Security > User security > Authentication policies > Edit > Never expires / Expires |
| Detect: Usage appears in logs | Yes | attributes.actor.auth.authType, attributes.actor.auth.tokenId, attributes.actor.auth.tokenLabel, id, label, lastActiveAt, user.id | Atlassian organization audit log (Admin > Insights > Audit log; Organizations REST API /v1/orgs/{orgId}/events and /events-stream): Requires Atlassian Guard Standard/Premium or an Enterprise plan; 180-day retention, default view 7 days. API token activities only for managed (claimed-domain) accounts. · API token activity (Admin > Insights) / API Access REST API GET /v1/orgs/{orgId}/api-tokens: Inventory of managed users' tokens: created, expiry, last used, scopes, status. Any plan. · Atlassian account API token page (id.atlassian.com): Owner's own token list; owner can revoke one or all. |
| Detect: Data reads appear in logs | Conditional | Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries.; Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries. | Where: Atlassian Administration > Insights > Audit log; filter activity "Viewed Jira issue" / "Viewed Confluence page" and the token owner · API: GET https://api.atlassian.com/admin/v1/orgs/{orgId}/events?action=<activity>&actor=<accountId> |
| Respond: Revocation ends active access | Yes | Token is sent on each request (Basic/Bearer), so revocation stops further calls; propagation delay not documented for user tokens (service-account tokens: up to 10 min). Revocation is permanent. | Admin: Insights > API token activity > Revoke (or DELETE /v1/orgs/{orgId}/api-tokens for all managed user tokens); owner: id.atlassian.com > Revoke / Revoke all. Optionally block user API token access via authentication policy; deactivate account. |
| Respond: Stops working when user is removed | Partial | Deleting the account revokes token access, but deactivation or SCIM unsync does not remove site access and tokens stay usable until access is removed or tokens are revoked. | Where: Atlassian Administration > Directory > Users > Account type = Managed accounts > user > ••• > Delete account; or revoke tokens at Insights > API token activity > Revoke · API: POST https://api.atlassian.com/users/{account_id}/manage/lifecycle/delete; DELETE https://api.atlassian.com/users/{account_id}/manage/api-tokens/{tokenId} |

## Protect: what an admin can configure

### Admin controls
- **User API tokens (authentication policy)** (Disable; all plans; default off). Blocks members in a policy from creating new or using existing user API tokens against the org's apps; takes up to 10 minutes. Where: Atlassian Administration > Security > User security > Authentication policies > Edit > Block members from creating a new or using an existing API token.
- **User API token expiration (authentication policy)** (Limit lifetime; Atlassian Guard Standard; default varies). Sets user API tokens of policy members to expire after 1-365 days (or never). Where: Atlassian Administration > Security > User security > Authentication policies > Edit > Never expires / Expires.
- **API token access for external users** (Disable; Atlassian Guard Standard; default off). Blocks external (unmanaged) users from calling app APIs with user API tokens, including existing tokens. Where: Atlassian Administration > Security > User security > External users > API token access for external users > Block.
- **IP allowlists** (Limit network; Premium (Jira, JSM, Confluence, Compass) or Enterprise (Analytics, Focus); default off). Users outside allowed IPs/locations cannot reach Jira/Confluence content, including via the APIs. Where: admin.atlassian.com > Security > Device security > IP allowlists.

### Not available (vendor states)
- The Marketplace and custom app access control cannot block apps that use Atlassian API tokens.
- Admins cannot create or issue API tokens on a user's behalf (only users create them).

- Network: supported (checked at api_request). Site IP allowlists cover Jira/Confluence REST access. Organization administration and provisioning APIs have separate coverage and are excluded from site rules.
- Lifetime: Default 365 days; choose 1–365 days. Renewal: The static API token is reused on each request until it expires (1 to 365 days); after that the user must create a new token. No refresh token is involved.
- Keyless option: not_verified. General inbound external-IdP token exchange is not established for product REST APIs. SAML SSO alone does not replace API credentials.
- Conditions: Product IP allowlisting requires Premium/Enterprise. SAML SSO typically requires Atlassian Guard Standard or an included entitlement.

## Detect: what gets logged
- Token prefix: `ATAT`

### Logs
- Atlassian organization audit log (Admin > Insights > Audit log; Organizations REST API /v1/orgs/{orgId}/events and /events-stream): Requires Atlassian Guard Standard/Premium or an Enterprise plan; 180-day retention, default view 7 days. API token activities only for managed (claimed-domain) accounts.
- API token activity (Admin > Insights) / API Access REST API GET /v1/orgs/{orgId}/api-tokens: Inventory of managed users' tokens: created, expiry, last used, scopes, status. Any plan.
- Atlassian account API token page (id.atlassian.com): Owner's own token list; owner can revoke one or all.

### Fields that identify the credential
- `attributes.actor.auth.authType` (Org audit log events API): enum includes api-token, auth-token-for-2LO, auth-token-for-3LO
- `attributes.actor.auth.tokenId` (Org audit log events API): ID of the authentication token
- `attributes.actor.auth.tokenLabel` (Org audit log events API): label/name of the token
- `id` (API Access REST API api-tokens): token ID
- `label` (API Access REST API api-tokens): token name
- `lastActiveAt` (API Access REST API api-tokens): last use time
- `user.id` (API Access REST API api-tokens): owning account

### Lifecycle events
- create: `Created API token` Settings category; ALQL key ts_api_token_creation
- revoke: `Revoked API token` user token revoked; ALQL key api_token_revoked
- revoke: `Revoked API tokens for users in authentication policy` bulk via auth policy
- change: `Viewed API token` admin viewed token details
- change: `Exported API tokens` CSV export of token inventory
- revoke: `Deactivated account` owner account disabled

### Correlate on
`attributes.actor.id`, `attributes.actor.email`, `attributes.actor.auth.authType`, `attributes.actor.auth.tokenId`, `attributes.location.ip`, `attributes.location.countryName`, `attributes.container[].id`, `ALQL: actor, "auth type", "ip address", site, app`

### API calls a holder can make, and whether they are logged
- recon: `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/myself`. accountId, email, groups and application roles of the token principal Logged: unknown. API token last-used is visible in Insights > API token activity (managed accounts).
- recon: `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/mypermissions`. Which Jira permissions the principal holds Logged: unknown. 
- enumeration (bulk): `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/users/search`. All users in the site Logged: unknown. 
- discovery (bulk): `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/project/search`. Projects visible to the principal Logged: unknown. 
- collection (bulk): `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/search/jql`. Issues matching JQL, paged with nextPageToken Logged: plan. Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries.
- collection (bulk): `GET https://api.atlassian.com/ex/confluence/{cloudId}/wiki/api/v2/pages`. Confluence pages (bodies via body-format) Logged: plan. Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries.

### What to look for (analyst guidance)
- ALQL "auth type" = api-token activity from an IP/country never seen for that actor
- token used (lastActiveAt) after owner Deactivated account or left the project
- Created API token followed within minutes by bulk exports or third-party API reads from a new IP
- token with no expiry set near 1 year and scopes broader than owner's normal work
- same tokenId seen from multiple countries in one day
- unscoped (classic) token used against site URL from cloud/VPS ASN

### Sample query (Atlassian audit log ALQL)
Find API-token activity by one user from outside their known IP range.

```
created >= "2026-09-12" AND "auth type" = api-token AND actor = "Fran Perez" AND "ip address" !~ "203.0.113.*" ORDER BY created desc
```

## Respond: how to revoke it
- Admin: **Revoke user API tokens**. Org admins can permanently revoke managed accounts' API tokens, singly or in bulk, or via the Delete API token API. Where: Atlassian Administration > Insights > API token activity > Revoke.

Admin: Insights > API token activity > Revoke (or DELETE /v1/orgs/{orgId}/api-tokens for all managed user tokens); owner: id.atlassian.com > Revoke / Revoke all. Optionally block user API token access via authentication policy; deactivate account. Live access ends on revocation: yes. Token is sent on each request (Basic/Bearer), so revocation stops further calls; propagation delay not documented for user tokens (service-account tokens: up to 10 min). Revocation is permanent.

## No vendor documentation found
- official regex / full token structure
- user agent field in audit events
- exact action key values returned in attributes.action for token use events
- whether every data-plane API call by token is logged (only some product events appear)
- revocation propagation delay for user tokens
- Whether REST API reads generate org audit-log entries (docs describe UI views, not API reads)
- Classic unscoped tokens use the site *.atlassian.net URL; scoped tokens require the api.atlassian.com gateway
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
- [Configure SAML single sign-on with an identity provider](https://support.atlassian.com/security-and-access-policies/docs/configure-saml-single-sign-on-with-an-identity-provider/) (retrieved 2026-10-09)
- [Status of API tokens/keys when a user who generated the token/key has left the organization](https://support.atlassian.com/jira/kb/atlassian-api-token-key-status-of-api-tokens-keys-when-a-user-who-generated-the-token-key-has-left-the-organization/) (retrieved 2026-10-14)
- [View API token activity](https://support.atlassian.com/organization-administration/docs/view-user-api-tokens/) (retrieved 2026-10-14)
- [View audit log activities](https://support.atlassian.com/security-and-access-policies/docs/view-audit-log-activities/) (retrieved 2026-10-12)
- [Audit log activities database](https://support.atlassian.com/security-and-access-policies/docs/audit-log-activities-database/) (retrieved 2026-10-12)
- [Organizations REST API: Events](https://developer.atlassian.com/cloud/admin/organization/rest/api-group-events/) (retrieved 2026-10-12)
- [Delete a managed account](https://support.atlassian.com/user-management/docs/delete-a-managed-account/) (retrieved 2026-10-14)
- [User management REST API - Lifecycle](https://developer.atlassian.com/cloud/admin/user-management/rest/api-group-lifecycle/) (retrieved 2026-10-14)
- [Revoke user API tokens](https://support.atlassian.com/security-and-access-policies/docs/revoke-user-api-tokens/) (retrieved 2026-10-12)
- [User management REST API - API tokens](https://developer.atlassian.com/cloud/admin/user-management/rest/api-group-api-tokens/) (retrieved 2026-10-14)
- [Bamboo Javadoc: BitbucketCloudApiTokenUtils](https://docs.atlassian.com/atlassian-bamboo/11.0.7/com/atlassian/bamboo/repository/configuration/BitbucketCloudApiTokenUtils.html) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [ALQL fields](https://support.atlassian.com/security-and-access-policies/docs/alql-fields/) (retrieved 2026-10-12)
- [ALQL operators](https://support.atlassian.com/security-and-access-policies/docs/alql-operators/) (retrieved 2026-10-12)
- [What is advanced search in audit log?](https://support.atlassian.com/security-and-access-policies/docs/what-is-advanced-search-in-audit-log/) (retrieved 2026-10-12)
- [API Access REST API: API Token](https://developer.atlassian.com/cloud/admin/api-access/rest/api-group-api-token/) (retrieved 2026-10-12)
- [Understand user API tokens](https://support.atlassian.com/security-and-access-policies/docs/understand-user-api-tokens/) (retrieved 2026-10-12)
- [Jira Cloud REST v3 OpenAPI](https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json) (retrieved 2026-10-12)
- [Confluence Cloud REST v2 OpenAPI](https://dac-static.atlassian.com/cloud/confluence/openapi-v2.v3.json) (retrieved 2026-10-12)
- [Jira rate limiting](https://developer.atlassian.com/cloud/jira/platform/rate-limiting/) (retrieved 2026-10-12)
- [Track organization activities from the audit log](https://support.atlassian.com/security-and-access-policies/docs/track-organization-activities-from-the-audit-log/) (retrieved 2026-10-12)
- [What activities does the audit log include?](https://support.atlassian.com/security-and-access-policies/docs/accessing-audit-log-activities/) (retrieved 2026-10-12)
- [View API token activity](https://support.atlassian.com/security-and-access-policies/docs/view-user-api-tokens/) (retrieved 2026-10-12)
- [Authentication policy settings for your organizations | Atlassian Support](https://support.atlassian.com/security-and-access-policies/docs/authentication-policy-settings-for-your-organizations/) (retrieved 2026-10-13)
- [Block user API token access | Atlassian Support](https://support.atlassian.com/security-and-access-policies/docs/set-api-token-access/) (retrieved 2026-10-13)
- [Specify IP addresses for app access - Atlassian Support](https://support.atlassian.com/security-and-access-policies/docs/specify-ip-addresses-for-product-access/) (retrieved 2026-10-09)
- [https://support.atlassian.com/security-and-access-policies/docs/app-access-rule-coverage-summary/](https://support.atlassian.com/security-and-access-policies/docs/app-access-rule-coverage-summary/) (retrieved 2026-10-13)
