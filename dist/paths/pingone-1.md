# PingOne: Worker application (client_credentials)

`pingone-1` · OAuth · service. A Worker app authenticates to POST /{envID}/as/token with its client ID and secret (or client_secret_jwt / private_key_jwt) and gets a 60-minute JWT access token. The token has admin-level access to the PingOne Management APIs, limited by the app's own role assignments. No user signs in, so sign-on policies and MFA do not apply to it (docs describe it as a userless app; no explicit SSO-bypass statement).

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /v1/environments/{envID}/applications lists all applications, including Worker apps, per environment. | GET /v1/environments/{envID}/applications lists all applications, including Worker apps, per environment. |
| Protect: Admin can block or require approval | Yes | Application enable/disable toggle | Application enable/disable toggle: Applications > Applications > (app) > toggle; API: PUT application enabled=false |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Inbound traffic policies (IP allow/block via CIDR verify rules) exist only for Cloudflare-based custom domains. Docs do not say they cover api.pingone.com Management API calls or the default auth.pingone.com token endpoint. | Inbound traffic policies: /v1/environments/{envID}/inboundTrafficPolicies |
| Protect: Expires automatically | Yes | Access token 60 min; client secret has no documented expiry | Generate New Secret: Applications > (app) > Configuration > Generate New Secret; application secret API |
| Detect: Usage appears in logs | Yes | actors.client.id, resources.id | PingOne Audit (Monitoring > Audit) and GET/POST /v1/environments/{envID}/activities: Configuration events kept 2 years, user events 90 days; queries max 14 days; Audit API rate 10/second. · Subscriptions (webhooks): Streams audit events to HTTPS/TCP endpoints; events lost if target down >7 days. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Partial | Role removal is checked per call (S5); token revocation is not available for PingOne API tokens (S8). | Generate a new secret and revoke the previous secret, remove role assignments, or disable/delete the app. Existing access tokens cannot be revoked; removing roles cuts access on the next call. |
| Respond: Stops working when user is removed | N/A | client_credentials tokens use the application's own role assignments, not a user's. |  |

## Protect: what an admin can configure

### Admin controls
- **Application enable/disable toggle** (Disable; all plans; default off). Disables a Worker app so it cannot be used. Where: Applications > Applications > (app) > toggle; API: PUT application enabled=false.
- **Role assignments (Roles tab / roleAssignments API)** (Limit scope; all plans; default varies). Worker app access equals its admin role assignments, scoped to org, environment, population, group, or application, and checked on each API call. Where: Applications > (app) > Roles; POST /environments/{envID}/applications/{appID}/roleAssignments.
- **assignActorRoles** (Limit scope; all plans; default on). When false, an API-created Worker app does not inherit the creator's roles. Where: POST /environments/{envID}/applications body assignActorRoles=false.
- **Generate New Secret** (Require rotation; all plans; default unknown). Replaces the client secret and keeps the previous one valid for a chosen window (1 minute to 90 days). Where: Applications > (app) > Configuration > Generate New Secret; application secret API.
- **Inbound traffic policies** (Limit network; Requires Cloudflare-based custom domain; default off). Allow or block requests by CIDR and other verify rules, only on Cloudflare-based custom domains. Where: /v1/environments/{envID}/inboundTrafficPolicies.

### Not available (vendor states)
- Issued PingOne API (Management API) access tokens cannot be revoked; they stay valid until expiry (60 min default).

- Network: conditional (checked at unknown). Inbound traffic policies (IP allow/block via CIDR verify rules) exist only for Cloudflare-based custom domains. Docs do not say they cover api.pingone.com Management API calls or the default auth.pingone.com token endpoint.
- Lifetime: Access token 60 min; client secret has no documented expiry. Renewal: No refresh token; reuse the client secret. On rotation the previous secret can stay valid 1 minute to 90 days.
- Keyless option: not_verified. Docs describe client secret and private_key_jwt client authentication; no workload identity federation for Worker apps was found.
- Conditions: An actor cannot grant roles it lacks; reading the secret requires a superset of the app's roles.

## Detect: what gets logged
- Token prefix: not established

### Logs
- PingOne Audit (Monitoring > Audit) and GET/POST /v1/environments/{envID}/activities: Configuration events kept 2 years, user events 90 days; queries max 14 days; Audit API rate 10/second.
- Subscriptions (webhooks): Streams audit events to HTTPS/TCP endpoints; events lost if target down >7 days.

### Fields that identify the credential
- `actors.client.id` (Audit activities): Worker app (client) ID that performed the action
- `resources.id` (Audit activities): Application ID on APPLICATION.* / SECRET.* events

### Lifecycle events
- create: `APPLICATION.CREATED` 
- create: `ROLE_ASSIGNMENT.CREATED` Roles granted to the app
- other: `SECRET.READ` Someone viewed the secret
- rotate: `SECRET.UPDATED` 
- use: `PREVIOUS_SECRET.USED` Old secret still in use after rotation
- revoke: `PREVIOUS_SECRET.REVOKED` 
- other: `APPLICATION.UPDATED` Includes enable/disable (inferred)
- revoke: `ROLE_ASSIGNMENT.DELETED` 
- revoke: `APPLICATION.DELETED` 

### Correlate on
`actors.client.id`, `actors.user.id`, `resources.id`, `source.ipAddress`, `source.userAgent`, `correlationId`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/environments`. Environments the app can reach Logged: unknown. No read event documented
- collection (bulk): `GET /v1/environments/{envID}/users`. All user records Logged: unknown. No user-read event in the event list
- discovery (bulk): `GET /v1/environments/{envID}/activities`. Audit log Logged: unknown. 

### What to look for (analyst guidance)
- SECRET.READ by an unexpected admin
- PREVIOUS_SECRET.USED long after rotation
- New ROLE_ASSIGNMENT.CREATED on a Worker app, especially cross-environment
- Config changes with actors.client.id of a Worker app from a new source.ipAddress

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **Revoke Previous Client Secret**. Ends the grace period for the old secret immediately. Where: Applications > (app) > Configuration > Revoke Previous Client Secret.
- Admin: **Delete application**. Removes the Worker app and its secret (logged as APPLICATION.DELETED). Where: DELETE /v1/environments/{envID}/applications/{appID}.

Generate a new secret and revoke the previous secret, remove role assignments, or disable/delete the app. Existing access tokens cannot be revoked; removing roles cuts access on the next call. Live access ends on revocation: partial. Role removal is checked per call (S5); token revocation is not available for PingOne API tokens (S8).

## No vendor documentation found
- SSO and MFA rules apply
- Data reads appear in logs
- Token issuance events
- Read-call auditing
- No documented whoami endpoint for client_credentials tokens
- Whether disabling the app or rotating the secret invalidates already-issued access tokens (role removal does take effect per call per S5)
- Whether successful client_credentials token issuance produces an audit event
- Whether Management API read calls (e.g., GET users) are audited
- Whether inbound traffic policies apply to api.pingone.com
- Admin-level policy to block Worker app creation or require approval
- Gateway credential expiry and whether its creation/deletion has a distinct audit event
- Maximum configurable access token lifetime for the PingOne API resource

## Sources
- [Worker applications](https://developer.pingidentity.com/pingone-api/foundations/authentication-concepts/authorization-and-authentication-by-application-type/worker-applications.html) (retrieved 2026-10-14)
- [Access tokens and ID tokens](https://developer.pingidentity.com/pingone-api/foundations/authentication-concepts/access-tokens-and-id-tokens/index.html) (retrieved 2026-10-14)
- [Applications](https://docs.pingidentity.com/pingone/applications/p1_application_types.html) (retrieved 2026-10-14)
- [Token Admin App (client_credentials)](https://developer.pingidentity.com/pingone-api/auth/openid-connect-oauth-2/token/token-admin-app-client_credentials.html) (retrieved 2026-10-14)
- [Inbound Traffic Policies](https://developer.pingidentity.com/pingone-api/platform/inbound-traffic/index.html) (retrieved 2026-10-14)
- [Application Secret](https://developer.pingidentity.com/pingone-api/platform/applications/application-secret/index.html) (retrieved 2026-10-14)
- [Editing an application - Worker](https://docs.pingidentity.com/pingone/applications/p1_edit_application_worker.html) (retrieved 2026-10-14)
- [Administrator permissions and role assignments](https://developer.pingidentity.com/pingone-api/foundations/pingone-roles-scopes-and-permissions/administrator-permissions-and-role-assignments.html) (retrieved 2026-10-14)
- [Create Application (OIDC Protocol - Worker App)](https://developer.pingidentity.com/pingone-api/platform/applications/applications-1/create-application-oidc-protocol---worker-app.html) (retrieved 2026-10-14)
- [Configuring roles for a worker application](https://docs.pingidentity.com/pingone/applications/p1_configurerolesforworkerapplication.html) (retrieved 2026-10-14)
- [Read All Applications | PingOne Platform APIs](https://developer.pingidentity.com/pingone-api/platform/applications/applications-1/read-all-applications.html) (retrieved 2026-10-14)
- [Token Revocation](https://developer.pingidentity.com/pingone-api/auth/openid-connect-oauth-2/token/token-revocation.html) (retrieved 2026-10-14)
- [Audit Reporting Events](https://developer.pingidentity.com/pingone-api/platform/reference/audit-reporting-events.html) (retrieved 2026-10-14)
- [Audit Activities](https://developer.pingidentity.com/pingone-api/platform/audit-activities/index.html) (retrieved 2026-10-14)
- [Audit](https://docs.pingidentity.com/pingone/monitoring/p1_reporting.html) (retrieved 2026-10-14)
- [Subscriptions (webhooks)](https://developer.pingidentity.com/pingone-api/platform/subscriptions-webhooks/index.html) (retrieved 2026-10-14)
- [Read User or Users](https://developer.pingidentity.com/pingone-api/platform/users/users-1/read-all-users.html) (retrieved 2026-10-14)
- [Base rate limits](https://developer.pingidentity.com/pingone-api/platform/rate-limiting/base-rate-limits.html) (retrieved 2026-10-14)
