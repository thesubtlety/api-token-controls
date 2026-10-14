# Microsoft 365 / Entra / Graph: App-only OAuth

`microsoft-2` · OAuth · service. OAuth 2.0 delegated and app-only bearer tokens. Apps authenticate with a secret, certificate, managed identity, or federated credential.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /applications lists all app registrations, including their passwordCredentials and keyCredentials. | GET /applications lists all app registrations, including their passwordCredentials and keyCredentials. |
| Protect: Admin can block or require approval | Yes | Admin consent workflow; Users can register applications; Enabled for users to sign-in?; Application policies: Block password addition | Admin consent workflow: Entra admin center > Enterprise apps > Consent and permissions > Admin consent settings; Graph adminConsentRequestPolicy · Users can register applications: Entra admin center > Users > User settings > Users can register applications · Enabled for users to sign-in?: Entra admin center > Enterprise apps > [app] > Properties; Graph servicePrincipal.accountEnabled=false · Application policies: Block password addition: Entra admin center > Enterprise apps > Application policies; Graph policies/defaultAppManagementPolicy (passwordAddition, symmetricKeyAddition) |
| Protect: SSO and MFA rules apply | Partial | Conditional Access for workload identities (Workload ID Premium) covers single-tenant service principals at token request; multitenant and third-party apps are not covered. | Where: Entra ID > Conditional Access > Policies > New policy > Users or workload identities > Workload identities > Select service principals · API: POST /identity/conditionalAccess/policies |
| Protect: IP restriction | Conditional (requires Microsoft Entra Workload ID Premium) | Workload Conditional Access (Workload ID Premium) blocks token requests from outside allowed IP ranges for single-tenant service principals; excludes managed identities and third-party/multitenant apps. If the app opts into CAE (cp1), Microsoft Graph also enforces location changes on requests; other resources do not. | Conditional Access for workload identities: Entra admin center > Conditional Access > Policies > Users or workload identities > Workload identities |
| Protect: Expires automatically | Partial | Usually 60–90 min; resource/CAE exceptions | Application policies: Restrict max password / certificate lifetime: Entra admin center > Enterprise apps > Application policies; Graph defaultAppManagementPolicy (passwordLifetime, symmetricKeyLifetime, asymmetricKeyLifetime) |
| Detect: Usage appears in logs | Yes | ServicePrincipalCredentialKeyId, ServicePrincipalCredentialThumbprint, ClientCredentialType, FederatedCredentialId, ClientAuthMethod, UniqueTokenIdentifier | Where: Entra ID > Monitoring & health > Sign-in logs > Service principal sign-ins · API: GET /beta/auditLogs/signIns?$filter=signInEventTypes/any(t: t eq 'servicePrincipal') |
| Detect: Data reads appear in logs | Yes | MailItemsAccessed | Where: Purview portal > Audit > Search; Activities - operations names: MailItemsAccessed (filter results by the app ID) · Command: Search-UnifiedAuditLog -StartDate <d> -EndDate <d> -Operations MailItemsAccessed |
| Respond: Revocation ends active access | Not available | Removing a credential stops new tokens; already-issued app-only access tokens stay valid until expiry (default 60-90 min). |  |
| Respond: Stops working when user is removed | N/A | App-only credentials belong to a service principal, not a user account. |  |

## Protect: what an admin can configure

### Admin controls
- **Admin consent workflow** (Require approval; all plans; default off). Lets users request consent they cannot grant; designated reviewers approve or deny, and only Global Admins can approve Graph application permissions. Where: Entra admin center > Enterprise apps > Consent and permissions > Admin consent settings; Graph adminConsentRequestPolicy.
- **Users can register applications** (Disable; all plans; default on). Stops ordinary users from creating app registrations (and their client credentials); only Application Developer or admin roles can. Where: Entra admin center > Users > User settings > Users can register applications.
- **Assignment required?** (Limit scope; all plans; default off). Only users, groups or client service principals explicitly assigned to the resource app can get tokens for it; also blocks user consent for that app. Where: Entra admin center > Enterprise apps > [app] > Properties > Assignment required?; Graph servicePrincipal.appRoleAssignmentRequired.
- **Enabled for users to sign-in?** (Disable; all plans; default on). Disables the service principal in the tenant so no new tokens are issued for that application. Where: Entra admin center > Enterprise apps > [app] > Properties; Graph servicePrincipal.accountEnabled=false.
- **Revoke permission (admin consent / app role assignments)** (Limit scope; all plans; default varies). Removes granted delegated permissions (oauth2PermissionGrants) and application permissions (appRoleAssignments) from a service principal. Where: Entra admin center > Enterprise apps > [app] > Permissions > Admin consent > Revoke permission; Graph DELETE oAuth2PermissionGrants/{id} and appRoleAssignedTo/{id}.
- **Application policies: Block password addition** (Disable; Not established; default off). Blocks new client secrets and symmetric keys on apps and service principals, pushing app-only auth to certificates or federated credentials. Where: Entra admin center > Enterprise apps > Application policies; Graph policies/defaultAppManagementPolicy (passwordAddition, symmetricKeyAddition).
- **Application policies: Restrict max password / certificate lifetime** (Limit lifetime; Not established; default off). Caps the lifetime of new client secrets, symmetric keys and certificates added to apps and service principals. Where: Entra admin center > Enterprise apps > Application policies; Graph defaultAppManagementPolicy (passwordLifetime, symmetricKeyLifetime, asymmetricKeyLifetime).
- **Application policies: Block custom passwords / trusted certificate authority** (Other; Not established; default off). Blocks client-supplied passwords, and (API only) blocks certificates not issued by a listed trusted CA. Where: Graph defaultAppManagementPolicy (customPasswordAddition, trustedCertificateAuthority); custom password also in Application policies UI.
- **Application policies: Block multitenant applications** (Limit scope; Not established; default off). Blocks creating or promoting app registrations to multitenant or consumer-account audiences. Where: Entra admin center > Enterprise apps > Application policies; Graph appManagementPolicy audiences restriction.
- **Conditional Access for workload identities** (Limit network; Microsoft Entra Workload ID Premium; default off). Blocks token requests by selected single-tenant service principals from outside named IP ranges or when service principal risk is detected. Where: Entra admin center > Conditional Access > Policies > Users or workload identities > Workload identities.
- **RBAC for Applications in Exchange Online** (Limit resources; all plans; default off). Grants app-only mail/calendar/contacts permissions scoped to a management scope or admin unit of mailboxes instead of the whole tenant. Where: Exchange Online PowerShell: New-ServicePrincipal, New-ManagementRoleAssignment -CustomResourceScope / -RecipientAdministrativeUnitScope.
- **Sites.Selected and other *.Selected scopes** (Limit resources; all plans; default off). An app consented to Selected scopes has no SharePoint/OneDrive access until an admin grants it a role on a specific site, list, item or file. Where: Consent Sites.Selected in Entra, then Graph POST /sites/{siteId}/permissions (and lists/items/files).

### Not available (vendor states)
- App management policies do not stop existing non-compliant credentials from getting tokens; they only block create/update.
- Workload identity CA is evaluated only at token request, not per Graph call.

- Network: conditional (checked at mixed). Workload Conditional Access (Workload ID Premium) blocks token requests from outside allowed IP ranges for single-tenant service principals; excludes managed identities and third-party/multitenant apps. If the app opts into CAE (cp1), Microsoft Graph also enforces location changes on requests; other resources do not.
- Lifetime: Usually 60–90 min; resource/CAE exceptions. Renewal: No refresh token; the app re-requests a token with its secret (max 24 months), certificate, or federated credential. The app credential's own expiry governs continued access.
- Keyless option: supported. External OIDC identity exchanged through Entra for Graph/Microsoft 365 access. Trust matches issuer, subject and audience.
- Conditions: Workload Conditional Access requires Workload ID Premium. Do not treat a token-issuance IP check as universal per-request Graph enforcement.

## Detect: what gets logged
- Token prefix: not established

### Logs
- AADServicePrincipalSignInLogs: Client-credentials token requests; shows which secret/cert/federated credential was used. Export required beyond 30 days.
- MicrosoftGraphActivityLogs: App-only calls have ServicePrincipalId and Roles but no UserId. P1/P2 + diagnostic setting.
- Entra audit logs (AuditLogs): Credential add/remove and app role (application permission) grants.

### Fields that identify the credential
- `ServicePrincipalCredentialKeyId` (AADServicePrincipalSignInLogs): Key ID of the secret or certificate used
- `ServicePrincipalCredentialThumbprint` (AADServicePrincipalSignInLogs): Certificate thumbprint
- `ClientCredentialType` (AADServicePrincipalSignInLogs): Client secret vs client assertion etc.
- `FederatedCredentialId` (AADServicePrincipalSignInLogs): Federated identity credential used, if any
- `ClientAuthMethod` (MicrosoftGraphActivityLogs): 0 public, 1 secret, 2 certificate
- `UniqueTokenIdentifier` (AADServicePrincipalSignInLogs): Joins to Graph SignInActivityId

### Lifecycle events
- create: `Update application - Certificates and secrets management` AuditLogs; secret/cert added or removed on app registration
- create: `Add service principal credentials` AuditLogs; credential added directly on service principal
- revoke: `Remove service principal credentials` AuditLogs
- change: `Add app role assignment to service principal` AuditLogs; application permission granted
- revoke: `Remove app role assignment from service principal` AuditLogs
- revoke: `Remove service principal` AuditLogs

### Correlate on
`ServicePrincipalId`, `AppId`, `ServicePrincipalCredentialKeyId`, `IPAddress`, `UserAgent`, `AutonomousSystemNumber`, `ResourceIdentity`, `UniqueTokenIdentifier`, `SignInActivityId`, `InitiatedBy`

### API calls a holder can make, and whether they are logged
- recon: `GET /organization/{id}`. Tenant display name, verifiedDomains, assignedPlans; confirms tenant and app reach (no /me for app-only) Logged: plan (`MicrosoftGraphActivityLogs`). App-only requests logged in Graph activity logs (AppId, ServicePrincipalId, Roles) only when enabled (Entra P1/P2 + diagnostic setting)
- enumeration (bulk): `GET /users/delta`. Full directory user list with incremental deltaLink; bulk directory harvest Logged: plan (`MicrosoftGraphActivityLogs`). Logged only with Graph activity logs enabled; Roles column shows app role claims
- collection (bulk): `GET /users/{id}/messages`. Any user's mailbox messages (app can read any mailbox without sharing); mail contents Logged: yes (`MailItemsAccessed`). Mailbox auditing records app-only mail access over REST (Audit Standard, E3/E5); Graph activity logs also capture call if enabled

### Public detection rules (community, not vendor documentation)
- [Azure Service Principal Credentials Added](https://github.com/panther-labs/panther-analysis/blob/develop/rules/azure_signin_rules/azure_service_principal_credentials_added.yml) (Panther): Client secrets or certificates were added to an Entra ID service principal or application.
- [Added Credentials to Existing Application](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_credential_added.yml) (Sigma): Certificates or secrets were added to an existing application.
- [App Granted Microsoft Permissions](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_permissions_msft.yml) (Sigma): Delegated permission grants or app role assignments to a service principal.
- [App Granted Privileged Delegated Or App Permissions](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_privileged_permissions.yml) (Sigma): App role assignments (application permissions) granted to a service principal.
- [Application AppID Uri Configuration Changes](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_appid_uri_changes.yml) (Sigma): Application or service principal updates, aimed at AppID URI changes.
- [Added Owner To Application](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_owner_added.yml) (Sigma): An owner was added to an application; owners can add credentials to it.
- [Azure Owner Removed From Application or Service Principal](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_owner_removed_from_application_or_service_principal.yml) (Sigma): An owner was removed from an application or service principal.
- [App Assigned To Azure RBAC/Microsoft Entra Role](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_role_added.yml) (Sigma): A service principal was added to an Entra or Azure RBAC role.
- [Azure Service Principal Created](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_service_principal_created.yml) (Sigma): A service principal was created.
- [Azure Service Principal Removed](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_service_principal_removed.yml) (Sigma): A service principal was removed.
- [Azure Application Deleted](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_application_deleted.yml) (Sigma): An application was deleted or hard-deleted.

### What to look for (analyst guidance)
- Credential added to a service principal (not the app registration) shortly before new sign-ins
- New ServicePrincipalCredentialKeyId appearing in sign-ins that no deployment explains
- Token requests from IPs outside the workload's known egress
- App role assignment of high-privilege Graph roles (e.g. Mail.ReadWrite) to an existing app
- Secret-based sign-ins for an app that normally uses certificates

### Sample query (Entra KQL (Log Analytics))
Find credentials used for the first time in the last day per service principal

```
AADServicePrincipalSignInLogs | where TimeGenerated > ago(30d) and ResultType == "0" | summarize FirstSeen=min(TimeGenerated), IPs=make_set(IPAddress) by ServicePrincipalId, ServicePrincipalCredentialKeyId, ClientCredentialType | where FirstSeen > ago(1d)
```

## Respond: how to revoke it


Remove the compromised secret/cert (app registration or service principal); remove app role assignments; disable the service principal (accountEnabled false) or delete it. Live access ends on revocation: no. Removing a credential stops new tokens; already-issued app-only access tokens stay valid until expiry (default 60-90 min).

## No vendor documentation found
- Documented regex/prefix for Entra client secrets
- Whether AuditLogs shows the new credential's KeyId in a named field
- Whether tenant has Graph activity logs enabled (off by default)
- Whether directory-object reads produce any audit record absent Graph activity logs
- Licensing for app management policies (Application policies): fetched pages list only role prerequisites; Microsoft has previously tied them to Workload ID Premium, not confirmed here.
- Whether 'Assignment required' is enforced for managed identities calling Microsoft Graph (doc covers client apps generally).
- Exchange RBAC for Applications license requirement not stated on the fetched page; it does not constrain unscoped Entra grants, which must be removed.

## Sources
- [Workload Identity Federation - Microsoft Entra Workload ID | Microsoft Learn](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation) (retrieved 2026-10-09)
- [Access tokens in the Microsoft identity platform - Microsoft identity platform | Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens) (retrieved 2026-10-09)
- [Microsoft Entra Conditional Access for workload identities - Microsoft ...](https://learn.microsoft.com/en-us/entra/identity/conditional-access/workload-identity) (retrieved 2026-10-09)
- [Microsoft Entra Workload ID documentation](https://learn.microsoft.com/en-us/entra/workload-id/) (retrieved 2026-10-09)
- [Continuous access evaluation for workload identities in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-continuous-access-evaluation-workload) (retrieved 2026-10-09)
- [OAuth 2.0 client credentials flow on the Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow) (retrieved 2026-10-09)
- [Add and manage app credentials in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials) (retrieved 2026-10-09)
- [List applications](https://learn.microsoft.com/en-us/graph/api/application-list) (retrieved 2026-10-14)
- [application resource type](https://learn.microsoft.com/en-us/graph/api/resources/application) (retrieved 2026-10-14)
- [Create conditionalAccessPolicy (Microsoft Graph)](https://learn.microsoft.com/en-us/graph/api/conditionalaccessroot-post-policies) (retrieved 2026-10-14)
- [List signIns (beta)](https://learn.microsoft.com/en-us/graph/api/signin-list?view=graph-rest-beta) (retrieved 2026-10-14)
- [Use MailItemsAccessed to investigate compromised accounts](https://learn.microsoft.com/en-us/purview/audit-log-investigate-accounts) (retrieved 2026-10-12)
- [Search the audit log](https://learn.microsoft.com/en-us/purview/audit-search) (retrieved 2026-10-14)
- [AADServicePrincipalSignInLogs table reference](https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/aadserviceprincipalsigninlogs) (retrieved 2026-10-12)
- [Access Microsoft Graph activity logs](https://learn.microsoft.com/en-us/graph/microsoft-graph-activity-logs-overview) (retrieved 2026-10-12)
- [Microsoft Entra audit log activity reference](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/reference-audit-activities) (retrieved 2026-10-12)
- [AuditLogs table reference](https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/auditlogs) (retrieved 2026-10-12)
- [Configurable Token Lifetimes - Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/configurable-token-lifetimes) (retrieved 2026-10-09)
- [Microsoft Entra data retention](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/reference-reports-data-retention) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Get organization - Microsoft Graph v1.0](https://learn.microsoft.com/en-us/graph/api/organization-get?view=graph-rest-1.0) (retrieved 2026-10-12)
- [List messages - Microsoft Graph v1.0](https://learn.microsoft.com/en-us/graph/api/user-list-messages?view=graph-rest-1.0) (retrieved 2026-10-12)
- [user: delta - Microsoft Graph v1.0](https://learn.microsoft.com/en-us/graph/api/user-delta?view=graph-rest-1.0) (retrieved 2026-10-12)
- [Microsoft Graph throttling limits](https://learn.microsoft.com/en-us/graph/throttling-limits) (retrieved 2026-10-12)
- [Configure the admin consent workflow](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-admin-consent-workflow) (retrieved 2026-10-13)
- [Delegate application management administrator permissions](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/delegate-app-roles) (retrieved 2026-10-13)
- [Restrict a Microsoft Entra app to a set of users](https://learn.microsoft.com/en-us/entra/identity-platform/howto-restrict-your-app-to-a-set-of-users) (retrieved 2026-10-13)
- [Disable user sign-in for application](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/disable-user-sign-in-portal) (retrieved 2026-10-13)
- [Review permissions granted to enterprise applications](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/manage-application-permissions) (retrieved 2026-10-13)
- [Configure restrictions on how applications can be configured](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-app-management-policies) (retrieved 2026-10-13)
- [Role Based Access Control for Applications in Exchange Online](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac) (retrieved 2026-10-13)
- [Overview of Selected Permissions in OneDrive and SharePoint](https://learn.microsoft.com/en-us/graph/permissions-selected-overview) (retrieved 2026-10-13)
- [https://learn.microsoft.com/en-us/graph/api/resources/applicationauthenticationmethodpolicy?view=graph-rest-1.0](https://learn.microsoft.com/en-us/graph/api/resources/applicationauthenticationmethodpolicy?view=graph-rest-1.0) (retrieved 2026-10-13)
