# Twilio: API key (Main, Standard, Restricted)

`twilio-2` · API key / token · service. Key SID (SK...) and secret over HTTP Basic. Main = full access like Auth Token; Standard = all but /Accounts and Keys; Restricted = chosen permissions (up to 100).

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET https://iam.twilio.com/v1/Keys lists every API key in an account. Each subaccount must be queried separately. | GET https://iam.twilio.com/v1/Keys lists every API key in an account. Each subaccount must be queried separately. |
| Protect: Admin can block or require approval | Yes | Suspend or close subaccount | Suspend or close subaccount: POST https://api.twilio.com/2010-04-01/Accounts/{Sid}.json Status=suspended/closed |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No documented per-key IP restriction. |  |
| Protect: Expires automatically | Not available | No expiry documented |  |
| Detect: Usage appears in logs | Yes | resource_sid | Where: Monitor > Insights > Audit > Audit Events Log (actorSid not always visible; use API) · API: GET https://monitor.twilio.com/v1/Events?ActorSid=...  or ?ResourceSid=<SK...> (one filter field per request) · Command: twilio api:monitor:v1:events:list --resource-sid <SID> |
| Detect: Data reads appear in logs | Yes | recording.accessed | Where: Monitor > Insights > Audit > Audit Events Log; filter EventType recording.accessed · API: GET https://monitor.twilio.com/v1/Events?EventType=recording.accessed&StartDate=...&EndDate=... |
| Respond: Revocation ends active access | Yes | Also invalidates Access Tokens signed with it. | Delete the key in Console or DELETE https://iam.twilio.com/v1/Keys/{Sid}. |
| Respond: Stops working when user is removed | N/A | API keys belong to an account, not to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Restricted API key permissions** (Limit scope; all plans; default off). Key can call only selected endpoints/actions. Where: Console > API keys & auth tokens > Create API key > Restricted; POST https://iam.twilio.com/v1/Keys.
- **Suspend or close subaccount** (Disable; all plans; default unknown). Stops a subaccount; closed subaccounts are deleted after 30 days by default. Where: POST https://api.twilio.com/2010-04-01/Accounts/{Sid}.json Status=suspended|closed.

- Network: unknown (checked at unknown). No documented per-key IP restriction.
- Lifetime: No expiry documented. Renewal: Create a new key and delete the old one.
- Keyless option: not_verified. No doc statement on SSO/IdP effect.
- Conditions: Restricted keys only in US region per legacy console.

## Detect: what gets logged
- Token prefix: `SK`

### Logs
- Monitor Events: As above.

### Fields that identify the credential
- `resource_sid` (Monitor Events (account-api-keys.*)): Key SID on lifecycle events; whether API key appears as actor is not documented.

### Lifecycle events
- create: `account-api-keys.created` null
- modify: `account-api-keys.updated` null
- revoke: `account-api-keys.deleted` null

### Correlate on
`resource_sid`, `actor_sid`, `source_ip_address`

### API calls a holder can make, and whether they are logged
- collection (bulk): `GET https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`. Messages (if key type/permissions allow) Logged: unknown. 
- collection: `GET https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Recordings/{Sid}.mp3`. Call recording audio Logged: yes (`recording.accessed`). Monitor Events; 30 days, or 13 months with Administration, Security or Enterprise Edition. actor_sid is the Account SID, not the key.

### What to look for (analyst guidance)
- New Main keys
- Restricted key permissions widened

## Respond: how to revoke it
- Admin: **Delete API key**. Revokes REST access and invalidates Access Tokens signed with the key. Where: Console > API keys > Delete this key; DELETE https://iam.twilio.com/v1/Keys/{Sid}.

Delete the key in Console or DELETE https://iam.twilio.com/v1/Keys/{Sid}. Live access ends on revocation: yes. Also invalidates Access Tokens signed with it.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- IP allowlisting for REST API credentials (Auth Token, API keys, OAuth).
- Expiry settings for API keys and Auth Tokens.
- Whether org SSO enforcement or SCIM deactivation affects any API credential.
- Org-wide policy to block Main key or Auth Token use other than PKCV.
- Whether Monitor Events records read (GET) API calls or token issuance.
- Whether actor_sid identifies the API key SID (SK) or only the account.

## Sources
- [Requests to Twilio](https://www.twilio.com/docs/usage/requests-to-twilio) (retrieved 2026-10-14)
- [API keys overview](https://www.twilio.com/docs/iam/api-keys) (retrieved 2026-10-14)
- [Restricted API keys](https://www.twilio.com/docs/iam/api-keys/restricted-api-keys) (retrieved 2026-10-14)
- [REST API: Key Resource v1](https://www.twilio.com/docs/iam/api-keys/key-resource-v1) (retrieved 2026-10-14)
- [Create API keys in Twilio Console](https://www.twilio.com/docs/iam/api-keys/keys-in-console) (retrieved 2026-10-14)
- [Subaccounts](https://www.twilio.com/docs/iam/api/subaccounts) (retrieved 2026-10-14)
- [Managed users](https://www.twilio.com/docs/iam/organizations/managed-users) (retrieved 2026-10-14)
- [Monitor Events resource](https://www.twilio.com/docs/usage/monitor-events) (retrieved 2026-10-14)
- [Analyze: Investigate](https://www.twilio.com/docs/usage/fraud-response-guide/analyze) (retrieved 2026-10-14)
- [Contain: Immediate Countermeasures](https://www.twilio.com/docs/usage/fraud-response-guide/contain) (retrieved 2026-10-14)
- [Message resource](https://www.twilio.com/docs/messaging/api/message-resource) (retrieved 2026-10-14)
- [Recording resource](https://www.twilio.com/docs/voice/api/recording) (retrieved 2026-10-14)
- [New Audit Events for Voice Recordings and Transcriptions to log media access](https://www.twilio.com/en-us/changelog/new-audit-events-for-voice-recordings-and-transcriptions-to-log-media-access) (retrieved 2026-10-14)
- [REST API: Accounts](https://www.twilio.com/docs/iam/api/account) (retrieved 2026-10-14)
