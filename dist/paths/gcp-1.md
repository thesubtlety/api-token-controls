# Google Cloud: Service account keys (user-managed)

`gcp-1` · Signed JWT · service. A JSON (or P12) private key for a service account. The holder signs a JWT and exchanges it for an OAuth 2.0 access token, then calls Google APIs as the service account.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Cloud Asset Inventory supports iam.googleapis.com/ServiceAccountKey in its list/search/export APIs across an organization. | Where: Security > Asset Inventory > Resource search, filter asset type iam.googleapis.com/ServiceAccountKey; per SA: IAM & Admin > Service accounts > (SA) > Keys · API: GET https://cloudasset.googleapis.com/v1/{scope}:searchAllResources?assetTypes=iam.googleapis.com/ServiceAccountKey · Command: gcloud asset search-all-resources --scope=organizations/ORG_ID --asset-types=iam.googleapis.com/ServiceAccountKey |
| Protect: Admin can block or require approval | Yes | iam.managed.disableServiceAccountKeyCreation (legacy iam.disableServiceAccountKeyCreation); iam.managed.disableServiceAccountKeyUpload | iam.managed.disableServiceAccountKeyCreation (legacy iam.disableServiceAccountKeyCreation): Organization policies > constraint; gcloud resource-manager org-policies enable-enforce · iam.managed.disableServiceAccountKeyUpload: Organization policies |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | No IP list on the key itself. VPC Service Controls perimeters with ingress rules (by identity and IP) restrict API requests to protected services; services outside the perimeter are not covered. | VPC Service Controls: Security > VPC Service Controls |
| Protect: Expires automatically | Partial | Never expire by default; iam.serviceAccountKeyExpiryHours can set 1h-2160h (90 days) for new keys | Where: Organization policies > constraints/iam.serviceAccountKeyExpiryHours > Manage policy · Command: gcloud resource-manager org-policies allow constraints/iam.serviceAccountKeyExpiryHours 2160h --organization=ORG_ID |
| Detect: Usage appears in logs | Yes | protoPayload.authenticationInfo.serviceAccountKeyName, protoPayload.authenticationInfo.principalEmail, RequestMetadata.callerIp | Where: Logging > Logs Explorer, filter protoPayload.authenticationInfo.serviceAccountKeyName="//iam.googleapis.com/projects/P/serviceAccounts/SA/keys/KEY_ID"; per-key counts: Metrics Explorer > Service account key authentication events |
| Detect: Data reads appear in logs | Conditional | DATA_READ Data Access; off by default (BigQuery is on by default) | Where: IAM & Admin > Audit Logs > select service > Permission types: Data Read > Save; then Logs Explorer filter serviceAccountKeyName · API: Add auditConfigs {logType: DATA_READ} to the project/folder/org IAM policy (setIamPolicy) · Command: gcloud projects set-iam-policy PROJECT_ID policy.yaml |
| Respond: Revocation ends active access | Partial | Key deletion alone leaves minted tokens valid (up to 1h, or 12h if extended). | Disable the SA (cuts all tokens), then delete the key; rotate dependents. |
| Respond: Stops working when user is removed | N/A | Keys belong to a service account; access ends when the service account is disabled or deleted, not when a user leaves. |  |

## Protect: what an admin can configure

### Admin controls
- **iam.managed.disableServiceAccountKeyCreation (legacy iam.disableServiceAccountKeyCreation)** (Disable; all plans; default varies). Blocks creation of new service account keys and SA HMAC keys. Where: Organization policies > constraint; gcloud resource-manager org-policies enable-enforce.
- **iam.managed.disableServiceAccountKeyUpload** (Disable; all plans; default varies). Blocks uploading external public keys to service accounts. Where: Organization policies.
- **constraints/iam.serviceAccountKeyExpiryHours** (Limit lifetime; all plans; default off). Sets an expiry (1h to 2160h) for newly created SA keys. Where: Organization policies.
- **VPC Service Controls** (Limit network; all plans; default off). Service perimeters with ingress rules limit API access by network origin and identity, even with stolen credentials. Where: Security > VPC Service Controls.

### Not available (vendor states)
- Deleting a key does not revoke access tokens already minted from it.
- Keys never expire unless the expiry org policy is set.

- Network: conditional (checked at api_request). No IP list on the key itself. VPC Service Controls perimeters with ingress rules (by identity and IP) restrict API requests to protected services; services outside the perimeter are not covered.
- Lifetime: Never expire by default; iam.serviceAccountKeyExpiryHours can set 1h-2160h (90 days) for new keys. Renewal: Rotate by creating a new key and deleting the old one (up to 10 keys per SA).
- Keyless option: not_applicable. Keys authenticate the service account directly. Context-Aware Access policies 'apply only to users', so IdP/CAA conditions on human users do not gate key use. No doc states an SSO check on keys.
- Conditions: Org policies need an organization resource.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Cloud Audit Logs - Admin Activity: Always on; key create/delete/disable. _Required bucket keeps 400 days.
- Cloud Audit Logs - Data Access: Off by default except BigQuery; needed to see reads. _Default bucket 30 days.
- Cloud Monitoring 'Service account key authentication events': Usage metric per key.

### Fields that identify the credential
- `protoPayload.authenticationInfo.serviceAccountKeyName` (Cloud Audit Logs of called service): Full key resource name; missing for App Engine and Compute Engine.
- `protoPayload.authenticationInfo.principalEmail` (Cloud Audit Logs): The SA email.
- `RequestMetadata.callerIp` (Cloud Audit Logs): Caller IP.

### Lifecycle events
- create: `google.iam.admin.v1.CreateServiceAccountKey` Admin Activity
- revoke: `google.iam.admin.v1.DisableServiceAccountKey` Also emitted by gcp-compromised-key-response@system.gserviceaccount.com on auto-disable
- revoke: `google.iam.admin.v1.DeleteServiceAccountKey` 
- revoke: `google.iam.admin.v1.DisableServiceAccount` Kills minted tokens too

### Correlate on
`serviceAccountKeyName`, `principalEmail`, `callerIp`

### API calls a holder can make, and whether they are logged
- recon: `GET https://oauth2.googleapis.com/tokeninfo?access_token=ACCESS_TOKEN`. Token scopes, expiry, client Logged: unknown. Not covered by Cloud Audit Logs docs
- discovery (bulk): `GET https://cloudasset.googleapis.com/v1/{scope=*/*}:searchAllResources`. All resources visible to the SA Logged: plan (`google.cloud.asset.v1.AssetService.SearchAllResources`). ADMIN_READ Data Access log; off by default
- enumeration (bulk): `GET https://storage.googleapis.com/storage/v1/b`. Buckets in a project Logged: plan. Listing buckets is ADMIN_READ Data Access; off by default
- collection (bulk): `Cloud Storage object get/list`. Object data Logged: plan. DATA_READ Data Access; off by default (BigQuery is on by default)

### Public detection rules (community, not vendor documentation)
- [GCP.Iam.ServiceAccountKeys.Create](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gcp_audit_rules/gcp_iam_service_account_key_create.yml) (Panther): A granted iam.serviceAccountKeys.create permission check (service account key creation).
- [GCP Service Account or Keys Created](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gcp_audit_rules/gcp_service_account_or_keys_created.yml) (Panther): A user (not an automated workflow) created a service account or service account key.
- [Google Cloud Service Account Disabled or Deleted](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/gcp/audit/gcp_service_account_disabled_or_deleted.yml) (Sigma): A service account was disabled or deleted.
- [Google Cloud Service Account Modified](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/gcp/audit/gcp_service_account_modified.yml) (Sigma): A service account was created or patched.

### What to look for (analyst guidance)
- Key used from a new callerIp
- Auto-disable by gcp-compromised-key-response
- Key created then used from outside your network
- Key usage after long inactivity

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **iam.serviceAccountKeyExposureResponse**. Auto-disables SA keys and SA-bound API keys that Google detects as exposed. Where: Organization policies (DISABLE_KEY or WAIT_FOR_ABUSE).
- Admin: **Disable service account (serviceAccounts.disable)**. Immediately disables the SA, which is the documented way to cut off already-issued short-lived tokens. Where: IAM > Service accounts > Disable; POST .../serviceAccounts/SA_ID:disable.
- Admin: **Delete / disable service account key**. Stops the key from minting new tokens; tokens already minted stay valid until expiry. Where: IAM > Service accounts > Keys; DELETE .../keys/KEY_ID.

Disable the SA (cuts all tokens), then delete the key; rotate dependents. Live access ends on revocation: partial. Key deletion alone leaves minted tokens valid (up to 1h, or 12h if extended).

## No vendor documentation found
- SSO and MFA rules apply
- Retention beyond 400/30 days requires sinks
- Rate limits not checked
- Whether existing keys created before iam.serviceAccountKeyExpiryHours was set get an expiry (docs say 'newly created').
- Federated (STS) access token lifetime.
- Whether API keys support an expiry setting.
- Which audit field identifies the API key or HMAC access ID used on a data-plane request.
- Whether GetKeyString/lookupKey calls are logged for keys.lookupKey.
- Plan/pricing for VPC Service Controls (needs organization).

## Sources
- [Create and delete service account keys](https://cloud.google.com/iam/docs/keys-create-delete) (retrieved 2026-10-14)
- [Examples of audit logs for service accounts](https://cloud.google.com/iam/docs/audit-logging/examples-service-accounts) (retrieved 2026-10-14)
- [Service account credentials](https://cloud.google.com/iam/docs/service-account-creds) (retrieved 2026-10-14)
- [Set up Context-Aware Access](https://cloud.google.com/beyondcorp-enterprise/docs/securing-console-and-apis) (retrieved 2026-10-14)
- [Set session length for Google Cloud services](https://support.google.com/a/answer/9368756) (retrieved 2026-10-14)
- [Overview of VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs/overview) (retrieved 2026-10-14)
- [Best practices for managing service account keys](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys) (retrieved 2026-10-14)
- [Restricting service account usage](https://cloud.google.com/resource-manager/docs/organization-policy/restricting-service-accounts) (retrieved 2026-10-14)
- [Respond to compromised Google Cloud credentials](https://docs.cloud.google.com/docs/security/compromised-credentials) (retrieved 2026-10-14)
- [Asset types - Cloud Asset Inventory](https://cloud.google.com/asset-inventory/docs/supported-asset-types) (retrieved 2026-10-14)
- [Search resources | Cloud Asset Inventory](https://cloud.google.com/asset-inventory/docs/search-resources) (retrieved 2026-10-14)
- [List and get service account keys](https://cloud.google.com/iam/docs/keys-list-get) (retrieved 2026-10-14)
- [Monitor usage patterns for service accounts and keys](https://cloud.google.com/iam/docs/service-account-monitoring) (retrieved 2026-10-14)
- [View logs by using the Logs Explorer](https://cloud.google.com/logging/docs/view/logs-explorer-interface) (retrieved 2026-10-14)
- [Enable Data Access audit logs](https://cloud.google.com/logging/docs/audit/configure-data-access) (retrieved 2026-10-14)
- [IAM audit logging](https://cloud.google.com/iam/docs/audit-logging) (retrieved 2026-10-14)
- [Cloud Audit Logs overview](https://cloud.google.com/logging/docs/audit) (retrieved 2026-10-14)
- [Cloud Logging quotas and limits](https://cloud.google.com/logging/quotas) (retrieved 2026-10-14)
- [Disable and enable service accounts](https://cloud.google.com/iam/docs/service-accounts-disable-enable) (retrieved 2026-10-14)
- [Token types](https://cloud.google.com/docs/authentication/token-types) (retrieved 2026-10-14)
- [Method: searchAllResources](https://cloud.google.com/asset-inventory/docs/reference/rest/v1/TopLevel/searchAllResources) (retrieved 2026-10-14)
- [Cloud Asset Inventory audit logging](https://cloud.google.com/asset-inventory/docs/audit-logging) (retrieved 2026-10-14)
- [Buckets: list](https://cloud.google.com/storage/docs/json_api/v1/buckets/list) (retrieved 2026-10-14)
- [Cloud Storage audit logging](https://cloud.google.com/storage/docs/audit-logging) (retrieved 2026-10-14)
