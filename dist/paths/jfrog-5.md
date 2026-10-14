# JFrog: MyJFrog API token

`jfrog-5` · API key / token · person. Account-level token for the MyJFrog portal API (manage IP allowlist, PrivateLink, custom domains, servers). Only Primary Admins can generate it.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | MyJFrog API Token page; all Admins and Technical Members can view API tokens. | MyJFrog API Token page; all Admins and Technical Members can view API tokens. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Docs do not say whether the JPD allowlist applies to the MyJFrog API. |  |
| Protect: Expires automatically | Yes | 1 year | Where: MyJFrog > profile icon > API Token (fixed one-year expiry; expiry notifications in Notification Center) |
| Detect: Usage appears in logs | Yes | Triggered by | Where: MyJFrog > Audit Logs; filter by Events/date range and search, check Triggered by |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | Yes | Old token expires on regeneration. | Where: MyJFrog > profile icon > API Token > Regenerate Token |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
No docs found.

- Network: unknown (checked at unknown). Docs do not say whether the JPD allowlist applies to the MyJFrog API.
- Lifetime: 1 year. Renewal: Regenerate; old token stops working.
- Keyless option: not_verified. Not documented.
- Conditions: Enterprise X or Enterprise+.

## Detect: what gets logged
- Token prefix: not established

### Logs
- MyJFrog Audit Logs: Primary Admins/Admins; 1 year retention; records attempted actions.

### Fields that identify the credential
- `Triggered by` (MyJFrog Audit Logs): 

### Lifecycle events
No docs found.

### Correlate on
`Triggered by`, `Event Time`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- IP/CIDR Allowlist changes via API

## Respond: how to revoke it
- Admin: **Regenerate MyJFrog API token**. Regenerating invalidates the previous token. Where: MyJFrog > profile > API Token > Regenerate Token.

Regenerate the token. Live access ends on revocation: yes. Old token expires on regeneration.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Stops working when user is removed
- Token generation event name
- MyJFrog API endpoints and logging of reads
- Whether SaaS customers can change token.max-expiry, token.allow-refreshable or revocable-expiry-threshold (documented only as Access YAML settings).
- A setting to stop non-admin users creating identity tokens.
- Default and maximum lifetime of UI-generated identity tokens.
- Whether the IP allowlist covers the MyJFrog portal API.
- Whether MyJFrog audit logs record API token generation (event names not listed).
- Reference token length: Access Tokens page says 128 characters, Identity Tokens page says 64.

## Sources
- [Generate a Token in MyJFrog](https://docs.jfrog.com/administration/docs/generate-a-token-in-myjfrog) (retrieved 2026-10-14)
- [Manage Audit Logs (MyJFrog)](https://docs.jfrog.com/administration/docs/manage-audit-logs) (retrieved 2026-10-14)
