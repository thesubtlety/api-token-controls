# Microsoft Azure: Workload identity federation (federated identity credentials)

`azure-4` · Federated identity · service. An app registration or user-assigned managed identity trusts tokens from an external IdP (GitHub Actions, Kubernetes, other clouds); the workload exchanges that token for an Entra access token, then calls ARM.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | GET /applications/{id}/federatedIdentityCredentials lists credentials per application; no tenant-wide list was found. | GET /applications/{id}/federatedIdentityCredentials lists credentials per application; no tenant-wide list was found. |
| Protect: Admin can block or require approval | Yes | Users can register applications; Not allowed resource types (Azure Policy) for userAssignedIdentities/federatedIdentityCredentials | Users can register applications: Entra ID > Users > User settings > Users can register applications · Not allowed resource types (Azure Policy) for userAssignedIdentities/federatedIdentityCredentials: Azure Policy > Definitions > Not allowed resource types > Assign |
| Protect: SSO and MFA rules apply | Partial | Conditional Access for workload identities covers single-tenant service principals (app registrations) but not managed identities. | Where: Entra admin center > Entra ID > Conditional Access > Policies > New policy > Users or workload identities > Workload identities > select service principals (app registrations only; not managed identities) |
| Protect: IP restriction | Conditional (requires Workload Identities Premium) | Same Conditional Access for workload identities limits as other app credentials (single-tenant SPs, token request only); managed identities are not covered. | Conditional Access for workload identities: Entra admin center > Conditional Access > Workload identities |
| Protect: Expires automatically | Yes | Entra access tokens 60-90 min; no long-lived secret |  |
| Detect: Usage appears in logs | Yes | appId / managed identity | Where: Entra admin center > Entra ID > Monitoring & health > Sign-in logs > Service principal sign-ins (or Managed identity sign-ins); filter by app ID · API: GET https://graph.microsoft.com/beta/auditLogs/signIns?$filter=signInEventTypes/any(t: t eq 'servicePrincipal'); clientCredentialType eq 'federatedIdentityCredential' |
| Detect: Data reads appear in logs | Yes | Microsoft.Storage/storageAccounts/listkeys/action | Where: Storage account (or subscription) > Activity log; filter Operation to listkeys action and caller = the app ID · Command: az monitor activity-log list --resource-id <storage-account-id> |
| Respond: Revocation ends active access | Partial | Issued access tokens last 60-90 min. | Delete the federated identity credential; remove role assignments. |
| Respond: Stops working when user is removed | N/A | Federated identity credentials are attached to an application or managed identity, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Conditional Access for workload identities** (Limit network; Workload Identities Premium; default off). Blocks token requests by single-tenant service principals from outside named locations or when risky. Where: Entra admin center > Conditional Access > Workload identities.
- **Azure RBAC role assignment scope** (Limit resources; all plans; default varies). Service principal ARM access is limited to its assigned roles and scopes. Where: az role assignment create --role --scopes.
- **Users can register applications** (Disable; all plans; default on). Set to No so only admins and Application Developer role holders can create app registrations (and so add secrets, certificates or federated credentials to new apps). Where: Entra ID > Users > User settings > Users can register applications.
- **Not allowed resource types (Azure Policy) for userAssignedIdentities/federatedIdentityCredentials** (Disable; all plans; default off). Blocks creating federated identity credentials on user-assigned managed identities in a subscription or resource group; does not cover app registrations. Where: Azure Policy > Definitions > Not allowed resource types > Assign.

- Network: conditional (checked at token_issuance). Same Conditional Access for workload identities limits as other app credentials (single-tenant SPs, token request only); managed identities are not covered.
- Lifetime: Entra access tokens 60-90 min; no long-lived secret. Renewal: Exchange a fresh external token for each new access token.
- Keyless option: supported. No stored secret; trust is defined by issuer/subject matching, with no wildcards.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- Microsoft Entra service principal sign-in logs: Token requests with secret/certificate; 7 days (Free) or 30 days (P1/P2).
- Microsoft Entra audit logs: ApplicationManagement category; 7 days (Free) or 30 days (P1/P2).
- Azure Activity Log: Control-plane writes/actions (e.g. listKeys, regenerateKey); 90 days free; reads typically not captured.

### Fields that identify the credential
- `appId / managed identity` (Entra sign-in logs): Specific FIC field not verified.

### Lifecycle events
No docs found.

### Correlate on
`appId`, `external subject (not verified in logs)`

### API calls a holder can make, and whether they are logged
- recon: `GET https://management.azure.com/subscriptions`. Subscriptions the SP can see Logged: no. Activity log typically does not capture reads; token request is in SP sign-in logs.
- discovery (bulk): `GET https://management.azure.com/subscriptions/{id}/resources`. All resources Logged: no. Read.
- enumeration (bulk): `GET .../providers/Microsoft.Authorization/roleAssignments`. Role assignments Logged: no. Read.
- collection: `POST .../storageAccounts/{name}/listKeys`. Storage account keys (pivot to azure-1) Logged: yes (`Microsoft.Storage/storageAccounts/listkeys/action`). Activity log action.

### Public detection rules (community, not vendor documentation)
- [Entra ID Federated Identity Credential Modified](https://github.com/elastic/detection-rules/blob/main/rules/integrations/azure/persistence_entra_id_federated_identity_credential_modified.toml) (Elastic): A federated identity credential was added to an application, or its issuer or subject changed.
- [Entra ID Service Principal Federated Credential Authentication by Unusual Client](https://github.com/elastic/detection-rules/blob/main/rules/integrations/azure/initial_access_entra_id_federated_login_by_unusual_client.toml) (Elastic): Successful service principal sign-ins using a federated identity credential by a non-Microsoft app (new-terms rule).

### What to look for (analyst guidance)
- Token exchange from an unexpected repo/branch subject

## Respond: how to revoke it
- Admin: **Remove credential / disable service principal**. Deleting the secret, certificate or federated credential stops new token requests; disabling the SP is a CAE revocation event for Microsoft Graph only. Where: App registrations > Certificates & secrets; Enterprise applications > Properties.

Delete the federated identity credential; remove role assignments. Live access ends on revocation: partial. Issued access tokens last 60-90 min.

## No vendor documentation found
- Audit event name for FIC changes
- Whether sign-in logs show which FIC matched
- Exact Activity Log behavior for listKeys not quoted on fetched page.
- Whether Azure Activity Log records the service principal identity for ARM read calls made with azure-3/azure-4 tokens (Activity log typically skips reads).
- Exact Entra audit activity name for adding/removing a federated identity credential.
- Default of the Azure DevOps "IP Conditional Access policy validation on non-interactive flows" policy.
- Maximum Azure DevOps PAT lifetime when no tenant policy is set.
- Token format or prefix for storage keys, SAS, client secrets or Azure DevOps PATs.
- Whether app management policies require a specific license.

## Sources
- [Workload Identity Federation - Microsoft Entra Workload ID | Microsoft Learn](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation) (retrieved 2026-10-09)
- [Workload identity federation for app considerations - Microsoft Entra Workload ID | Microsoft Learn](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation-considerations) (retrieved 2026-10-14)
- [Microsoft Entra Conditional Access for workload identities - Microsoft ...](https://learn.microsoft.com/en-us/entra/identity/conditional-access/workload-identity) (retrieved 2026-10-09)
- [Access tokens in the Microsoft identity platform - Microsoft identity platform | Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens) (retrieved 2026-10-09)
- [List federatedIdentityCredentials - Microsoft Graph v1.0](https://learn.microsoft.com/en-us/graph/api/application-list-federatedidentitycredentials?view=graph-rest-1.0) (retrieved 2026-10-14)
- [Sign-in logs in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/concept-sign-ins) (retrieved 2026-10-14)
- [List signIns (beta)](https://learn.microsoft.com/en-us/graph/api/signin-list?view=graph-rest-beta) (retrieved 2026-10-14)
- [signIn resource type (beta)](https://learn.microsoft.com/en-us/graph/api/resources/signin?view=graph-rest-beta) (retrieved 2026-10-14)
- [Activity Log in Azure Monitor - Azure Monitor | Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/platform/activity-log) (retrieved 2026-10-14)
- [az monitor activity-log](https://learn.microsoft.com/en-us/cli/azure/monitor/activity-log) (retrieved 2026-10-14)
- [Service principal sign-in logs - Microsoft Entra ID | Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/concept-service-principal-sign-ins) (retrieved 2026-10-14)
- [Storage Accounts - List Keys - REST API (Azure Storage Resource Provider) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/storagerp/storage-accounts/list-keys) (retrieved 2026-10-14)
- [Azure permissions for Storage - Azure RBAC | Microsoft Learn](https://learn.microsoft.com/en-us/azure/role-based-access-control/permissions/storage) (retrieved 2026-10-14)
- [Subscriptions - List - Azure Resource Management](https://learn.microsoft.com/en-us/rest/api/resources/subscriptions/list) (retrieved 2026-10-12)
- [Resources - List - REST API (Azure Resource Management) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/resources/resources/list) (retrieved 2026-10-14)
- [Role Assignments - List For Subscription - REST API (Azure Authorization) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/authorization/role-assignments/list-for-subscription) (retrieved 2026-10-14)
- [Continuous access evaluation for workload identities in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-continuous-access-evaluation-workload) (retrieved 2026-10-09)
- [Create Azure service principals using the Azure CLI | Microsoft Learn](https://learn.microsoft.com/en-us/cli/azure/azure-cli-sp-tutorial-1) (retrieved 2026-10-14)
- [Delegate application management administrator permissions](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/delegate-app-roles) (retrieved 2026-10-13)
- [Block workload identity federation using Azure Policy](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation-block-using-azure-policy) (retrieved 2026-10-14)
