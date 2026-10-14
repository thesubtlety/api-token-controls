# Portkey: Integrations / Virtual Keys (stored provider credentials)

`portkey-6` · API key / token · service. Upstream provider keys (OpenAI, Bedrock, etc.) stored encrypted in Portkey and used by the gateway on behalf of a Portkey API key; not returned to users. Virtual Keys are deprecated in favour of Model Catalog/Integrations.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Integrations page (Connected and Workspace-Created tabs) and the List Integrations admin API. | Integrations page (Connected and Workspace-Created tabs) and the List Integrations admin API. |
| Protect: Admin can block or require approval | Yes (requires Enterprise) | Managers Write Workspace Integrations | Managers Write Workspace Integrations: Admin Settings > Security > Integration Management (workspace-level overrides possible) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Not documented. |  |
| Protect: Expires automatically | No docs found | Lifetime is the upstream provider's |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Audit Logs: Enterprise; Admin Settings > Audit Logs or GET /audit-logs (admin key with audit_logs.list); indefinite retention; filter by user_type=api_key. · Request Logs: Gateway request logs with full request/response; retention 3 days Developer, 30 days Production, unlimited Enterprise. |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | Yes | Upstream rotation ends use. | Rotate the key at the upstream provider and update/delete the integration. |
| Respond: Stops working when user is removed | N/A | Integrations are org/workspace-level stored provider credentials, not user credentials. |  |

## Protect: what an admin can configure

### Admin controls
- **Integration workspace provisioning** (Limit resources; all plans; default unknown). Choose which workspaces and models can use stored provider credentials. Where: Integrations page.
- **Managers Write Workspace Integrations** (Disable; Enterprise; default on). Org admins can stop workspace managers from creating, updating or deleting AI integrations; owners and admins keep full access. Where: Admin Settings > Security > Integration Management (workspace-level overrides possible).

- Network: unknown (checked at unknown). Not documented.
- Lifetime: Lifetime is the upstream provider's. Renewal: Update the integration with a new provider key.
- Keyless option: not_applicable. Holder needs a Portkey API key or JWT to use them.
- Conditions: 

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit Logs: Enterprise; Admin Settings > Audit Logs or GET /audit-logs (admin key with audit_logs.list); indefinite retention; filter by user_type=api_key.
- Request Logs: Gateway request logs with full request/response; retention 3 days Developer, 30 days Production, unlimited Enterprise.

### Fields that identify the credential
No docs found.

### Lifecycle events
- modify: `Create/Update/Delete (resource type Integrations)` 

### Correlate on
`integration slug`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### What to look for (analyst guidance)
- Integration shared to new workspaces

## Respond: how to revoke it


Rotate the key at the upstream provider and update/delete the integration. Live access ends on revocation: yes. Upstream rotation ends use.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Not a standalone bearer credential
- IP allowlisting for API keys or JWTs
- Name of the org/workspace maximum key TTL setting
- Whether user API keys are disabled when the user is removed or deprovisioned via SCIM
- Whether SSO enforcement affects API keys
- Whether GET (read) API calls appear in audit logs (filter lists only POST/PUT/DELETE)
- Auth cache delay after key deletion
- SCIM token expiry and revocation
- API key token prefix

## Sources
- [Integrations](https://docs.portkey.ai/docs/product/model-catalog/integrations) (retrieved 2026-10-14)
- [Virtual Keys](https://docs.portkey.ai/docs/product/ai-gateway/virtual-keys) (retrieved 2026-10-14)
- [List Integrations](https://docs.portkey.ai/docs/api-reference/admin-api/control-plane/integrations/list-integrations) (retrieved 2026-10-14)
- [Audit Logs](https://docs.portkey.ai/docs/product/enterprise-offering/audit-logs) (retrieved 2026-10-14)
- [Configure Integration Access Permissions for Workspaces](https://docs.portkey.ai/docs/product/administration/configure-integration-access-permissions) (retrieved 2026-10-14)
