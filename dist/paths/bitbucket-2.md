# Bitbucket Cloud: App passwords (deprecated)

`bitbucket-2` · Basic credentials · person · legacy. Per-user password used with the Bitbucket username for REST API and Git over HTTPS. Fully deprecated on 28 July 2026; app-password requests now fail with 401 (API) or 410 (Git).

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Same Premium private-content allowlist as other credentials. | Where: Workspace settings > Access management > Access controls > Restrict access to certain IP addresses > Add or remove IP addresses > Update (Premium) |
| Protect: Expires automatically | Not available | Retired platform-wide 2026-07-28 |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Bitbucket workspace audit log: Workspace settings > Security > Audit log; 30 days. |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | Yes | Platform-wide removal. | Where: None needed: app passwords fully deprecated on Jul 28, 2026 |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
No docs found.

- Network: conditional (checked at unknown). Same Premium private-content allowlist as other credentials.
- Lifetime: Retired platform-wide 2026-07-28. Renewal: Replace with an API token.
- Keyless option: not_verified. Retired credential type; docs reviewed do not address SSO interaction.
- Conditions: Audit retention 30 days, so historic events are likely aged out.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Bitbucket workspace audit log: Workspace settings > Security > Audit log; 30 days.

### Fields that identify the credential
No docs found.

### Lifecycle events
- create: `App password added` User category.
- revoke: `App password removed` User category.

### Correlate on
`Bitbucket username`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Any 401 on API or 410 on Git from legacy integrations indicates leftover app-password use

## Respond: how to revoke it


None needed; Bitbucket rejects app passwords since 2026-07-28. Live access ends on revocation: yes. Platform-wide removal.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- Data reads appear in logs
- Stops working when user is removed
- Retired; calls fail with 401/410
- Whether the workspace IP allowlist is enforced on REST API calls (docs only mention viewing content and Git clone/push/pull).
- Whether API tokens or OAuth tokens are checked against IdP SSO or conditional access at use time.
- Whether the workspace audit log records access token creation, rotation or revocation (no such events listed).
- Lifetime of the Pipelines OIDC token.
- OAuth access token lifetime: developer docs say 1 hour, support docs say 2 hours.
- Any admin approval workflow for users authorizing third-party OAuth consumers.

## Sources
- [Bitbucket Cloud changelog](https://developer.atlassian.com/cloud/bitbucket/changelog/) (retrieved 2026-10-14)
- [Control access to private content in a workspace](https://support.atlassian.com/bitbucket-cloud/docs/control-access-to-private-content-in-a-workspace/) (retrieved 2026-10-14)
- [API tokens | Bitbucket Cloud](https://support.atlassian.com/bitbucket-cloud/docs/api-tokens/) (retrieved 2026-10-14)
- [Bitbucket Cloud audit log events](https://support.atlassian.com/bitbucket-cloud/kb/bitbucket-cloud-audit-log-events/) (retrieved 2026-10-14)
- [Control access to your private content](https://support.atlassian.com/bitbucket-cloud/docs/control-access-to-your-private-content/) (retrieved 2026-10-14)
