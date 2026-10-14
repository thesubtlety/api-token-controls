# MongoDB Atlas: Workload Identity Federation (OIDC/OAuth 2.0)

`mongodb-6` · Federated identity · service. Applications present OAuth 2.0 access tokens from an external IdP (Azure, GCP, others) to the cluster. Atlas stores identifiers and privileges, not secrets.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /api/atlas/v2/groups/{groupId}/databaseUsers lists the OIDC-mapped database users per project. | GET /api/atlas/v2/groups/{groupId}/databaseUsers lists the OIDC-mapped database users per project. |
| Protect: Admin can block or require approval | Yes | Roles required to add database users; Disconnect identity provider (Workload Identity Federation) | Roles required to add database users: Atlas organization/project role assignment · Disconnect identity provider (Workload Identity Federation): Federation management > Workload Identity Federation card > Manage > Disconnect |
| Protect: SSO and MFA rules apply | Partial | Access tokens are issued by the external IdP, so that IdP's issuance policies apply; Atlas itself adds no SSO check. | Where: Organization > Identity & Access > Federation > Open Federation Management App > Identity Providers > Set Up Identity Provider > Workload Identity Provider (issuer URI, audience); IdP policy governs token issuance · API: GET /api/atlas/v2/federationSettings/{federationSettingsId}/identityProviders |
| Protect: IP restriction | Yes | Project IP access list gates connections. | Project IP access list: Database & Network Access > IP Access List |
| Protect: Expires automatically | Partial | Set by the external IdP that issues the access token | Temporary User: Database & Network Access > Add New Database User > Temporary User |
| Detect: Usage appears in logs | Yes | identity provider + principal name | Where: Database auditing on (authenticate action), then Clusters > ... > Download Logs > mongodb-audit-log; filter atype "authenticate" by user · API: GET /api/atlas/v2/groups/{groupId}/clusters/{hostName}/logs/mongodb-audit-log.gz · Command: atlas logs download <hostname> mongodb-audit-log.gz |
| Detect: Data reads appear in logs | Conditional | Database auditing is not available on Free or Flex clusters; successful reads need authChecksReadAll (auditAuthorizationSuccess = true). | Where: Project > Security > Database & Network Access > Advanced > Database Auditing On > select authCheck Reads with Successes and Failures; then Clusters > ... > Download Logs > mongodb-audit-log, search atype "authCheck" · API: PATCH /api/atlas/v2/groups/{groupId}/auditLog {"enabled":true,"auditAuthorizationSuccess":true}; GET /api/atlas/v2/groups/{groupId}/clusters/{hostName}/logs/mongodb-audit-log.gz · Command: atlas auditing update; atlas logs download <hostname> mongodb-audit-log.gz |
| Respond: Revocation ends active access | Partial | Disconnecting the IdP removes Workload Identity Federation access; Revoke JWKS immediately drops cached keys but clients must be restarted. Docs do not say open connections are closed. | Delete the mapped database user/group or disable the identity provider. |
| Respond: Stops working when user is removed | N/A | Access is mapped from an external workload identity, not from an Atlas user. |  |

## Protect: what an admin can configure

### Admin controls
- **Temporary User** (Limit lifetime; all plans; default off). Database user is deleted automatically after 6 hours, 1 day or 1 week. Where: Database & Network Access > Add New Database User > Temporary User.
- **Restrict access to specific clusters** (Limit resources; all plans; default off). Limits a database user to chosen clusters and federated database instances. Where: Database user > Restrict Access to Specific Clusters.
- **Project IP access list** (Limit network; all plans; default on). Only listed IPs can connect to clusters. Where: Database & Network Access > IP Access List.
- **Roles required to add database users** (Disable; all plans; default on). Only users with the listed Organization or Project roles can create database users of any authentication type. Where: Atlas organization/project role assignment.
- **Disconnect identity provider (Workload Identity Federation)** (Disable; all plans; default unknown). Disconnecting the workload IdP from the organization removes Workload Identity Federation access for its users. Where: Federation management > Workload Identity Federation card > Manage > Disconnect.

- Network: supported (checked at api_request). Project IP access list gates connections.
- Lifetime: Set by the external IdP that issues the access token. Renewal: Driver fetches a new token from the IdP.
- Keyless option: supported. Requires M10+ dedicated cluster, MongoDB 7.0.11+, supported drivers.
- Conditions: M10+ only.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Organization Activity Feed: IdP config changes.
- Database audit log: M10+.

### Fields that identify the credential
- `identity provider + principal name` (audit log): null

### Lifecycle events
- create: `OIDC_IDENTITY_PROVIDER_ENABLED` null
- modify: `OIDC_IDENTITY_PROVIDER_UPDATED` null
- revoke: `OIDC_IDENTITY_PROVIDER_DISABLED` null

### Correlate on
`IdP issuer`, `principal`

### API calls a holder can make, and whether they are logged
- collection: `MongoDB find command on a collection`. Documents in the database Logged: plan (`authCheck`). Database auditing is not available on Free or Flex clusters; successful reads need authChecksReadAll (auditAuthorizationSuccess = true).

### Public detection rules (community, not vendor documentation)
- [MongoDB Identity Provider Activity](https://github.com/panther-labs/panther-analysis/blob/develop/rules/mongodb_rules/mongodb_identity_provider_activity.yml) (Panther): Changes to Atlas federation settings and identity providers, including OIDC providers used for workload identity federation and JWKS revocation.

### What to look for (analyst guidance)
- New identity provider enabled
- Group mapping widened

## Respond: how to revoke it
- Admin: **Delete database user**. Removes the database user; also the only way to revoke an X.509 user. Where: Database & Network Access > Database Users > Delete.
- Admin: **Revoke JWKS**. Immediately drops JSON Web Key Sets cached on MongoDB nodes so tokens signed with a compromised key fail. Where: Federation management > Workload Identity Federation card > Manage > Revoke JWKS.

Delete the mapped database user/group or disable the identity provider. Live access ends on revocation: partial. Disconnecting the IdP removes Workload Identity Federation access; Revoke JWKS immediately drops cached keys but clients must be restarted. Docs do not say open connections are closed.

## No vendor documentation found
- Whether an org can block creation of legacy API keys entirely.
- Whether API keys have any expiry setting.
- Whether deleting a service account or secret invalidates already-issued 1-hour access tokens.
- Whether deleting a database user terminates open connections.
- Whether Admin API read (GET) calls are recorded anywhere; Activity Feed documents changes, not reads.
- Default secret expiration value for service accounts.

## Sources
- [Set up Workload Identity Federation with OAuth 2.0](https://www.mongodb.com/docs/atlas/workload-oidc/) (retrieved 2026-10-14)
- [Configure IP Access List Entries](https://www.mongodb.com/docs/atlas/security/ip-access-list/) (retrieved 2026-10-14)
- [Configure Database Users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/) (retrieved 2026-10-14)
- [Return All Database Users in One Project](https://www.mongodb.com/docs/api/doc/atlas-admin-api-v2/operation/operation-listdatabaseusers) (retrieved 2026-10-14)
- [MongoDB Atlas Administration API v2 OpenAPI spec (mongodb/openapi)](https://raw.githubusercontent.com/mongodb/openapi/main/openapi/v2.json) (retrieved 2026-10-14)
- [Set Up Database Auditing](https://www.mongodb.com/docs/atlas/database-auditing/) (retrieved 2026-10-14)
- [View and Download MongoDB Logs](https://www.mongodb.com/docs/atlas/mongodb-logs/) (retrieved 2026-10-14)
