# Atlassian Jira / Confluence Cloud: Service account API token (scoped)

`atlassian-4` · API key / token · service. A scoped API token issued to an organization service account. It is sent as a Bearer token (or Basic) to api.atlassian.com gateway URLs such as https://api.atlassian.com/ex/jira/{cloudId}/...; site URLs are not supported.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Directory > Service accounts > View API tokens shows active tokens, creation, expiry and last use, per service account. | Directory > Service accounts > View API tokens shows active tokens, creation, expiry and last use, per service account. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Product IP allowlists say they block programmatic API access, and API tokens are not in the exemption list. The docs do not name service-account tokens or the api.atlassian.com gateway explicitly, so test coverage. Allowlists need Premium (Jira, JSM, Confluence, Compass) or Enterprise (Analytics, Focus). | Where: admin.atlassian.com > Security > Device security > IP allowlists > IP allowlist > select apps and IP ranges (test service-account token coverage) |
| Protect: Expires automatically | Yes | Default 365 days; choose 1–365 days | Service account API token expiration: Atlassian Administration > Directory > Service accounts > [account] > Create credentials > API token |
| Detect: Usage appears in logs | Yes | attributes.actor.auth.authType, attributes.actor.auth.tokenId, attributes.actor.auth.tokenLabel, attributes.actor.id, lastActiveAt, scopes | Atlassian organization audit log (Admin > Insights > Audit log; Organizations REST API /v1/orgs/{orgId}/events and /events-stream): Requires Atlassian Guard Standard/Premium or an Enterprise plan; 180-day retention, default view 7 days. API token activities only for managed (claimed-domain) accounts. · Service accounts > View API tokens / API Access REST API GET /v1/orgs/{orgId}/service-accounts/{serviceAccountId}/api-tokens: Per-service-account token inventory and recent usage. |
| Detect: Data reads appear in logs | Conditional | Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries.; Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries. | Where: Atlassian Administration > Insights > Audit log; filter activity "Viewed Jira issue" / "Viewed Confluence page" and actor = the service account · API: GET https://api.atlassian.com/admin/v1/orgs/{orgId}/events?action=<activity>&actor=<serviceAccountId> |
| Respond: Revocation ends active access | Yes | Revocation can take up to 10 minutes to take effect. Permanent; reissue a new token. | Admin > Directory > Service accounts > select account > Credentials > Revoke; or DELETE /v1/orgs/{orgId}/service-accounts/{serviceAccountId}/api-tokens to revoke all; delete the service account. |
| Respond: Stops working when user is removed | N/A | Service accounts are not tied to a person. |  |

## Protect: what an admin can configure

### Admin controls
- **Service account API token expiration** (Limit lifetime; all plans; default on). Admin picks a 1-365 day expiry when creating a service account API token (default one year). Where: Atlassian Administration > Directory > Service accounts > [account] > Create credentials > API token.
- **Service account API token scopes** (Limit scope; all plans; default unknown). Token scopes are chosen at creation and cannot be changed later. Where: Atlassian Administration > Directory > Service accounts > [account] > Create credentials > API token > scopes.
- **Service account app roles and groups** (Limit resources; all plans; default unknown). Admins choose which apps/roles and groups a service account has, which bounds what its credentials can reach. Where: Atlassian Administration > Directory > Service accounts > create/edit > roles, groups.
- **Create a service account (Organization admin only)** (Other; Atlassian Guard Standard or Enterprise (5 service accounts free); default on). Only organization admins can create service accounts and their credentials, so other users cannot mint these credentials. Where: Atlassian Administration > Directory > Service accounts.

- Network: conditional (checked at api_request). Product IP allowlists say they block programmatic API access, and API tokens are not in the exemption list. The docs do not name service-account tokens or the api.atlassian.com gateway explicitly, so test coverage. Allowlists need Premium (Jira, JSM, Confluence, Compass) or Enterprise (Analytics, Focus).
- Lifetime: Default 365 days; choose 1–365 days. Renewal: The static token is reused on each request until it expires (1 to 365 days); an admin then creates a new token. No refresh token is involved.
- Keyless option: not_applicable. This is a static token created in Atlassian Administration. Service accounts cannot be provisioned from an IdP and cannot sign in interactively.
- Conditions: Five service accounts per organization are free; more need Atlassian Guard. Not available on Atlassian Government Cloud.

## Detect: what gets logged
- Token prefix: `ATAT`

### Logs
- Atlassian organization audit log (Admin > Insights > Audit log; Organizations REST API /v1/orgs/{orgId}/events and /events-stream): Requires Atlassian Guard Standard/Premium or an Enterprise plan; 180-day retention, default view 7 days. API token activities only for managed (claimed-domain) accounts.
- Service accounts > View API tokens / API Access REST API GET /v1/orgs/{orgId}/service-accounts/{serviceAccountId}/api-tokens: Per-service-account token inventory and recent usage.

### Fields that identify the credential
- `attributes.actor.auth.authType` (Org audit log events API): enum includes api-token, auth-token-for-2LO, auth-token-for-3LO
- `attributes.actor.auth.tokenId` (Org audit log events API): ID of the authentication token
- `attributes.actor.auth.tokenLabel` (Org audit log events API): label/name of the token
- `attributes.actor.id` (Org audit log events API): Atlassian account ID of acting user/service account
- `lastActiveAt` (API Access REST API api-tokens): last use
- `scopes` (API Access REST API api-tokens): granted scopes (immutable after creation)

### Lifecycle events
- create: `Created API token` Service Account Actions category
- revoke: `Revoked API token` Service Account Actions category
- create: `Created service account` 
- change: `Updated service account` 
- revoke: `Deleted service account` removes all credentials

### Correlate on
`attributes.actor.id`, `attributes.actor.email`, `attributes.actor.auth.authType`, `attributes.actor.auth.tokenId`, `attributes.location.ip`, `attributes.location.countryName`, `attributes.container[].id`, `ALQL: actor, "auth type", "ip address", site, app`

### API calls a holder can make, and whether they are logged
- recon: `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/myself`. accountId, email, groups and application roles of the token principal Logged: unknown. API token last-used is visible in Insights > API token activity (managed accounts).
- enumeration (bulk): `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/users/search`. All users in the site Logged: unknown. 
- discovery (bulk): `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/project/search`. Projects visible to the principal Logged: unknown. 
- collection (bulk): `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/search/jql`. Issues matching JQL, paged with nextPageToken Logged: plan. Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries.
- collection (bulk): `GET https://api.atlassian.com/ex/confluence/{cloudId}/wiki/api/v2/pages`. Confluence pages (bodies via body-format) Logged: plan. Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries.

### What to look for (analyst guidance)
- ALQL "auth type" = api-token-service-account from a new IP/country
- token creation on a service account by an admin who does not own the integration
- token label/scopes mismatch the integration (e.g. write/delete scopes on a reporting bot)
- use against site URLs (unsupported) suggests a different, possibly attacker, client
- activity continuing more than 10 minutes after Revoked API token

### Sample query (Atlassian audit log ALQL)
Find service-account API token use from outside the known egress range.

```
created >= "2026-09-12" AND "auth type" = "api-token-service-account" AND "ip address" !~ "203.0.113.*" ORDER BY created desc
```

## Respond: how to revoke it
- Admin: **Revoke service account API token**. Revoked tokens stop working and are removed, within about 10 minutes. Where: Atlassian Administration > Directory > Service accounts > [account] > credentials > Revoke.
- Admin: **Delete service account**. Deleting the account removes all its access and credentials. Where: Atlassian Administration > Directory > Service accounts > ••• > Delete account.

Admin > Directory > Service accounts > select account > Credentials > Revoke; or DELETE /v1/orgs/{orgId}/service-accounts/{serviceAccountId}/api-tokens to revoke all; delete the service account. Live access ends on revocation: yes. Revocation can take up to 10 minutes to take effect. Permanent; reissue a new token.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- confirmed prefix for service-account tokens
- events API authType value specific to service-account tokens
- activity keys for service-account token create/revoke
- user agent field
- Whether scoped-token API reads appear in the org audit log
- Scoped tokens require the api.atlassian.com gateway; site URLs return 401
- Whether IP allowlists apply to service account credentials calling api.atlassian.com.
- Whether OAuth 2.0 service account client secrets expire or can be given an expiry (no official statement found; access tokens last 60 minutes).
- Whether the authentication-policy API token block also applies to service accounts.
- No per-app allow/block list for 3LO user grants was found in official docs (only the global Block user apps toggle).

## Sources
- [Manage API tokens for service accounts](https://support.atlassian.com/user-management/docs/manage-api-tokens-for-service-accounts/) (retrieved 2026-10-12)
- [Understand service accounts](https://support.atlassian.com/user-management/docs/understand-service-accounts/) (retrieved 2026-10-12)
- [Specify IP addresses for app access - Atlassian Support](https://support.atlassian.com/security-and-access-policies/docs/specify-ip-addresses-for-product-access/) (retrieved 2026-10-09)
- [View audit log activities](https://support.atlassian.com/security-and-access-policies/docs/view-audit-log-activities/) (retrieved 2026-10-12)
- [Audit log activities database](https://support.atlassian.com/security-and-access-policies/docs/audit-log-activities-database/) (retrieved 2026-10-12)
- [Organizations REST API: Events](https://developer.atlassian.com/cloud/admin/organization/rest/api-group-events/) (retrieved 2026-10-12)
- [Bamboo Javadoc: BitbucketCloudApiTokenUtils](https://docs.atlassian.com/atlassian-bamboo/11.0.7/com/atlassian/bamboo/repository/configuration/BitbucketCloudApiTokenUtils.html) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [ALQL fields](https://support.atlassian.com/security-and-access-policies/docs/alql-fields/) (retrieved 2026-10-12)
- [What is advanced search in audit log?](https://support.atlassian.com/security-and-access-policies/docs/what-is-advanced-search-in-audit-log/) (retrieved 2026-10-12)
- [API Access REST API: API Token](https://developer.atlassian.com/cloud/admin/api-access/rest/api-group-api-token/) (retrieved 2026-10-12)
- [Jira Cloud REST v3 OpenAPI](https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json) (retrieved 2026-10-12)
- [Confluence Cloud REST v2 OpenAPI](https://dac-static.atlassian.com/cloud/confluence/openapi-v2.v3.json) (retrieved 2026-10-12)
- [OAuth 2.0 (3LO) apps - Atlassian](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/) (retrieved 2026-10-09)
- [Create OAuth 2.0 credential for service accounts](https://support.atlassian.com/user-management/docs/create-oauth-2-0-credential-for-service-accounts/) (retrieved 2026-10-12)
- [Jira rate limiting](https://developer.atlassian.com/cloud/jira/platform/rate-limiting/) (retrieved 2026-10-12)
- [View API token activity](https://support.atlassian.com/security-and-access-policies/docs/view-user-api-tokens/) (retrieved 2026-10-12)
- [What activities does the audit log include?](https://support.atlassian.com/security-and-access-policies/docs/accessing-audit-log-activities/) (retrieved 2026-10-12)
