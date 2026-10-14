# Google Cloud: Workload Identity Federation

`gcp-3` · Federated identity · service. An external workload (AWS, Azure, GitHub, other OIDC/SAML IdP) sends its IdP token to the Security Token Service and gets a federated token, used directly on resources or to impersonate a service account.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Pools and providers are listable org-wide in Cloud Asset Inventory; issued federated tokens are not. | Where: IAM & Admin > Workload Identity Federation (Workload Identity Pools page); org-wide: Asset Inventory search for iam.googleapis.com/WorkloadIdentityPool and WorkloadIdentityPoolProvider · API: projects.locations.workloadIdentityPools.providers.list() · Command: gcloud iam workload-identity-pools list --location=global; gcloud iam workload-identity-pools providers list --workload-identity-pool=POOL --location=global |
| Protect: Admin can block or require approval | Yes | constraints/iam.workloadIdentityPoolProviders (Deny All) | Where: Organization policies > constraints/iam.workloadIdentityPoolProviders > Manage policy (Deny all or list allowed issuer URIs) · Command: gcloud resource-manager org-policies allow constraints/iam.workloadIdentityPoolProviders ISSUER_URI --organization=ORG_ID |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | VPC Service Controls perimeters only; no IP setting on the pool itself was found. | VPC Service Controls: Security > VPC Service Controls |
| Protect: Expires automatically | Yes | Federated bearer tokens valid up to 1 hour | API: POST https://sts.googleapis.com/v1/token returns expires_in (seconds until the federated token expires) |
| Detect: Usage appears in logs | Yes | protoPayload.authenticationInfo.principalSubject, protoPayload.metadata.mapped_principal | Where: Enable Data Access for Security Token Service API (IAM & Admin > Audit Logs); Logs Explorer: protoPayload.serviceName="sts.googleapis.com" protoPayload.methodName="google.identity.sts.v1.SecurityTokenService.ExchangeToken", read principalSubject |
| Detect: Data reads appear in logs | Yes | GET https://storage.googleapis.com/storage/v1/b/BUCKET/o (objects.list) | Where: Enable Data Read for Cloud Storage (IAM & Admin > Audit Logs); Logs Explorer: protoPayload.serviceName="storage.googleapis.com", filter on the federated principal or impersonated SA |
| Respond: Revocation ends active access | Partial | Disabling the pool blocks existing tokens (until re-enabled); disabling a provider only stops new exchanges and existing tokens keep working. Tokens from impersonated service accounts need separate action. | Where: Workload Identity Pools > (pool) > Status toggle > Disable (provider: same on provider details); also disable any impersonated SA · API: projects.locations.workloadIdentityPools.patch() (and providers.patch) with disabled=true · Command: gcloud iam workload-identity-pools update POOL --location=global --disabled; gcloud iam workload-identity-pools providers update-oidc PROVIDER --workload-identity-pool=POOL --location=global --disabled |
| Respond: Stops working when user is removed | N/A | Credentials come from external workloads' federated identities, not Google user accounts. |  |

## Protect: what an admin can configure

### Admin controls
- **constraints/iam.workloadIdentityPoolProviders** (Limit scope; all plans; default off). Allow-lists which external IdP issuers can be configured. Where: Organization policies.
- **constraints/iam.workloadIdentityPoolAwsAccounts** (Limit scope; all plans; default off). Allow-lists which AWS accounts can federate. Where: Organization policies.
- **Attribute conditions** (Limit scope; all plans; default off). CEL condition on the provider limits which external tokens (e.g. which GitHub org) can be exchanged. Where: Workload identity pool provider > attributeCondition.
- **VPC Service Controls** (Limit network; all plans; default off). Service perimeters with ingress rules limit API access by network origin and identity, even with stolen credentials. Where: Security > VPC Service Controls.
- **constraints/iam.workloadIdentityPoolProviders (Deny All)** (Disable; all plans; default off). Org policy rule set to Deny All blocks creating new workload identity pool providers; exceptions can allow trusted providers per project. Same constraint as the existing limit_scope entry, used as a block. Where: Organization policy: constraints/iam.workloadIdentityPoolProviders.

- Network: conditional (checked at api_request). VPC Service Controls perimeters only; no IP setting on the pool itself was found.
- Lifetime: Federated bearer tokens valid up to 1 hour. Renewal: Workload re-exchanges its IdP credential.
- Keyless option: supported. Trust is based on the external IdP token plus provider attribute conditions; no Google user SSO is involved.
- Conditions: Org policies need an organization resource.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Data Access logs for STS API and IAM API (Admin Read): Must be enabled to log exchanges.

### Fields that identify the credential
- `protoPayload.authenticationInfo.principalSubject` (data_access): External subject (AWS ARN, Azure object ID, OIDC sub)
- `protoPayload.metadata.mapped_principal` (data_access): principal:// identifier

### Lifecycle events
- use: `google.identity.sts.v1.SecurityTokenService.ExchangeToken` Token exchange
- use: `GenerateAccessToken` When impersonating an SA

### Correlate on
`principalSubject`, `mapped_principal`, `google.subject mapping`

### API calls a holder can make, and whether they are logged
- recon: `POST https://sts.googleapis.com/v1/token`. Federated token for the external identity Logged: plan (`google.identity.sts.v1.SecurityTokenService.ExchangeToken`). Needs STS Admin Read Data Access logs
- collection: `GET https://storage.googleapis.com/storage/v1/b/BUCKET/o (objects.list)`. Object names and metadata in a bucket Logged: yes. DATA_READ Data Access audit log; off by default.

### Public detection rules (community, not vendor documentation)
- [GCP Workload Identity Pool Created or Updated](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gcp_audit_rules/gcp_workload_identity_pool_created_or_updated.yml) (Panther): A workload identity pool provider was created or updated.

### What to look for (analyst guidance)
- Exchanges from unexpected GitHub org/repo or AWS account
- Provider without attribute condition on a multi-tenant IdP

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **Disable service account (serviceAccounts.disable)**. Immediately disables the SA, which is the documented way to cut off already-issued short-lived tokens. Where: IAM > Service accounts > Disable; POST .../serviceAccounts/SA_ID:disable.
- Admin: **Disable / delete workload identity pool**. Disabling or deleting the pool stops its identities from accessing Google Cloud. Where: IAM > Workload Identity Pools > Status toggle / Delete.

Disable the provider or pool; tighten attribute condition; disable impersonated SA to kill live tokens. Live access ends on revocation: partial. Disabling the pool blocks existing tokens (until re-enabled); disabling a provider only stops new exchanges and existing tokens keep working. Tokens from impersonated service accounts need separate action.

## No vendor documentation found
- SSO and MFA rules apply
- Whether disabling a pool invalidates tokens already issued
- Other calls same as gcp-2 after impersonation
- Whether existing keys created before iam.serviceAccountKeyExpiryHours was set get an expiry (docs say 'newly created').
- Federated (STS) access token lifetime.
- Whether API keys support an expiry setting.
- Which audit field identifies the API key or HMAC access ID used on a data-plane request.
- Whether GetKeyString/lookupKey calls are logged for keys.lookupKey.
- Plan/pricing for VPC Service Controls (needs organization).

## Sources
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation) (retrieved 2026-10-14)
- [Method: token (STS)](https://cloud.google.com/iam/docs/reference/sts/rest/v1/TopLevel/token) (retrieved 2026-10-14)
- [Best practices for using Workload Identity Federation](https://cloud.google.com/iam/docs/best-practices-for-using-workload-identity-federation) (retrieved 2026-10-14)
- [Overview of VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs/overview) (retrieved 2026-10-14)
- [Respond to compromised Google Cloud credentials](https://docs.cloud.google.com/docs/security/compromised-credentials) (retrieved 2026-10-14)
- [Restricting service account usage](https://cloud.google.com/resource-manager/docs/organization-policy/restricting-service-accounts) (retrieved 2026-10-14)
- [Manage workload identity pools and providers](https://cloud.google.com/iam/docs/manage-workload-identity-pools-providers) (retrieved 2026-10-14)
- [Asset types - Cloud Asset Inventory](https://cloud.google.com/asset-inventory/docs/supported-asset-types) (retrieved 2026-10-14)
- [Search resources | Cloud Asset Inventory](https://cloud.google.com/asset-inventory/docs/search-resources) (retrieved 2026-10-14)
- [Enable Data Access audit logs](https://cloud.google.com/logging/docs/audit/configure-data-access) (retrieved 2026-10-14)
- [Security Token Service audit logging](https://cloud.google.com/iam/docs/audit-logging/audit-logging-sts) (retrieved 2026-10-14)
- [Example logs for Workload Identity Federation](https://cloud.google.com/iam/docs/audit-logging/examples-workload-identity) (retrieved 2026-10-14)
- [View logs by using the Logs Explorer](https://cloud.google.com/logging/docs/view/logs-explorer-interface) (retrieved 2026-10-14)
- [Cloud Storage audit logging](https://cloud.google.com/storage/docs/audit-logging) (retrieved 2026-10-14)
- [gcloud iam workload-identity-pools update](https://cloud.google.com/sdk/gcloud/reference/iam/workload-identity-pools/update) (retrieved 2026-10-14)
- [gcloud iam workload-identity-pools providers update-oidc](https://cloud.google.com/sdk/gcloud/reference/iam/workload-identity-pools/providers/update-oidc) (retrieved 2026-10-14)
- [Disable and enable service accounts](https://cloud.google.com/iam/docs/service-accounts-disable-enable) (retrieved 2026-10-14)
- [REST Resource: projects.locations.workloadIdentityPools](https://cloud.google.com/iam/docs/reference/rest/v1/projects.locations.workloadIdentityPools) (retrieved 2026-10-14)
- [REST Resource: projects.locations.workloadIdentityPools.providers](https://cloud.google.com/iam/docs/reference/rest/v1/projects.locations.workloadIdentityPools.providers) (retrieved 2026-10-14)
- [Objects: list](https://cloud.google.com/storage/docs/json_api/v1/objects/list) (retrieved 2026-10-14)
- [Create and delete service account keys](https://cloud.google.com/iam/docs/keys-create-delete) (retrieved 2026-10-14)
