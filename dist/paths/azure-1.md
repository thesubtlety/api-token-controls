# Microsoft Azure: Storage account access keys (Shared Key)

`azure-1` · HMAC · service. Two account keys (key1/key2) per storage account; requests are HMAC-SHA256 signed in the SharedKey Authorization header. Keys give full data access and can mint SAS tokens.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Each account has exactly two keys, listed under Security + networking > Access keys or with az storage account keys list (per account). | Each account has exactly two keys, listed under Security + networking > Access keys or with az storage account keys list (per account). |
| Protect: Admin can block or require approval | Yes | Allow storage account key access (AllowSharedKeyAccess = false); Azure Policy: Storage accounts should prevent shared key access | Allow storage account key access (AllowSharedKeyAccess = false): Storage account > Configuration > Allow storage account key access; ARM property allowSharedKeyAccess · Azure Policy: Storage accounts should prevent shared key access: Azure Policy assignment |
| Protect: SSO and MFA rules apply | Not available | Docs say Conditional Access protects a storage account only after Shared Key authorization is disallowed. |  |
| Protect: IP restriction | Yes | Storage firewall network rules (IP, VNet, resource instance, trusted services) apply to requests to the account endpoint; default allows any network. | Storage firewall network rules: Storage account > Networking |
| Protect: Expires automatically | Partial | No expiry; key expiration policy only shows a rotation reminder Admin control: Key expiration policy. | Key expiration policy: Storage account > Security + networking > Access keys > Set rotation reminder |
| Detect: Usage appears in logs | Yes | AuthenticationHash | Where: Storage account > Monitoring > Diagnostic settings: send StorageBlobLogs to a Log Analytics workspace; then Logs: StorageBlobLogs / where AuthenticationType == "AccountKey"; group by AuthenticationHash to tell keys apart |
| Detect: Data reads appear in logs | Conditional | Same. | Where: Log Analytics (after diagnostic setting): StorageBlobLogs / where AuthenticationType == "AccountKey" and OperationName == "GetBlob" |
| Respond: Revocation ends active access | Yes | Regenerating also revokes SAS signed with that key; dependent apps break. | Where: Storage account > Security + networking > Access keys > Regenerate (each key); or Settings > Configuration > Allow storage account key access = Disabled · API: POST https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Storage/storageAccounts/{accountName}/regenerateKey · Command: az storage account keys renew --resource-group <rg> --account-name <account> --key primary (then --key secondary); or az storage account update --name <account> --resource-group <rg> --allow-shared-key-access false |
| Respond: Stops working when user is removed | N/A | The two access keys belong to the storage account, not to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Allow storage account key access (AllowSharedKeyAccess = false)** (Disable; all plans; default on). Rejects all requests authorized with account keys, including account and service SAS; user delegation SAS still works. Where: Storage account > Configuration > Allow storage account key access; ARM property allowSharedKeyAccess.
- **Azure Policy: Storage accounts should prevent shared key access** (Disable; all plans; default off). Audits or prevents storage accounts that permit Shared Key authorization. Where: Azure Policy assignment.
- **Key expiration policy** (Require rotation; all plans; default off). Shows a reminder and enables Azure Policy compliance checks when keys are not rotated in the interval; does not disable keys. Where: Storage account > Security + networking > Access keys > Set rotation reminder.
- **Storage firewall network rules** (Limit network; all plans; default off). Limits which IPs, VNets and resource instances can reach the account endpoint. Where: Storage account > Networking.

### Not available (vendor states)
- Key expiration policy only reminds; keys never expire.

- Network: supported (checked at api_request). Storage firewall network rules (IP, VNet, resource instance, trusted services) apply to requests to the account endpoint; default allows any network.
- Lifetime: No expiry; key expiration policy only shows a rotation reminder. Renewal: Keys stay valid until regenerated; rotate by switching to the second key, then regenerating the first.
- Keyless option: not_applicable. Shared Key does not use Microsoft Entra ID, so Entra Conditional Access does not apply; docs say Shared Key must be disallowed to protect an account with Conditional Access.
- Conditions: Shared Key is allowed when the property is unset.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Azure Activity Log: Control-plane writes/actions (e.g. listKeys, regenerateKey); 90 days free; reads typically not captured.
- Azure Storage resource logs (StorageBlobLogs): Data-plane requests incl. AuthenticationType and AuthenticationHash; not collected until a diagnostic setting routes them.

### Fields that identify the credential
- `AuthenticationHash` (StorageBlobLogs): key1|key2 plus SHA-256 hash of key.

### Lifecycle events
- create: `Microsoft.Storage/storageAccounts/listkeys/action` Key read via ARM.
- revoke: `Microsoft.Storage/storageAccounts/regeneratekey/action` 

### Correlate on
`AuthenticationHash`, `CallerIpAddress`, `AccountName`

### API calls a holder can make, and whether they are logged
- discovery (bulk): `GET https://{account}.blob.core.windows.net/?comp=list`. All containers Logged: plan. StorageBlobLogs only if diagnostic setting configured.
- enumeration (bulk): `GET https://{account}.blob.core.windows.net/{container}?restype=container&comp=list`. Blob names Logged: plan. Same.
- collection (bulk): `GET https://{account}.blob.core.windows.net/{container}/{blob}`. Blob contents Logged: plan. Same.

### Public detection rules (community, not vendor documentation)
- [Azure Storage Account Keys Listed](https://github.com/panther-labs/panther-analysis/blob/develop/rules/azure_activity_rules/azure_storage_account_keys_listed.yml) (Panther): Storage account access keys were listed.
- [Azure Storage Account Key Regenerated](https://github.com/panther-labs/panther-analysis/blob/develop/rules/azure_activity_rules/azure_storage_account_key_regenerated.yml) (Panther): A storage account access key was regenerated.
- [Azure Storage Account Shared Key Access Enabled](https://github.com/panther-labs/panther-analysis/blob/develop/rules/azure_activity_rules/azure_storage_account_key_access_enabled.yml) (Panther): Shared key access was turned on for an existing storage account (allowSharedKeyAccess true).

### What to look for (analyst guidance)
- AccountKey requests from new IPs
- listKeys by an unusual principal

## Respond: how to revoke it
- Admin: **Regenerate key (RegenerateKey)**. Replaces an account key and revokes SAS signed with that key. Where: Storage account > Access keys > Rotate key; POST .../regenerateKey.

Regenerate the exposed key (and the other if unsure); or set AllowSharedKeyAccess=false. Live access ends on revocation: yes. Regenerating also revokes SAS signed with that key; dependent apps break.

## No vendor documentation found
- No whoami call for Shared Key or SAS.
- Whether Azure Activity Log records the service principal identity for ARM read calls made with azure-3/azure-4 tokens (Activity log typically skips reads).
- Exact Entra audit activity name for adding/removing a federated identity credential.
- Default of the Azure DevOps "IP Conditional Access policy validation on non-interactive flows" policy.
- Maximum Azure DevOps PAT lifetime when no tenant policy is set.
- Token format or prefix for storage keys, SAS, client secrets or Azure DevOps PATs.
- Whether app management policies require a specific license.

## Sources
- [Manage account access keys - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/common/storage-account-keys-manage) (retrieved 2026-10-14)
- [Authorize with Shared Key (REST API) - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storageservices/authorize-with-shared-key) (retrieved 2026-10-14)
- [Prevent authorization with Shared Key - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/common/shared-key-authorization-prevent) (retrieved 2026-10-14)
- [Azure Storage firewall rules and network access | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/common/storage-network-security) (retrieved 2026-10-14)
- [Azure Monitor Logs reference - StorageBlobLogs - Azure Monitor | Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/storagebloblogs) (retrieved 2026-10-14)
- [Storage Analytics logged operations and status messages](https://learn.microsoft.com/en-us/rest/api/storageservices/storage-analytics-logged-operations-and-status-messages) (retrieved 2026-10-14)
- [Storage Accounts - Regenerate Key - REST API (Azure Storage Resource Provider) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storagerp/storage-accounts/regenerate-key) (retrieved 2026-10-14)
- [Azure Blob Storage Monitoring Metrics and Logs Reference | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/blobs/monitor-blob-storage-reference) (retrieved 2026-10-14)
- [Monitor Azure Blob Storage | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/blobs/monitor-blob-storage) (retrieved 2026-10-14)
- [Azure permissions for Storage - Azure RBAC | Microsoft Learn](https://learn.microsoft.com/en-us/azure/role-based-access-control/permissions/storage) (retrieved 2026-10-14)
- [Activity Log in Azure Monitor - Azure Monitor | Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/platform/activity-log) (retrieved 2026-10-14)
- [List Containers (REST API) - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storageservices/list-containers2) (retrieved 2026-10-14)
- [List Blobs (REST API) - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storageservices/list-blobs) (retrieved 2026-10-14)
- [Get Blob (REST API) - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storageservices/get-blob) (retrieved 2026-10-14)
