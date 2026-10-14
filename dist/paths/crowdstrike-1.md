# CrowdStrike Falcon: OAuth2 API client (client ID and secret)

`crowdstrike-1` · OAuth · service. An API client created in Support and resources > API Clients & Keys has a client ID, secret and selected API scopes. The pair is exchanged at POST /oauth2/token (regional base URL) for a 30-minute bearer token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /api-clients/queries/api-clients/v1 (GetAllAPIClientIdsForCustomer) plus GetAPIClients; also the console's API Clients & Keys page. | GET /api-clients/queries/api-clients/v1 (GetAllAPIClientIdsForCustomer) plus GetAPIClients; also the console's API Clients & Keys page. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Falcon IP allowlisting docs are behind the Falcon console login; not verified. |  |
| Protect: Expires automatically | Yes | Access token 30 min; client secret has no documented expiry | ResetAPIClientSecret: POST /api-clients/entities/api-clients-actions/v1?action_name=reset_secret |
| Detect: Usage appears in logs | Yes | actor_id | Falcon audit logs (Audit API): Query via POST /audit-logs/queries/queryjobs/v1 (scope Audit: READ); filters include actor_id, actor_ip, actor_type, user_agent, action. Retention not public. · Event Streams: Streaming API (scope Event streams: READ); audit event types not verified from public docs. · Real Time Response audit: GET /real-time-response-audit/combined/sessions/v1 lists RTR sessions. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Tokens last up to 30 min if not revoked. |  |
| Respond: Stops working when user is removed | N/A | API clients are customer (CID)-level credentials created under API Clients & Keys, not user logins; docs do not say what happens if the creating user is removed. |  |

## Protect: what an admin can configure

### Admin controls
- **API scopes** (Limit scope; all plans; default unknown). Each API client gets only the scopes selected for it; scopes can be changed later. Where: Support and resources > API Clients & Keys; PATCH /api-clients/entities/api-clients/v1.
- **ResetAPIClientSecret** (Require rotation; all plans; default unknown). Issues a new secret for the client. Where: POST /api-clients/entities/api-clients-actions/v1?action_name=reset_secret.

- Network: unknown (checked at unknown). Falcon IP allowlisting docs are behind the Falcon console login; not verified.
- Lifetime: Access token 30 min; client secret has no documented expiry. Renewal: Client requests a new token with the same ID and secret.
- Keyless option: not_verified. No workload identity federation for API clients found in public docs.
- Conditions: Console role needed to manage API clients is documented only inside Falcon.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Falcon audit logs (Audit API): Query via POST /audit-logs/queries/queryjobs/v1 (scope Audit: READ); filters include actor_id, actor_ip, actor_type, user_agent, action. Retention not public.
- Event Streams: Streaming API (scope Event streams: READ); audit event types not verified from public docs.
- Real Time Response audit: GET /real-time-response-audit/combined/sessions/v1 lists RTR sessions.

### Fields that identify the credential
- `actor_id` (Audit API): Whether this holds the API client ID for API actions is not documented.

### Lifecycle events
No docs found.

### Correlate on
`actor_id`, `actor_ip`, `user_agent`

### API calls a holder can make, and whether they are logged
- recon: `GET /sensors/queries/installers/ccid/v1`. Tenant CID with checksum Logged: unknown. 
- discovery (bulk): `GET /api-clients/queries/api-clients/v1`. All API client IDs Logged: unknown. 
- enumeration (bulk): `GET /devices/combined/devices/v1`. Host inventory Logged: unknown. 
- collection (bulk): `POST /alerts/combined/alerts/v1`. Alerts matching an FQL filter Logged: unknown. 
- collection (bulk): `GET /sensors/entities/datafeed/v2`. Event stream URLs for continuous data Logged: unknown. 

### Public detection rules (community, not vendor documentation)
- [Crowdstrike API Key Created](https://github.com/panther-labs/panther-analysis/blob/develop/rules/crowdstrike_rules/event_stream_rules/crowdstrike_api_key_created.yml) (Panther): A Falcon API client (client ID and secret) was created.
- [Crowdstrike API Key Deleted](https://github.com/panther-labs/panther-analysis/blob/develop/rules/crowdstrike_rules/event_stream_rules/crowdstrike_api_key_deleted.yml) (Panther): Falcon API clients were deleted.

### What to look for (analyst guidance)
- New API client with write scopes (Real time response (admin), Hosts, API Client Mgmt)
- Secret reset on an existing client
- API calls from unfamiliar actor_ip or user_agent

## Respond: how to revoke it
- Admin: **DeleteAPIClients**. Deletes API clients by ID. Where: Console or DELETE /api-clients/entities/api-clients/v1.
- Admin: **oauth2RevokeToken**. Revokes a specific access token before its 30-minute expiry; needs the client's ID and secret. Where: POST /oauth2/revoke.

Delete the API client or reset its secret; revoke known tokens with POST /oauth2/revoke. Live access ends on revocation: unknown. Tokens last up to 30 min if not revoked.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Exact audit action names
- No documented whoami for the API client itself
- IP allowlisting for API clients: whether it exists, whether it applies to /oauth2/token or every API request (Falcon docs require login).
- Whether deleting an API client or resetting its secret invalidates already-issued 30-minute tokens.
- Audit event names for API client create/update/delete/secret reset and token issuance, and which field carries the client ID.
- Whether ordinary API read calls are written to the audit log, and audit log retention.
- Which Falcon roles can create API clients, and whether creation can require approval.
- Whether a parent CID can be prevented from issuing member_cid tokens for specific child CIDs.
- HEC ingest key expiry, IP restriction, and whether regeneration invalidates the old key immediately.
- API rate limits (documented only inside Falcon).

## Sources
- [CrowdStrike Developer Center (Authentication)](https://developer.crowdstrike.com/llms.txt) (retrieved 2026-10-14)
- [API Credentials (Falcon MCP)](https://developer.crowdstrike.com/falcon-mcp/getting-started/credentials/) (retrieved 2026-10-14)
- [OAuth2 service collection](https://developer.crowdstrike.com/api-reference/collections/oauth2/) (retrieved 2026-10-14)
- [API Clients service collection](https://developer.crowdstrike.com/api-reference/collections/api-clients/) (retrieved 2026-10-14)
- [Audit service collection](https://developer.crowdstrike.com/api-reference/collections/audit/) (retrieved 2026-10-14)
- [Event Streams service collection](https://developer.crowdstrike.com/api-reference/collections/event-streams/) (retrieved 2026-10-14)
- [CrowdStrike Developer Center (full operation index)](https://developer.crowdstrike.com/llms-full.txt) (retrieved 2026-10-14)
