# MongoDB Atlas: Database user with X.509 certificate

`mongodb-4` · X.509 certificate · person or service. Client certificate (mutual TLS) authenticates to the $external database. Atlas-managed or self-managed CA.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /api/atlas/v2/groups/{groupId}/databaseUsers lists database users per project; individual certificates are not listed by this call. | GET /api/atlas/v2/groups/{groupId}/databaseUsers lists database users per project; individual certificates are not listed by this call. |
| Protect: Admin can block or require approval | Yes | Roles required to add database users | Where: Project > Security > Project Identity & Access > Users: limit Project Owner / Project Database Access Admin roles (only these, plus Org Owner and Stream Processing admin roles, can add database users) · API: PUT /api/atlas/v2/groups/{groupId}/users/{userId}/roles |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Project IP access list gates connections. | Project IP access list: Database & Network Access > IP Access List |
| Protect: Expires automatically | Yes | Certificate expiration date set at issue | Temporary User: Database & Network Access > Add New Database User > Temporary User |
| Detect: Usage appears in logs | Yes | certificate subject / username | Where: Database auditing on (authenticate action), then Clusters > ... > Download Logs > mongodb-audit-log; filter atype "authenticate" by user · API: GET /api/atlas/v2/groups/{groupId}/clusters/{hostName}/logs/mongodb-audit-log.gz · Command: atlas logs download <hostname> mongodb-audit-log.gz |
| Detect: Data reads appear in logs | Conditional | Database auditing is not available on Free or Flex clusters; successful reads are logged only with authChecksReadAll (auditAuthorizationSuccess = true), which Atlas warns can hurt performance. | Where: Project > Security > Database & Network Access > Advanced > Database Auditing On > select authCheck Reads with Successes and Failures; then Clusters > ... > Download Logs > mongodb-audit-log, search atype "authCheck" · API: PATCH /api/atlas/v2/groups/{groupId}/auditLog {"enabled":true,"auditAuthorizationSuccess":true}; GET /api/atlas/v2/groups/{groupId}/clusters/{hostName}/logs/mongodb-audit-log.gz · Command: atlas auditing update; atlas logs download <hostname> mongodb-audit-log.gz |
| Respond: Revocation ends active access | No docs found | Individual certificates cannot be revoked. |  |
| Respond: Stops working when user is removed | N/A | Database users are separate from Atlas users. |  |

## Protect: what an admin can configure

### Admin controls
- **Temporary User** (Limit lifetime; all plans; default off). Database user is deleted automatically after 6 hours, 1 day or 1 week. Where: Database & Network Access > Add New Database User > Temporary User.
- **Restrict access to specific clusters** (Limit resources; all plans; default off). Limits a database user to chosen clusters and federated database instances. Where: Database user > Restrict Access to Specific Clusters.
- **Project IP access list** (Limit network; all plans; default on). Only listed IPs can connect to clusters. Where: Database & Network Access > IP Access List.
- **Roles required to add database users** (Disable; all plans; default on). Only users with the listed Organization or Project roles can create database users of any authentication type. Where: Atlas organization/project role assignment.

### Not available (vendor states)
- Atlas-managed X.509 certificates cannot be revoked individually; only deleting the user removes access.

- Network: supported (checked at api_request). Project IP access list gates connections.
- Lifetime: Certificate expiration date set at issue. Renewal: Download a new certificate for the user.
- Keyless option: not_applicable. Database-level certificate credential.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- Project Activity Feed: null
- Database audit log: Not on Free/Flex.

### Fields that identify the credential
- `certificate subject / username` (audit log): null

### Lifecycle events
- create: `MONGODB_USER_X509_CERT_CREATED` null
- revoke: `MONGODB_USER_X509_CERT_REVOKED` Event exists though UI says certificates cannot be revoked
- revoke: `MONGODB_USER_DELETED` null

### Correlate on
`username`

### API calls a holder can make, and whether they are logged
- collection: `MongoDB find command on a collection`. Documents in the database Logged: plan (`authCheck`). Database auditing is not available on Free or Flex clusters; successful reads are logged only with authChecksReadAll (auditAuthorizationSuccess = true), which Atlas warns can hurt performance.

### What to look for (analyst guidance)
- New certificate downloaded for an existing user

## Respond: how to revoke it
- Admin: **Delete database user**. Removes the database user; also the only way to revoke an X.509 user. Where: Database & Network Access > Database Users > Delete.

Delete the database user. Live access ends on revocation: unknown. Individual certificates cannot be revoked.

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- Whether an org can block creation of legacy API keys entirely.
- Whether API keys have any expiry setting.
- Whether deleting a service account or secret invalidates already-issued 1-hour access tokens.
- Whether deleting a database user terminates open connections.
- Whether Admin API read (GET) calls are recorded anywhere; Activity Feed documents changes, not reads.
- Default secret expiration value for service accounts.

## Sources
- [Configure Database Users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/) (retrieved 2026-10-14)
- [Configure IP Access List Entries](https://www.mongodb.com/docs/atlas/security/ip-access-list/) (retrieved 2026-10-14)
- [Return All Database Users in One Project](https://www.mongodb.com/docs/api/doc/atlas-admin-api-v2/operation/operation-listdatabaseusers) (retrieved 2026-10-14)
- [Manage Access to a Project - Atlas](https://www.mongodb.com/docs/atlas/access/manage-project-access/) (retrieved 2026-10-14)
- [MongoDB Atlas Administration API v2 OpenAPI spec (mongodb/openapi)](https://raw.githubusercontent.com/mongodb/openapi/main/openapi/v2.json) (retrieved 2026-10-14)
- [Set Up Database Auditing](https://www.mongodb.com/docs/atlas/database-auditing/) (retrieved 2026-10-14)
- [View and Download MongoDB Logs](https://www.mongodb.com/docs/atlas/mongodb-logs/) (retrieved 2026-10-14)
- [Atlas Alert Event Types](https://www.mongodb.com/docs/atlas/reference/atlas-alert-event-types/) (retrieved 2026-10-14)
