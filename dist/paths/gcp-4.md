# Google Cloud: API keys (standard keys and authorization keys bound to a service account)

`gcp-4` · API key / token · person or service. A bearer string (AIza...) sent with requests. Standard keys only identify a project for billing/quota; authorization keys act as the bound service account, similar to a long-lived access token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Cloud Asset Inventory supports apikeys.googleapis.com/Key; per project also gcloud services api-keys list. | Cloud Asset Inventory supports apikeys.googleapis.com/Key; per project also gcloud services api-keys list. |
| Protect: Admin can block or require approval | Yes | iam.managed.disableServiceAccountApiKeyCreation | iam.managed.disableServiceAccountApiKeyCreation: Organization policies > Block service account API key bindings |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Per-key application restrictions (external IPs, referrers, Android/iOS apps) and API restrictions. Keys created by REST API are unrestricted unless set. Internal IPs are not supported. | API key application and API restrictions: APIs & Services > Credentials > key > Application restrictions / API restrictions · VPC Service Controls: Security > VPC Service Controls |
| Protect: Expires automatically | No docs found | No expiry setting found on fetched pages |  |
| Detect: Usage appears in logs | Yes | unknown | Where: Logs Explorer: protoPayload.serviceName="apikeys.googleapis.com" (CreateKey/DeleteKey/UpdateKey are Admin Activity; GetKeyString needs Data Access Admin Read enabled) |
| Detect: Data reads appear in logs | No docs found | Not researched. |  |
| Respond: Revocation ends active access | No docs found | Propagation time for deletion not documented. |  |
| Respond: Stops working when user is removed | N/A | Standard keys don't identify a principal; authorization keys act as a service account. |  |

## Protect: what an admin can configure

### Admin controls
- **iam.managed.disableServiceAccountApiKeyCreation** (Disable; all plans; default on). Blocks binding API keys to service accounts except for allowed services. Where: Organization policies > Block service account API key bindings.
- **API key application and API restrictions** (Limit network; all plans; default off). Restricts a key to listed external IPs, referrers or apps, and to specific APIs. Where: APIs & Services > Credentials > key > Application restrictions / API restrictions.
- **VPC Service Controls** (Limit network; all plans; default off). Service perimeters with ingress rules limit API access by network origin and identity, even with stolen credentials. Where: Security > VPC Service Controls.

- Network: supported (checked at api_request). Per-key application restrictions (external IPs, referrers, Android/iOS apps) and API restrictions. Keys created by REST API are unrestricted unless set. Internal IPs are not supported.
- Lifetime: No expiry setting found on fetched pages. Renewal: Console 'Rotate key' creates a new key with the same restrictions; then delete the old one.
- Keyless option: not_applicable. Standard keys identify no principal; authorization keys act as a service account. Neither is tied to user SSO.
- Conditions: Changing the constraint needs an organization resource.

## Detect: what gets logged
- Token prefix: `AIza`

### Logs
- Cloud Audit Logs (apikeys.googleapis.com): CreateKey/DeleteKey/UpdateKey are Admin Activity; GetKeyString is Data Access.

### Fields that identify the credential
- `unknown` (Cloud Audit Logs): Docs say authorization keys obscure end-user identity; data-plane key field not documented.

### Lifecycle events
- create: `google.api.apikeys.v2.ApiKeys.CreateKey` 
- revoke: `google.api.apikeys.v2.ApiKeys.DeleteKey` Restorable 30 days via UndeleteKey
- use: `google.api.apikeys.v2.ApiKeys.GetKeyString` Someone read the key string; Data Access

### Correlate on
`key ID`, `bound service account email`

### API calls a holder can make, and whether they are logged
Not researched for this platform yet.

### Public detection rules (community, not vendor documentation)
- [GCP serviceusage.apiKeys.create Privilege Escalation](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gcp_audit_rules/gcp_serviceusage_apikeys_create_privilege_escalation.yml) (Panther): An API key was created (methodName ending ApiKeys.CreateKey with serviceusage.apiKeys.create granted).

### What to look for (analyst guidance)
- Unrestricted keys
- GetKeyString by unusual principal
- Authorization key created after constraint change

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **iam.serviceAccountKeyExposureResponse**. Auto-disables SA keys and SA-bound API keys that Google detects as exposed. Where: Organization policies (DISABLE_KEY or WAIT_FOR_ABUSE).
- Admin: **Disable service account (serviceAccounts.disable)**. Immediately disables the SA, which is the documented way to cut off already-issued short-lived tokens. Where: IAM > Service accounts > Disable; POST .../serviceAccounts/SA_ID:disable.
- Admin: **Delete API key**. Deletes the key; it can be restored for 30 days. Where: APIs & Services > Credentials; DeleteKey.

Delete the key (or add restrictions); for authorization keys also disable the bound SA. Live access ends on revocation: unknown. Propagation time for deletion not documented.

## No vendor documentation found
- SSO and MFA rules apply
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Which log field shows the API key on API calls
- No documented whoami for API keys; reachable APIs depend on key restrictions
- Whether existing keys created before iam.serviceAccountKeyExpiryHours was set get an expiry (docs say 'newly created').
- Federated (STS) access token lifetime.
- Whether API keys support an expiry setting.
- Which audit field identifies the API key or HMAC access ID used on a data-plane request.
- Whether GetKeyString/lookupKey calls are logged for keys.lookupKey.
- Plan/pricing for VPC Service Controls (needs organization).

## Sources
- [Manage API keys](https://cloud.google.com/docs/authentication/api-keys) (retrieved 2026-10-14)
- [Set up Context-Aware Access](https://cloud.google.com/beyondcorp-enterprise/docs/securing-console-and-apis) (retrieved 2026-10-14)
- [Restricting service account usage](https://cloud.google.com/resource-manager/docs/organization-policy/restricting-service-accounts) (retrieved 2026-10-14)
- [API Keys audit logging](https://cloud.google.com/api-keys/docs/audit-logging) (retrieved 2026-10-14)
- [Asset types - Cloud Asset Inventory](https://cloud.google.com/asset-inventory/docs/supported-asset-types) (retrieved 2026-10-14)
- [View logs by using the Logs Explorer](https://cloud.google.com/logging/docs/view/logs-explorer-interface) (retrieved 2026-10-14)
- [Enable Data Access audit logs](https://cloud.google.com/logging/docs/audit/configure-data-access) (retrieved 2026-10-14)
- [Best practices for managing API keys](https://cloud.google.com/docs/authentication/api-keys-best-practices) (retrieved 2026-10-14)
- [Disable and enable service accounts](https://cloud.google.com/iam/docs/service-accounts-disable-enable) (retrieved 2026-10-14)
- [Create and delete service account keys](https://cloud.google.com/iam/docs/keys-create-delete) (retrieved 2026-10-14)
- [Overview of VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs/overview) (retrieved 2026-10-14)
