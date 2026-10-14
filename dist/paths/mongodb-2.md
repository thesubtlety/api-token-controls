# MongoDB Atlas: Programmatic API key (legacy, HTTP Digest)

`mongodb-2` · API key / token · service. Public key plus private key used with HTTP Digest auth on each Admin API request. Legacy; MongoDB recommends service accounts.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Organization Owners can view all API keys or call GET /api/atlas/v2/orgs/{orgId}/apiKeys. | Organization Owners can view all API keys or call GET /api/atlas/v2/orgs/{orgId}/apiKeys. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Per-key API access list; org setting can require a list for every request. Not applied to Atlas CLI user logins or App Connections. | Require IP Access List for the Atlas Administration API: Organization Settings > Require IP Access List for the Atlas Administration API; API field apiAccessListRequired · API Access List (per service account / API key): Applications > Service Accounts/API Keys > Edit > Add Access List Entry; /orgs/{orgId}/serviceAccounts/{clientId}/accessList, /orgs/{orgId}/apiKeys/{apiUserId}/accessList |
| Protect: Expires automatically | Not available | No expiry documented |  |
| Detect: Usage appears in logs | Yes | apiKeyId, remoteAddress | Where: Organization > Configurations > Activity Feed (or Project > Security > Activity Feed) > Filter > Initiated By · API: GET /api/atlas/v2/orgs/{orgId}/events (filter results on apiKeyId); GET /api/atlas/v2/groups/{groupId}/events · Command: atlas events organizations list |
| Detect: Data reads appear in logs | Yes | MONGODB_USER_ADDED | Where: Project > Security > Activity Feed > Filter > Event = database user added (MONGODB_USER_ADDED); add Initiated By filter for the key/service account · API: GET /api/atlas/v2/groups/{groupId}/events?eventType=MONGODB_USER_ADDED · Command: atlas events projects list --type MONGODB_USER_ADDED |
| Respond: Revocation ends active access | Yes | Digest auth checks the key on each request, so deletion should stop further calls; not explicitly stated. | Delete the API key (UI, atlas organizations apiKeys delete, or Admin API). |
| Respond: Stops working when user is removed | N/A | API keys belong to an organization, not to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Require IP Access List for the Atlas Administration API** (Limit network; all plans; default on). Rejects Admin API requests from service accounts or API keys without a matching access list entry. Where: Organization Settings > Require IP Access List for the Atlas Administration API; API field apiAccessListRequired.
- **API Access List (per service account / API key)** (Limit network; all plans; default varies). Limits each credential to listed IPs or CIDRs. Where: Applications > Service Accounts/API Keys > Edit > Add Access List Entry; /orgs/{orgId}/serviceAccounts/{clientId}/accessList, /orgs/{orgId}/apiKeys/{apiUserId}/accessList.
- **Atlas roles** (Limit scope; all plans; default varies). Org and project roles limit which Admin API operations the credential can perform. Where: Applications > Service Accounts/API Keys > roles.
- **Organization Owner role required to create service accounts and API keys** (Other; all plans; default on). Only Organization Owners can create org-level service accounts and API keys; project-level ones are created by project roles and are added to the org as Organization Member. Where: Atlas organization/project role assignment.

- Network: supported (checked at api_request). Per-key API access list; org setting can require a list for every request. Not applied to Atlas CLI user logins or App Connections.
- Lifetime: No expiry documented. Renewal: Same key pair reused on every request until deleted.
- Keyless option: not_verified. Cannot log into the UI; UI session timeouts do not apply. No doc statement on IdP conditional access.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- Organization / Project Activity Feed: All tiers; API and SIEM export.

### Fields that identify the credential
- `apiKeyId` (Activity Feed event): Present when an API key triggered the event (userId omitted).
- `remoteAddress` (Activity Feed event): null

### Lifecycle events
- create: `API_KEY_CREATED` null
- modify: `API_KEY_ROLES_CHANGED` null
- modify: `API_KEY_ADDED_TO_GROUP` null
- modify: `API_KEY_ACCESS_LIST_ENTRY_ADDED` null
- modify: `API_KEY_ACCESS_LIST_ENTRY_DELETED` null
- revoke: `API_KEY_DELETED` null

### Correlate on
`apiKeyId`, `remoteAddress`, `orgId`, `groupId`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/atlas/v2`. System status and API key metadata Logged: unknown. 
- discovery (bulk): `GET /api/atlas/v2/groups`. Projects Logged: unknown. 
- collection: `POST /api/atlas/v2/groups/{groupId}/databaseUsers`. Creates a database user for data access Logged: yes (`MONGODB_USER_ADDED`). Event carries apiKeyId

### Public detection rules (community, not vendor documentation)
- [MongoDB Atlas API Key Created](https://github.com/panther-labs/panther-analysis/blob/develop/rules/mongodb_rules/mongodb_atlas_api_key_created.yml) (Panther): An IP access list entry was added to an Atlas programmatic API key.

### What to look for (analyst guidance)
- Old keys with no expiry still active
- Key added to new projects
- Access list widened

## Respond: how to revoke it
- Admin: **Delete API key**. Deletes the key and removes it from all projects. Where: Applications > API Keys > Delete; atlas organizations apiKeys delete.

Delete the API key (UI, atlas organizations apiKeys delete, or Admin API). Live access ends on revocation: yes. Digest auth checks the key on each request, so deletion should stop further calls; not explicitly stated.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Whether read calls are logged
- Whether an org can block creation of legacy API keys entirely.
- Whether API keys have any expiry setting.
- Whether deleting a service account or secret invalidates already-issued 1-hour access tokens.
- Whether deleting a database user terminates open connections.
- Whether Admin API read (GET) calls are recorded anywhere; Activity Feed documents changes, not reads.
- Default secret expiration value for service accounts.

## Sources
- [Atlas Administration API Authentication Methods](https://www.mongodb.com/docs/atlas/api/api-authentication/) (retrieved 2026-10-14)
- [Manage Organization Settings](https://www.mongodb.com/docs/atlas/tutorial/manage-organization-settings/) (retrieved 2026-10-14)
- [Get Started with the Atlas Administration API](https://www.mongodb.com/docs/atlas/configure-api-access/) (retrieved 2026-10-14)
- [Manage Programmatic Access to an Organization](https://www.mongodb.com/docs/atlas/configure-api-access-org/) (retrieved 2026-10-14)
- [Return All Organization API Keys](https://www.mongodb.com/docs/api/doc/atlas-admin-api-v2/operation/operation-listapikeys) (retrieved 2026-10-14)
- [View Activity Feed](https://www.mongodb.com/docs/atlas/tutorial/activity-feed/) (retrieved 2026-10-14)
- [MongoDB Atlas Administration API v2 OpenAPI spec (mongodb/openapi)](https://raw.githubusercontent.com/mongodb/openapi/main/openapi/v2.json) (retrieved 2026-10-14)
- [atlas events projects list - Atlas CLI](https://www.mongodb.com/docs/atlas/cli/current/command/atlas-events-projects-list/) (retrieved 2026-10-14)
- [Atlas Alert Event Types](https://www.mongodb.com/docs/atlas/reference/atlas-alert-event-types/) (retrieved 2026-10-14)
- [Atlas Administration API v2 OpenAPI spec (OrganizationSettings)](https://www.mongodb.com/docs/api/doc/atlas-admin-api-v2.yaml) (retrieved 2026-10-14)
- [Configure Database Users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/) (retrieved 2026-10-14)
