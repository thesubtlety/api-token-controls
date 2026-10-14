# Twilio: Account-level OAuth app (Client Credentials)

`twilio-3` · OAuth · service. Client ID and secret exchanged at POST https://oauth.twilio.com/v2/token for a scoped bearer access token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Each account lists its apps under Settings > Account settings > OAuth applications; there is no cross-account view. | Each account lists its apps under Settings > Account settings > OAuth applications; there is no cross-account view. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | Yes | Token 1 min to 30 days, default 1 h | Token expiration time: OAuth app > Access settings > Token expiration time |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Where: Monitor > Insights > Audit > Audit Events Log · API: GET https://monitor.twilio.com/v1/Events?StartDate=...&EndDate=...; inspect source=api, actor_type, actor_sid · Command: twilio api:monitor:v1:events:list --start-date <ISO> --end-date <ISO> |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | Yes | Invalidates previous credentials and access tokens. | Rotate secret with grace period 0, or delete the app. |
| Respond: Stops working when user is removed | N/A | Client Credentials apps authenticate as themselves, not on behalf of a user. |  |

## Protect: what an admin can configure

### Admin controls
- **OAuth scopes** (Limit scope; all plans; default varies). Tokens limited to selected APIs. Where: OAuth app > Scopes & permissions.
- **Token expiration time** (Limit lifetime; all plans; default on). Sets access token lifetime from 1 minute to 30 days. Where: OAuth app > Access settings > Token expiration time.

- Network: unknown (checked at unknown). Not documented.
- Lifetime: Token 1 min to 30 days, default 1 h. Renewal: Request a new token with client credentials; rotate secret with 0-30 day grace.
- Keyless option: not_verified. App keeps working if the creating user is removed.
- Conditions: Works only for the account it was created in.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Monitor Events: OAuth app event types not listed in docs.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`client_id`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Long token expiration (days)
- Apps whose creator left

## Respond: how to revoke it
- Admin: **Rotate secret (grace period 0) / delete OAuth app**. Invalidates old credentials and issued access tokens. Where: OAuth app > Credentials > Rotate secret; OAuth apps > Delete.

Rotate secret with grace period 0, or delete the app. Live access ends on revocation: yes. Invalidates previous credentials and access tokens.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Event names for OAuth app create/rotate/delete
- Not researched
- IP allowlisting for REST API credentials (Auth Token, API keys, OAuth).
- Expiry settings for API keys and Auth Tokens.
- Whether org SSO enforcement or SCIM deactivation affects any API credential.
- Org-wide policy to block Main key or Auth Token use other than PKCV.
- Whether Monitor Events records read (GET) API calls or token issuance.
- Whether actor_sid identifies the API key SID (SK) or only the account.

## Sources
- [OAuth apps](https://www.twilio.com/docs/iam/oauth-apps/overview) (retrieved 2026-10-14)
- [Account-level OAuth apps](https://www.twilio.com/docs/iam/oauth-apps/account-oauth-apps) (retrieved 2026-10-14)
- [OAuth Token API](https://www.twilio.com/docs/iam/oauth-apps/oauth-access-token) (retrieved 2026-10-14)
- [OAuth apps FAQs](https://www.twilio.com/docs/iam/oauth-apps/faqs) (retrieved 2026-10-14)
- [Monitor Events resource](https://www.twilio.com/docs/usage/monitor-events) (retrieved 2026-10-14)
- [Analyze: Investigate](https://www.twilio.com/docs/usage/fraud-response-guide/analyze) (retrieved 2026-10-14)
