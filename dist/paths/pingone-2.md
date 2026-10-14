# PingOne: Worker application (user-based grant: authorization_code / implicit)

`pingone-2` · OAuth · person. An interactive Worker app signs in an admin user through PingOne and gets an access token that carries that user's admin role assignments. The token calls the Management APIs as the user.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | GET /v1/environments/{envID}/applications lists the Worker apps, but not the user tokens issued through them. | GET /v1/environments/{envID}/applications lists the Worker apps, but not the user tokens issued through them. |
| Protect: Admin can block or require approval | Yes | Application enable/disable toggle | Application enable/disable toggle: Applications > Applications > (app) > toggle; API: PUT application enabled=false |
| Protect: SSO and MFA rules apply | Yes | The token is issued after the user signs in through the authentication policies assigned on the Worker app's Policies tab. | Where: Applications > Applications > [Worker app] > Policies > Pencil > select PingOne/DaVinci policies > Save · API: POST /v1/environments/{envID}/applications/{appID}/signOnPolicyAssignments · Command: pingcli pingone applications sop-assignments create --environment-id <env> --application-id <app> --priority 1 --sign-on-policy-id <sop> |
| Protect: IP restriction | Conditional | Same as pingone-1: inbound traffic policies only on Cloudflare custom domains; coverage of Management API calls not documented. | Inbound traffic policies: /v1/environments/{envID}/inboundTrafficPolicies |
| Protect: Expires automatically | Yes | Access token 60 min; refresh token 30 days default, up to 1826 days | Refresh Token Duration: Applications > (app) > Configuration > Refresh Token; refreshTokenDuration |
| Detect: Usage appears in logs | Yes | actors.user.id, actors.client.id | PingOne Audit (Monitoring > Audit) and GET/POST /v1/environments/{envID}/activities: Configuration events kept 2 years, user events 90 days; queries max 14 days; Audit API rate 10/second. · Subscriptions (webhooks): Streams audit events to HTTPS/TCP endpoints; events lost if target down >7 days. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Partial | PingOne API access tokens cannot be revoked; roles are checked per call. | Remove the user's admin roles, disable the app, or delete the user. Revoke refresh tokens at /as/revoke only applies to custom-resource tokens. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Application enable/disable toggle** (Disable; all plans; default off). Disables a Worker app so it cannot be used. Where: Applications > Applications > (app) > toggle; API: PUT application enabled=false.
- **Refresh Token Duration** (Limit lifetime; all plans; default on). Sets refresh token lifetime (default 30 days, 60 seconds to 1826 days). Where: Applications > (app) > Configuration > Refresh Token; refreshTokenDuration.
- **Inbound traffic policies** (Limit network; Requires Cloudflare-based custom domain; default off). Allow or block requests by CIDR and other verify rules, only on Cloudflare-based custom domains. Where: /v1/environments/{envID}/inboundTrafficPolicies.

### Not available (vendor states)
- Access tokens for the PingOne API resource cannot be revoked via /as/revoke.

- Network: conditional (checked at unknown). Same as pingone-1: inbound traffic policies only on Cloudflare custom domains; coverage of Management API calls not documented.
- Lifetime: Access token 60 min; refresh token 30 days default, up to 1826 days. Renewal: If refresh tokens are enabled, new access tokens are minted without the user signing in again.
- Keyless option: not_applicable. User-delegated token; user sign-in may itself be federated to an external IdP.
- Conditions: Refresh tokens for custom resources can be revoked at /as/revoke; PingOne API resource tokens cannot.

## Detect: what gets logged
- Token prefix: not established

### Logs
- PingOne Audit (Monitoring > Audit) and GET/POST /v1/environments/{envID}/activities: Configuration events kept 2 years, user events 90 days; queries max 14 days; Audit API rate 10/second.
- Subscriptions (webhooks): Streams audit events to HTTPS/TCP endpoints; events lost if target down >7 days.

### Fields that identify the credential
- `actors.user.id` (Audit activities): Admin user
- `actors.client.id` (Audit activities): Interactive Worker app used

### Lifecycle events
- create: `APPLICATION.CREATED` 
- revoke: `ROLE_ASSIGNMENT.DELETED` Removing the user's roles
- revoke: `APPLICATION.DELETED` 

### Correlate on
`actors.client.id`, `actors.user.id`, `resources.id`, `source.ipAddress`, `source.userAgent`, `correlationId`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/environments`. Environments the user can reach Logged: unknown. 
- collection (bulk): `GET /v1/environments/{envID}/users`. All user records Logged: unknown. 

### What to look for (analyst guidance)
- Admin actions from an unusual client app or IP
- Long-lived refresh token use after the user left

## Respond: how to revoke it
- Admin: **Delete application**. Removes the Worker app and its secret (logged as APPLICATION.DELETED). Where: DELETE /v1/environments/{envID}/applications/{appID}.

Remove the user's admin roles, disable the app, or delete the user. Revoke refresh tokens at /as/revoke only applies to custom-resource tokens. Live access ends on revocation: partial. PingOne API access tokens cannot be revoked; roles are checked per call.

## No vendor documentation found
- Data reads appear in logs
- Stops working when user is removed
- Sign-in event names for interactive worker apps were not checked
- Whether disabling the app or rotating the secret invalidates already-issued access tokens (role removal does take effect per call per S5)
- Whether successful client_credentials token issuance produces an audit event
- Whether Management API read calls (e.g., GET users) are audited
- Whether inbound traffic policies apply to api.pingone.com
- Admin-level policy to block Worker app creation or require approval
- Gateway credential expiry and whether its creation/deletion has a distinct audit event
- Maximum configurable access token lifetime for the PingOne API resource

## Sources
- [Create Application (OIDC Protocol - Worker Interactive App)](https://developer.pingidentity.com/pingone-api/platform/applications/applications-1/create-application-oidc-protocol---worker-interactive-app.html) (retrieved 2026-10-14)
- [Access tokens and ID tokens](https://developer.pingidentity.com/pingone-api/foundations/authentication-concepts/access-tokens-and-id-tokens/index.html) (retrieved 2026-10-14)
- [Inbound Traffic Policies](https://developer.pingidentity.com/pingone-api/platform/inbound-traffic/index.html) (retrieved 2026-10-14)
- [Editing an application - Worker](https://docs.pingidentity.com/pingone/applications/p1_edit_application_worker.html) (retrieved 2026-10-14)
- [Administrator permissions and role assignments](https://developer.pingidentity.com/pingone-api/foundations/pingone-roles-scopes-and-permissions/administrator-permissions-and-role-assignments.html) (retrieved 2026-10-14)
- [Token Revocation](https://developer.pingidentity.com/pingone-api/auth/openid-connect-oauth-2/token/token-revocation.html) (retrieved 2026-10-14)
- [Worker applications](https://developer.pingidentity.com/pingone-api/foundations/authentication-concepts/authorization-and-authentication-by-application-type/worker-applications.html) (retrieved 2026-10-14)
- [Read All Applications | PingOne Platform APIs](https://developer.pingidentity.com/pingone-api/platform/applications/applications-1/read-all-applications.html) (retrieved 2026-10-14)
- [Applying authentication policies to an application](https://docs.pingidentity.com/pingone/applications/p1_apply_auth_policy_to_applications.html) (retrieved 2026-10-14)
- [Create SOP Assignment (PingOne Platform API)](https://developer.pingidentity.com/pingone-api/platform/applications/application-sign-on-policy-assignments/create-sop-assignment.html) (retrieved 2026-10-14)
- [pingcli pingone applications sop-assignments create](https://developer.pingidentity.com/pingcli/1.9/command_reference/pingcli_pingone_applications_sop-assignments_create.html) (retrieved 2026-10-14)
- [Audit Activities](https://developer.pingidentity.com/pingone-api/platform/audit-activities/index.html) (retrieved 2026-10-14)
- [Audit Reporting Events](https://developer.pingidentity.com/pingone-api/platform/reference/audit-reporting-events.html) (retrieved 2026-10-14)
- [Read User or Users](https://developer.pingidentity.com/pingone-api/platform/users/users-1/read-all-users.html) (retrieved 2026-10-14)
- [Base rate limits](https://developer.pingidentity.com/pingone-api/platform/rate-limiting/base-rate-limits.html) (retrieved 2026-10-14)
