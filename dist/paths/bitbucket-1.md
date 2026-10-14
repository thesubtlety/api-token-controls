# Bitbucket Cloud: API tokens (Atlassian account API tokens with Bitbucket scopes)

`bitbucket-1` · Personal access token · person. User creates a scoped token in Atlassian account security settings. Sent as Basic auth (Atlassian email + token) or Bearer to the REST API, or as the password for Git over HTTPS.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Atlassian Administration > Insights > API token activity lists API tokens of managed accounts only; not confirmed to include Bitbucket-scoped tokens. | Atlassian Administration > Insights > API token activity lists API tokens of managed accounts only; not confirmed to include Bitbucket-scoped tokens. |
| Protect: Admin can block or require approval | Not available | Org admins cannot block managed users from creating API tokens for Bitbucket. |  |
| Protect: SSO and MFA rules apply | Not available | Docs say API tokens don't require two-step verification, and org API token restrictions do not extend to Bitbucket. |  |
| Protect: IP restriction | Conditional (requires Premium) | Premium workspace IP allowlist covers private repos, wikis, issue trackers and snippets and blocks clone/push/pull; docs do not state whether REST API calls with tokens are checked, and metadata is not necessarily restricted. | Restrict access to certain IP addresses: Workspace settings > Access controls > Restrict access to certain IP addresses |
| Protect: Expires automatically | Yes | 1 to 365 days, default 1 year | Where: Account settings > Security > Create and manage API tokens > Create API token with scopes > set expiry date |
| Detect: Usage appears in logs | Yes | token name / created date / last used | Atlassian organization audit log: Insights > Audit log; up to 180 days; token events tied to managed accounts. Guard needed for Bitbucket enterprise-level events. · API token activity (Insights): Lists managed users' tokens with created, expiry and last used; CSV export. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Yes | Revoked tokens no longer work. | Revoke in API token activity (org admin) or Atlassian account > Security (user); also deactivate the account if compromised. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Access token scopes** (Limit scope; all plans; default varies). Scopes and resource container are fixed at creation. Where: Token creation dialog.
- **Restrict access to certain IP addresses** (Limit network; Premium; default off). Only allowlisted IPs can view private content or clone/push/pull private repos. Where: Workspace settings > Access controls > Restrict access to certain IP addresses.

### Not available (vendor states)
- Org admins cannot block managed users from creating API tokens for Bitbucket.

- Network: conditional (checked at unknown). Premium workspace IP allowlist covers private repos, wikis, issue trackers and snippets and blocks clone/push/pull; docs do not state whether REST API calls with tokens are checked, and metadata is not necessarily restricted.
- Lifetime: 1 to 365 days, default 1 year. Renewal: Create a new token; tokens cannot be edited or extended.
- Keyless option: not_verified. Docs say API tokens do not require 2SV; they do not say whether IdP SSO or conditional access is checked on token use. The org-level 'limit API token creation' policy does not apply to Bitbucket.
- Conditions: Admin view/revoke only for managed accounts (verified domain).

## Detect: what gets logged
- Token prefix: not established

### Logs
- Atlassian organization audit log: Insights > Audit log; up to 180 days; token events tied to managed accounts. Guard needed for Bitbucket enterprise-level events.
- API token activity (Insights): Lists managed users' tokens with created, expiry and last used; CSV export.

### Fields that identify the credential
- `token name / created date / last used` (API token activity): Export includes date last used.

### Lifecycle events
- create: `Created API token` Org audit log.
- revoke: `Revoked API token` Org audit log.
- other: `Exported API tokens` Admin export of token inventory.

### Correlate on
`Atlassian account ID`, `token name`, `last used date`

### API calls a holder can make, and whether they are logged
- recon: `GET /2.0/user`. current user identity Logged: unknown. No documented API request log.
- discovery: `GET /2.0/user/workspaces`. workspaces and admin flag Logged: unknown. 
- enumeration (bulk): `GET /2.0/repositories/{workspace}`. all repositories in workspace Logged: unknown. Audit log excludes repo/commit activity.
- collection (bulk): `git clone https://bitbucket.org/{workspace}/{repo}.git`. full source Logged: unknown. 

### What to look for (analyst guidance)
- Token created then used from unfamiliar automation shortly after
- Tokens near 1-year max on high-privilege accounts
- Last-used dates on tokens of departed users

## Respond: how to revoke it
- Admin: **Revoke API token (user)**. User revokes own token; it stops working immediately. Where: Atlassian account > Security > API tokens > Revoke.
- Admin: **Revoke user API tokens (API token activity)**. Org admin revokes one or many managed users' API tokens. Where: Atlassian Administration > Insights > API token activity > Revoke; or Delete API token API.

Revoke in API token activity (org admin) or Atlassian account > Security (user); also deactivate the account if compromised. Live access ends on revocation: yes. Revoked tokens no longer work.

## No vendor documentation found
- Data reads appear in logs
- Stops working when user is removed
- Per-request API call logging for Bitbucket REST use
- Source IP of token use
- Whether any REST read is logged
- Whether the workspace IP allowlist is enforced on REST API calls (docs only mention viewing content and Git clone/push/pull).
- Whether API tokens or OAuth tokens are checked against IdP SSO or conditional access at use time.
- Whether the workspace audit log records access token creation, rotation or revocation (no such events listed).
- Lifetime of the Pipelines OIDC token.
- OAuth access token lifetime: developer docs say 1 hour, support docs say 2 hours.
- Any admin approval workflow for users authorizing third-party OAuth consumers.

## Sources
- [API tokens | Bitbucket Cloud](https://support.atlassian.com/bitbucket-cloud/docs/api-tokens/) (retrieved 2026-10-14)
- [Using API tokens | Bitbucket Cloud](https://support.atlassian.com/bitbucket-cloud/docs/using-api-tokens/) (retrieved 2026-10-14)
- [Control access to private content in a workspace](https://support.atlassian.com/bitbucket-cloud/docs/control-access-to-private-content-in-a-workspace/) (retrieved 2026-10-14)
- [Manage API tokens for your Atlassian account](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/) (retrieved 2026-10-09)
- [Revoke user API tokens](https://support.atlassian.com/organization-administration/docs/revoke-user-api-tokens/) (retrieved 2026-10-14)
- [View API token activity](https://support.atlassian.com/organization-administration/docs/view-user-api-tokens/) (retrieved 2026-10-14)
- [Create an API token](https://support.atlassian.com/bitbucket-cloud/docs/create-an-api-token/) (retrieved 2026-10-14)
- [Audit log activities database](https://support.atlassian.com/security-and-access-policies/docs/audit-log-activities-database/) (retrieved 2026-10-12)
- [Bitbucket Cloud audit log events](https://support.atlassian.com/bitbucket-cloud/kb/bitbucket-cloud-audit-log-events/) (retrieved 2026-10-14)
- [Bitbucket REST API - Users](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-users/) (retrieved 2026-10-14)
- [Bitbucket REST API - Workspaces](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-workspaces/) (retrieved 2026-10-14)
- [Bitbucket REST API - Repositories](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-repositories/) (retrieved 2026-10-14)
- [Access tokens | Bitbucket Cloud](https://support.atlassian.com/bitbucket-cloud/docs/access-tokens/) (retrieved 2026-10-14)
