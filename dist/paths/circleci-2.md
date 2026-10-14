# CircleCI: Project API tokens (deprecated)

`circleci-2` · API key / token · service. Per-project token with Status, Read Only or Admin scope; works on API v1 only, not v2.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Tokens are listed per project under Project Settings > API Permissions; no org-wide listing is documented. | Tokens are listed per project under Project Settings > API Permissions; no org-wide listing is documented. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No inbound allowlist documented. |  |
| Protect: Expires automatically | No docs found | No expiry documented |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Where: Org > Security > Audit Logs > Request audit logs > Download logs (CSV); filter action project.api_token.create (no field identifies the token on use) |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | No docs found | Delete under Project Settings > API Permissions. |  |
| Respond: Stops working when user is removed | N/A | Project tokens belong to a project, not to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Project API token scope** (Limit scope; all plans; default varies). Choose Status, Read Only or Admin. Where: Project Settings > API Permissions.

- Network: unknown (checked at unknown). No inbound allowlist documented.
- Lifetime: No expiry documented. Renewal: Delete and recreate.
- Keyless option: not_applicable. Not tied to a user login.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- CircleCI audit logs: As above.

### Fields that identify the credential
No docs found.

### Lifecycle events
- create: `project.api_token.create` Listed event.

### Correlate on
`target project`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- New Admin-scope project tokens

## Respond: how to revoke it
- Admin: **Delete project API token**. Delete a project token (type DELETE to confirm). Where: Project Settings > API Permissions.

Delete under Project Settings > API Permissions. Live access ends on revocation: unknown. 

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Delete event name
- v1 endpoints usable with project tokens
- Any org-admin setting to block, list or revoke members' personal API tokens.
- Any org setting to disable OAuth Dynamic Client Registration tokens.
- Any inbound IP allowlist for the CircleCI API or web app.
- Whether personal API token create/delete or API reads appear in audit logs (not in the published event list).
- Whether an SSO-authorized token stops working when the IdP session ends or the user is removed from the IdP.
- Project API token expiry.

## Sources
- [Managing API tokens](https://circleci.com/docs/guides/toolkit/managing-api-tokens/) (retrieved 2026-10-14)
- [CircleCI API v2 OpenAPI](https://circleci.com/api/v2/openapi.json) (retrieved 2026-10-14)
- [Pause or stop pipelines during an incident](https://circleci.com/docs/guides/orchestrate/pause-pipelines-during-an-incident/) (retrieved 2026-10-14)
- [Audit logs](https://circleci.com/docs/guides/security/audit-logs/) (retrieved 2026-10-14)
