# CrowdStrike Falcon: Flight Control (MSSP) parent API client acting on a child CID (member_cid)

`crowdstrike-2` · OAuth · service. An API client in a Flight Control parent CID can request a token with member_cid to act on a child CID.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Same API client listing (GET /api-clients/queries/api-clients/v1) in the parent CID. | Same API client listing (GET /api-clients/queries/api-clients/v1) in the parent CID. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented publicly. |  |
| Protect: Expires automatically | Yes | Same 30-min token as other API clients | ResetAPIClientSecret: POST /api-clients/entities/api-clients-actions/v1?action_name=reset_secret |
| Detect: Usage appears in logs | Yes | cid | API: POST /audit-logs/queries/queryjobs/v1 with cid=[<child CID>] (and actor_id); poll GET /audit-logs/entities/queryjobs/v1?id=; read GET /audit-logs/entities/queryjob-results/v1?id= · Command: FalconPy: Audit.create_audit_query_job(cid=[...], actor_id=[...]) |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | No docs found | Delete or reset the parent API client. |  |
| Respond: Stops working when user is removed | N/A | Parent-CID API client credential, not a user login. |  |

## Protect: what an admin can configure

### Admin controls
- **API scopes** (Limit scope; all plans; default unknown). Each API client gets only the scopes selected for it; scopes can be changed later. Where: Support and resources > API Clients & Keys; PATCH /api-clients/entities/api-clients/v1.
- **ResetAPIClientSecret** (Require rotation; all plans; default unknown). Issues a new secret for the client. Where: POST /api-clients/entities/api-clients-actions/v1?action_name=reset_secret.

- Network: unknown (checked at unknown). Not documented publicly.
- Lifetime: Same 30-min token as other API clients. Renewal: New token per child CID with the parent's client credentials.
- Keyless option: not_verified. 
- Conditions: Falcon Flight Control subscription (documented in console).

## Detect: what gets logged
- Token prefix: not established

### Logs
- Falcon audit logs (Audit API): Has a cid filter; whether child CID logs show parent client actions is not documented.

### Fields that identify the credential
- `cid` (Audit API): Filter field.

### Lifecycle events
No docs found.

### Correlate on
`cid`, `actor_id`

### API calls a holder can make, and whether they are logged
- discovery (bulk): `GET /mssp/queries/children/v1`. Linked child CIDs Logged: unknown. 

### What to look for (analyst guidance)
- Parent client tokens minted for many child CIDs

## Respond: how to revoke it
- Admin: **DeleteAPIClients**. Deletes API clients by ID. Where: Console or DELETE /api-clients/entities/api-clients/v1.
- Admin: **oauth2RevokeToken**. Revokes a specific access token before its 30-minute expiry; needs the client's ID and secret. Where: POST /oauth2/revoke.

Delete or reset the parent API client. Live access ends on revocation: unknown. 

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Child-side visibility of parent API use
- IP allowlisting for API clients: whether it exists, whether it applies to /oauth2/token or every API request (Falcon docs require login).
- Whether deleting an API client or resetting its secret invalidates already-issued 30-minute tokens.
- Audit event names for API client create/update/delete/secret reset and token issuance, and which field carries the client ID.
- Whether ordinary API read calls are written to the audit log, and audit log retention.
- Which Falcon roles can create API clients, and whether creation can require approval.
- Whether a parent CID can be prevented from issuing member_cid tokens for specific child CIDs.
- HEC ingest key expiry, IP restriction, and whether regeneration invalidates the old key immediately.
- API rate limits (documented only inside Falcon).

## Sources
- [OAuth2 service collection](https://developer.crowdstrike.com/api-reference/collections/oauth2/) (retrieved 2026-10-14)
- [FalconPy Authentication](https://developer.crowdstrike.com/sdks/python/authentication/) (retrieved 2026-10-14)
- [CrowdStrike Developer Center (Authentication)](https://developer.crowdstrike.com/llms.txt) (retrieved 2026-10-14)
- [MSSP (Flight Control) service collection](https://developer.crowdstrike.com/api-reference/collections/mssp/) (retrieved 2026-10-14)
- [API Clients service collection](https://developer.crowdstrike.com/api-reference/collections/api-clients/) (retrieved 2026-10-14)
- [FalconPy audit endpoints (official CrowdStrike SDK)](https://raw.githubusercontent.com/CrowdStrike/falconpy/main/src/falconpy/_endpoint/_audit.py) (retrieved 2026-10-14)
- [FalconPy audit payload (official CrowdStrike SDK)](https://raw.githubusercontent.com/CrowdStrike/falconpy/main/src/falconpy/_payload/_audit.py) (retrieved 2026-10-14)
- [FalconPy Audit service class](https://raw.githubusercontent.com/CrowdStrike/falconpy/main/src/falconpy/audit.py) (retrieved 2026-10-14)
- [Audit service collection](https://developer.crowdstrike.com/api-reference/collections/audit/) (retrieved 2026-10-14)
- [API Credentials (Falcon MCP)](https://developer.crowdstrike.com/falcon-mcp/getting-started/credentials/) (retrieved 2026-10-14)
