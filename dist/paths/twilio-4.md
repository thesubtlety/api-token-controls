# Twilio: Organization OAuth app (Client Credentials / Authorization Code)

`twilio-4` · OAuth · person or service. Only way to call organization-level APIs. Client credentials for machines; authorization code with refresh token on behalf of a user.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Settings > Organization settings > Organization API access lists all organization OAuth apps. | Settings > Organization settings > Organization API access lists all organization OAuth apps. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Not available | The Authorization Code consent page does not support SSO login; docs say to use an org admin whose SSO is deactivated. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | Yes | Token 1 min to 30 days, default 1 h | Token expiration time: OAuth app > Access settings > Token expiration time |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Where: Monitor > Insights > Audit > Audit Events Log · API: GET https://monitor.twilio.com/v1/Events?StartDate=...&EndDate=...; inspect source=api, actor_type, actor_sid · Command: twilio api:monitor:v1:events:list --start-date <ISO> --end-date <ISO> |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | Yes | Delete the org OAuth app or rotate its secret with grace 0. | Delete the org OAuth app or rotate its secret with grace 0. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **OAuth scopes** (Limit scope; all plans; default varies). Tokens limited to selected APIs. Where: OAuth app > Scopes & permissions.
- **Token expiration time** (Limit lifetime; all plans; default on). Sets access token lifetime from 1 minute to 30 days. Where: OAuth app > Access settings > Token expiration time.

- Network: unknown (checked at unknown). Not documented.
- Lifetime: Token 1 min to 30 days, default 1 h. Renewal: Authorization code apps use a refresh token; client credentials apps re-request.
- Keyless option: not_verified. Authorization code flow uses the user's Twilio sign-in; effect of SSO on refresh tokens not documented.
- Conditions: US1 only.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Monitor Events: Org-level coverage not documented.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`client_id`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- New org OAuth apps with broad scopes

## Respond: how to revoke it
- Admin: **Rotate secret (grace period 0) / delete OAuth app**. Invalidates old credentials and issued access tokens. Where: OAuth app > Credentials > Rotate secret; OAuth apps > Delete.

Delete the org OAuth app or rotate its secret with grace 0. Live access ends on revocation: yes. null

## No vendor documentation found
- Admin can block or require approval
- IP restriction
- Data reads appear in logs
- Stops working when user is removed
- Org audit log for OAuth apps
- Not researched
- IP allowlisting for REST API credentials (Auth Token, API keys, OAuth).
- Expiry settings for API keys and Auth Tokens.
- Whether org SSO enforcement or SCIM deactivation affects any API credential.
- Org-wide policy to block Main key or Auth Token use other than PKCV.
- Whether Monitor Events records read (GET) API calls or token issuance.
- Whether actor_sid identifies the API key SID (SK) or only the account.

## Sources
- [Organization OAuth apps](https://www.twilio.com/docs/iam/oauth-apps/org-oauth-apps) (retrieved 2026-10-14)
- [OAuth apps](https://www.twilio.com/docs/iam/oauth-apps/overview) (retrieved 2026-10-14)
- [OAuth apps FAQs](https://www.twilio.com/docs/iam/oauth-apps/faqs) (retrieved 2026-10-14)
- [Monitor Events resource](https://www.twilio.com/docs/usage/monitor-events) (retrieved 2026-10-14)
- [Analyze: Investigate](https://www.twilio.com/docs/usage/fraud-response-guide/analyze) (retrieved 2026-10-14)
- [Account-level OAuth apps](https://www.twilio.com/docs/iam/oauth-apps/account-oauth-apps) (retrieved 2026-10-14)
