# Notion: Admin API token

`notion-4` · API key / token · service. Organization-level token issued to an admin bot and used for Enterprise admin actions such as workspace exports, legal holds and logging out managed users. It is separate from workspace connection tokens.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin connections are listed in organization settings (General → Manage organization-level admin API tokens) with creator and date. | Admin connections are listed in organization settings (General → Manage organization-level admin API tokens) with creator and date. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Not available | Notion states admin tokens cannot be limited to specific IP addresses or networks; Enterprise IP restrictions apply only to people signing in. Restrict use at your own network or secrets layer. |  |
| Protect: Expires automatically | No docs found | Static token; expiry not documented |  |
| Detect: Usage appears in logs | Yes | revoked_by | Notion organization audit log (organization events): Enterprise; records organization token lifecycle; admin-token actions logged with the admin bot as actor. · Notion SIEM connection (webhook): Enterprise; real-time JSON webhook of every audit log event; payload field names not documented publicly. · Organization console → Manage organization-level admin API tokens: Lists connections with creator and creation time. |
| Detect: Data reads appear in logs | Yes | Workspace content exported | Where: Settings > Audit log; filter Event = Workspace content exported and Person or agent = the admin bot name; Export for CSV |
| Respond: Revocation ends active access | Yes | Help doc: any script using the token stops immediately. Admin tokens cannot be IP-restricted. | Organization console → Manage organization-level admin API tokens → delete/revoke the token; review audit log for actions with that admin bot as actor. |
| Respond: Stops working when user is removed | N/A | Admin tokens belong to the organization, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Admin bot token scopes** (Limit scope; Enterprise; default unknown). Org owners pick which admin actions each admin token may perform. Where: Manage organization > General > Manage organization-level admin API tokens.
- **Rotate or delete admin token** (Require rotation; Enterprise; default unknown). Owners rotate or delete admin tokens; scripts using a revoked token stop immediately. Where: Manage organization > General > admin API tokens.
- **Admin APIs (organization owners only)** (Other; Enterprise; default unknown). Only organization owners on Enterprise can create admin connections and tokens; no other role can. Where: Manage organization → General → Manage organization-level admin API tokens.

### Not available (vendor states)
- Admin tokens cannot be restricted to IP addresses or networks.

- Network: not_supported (checked at login_only). Notion states admin tokens cannot be limited to specific IP addresses or networks; Enterprise IP restrictions apply only to people signing in. Restrict use at your own network or secrets layer.
- Lifetime: Static token; expiry not documented. Renewal: The same token is reused until it is deleted; Notion recommends rotating on a schedule your security team sets.
- Keyless option: not_applicable. Static organization token created in Notion settings. No external identity exchange is documented for this path.
- Conditions: Enterprise plan only. The help page names exports, legal holds and user logout; it does not list SCIM or audit-log API coverage.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Notion organization audit log (organization events): Enterprise; records organization token lifecycle; admin-token actions logged with the admin bot as actor.
- Notion SIEM connection (webhook): Enterprise; real-time JSON webhook of every audit log event; payload field names not documented publicly.
- Organization console → Manage organization-level admin API tokens: Lists connections with creator and creation time.

### Fields that identify the credential
- `revoked_by` (Admin API list PATs): type organization_bot shows a PAT revoked by an admin token

### Lifecycle events
- create: `Organization token created` audit log display name
- change: `Organization token updated` e.g. scopes changed
- revoke: `Organization token deleted` listed in help-center audit log page under Bots
- change: `Organization token access changed` listed in help-center audit log page under Bots
- create: `Admin bot created or deleted` help-center audit log page

### Correlate on
`revoked_by`

### API calls a holder can make, and whether they are logged
- discovery: `GET /v1/legal_holds`. all legal holds for the organization, active and released Logged: yes (`(admin token action)`). Actions taken with an admin token show up in the audit log with the bot as actor; Enterprise, 365-day retention
- collection (bulk): `POST /v1/spaces/{space_id}/exports`. enqueues a full workspace export (html/markdown, with contents and comments) Logged: yes (`Workspace content exported`). Admin token action, appears in audit log; event 'Workspace content exported'
- collection (bulk): `GET /v1/spaces/{space_id}/exports/{export_job_id}`. export status plus short-lived bot-scoped download_urls for the completed export Logged: unknown. Admin token actions are logged generally; specific status-poll event not named

### What to look for (analyst guidance)
- Organization token created/updated by an owner outside change control
- Scope widened to write-high-impact or export
- Admin bot actor running workspace exports or legal-hold exports not on schedule
- Admin bot revoking sessions or PATs en masse (possible attacker cover)
- Use after the token creator changed roles

### Sample query (Notion audit log UI filters)
List every admin action taken with a suspect organization token.

```
Organization event log; Actor = <admin bot name>; Date range = incident window
```

## Respond: how to revoke it


Organization console → Manage organization-level admin API tokens → delete/revoke the token; review audit log for actions with that admin bot as actor. Live access ends on revocation: yes. Help doc: any script using the token stops immediately. Admin tokens cannot be IP-restricted.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Expires automatically
- token format/prefix
- 'Organization token deleted' appears on the help page but not in the developer audit-log glossary
- log field names for actor/IP
- token expiry
- No whoami endpoint documented for the admin token (base URL https://api.notion.com/admin)
- Exact audit event names for legal-hold reads and export status polls
- Whether Notion IP address restrictions apply to internal connection tokens, PATs or public OAuth tokens (help page only describes user sign-in; admin tokens are excluded).
- Whether SAML SSO enforcement affects API tokens (not stated).
- Whether admins can set a maximum PAT lifetime (creators choose 7 days to 1 year; default 1 year).
- Whether internal connection tokens or OAuth tokens expire or can be force-rotated by admins.

## Sources
- [Admin APIs for Enterprise organizations](https://www.notion.com/help/admin-apis-for-enterprise-organizations) (retrieved 2026-10-12)
- [Workspace audit log in Notion](https://www.notion.com/help/audit-log) (retrieved 2026-10-12)
- [Audit log events - Notion Docs](https://developers.notion.com/compliance/audit-log-events) (retrieved 2026-10-12)
- [Admin API scopes](https://developers.notion.com/reference/admin/scopes) (retrieved 2026-10-12)
- [List personal access tokens in a workspace - Notion Docs](https://developers.notion.com/reference/admin/list-personal-access-tokens) (retrieved 2026-10-12)
- [List legal holds (Admin API)](https://developers.notion.com/reference/admin/list-legal-holds.md) (retrieved 2026-10-12)
- [Enqueue a workspace export (Admin API)](https://developers.notion.com/reference/admin/enqueue-space-export.md) (retrieved 2026-10-12)
- [Get workspace export status (Admin API)](https://developers.notion.com/reference/admin/get-space-export-status.md) (retrieved 2026-10-12)
- [Organization-level controls in Notion](https://www.notion.com/help/organization-level-controls) (retrieved 2026-10-13)
