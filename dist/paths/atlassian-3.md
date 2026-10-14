# Atlassian Jira / Confluence Cloud: Service account OAuth 2.0 (client credentials)

`atlassian-3` · OAuth · service. An organization service account gets a client ID and client secret. A script posts them to https://auth.atlassian.com/oauth/token with grant_type=client_credentials (2LO) and uses the returned bearer access token against api.atlassian.com.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Directory > Service accounts shows each service account's Credentials list; admins browse per service account. | Directory > Service accounts shows each service account's Credentials list; admins browse per service account. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Product IP allowlists block programmatic API access in general, but exempt several OAuth types (TwoLeggedOAuth application links, Forge 2LO/3LO, OAuth 2.0 3LO apps). The docs do not say whether service-account client-credentials tokens are covered or exempt. Allowlists need Premium/Enterprise plans. |  |
| Protect: Expires automatically | Yes | 60 minutes | Where: Fixed 60 minutes; token response returns "expires_in": 3600 |
| Detect: Usage appears in logs | Yes | attributes.actor.auth.authType, attributes.actor.id, clientId, tokenEndpointAuthMethod, clientRevocationTime, serviceAccount | Atlassian organization audit log (Admin > Insights > Audit log; Organizations REST API /v1/orgs/{orgId}/events and /events-stream): Requires Atlassian Guard Standard/Premium or an Enterprise plan; 180-day retention, default view 7 days. API token activities only for managed (claimed-domain) accounts. · Service accounts (Admin > Directory > Service accounts) / API Access REST API oauth-clients: Lists OAuth clients per service account with createdAt, createdBy, expiresAt, clientRevokerId, clientRevocationTime, scopes. |
| Detect: Data reads appear in logs | Conditional | Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries. | Where: Atlassian Administration > Insights > Audit log; filter activity "Viewed Jira issue" / "Viewed Confluence page" and actor = the service account · API: GET https://api.atlassian.com/admin/v1/orgs/{orgId}/events?action=<activity>&actor=<serviceAccountId> |
| Respond: Revocation ends active access | No docs found | Revocation removes the credential; docs don't say if already-issued access tokens (valid 60 min) are invalidated, so assume up to 60 minutes of residual access. |  |
| Respond: Stops working when user is removed | N/A | Service accounts are not tied to a person. |  |

## Protect: what an admin can configure

### Admin controls
- **Service account OAuth 2.0 credential scopes** (Limit scope; all plans; default unknown). Admin must select scopes (Jira, Confluence, Goals, Projects only) when creating the client credential. Where: Atlassian Administration > Directory > Service accounts > [account] > Create credentials > OAuth 2.0.
- **Service account app roles and groups** (Limit resources; all plans; default unknown). Admins choose which apps/roles and groups a service account has, which bounds what its credentials can reach. Where: Atlassian Administration > Directory > Service accounts > create/edit > roles, groups.
- **Create a service account (Organization admin only)** (Other; Atlassian Guard Standard or Enterprise (5 service accounts free); default on). Only organization admins can create service accounts and their credentials, so other users cannot mint these credentials. Where: Atlassian Administration > Directory > Service accounts.

- Network: unknown (checked at unknown). Product IP allowlists block programmatic API access in general, but exempt several OAuth types (TwoLeggedOAuth application links, Forge 2LO/3LO, OAuth 2.0 3LO apps). The docs do not say whether service-account client-credentials tokens are covered or exempt. Allowlists need Premium/Enterprise plans.
- Lifetime: 60 minutes. Renewal: No refresh token is described; the script requests a new access token with the client ID and secret. The page does not state whether the client secret itself expires.
- Keyless option: not_verified. The documented flow exchanges a stored client secret for an access token. The page does not describe exchanging an external IdP or workload identity token for this credential.
- Conditions: Requires the centralized user management experience. Works with Confluence Cloud, Jira Cloud and Jira Align REST APIs via api.atlassian.com. Five service accounts per organization are free; more need Atlassian Guard. Not available on Atlassian Government Cloud.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Atlassian organization audit log (Admin > Insights > Audit log; Organizations REST API /v1/orgs/{orgId}/events and /events-stream): Requires Atlassian Guard Standard/Premium or an Enterprise plan; 180-day retention, default view 7 days. API token activities only for managed (claimed-domain) accounts.
- Service accounts (Admin > Directory > Service accounts) / API Access REST API oauth-clients: Lists OAuth clients per service account with createdAt, createdBy, expiresAt, clientRevokerId, clientRevocationTime, scopes.

### Fields that identify the credential
- `attributes.actor.auth.authType` (Org audit log events API): enum includes api-token, auth-token-for-2LO, auth-token-for-3LO
- `attributes.actor.id` (Org audit log events API): Atlassian account ID of acting user/service account
- `clientId` (API Access REST API oauth-clients): OAuth client
- `tokenEndpointAuthMethod` (API Access REST API oauth-clients): post or private_key_jwt
- `clientRevocationTime` (API Access REST API oauth-clients): when client was revoked
- `serviceAccount` (API Access REST API oauth-clients): owning service account (TokenUser.id)

### Lifecycle events
- create: `Created service account` Service Account Actions
- change: `Updated service account` name, description or app permissions
- revoke: `Deleted service account` deletes account and its credentials

### Correlate on
`attributes.actor.id`, `attributes.actor.auth.authType`, `attributes.actor.auth.tokenId`, `attributes.location.ip`, `attributes.container[].id`, `clientId`

### API calls a holder can make, and whether they are logged
- recon: `POST https://auth.atlassian.com/oauth/token (grant_type=client_credentials)`. 60-minute bearer token for the service account Logged: unknown. No documented audit event for client-credentials token issuance.
- recon: `GET https://api.atlassian.com/oauth/token/accessible-resources`. Sites (cloudid) and the scopes the token holds on each Logged: unknown. Needed to build api.atlassian.com/ex/jira/{cloudId} URLs.
- enumeration (bulk): `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/users/search`. All users in the site Logged: unknown. 
- discovery (bulk): `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/project/search`. Projects visible to the principal Logged: unknown. 
- collection (bulk): `GET https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/search/jql`. Issues matching JQL, paged with nextPageToken Logged: plan. Org audit log records in-app views (e.g. viewing a Confluence page) only on Guard Premium or Cloud Enterprise; retention 180 days without Guard, 365 days with Guard from 2026-10-01. Docs do not state whether REST API reads produce these entries.

### What to look for (analyst guidance)
- auth-token-for-2LO activity from an IP outside the integration's hosting range
- service account acting outside its scheduled job window
- new OAuth client created on a long-lived service account with no change ticket
- tokenEndpointAuthMethod switched from private_key_jwt to client-secret
- writes/deletes by a service account whose job is read-only

### Sample query (Atlassian audit log ALQL)
Find service-account OAuth activity from unexpected IPs.

```
created >= "2026-09-12" AND actor = "svc-integration" AND "auth type" = oauth AND "ip address" !~ "203.0.113.*"
```

## Respond: how to revoke it
- Admin: **Revoke service account OAuth 2.0 credential**. Revoking permanently removes the client credential. Where: Atlassian Administration > Directory > Service accounts > [account] > credentials > Revoke.
- Admin: **Delete service account**. Deleting the account removes all its access and credentials. Where: Atlassian Administration > Directory > Service accounts > ••• > Delete account.

Admin > Directory > Service accounts > Credentials > Revoke (or Revoke credentials for all); API DELETE /orgs/{orgId}/oauth-clients/{clientId}; delete the service account. Live access ends on revocation: unknown. Revocation removes the credential; docs don't say if already-issued access tokens (valid 60 min) are invalidated, so assume up to 60 minutes of residual access.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Revocation ends active access
- audit event names for OAuth client create/revoke/secret rotation
- token format
- whether revocation invalidates outstanding access tokens
- ALQL auth type value specific to 2LO
- user agent field
- Whether 2LO token issuance or API reads are logged
- Full scope list available to the client-credentials grant (not in official docs retrieved)
- Whether IP allowlists apply to service account credentials calling api.atlassian.com.
- Whether OAuth 2.0 service account client secrets expire or can be given an expiry (no official statement found; access tokens last 60 minutes).
- Whether the authentication-policy API token block also applies to service accounts.
- No per-app allow/block list for 3LO user grants was found in official docs (only the global Block user apps toggle).

## Sources
- [Create OAuth 2.0 credential for service accounts](https://support.atlassian.com/user-management/docs/create-oauth-2-0-credential-for-service-accounts/) (retrieved 2026-10-12)
- [Specify IP addresses for app access - Atlassian Support](https://support.atlassian.com/security-and-access-policies/docs/specify-ip-addresses-for-product-access/) (retrieved 2026-10-09)
- [Understand service accounts](https://support.atlassian.com/user-management/docs/understand-service-accounts/) (retrieved 2026-10-12)
- [View audit log activities](https://support.atlassian.com/security-and-access-policies/docs/view-audit-log-activities/) (retrieved 2026-10-12)
- [Audit log activities database](https://support.atlassian.com/security-and-access-policies/docs/audit-log-activities-database/) (retrieved 2026-10-12)
- [Organizations REST API: Events](https://developer.atlassian.com/cloud/admin/organization/rest/api-group-events/) (retrieved 2026-10-12)
- [ALQL fields](https://support.atlassian.com/security-and-access-policies/docs/alql-fields/) (retrieved 2026-10-12)
- [What is advanced search in audit log?](https://support.atlassian.com/security-and-access-policies/docs/what-is-advanced-search-in-audit-log/) (retrieved 2026-10-12)
- [API Access REST API: API Token](https://developer.atlassian.com/cloud/admin/api-access/rest/api-group-api-token/) (retrieved 2026-10-12)
- [OAuth 2.0 (3LO) apps - Atlassian](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/) (retrieved 2026-10-09)
- [Jira Cloud REST v3 OpenAPI](https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json) (retrieved 2026-10-12)
- [Jira rate limiting](https://developer.atlassian.com/cloud/jira/platform/rate-limiting/) (retrieved 2026-10-12)
- [What activities does the audit log include?](https://support.atlassian.com/security-and-access-policies/docs/accessing-audit-log-activities/) (retrieved 2026-10-12)
