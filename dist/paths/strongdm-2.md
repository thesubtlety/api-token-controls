# StrongDM: API key (access key + secret key)

`strongdm-2` · HMAC · person or service. Access key (auth-...) plus secret used by the SDKs and Terraform provider to sign each gRPC request, AWS SigV4 style; the secret is not sent.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin UI Principals > Tokens lists API keys; `sdm admin tokens list` lists all tokens in the org. | Admin UI Principals > Tokens lists API keys; `sdm admin tokens list` lists all tokens in the org. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Docs do not describe any IP allowlist for API keys. |  |
| Protect: Expires automatically | Yes | Expiry chosen at creation | Token expiry: Create page expiry selector; --duration |
| Detect: Usage appears in logs | Yes | actorAccountID, userAgent | Where: Logs > Activities; filter Actor/Account = API key owner (activities such as 'Admin token ...') · Command: sdm audit activities --from <date> --json, then filter on actorAccountID |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Yes | Signed requests are checked per call, so deletion blocks further requests. | Delete the key in Principals > Tokens; there is no rotate, so create a replacement first if automation needs it. |
| Respond: Stops working when user is removed | Partial | API keys survive suspension of the creating user by default; the UI prompt or `sdm admin users suspend --cascade` can suspend/delete them. | Where: Users > Actions > Suspend user > Confirm suspension; answer Yes when prompted to delete the user's API keys · Command: sdm admin users suspend --cascade <email/id> |

## Protect: what an admin can configure

### Admin controls
- **Token permissions** (Limit scope; all plans; default varies). Each admin token or API key gets only the admin permissions chosen at creation. Where: Create Admin Token / Create API Key page; --permissions.
- **Token expiry** (Limit lifetime; all plans; default varies). Set an expiry at creation; 'never' is an allowed choice. Where: Create page expiry selector; --duration.
- **Permission level: Manage service accounts, admin tokens, and API keys** (Other; all plans; default on). Only the Administrator permission level can create or manage admin tokens, API keys, and service accounts; other levels cannot. Where: Principals > Users > (user) > Settings > Permission Level.

### Not available (vendor states)
- API keys cannot be rotated in place.
- Suspending the creating user does not disable API keys.

- Network: unknown (checked at unknown). Docs do not describe any IP allowlist for API keys.
- Lifetime: Expiry chosen at creation. Renewal: No rotation; clone to create a new pair with the same permissions, then delete the old one.
- Keyless option: not_applicable. Static key pair; no documented federation.
- Conditions: null

## Detect: what gets logged
- Token prefix: `auth-`

### Logs
- Activities: 30 days in Admin UI without Enterprise, 13 months with Enterprise; Log Stream is Enterprise.

### Fields that identify the credential
- `actorAccountID` (Activities): Acting account.
- `userAgent` (Activities): SDK calls show e.g. strongdm-sdk-python/8.3.0.

### Lifecycle events
No docs found.

### Correlate on
`actorAccountID`, `ipAddress`, `userAgent`

### API calls a holder can make, and whether they are logged
- discovery (bulk): `SDK Accounts list (gRPC, app.strongdm.com)`. User and service accounts Logged: unknown. 
- enumeration (bulk): `SDK Resources / Roles / AccountResources list`. Infrastructure inventory and who can reach it Logged: unknown. 
- collection (bulk): `SDK Queries / Replays / Activities list`. Query logs and session replays Logged: unknown. Activities record userAgent and ipAddress when an activity is logged.

### What to look for (analyst guidance)
- Unexpected SDK userAgent values
- Keys owned by suspended users
- Keys with no expiry

## Respond: how to revoke it
- Admin: **Delete API key**. Deleted API keys are invalidated instantly. Where: Principals > Tokens; sdm admin tokens delete.
- Admin: **Delete tokens on user suspension**. When suspending a user, the Admin UI lists their tokens and keys and asks whether to delete them. Where: Users > Suspend user.
- Admin: **sdm admin users suspend --cascade**. Suspending a user with --cascade also suspends that user's linked API keys. Where: CLI: sdm admin users suspend --cascade.

Delete the key in Principals > Tokens; there is no rotate, so create a replacement first if automation needs it. Live access ends on revocation: yes. Signed requests are checked per call, so deletion blocks further requests.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Exact Activity names for API key create/delete
- No documented whoami call
- Whether reads are logged
- Any IP allowlist for admin tokens, API keys, service accounts, or SCIM tokens (docs silent).
- Any org-wide switch to block creation of admin tokens or API keys, or a maximum expiry policy.
- Whether SSO-required or MFA settings apply to service account token logins.
- SCIM token rotation, revocation, and lifetime.
- Service account token lifetime and rekey procedure.
- Whether read-only SDK/API calls (e.g. listing accounts or resources) are recorded as Activities.
- Whether API key creation logs as 'Admin token created' or a separate event.

## Sources
- [Generate API Keys](https://docs.strongdm.com/references/api/api-keys) (retrieved 2026-10-14)
- [API Reference](https://docs.strongdm.com/references/api) (retrieved 2026-10-14)
- [sdm admin users suspend](https://docs.strongdm.com/references/cli/admin/users/suspend) (retrieved 2026-10-14)
- [sdm admin tokens list](https://docs.strongdm.com/references/cli/admin/tokens/list) (retrieved 2026-10-14)
- [View Logs from the Admin UI](https://docs.strongdm.com/admin/audit/logs/view-adminui) (retrieved 2026-10-14)
- [sdm audit activities](https://docs.strongdm.com/references/cli/audit/activities) (retrieved 2026-10-14)
- [Log Stream - Activities](https://docs.strongdm.com/admin/audit/logs/references/logstream-activities) (retrieved 2026-10-14)
- [Users](https://docs.strongdm.com/admin/principals/users) (retrieved 2026-10-14)
- [Logs](https://docs.strongdm.com/admin/audit/logs) (retrieved 2026-10-14)
- [Rate Limits](https://docs.strongdm.com/concepts/security/rate-limits) (retrieved 2026-10-14)
- [Admin Tokens](https://docs.strongdm.com/admin/principals/admin-tokens) (retrieved 2026-10-14)
- [sdm admin tokens add](https://docs.strongdm.com/references/cli/admin/tokens/add) (retrieved 2026-10-14)
- [Permission Level](https://docs.strongdm.com/admin/access/permission-level) (retrieved 2026-10-14)
