# CircleCI: Personal API tokens (incl. tokens from OAuth 2.0 Dynamic Client Registration)

`circleci-1` · Personal access token · person. User-created token sent in the Circle-Token header or as Bearer to API v1/v2/v3. Web-created tokens have the user's full read/write access; tokens issued through the OAuth DCR flow are scoped Read/Write/Admin.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Each user sees and revokes only their own tokens on User Settings > Personal API Tokens; no admin-wide listing is documented. | Each user sees and revokes only their own tokens on User Settings > Personal API Tokens; no admin-wide listing is documented. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Yes | In an SSO-enabled org, a personal API token must be SSO-authenticated before it can reach the org's resources; SSO needs the Scale plan. | Where: Org > Single sign-on (SSO) > Enforce SSO for all users; each user: User Settings > Personal API Tokens > pick the org in the SSO column |
| Protect: IP restriction | No docs found | Docs describe only outbound job IP ranges; no inbound API allowlist documented. |  |
| Protect: Expires automatically | Yes | User-set expiry up to 1 year; DCR tokens 90 days | Personal API token expiry: User Settings > Personal API Tokens |
| Detect: Usage appears in logs | Yes | actor | Where: Org > Security > Audit Logs > Request audit logs > Download logs (CSV); filter on actor. Scale: Stream audit logs to S3 |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | No admin-side revoke documented. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Personal API token expiry** (Limit lifetime; all plans; default on). Every web-created token has an expiry of at most one year; DCR tokens last 90 days. Where: User Settings > Personal API Tokens.
- **SSO authentication for personal API tokens** (Require SSO; Scale; default on). Tokens must be SSO-authorized per org to reach SSO-protected org resources. Where: User Settings > Personal API Tokens > SSO column.

- Network: unknown (checked at unknown). Docs describe only outbound job IP ranges; no inbound API allowlist documented.
- Lifetime: User-set expiry up to 1 year; DCR tokens 90 days. Renewal: Delete and create a new token; email reminders before expiry.
- Keyless option: limited. In SSO-enabled orgs (Scale) a token must be SSO-authorized per org, and that option needs an active SSO session. Docs do not say whether the token stops when the SSO session ends.
- Conditions: No documented admin view, revoke or block for members' personal tokens.

## Detect: what gets logged
- Token prefix: not established

### Logs
- CircleCI audit logs: Org admin requests CSV for any 30-day window in last 12 months (Free 1/day, paid 3/day); Scale can stream to S3.

### Fields that identify the credential
- `actor` (audit log): User id/type/name; no token ID documented.

### Lifecycle events
- use: `build.create` Pipeline/job creation by the actor.
- use: `context.secrets.accessed` A job used context secrets.

### Correlate on
`actor.id`, `target.id`, `occurred_at`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/v2/me`. token owner Logged: unknown. Audit logs are control-plane only.
- discovery: `GET /api/v2/me/collaborations`. orgs the user belongs to Logged: unknown. 
- enumeration (bulk): `GET /api/v2/context?owner-id={org-id}`. context names Logged: unknown. 
- enumeration (bulk): `GET /api/v2/project/{project-slug}/envvar`. masked env vars (last 4 chars) Logged: unknown. 
- collection (bulk): `GET /api/v2/project/{project-slug}/pipeline`. pipeline history Logged: unknown. 

### What to look for (analyst guidance)
- Pipelines triggered via API by a user outside normal hours
- context.secrets.accessed from unexpected projects or branches
- New env vars or project.settings.update by a token owner

## Respond: how to revoke it
- Admin: **Delete personal API token**. User deletes a token from the Remove column. Where: User Settings > Personal API Tokens.

User deletes and recreates the token; remove the user from the org/IdP; block new work and rotate secrets the user could reach. Live access ends on revocation: unknown. No admin-side revoke documented.

## No vendor documentation found
- Admin can block or require approval
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- Token creation/deletion event names
- API read logging
- Whether any API read is logged
- Any org-admin setting to block, list or revoke members' personal API tokens.
- Any org setting to disable OAuth Dynamic Client Registration tokens.
- Any inbound IP allowlist for the CircleCI API or web app.
- Whether personal API token create/delete or API reads appear in audit logs (not in the published event list).
- Whether an SSO-authorized token stops working when the IdP session ends or the user is removed from the IdP.
- Project API token expiry.

## Sources
- [Managing API tokens](https://circleci.com/docs/guides/toolkit/managing-api-tokens/) (retrieved 2026-10-14)
- [OAuth 2.0 API access with Dynamic Client Registration](https://circleci.com/docs/guides/toolkit/oauth-dynamic-client-registration/) (retrieved 2026-10-14)
- [CircleCI API v2 OpenAPI](https://circleci.com/api/v2/openapi.json) (retrieved 2026-10-14)
- [Single sign-on (SSO) overview](https://circleci.com/docs/guides/permissions-authentication/sso-overview/) (retrieved 2026-10-14)
- [Restrict your pipeline traffic to specific IP ranges](https://circleci.com/docs/guides/security/ip-ranges/) (retrieved 2026-10-14)
- [SSO setup](https://circleci.com/docs/guides/permissions-authentication/set-up-sso/) (retrieved 2026-10-14)
- [Audit logs](https://circleci.com/docs/guides/security/audit-logs/) (retrieved 2026-10-14)
- [Analyze pipelines during an incident](https://circleci.com/docs/guides/orchestrate/analyze-pipelines-during-an-incident/) (retrieved 2026-10-14)
- [Pause or stop pipelines during an incident](https://circleci.com/docs/guides/orchestrate/pause-pipelines-during-an-incident/) (retrieved 2026-10-14)
