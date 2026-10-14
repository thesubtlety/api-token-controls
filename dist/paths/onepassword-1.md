# 1Password: Service account token

`onepassword-1` · Personal access token · service. A service account is a non-human 1Password user. Its token (prefix ops_) carries the account unlock key, SRP verifier and keyset and is passed as OP_SERVICE_ACCOUNT_TOKEN to the CLI or SDKs.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | 1Password.com Developer > Service accounts; owners and administrators can manage all service accounts on the team. | 1Password.com Developer > Service accounts; owners and administrators can manage all service accounts on the team. |
| Protect: Admin can block or require approval | Yes (requires Teams or Business) | Service Account permission (who can create service accounts) | Service Account permission (who can create service accounts): Developer > Permissions > Service Account > Manage groups / Manage People |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Business firewall rules allow/deny sign-in attempts by IP, country or anonymous IP. Docs do not say whether they apply to service account sign-ins. |  |
| Protect: Expires automatically | Partial | No expiry unless set; CLI --expires-in at creation | Rotate Token: Developer > Service accounts > [account] > Token > Rotate Token · --expires-in: op service-account create --expires-in <duration> |
| Detect: Usage appears in logs | Yes | object_uuid (object_type sa / satoken), actor_uuid | Audit log: Business; 365 days in UI; CSV export; also via Events API auditevents · Usage report (service account / vault): Business; item access with action and last access · Service account overview recent activity: Developer > Service accounts |
| Detect: Data reads appear in logs | Conditional | Item access appears in usage reports (Business) | Where: 1Password.com > Reports > Usage Report card > Create usage report > choose the service account · API: POST /api/v2/itemusages (Events API; filter results on user.uuid = service account UUID) |
| Respond: Revocation ends active access | Yes | Docs: revoke immediately removes access; deleted SA token can't authenticate. | Developer > Service accounts > account > Revoke Token, or delete the service account; or turn off Service Account Access on affected vaults. |
| Respond: Stops working when user is removed | N/A | A service account is its own user account for programmatic access, not tied to a team member's account. |  |

## Protect: what an admin can configure

### Admin controls
- **Service Account permission (who can create service accounts)** (Require approval; Teams or Business; default on). Only owners/admins can create service accounts unless they grant the permission to groups or people. Where: Developer > Permissions > Service Account > Manage groups / Manage People.
- **Service Account Access (per vault)** (Limit resources; Teams or Business; default unknown). Turning off service account access on a vault removes it from all existing service accounts and blocks new grants. Where: Vault > Manage > Service Account Access toggle.
- **Vault permissions at creation** (Limit scope; all plans; default varies). Vaults and read/write/share permissions are chosen at creation and cannot be changed later. Where: Service account wizard / op service-account create --vault; Connect New Token.
- **Rotate Token** (Require rotation; all plans; default unknown). Issues a new token and expires the old one now, in 1 hour, or in 3 days. Where: Developer > Service accounts > [account] > Token > Rotate Token.
- **--expires-in** (Limit lifetime; all plans; default off). Sets a lifetime for a service account at creation via CLI. Where: op service-account create --expires-in <duration>.

### Not available (vendor states)
- Cannot edit an existing service account's vaults or permissions to narrow access; must revoke and recreate.

- Network: unknown (checked at unknown). Business firewall rules allow/deny sign-in attempts by IP, country or anonymous IP. Docs do not say whether they apply to service account sign-ins.
- Lifetime: No expiry unless set; CLI --expires-in at creation. Renewal: Rotate Token issues a new token and lets the old one expire now, in 1 hour, or in 3 days.
- Keyless option: not_verified. Service accounts have no email or password and are not tied to an IdP login. Docs do not say whether Unlock with SSO policies apply; the Events API lists a sign-in type service_account_sso_denied without explaining it.
- Conditions: Delegated creators manage only their own service accounts; they need Manage Vault on vaults they grant.

## Detect: what gets logged
- Token prefix: `ops_`

### Logs
- Audit log: Business; 365 days in UI; CSV export; also via Events API auditevents
- Usage report (service account / vault): Business; item access with action and last access
- Service account overview recent activity: Developer > Service accounts

### Fields that identify the credential
- `object_uuid (object_type sa / satoken)` (Audit events): aux_info holds token name for satoken events
- `actor_uuid` (Audit events / item usages): Service account is a user; exact representation not documented

### Lifecycle events
- create: `Create Integration (create, sa)` Service account created
- expiry: `Set Expiration Integration (expire, sa)` Expiry set
- create: `Create Token (create, satoken)` Token registered
- other: `Verify Token (tverify, satoken)` Token signature registered
- other: `Rename Token (trename, satoken)` 
- revoke: `Revoke Token (trevoke, satoken)` 

### Correlate on
`object_uuid`, `actor_uuid`, `session.ip`, `aux_info (token name)`

### API calls a holder can make, and whether they are logged
- recon: `op whoami`. Active service account Logged: unknown. 
- recon: `op service-account ratelimit`. Rate limit usage Logged: unknown. 
- enumeration (bulk): `op item list --vault <vault>`. Items in granted vaults Logged: unknown. Not documented as logged
- collection: `op item get / op read`. Secret values Logged: plan. Item access appears in usage reports (Business)

### What to look for (analyst guidance)
- New satoken created or rotated outside change windows
- Service account reading many vaults/items (op item list fans out per vault)
- Hitting hourly read limits
- Vault create by a service account

## Respond: how to revoke it
- Admin: **Revoke Token**. Revoking a service account token immediately removes its vault access. Where: Developer > Service accounts > [account] > Token > Revoke Token.

Developer > Service accounts > account > Revoke Token, or delete the service account; or turn off Service Account Access on affected vaults. Live access ends on revocation: yes. Docs: revoke immediately removes access; deleted SA token can't authenticate.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Whether individual CLI/SDK API calls are logged beyond item usage
- Whether whoami/list calls generate audit records
- Whether Business firewall rules apply to service account, Connect, Events API or Users API requests.
- Whether Unlock with SSO / IdP policies affect service accounts (service_account_sso_denied is undocumented).
- Whether audit log records Connect token, Events API token, SCIM credential regeneration or OAuth application create/revoke (only service account and satoken events are listed).
- Whether Events API, Users API or SCIM calls themselves are logged anywhere customer-visible.
- Whether a revoked Connect token or regenerated SCIM token stops working immediately.
- Maximum value for service account --expires-in.
- Whether the itemusages Events API feed includes service account item access (usage reports do).

## Sources
- [1Password Service Account security](https://www.1password.dev/service-accounts/security) (retrieved 2026-10-14)
- [1Password Events API reference](https://www.1password.dev/events-api/reference) (retrieved 2026-10-14)
- [Create firewall rules in 1Password Business](https://support.1password.com/firewall-rules/) (retrieved 2026-10-14)
- [Get started with 1Password Service Accounts](https://www.1password.dev/service-accounts/get-started) (retrieved 2026-10-14)
- [Audit events](https://www.1password.dev/events-api/audit-events) (retrieved 2026-10-14)
- [Manage service accounts](https://www.1password.dev/service-accounts/manage-service-accounts) (retrieved 2026-10-14)
- [Create reports in 1Password Business](https://support.1password.com/reports/) (retrieved 2026-10-14)
- [Use the audit log in 1Password Business](https://support.1password.com/activity-log/) (retrieved 2026-10-14)
- [Service account rate limits](https://www.1password.dev/service-accounts/rate-limits) (retrieved 2026-10-14)
- [Use service accounts with 1Password CLI](https://www.1password.dev/service-accounts/use-with-1password-cli) (retrieved 2026-10-14)
- [op whoami](https://www.1password.dev/cli/reference/commands/whoami) (retrieved 2026-10-14)
- [Manage Connect servers](https://www.1password.dev/connect/manage-connect) (retrieved 2026-10-14)
