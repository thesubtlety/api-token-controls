# Twilio: Public Key Client Validation (signed request JWT)

`twilio-5` · Signed JWT · service. Each request carries a JWT signed with the customer's RSA private key (kid = public key CredentialSid, iss = API key SID) plus API key credentials. When enforced, Auth Token alone is rejected for REST.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | GET https://accounts.twilio.com/v1/Credentials/PublicKeys lists public key credentials, one account at a time. | GET https://accounts.twilio.com/v1/Credentials/PublicKeys lists public key credentials, one account at a time. |
| Protect: Admin can block or require approval | Not available | PKCV cannot be enforced on accounts that use Flex, Studio or TaskRouter, so the Auth Token stays valid there. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | Yes | Per-request JWT, max 300 s | API: Set the exp claim in the signed request JWT; max exp - nbf is 300 s |
| Detect: Usage appears in logs | Yes | resource_sid (CR...) | Where: Monitor > Insights > Audit > Audit Events Log · API: GET https://monitor.twilio.com/v1/Events?ResourceSid=<CR...> (one filter field per request) · Command: twilio api:monitor:v1:events:list --resource-sid <CR...> |
| Detect: Data reads appear in logs | Yes | recording.accessed | Where: Monitor > Insights > Audit > Audit Events Log; filter EventType recording.accessed · API: GET https://monitor.twilio.com/v1/Events?EventType=recording.accessed&StartDate=...&EndDate=... |
| Respond: Revocation ends active access | Yes | Deleting the API key used as iss revokes REST API authentication. Docs do not separately describe deleting the public key credential. | Delete the public key credential and the API key used as iss. |
| Respond: Stops working when user is removed | N/A | Signed requests use an account's API key and public key credential, which belong to the account, not a user. |  |

## Protect: what an admin can configure

### Admin controls
No docs found.

### Not available (vendor states)
- PKCV cannot be enforced on accounts that use Flex, Studio or TaskRouter, so the Auth Token stays valid there.

- Network: unknown (checked at unknown). Not documented.
- Lifetime: Per-request JWT, max 300 s. Renewal: New JWT per request; rotate key pairs via Credentials PublicKeys.
- Keyless option: not_applicable. Request signing control.
- Conditions: Enterprise or Security Edition.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Monitor Events: null

### Fields that identify the credential
- `resource_sid (CR...)` (Monitor Events (account-credentials.*)): null

### Lifecycle events
- create: `account-credentials.created` Assumed to cover public key credentials; mapping not stated
- revoke: `account-credentials.deleted` null

### Correlate on
`kid`, `iss`

### API calls a holder can make, and whether they are logged
- collection: `GET https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Recordings/{Sid}.mp3`. Call recording audio Logged: yes (`recording.accessed`). Monitor Events; 30 days, or 13 months with Administration, Security or Enterprise Edition. actor_sid is the Account SID, not the key.

### What to look for (analyst guidance)
- New public key uploaded
- Enforcement turned off

## Respond: how to revoke it


Delete the public key credential and the API key used as iss. Live access ends on revocation: yes. Deleting the API key used as iss revokes REST API authentication. Docs do not separately describe deleting the public key credential.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Event for enforcement toggle
- IP allowlisting for REST API credentials (Auth Token, API keys, OAuth).
- Expiry settings for API keys and Auth Tokens.
- Whether org SSO enforcement or SCIM deactivation affects any API credential.
- Org-wide policy to block Main key or Auth Token use other than PKCV.
- Whether Monitor Events records read (GET) API calls or token issuance.
- Whether actor_sid identifies the API key SID (SK) or only the account.

## Sources
- [Get Started with Public Key Client Validation](https://www.twilio.com/docs/iam/pkcv) (retrieved 2026-10-14)
- [Public Key Client Validation Quickstart](https://www.twilio.com/docs/iam/pkcv/quickstart) (retrieved 2026-10-14)
- [REST API: Key Resource v1](https://www.twilio.com/docs/iam/api-keys/key-resource-v1) (retrieved 2026-10-14)
- [CredentialPublicKey resource](https://www.twilio.com/docs/iam/credentialpublickey-resource) (retrieved 2026-10-14)
- [Monitor Events resource](https://www.twilio.com/docs/usage/monitor-events) (retrieved 2026-10-14)
- [Analyze: Investigate](https://www.twilio.com/docs/usage/fraud-response-guide/analyze) (retrieved 2026-10-14)
- [Recording resource](https://www.twilio.com/docs/voice/api/recording) (retrieved 2026-10-14)
- [New Audit Events for Voice Recordings and Transcriptions to log media access](https://www.twilio.com/en-us/changelog/new-audit-events-for-voice-recordings-and-transcriptions-to-log-media-access) (retrieved 2026-10-14)
