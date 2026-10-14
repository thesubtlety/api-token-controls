# Google Workspace: Service account / domain-wide delegation

`google-2` · Signed JWT · service. OAuth 2.0 user bearer tokens; service-account signed JWT exchange. Domain-wide delegation (DWD) enables approved user impersonation.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Security > Access and data control > API controls > Manage Domain Wide Delegation lists every DWD client with its scopes. | Security > Access and data control > API controls > Manage Domain Wide Delegation lists every DWD client with its scopes. |
| Protect: Admin can block or require approval | Yes | Multi-party approval for domain-wide delegation; iam.disableServiceAccountKeyCreation / iam.managed.disableServiceAccountKeyCreation; iam.disableServiceAccountKeyUpload; iam.disableServiceAccountCreation | Multi-party approval for domain-wide delegation: Admin console multi-party approval settings · iam.disableServiceAccountKeyCreation / iam.managed.disableServiceAccountKeyCreation: Google Cloud Organization Policy (constraints/iam.disableServiceAccountKeyCreation) · iam.disableServiceAccountKeyUpload: Google Cloud Organization Policy (constraints/iam.disableServiceAccountKeyUpload) · iam.disableServiceAccountCreation: Google Cloud Organization Policy (constraints/iam.disableServiceAccountCreation or managed variant) |
| Protect: SSO and MFA rules apply | Partial | Context-Aware Access does not restrict Google API access from service accounts in general, but Drive policies do block automated tools from unauthorized IPs or devices. | Where: Admin console > Security > Access and data control > Context-Aware Access > Assign access levels to apps > Drive (applies to automated tools; does not cover other Google APIs from service accounts) |
| Protect: IP restriction | Not available | Context-Aware Access offers user IP/device/location conditions. Its documentation explicitly excludes service-account API access. |  |
| Protect: Expires automatically | Yes | 1-hour access token | API: POST https://oauth2.googleapis.com/token response field expires_in (3600) |
| Detect: Usage appears in logs | Yes | protoPayload.authenticationInfo.serviceAccountKeyName, protoPayload.authenticationInfo.principalEmail, protoPayload.authenticationInfo.serviceAccountDelegationInfo, actor.applicationInfo.oauthClientId, API_CLIENT_NAME | Cloud Audit Logs (Admin Activity): Key create/delete/disable/upload; always on. · Cloud Audit Logs (Data Access): Service API use with serviceAccountKeyName; GenerateAccessToken impersonation logs need IAM Data Access logs enabled. · Workspace OAuth Token audit log: DWD calls into Workspace APIs; actor.applicationInfo.impersonation shows impersonation. 6 months. · Workspace Admin audit log (domain settings): DWD grants/removals: AUTHORIZE_API_CLIENT_ACCESS / REMOVE_API_CLIENT_ACCESS. |
| Detect: Data reads appear in logs | Conditional | Gmail delivery event 33 'An application accessed a message on behalf of a user'; token 'activity' event logs the API call. Both via Admin SDK Reports.; Drive audit 'download' event = 'Document download'; file metadata list itself may not fire a view/download event. Reports API / Workspace edition dependent. | Where: Gmail log events (mail_event_type 33); Drive: Reporting > Audit and investigation > Drive log events, Event = Download, filter App ID = service account client ID · API: GET .../applications/gmail?eventName=delivery; GET .../applications/drive?eventName=download; GET .../applications/token?eventName=activity |
| Respond: Revocation ends active access | Partial | Disabling a key does not revoke short-lived credentials already issued from it; disabling or deleting the service account does. | Delete or disable the key; remove the client ID from domain-wide delegation; disable the service account to stop issued short-lived credentials; review and remove IAM bindings. |
| Respond: Stops working when user is removed | N/A | A service account belongs to the application, not to an individual user. |  |

## Protect: what an admin can configure

### Admin controls
- **Manage Domain Wide Delegation** (Limit scope; all plans; default off). Super admins authorize each service account or OAuth client ID with an explicit scope list; editing scopes or deleting the client stops access. Where: Admin console > Security > Access and data control > API controls > Manage Domain Wide Delegation.
- **Multi-party approval for domain-wide delegation** (Require approval; Not established; default off). When enabled, adding, editing or deleting a DWD client needs a second super admin's approval. Where: Admin console multi-party approval settings.
- **iam.disableServiceAccountKeyCreation / iam.managed.disableServiceAccountKeyCreation** (Disable; all plans; default varies). Org policy that blocks creation of user-managed service account keys used to sign DWD JWTs. Where: Google Cloud Organization Policy (constraints/iam.disableServiceAccountKeyCreation).
- **iam.disableServiceAccountKeyUpload** (Disable; all plans; default varies). Org policy that blocks uploading external public keys to service accounts. Where: Google Cloud Organization Policy (constraints/iam.disableServiceAccountKeyUpload).
- **iam.serviceAccountKeyExpiryHours** (Limit lifetime; all plans; default off). Org policy that sets a maximum lifetime for new service account keys, which otherwise never expire. Where: Google Cloud Organization Policy (constraints/iam.serviceAccountKeyExpiryHours).
- **iam.disableServiceAccountCreation** (Disable; all plans; default off). Org policy that blocks creating new service accounts. Where: Google Cloud Organization Policy (constraints/iam.disableServiceAccountCreation or managed variant).
- **Service account impersonation IAM (Service Account Token Creator)** (Limit scope; all plans; default off). Only principals granted impersonation roles on the service account can mint tokens or sign JWTs as it. Where: Google Cloud IAM on the service account.

- Network: excluded (checked at unknown). Context-Aware Access offers user IP/device/location conditions. Its documentation explicitly excludes service-account API access.
- Lifetime: 1-hour access token. Renewal: No refresh token; the app signs a new JWT (with a key, or keyless via IAM signJwt) and requests a new token. Key expiry depends on the org's key-expiry setting.
- Keyless option: supported. Google documents WIF → service account → IAM signJwt → OAuth token for DWD. Workspace scopes/admin delegation remain separate requirements.
- Conditions: Context-Aware Access requires eligible Workspace/Cloud Identity editions. User policy coverage does not establish protection of DWD service accounts.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Cloud Audit Logs (Admin Activity): Key create/delete/disable/upload; always on.
- Cloud Audit Logs (Data Access): Service API use with serviceAccountKeyName; GenerateAccessToken impersonation logs need IAM Data Access logs enabled.
- Workspace OAuth Token audit log: DWD calls into Workspace APIs; actor.applicationInfo.impersonation shows impersonation. 6 months.
- Workspace Admin audit log (domain settings): DWD grants/removals: AUTHORIZE_API_CLIENT_ACCESS / REMOVE_API_CLIENT_ACCESS.

### Fields that identify the credential
- `protoPayload.authenticationInfo.serviceAccountKeyName` (Cloud Audit Logs): Full resource name of the key used; not logged by App Engine/Compute Engine
- `protoPayload.authenticationInfo.principalEmail` (Cloud Audit Logs): Service account email
- `protoPayload.authenticationInfo.serviceAccountDelegationInfo` (Cloud Audit Logs): Who impersonated the SA
- `actor.applicationInfo.oauthClientId` (Workspace Reports Activity): SA client ID for DWD calls
- `API_CLIENT_NAME` (Workspace Admin audit log): Client granted DWD

### Lifecycle events
- create: `google.iam.admin.v1.CreateServiceAccountKey` Admin Activity
- create: `google.iam.admin.v1.UploadServiceAccountKey` Attacker-supplied public key
- change: `AUTHORIZE_API_CLIENT_ACCESS` DWD granted with API_SCOPES
- use: `GenerateAccessToken` Short-lived token via impersonation (Data Access logs)
- revoke: `google.iam.admin.v1.DisableServiceAccountKey` Does not revoke issued tokens
- revoke: `google.iam.admin.v1.DeleteServiceAccountKey` 
- revoke: `REMOVE_API_CLIENT_ACCESS` DWD removed

### Correlate on
`protoPayload.authenticationInfo.principalEmail`, `protoPayload.authenticationInfo.serviceAccountKeyName`, `protoPayload.requestMetadata.callerIp`, `protoPayload.requestMetadata.callerSuppliedUserAgent`, `actor.applicationInfo.oauthClientId`, `actor.email`, `ipAddress`

### API calls a holder can make, and whether they are logged
- recon: `POST https://oauth2.googleapis.com/token (grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer, signed JWT with sub=user)`. Exchanges service-account JWT (with sub impersonation) for an access token scoped to the impersonated user Logged: unknown. Token minting at Google's token endpoint; not established to appear in Workspace admin audit logs as a distinct event
- enumeration (bulk): `GET https://admin.googleapis.com/admin/directory/v1/users?customer=my_customer`. All users in the domain (requires impersonating an admin); full directory roster Logged: plan (`OAuth Token audit log: activity event`). API calls via the delegated token surface in token 'activity' events (client_id, api_name, method_name); Admin Console Admin audit may record directory reads separately
- collection (bulk): `GET https://gmail.googleapis.com/gmail/v1/users/{user}/messages (impersonated user)`. Any impersonated user's mailbox messages; mass mailbox export across the domain Logged: plan (`Gmail audit mail_event_type 33; Token activity event`). Gmail delivery event 33 'An application accessed a message on behalf of a user'; token 'activity' event logs the API call. Both via Admin SDK Reports.
- collection (bulk): `GET https://www.googleapis.com/drive/v3/files?corpora=user (impersonated user)`. Impersonated user's Drive file list/metadata; precursor to bulk download Logged: plan (`Drive audit event: download`). Drive audit 'download' event = 'Document download'; file metadata list itself may not fire a view/download event. Reports API / Workspace edition dependent.

### Public detection rules (community, not vendor documentation)
- [GCP.Iam.ServiceAccountKeys.Create](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gcp_audit_rules/gcp_iam_service_account_key_create.yml) (Panther): A granted iam.serviceAccountKeys.create permission check (service account key creation).
- [GCP Service Account or Keys Created](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gcp_audit_rules/gcp_service_account_or_keys_created.yml) (Panther): A user (not an automated workflow) created a service account or service account key.
- [Google Workspace Granted Domain API Access](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/gcp/gworkspace/admin/gcp_gworkspace_granted_domain_api_access.yml) (Sigma): An admin granted domain-wide delegation API access to a client.

### What to look for (analyst guidance)
- serviceAccountKeyName that does not match any key your deployment owns
- UploadServiceAccountKey on any production SA
- AUTHORIZE_API_CLIENT_ACCESS adding Gmail/Drive scopes to a client ID
- DWD token activity impersonating executives or admins
- SA key used from callerIp outside known CI/workload ranges

### Sample query (Cloud Logging query language)
Find every audited call made with one leaked key

```
protoPayload.authenticationInfo.serviceAccountKeyName="//iam.googleapis.com/projects/my-project/serviceAccounts/my-service-account@my-project.iam.gserviceaccount.com/keys/KEY_ID"
```

## Respond: how to revoke it


Delete or disable the key; remove the client ID from domain-wide delegation; disable the service account to stop issued short-lived credentials; review and remove IAM bindings. Live access ends on revocation: partial. Disabling a key does not revoke short-lived credentials already issued from it; disabling or deleting the service account does.

## No vendor documentation found
- Full methodName for GenerateAccessToken (page shows only GenerateAccessToken)
- How DWD-impersonated calls appear in Workspace logs beyond actor.applicationInfo.impersonation
- Regex for SA key file
- Whether the JWT-bearer token exchange is logged anywhere in Workspace
- Whether Drive files.list (metadata only) produces any audit event vs. only view/download
- Workspace edition gating of Drive/Gmail audit events
- Whether Workspace Context-Aware Access or third-party app access settings apply to domain-wide delegation service account calls; the DWD page does not say.
- Edition requirement for multi-party approval on DWD changes.
- No per-DWD-client IP restriction found in Workspace docs; absence not stated by Google.
- Default of 'Trust internal apps' not stated on the fetched page.
- Exact UI path for applying CAA to Workspace APIs; the 2023 update links to help articles without naming the setting.

## Sources
- [Using OAuth 2.0 for Server to Server Applications  |  Authorization  |  Google for Developers](https://developers.google.com/identity/protocols/oauth2/service-account) (retrieved 2026-10-09)
- [Best practices for managing service account keys  |  Identity and Access Management (IAM)  |  Google Cloud Documentation](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys?hl=en) (retrieved 2026-10-09)
- [Protect your business with Context-Aware Access - Google](https://knowledge.workspace.google.com/admin/security/protect-your-business-with-context-aware-access) (retrieved 2026-10-09)
- [Perform Google Workspace domain-wide delegation of authority](https://developers.google.com/workspace/cloud-search/docs/guides/delegation) (retrieved 2026-10-09)
- [Control API access with domain-wide delegation](https://support.google.com/a/answer/162106?hl=en) (retrieved 2026-10-14)
- [Assign Context-Aware Access levels to apps](https://knowledge.workspace.google.com/admin/security/assign-context-aware-access-levels-to-apps?hl=en) (retrieved 2026-10-14)
- [Protect your business with Context-Aware Access](https://knowledge.workspace.google.com/admin/security/protect-your-business-with-context-aware-access?hl=en) (retrieved 2026-10-14)
- [Gmail activity events | Admin SDK Reports API](https://developers.google.com/workspace/admin/reports/v1/appendix/activity/gmail) (retrieved 2026-10-12)
- [Gmail log events](https://knowledge.workspace.google.com/admin/reports/gmail-log-events?hl=en) (retrieved 2026-10-14)
- [Drive log events](https://support.google.com/a/answer/4579696?hl=en) (retrieved 2026-10-14)
- [Drive activity events | Admin SDK Reports API](https://developers.google.com/workspace/admin/reports/v1/appendix/activity/drive) (retrieved 2026-10-12)
- [Reports API: OAuth Token audit activity events](https://developers.google.com/workspace/admin/reports/v1/appendix/activity/token) (retrieved 2026-10-12)
- [AuditLog type](https://docs.cloud.google.com/logging/docs/reference/audit/auditlog/rest/Shared.Types/AuditLog) (retrieved 2026-10-12)
- [Example logs for service accounts](https://docs.cloud.google.com/iam/docs/audit-logging/examples-service-accounts) (retrieved 2026-10-12)
- [IAM audit logging](https://docs.cloud.google.com/iam/docs/audit-logging) (retrieved 2026-10-12)
- [Disable and enable service account keys](https://docs.cloud.google.com/iam/docs/keys-disable-enable) (retrieved 2026-10-12)
- [Reports API: Admin domain settings events](https://developers.google.com/workspace/admin/reports/v1/appendix/activity/admin-domain-settings) (retrieved 2026-10-12)
- [Method: activities.list](https://developers.google.com/workspace/admin/reports/reference/rest/v1/activities/list) (retrieved 2026-10-12)
- [Data retention and lag times](https://knowledge.workspace.google.com/admin/reports/data-retention-and-lag-times) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Users.list | Directory API](https://developers.google.com/workspace/admin/directory/reference/rest/v1/users/list) (retrieved 2026-10-12)
- [Files.list | Drive API](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list) (retrieved 2026-10-12)
- [Control API access with domain-wide delegation (Google Workspace Admin Help)](https://knowledge.workspace.google.com/admin/apps/control-api-access-with-domain-wide-delegation) (retrieved 2026-10-12)
- [Restricting service account usage](https://docs.cloud.google.com/resource-manager/docs/organization-policy/restricting-service-accounts) (retrieved 2026-10-13)
- [Service accounts overview](https://docs.cloud.google.com/iam/docs/service-account-overview) (retrieved 2026-10-13)
