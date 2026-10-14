# Microsoft Azure: Service principal client secrets and certificates (used against Azure Resource Manager)

`azure-3` · OAuth · service. App registration secret or certificate used in the client credentials flow to get an Entra access token for Azure Resource Manager; access is set by Azure RBAC role assignments.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Each application object exposes its passwordCredentials and keyCredentials collections through Microsoft Graph (GET /applications). | Each application object exposes its passwordCredentials and keyCredentials collections through Microsoft Graph (GET /applications). |
| Protect: Admin can block or require approval | Yes | Block password addition (passwordAddition restriction); Users can register applications | Block password addition (passwordAddition restriction): Entra ID > Enterprise apps > Application policies > Block password addition (or tenantAppManagementPolicy via Microsoft Graph) · Users can register applications: Entra ID > Users > User settings > Users can register applications |
| Protect: SSO and MFA rules apply | Partial | Conditional Access for workload identities applies to single-tenant service principals only and needs Workload Identities Premium; multitenant apps are not covered. | Where: Entra admin center > Entra ID > Conditional Access > Policies > New policy > Users or workload identities > What does this policy apply to? = Workload identities > select service principals |
| Protect: IP restriction | Conditional (requires Workload Identities Premium) | Location-based Conditional Access for workload identities blocks token requests from outside allowed ranges. Already-issued ARM tokens are not re-checked (CAE for workload identities is Microsoft Graph only). | Conditional Access for workload identities: Entra admin center > Conditional Access > Workload identities |
| Protect: Expires automatically | Yes | Secret up to 24 months; access tokens 60-90 min | Where: Entra admin center > Entra ID > Enterprise apps > Application policies > Restrict max password lifetime / Restrict max certificate lifetime · API: PATCH https://graph.microsoft.com/v1.0/policies/defaultAppManagementPolicy (passwordLifetime, asymmetricKeyLifetime restrictions) |
| Detect: Usage appears in logs | Yes | service principal / app ID | Where: Entra admin center > Entra ID > Monitoring & health > Sign-in logs > Service principal sign-ins; filter by application ID · API: GET https://graph.microsoft.com/beta/auditLogs/signIns?$filter=signInEventTypes/any(t: t eq 'servicePrincipal') (clientCredentialType = clientSecret / certificate) |
| Detect: Data reads appear in logs | Yes | Microsoft.Storage/storageAccounts/listkeys/action | Where: Storage account (or subscription) > Activity log; filter Operation to listkeys action and caller = the app ID · Command: az monitor activity-log list --resource-id <storage-account-id> |
| Respond: Revocation ends active access | Partial | ARM access tokens remain valid until expiry (60-90 min); CAE for workload identities covers Microsoft Graph only. | Where: Disable the service principal (accountEnabled = false) and delete the secret/certificate on the app registration · API: POST /applications/{id}/removePassword; PATCH /servicePrincipals/{id} {"accountEnabled": false} · Command: az ad app credential delete --id <appId> --key-id <keyId> |
| Respond: Stops working when user is removed | N/A | Client secrets and certificates belong to the application/service principal, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Conditional Access for workload identities** (Limit network; Workload Identities Premium; default off). Blocks token requests by single-tenant service principals from outside named locations or when risky. Where: Entra admin center > Conditional Access > Workload identities.
- **App management policy (passwordAddition, passwordLifetime, asymmetricKeyLifetime)** (Limit lifetime; all plans; default off). Blocks new password secrets or caps secret/certificate lifetimes for new or updated apps. Where: Microsoft Graph tenantAppManagementPolicy / appManagementPolicy.
- **Azure RBAC role assignment scope** (Limit resources; all plans; default varies). Service principal ARM access is limited to its assigned roles and scopes. Where: az role assignment create --role --scopes.
- **Block password addition (passwordAddition restriction)** (Disable; Not stated in cited docs; default off). Blocks adding new client secrets to applications and service principals; certificates are not blocked by this restriction. Where: Entra ID > Enterprise apps > Application policies > Block password addition (or tenantAppManagementPolicy via Microsoft Graph).
- **Users can register applications** (Disable; all plans; default on). Set to No so only admins and Application Developer role holders can create app registrations (and so add secrets, certificates or federated credentials to new apps). Where: Entra ID > Users > User settings > Users can register applications.

### Not available (vendor states)
- CAE for workload identities does not cover Azure Resource Manager; ARM tokens survive SP disable until expiry.
- App management policies do not affect existing credentials or token issuance for existing apps.

- Network: conditional (checked at token_issuance). Location-based Conditional Access for workload identities blocks token requests from outside allowed ranges. Already-issued ARM tokens are not re-checked (CAE for workload identities is Microsoft Graph only).
- Lifetime: Secret up to 24 months; access tokens 60-90 min. Renewal: Secret or certificate is reused to request new access tokens until it expires or is removed.
- Keyless option: limited. Not a user sign-in. Conditional Access for workload identities can block by location or risk, but only at token request and only for single-tenant SPs, and needs Workload Identities Premium.
- Conditions: Tenant default policy is disabled by default.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Microsoft Entra service principal sign-in logs: Token requests with secret/certificate; 7 days (Free) or 30 days (P1/P2).
- Microsoft Entra audit logs: ApplicationManagement category; 7 days (Free) or 30 days (P1/P2).
- Azure Activity Log: Control-plane writes/actions (e.g. listKeys, regenerateKey); 90 days free; reads typically not captured.

### Fields that identify the credential
- `service principal / app ID` (Entra service principal sign-in logs): Credential used is a secret or certificate.

### Lifecycle events
- create: `Update application - Certificates and secrets management` ApplicationManagement audit.
- create: `Add service principal credentials` 
- revoke: `Remove service principal credentials` 

### Correlate on
`appId`, `service principal object ID`, `IP address`

### API calls a holder can make, and whether they are logged
- recon: `GET https://management.azure.com/subscriptions`. Subscriptions the SP can see Logged: no. Activity log typically does not capture reads; token request is in SP sign-in logs.
- discovery (bulk): `GET https://management.azure.com/subscriptions/{id}/resources`. All resources Logged: no. Read.
- enumeration (bulk): `GET .../providers/Microsoft.Authorization/roleAssignments`. Role assignments Logged: no. Read.
- collection: `POST .../storageAccounts/{name}/listKeys`. Storage account keys (pivot to azure-1) Logged: yes (`Microsoft.Storage/storageAccounts/listkeys/action`). Activity log action.

### Public detection rules (community, not vendor documentation)
- [Azure Service Principal Credentials Added](https://github.com/panther-labs/panther-analysis/blob/develop/rules/azure_signin_rules/azure_service_principal_credentials_added.yml) (Panther): Client secrets or certificates were added to an Entra ID service principal or application.
- [Added Credentials to Existing Application](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_credential_added.yml) (Sigma): Certificates or secrets were added to an existing application.

### What to look for (analyst guidance)
- Token requests from new IPs
- New secret added to a privileged app

## Respond: how to revoke it
- Admin: **Remove credential / disable service principal**. Deleting the secret, certificate or federated credential stops new token requests; disabling the SP is a CAE revocation event for Microsoft Graph only. Where: App registrations > Certificates & secrets; Enterprise applications > Properties.

Remove the secret/certificate, disable the SP, and remove role assignments. Live access ends on revocation: partial. ARM access tokens remain valid until expiry (60-90 min); CAE for workload identities covers Microsoft Graph only.

## No vendor documentation found
- Exact Activity Log behavior for listKeys not quoted on fetched page.
- Whether Azure Activity Log records the service principal identity for ARM read calls made with azure-3/azure-4 tokens (Activity log typically skips reads).
- Exact Entra audit activity name for adding/removing a federated identity credential.
- Default of the Azure DevOps "IP Conditional Access policy validation on non-interactive flows" policy.
- Maximum Azure DevOps PAT lifetime when no tenant policy is set.
- Token format or prefix for storage keys, SAS, client secrets or Azure DevOps PATs.
- Whether app management policies require a specific license.

## Sources
- [Service principal sign-in logs - Microsoft Entra ID | Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/concept-service-principal-sign-ins) (retrieved 2026-10-14)
- [Create Azure service principals using the Azure CLI | Microsoft Learn](https://learn.microsoft.com/en-us/cli/azure/azure-cli-sp-tutorial-1) (retrieved 2026-10-14)
- [Microsoft Entra Conditional Access for workload identities - Microsoft ...](https://learn.microsoft.com/en-us/entra/identity/conditional-access/workload-identity) (retrieved 2026-10-09)
- [Continuous access evaluation for workload identities in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-continuous-access-evaluation-workload) (retrieved 2026-10-09)
- [Add and manage app credentials in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials) (retrieved 2026-10-09)
- [Access tokens in the Microsoft identity platform - Microsoft identity platform | Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens) (retrieved 2026-10-09)
- [Microsoft Entra application management policy API overview - Microsoft Graph v1.0 | Microsoft Learn](https://learn.microsoft.com/en-us/graph/api/resources/applicationauthenticationmethodpolicy) (retrieved 2026-10-14)
- [application resource type - Microsoft Graph v1.0](https://learn.microsoft.com/en-us/graph/api/resources/application?view=graph-rest-1.0) (retrieved 2026-10-14)
- [Configure restrictions on how applications can be configured](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-app-management-policies) (retrieved 2026-10-13)
- [Update tenantAppManagementPolicy](https://learn.microsoft.com/en-us/graph/api/tenantappmanagementpolicy-update) (retrieved 2026-10-14)
- [Sign-in logs in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/concept-sign-ins) (retrieved 2026-10-14)
- [List signIns (beta)](https://learn.microsoft.com/en-us/graph/api/signin-list?view=graph-rest-beta) (retrieved 2026-10-14)
- [signIn resource type (beta)](https://learn.microsoft.com/en-us/graph/api/resources/signin?view=graph-rest-beta) (retrieved 2026-10-14)
- [Activity Log in Azure Monitor - Azure Monitor | Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/platform/activity-log) (retrieved 2026-10-14)
- [az monitor activity-log](https://learn.microsoft.com/en-us/cli/azure/monitor/activity-log) (retrieved 2026-10-14)
- [application: removePassword](https://learn.microsoft.com/en-us/graph/api/application-removepassword) (retrieved 2026-10-14)
- [Update servicePrincipal](https://learn.microsoft.com/en-us/graph/api/serviceprincipal-update) (retrieved 2026-10-14)
- [az ad app credential](https://learn.microsoft.com/en-us/cli/azure/ad/app/credential) (retrieved 2026-10-14)
- [Microsoft Entra audit log activity reference](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/reference-audit-activities) (retrieved 2026-10-12)
- [Microsoft Entra data retention](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/reference-reports-data-retention) (retrieved 2026-10-12)
- [Storage Accounts - List Keys - REST API (Azure Storage Resource Provider) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storagerp/storage-accounts/list-keys) (retrieved 2026-10-14)
- [Azure permissions for Storage - Azure RBAC | Microsoft Learn](https://learn.microsoft.com/en-us/azure/role-based-access-control/permissions/storage) (retrieved 2026-10-14)
- [Subscriptions - List - Azure Resource Management](https://learn.microsoft.com/en-us/rest/api/resources/subscriptions/list) (retrieved 2026-10-12)
- [Resources - List - REST API (Azure Resource Management) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/resources/resources/list) (retrieved 2026-10-14)
- [Role Assignments - List For Subscription - REST API (Azure Authorization) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/authorization/role-assignments/list-for-subscription) (retrieved 2026-10-14)
- [Delegate application management administrator permissions](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/delegate-app-roles) (retrieved 2026-10-13)
