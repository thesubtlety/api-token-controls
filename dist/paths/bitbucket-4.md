# Bitbucket Cloud: OAuth consumers (OAuth 2.0)

`bitbucket-4` · OAuth · person or service. Workspace-registered consumer (key + secret). Authorization code grant acts as the authorizing user; client credentials grant acts as the consumer owner. Access tokens are Bearer tokens to api.bitbucket.org and can clone via x-token-auth.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Workspace settings > OAuth consumers lists consumers created in that workspace; no list of issued tokens or user authorizations. | Workspace settings > OAuth consumers lists consumers created in that workspace; no list of issued tokens or user authorizations. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional (requires Premium) | Premium private-content allowlist; API enforcement not documented. | Restrict access to certain IP addresses: Workspace settings > Access controls > Restrict access to certain IP addresses |
| Protect: Expires automatically | Yes | Access token 1h (support docs say 2h); refresh token expires after 3 months unused | API: Access token lifetime fixed at 1 hour; renew with POST https://bitbucket.org/site/oauth2/access_token grant_type=refresh_token |
| Detect: Usage appears in logs | Yes | application (consumer) name | Where: Workspace settings > Security: Audit log; filter events 'User account access granted to an application' / 'revoked' |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | Yes | Deletion removes all existing tokens linked to the consumer. | Delete the consumer in Workspace settings > OAuth consumers (kills all its tokens); or rotate secret. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Restrict access to certain IP addresses** (Limit network; Premium; default off). Only allowlisted IPs can view private content or clone/push/pull private repos. Where: Workspace settings > Access controls > Restrict access to certain IP addresses.

- Network: conditional (checked at unknown). Premium private-content allowlist; API enforcement not documented.
- Lifetime: Access token 1h (support docs say 2h); refresh token expires after 3 months unused. Renewal: Refresh without user interaction; client credentials can mint new tokens with the secret.
- Keyless option: not_verified. Docs do not say whether IdP session policies are re-checked on refresh.
- Conditions: No documented admin approval flow for user authorizations of third-party consumers.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Bitbucket workspace audit log: 30 days; user authorization of applications.

### Fields that identify the credential
- `application (consumer) name` (workspace audit log): Field names not documented.

### Lifecycle events
- create: `User account access granted to an application` User category.
- revoke: `User account access to an application revoked` User category.

### Correlate on
`consumer key`, `user account`

### API calls a holder can make, and whether they are logged
- recon: `GET /2.0/user`. authorizing user or consumer owner Logged: unknown. 
- enumeration (bulk): `GET /2.0/repositories/{workspace}`. repositories Logged: unknown. 

### What to look for (analyst guidance)
- New consumer with broad scopes
- Client credentials consumer owned by an admin

## Respond: how to revoke it
- Admin: **Delete OAuth consumer**. Deleting the consumer removes all tokens issued to it. Where: Workspace settings > OAuth consumers > Delete.

Delete the consumer in Workspace settings > OAuth consumers (kills all its tokens); or rotate secret. Live access ends on revocation: yes. Deletion removes all existing tokens linked to the consumer.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Data reads appear in logs
- Stops working when user is removed
- Whether consumer creation/deletion is audited
- Whether the workspace IP allowlist is enforced on REST API calls (docs only mention viewing content and Git clone/push/pull).
- Whether API tokens or OAuth tokens are checked against IdP SSO or conditional access at use time.
- Whether the workspace audit log records access token creation, rotation or revocation (no such events listed).
- Lifetime of the Pipelines OIDC token.
- OAuth access token lifetime: developer docs say 1 hour, support docs say 2 hours.
- Any admin approval workflow for users authorizing third-party OAuth consumers.

## Sources
- [The Bitbucket Cloud REST API](https://developer.atlassian.com/cloud/bitbucket/rest/intro/) (retrieved 2026-10-14)
- [Use OAuth on Bitbucket Cloud](https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/) (retrieved 2026-10-14)
- [Control access to private content in a workspace](https://support.atlassian.com/bitbucket-cloud/docs/control-access-to-private-content-in-a-workspace/) (retrieved 2026-10-14)
- [Bitbucket Cloud REST API: OAuth 2.0 refresh tokens](https://developer.atlassian.com/cloud/bitbucket/rest/intro/#oauth-2-0) (retrieved 2026-10-14)
- [Bitbucket Cloud audit log events](https://support.atlassian.com/bitbucket-cloud/kb/bitbucket-cloud-audit-log-events/) (retrieved 2026-10-14)
- [Bitbucket REST API - Users](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-users/) (retrieved 2026-10-14)
- [Bitbucket REST API - Repositories](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-repositories/) (retrieved 2026-10-14)
