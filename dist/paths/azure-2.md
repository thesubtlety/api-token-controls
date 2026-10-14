# Microsoft Azure: Shared access signatures (SAS): account SAS, service SAS, user delegation SAS

`azure-2` · HMAC · person or service. Signed URL token. Account and service SAS are signed with an account key; user delegation SAS is signed with a user delegation key obtained with Entra credentials (Blob only). Anyone holding the SAS can use it.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Not available | SAS tokens are generated client-side and Azure Storage does not track them. |  |
| Protect: Admin can block or require approval | Yes | Allow storage account key access (AllowSharedKeyAccess = false); Azure Policy: Storage accounts should prevent shared key access | Allow storage account key access (AllowSharedKeyAccess = false): Storage account > Configuration > Allow storage account key access; ARM property allowSharedKeyAccess · Azure Policy: Storage accounts should prevent shared key access: Azure Policy assignment |
| Protect: SSO and MFA rules apply | Partial | A user delegation SAS is secured with Entra credentials; account and service SAS are signed with Shared Key, which Conditional Access does not cover unless Shared Key is disallowed. | Where: Storage account > Settings > Configuration > Allow storage account key access = Disabled (leaves only Entra-backed user delegation SAS) · Command: az storage account update --name <account> --resource-group <rg> --allow-shared-key-access false |
| Protect: IP restriction | Yes | Optional signed IP (sip) in the SAS plus the storage firewall; the SAS IP cannot grant access beyond firewall rules. | Storage firewall network rules: Storage account > Networking |
| Protect: Expires automatically | Yes | Expiry set by creator; user delegation key max 7 days; SAS expiration policy can Log or Block over-long SAS | SAS expiration policy (Log / Block): Storage account > Configuration > SAS expiration; -SasExpirationPeriod / -SasExpirationAction |
| Detect: Usage appears in logs | Yes | AuthenticationHash, SasExpiryStatus | Where: Log Analytics (after diagnostic setting): StorageBlobLogs / where AuthenticationType == "SAS"; AuthenticationHash identifies the SAS |
| Detect: Data reads appear in logs | Conditional | Same. | Where: Log Analytics: StorageBlobLogs / where AuthenticationType == "SAS" and OperationName == "GetBlob" |
| Respond: Revocation ends active access | Yes | User delegation revocation may be delayed by caching. | Where: Account/service SAS: Storage account > Security + networking > Access keys > Regenerate the signing key, or change/delete the stored access policy. User delegation SAS: revoke delegation keys · API: POST https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Storage/storageAccounts/{accountName}/revokeUserDelegationKeys · Command: az storage account revoke-delegation-keys --name <account> --resource-group <rg> |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Allow storage account key access (AllowSharedKeyAccess = false)** (Disable; all plans; default on). Rejects all requests authorized with account keys, including account and service SAS; user delegation SAS still works. Where: Storage account > Configuration > Allow storage account key access; ARM property allowSharedKeyAccess.
- **Azure Policy: Storage accounts should prevent shared key access** (Disable; all plans; default off). Audits or prevents storage accounts that permit Shared Key authorization. Where: Azure Policy assignment.
- **Storage firewall network rules** (Limit network; all plans; default off). Limits which IPs, VNets and resource instances can reach the account endpoint. Where: Storage account > Networking.
- **SAS expiration policy (Log / Block)** (Limit lifetime; all plans; default off). Sets a recommended max SAS interval for service and account SAS; Block denies out-of-policy SAS, default Log allows them. Where: Storage account > Configuration > SAS expiration; -SasExpirationPeriod / -SasExpirationAction.

### Not available (vendor states)
- Azure does not track issued SAS tokens, so there is no inventory or per-token revoke for account SAS.

- Network: supported (checked at api_request). Optional signed IP (sip) in the SAS plus the storage firewall; the SAS IP cannot grant access beyond firewall rules.
- Lifetime: Expiry set by creator; user delegation key max 7 days; SAS expiration policy can Log or Block over-long SAS. Renewal: Generate a new SAS client-side.
- Keyless option: limited. Account/service SAS rely on Shared Key and bypass Entra; user delegation SAS is authorized with Entra credentials and still works when Shared Key is disabled.
- Conditions: Stored access policies not supported for account or user delegation SAS.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Azure Storage resource logs (StorageBlobLogs): Data-plane requests incl. AuthenticationType and AuthenticationHash; not collected until a diagnostic setting routes them.

### Fields that identify the credential
- `AuthenticationHash` (StorageBlobLogs): Key used plus SasSignature hash.
- `SasExpiryStatus` (Storage resource logs): Flags out-of-policy SAS.

### Lifecycle events
No docs found.

### Correlate on
`AuthenticationHash SasSignature`, `CallerIpAddress`

### API calls a holder can make, and whether they are logged
- discovery (bulk): `GET https://{account}.blob.core.windows.net/?comp=list`. All containers Logged: plan. StorageBlobLogs only if diagnostic setting configured.
- enumeration (bulk): `GET https://{account}.blob.core.windows.net/{container}?restype=container&comp=list`. Blob names Logged: plan. Same.
- collection (bulk): `GET https://{account}.blob.core.windows.net/{container}/{blob}`. Blob contents Logged: plan. Same.

### Public detection rules (community, not vendor documentation)
- [Azure Storage SAS Token Access from External IP](https://github.com/panther-labs/panther-analysis/blob/develop/rules/azure_activity_rules/azure_storage_sas_external_access.yml) (Panther): Successful storage requests signed with a SAS token (sig= in the URI) from a public IP.
- [Azure VM Disk SAS URI Generated](https://github.com/panther-labs/panther-analysis/blob/develop/rules/azure_activity_rules/azure_vm_disk_sas_uri_generated.yml) (Panther): A SAS URI was generated for a managed disk (download access to disk contents).

### What to look for (analyst guidance)
- AuthenticationType SAS from unknown IP
- SasExpiryStatus entries

## Respond: how to revoke it
- Admin: **Regenerate key (RegenerateKey)**. Replaces an account key and revokes SAS signed with that key. Where: Storage account > Access keys > Rotate key; POST .../regenerateKey.
- Admin: **Stored access policy**. Service SAS bound to a stored access policy can be revoked by changing or deleting the policy. Where: Container/share/queue/table ACL operation.
- Admin: **Revoke user delegation keys**. Revokes all user delegation keys for the account, invalidating every user delegation SAS. Where: az storage account revoke-delegation-keys.

Account/service SAS: regenerate signing key or change stored access policy. User delegation SAS: revoke-delegation-keys. Or disallow Shared Key. Live access ends on revocation: yes. User delegation revocation may be delayed by caching.

## No vendor documentation found
- Stops working when user is removed
- Creation of a SAS is client-side and not logged.
- No whoami call for Shared Key or SAS.
- Whether Azure Activity Log records the service principal identity for ARM read calls made with azure-3/azure-4 tokens (Activity log typically skips reads).
- Exact Entra audit activity name for adding/removing a federated identity credential.
- Default of the Azure DevOps "IP Conditional Access policy validation on non-interactive flows" policy.
- Maximum Azure DevOps PAT lifetime when no tenant policy is set.
- Token format or prefix for storage keys, SAS, client secrets or Azure DevOps PATs.
- Whether app management policies require a specific license.

## Sources
- [Prevent authorization with Shared Key - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/common/shared-key-authorization-prevent) (retrieved 2026-10-14)
- [Grant limited access to data with shared access signatures (SAS) - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview) (retrieved 2026-10-14)
- [Azure Storage firewall rules and network access | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/common/storage-network-security) (retrieved 2026-10-14)
- [Configure an expiration policy for shared access signatures (SAS) - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/common/sas-expiration-policy) (retrieved 2026-10-14)
- [Create a user delegation SAS - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storageservices/create-user-delegation-sas) (retrieved 2026-10-14)
- [Azure Monitor Logs reference - StorageBlobLogs - Azure Monitor | Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/storagebloblogs) (retrieved 2026-10-14)
- [Storage Analytics logged operations and status messages](https://learn.microsoft.com/en-us/rest/api/storageservices/storage-analytics-logged-operations-and-status-messages) (retrieved 2026-10-14)
- [Manage account access keys - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/common/storage-account-keys-manage) (retrieved 2026-10-14)
- [Use Azure CLI to create a user delegation SAS for a container or blob - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-user-delegation-sas-create-cli) (retrieved 2026-10-14)
- [Storage Accounts - Revoke User Delegation Keys](https://learn.microsoft.com/en-us/rest/api/storagerp/storage-accounts/revoke-user-delegation-keys) (retrieved 2026-10-14)
- [Azure Blob Storage Monitoring Metrics and Logs Reference | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/blobs/monitor-blob-storage-reference) (retrieved 2026-10-14)
- [Monitor Azure Blob Storage | Microsoft Learn](https://learn.microsoft.com/en-us/azure/storage/blobs/monitor-blob-storage) (retrieved 2026-10-14)
- [List Containers (REST API) - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storageservices/list-containers2) (retrieved 2026-10-14)
- [List Blobs (REST API) - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storageservices/list-blobs) (retrieved 2026-10-14)
- [Get Blob (REST API) - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storageservices/get-blob) (retrieved 2026-10-14)
- [Storage Accounts - Regenerate Key - REST API (Azure Storage Resource Provider) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storagerp/storage-accounts/regenerate-key) (retrieved 2026-10-14)
- [Define a stored access policy - Azure Storage | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storageservices/define-stored-access-policy) (retrieved 2026-10-14)
