# Twilio: Account SID + Auth Token

`twilio-1` · Basic credentials · service. Account SID as username and Auth Token as password (HTTP Basic). One primary token per account gives admin-level API access; parent tokens also reach subaccount v2010 resources.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Enforce Public Key Client Validation; Suspend or close subaccount | Enforce Public Key Client Validation: Console > Settings > Enforce Public Key Client Validation · Suspend or close subaccount: POST https://api.twilio.com/2010-04-01/Accounts/{Sid}.json Status=suspended/closed |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No documented IP allowlist for REST API credentials. |  |
| Protect: Expires automatically | Not available | No expiry documented; rotate manually |  |
| Detect: Usage appears in logs | Yes | actor_sid / actor_type, source_ip_address | Monitor Events (GET https://monitor.twilio.com/v1/Events): 30 days free; 13 months with Administration, Security or Enterprise Edition; pull into SIEM via API. · Email to owners/admins: Sent on each Auth Token change. |
| Detect: Data reads appear in logs | Yes | recording.accessed | Where: Monitor > Insights > Audit > Audit Events Log; filter EventType recording.accessed · API: GET https://monitor.twilio.com/v1/Events?EventType=recording.accessed&StartDate=...&EndDate=... |
| Respond: Revocation ends active access | Yes | Docs say apps using old token stop immediately; Functions may take ~1 minute to pick up change. | Create secondary token, then promote it to delete the old primary; repeat for affected subaccounts. |
| Respond: Stops working when user is removed | N/A | The Auth Token belongs to the account. Deleting a user does not delete the accounts they own or can access. |  |

## Protect: what an admin can configure

### Admin controls
- **Enforce Public Key Client Validation** (Disable; Enterprise Edition or Security Edition; default off). Makes the Auth Token invalid for REST requests; requests must be signed with a registered key. Where: Console > Settings > Enforce Public Key Client Validation.
- **Suspend or close subaccount** (Disable; all plans; default unknown). Stops a subaccount; closed subaccounts are deleted after 30 days by default. Where: POST https://api.twilio.com/2010-04-01/Accounts/{Sid}.json Status=suspended|closed.

- Network: unknown (checked at unknown). No documented IP allowlist for REST API credentials.
- Lifetime: No expiry documented; rotate manually. Renewal: Create secondary token, update apps, promote it (old primary deleted).
- Keyless option: not_verified. SSO enforcement applies to user login; docs do not say it affects Auth Token use.
- Conditions: PKCV: Enterprise/Security Edition.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Monitor Events (GET https://monitor.twilio.com/v1/Events): 30 days free; 13 months with Administration, Security or Enterprise Edition; pull into SIEM via API.
- Email to owners/admins: Sent on each Auth Token change.

### Fields that identify the credential
- `actor_sid / actor_type` (Monitor Events): source=api, actor_type=account, actor_sid=AC... when Account authenticated against the API.
- `source_ip_address` (Monitor Events): null

### Lifecycle events
- create: `account-auth-token.secondary-created` null
- rotate: `account-auth-token.promoted` null
- revoke: `account-auth-token.secondary-deleted` null
- modify: `account-auth-token.updated` null

### Correlate on
`account_sid`, `actor_sid`, `source_ip_address`

### API calls a holder can make, and whether they are logged
- recon (bulk): `GET https://api.twilio.com/2010-04-01/Accounts.json`. Account and subaccounts Logged: unknown. Monitor Events documents changes, reads not stated
- enumeration (bulk): `GET https://iam.twilio.com/v1/Keys`. API keys Logged: unknown. 
- collection (bulk): `GET https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`. Message history and bodies Logged: unknown. 
- discovery (bulk): `GET https://monitor.twilio.com/v1/Events`. Audit log Logged: unknown. 
- collection: `GET https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Recordings/{Sid}.mp3`. Call recording audio Logged: yes (`recording.accessed`). Monitor Events; 30 days, or 13 months with Administration, Security or Enterprise Edition. actor_sid is the Account SID, not the key.

### What to look for (analyst guidance)
- Changes with source=api from unfamiliar IPs
- New API keys or subaccounts created by account actor
- Secondary token created unexpectedly

## Respond: how to revoke it
- Admin: **Auth Token rotation (secondary + promote)**. Promoting the secondary token deletes the old primary. Where: Console > API keys & tokens > Auth Tokens; POST https://accounts.twilio.com/v1/AuthTokens/Secondary, POST https://accounts.twilio.com/v1/AuthTokens/Promote.

Create secondary token, then promote it to delete the old primary; repeat for affected subaccounts. Live access ends on revocation: yes. Docs say apps using old token stop immediately; Functions may take ~1 minute to pick up change.

## No vendor documentation found
- Admin can list all of them
- SSO and MFA rules apply
- IP restriction
- Whether individual REST reads are logged
- Whether reads are logged
- IP allowlisting for REST API credentials (Auth Token, API keys, OAuth).
- Expiry settings for API keys and Auth Tokens.
- Whether org SSO enforcement or SCIM deactivation affects any API credential.
- Org-wide policy to block Main key or Auth Token use other than PKCV.
- Whether Monitor Events records read (GET) API calls or token issuance.
- Whether actor_sid identifies the API key SID (SK) or only the account.

## Sources
- [Requests to Twilio](https://www.twilio.com/docs/usage/requests-to-twilio) (retrieved 2026-10-14)
- [Contain: Immediate Countermeasures](https://www.twilio.com/docs/usage/fraud-response-guide/contain) (retrieved 2026-10-14)
- [Subaccounts](https://www.twilio.com/docs/iam/api/subaccounts) (retrieved 2026-10-14)
- [Single Sign On](https://www.twilio.com/docs/iam/single-sign-on) (retrieved 2026-10-14)
- [REST API: Auth Token](https://www.twilio.com/docs/iam/api/authtoken) (retrieved 2026-10-14)
- [REST API: Secondary Auth Token](https://www.twilio.com/docs/iam/api/secondary_authtoken) (retrieved 2026-10-14)
- [Get Started with Public Key Client Validation](https://www.twilio.com/docs/iam/pkcv) (retrieved 2026-10-14)
- [Managed users](https://www.twilio.com/docs/iam/organizations/managed-users) (retrieved 2026-10-14)
- [Monitor Events resource](https://www.twilio.com/docs/usage/monitor-events) (retrieved 2026-10-14)
- [Analyze: Investigate](https://www.twilio.com/docs/usage/fraud-response-guide/analyze) (retrieved 2026-10-14)
- [REST API: Accounts](https://www.twilio.com/docs/iam/api/account) (retrieved 2026-10-14)
- [Message resource](https://www.twilio.com/docs/messaging/api/message-resource) (retrieved 2026-10-14)
- [REST API: Key Resource v1](https://www.twilio.com/docs/iam/api-keys/key-resource-v1) (retrieved 2026-10-14)
- [Recording resource](https://www.twilio.com/docs/voice/api/recording) (retrieved 2026-10-14)
- [New Audit Events for Voice Recordings and Transcriptions to log media access](https://www.twilio.com/en-us/changelog/new-audit-events-for-voice-recordings-and-transcriptions-to-log-media-access) (retrieved 2026-10-14)
- [Public Key Client Validation Quickstart](https://www.twilio.com/docs/iam/pkcv/quickstart) (retrieved 2026-10-14)
