# StrongDM: SCIM token

`strongdm-4` · Personal access token · service. Bearer token generated when an admin activates SCIM provisioning; the IdP uses it against /provisioning/<provider>/v2 endpoints on app.strongdm.com to manage users and roles.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | SCIM Provider: None - provisioning disabled | SCIM Provider: None - provisioning disabled: Settings > User Management > Provisioning > SCIM Provider |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | No docs found | Not documented |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Where: Logs > Activities (only 'SCIM token created' is listed; no per-call SCIM log) · Command: sdm audit activities --from <date> --to <date> |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | No docs found | Not documented; deactivating SCIM provisioning in Settings > User Management > Provisioning is the likely path. |  |
| Respond: Stops working when user is removed | N/A | SCIM token belongs to the org provisioning integration, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Permission level: Update account settings** (Other; all plans; default on). Only Administrators can change org settings, where SCIM is activated and its token generated. Where: Principals > Users > (user) > Settings > Permission Level.
- **SCIM Provider: None - provisioning disabled** (Disable; all plans; default varies). Turns off SCIM provisioning for the org. Where: Settings > User Management > Provisioning > SCIM Provider.

- Network: unknown (checked at unknown). Not documented.
- Lifetime: Not documented. Renewal: Regeneration/rotation not documented.
- Keyless option: not_applicable. Static bearer token.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- Activities: SCIM token creation logged.

### Fields that identify the credential
No docs found.

### Lifecycle events
- create: `SCIM token created` null

### Correlate on
`ipAddress`

### API calls a holder can make, and whether they are logged
- enumeration (bulk): `GET /provisioning/generic/v2/Users`. Users Logged: unknown. 

### What to look for (analyst guidance)
- User/role changes via SCIM not matching IdP changes

## Respond: how to revoke it


Not documented; deactivating SCIM provisioning in Settings > User Management > Provisioning is the likely path. Live access ends on revocation: unknown. null

## No vendor documentation found
- Admin can list all of them
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Revocation and rotation steps
- Whether SCIM requests are logged as Activities
- Any IP allowlist for admin tokens, API keys, service accounts, or SCIM tokens (docs silent).
- Any org-wide switch to block creation of admin tokens or API keys, or a maximum expiry policy.
- Whether SSO-required or MFA settings apply to service account token logins.
- SCIM token rotation, revocation, and lifetime.
- Service account token lifetime and rekey procedure.
- Whether read-only SDK/API calls (e.g. listing accounts or resources) are recorded as Activities.
- Whether API key creation logs as 'Admin token created' or a separate event.

## Sources
- [StrongDM SCIM API Specification](https://docs.strongdm.com/references/scim) (retrieved 2026-10-14)
- [Provisioning With Okta](https://docs.strongdm.com/admin/principals/provisioning/okta-provisioning) (retrieved 2026-10-14)
- [Provisioning With OneLogin](https://docs.strongdm.com/admin/principals/provisioning/onelogin-provisioning) (retrieved 2026-10-14)
- [View Logs from the Admin UI](https://docs.strongdm.com/admin/audit/logs/view-adminui) (retrieved 2026-10-14)
- [View Logs from the CLI](https://docs.strongdm.com/admin/audit/logs/view-cli) (retrieved 2026-10-14)
- [Permission Level](https://docs.strongdm.com/admin/access/permission-level) (retrieved 2026-10-14)
