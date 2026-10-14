# MongoDB Atlas: Service account (Atlas Administration API, OAuth 2.0 client credentials)

`mongodb-1` · OAuth · service. Client ID and secret (prefix mdb_sa_sk_) are exchanged at POST https://cloud.mongodb.com/api/oauth/token for a 1-hour bearer token. Grants Admin API access only, not UI or cluster data.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Organization Owners can view all service accounts (Identity & Access > Applications) or call GET /api/atlas/v2/orgs/{orgId}/serviceAccounts. | Organization Owners can view all service accounts (Identity & Access > Applications) or call GET /api/atlas/v2/orgs/{orgId}/serviceAccounts. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Per-service-account API access list; org can require a list for every Admin API request (403 otherwise). Applies to using tokens, not issuing or revoking them; does not cover Atlas CLI or App Connections delegated access. | Require IP Access List for the Atlas Administration API: Organization Settings > Require IP Access List for the Atlas Administration API; API field apiAccessListRequired · API Access List (per service account / API key): Applications > Service Accounts/API Keys > Edit > Add Access List Entry; /orgs/{orgId}/serviceAccounts/{clientId}/accessList, /orgs/{orgId}/apiKeys/{apiUserId}/accessList |
| Protect: Expires automatically | Yes | Token 1 h; secret 8 h to 365 days, org-capped | maxServiceAccountSecretValidityInHours: PATCH /api/atlas/v2/orgs/{orgId}/settings · Client Secret Expiration: Create Service Account > Client Secret Expiration |
| Detect: Usage appears in logs | Yes | apiKeyId, remoteAddress | Organization / Project Activity Feed: All tiers; UI, atlas events CLI, GET /api/atlas/v2/orgs/{orgId}/events and /groups/{groupId}/events; org feed kept for life of the org; exportable to SIEM/OTel. |
| Detect: Data reads appear in logs | Yes | MONGODB_USER_ADDED | Where: Project > Security > Activity Feed > Filter > Event = database user added (MONGODB_USER_ADDED); add Initiated By filter for the key/service account · API: GET /api/atlas/v2/groups/{groupId}/events?eventType=MONGODB_USER_ADDED · Command: atlas events projects list --type MONGODB_USER_ADDED |
| Respond: Revocation ends active access | No docs found | Docs do not say whether deleting the secret invalidates issued tokens; revoke tokens explicitly. Tokens last at most 1 hour. |  |
| Respond: Stops working when user is removed | N/A | Service accounts are their own principals that belong to an organization, not to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Require IP Access List for the Atlas Administration API** (Limit network; all plans; default on). Rejects Admin API requests from service accounts or API keys without a matching access list entry. Where: Organization Settings > Require IP Access List for the Atlas Administration API; API field apiAccessListRequired.
- **API Access List (per service account / API key)** (Limit network; all plans; default varies). Limits each credential to listed IPs or CIDRs. Where: Applications > Service Accounts/API Keys > Edit > Add Access List Entry; /orgs/{orgId}/serviceAccounts/{clientId}/accessList, /orgs/{orgId}/apiKeys/{apiUserId}/accessList.
- **maxServiceAccountSecretValidityInHours** (Limit lifetime; all plans; default unknown). Caps how long new service account secrets can be valid (8 to 8760 hours). Where: PATCH /api/atlas/v2/orgs/{orgId}/settings.
- **Client Secret Expiration** (Limit lifetime; all plans; default unknown). Each secret expires after a chosen duration of 8 hours to 365 days. Where: Create Service Account > Client Secret Expiration.
- **Atlas roles** (Limit scope; all plans; default varies). Org and project roles limit which Admin API operations the credential can perform. Where: Applications > Service Accounts/API Keys > roles.
- **Organization Owner role required to create service accounts and API keys** (Other; all plans; default on). Only Organization Owners can create org-level service accounts and API keys; project-level ones are created by project roles and are added to the org as Organization Member. Where: Atlas organization/project role assignment.

- Network: supported (checked at api_request). Per-service-account API access list; org can require a list for every Admin API request (403 otherwise). Applies to using tokens, not issuing or revoking them; does not cover Atlas CLI or App Connections delegated access.
- Lifetime: Token 1 h; secret 8 h to 365 days, org-capped. Renewal: Request a new token with the client secret; rotate by adding a new secret (old one is cut to 7 days).
- Keyless option: not_verified. Separate credential, not tied to Atlas federated login. Docs say UI session timeout settings do not apply to service accounts; no statement on IdP conditional access.
- Conditions: Org Owner needed to manage a project service account that also has org or other-project access.

## Detect: what gets logged
- Token prefix: `mdb_sa_sk_`

### Logs
- Organization / Project Activity Feed: All tiers; UI, atlas events CLI, GET /api/atlas/v2/orgs/{orgId}/events and /groups/{groupId}/events; org feed kept for life of the org; exportable to SIEM/OTel.

### Fields that identify the credential
- `apiKeyId` (Activity Feed event): Identifies the API key that triggered the event; whether service accounts populate it is not documented.
- `remoteAddress` (Activity Feed event): Source IP of the action.

### Lifecycle events
- create: `SERVICE_ACCOUNT_CREATED` null
- create: `SERVICE_ACCOUNT_SECRET_ADDED` null
- modify: `SERVICE_ACCOUNT_ROLES_CHANGED` null
- modify: `SERVICE_ACCOUNT_ACCESS_LIST_ENTRY_ADDED` null
- modify: `SERVICE_ACCOUNT_ADDED_TO_GROUP` null
- revoke: `SERVICE_ACCOUNT_SECRET_DELETED` null
- revoke: `SERVICE_ACCOUNT_DELETED` null
- expire: `ORG_SERVICE_ACCOUNT_SECRETS_EXPIRING` Alertable

### Correlate on
`clientId`, `apiKeyId`, `remoteAddress`, `orgId`, `groupId`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/atlas/v2`. System status and credential metadata Logged: unknown. No documented read logging
- discovery (bulk): `GET /api/atlas/v2/groups`. Projects the credential can see Logged: unknown. 
- enumeration (bulk): `GET /api/atlas/v2/groups/{groupId}/clusters`. Clusters and connection strings Logged: unknown. 
- enumeration (bulk): `GET /api/atlas/v2/groups/{groupId}/databaseUsers`. Database users and roles Logged: unknown. 
- collection: `POST /api/atlas/v2/groups/{groupId}/databaseUsers`. Creates a database user to read cluster data (Admin API cannot read data directly) Logged: yes (`MONGODB_USER_ADDED`). Project Activity Feed

### What to look for (analyst guidance)
- New secret added to an existing service account
- Access list entry added for unfamiliar IP or 0.0.0.0/0
- ORG_PUBLIC_API_ACCESS_LIST_NOT_REQUIRED event
- Service account added to new projects or roles raised
- Database user created by a service account

## Respond: how to revoke it
- Admin: **Delete service account / delete secret**. Removes the account (from all projects) or one secret. Where: Applications > Service Accounts > Delete; DELETE /orgs/{orgId}/serviceAccounts/{clientId}, DELETE /orgs/{orgId}/serviceAccounts/{clientId}/secrets/{secretId}.
- Admin: **Revoke Service Account Token**. Revokes a specific access token. Where: POST https://cloud.mongodb.com/api/oauth/revoke.

Revoke tokens via POST /api/oauth/revoke, delete the secret or the service account, remove access list entries. Live access ends on revocation: unknown. Docs do not say whether deleting the secret invalidates issued tokens; revoke tokens explicitly. Tokens last at most 1 hour.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Revocation ends active access
- Whether token issuance or individual API calls are logged
- Whether GET calls appear in any log
- Whether an org can block creation of legacy API keys entirely.
- Whether API keys have any expiry setting.
- Whether deleting a service account or secret invalidates already-issued 1-hour access tokens.
- Whether deleting a database user terminates open connections.
- Whether Admin API read (GET) calls are recorded anywhere; Activity Feed documents changes, not reads.
- Default secret expiration value for service accounts.

## Sources
- [Atlas Administration API Authentication Methods](https://www.mongodb.com/docs/atlas/api/api-authentication/) (retrieved 2026-10-14)
- [Get Started with the Atlas Administration API](https://www.mongodb.com/docs/atlas/configure-api-access/) (retrieved 2026-10-14)
- [Manage Organization Settings](https://www.mongodb.com/docs/atlas/tutorial/manage-organization-settings/) (retrieved 2026-10-14)
- [Rotate Service Account Secrets](https://www.mongodb.com/docs/atlas/tutorial/rotate-service-account-secrets/) (retrieved 2026-10-14)
- [Atlas Administration API v2 OpenAPI spec (OrganizationSettings)](https://www.mongodb.com/docs/api/doc/atlas-admin-api-v2.yaml) (retrieved 2026-10-14)
- [Manage Programmatic Access to an Organization](https://www.mongodb.com/docs/atlas/configure-api-access-org/) (retrieved 2026-10-14)
- [Return All Organization Service Accounts](https://www.mongodb.com/docs/api/doc/atlas-admin-api-v2/operation/operation-listserviceaccounts) (retrieved 2026-10-14)
- [View Activity Feed](https://www.mongodb.com/docs/atlas/tutorial/activity-feed/) (retrieved 2026-10-14)
- [MongoDB Atlas Administration API v2 OpenAPI spec (mongodb/openapi)](https://raw.githubusercontent.com/mongodb/openapi/main/openapi/v2.json) (retrieved 2026-10-14)
- [atlas events projects list - Atlas CLI](https://www.mongodb.com/docs/atlas/cli/current/command/atlas-events-projects-list/) (retrieved 2026-10-14)
- [Revoke Service Account Token](https://www.mongodb.com/docs/atlas/api/service-accounts/revoke-oauth2-token/) (retrieved 2026-10-14)
- [Atlas Alert Event Types](https://www.mongodb.com/docs/atlas/reference/atlas-alert-event-types/) (retrieved 2026-10-14)
- [Export Activity Feed Events to External Tools](https://www.mongodb.com/docs/atlas/export-events/) (retrieved 2026-10-14)
- [Configure Database Users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/) (retrieved 2026-10-14)
- [Atlas Administration API Rate Limits](https://www.mongodb.com/docs/atlas/api/api-rate-limit/) (retrieved 2026-10-14)
