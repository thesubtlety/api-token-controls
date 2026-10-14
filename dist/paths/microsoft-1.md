# Microsoft 365 / Entra / Graph: Delegated OAuth

`microsoft-1` · OAuth · person. OAuth 2.0 delegated and app-only bearer tokens. Apps authenticate with a secret, certificate, managed identity, or federated credential.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | GET /oauth2PermissionGrants lists delegated consent grants org-wide; issued tokens themselves are not listed. | GET /oauth2PermissionGrants lists delegated consent grants org-wide; issued tokens themselves are not listed. |
| Protect: Admin can block or require approval | Yes | User consent for applications; Admin consent workflow; Users can register applications; Enabled for users to sign-in? | User consent for applications: Entra admin center > Enterprise apps > Consent and permissions > User consent settings; Graph authorizationPolicy.defaultUserRolePermissions.permissionGrantPoliciesAssigned · Admin consent workflow: Entra admin center > Enterprise apps > Consent and permissions > Admin consent settings; Graph adminConsentRequestPolicy · Users can register applications: Entra admin center > Users > User settings > Users can register applications · Enabled for users to sign-in?: Entra admin center > Enterprise apps > [app] > Properties; Graph servicePrincipal.accountEnabled=false |
| Protect: SSO and MFA rules apply | Yes | Delegated tokens are issued to users, and Conditional Access policies apply to users when they access apps. | Where: Entra admin center > Entra ID > Conditional Access > Policies > New policy (target users, grant require MFA) · API: POST /identity/conditionalAccess/policies |
| Protect: IP restriction | Conditional (requires Microsoft Entra ID P1 (risk conditions need P2); Microsoft Entra ID P1 for location policies; critical events in any tenant) | User Conditional Access can restrict locations. Workload CA blocks token issuance for eligible single-tenant service principals; excludes managed identities and third-party multi-tenant apps. | Conditional Access (users): Entra admin center > Entra ID > Conditional Access > Policies · Continuous access evaluation / strict location enforcement: Conditional Access > session control 'Customize continuous access evaluation'; strict location enforcement (preview) |
| Protect: Expires automatically | Partial | Default random 60–90 min; CTL can set 10 min–1 day; CAE sessions can get 20–28 h tokens | API: POST /policies/tokenLifetimePolicies (AccessTokenLifetime), then POST /servicePrincipals/{id}/tokenLifetimePolicies/$ref · Command: New-MgPolicyTokenLifetimePolicy -BodyParameter $params |
| Detect: Usage appears in logs | Yes | UniqueTokenIdentifier, SignInActivityId, AppId, SessionId, TokenIssuedAt | Entra sign-in logs (SigninLogs / AADNonInteractiveUserSignInLogs): Token issuance per user+app; refresh-token redemptions land in non-interactive. 7 days Free, 30 days P1/P2 in portal; export via diagnostic settings for longer. · MicrosoftGraphActivityLogs: Every Graph request with AppId, UserId, IP, scopes. Needs Entra ID P1/P2 and a diagnostic setting; nothing retained unless exported. · Entra audit logs (AuditLogs): Consent, permission grants, credential add/remove on apps and service principals. 7/30 days in portal. |
| Detect: Data reads appear in logs | Yes | MailItemsAccessed | Where: Purview portal > Audit > Search; Activities - operations names: MailItemsAccessed · Command: Search-UnifiedAuditLog -StartDate <d> -EndDate <d> -UserIds <user> -Operations MailItemsAccessed |
| Respond: Revocation ends active access | Partial | Refresh tokens die (few-minute delay). Issued access tokens live 60-90 min unless client and resource support CAE, which revokes in near real time. | Where: Entra ID > Users > All users > [user] > Overview > Revoke sessions · API: POST /users/{id}/revokeSignInSessions · Command: Revoke-MgUserSignInSession -UserId <id> |
| Respond: Stops working when user is removed | Partial | Disabling the user blocks new sign-ins and refresh tokens can be revoked, but issued access tokens keep working until they expire (default 1 hour) unless the app supports CAE. | Where: Entra ID > Users > All users > [user] > Account status > Edit > clear Account enabled > Save; then Revoke sessions · API: PATCH /users/{id} {"accountEnabled": false}; POST /users/{id}/revokeSignInSessions · Command: Update-MgUser -UserId <id> -AccountEnabled:$false; Revoke-MgUserSignInSession -UserId <id> |

## Protect: what an admin can configure

### Admin controls
- **User consent for applications** (Require approval; all plans; default on). Turns off or narrows user self-consent so delegated permission grants need an admin (or only low-impact permissions for verified publishers). Where: Entra admin center > Enterprise apps > Consent and permissions > User consent settings; Graph authorizationPolicy.defaultUserRolePermissions.permissionGrantPoliciesAssigned.
- **Admin consent workflow** (Require approval; all plans; default off). Lets users request consent they cannot grant; designated reviewers approve or deny, and only Global Admins can approve Graph application permissions. Where: Entra admin center > Enterprise apps > Consent and permissions > Admin consent settings; Graph adminConsentRequestPolicy.
- **Users can register applications** (Disable; all plans; default on). Stops ordinary users from creating app registrations (and their client credentials); only Application Developer or admin roles can. Where: Entra admin center > Users > User settings > Users can register applications.
- **Assignment required?** (Limit scope; all plans; default off). Only users, groups or client service principals explicitly assigned to the resource app can get tokens for it; also blocks user consent for that app. Where: Entra admin center > Enterprise apps > [app] > Properties > Assignment required?; Graph servicePrincipal.appRoleAssignmentRequired.
- **Enabled for users to sign-in?** (Disable; all plans; default on). Disables the service principal in the tenant so no new tokens are issued for that application. Where: Entra admin center > Enterprise apps > [app] > Properties; Graph servicePrincipal.accountEnabled=false.
- **Revoke permission (admin consent / app role assignments)** (Limit scope; all plans; default varies). Removes granted delegated permissions (oauth2PermissionGrants) and application permissions (appRoleAssignments) from a service principal. Where: Entra admin center > Enterprise apps > [app] > Permissions > Admin consent > Revoke permission; Graph DELETE oAuth2PermissionGrants/{id} and appRoleAssignedTo/{id}.
- **Application policies: Block multitenant applications** (Limit scope; Not established; default off). Blocks creating or promoting app registrations to multitenant or consumer-account audiences. Where: Entra admin center > Enterprise apps > Application policies; Graph appManagementPolicy audiences restriction.
- **Conditional Access (users)** (Limit network; Microsoft Entra ID P1 (risk conditions need P2); default off). Applies location, device, MFA, risk and block conditions when a user obtains delegated tokens for targeted resources. Where: Entra admin center > Entra ID > Conditional Access > Policies.
- **Continuous access evaluation / strict location enforcement** (Limit network; Microsoft Entra ID P1 for location policies; critical events in any tenant; default on). Lets Exchange, SharePoint, Teams and Graph reject user tokens mid-lifetime on IP-location change or critical events like account disable. Where: Conditional Access > session control 'Customize continuous access evaluation'; strict location enforcement (preview).
- **Sites.Selected and other *.Selected scopes** (Limit resources; all plans; default off). An app consented to Selected scopes has no SharePoint/OneDrive access until an admin grants it a role on a specific site, list, item or file. Where: Consent Sites.Selected in Entra, then Graph POST /sites/{siteId}/permissions (and lists/items/files).

- Network: conditional (checked at mixed). User Conditional Access can restrict locations. Workload CA blocks token issuance for eligible single-tenant service principals; excludes managed identities and third-party multi-tenant apps.
- Lifetime: Default random 60–90 min; CTL can set 10 min–1 day; CAE sessions can get 20–28 h tokens. Renewal: Refresh tokens roll over on each use; default 90 days (24 hours for SPAs), max age until revoked, not configurable. Sign-in frequency is controlled with Conditional Access.
- Keyless option: limited. Delegated tokens can be obtained by exchanging an AD FS-issued SAMLv1 assertion (SAML bearer assertion grant) for a Graph token. Workload identity federation (issuer/subject/audience match) applies to app-only and managed-identity paths, not delegated user tokens.
- Conditions: Workload Conditional Access requires Workload ID Premium. Do not treat a token-issuance IP check as universal per-request Graph enforcement.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Entra sign-in logs (SigninLogs / AADNonInteractiveUserSignInLogs): Token issuance per user+app; refresh-token redemptions land in non-interactive. 7 days Free, 30 days P1/P2 in portal; export via diagnostic settings for longer.
- MicrosoftGraphActivityLogs: Every Graph request with AppId, UserId, IP, scopes. Needs Entra ID P1/P2 and a diagnostic setting; nothing retained unless exported.
- Entra audit logs (AuditLogs): Consent, permission grants, credential add/remove on apps and service principals. 7/30 days in portal.

### Fields that identify the credential
- `UniqueTokenIdentifier` (SigninLogs): Per-token request ID; joins to Graph SignInActivityId
- `SignInActivityId` (MicrosoftGraphActivityLogs): Sign-in that issued the token used
- `AppId` (SigninLogs / MicrosoftGraphActivityLogs): Client application
- `SessionId` (SigninLogs / MicrosoftGraphActivityLogs): Authentication session
- `TokenIssuedAt` (MicrosoftGraphActivityLogs): Token issue time; use after revocation is a red flag

### Lifecycle events
- create: `Consent to application` AuditLogs; user or admin consent
- create: `Add delegated permission grant` AuditLogs; scopes granted to client
- revoke: `Remove delegated permission grant` AuditLogs
- revoke: `Update StsRefreshTokenValidFrom Timestamp` AuditLogs UserManagement; expected after session revocation (mapping not stated in docs)
- revoke: `Disable account` AuditLogs UserManagement

### Correlate on
`UserId`, `UserPrincipalName`, `AppId`, `ServicePrincipalId`, `IPAddress`, `UserAgent`, `AutonomousSystemNumber`, `SessionId`, `UniqueTokenIdentifier`, `SignInActivityId`, `CorrelationId`

### API calls a holder can make, and whether they are logged
- recon: `GET /me`. Signed-in user's profile (displayName, mail, userPrincipalName, id); confirms delegated token and identity Logged: plan (`MicrosoftGraphActivityLogs`). Graph activity logs capture all HTTP requests but require Entra ID P1/P2 plus a diagnostic setting to Log Analytics/Storage/Event Hubs; not on by default
- discovery: `GET /organization/{id}`. Tenant details, verifiedDomains, assignedPlans; tenant footprint Logged: plan (`MicrosoftGraphActivityLogs`). Logged only when Graph activity logs are enabled (Entra P1/P2 + diagnostic setting)
- collection (bulk): `GET /me/messages`. Signed-in user's mail messages (sender, subject, body HTML); mailbox contents Logged: yes (`MailItemsAccessed`). Exchange mailbox auditing (Audit Standard, on by default with E3/E5) records mail access over all protocols including REST; bind aggregated per 2 min, sync per folder. Graph activity logs also capture the HTTP call if enabled.
- enumeration (bulk): `GET /users/delta`. Directory users with change tracking; deltaLink for incremental re-pulls Logged: plan (`MicrosoftGraphActivityLogs`). Directory reads appear in Graph activity logs only when enabled; no mailbox-style read audit for directory objects

### Public detection rules (community, not vendor documentation)
- [App Granted Microsoft Permissions](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_permissions_msft.yml) (Sigma): Delegated permission grants or app role assignments to a service principal.
- [Delegated Permissions Granted For All Users](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_delegated_permissions_all_users.yml) (Sigma): Delegated permission grants (scopes given to a client app).
- [End User Consent](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_end_user_consent.yml) (Sigma): Non-admin user consent to an application.
- [End User Consent Blocked](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_end_user_consent_blocked.yml) (Sigma): User consent blocked because the app was flagged as risky.
- [Microsoft Entra ID Anomalous Application Consent](https://github.com/panther-labs/panther-analysis/blob/develop/queries/azure_queries/Entra_ID_Anomalous_Application_Consent_Query.yml) (Panther): Saved query: a user consented to an app they had not consented to in the prior 14 days.
- [Microsoft Entra ID Graph Email Access by Unusual Public Client](https://github.com/panther-labs/panther-analysis/blob/develop/queries/azure_queries/Entra_ID_Graph_Email_Access_Unusual_Public_Client_Query.yml) (Panther): Saved query: a public client app newly reading or sending a user mail through Microsoft Graph (MicrosoftGraphActivityLogs).
- [Azure Microsoft Graph Single Session from Multiple IP Addresses](https://github.com/panther-labs/panther-analysis/blob/develop/rules/azure_signin_rules/azure_graph_session_multiple_ips.yml) (Panther): The same sign-in session ID used to reach Microsoft Graph from multiple IPs by a non-allowlisted app, a sign of token replay.
- [Azure VS Code OAuth Phishing](https://github.com/panther-labs/panther-analysis/blob/develop/rules/azure_signin_rules/azure_vscode_oauth_phishing.yml) (Panther): Successful VS Code (first-party public client) OAuth sign-ins to Microsoft Graph, a pattern used in OAuth token phishing.
- [Anomalous Token](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/identity_protection/azure_identity_protection_anomalous_token.yml) (Sigma): Identity Protection anomalous token risk detections (unusual token lifetime or replay).
- [Applications That Are Using ROPC Authentication Flow](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/signin_logs/azure_app_ropc_authentication.yml) (Sigma): Apps using the resource owner password credentials (ROPC) OAuth flow.
- [Application Using Device Code Authentication Flow](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/signin_logs/azure_app_device_code_authentication.yml) (Sigma): Apps using the OAuth device code flow.
- [Application URI Configuration Changes](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/azure/audit_logs/azure_app_uri_modifications.yml) (Sigma): Changes to an application reply/redirect URI (AppAddress).
- [Suspicious OAuth App File Download Activities](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/m365/threat_management/microsoft365_susp_oauth_app_file_download_activities.yml) (Sigma): Defender for Cloud Apps alert for unusual file downloads by an OAuth app.

### What to look for (analyst guidance)
- Consent to application by non-admin followed by Graph mail/files reads from new IP
- Non-interactive refresh for the user+AppId from an ASN never seen in interactive sign-ins
- Graph calls with TokenIssuedAt earlier than the revocation time
- Same SessionId seen from two countries
- High-volume Graph reads (ResponseSizeBytes) from an app the user rarely uses

### Sample query (Entra KQL (Log Analytics))
Tie each delegated Graph call by one app to the sign-in that issued its token

```
MicrosoftGraphActivityLogs | where TimeGenerated > ago(7d) | where isnotempty(UserId) and AppId == "<app-id>" | join kind=leftouter (union SigninLogs, AADNonInteractiveUserSignInLogs | where TimeGenerated > ago(7d)) on $left.SignInActivityId == $right.UniqueTokenIdentifier | summarize Requests=count() by UserId, IPAddress, UserAgent, TokenIssuedAt
```

## Respond: how to revoke it


Call revokeSignInSessions for the user; remove the delegated permission grant / user consent; disable the service principal or block the app if malicious; reset password if user is compromised. Live access ends on revocation: partial. Refresh tokens die (few-minute delay). Issued access tokens live 60-90 min unless client and resource support CAE, which revokes in near real time.

## No vendor documentation found
- Documented regex/prefix for Entra client secrets
- Exact AuditLogs TargetResources fields carrying granted scopes
- Field schema of AADNonInteractiveUserSignInLogs (assumed same as SigninLogs; not fetched)
- Whether a given tenant has enabled Graph activity logs (off by default)
- Whether MailItemsAccessed sync records are generated for pure Graph/REST pulls (docs tie sync records to Outlook desktop clients; Graph reads land as bind)
- Licensing for app management policies (Application policies): fetched pages list only role prerequisites; Microsoft has previously tied them to Workload ID Premium, not confirmed here.
- Whether 'Assignment required' is enforced for managed identities calling Microsoft Graph (doc covers client apps generally).
- Exchange RBAC for Applications license requirement not stated on the fetched page; it does not constrain unscoped Entra grants, which must be removed.

## Sources
- [Workload Identity Federation - Microsoft Entra Workload ID | Microsoft Learn](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation) (retrieved 2026-10-09)
- [Access tokens in the Microsoft identity platform - Microsoft identity platform | Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens) (retrieved 2026-10-09)
- [Exchange a SAML token issued by AD FS for a Microsoft Graph access token](https://learn.microsoft.com/en-us/entra/identity-platform/v2-saml-bearer-assertion) (retrieved 2026-10-09)
- [Microsoft Entra Conditional Access for workload identities - Microsoft ...](https://learn.microsoft.com/en-us/entra/identity/conditional-access/workload-identity) (retrieved 2026-10-09)
- [Microsoft Entra Workload ID documentation](https://learn.microsoft.com/en-us/entra/workload-id/) (retrieved 2026-10-09)
- [Configurable Token Lifetimes - Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/configurable-token-lifetimes) (retrieved 2026-10-09)
- [Refresh tokens in the Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/refresh-tokens) (retrieved 2026-10-09)
- [Revoke user access in an emergency in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/users/users-revoke-access) (retrieved 2026-10-14)
- [List oauth2PermissionGrants](https://learn.microsoft.com/en-us/graph/api/oauth2permissiongrant-list) (retrieved 2026-10-14)
- [Require MFA for all users (Conditional Access)](https://learn.microsoft.com/en-us/entra/identity/conditional-access/policy-all-users-mfa-strength) (retrieved 2026-10-14)
- [Create conditionalAccessPolicy (Microsoft Graph)](https://learn.microsoft.com/en-us/graph/api/conditionalaccessroot-post-policies) (retrieved 2026-10-14)
- [Set lifetimes for tokens](https://learn.microsoft.com/en-us/entra/identity-platform/configure-token-lifetimes) (retrieved 2026-10-14)
- [Use MailItemsAccessed to investigate compromised accounts](https://learn.microsoft.com/en-us/purview/audit-log-investigate-accounts) (retrieved 2026-10-12)
- [Search the audit log](https://learn.microsoft.com/en-us/purview/audit-search) (retrieved 2026-10-14)
- [user: revokeSignInSessions](https://learn.microsoft.com/en-us/graph/api/user-revokesigninsessions) (retrieved 2026-10-14)
- [Update user (Microsoft Graph)](https://learn.microsoft.com/en-us/graph/api/user-update) (retrieved 2026-10-14)
- [Access Microsoft Graph activity logs](https://learn.microsoft.com/en-us/graph/microsoft-graph-activity-logs-overview) (retrieved 2026-10-12)
- [SigninLogs table reference](https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/signinlogs) (retrieved 2026-10-12)
- [Microsoft Entra audit log activity reference](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/reference-audit-activities) (retrieved 2026-10-12)
- [AuditLogs table reference](https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/auditlogs) (retrieved 2026-10-12)
- [user: revokeSignInSessions](https://learn.microsoft.com/en-us/graph/api/user-revokesigninsessions?view=graph-rest-1.0) (retrieved 2026-10-12)
- [Microsoft Entra data retention](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/reference-reports-data-retention) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Get user - Microsoft Graph v1.0](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0) (retrieved 2026-10-12)
- [List messages - Microsoft Graph v1.0](https://learn.microsoft.com/en-us/graph/api/user-list-messages?view=graph-rest-1.0) (retrieved 2026-10-12)
- [Microsoft Graph throttling limits](https://learn.microsoft.com/en-us/graph/throttling-limits) (retrieved 2026-10-12)
- [Get organization - Microsoft Graph v1.0](https://learn.microsoft.com/en-us/graph/api/organization-get?view=graph-rest-1.0) (retrieved 2026-10-12)
- [user: delta - Microsoft Graph v1.0](https://learn.microsoft.com/en-us/graph/api/user-delta?view=graph-rest-1.0) (retrieved 2026-10-12)
- [Configure how users consent to applications](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-user-consent) (retrieved 2026-10-13)
- [Configure the admin consent workflow](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-admin-consent-workflow) (retrieved 2026-10-13)
- [Delegate application management administrator permissions](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/delegate-app-roles) (retrieved 2026-10-13)
- [Restrict a Microsoft Entra app to a set of users](https://learn.microsoft.com/en-us/entra/identity-platform/howto-restrict-your-app-to-a-set-of-users) (retrieved 2026-10-13)
- [Disable user sign-in for application](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/disable-user-sign-in-portal) (retrieved 2026-10-13)
- [Review permissions granted to enterprise applications](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/manage-application-permissions) (retrieved 2026-10-13)
- [Configure restrictions on how applications can be configured](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-app-management-policies) (retrieved 2026-10-13)
- [Microsoft Entra Conditional Access: Zero Trust Policy Engine](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview) (retrieved 2026-10-13)
- [Continuous access evaluation in Microsoft Entra](https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-continuous-access-evaluation) (retrieved 2026-10-13)
- [Overview of Selected Permissions in OneDrive and SharePoint](https://learn.microsoft.com/en-us/graph/permissions-selected-overview) (retrieved 2026-10-13)
