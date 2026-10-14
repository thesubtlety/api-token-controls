# Google Cloud: Cloud Storage HMAC keys

`gcp-5` · HMAC · person or service. Access ID + secret used to sign Cloud Storage XML API requests (S3-compatible). Usually tied to a service account; user-account HMAC keys also exist.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | HMAC keys are listed per project (gcloud storage hmac list / ListHmacKeys); HMAC keys are not in the Cloud Asset Inventory asset type list. | HMAC keys are listed per project (gcloud storage hmac list / ListHmacKeys); HMAC keys are not in the Cloud Asset Inventory asset type list. |
| Protect: Admin can block or require approval | Yes | iam.managed.disableServiceAccountKeyCreation (legacy iam.disableServiceAccountKeyCreation); constraints/storage.restrictAuthTypes | iam.managed.disableServiceAccountKeyCreation (legacy iam.disableServiceAccountKeyCreation): Organization policies > constraint; gcloud resource-manager org-policies enable-enforce · constraints/storage.restrictAuthTypes: Organization policies |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | No per-key IP list found. VPC Service Controls can restrict Cloud Storage access by network. | VPC Service Controls: Security > VPC Service Controls |
| Protect: Expires automatically | No docs found | No expiry documented on fetched pages; valid until deactivated or deleted |  |
| Detect: Usage appears in logs | Yes | unknown | Where: Metrics Explorer: storage.googleapis.com/authn/authentication_count grouped by access_id; key admin events in Logs Explorer: protoPayload.serviceName="storage.googleapis.com" |
| Detect: Data reads appear in logs | Conditional | DATA_READ Data Access; off by default | Where: Enable Data Read for Cloud Storage (IAM & Admin > Audit Logs); Logs Explorer: protoPayload.serviceName="storage.googleapis.com" (object get/list) · Command: gcloud projects set-iam-policy PROJECT_ID policy.yaml (auditConfigs DATA_READ for storage.googleapis.com) |
| Respond: Revocation ends active access | Yes | Deleted HMAC keys are immediately invalid. | Set the key INACTIVE, then delete it. |
| Respond: Stops working when user is removed | Yes | Deleting the account deletes its HMAC keys, and docs warn user-account keys break when the user is disabled after leaving. | Where: Google Admin console > Directory > Users > (user) > More options > Delete user (deleting the account deletes its HMAC keys) · API: DELETE https://admin.googleapis.com/admin/directory/v1/users/{userKey} |

## Protect: what an admin can configure

### Admin controls
- **iam.managed.disableServiceAccountKeyCreation (legacy iam.disableServiceAccountKeyCreation)** (Disable; all plans; default varies). Blocks creation of new service account keys and SA HMAC keys. Where: Organization policies > constraint; gcloud resource-manager org-policies enable-enforce.
- **constraints/storage.restrictAuthTypes** (Disable; all plans; default off). Rejects user-account and/or service-account HMAC-signed requests to Cloud Storage. Where: Organization policies.
- **VPC Service Controls** (Limit network; all plans; default off). Service perimeters with ingress rules limit API access by network origin and identity, even with stolen credentials. Where: Security > VPC Service Controls.

- Network: conditional (checked at api_request). No per-key IP list found. VPC Service Controls can restrict Cloud Storage access by network.
- Lifetime: No expiry documented on fetched pages; valid until deactivated or deleted. Renewal: Rotate by creating a new key, updating clients, then deleting the old key.
- Keyless option: not_applicable. Signed requests carry no IdP session. No doc ties HMAC use to SSO or CAA.
- Conditions: Org policies need an organization resource.

## Detect: what gets logged
- Token prefix: `GOOG`

### Logs
- Cloud Storage Admin Activity logs: HMAC key create/delete/update.
- Cloud Storage Data Access logs: Object reads (DATA_READ); off by default.

### Fields that identify the credential
- `unknown` (Cloud Storage audit logs): Field carrying the HMAC access ID not found in fetched docs.

### Lifecycle events
- create: `Creating HMAC keys` Operation label in Storage audit log table; exact methodName not listed
- revoke: `Updating HMAC keys` State change to INACTIVE
- revoke: `Deleting HMAC keys` 

### Correlate on
`access ID`, `service account email`

### API calls a holder can make, and whether they are logged
- collection (bulk): `Cloud Storage XML API object GET/list (HMAC-signed)`. Object data Logged: plan. DATA_READ Data Access; off by default

### Public detection rules (community, not vendor documentation)
- [GCP storage hmac keys create](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gcp_audit_rules/gcp_storage_hmac_keys_create.yml) (Panther): A granted storage.hmacKeys.create permission check (Cloud Storage HMAC key creation).

### What to look for (analyst guidance)
- New HMAC key on a privileged SA
- XML API bulk object reads

## Respond: how to revoke it
- Admin: **Deactivate / delete HMAC key**. Set the key INACTIVE or delete it; deleted keys are invalid immediately. Where: Cloud Storage > Settings > Interoperability; hmacKeys update/delete.

Set the key INACTIVE, then delete it. Live access ends on revocation: yes. Deleted HMAC keys are immediately invalid.

## No vendor documentation found
- SSO and MFA rules apply
- Expires automatically
- Exact methodName strings for HMAC events
- Whether HMAC access ID appears in the Data Access log entry
- Whether existing keys created before iam.serviceAccountKeyExpiryHours was set get an expiry (docs say 'newly created').
- Federated (STS) access token lifetime.
- Whether API keys support an expiry setting.
- Which audit field identifies the API key or HMAC access ID used on a data-plane request.
- Whether GetKeyString/lookupKey calls are logged for keys.lookupKey.
- Plan/pricing for VPC Service Controls (needs organization).

## Sources
- [HMAC keys](https://cloud.google.com/storage/docs/authentication/hmackeys) (retrieved 2026-10-14)
- [Overview of VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs/overview) (retrieved 2026-10-14)
- [Manage HMAC keys for service accounts](https://cloud.google.com/storage/docs/authentication/managing-hmackeys) (retrieved 2026-10-14)
- [Restricting service account usage](https://cloud.google.com/resource-manager/docs/organization-policy/restricting-service-accounts) (retrieved 2026-10-14)
- [Organization policy constraints](https://cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints) (retrieved 2026-10-14)
- [Cloud Storage audit logging](https://cloud.google.com/storage/docs/audit-logging) (retrieved 2026-10-14)
- [View logs by using the Logs Explorer](https://cloud.google.com/logging/docs/view/logs-explorer-interface) (retrieved 2026-10-14)
- [Enable Data Access audit logs](https://cloud.google.com/logging/docs/audit/configure-data-access) (retrieved 2026-10-14)
- [Delete a user from your organization | Google Workspace Admin Help](https://support.google.com/a/answer/33314?hl=en) (retrieved 2026-10-14)
- [Directory API: User Accounts](https://developers.google.com/workspace/admin/directory/v1/guides/manage-users) (retrieved 2026-10-14)
- [Cloud Audit Logs overview](https://cloud.google.com/logging/docs/audit) (retrieved 2026-10-14)
