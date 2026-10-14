# MongoDB Atlas: Database user with password (SCRAM)

`mongodb-3` · Basic credentials · person or service. Username and password authenticate a driver or shell directly to the cluster. These are separate from Atlas (UI) users and read/write data.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /api/atlas/v2/groups/{groupId}/databaseUsers lists all database users in a project (per project, not org-wide). | GET /api/atlas/v2/groups/{groupId}/databaseUsers lists all database users in a project (per project, not org-wide). |
| Protect: Admin can block or require approval | Yes | Roles required to add database users | Where: Project > Security > Project Identity & Access > Users: limit Project Owner / Project Database Access Admin roles (only these, plus Org Owner and Stream Processing admin roles, can add database users) · API: PUT /api/atlas/v2/groups/{groupId}/users/{userId}/roles |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Project IP access list (or private endpoints/peering) gates every client connection to the cluster; not per user. | Project IP access list: Database & Network Access > IP Access List |
| Protect: Expires automatically | Partial | Permanent unless created as temporary user (6 h, 1 day, 1 week) | Temporary User: Database & Network Access > Add New Database User > Temporary User |
| Detect: Usage appears in logs | Yes | username | Where: Project > Database > Clusters > cluster ... menu > View Database Access History (7 days, by username) · API: GET /api/atlas/v2/groups/{groupId}/dbAccessHistory/clusters/{clusterName} · Command: atlas accessLogs list |
| Detect: Data reads appear in logs | Conditional | Only if database auditing enabled with read successes (authChecksReadAll); not on Free/Flex | Where: Project > Security > Database & Network Access > Advanced > Database Auditing On > select authCheck Reads with Successes and Failures; then Clusters > ... > Download Logs > mongodb-audit-log, search atype "authCheck" · API: PATCH /api/atlas/v2/groups/{groupId}/auditLog {"enabled":true,"auditAuthorizationSuccess":true}; GET /api/atlas/v2/groups/{groupId}/clusters/{hostName}/logs/mongodb-audit-log.gz · Command: atlas auditing update; atlas logs download <hostname> mongodb-audit-log.gz |
| Respond: Revocation ends active access | No docs found | Docs say clients lose access once the user is deleted; open sessions not addressed. |  |
| Respond: Stops working when user is removed | N/A | Database users are separate from Atlas users, so removing an Atlas user does not touch them. |  |

## Protect: what an admin can configure

### Admin controls
- **Temporary User** (Limit lifetime; all plans; default off). Database user is deleted automatically after 6 hours, 1 day or 1 week. Where: Database & Network Access > Add New Database User > Temporary User.
- **Restrict access to specific clusters** (Limit resources; all plans; default off). Limits a database user to chosen clusters and federated database instances. Where: Database user > Restrict Access to Specific Clusters.
- **Project IP access list** (Limit network; all plans; default on). Only listed IPs can connect to clusters. Where: Database & Network Access > IP Access List.
- **Roles required to add database users** (Disable; all plans; default on). Only users with the listed Organization or Project roles can create database users of any authentication type. Where: Atlas organization/project role assignment.

- Network: supported (checked at api_request). Project IP access list (or private endpoints/peering) gates every client connection to the cluster; not per user.
- Lifetime: Permanent unless created as temporary user (6 h, 1 day, 1 week). Renewal: Edit password to rotate.
- Keyless option: not_applicable. Database-level credential; Atlas UI SSO does not govern it.
- Conditions: Admin API credentials with the right project role can create database users.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Project Activity Feed: Database user create/update/delete.
- Database Access History: M10+; successful and failed auth attempts, last 7 days.
- Database audit log (mongodb-audit-log.gz): Not on Free/Flex; authenticate and authCheck actions; logs kept 30 days; download or push export.

### Fields that identify the credential
- `username` (Database Access History / audit log): null

### Lifecycle events
- create: `MONGODB_USER_ADDED` null
- modify: `MONGODB_USER_UPDATED` null
- revoke: `MONGODB_USER_DELETED` null
- use: `authenticate` Audit log atype
- use: `authCheck` Audit log atype; reads need authChecksReadAll to log successes

### Correlate on
`username`, `source IP`, `cluster hostname`

### API calls a holder can make, and whether they are logged
- recon: `connectionStatus (database command)`. Authenticated user and roles Logged: plan (`authenticate`). Auth logged in Database Access History (M10+); command itself not documented
- collection (bulk): `find (database command) on collections`. Data Logged: plan (`authCheck`). Only if database auditing enabled with read successes (authChecksReadAll); not on Free/Flex

### What to look for (analyst guidance)
- Auth from new IPs
- Large reads by app users
- Database user created by API key

## Respond: how to revoke it
- Admin: **Delete database user**. Removes the database user; also the only way to revoke an X.509 user. Where: Database & Network Access > Database Users > Delete.

Delete the user or change its password; tighten project IP access list. Live access ends on revocation: unknown. Docs say clients lose access once the user is deleted; open sessions not addressed.

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- Whether open connections are dropped on delete
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
- [View Database Access History](https://www.mongodb.com/docs/atlas/access-tracking/) (retrieved 2026-10-14)
- [Set Up Database Auditing](https://www.mongodb.com/docs/atlas/database-auditing/) (retrieved 2026-10-14)
- [View and Download MongoDB Logs](https://www.mongodb.com/docs/atlas/mongodb-logs/) (retrieved 2026-10-14)
- [Atlas Alert Event Types](https://www.mongodb.com/docs/atlas/reference/atlas-alert-event-types/) (retrieved 2026-10-14)
- [connectionStatus (database command)](https://www.mongodb.com/docs/manual/reference/command/connectionStatus/) (retrieved 2026-10-14)
