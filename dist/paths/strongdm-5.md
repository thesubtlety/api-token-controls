# StrongDM: Gateway / relay token

`strongdm-5` · API key / token · service. Token generated when creating a gateway or relay node; installed on the host (SDM_RELAY_TOKEN) so the node can join the organization's network.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin UI Gateways and Relays pages and `sdm admin nodes list` list all nodes. | Admin UI Gateways and Relays pages and `sdm admin nodes list` list all nodes. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Docs say a node's IP cannot be changed after creation, but do not describe this as a token IP restriction. |  |
| Protect: Expires automatically | Not available | Node removed after 30 days with no heartbeat |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Where: Logs > Activities (relay/gateway lifecycle events such as 'Relay created') · Command: sdm audit activities --from <date> --to <date> |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | No docs found | Delete the node in Networking and create a new one with a new token. |  |
| Respond: Stops working when user is removed | N/A | Gateway/relay tokens belong to a node, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Permission level: Manage relays and gateways** (Other; all plans; default on). Only Administrators can create gateways/relays and so obtain node tokens. Where: Principals > Users > (user) > Settings > Permission Level.

- Network: unknown (checked at unknown). Docs say a node's IP cannot be changed after creation, but do not describe this as a token IP restriction.
- Lifetime: Node removed after 30 days with no heartbeat. Renewal: Replace by creating a new node and putting its token on the host.
- Keyless option: not_applicable. Static node token.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- Activities: Node lifecycle events.

### Fields that identify the credential
No docs found.

### Lifecycle events
- create: `Relay created` null
- use: `Installation created for relay` null
- revoke: `Relay deleted` null

### Correlate on
`node name`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- New relays or gateways not created by infrastructure automation

## Respond: how to revoke it
- Admin: **sdm admin nodes delete**. Deletes a gateway or relay node. Where: CLI: sdm admin nodes delete.

Delete the node in Networking and create a new one with a new token. Live access ends on revocation: unknown. null

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Whether deleting a node disconnects it immediately
- What a stolen node token can do beyond registering a node is not documented
- Any IP allowlist for admin tokens, API keys, service accounts, or SCIM tokens (docs silent).
- Any org-wide switch to block creation of admin tokens or API keys, or a maximum expiry policy.
- Whether SSO-required or MFA settings apply to service account token logins.
- SCIM token rotation, revocation, and lifetime.
- Service account token lifetime and rekey procedure.
- Whether read-only SDK/API calls (e.g. listing accounts or resources) are recorded as Activities.
- Whether API key creation logs as 'Admin token created' or a separate event.

## Sources
- [Gateways and Relays](https://docs.strongdm.com/admin/networking/gateways-and-relays) (retrieved 2026-10-14)
- [View Logs from the Admin UI](https://docs.strongdm.com/admin/audit/logs/view-adminui) (retrieved 2026-10-14)
- [sdm admin nodes list](https://docs.strongdm.com/references/cli/admin/nodes/list) (retrieved 2026-10-14)
- [View Logs from the CLI](https://docs.strongdm.com/admin/audit/logs/view-cli) (retrieved 2026-10-14)
- [Permission Level](https://docs.strongdm.com/admin/access/permission-level) (retrieved 2026-10-14)
- [sdm admin nodes delete](https://docs.strongdm.com/references/cli/admin/nodes/delete) (retrieved 2026-10-14)
