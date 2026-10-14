# Google Cloud: Short-lived service account credentials (service account impersonation)

`gcp-2` · OAuth · service. A principal with the Service Account Token Creator role calls the IAM Credentials API (generateAccessToken, generateIdToken, signJwt) to mint a short-lived token for a service account.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Only via VPC Service Controls perimeters on supported services. | VPC Service Controls: Security > VPC Service Controls |
| Protect: Expires automatically | Yes | 1 hour; up to 12 hours with iam.allowServiceAccountCredentialLifetimeExtension | Where: Organization policies > constraints/iam.allowServiceAccountCredentialLifetimeExtension > Manage policy (list SAs allowed up to 12h) · Command: gcloud resource-manager org-policies allow constraints/iam.allowServiceAccountCredentialLifetimeExtension SA_EMAIL --organization=ORG_ID |
| Detect: Usage appears in logs | Yes | protoPayload.authenticationInfo.principalEmail, resource.labels.email_id, serviceAccountDelegationInfo | Where: Enable Data Access (Admin Read) for IAM Service Account Credentials API under IAM & Admin > Audit Logs; then Logs Explorer: protoPayload.serviceName="iamcredentials.googleapis.com" protoPayload.methodName="GenerateAccessToken" |
| Detect: Data reads appear in logs | Yes | GET https://storage.googleapis.com/storage/v1/b/BUCKET/o (objects.list) | Where: Enable Data Read for Cloud Storage (IAM & Admin > Audit Logs); Logs Explorer: protoPayload.serviceName="storage.googleapis.com" and protoPayload.authenticationInfo.principalEmail=SA_EMAIL |
| Respond: Revocation ends active access | Yes | Disabling the SA is the documented kill for short-lived credentials. | Where: IAM & Admin > Service accounts > (SA) > Service account status > Disable service account; remove Token Creator grants on the SA · API: POST https://iam.googleapis.com/v1/projects/PROJECT_ID/serviceAccounts/SA_ID:disable · Command: gcloud iam service-accounts disable SA_EMAIL; gcloud iam service-accounts remove-iam-policy-binding SA_EMAIL --member=PRINCIPAL --role=roles/iam.serviceAccountTokenCreator |
| Respond: Stops working when user is removed | N/A | The token is issued for a service account, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **constraints/iam.allowServiceAccountCredentialLifetimeExtension** (Limit lifetime; all plans; default off). Lists SAs allowed to mint tokens longer than 1 hour (up to 12 hours). Where: Organization policies.
- **Service Account Token Creator role** (Limit scope; all plans; default off). Only principals granted this role on an SA can mint its short-lived tokens. Where: IAM policy on the service account.
- **VPC Service Controls** (Limit network; all plans; default off). Service perimeters with ingress rules limit API access by network origin and identity, even with stolen credentials. Where: Security > VPC Service Controls.

### Not available (vendor states)
- Issued short-lived tokens cannot be revoked individually; only disabling/deleting the SA cuts them off.

- Network: conditional (checked at api_request). Only via VPC Service Controls perimeters on supported services.
- Lifetime: 1 hour; up to 12 hours with iam.allowServiceAccountCredentialLifetimeExtension. Renewal: Caller mints a new token while it still holds the Token Creator permission.
- Keyless option: limited. The caller authenticates first (user, SA or federated identity), so the caller's own login controls apply at minting time. The minted SA token is then used without user CAA checks.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- IAM Data Access audit logs (iamcredentials.googleapis.com): Must be enabled; records each token mint.

### Fields that identify the credential
- `protoPayload.authenticationInfo.principalEmail` (data_access): Who minted the token
- `resource.labels.email_id` (data_access): SA the token was minted for
- `serviceAccountDelegationInfo` (Audit logs of called services): Delegation chain on some services

### Lifecycle events
- create: `GenerateAccessToken` serviceName iamcredentials.googleapis.com; Data Access only

### Correlate on
`principalEmail`, `resource.labels.email_id`

### API calls a holder can make, and whether they are logged
- recon: `POST https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/PRIV_SA:generateAccessToken`. Whether caller can impersonate the SA Logged: plan (`GenerateAccessToken`). Data Access log; must be enabled
- discovery (bulk): `GET https://cloudasset.googleapis.com/v1/{scope=*/*}:searchAllResources`. Resources visible to the SA Logged: plan (`google.cloud.asset.v1.AssetService.SearchAllResources`). ADMIN_READ Data Access
- collection: `GET https://storage.googleapis.com/storage/v1/b/BUCKET/o (objects.list)`. Object names and metadata in a bucket Logged: yes. Listing objects is a DATA_READ Data Access audit log entry; Data Access logs are off by default and must be enabled.

### Public detection rules (community, not vendor documentation)
- [Google Cloud Service Account Disabled or Deleted](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/gcp/audit/gcp_service_account_disabled_or_deleted.yml) (Sigma): A service account was disabled or deleted.
- [Google Cloud Service Account Modified](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/gcp/audit/gcp_service_account_modified.yml) (Sigma): A service account was created or patched.
- [GCP Permissions Granted to Create or Manage Service Account Key](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gcp_audit_rules/gcp_permissions_granted_to_create_or_manage_service_account_key.yml) (Panther): SetIamPolicy adding Service Account Token Creator or Service Account User, which allows impersonation.
- [GCP IAM serviceAccounts getAccessToken Privilege Escalation](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gcp_audit_rules/gcp_iam_service_accounts_get_access_token_privilege_escalation.yml) (Panther): A granted iam.serviceAccounts.getAccessToken permission check (minting a service account access token).
- [GCP IAM serviceAccounts.signJwt Privilege Escalation](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gcp_audit_rules/gcp_iam_serviceaccounts_signjwt.yml) (Panther): SignJwt calls with granted iam.serviceAccounts.signJwt, used to mint tokens as a service account.
- [GCP IAM serviceAccounts signBlob](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gcp_audit_rules/gcp_iam_service_accounts_sign_blob.yml) (Panther): A granted iam.serviceAccounts.signBlob permission check, which can be used to get a service account token.

### What to look for (analyst guidance)
- New principal minting tokens for a privileged SA
- Token Creator role granted unexpectedly

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **Disable service account (serviceAccounts.disable)**. Immediately disables the SA, which is the documented way to cut off already-issued short-lived tokens. Where: IAM > Service accounts > Disable; POST .../serviceAccounts/SA_ID:disable.

Remove Token Creator bindings; disable the SA to kill live tokens. Live access ends on revocation: yes. Disabling the SA is the documented kill for short-lived credentials.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- Whether existing keys created before iam.serviceAccountKeyExpiryHours was set get an expiry (docs say 'newly created').
- Federated (STS) access token lifetime.
- Whether API keys support an expiry setting.
- Which audit field identifies the API key or HMAC access ID used on a data-plane request.
- Whether GetKeyString/lookupKey calls are logged for keys.lookupKey.
- Plan/pricing for VPC Service Controls (needs organization).

## Sources
- [Create short-lived credentials for a service account](https://cloud.google.com/iam/docs/create-short-lived-credentials-direct) (retrieved 2026-10-14)
- [Service account credentials](https://cloud.google.com/iam/docs/service-account-creds) (retrieved 2026-10-14)
- [Set up Context-Aware Access](https://cloud.google.com/beyondcorp-enterprise/docs/securing-console-and-apis) (retrieved 2026-10-14)
- [Examples of audit logs for service accounts](https://cloud.google.com/iam/docs/audit-logging/examples-service-accounts) (retrieved 2026-10-14)
- [Overview of VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs/overview) (retrieved 2026-10-14)
- [Restricting service account usage](https://cloud.google.com/resource-manager/docs/organization-policy/restricting-service-accounts) (retrieved 2026-10-14)
- [Create and delete service account keys](https://cloud.google.com/iam/docs/keys-create-delete) (retrieved 2026-10-14)
- [Enable Data Access audit logs](https://cloud.google.com/logging/docs/audit/configure-data-access) (retrieved 2026-10-14)
- [Service Account Credentials API audit logging](https://cloud.google.com/iam/docs/audit-logging/audit-logging-iamcreds) (retrieved 2026-10-14)
- [Cloud Storage audit logging](https://cloud.google.com/storage/docs/audit-logging) (retrieved 2026-10-14)
- [View logs by using the Logs Explorer](https://cloud.google.com/logging/docs/view/logs-explorer-interface) (retrieved 2026-10-14)
- [Disable and enable service accounts](https://cloud.google.com/iam/docs/service-accounts-disable-enable) (retrieved 2026-10-14)
- [Manage access to service accounts](https://cloud.google.com/iam/docs/manage-access-service-accounts) (retrieved 2026-10-14)
- [Best practices for using Workload Identity Federation](https://cloud.google.com/iam/docs/best-practices-for-using-workload-identity-federation) (retrieved 2026-10-14)
- [Method: searchAllResources](https://cloud.google.com/asset-inventory/docs/reference/rest/v1/TopLevel/searchAllResources) (retrieved 2026-10-14)
- [Cloud Asset Inventory audit logging](https://cloud.google.com/asset-inventory/docs/audit-logging) (retrieved 2026-10-14)
- [Objects: list](https://cloud.google.com/storage/docs/json_api/v1/objects/list) (retrieved 2026-10-14)
