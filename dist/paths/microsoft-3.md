# Microsoft 365 / Entra / Graph: Managed identity

`microsoft-3` · Federated identity · service. OAuth 2.0 delegated and app-only bearer tokens. Apps authenticate with a secret, certificate, managed identity, or federated credential.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Entra admin center > Enterprise applications with filter Application type == Managed Identities. | Entra admin center > Enterprise applications with filter Application type == Managed Identities. |
| Protect: Admin can block or require approval | Yes | Enabled for users to sign-in?; Azure Policy deny on user-assigned managed identities | Enabled for users to sign-in?: Entra admin center > Enterprise apps > [app] > Properties; Graph servicePrincipal.accountEnabled=false · Azure Policy deny on user-assigned managed identities: Azure portal > Policy > Definitions (deny Microsoft.ManagedIdentity/userAssignedIdentities) > Assign |
| Protect: SSO and MFA rules apply | Not available | Docs say managed identities aren't covered by Conditional Access policy. |  |
| Protect: IP restriction | Not available | Managed identities are excluded from workload Conditional Access. This does not establish absence of every resource-side network control. |  |
| Protect: Expires automatically | Partial | Platform-set; tokens cached ~24 h per resource and can't be force-refreshed; CTL not supported | API: Token response from the managed identity endpoint includes expires_in / expires_on |
| Detect: Usage appears in logs | Yes | ManagedServiceIdentity, ServicePrincipalId, FederatedCredentialId, UniqueTokenIdentifier | AADManagedIdentitySignInLogs: Token issuance for managed identities; export via diagnostic settings. · MicrosoftGraphActivityLogs: Graph calls made with the MI's service principal (P1/P2 + export). · Azure Activity log (resource provider operations): Create/assign/delete user-assigned identities and federated credentials; operation names match Microsoft.ManagedIdentity actions. |
| Detect: Data reads appear in logs | Conditional | ARM control-plane reads not in activity log; data-plane resource logs capture reads only when a diagnostic setting is configured (off by default for most services) | Where: Azure portal > [resource] > Monitoring > Diagnostic settings > Add diagnostic setting · Command: az monitor diagnostic-settings create |
| Respond: Revocation ends active access | Partial | MI tokens are cached ~24h per resource URI and cannot be force-refreshed, so permission removal can take hours. revokeTokens exists only for user-assigned identities. | Remove role/app-role assignments; delete federated credentials; detach identity from the resource or delete it; for user-assigned MIs use the revokeTokens action; stop or isolate the host resource. |
| Respond: Stops working when user is removed | N/A | Managed identities are workload identities, not user accounts. |  |

## Protect: what an admin can configure

### Admin controls
- **Enabled for users to sign-in?** (Disable; all plans; default on). Disables the service principal in the tenant so no new tokens are issued for that application. Where: Entra admin center > Enterprise apps > [app] > Properties; Graph servicePrincipal.accountEnabled=false.
- **Revoke permission (admin consent / app role assignments)** (Limit scope; all plans; default varies). Removes granted delegated permissions (oauth2PermissionGrants) and application permissions (appRoleAssignments) from a service principal. Where: Entra admin center > Enterprise apps > [app] > Permissions > Admin consent > Revoke permission; Graph DELETE oAuth2PermissionGrants/{id} and appRoleAssignedTo/{id}.
- **RBAC for Applications in Exchange Online** (Limit resources; all plans; default off). Grants app-only mail/calendar/contacts permissions scoped to a management scope or admin unit of mailboxes instead of the whole tenant. Where: Exchange Online PowerShell: New-ServicePrincipal, New-ManagementRoleAssignment -CustomResourceScope / -RecipientAdministrativeUnitScope.
- **Sites.Selected and other *.Selected scopes** (Limit resources; all plans; default off). An app consented to Selected scopes has no SharePoint/OneDrive access until an admin grants it a role on a specific site, list, item or file. Where: Consent Sites.Selected in Entra, then Graph POST /sites/{siteId}/permissions (and lists/items/files).
- **Azure Policy deny on user-assigned managed identities** (Disable; all plans; default off). Blocks creation of user-assigned managed identities in the scoped subscription or resource group. Where: Azure portal > Policy > Definitions (deny Microsoft.ManagedIdentity/userAssignedIdentities) > Assign.

### Not available (vendor states)
- Conditional Access (including workload identity CA) cannot target managed identities, and does not cover multitenant or Microsoft SaaS apps.
- Cannot force a managed identity token to refresh early; permission changes can take hours because tokens are cached about 24 hours.

- Network: excluded (checked at token_issuance). Managed identities are excluded from workload Conditional Access. This does not establish absence of every resource-side network control.
- Lifetime: Platform-set; tokens cached ~24 h per resource and can't be force-refreshed; CTL not supported. Renewal: The workload requests new tokens from the platform endpoint; the backing certificate credential is platform-managed and rolled automatically, so there is no customer-held secret to expire.
- Keyless option: supported. Azure-hosted workloads get tokens from the platform without a stored secret. A user-assigned managed identity can also hold federated identity credentials that trust external IdP tokens (issuer/subject/audience must match).
- Conditions: Workload Conditional Access requires Workload ID Premium. Do not treat a token-issuance IP check as universal per-request Graph enforcement.

## Detect: what gets logged
- Token prefix: not established

### Logs
- AADManagedIdentitySignInLogs: Token issuance for managed identities; export via diagnostic settings.
- MicrosoftGraphActivityLogs: Graph calls made with the MI's service principal (P1/P2 + export).
- Azure Activity log (resource provider operations): Create/assign/delete user-assigned identities and federated credentials; operation names match Microsoft.ManagedIdentity actions.

### Fields that identify the credential
- `ManagedServiceIdentity` (AADManagedIdentitySignInLogs): Details of the MI used
- `ServicePrincipalId` (AADManagedIdentitySignInLogs): MI service principal
- `FederatedCredentialId` (AADManagedIdentitySignInLogs): Set when a federated identity credential was used
- `UniqueTokenIdentifier` (AADManagedIdentitySignInLogs): Joins to Graph SignInActivityId

### Lifecycle events
- create: `Microsoft.ManagedIdentity/userAssignedIdentities/write` Create or update user-assigned identity
- change: `Microsoft.ManagedIdentity/userAssignedIdentities/assign/action` Attach identity to a resource; anyone who runs code there can use it
- change: `Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials/write` Lets an external workload exchange tokens for this MI
- revoke: `Microsoft.ManagedIdentity/userAssignedIdentities/revokeTokens/action` Revoke existing tokens on a user-assigned identity
- revoke: `Microsoft.ManagedIdentity/userAssignedIdentities/delete` Delete identity
- change: `Add app role assignment to service principal` AuditLogs; Graph app roles granted to MI

### Correlate on
`ServicePrincipalId`, `AppId`, `ResourceIdentity`, `ResourceDisplayName`, `IPAddress`, `UniqueTokenIdentifier`, `SignInActivityId`, `CorrelationId`

### API calls a holder can make, and whether they are logged
- recon: `GET http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/  (Header Metadata: true)`. Issues an app-only access token for the VM's managed identity; access_token, expires_on, resource Logged: plan (`AADManagedIdentitySignInLogs`). Token issuance appears in managed identity sign-in logs; sign-ins from same identity/status/resource are aggregated into one row, and IMDS/MI subsystem caches tokens so not every acquisition reaches Entra. Sign-in logs need Entra P1/P2 to export
- discovery (bulk): `GET https://management.azure.com/subscriptions?api-version=2022-12-01`. All subscriptions the identity can see (subscriptionId, tenantId, state); cloud footprint Logged: no (`AzureActivity`). Azure activity log (control plane) does not typically capture read operations: 'The activity log doesn't typically capture read operations.' GET/list of subscriptions is a read.
- collection (bulk): `GET https://management.azure.com/subscriptions/{id}/resources?api-version=... (ARM resource/data reads)`. Resource inventory and, with data-plane reads (e.g. Key Vault GetSecret), secret/data values Logged: plan (`Data Access audit logs / resource logs`). ARM control-plane reads not in activity log; data-plane resource logs capture reads only when a diagnostic setting is configured (off by default for most services)

### Public detection rules (community, not vendor documentation)
- [App Granted Microsoft Permissions](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_permissions_msft.yml) (Sigma): Delegated permission grants or app role assignments to a service principal.
- [App Granted Privileged Delegated Or App Permissions](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_privileged_permissions.yml) (Sigma): App role assignments (application permissions) granted to a service principal.
- [App Assigned To Azure RBAC/Microsoft Entra Role](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_role_added.yml) (Sigma): A service principal was added to an Entra or Azure RBAC role.

### What to look for (analyst guidance)
- MI token requests for a resource (ResourceDisplayName) it never used before
- federatedIdentityCredentials/write on an MI followed by sign-ins with FederatedCredentialId set
- assign/action attaching a privileged MI to a new VM, Function or Logic App
- Graph calls by the MI from an IP outside its host resource's range

### Sample query (Entra KQL (Log Analytics))
Spot managed identities requesting tokens for a new target resource

```
AADManagedIdentitySignInLogs | where TimeGenerated > ago(30d) | summarize FirstSeen=min(TimeGenerated) by ServicePrincipalId, ResourceDisplayName | where FirstSeen > ago(2d)
```

## Respond: how to revoke it


Remove role/app-role assignments; delete federated credentials; detach identity from the resource or delete it; for user-assigned MIs use the revokeTokens action; stop or isolate the host resource. Live access ends on revocation: partial. MI tokens are cached ~24h per resource URI and cannot be force-refreshed, so permission removal can take hours. revokeTokens exists only for user-assigned identities.

## No vendor documentation found
- Exact Azure Activity log schema fields for these operations (not fetched)
- Whether system-assigned identities have any token revocation operation
- Exact IMDS requests-per-second throttle threshold (docs say 429 on throttle but give no number)
- Whether a tenant exports managed-identity sign-in logs (requires Entra P1/P2 + diagnostic setting)
- Licensing for app management policies (Application policies): fetched pages list only role prerequisites; Microsoft has previously tied them to Workload ID Premium, not confirmed here.
- Whether 'Assignment required' is enforced for managed identities calling Microsoft Graph (doc covers client apps generally).
- Exchange RBAC for Applications license requirement not stated on the fetched page; it does not constrain unscoped Entra grants, which must be removed.

## Sources
- [Workload Identity Federation - Microsoft Entra Workload ID | Microsoft Learn](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation) (retrieved 2026-10-09)
- [Access tokens in the Microsoft identity platform - Microsoft identity platform | Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens) (retrieved 2026-10-09)
- [Microsoft Entra Conditional Access for workload identities - Microsoft ...](https://learn.microsoft.com/en-us/entra/identity/conditional-access/workload-identity) (retrieved 2026-10-09)
- [Microsoft Entra Workload ID documentation](https://learn.microsoft.com/en-us/entra/workload-id/) (retrieved 2026-10-09)
- [Configurable Token Lifetimes - Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/configurable-token-lifetimes) (retrieved 2026-10-09)
- [Managed identities for Azure resources frequently asked questions](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/managed-identities-faq) (retrieved 2026-10-09)
- [View the service principal of a managed identity](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/how-to-view-managed-identity-service-principal-portal) (retrieved 2026-10-14)
- [Use managed identities on a VM to acquire access token](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/how-to-use-vm-token) (retrieved 2026-10-12)
- [Create diagnostic settings in Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/platform/create-diagnostic-settings) (retrieved 2026-10-14)
- [AADManagedIdentitySignInLogs table reference](https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/aadmanagedidentitysigninlogs) (retrieved 2026-10-12)
- [Access Microsoft Graph activity logs](https://learn.microsoft.com/en-us/graph/microsoft-graph-activity-logs-overview) (retrieved 2026-10-12)
- [Azure permissions for Identity](https://learn.microsoft.com/en-us/azure/role-based-access-control/permissions/identity) (retrieved 2026-10-12)
- [Managed identity best practice recommendations](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/managed-identity-best-practice-recommendations) (retrieved 2026-10-12)
- [Microsoft Entra audit log activity reference](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/reference-audit-activities) (retrieved 2026-10-12)
- [Managed identity sign-in logs - Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/concept-managed-identity-sign-ins) (retrieved 2026-10-12)
- [Subscriptions - List - Azure Resource Management](https://learn.microsoft.com/en-us/rest/api/resources/subscriptions/list) (retrieved 2026-10-12)
- [Activity Log in Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/fundamentals/activity-log) (retrieved 2026-10-12)
- [Disable user sign-in for application](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/disable-user-sign-in-portal) (retrieved 2026-10-13)
- [Review permissions granted to enterprise applications](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/manage-application-permissions) (retrieved 2026-10-13)
- [Role Based Access Control for Applications in Exchange Online](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac) (retrieved 2026-10-13)
- [Overview of Selected Permissions in OneDrive and SharePoint](https://learn.microsoft.com/en-us/graph/permissions-selected-overview) (retrieved 2026-10-13)
