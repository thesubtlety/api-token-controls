# StrongDM: Admin token

`strongdm-1` · Personal access token · person or service. Single secret string used with the sdm CLI via SDM_ADMIN_TOKEN or sdm login --admin-token. It can only run the sdm admin commands granted to it, and use skips the interactive login.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin UI Principals > Tokens and `sdm admin tokens list` list all tokens in the org; `sdm audit tokens` gives a point-in-time listing. | Admin UI Principals > Tokens and `sdm admin tokens list` list all tokens in the org; `sdm audit tokens` gives a point-in-time listing. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Not available | Docs say a CLI session using an admin token does not need a CLI or GUI login, so the SSO login flow is not involved. |  |
| Protect: IP restriction | No docs found | Docs do not describe any IP allowlist for admin tokens. |  |
| Protect: Expires automatically | Yes | 1 week, 1 month, 1 year, or never (CLI duration default 0) | Rotate: Principals > Tokens > Rotate · Token expiry: Create page expiry selector; --duration |
| Detect: Usage appears in logs | Yes | actorAccountID | Activities (Admin UI Logs > Activities, sdm audit activities, API Activities): 30 days in Admin UI without Enterprise, 13 months with Enterprise. · Log Stream - Activities: Enterprise; streams to customer object storage. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Partial | Docs say delete is immediate, but the rotate tooltip says existing authentications expire after 24 hours. | Delete the token in Principals > Tokens or with sdm admin tokens delete. Prefer delete over rotate: rotation lets existing authentications live up to 24 hours. |
| Respond: Stops working when user is removed | Not available | Admin tokens keep working after the creating user is suspended unless the admin chooses to delete them in the suspension prompt. |  |

## Protect: what an admin can configure

### Admin controls
- **Rotate** (Require rotation; all plans; default off). Generates a new secret with the same permissions; existing authentications expire after 24 hours. Where: Principals > Tokens > Rotate.
- **Token permissions** (Limit scope; all plans; default varies). Each admin token or API key gets only the admin permissions chosen at creation. Where: Create Admin Token / Create API Key page; --permissions.
- **Token expiry** (Limit lifetime; all plans; default varies). Set an expiry at creation; 'never' is an allowed choice. Where: Create page expiry selector; --duration.
- **Permission level: Manage service accounts, admin tokens, and API keys** (Other; all plans; default on). Only the Administrator permission level can create or manage admin tokens, API keys, and service accounts; other levels cannot. Where: Principals > Users > (user) > Settings > Permission Level.

### Not available (vendor states)
- Suspending the creating user does not disable admin tokens.

- Network: unknown (checked at unknown). Docs do not describe any IP allowlist for admin tokens.
- Lifetime: 1 week, 1 month, 1 year, or never (CLI duration default 0). Renewal: Rotate regenerates the secret with same name and permissions; old authentications expire after 24 hours.
- Keyless option: not_applicable. Static secret; no documented workload identity federation.
- Conditions: Administrator permission level needed to create via CLI.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Activities (Admin UI Logs > Activities, sdm audit activities, API Activities): 30 days in Admin UI without Enterprise, 13 months with Enterprise.
- Log Stream - Activities: Enterprise; streams to customer object storage.

### Fields that identify the credential
- `actorAccountID` (Activities): Account that performed the activity; whether token ID is separately recorded is not documented.

### Lifecycle events
- create: `Admin token created` null
- create: `Admin token cloned` null
- rotate: `Admin token rekeyed` null
- disable: `Admin token suspended` null
- enable: `Admin token reinstated` null
- expire: `Admin token expired` null
- revoke: `Admin token deleted` null

### Correlate on
`actorAccountID`, `ipAddress`, `userAgent`, `entities`

### API calls a holder can make, and whether they are logged
- discovery (bulk): `sdm admin users list`. Users and service accounts Logged: unknown. Activities cover administrative changes; reads not stated.
- enumeration (bulk): `sdm admin datasources list / sdm admin servers list`. Resources, hosts, ports Logged: unknown. 
- collection (bulk): `sdm audit activities`. Organization activity history Logged: unknown. 

### What to look for (analyst guidance)
- Tokens with expiry 'never'
- Tokens owned by suspended users
- Admin activity from unfamiliar ipAddress or userAgent

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **Delete token**. Deleting an admin token stops it authenticating immediately. Where: Principals > Tokens; sdm admin tokens delete.
- Admin: **Delete tokens on user suspension**. When suspending a user, the Admin UI lists their tokens and keys and asks whether to delete them. Where: Users > Suspend user.

Delete the token in Principals > Tokens or with sdm admin tokens delete. Prefer delete over rotate: rotation lets existing authentications live up to 24 hours. Live access ends on revocation: partial. Docs say delete is immediate, but the rotate tooltip says existing authentications expire after 24 hours.

## No vendor documentation found
- Admin can block or require approval
- IP restriction
- Data reads appear in logs
- Whether each admin command run with the token is an Activity
- No documented whoami for admin tokens
- Any IP allowlist for admin tokens, API keys, service accounts, or SCIM tokens (docs silent).
- Any org-wide switch to block creation of admin tokens or API keys, or a maximum expiry policy.
- Whether SSO-required or MFA settings apply to service account token logins.
- SCIM token rotation, revocation, and lifetime.
- Service account token lifetime and rekey procedure.
- Whether read-only SDK/API calls (e.g. listing accounts or resources) are recorded as Activities.
- Whether API key creation logs as 'Admin token created' or a separate event.

## Sources
- [Admin Tokens](https://docs.strongdm.com/admin/principals/admin-tokens) (retrieved 2026-10-14)
- [sdm admin tokens add](https://docs.strongdm.com/references/cli/admin/tokens/add) (retrieved 2026-10-14)
- [sdm admin tokens](https://docs.strongdm.com/references/cli/admin/tokens) (retrieved 2026-10-14)
- [sdm admin tokens list](https://docs.strongdm.com/references/cli/admin/tokens/list) (retrieved 2026-10-14)
- [sdm audit tokens](https://docs.strongdm.com/references/cli/audit/tokens) (retrieved 2026-10-14)
- [View Logs from the Admin UI](https://docs.strongdm.com/admin/audit/logs/view-adminui) (retrieved 2026-10-14)
- [Logs](https://docs.strongdm.com/admin/audit/logs) (retrieved 2026-10-14)
- [Log Stream - Activities](https://docs.strongdm.com/admin/audit/logs/references/logstream-activities) (retrieved 2026-10-14)
- [sdm audit activities](https://docs.strongdm.com/references/cli/audit/activities) (retrieved 2026-10-14)
- [Rate Limits](https://docs.strongdm.com/concepts/security/rate-limits) (retrieved 2026-10-14)
- [Generate API Keys](https://docs.strongdm.com/references/api/api-keys) (retrieved 2026-10-14)
- [API Reference](https://docs.strongdm.com/references/api) (retrieved 2026-10-14)
- [Permission Level](https://docs.strongdm.com/admin/access/permission-level) (retrieved 2026-10-14)
