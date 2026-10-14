# StrongDM: Service account token

`strongdm-3` · Personal access token · service. A service account is a non-human user that logs in with its token (sdm login --admin-token or the desktop app) and then gets resource access through role membership.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | `sdm admin services list` lists all service accounts; Principals > Users shows them with a Service Account label. | `sdm admin services list` lists all service accounts; Principals > Users shows them with a Service Account label. |
| Protect: Admin can block or require approval | Yes | Suspend user | Suspend user: Users > Actions > Suspend user |
| Protect: SSO and MFA rules apply | Not available | Service accounts authenticate with tokens instead of username/password, and session/idle timeouts apply only to human users. |  |
| Protect: IP restriction | Conditional (requires Enterprise) | Enterprise Policies (Cedar) can permit/forbid resource actions by context.location IP for any principal, including service accounts. No documented IP restriction on the token login itself. | Policies (Location::IP context): Access > Policies |
| Protect: Expires automatically | Yes | Optional expiration set when creating the service account (CLI CSV name,expiration); 'Service account expired' activity is logged | Command: sdm admin services add --csv (CSV columns name,expiration); expiry is logged as activity 'Service account expired' |
| Detect: Usage appears in logs | Yes | actorAccountID | Where: Logs > Activities (and Logs > Queries) filtered by Account = service account · Command: sdm audit activities --json (filter actorAccountID); sdm audit queries --from <date> |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | No docs found | Effect on open resource sessions not documented. |  |
| Respond: Stops working when user is removed | N/A | Service accounts are machine principals, not tied to a human user. |  |

## Protect: what an admin can configure

### Admin controls
- **Role membership** (Limit resources; all plans; default varies). Service accounts only reach resources granted through their roles. Where: Principals > Users > service account > Roles.
- **Suspend user** (Disable; all plans; default off). Suspending an account revokes its access to infrastructure. Where: Users > Actions > Suspend user.
- **Permission level: Manage service accounts, admin tokens, and API keys** (Other; all plans; default on). Only the Administrator permission level can create or manage admin tokens, API keys, and service accounts; other levels cannot. Where: Principals > Users > (user) > Settings > Permission Level.
- **Policies (Location::IP context)** (Limit network; Enterprise; default off). Cedar policy statements can permit or forbid a principal's resource actions based on the source IP or location. Where: Access > Policies.

- Network: conditional (checked at mixed). Enterprise Policies (Cedar) can permit/forbid resource actions by context.location IP for any principal, including service accounts. No documented IP restriction on the token login itself.
- Lifetime: Optional expiration set when creating the service account (CLI CSV name,expiration); 'Service account expired' activity is logged. Renewal: Activities include 'Service account rekeyed'; rekey procedure not documented on the service account page.
- Keyless option: not_verified. No documented OIDC/workload federation for service accounts.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- Activities: Plus Queries and Replays for resource sessions when StrongDM log retention is enabled.

### Fields that identify the credential
- `actorAccountID` (Activities): Service account ID.

### Lifecycle events
- create: `Service account created` null
- rotate: `Service account rekeyed` null
- expire: `Service account expired` null
- use: `Attempted to login by a suspended service account from the Admin UI` Failed use after suspension

### Correlate on
`actorAccountID`, `ipAddress`

### API calls a holder can make, and whether they are logged
- recon (bulk): `sdm status`. Resources the service account can reach Logged: unknown. Resource connections are logged as queries/replays, not Activities.

### What to look for (analyst guidance)
- Service account logins from new IPs
- Resource queries outside normal job windows

## Respond: how to revoke it


Suspend the service account in Users, or rekey it. Live access ends on revocation: unknown. Effect on open resource sessions not documented.

## No vendor documentation found
- Data reads appear in logs
- Revocation ends active access
- Whether suspension ends live client sessions
- Any IP allowlist for admin tokens, API keys, service accounts, or SCIM tokens (docs silent).
- Any org-wide switch to block creation of admin tokens or API keys, or a maximum expiry policy.
- Whether SSO-required or MFA settings apply to service account token logins.
- SCIM token rotation, revocation, and lifetime.
- Service account token lifetime and rekey procedure.
- Whether read-only SDK/API calls (e.g. listing accounts or resources) are recorded as Activities.
- Whether API key creation logs as 'Admin token created' or a separate event.

## Sources
- [Service Accounts](https://docs.strongdm.com/admin/principals/service-accounts) (retrieved 2026-10-14)
- [Policy Taxonomy](https://docs.strongdm.com/admin/access/policies/policy-taxonomy) (retrieved 2026-10-14)
- [Policies](https://docs.strongdm.com/admin/access/policies) (retrieved 2026-10-14)
- [sdm admin services add](https://docs.strongdm.com/references/cli/admin/services/add) (retrieved 2026-10-14)
- [View Logs from the Admin UI](https://docs.strongdm.com/admin/audit/logs/view-adminui) (retrieved 2026-10-14)
- [Principals](https://docs.strongdm.com/admin/principals) (retrieved 2026-10-14)
- [Authentication](https://docs.strongdm.com/admin/principals/authentication) (retrieved 2026-10-14)
- [sdm admin services list](https://docs.strongdm.com/references/cli/admin/services/list) (retrieved 2026-10-14)
- [Log Stream - Activities](https://docs.strongdm.com/admin/audit/logs/references/logstream-activities) (retrieved 2026-10-14)
- [View Logs from the CLI](https://docs.strongdm.com/admin/audit/logs/view-cli) (retrieved 2026-10-14)
- [Users](https://docs.strongdm.com/admin/principals/users) (retrieved 2026-10-14)
- [Permission Level](https://docs.strongdm.com/admin/access/permission-level) (retrieved 2026-10-14)
