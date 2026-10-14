# CrowdStrike Falcon: Next-Gen SIEM HEC data connector API key (ingest token)

`crowdstrike-3` · API key / token · service. Creating an HEC/HTTP Event Data Connector produces an API key and URL used by log shippers to send events into Next-Gen SIEM.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /ngsiem/combined/connections/v1 lists data connections; console page Next-Gen SIEM > Data ingestion > Data connectors. | GET /ngsiem/combined/connections/v1 lists data connections; console page Next-Gen SIEM > Data ingestion > Data connectors. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented publicly. |  |
| Protect: Expires automatically | Yes | Token has an expires_at timestamp; default and max not documented | Regenerate Ingest token: POST /ngsiem/entities/connections/token/v1 |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Where: Next-Gen SIEM > Data ingestion > Data connectors > <connector> > Show events (or Advanced Event Search filtered on the connector's #connector tag) |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | Yes | Regenerating the ingest token invalidates the previous one; timing not stated. | Regenerate the ingest token or delete the connector. |
| Respond: Stops working when user is removed | N/A | The key belongs to the data connector, shown on the connector's detail page. |  |

## Protect: what an admin can configure

### Admin controls
- **Regenerate Ingest token** (Require rotation; Falcon Next-Gen SIEM; default unknown). Regenerates the data connection ingest token. Where: POST /ngsiem/entities/connections/token/v1.

- Network: unknown (checked at unknown). Not documented publicly.
- Lifetime: Token has an expires_at timestamp; default and max not documented. Renewal: Regenerate via POST /ngsiem/entities/connections/token/v1.
- Keyless option: not_applicable. Static ingest key.
- Conditions: Falcon Next-Gen SIEM subscription; Administrator or Connector Manager.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Next-Gen SIEM events tagged #connector: Ingested data can be filtered by the connector tag; key-use audit not documented.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`#connector`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Unexpected events or volume on a connector (log injection)

## Respond: how to revoke it


Regenerate the ingest token or delete the connector. Live access ends on revocation: yes. Regenerating the ingest token invalidates the previous one; timing not stated.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Audit events for connector key regeneration
- Ingest key is write-only per docs reviewed; read capability not documented
- IP allowlisting for API clients: whether it exists, whether it applies to /oauth2/token or every API request (Falcon docs require login).
- Whether deleting an API client or resetting its secret invalidates already-issued 30-minute tokens.
- Audit event names for API client create/update/delete/secret reset and token issuance, and which field carries the client ID.
- Whether ordinary API read calls are written to the audit log, and audit log retention.
- Which Falcon roles can create API clients, and whether creation can require approval.
- Whether a parent CID can be prevented from issuing member_cid tokens for specific child CIDs.
- HEC ingest key expiry, IP restriction, and whether regeneration invalidates the old key immediately.
- API rate limits (documented only inside Falcon).

## Sources
- [Data Ingestion (HEC)](https://developer.crowdstrike.com/ngsiem/data-ingestion/) (retrieved 2026-10-14)
- [ngsiem_data_connection_token (Terraform provider)](https://developer.crowdstrike.com/cac/terraform/provider/next-gen-siem/resources/ngsiem-data-connection-token/) (retrieved 2026-10-14)
- [CrowdStrike Developer Center (full operation index)](https://developer.crowdstrike.com/llms-full.txt) (retrieved 2026-10-14)
- [ExternalListDataConnections](https://developer.crowdstrike.com/api-reference/operations/ExternalListDataConnections/) (retrieved 2026-10-14)
