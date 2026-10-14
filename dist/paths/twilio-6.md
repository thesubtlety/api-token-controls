# Twilio: Access Token (client SDK JWT)

`twilio-6` · Signed JWT · person. Server signs a JWT with a Standard/Main API key secret to grant client SDK features (Voice, Video, Conversations).

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | Yes | ttl default 3600 s, max 24 h | API: Pass ttl (seconds) when building the Access Token in the helper library; default 3600, max 24 h; read exp claim to see expiry |
| Detect: Usage appears in logs | No docs found | No log source found. |  |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | Yes | Delete the signing API key. | Delete the signing API key. |
| Respond: Stops working when user is removed | N/A | The token's identity is a user in the customer's own system, not a Twilio user. |  |

## Protect: what an admin can configure

### Admin controls
- **Access Token ttl** (Limit lifetime; all plans; default on). Token lifetime up to 24 hours. Where: Access Token ttl parameter.

- Network: unknown (checked at unknown). Not documented.
- Lifetime: ttl default 3600 s, max 24 h. Renewal: Server mints a new token.
- Keyless option: not_applicable. Issued by customer server.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
No docs found.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`API key SID (iss)`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

## Respond: how to revoke it
- Admin: **Delete API key**. Revokes REST access and invalidates Access Tokens signed with the key. Where: Console > API keys > Delete this key; DELETE https://iam.twilio.com/v1/Keys/{Sid}.

Delete the signing API key. Live access ends on revocation: yes. null

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Usage appears in logs
- Data reads appear in logs
- Logging of Access Token use
- Not researched
- IP allowlisting for REST API credentials (Auth Token, API keys, OAuth).
- Expiry settings for API keys and Auth Tokens.
- Whether org SSO enforcement or SCIM deactivation affects any API credential.
- Org-wide policy to block Main key or Auth Token use other than PKCV.
- Whether Monitor Events records read (GET) API calls or token issuance.
- Whether actor_sid identifies the API key SID (SK) or only the account.

## Sources
- [Access Tokens](https://www.twilio.com/docs/iam/access-tokens) (retrieved 2026-10-14)
- [Restricted API keys](https://www.twilio.com/docs/iam/api-keys/restricted-api-keys) (retrieved 2026-10-14)
- [REST API: Key Resource v1](https://www.twilio.com/docs/iam/api-keys/key-resource-v1) (retrieved 2026-10-14)
- [Create API keys in Twilio Console](https://www.twilio.com/docs/iam/api-keys/keys-in-console) (retrieved 2026-10-14)
