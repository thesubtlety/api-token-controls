# Cloudflare: R2 S3 API credentials (Access Key ID / Secret Access Key)

`cloudflare-6` · HMAC · person or service. S3 SigV4 credentials derived from a user or account API token: Access Key ID = token id, Secret = SHA-256 of token value. Temporary credentials can be minted from them.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | R2 credentials are API tokens: account tokens are listable by Super Administrators (GET /accounts/{account_id}/tokens); user tokens only by their owner. | R2 credentials are API tokens: account tokens are listable by Super Administrators (GET /accounts/{account_id}/tokens); user tokens only by their owner. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Whether the parent token's IP filter applies to S3 requests is not stated. |  |
| Protect: Expires automatically | Not available | Follows the parent token; account tokens valid until revoked or expiry |  |
| Detect: Usage appears in logs | Yes | actor.accessKeyId | R2 Data Access Logs: Opt-in per bucket; 7-day retention; best effort; excludes status >=400. · Audit Logs: Bucket config only; no GetObject/PutObject. |
| Detect: Data reads appear in logs | Conditional | Only if Data Access Logs enabled on the bucket; best effort | Where: R2 > bucket > Settings > Data Access Logs > View logs in Workers Observability; filter action = GetObject and actor.accessKeyId = {key id} |
| Respond: Revocation ends active access | Yes | Derived temporary credentials stop immediately. | Delete or roll the parent API token. |
| Respond: Stops working when user is removed | Partial | R2 user API tokens go inactive when the user is removed from the account; account API tokens are not tied to a user. | Where: Manage Account > Members > expand member > Revoke (user R2 tokens go inactive; account R2 tokens are unaffected) · API: DELETE /accounts/{account_id}/members/{member_id} |

## Protect: what an admin can configure

### Admin controls
- **Token permissions and resources** (Limit scope; all plans; default varies). Limits a token to chosen permission groups, accounts, zones or R2 buckets. Where: API token > Permissions / Resources.

- Network: unknown (checked at unknown). Whether the parent token's IP filter applies to S3 requests is not stated.
- Lifetime: Follows the parent token; account tokens valid until revoked or expiry. Renewal: Recreate or roll the parent token.
- Keyless option: not_verified. Same as the parent API token.
- Conditions: Needs R2.

## Detect: what gets logged
- Token prefix: not established

### Logs
- R2 Data Access Logs: Opt-in per bucket; 7-day retention; best effort; excludes status >=400.
- Audit Logs: Bucket config only; no GetObject/PutObject.

### Fields that identify the credential
- `actor.accessKeyId` (R2 Data Access Logs): Maps to API token id

### Lifecycle events
- use: `GetObject` Data Access Logs
- use: `ListObjectsV2` Data Access Logs

### Correlate on
`actor.accessKeyId`, `requestMetadata.ip`, `actor.token_id (audit logs)`

### API calls a holder can make, and whether they are logged
- collection (bulk): `S3 ListObjectsV2 / GetObject on https://<ACCOUNT_ID>.r2.cloudflarestorage.com`. Object listings and data Logged: plan (`GetObject`). Only if Data Access Logs enabled on the bucket; best effort

### What to look for (analyst guidance)
- Bulk ListObjectsV2/GetObject from new IP
- Large response.bytes totals

## Respond: how to revoke it
- Admin: **Delete / roll API token**. Deleting or rolling invalidates the token secret. Where: DELETE /user/tokens/{token_id}; DELETE /accounts/{account_id}/tokens/{token_id}; PUT /user/tokens/{token_id}/value.

Delete or roll the parent API token. Live access ends on revocation: yes. Derived temporary credentials stop immediately.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Jurisdictional buckets lack Data Access Logs
- Any account-level setting to block members from creating user API tokens or using the Global API Key.
- Any account-wide policy forcing token expiry or IP filters.
- Whether Super Administrators can list or revoke other members' user API tokens.
- Whether dashboard SSO or Access policies are checked on API token / Global API Key requests (no explicit statement).
- Exact Audit Logs v2 action names for token create/delete/roll.
- Whether Origin CA keys still authenticate after the 2026-09-30 removal date.
- IP restrictions for Access service tokens and for R2 S3 requests.
- Cloudflare OAuth tokens (actor context 'oauth', e.g. Wrangler) were not researched.

## Sources
- [R2 Authentication](https://developers.cloudflare.com/r2/api/tokens/) (retrieved 2026-10-14)
- [R2 Temporary credentials](https://developers.cloudflare.com/r2/api/s3/temporary-credentials/) (retrieved 2026-10-14)
- [Account API tokens](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/) (retrieved 2026-10-14)
- [List Tokens (account)](https://developers.cloudflare.com/api/resources/accounts/subresources/tokens/methods/list/) (retrieved 2026-10-14)
- [List Tokens (user)](https://developers.cloudflare.com/api/resources/user/subresources/tokens/methods/list/) (retrieved 2026-10-14)
- [R2 Data Access Logs](https://developers.cloudflare.com/r2/buckets/data-access-logs/) (retrieved 2026-10-14)
- [Manage (account members)](https://developers.cloudflare.com/fundamentals/manage-members/manage/) (retrieved 2026-10-14)
- [R2 Audit Logs](https://developers.cloudflare.com/r2/platform/audit-logs/) (retrieved 2026-10-14)
- [Create API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) (retrieved 2026-10-14)
- [Roll tokens](https://developers.cloudflare.com/fundamentals/api/how-to/roll-token/) (retrieved 2026-10-14)
- [Delete Token](https://developers.cloudflare.com/api/resources/user/subresources/tokens/methods/delete/) (retrieved 2026-10-14)
- [Delete Token (account)](https://developers.cloudflare.com/api/resources/accounts/subresources/tokens/methods/delete/) (retrieved 2026-10-14)
- [Roll Token](https://developers.cloudflare.com/api/resources/user/subresources/tokens/subresources/value/methods/update/) (retrieved 2026-10-14)
