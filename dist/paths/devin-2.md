# Devin: Personal Access Token (PAT)

`devin-2` · Personal access token · person. cog_ bearer token that acts as the human user with all of that user's permissions in every org they belong to. Used by the Devin CLI, desktop apps, MCP and API.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | The PAT inventory view on the enterprise PAT policies tab lists PATs across the enterprise (Enterprise; needs Manage account API keys). | Where: Enterprise settings > Devin API > PAT policies > PAT inventory |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | PAT policy; PAT approval workflow | PAT policy: Enterprise settings > Devin API > PAT policies · PAT approval workflow: PAT policies > Approval queue |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Enterprise IP access list applies to API requests. | IP Access Lists: /v3/enterprise/ip-access-list (ManageIPWhitelist) |
| Protect: Expires automatically | Partial | Enterprise: expiry required, max 365 days by default (shorter configurable); Teams: may never expire | Where: Enterprise settings > Devin API > PAT policies (maximum lifetime); PAT inventory shows each token's expiration date |
| Detect: Usage appears in logs | Yes | user_id / user_email | API: GET /v3/enterprise/audit-logs; filter results on user_id / user_email |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Yes | Rotation stops the old secret immediately; revoke is documented as invalidating the token. | Where: Enterprise settings > Devin API > PAT policies > PAT inventory > Revoke (row); or set policy to Disabled to revoke all |
| Respond: Stops working when user is removed | Yes | PATs are revoked automatically when the user loses account membership, including through SCIM deprovisioning or IdP group changes. | Where: Settings > Membership > remove member; or deactivate the user in the IdP (SCIM) · API: DELETE /v3/enterprise/members/users/{user_id} |

## Protect: what an admin can configure

### Admin controls
- **PAT policy** (Disable; Enterprise; default off). Disabled, Approval required, or Self serve for all orgs in the enterprise. Where: Enterprise settings > Devin API > PAT policies.
- **PAT approval workflow** (Require approval; Enterprise; default off). Admins approve or deny each PAT request; requests lapse after 7 days. Where: PAT policies > Approval queue.
- **PAT expiration policy** (Limit lifetime; Enterprise; default on). Requires expiry, capped at 365 days by default or shorter. Where: PAT policies.
- **IP Access Lists** (Limit network; Enterprise; default off). Only allowed CIDRs can reach Devin APIs and webapp. Where: /v3/enterprise/ip-access-list (ManageIPWhitelist).

### Not available (vendor states)
- Teams (non-enterprise) accounts have no PAT policy and may create non-expiring PATs.
- PATs cannot be scoped below the user's full permissions.

- Network: supported (checked at api_request). Enterprise IP access list applies to API requests.
- Lifetime: Enterprise: expiry required, max 365 days by default (shorter configurable); Teams: may never expire. Renewal: Rotate generates a new secret; old secret stops immediately.
- Keyless option: not_applicable. Static token.
- Conditions: No policy controls on Teams plans.

## Detect: what gets logged
- Token prefix: `cog_`

### Logs
- Audit logs API: Enterprise. Email notifications for PAT lifecycle.

### Fields that identify the credential
- `user_id / user_email` (audit log): PAT actions attributed to the user.

### Lifecycle events
- create: `create_pat` 
- rotate: `rotate_pat` 
- revoke: `revoke_pat` 
- revoke: `policy_revoke_pat` Revoked by policy change
- other: `approve_pat_request` 

### Correlate on
`user_id`, `org_id`

### API calls a holder can make, and whether they are logged
- recon: `GET /v3/self`. pat_user identity Logged: unknown. 
- collection (bulk): `GET /v3/organizations/{org_id}/sessions`. Sessions the user can view Logged: unknown. 

### What to look for (analyst guidance)
- create_pat right after approve_pat_request for a departing user
- search_query or create_session volume spike

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **PAT inventory revoke**. Admin revokes any user's PAT, one at a time; policy changes can bulk-revoke noncompliant tokens. Where: PAT policies > PAT inventory.
- Admin: **Automatic PAT revocation on deprovision**. PATs revoked when a user leaves the account, incl. SCIM. Where: Automatic.
- Admin: **Rotate / Revoke PAT**. Owner rotates (old secret stops immediately) or revokes. Where: Settings > Devin API > PATs.

Admin revokes from PAT inventory, or switch PAT policy to Disabled, or remove the user (auto-revokes). Live access ends on revocation: yes. Rotation stops the old secret immediately; revoke is documented as invalidating the token.

## No vendor documentation found
- SSO and MFA rules apply
- Data reads appear in logs
- Whether API tokens are blocked when SSO is enforced or bypass IdP conditional access (not stated)
- Inbound workload federation for the Devin API (audit actions exist, no guide found)
- Where the static service user key policy is set in the UI
- Audit log retention period
- Whether read calls (list sessions, list knowledge) are audited
- Legacy key expiry and whether a v3 setting disables them
- Whether revoking a service user key ends access immediately

## Sources
- [Authentication | Devin Docs](https://docs.devin.ai/api-reference/authentication) (retrieved 2026-10-14)
- [Personal Access Tokens | Devin Docs](https://docs.devin.ai/api-reference/personal-access-tokens) (retrieved 2026-10-14)
- [IP Access Lists | Devin Docs](https://docs.devin.ai/enterprise/security-access/ip-access-lists) (retrieved 2026-10-14)
- [List Audit Logs | Devin API](https://docs.devin.ai/api-reference/v3/audit-logs/enterprise-audit-logs) (retrieved 2026-10-14)
- [Delete User (Devin API v3)](https://docs.devin.ai/api-reference/v3/users/delete-members-users) (retrieved 2026-10-14)
- [Invite your Team](https://docs.devin.ai/product-guides/invite-team) (retrieved 2026-10-14)
- [SCIM Setup](https://docs.devin.ai/enterprise/security-access/scim) (retrieved 2026-10-14)
- [Get Self | Devin API](https://docs.devin.ai/api-reference/v3/self/self) (retrieved 2026-10-14)
- [List Sessions | Devin API](https://docs.devin.ai/api-reference/v3/sessions/organizations-sessions) (retrieved 2026-10-14)
