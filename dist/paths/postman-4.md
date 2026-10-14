# Postman: Collection access key

`postman-4` · API key / token · person. Read-only key for one collection, passed as the access_key query parameter on GET /collections/{id}; no API key needed.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | The Collection access keys section of Account settings > API keys shows keys created by all members of the signed-in team. | The Collection access keys section of Account settings > API keys shows keys created by all members of the signed-in team. |
| Protect: Admin can block or require approval | Yes | Allow creation of Collection Access Keys | Where: Avatar > Public elements (Manage public elements dashboard) > turn off Allow creation of Collection Access Keys |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No Postman doc found describing IP allowlisting for API keys or the Postman API. |  |
| Protect: Expires automatically | Not available | Expires after 60 days unused; each use extends 60 days |  |
| Detect: Usage appears in logs | Yes | id | Collection access keys list: GET /collection-access-keys shows lastUsedAt and expiresAfter; Manage public elements dashboard |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Revocation is permanent. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Allow creation of Collection Access Keys** (Disable; unknown; default unknown). Turn off to stop members creating collection access keys. Where: Manage public elements.

- Network: unknown (checked at unknown). No Postman doc found describing IP allowlisting for API keys or the Postman API.
- Lifetime: Expires after 60 days unused; each use extends 60 days. Renewal: Use keeps it alive indefinitely
- Keyless option: not_applicable. Static read-only share key.
- Conditions: Manage public elements dashboard is Enterprise

## Detect: what gets logged
- Token prefix: `PMAT-`

### Logs
- Collection access keys list: GET /collection-access-keys shows lastUsedAt and expiresAfter; Manage public elements dashboard

### Fields that identify the credential
- `id` (GET /collection-access-keys): Key ID for DELETE

### Lifecycle events
No docs found.

### Correlate on
`collectionId`, `lastUsedAt`

### API calls a holder can make, and whether they are logged
- collection: `GET /collections/{collectionId}?access_key=`. Full collection JSON Logged: unknown. lastUsedAt updated

### What to look for (analyst guidance)
- Keys on sensitive collections with recent lastUsedAt

## Respond: how to revoke it
- Admin: **Revoke All Keys (collection access keys)**. Delete one or all team collection access keys; permanent. Where: Manage public elements > Collection Access Keys; DELETE /collection-access-keys/{keyId}.

Delete key in API keys page or Manage public elements, or DELETE /collection-access-keys/{keyId}. Live access ends on revocation: unknown. Revocation is permanent.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- Audit events for create/use/delete
- Any IP allowlisting for Postman API keys or the Postman API (none found in docs).
- Whether API keys or service account tokens are blocked by SSO-only enforcement or IdP conditional access; docs do not say.
- Whether revoking a service account API key invalidates already-issued short-lived tokens.
- Whether removing or SCIM-deactivating a user revokes their Postman API keys.
- Default and allowed expiry values for user API keys and SCIM keys.
- Exact audit action codes for service account key events and collection access key create/delete.
- Whether Postman API read calls (GET /collections, /workspaces, etc.) appear in audit logs.
- How OAuth client_credentials clients (installationAuthId) are registered and administered.
- Documented prefix for user Postman API keys (OAuth token example shows PMAK-XXX; not stated for API keys).

## Sources
- [Generate and use Postman API keys](https://learning.postman.com/docs/reference/postman-api/authentication/) (retrieved 2026-10-14)
- [Get a collection](https://learning.postman.com/api-docs/api-reference/collections/get-collection) (retrieved 2026-10-14)
- [Get collection access keys](https://learning.postman.com/api-docs/api-reference/collection-access-keys/get-collection-access-keys) (retrieved 2026-10-14)
- [Manage public elements](https://learning.postman.com/docs/collaborating-in-postman/manage-public-elements/) (retrieved 2026-10-14)
- [Delete a collection access key](https://learning.postman.com/api-docs/api-reference/collection-access-keys/delete-collection-access-key) (retrieved 2026-10-14)
