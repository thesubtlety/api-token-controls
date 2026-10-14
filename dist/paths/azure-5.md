# Microsoft Azure: Azure DevOps personal access tokens (PATs)

`azure-5` · Personal access token · person. User-owned token for Azure DevOps REST, Git and package feeds; scoped to one organization (global PATs stop working Dec 1, 2026) and limited to the owner's permissions.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Project Collection Administrators can list PATs per user with GET .../_apis/tokenadmin/personalaccesstokens/{subjectDescriptor}; no single org-wide list. | Project Collection Administrators can list PATs per user with GET .../_apis/tokenadmin/personalaccesstokens/{subjectDescriptor}; no single org-wide list. |
| Protect: Admin can block or require approval | Yes | Restrict personal access token creation | Restrict personal access token creation: Organization settings > Policies |
| Protect: SSO and MFA rules apply | Partial | Conditional Access MFA applies to web flows only; IP-based policies apply to PAT REST calls only if the org enables IP Conditional Access policy validation on non-interactive flows. | Where: dev.azure.com/{org} > Organization settings > Policies > Enable IP Conditional Access policy validation on non-interactive flows = On |
| Protect: IP restriction | Conditional | Enforced on PAT REST calls only with the org policy enabled and an Entra IP-based Conditional Access policy. | Enable IP Conditional Access policy validation on non-interactive flows: Organization settings > Policies |
| Protect: Expires automatically | Yes | Expiry chosen at creation; tenant max-lifespan policy; becomes inactive if owner does not sign in within 90 days (Entra-backed orgs) | Enforce maximum personal access token lifespan: Organization settings > Microsoft Entra |
| Detect: Usage appears in logs | Not available | Azure DevOps audit log records PAT create, change and revoke, not each use: "Token access events aren't currently logged." |  |
| Detect: Data reads appear in logs | Not available | Audit log Token area says token access events aren't logged; Git area covers repository create/modify/delete, not reads. |  |
| Respond: Revocation ends active access | Partial | Up to 1 h delay for admin revocation; established connections may persist. | Owner revokes in user settings; admins revoke via Token Admin API or disable the user. |
| Respond: Stops working when user is removed | Yes | PATs stop working when the account is disabled or removed (up to one hour delay), but are not deleted and work again if access is restored. | Where: Organization settings > Users > ... > Remove from organization · API: DELETE https://vsaex.dev.azure.com/{organization}/_apis/userentitlements/{userId}?api-version=7.1 |

## Protect: what an admin can configure

### Admin controls
- **Restrict global personal access token creation** (Limit scope; all plans; default off). New PATs must target specific organizations. Where: Organization settings > Microsoft Entra.
- **Restrict full-scoped personal access token creation** (Limit scope; all plans; default off). New PATs must use custom scopes. Where: Organization settings > Microsoft Entra.
- **Enforce maximum personal access token lifespan** (Limit lifetime; all plans; default off). Caps lifetime of new or renewed PATs in days. Where: Organization settings > Microsoft Entra.
- **Restrict personal access token creation** (Disable; all plans; default off). Only allowlisted users (or packaging-only) can create or regenerate PATs; existing PATs keep working. Where: Organization settings > Policies.
- **Enable IP Conditional Access policy validation on non-interactive flows** (Limit network; all plans; default unknown). Checks Entra IP-based Conditional Access on PAT REST calls. Where: Organization settings > Policies.

### Not available (vendor states)
- PAT use (token access) is not recorded in the Azure DevOps audit log.

- Network: conditional (checked at api_request). Enforced on PAT REST calls only with the org policy enabled and an Entra IP-based Conditional Access policy.
- Lifetime: Expiry chosen at creation; tenant max-lifespan policy; becomes inactive if owner does not sign in within 90 days (Entra-backed orgs). Renewal: Reused until expiry; regenerating issues a new value and invalidates the old one.
- Keyless option: limited. PATs must meet Entra sign-in policies on REST calls; IP-based Conditional Access is checked on PAT calls only if the org enables "IP Conditional Access policy validation on non-interactive flows".
- Conditions: Policies require an Entra-backed organization; restricting creation does not stop existing PATs.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Azure DevOps audit log: Off by default; 90-day retention, not configurable; export or stream for longer.

### Fields that identify the credential
- `DisplayName / OwnerName` (Azure DevOps audit log): Token events name the PAT and owner.

### Lifecycle events
- create: `Token.PatCreateEvent` 
- revoke: `Token.PatRevokeEvent` 
- revoke: `Token.PatSystemRevokeEvent` System revocation (e.g. leak).
- leak: `Token.PatPublicDiscoveryEvent` Found in a public repo.

### Correlate on
`PAT display name`, `owner`

### API calls a holder can make, and whether they are logged
- recon: `GET https://app.vssps.visualstudio.com/_apis/profile/profiles/me`. Owner profile Logged: no. Token access events are not logged.
- discovery (bulk): `GET https://dev.azure.com/{org}/_apis/projects`. Projects Logged: no. Not logged.
- collection (bulk): `GET https://dev.azure.com/{org}/{project}/_apis/git/repositories`. Repos (then clone) Logged: unknown. Repo reads are not listed as audit events on fetched pages.
- collection: `GET https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repositoryId}/items?path={path}&api-version=7.1`. Repository file content and metadata Logged: no. Audit log Token area says token access events aren't logged; Git area covers repository create/modify/delete, not reads.

### What to look for (analyst guidance)
- PAT discovered in public repo
- New full-scoped PAT

## Respond: how to revoke it
- Admin: **Automatically revoke leaked personal access tokens**. PATs found in public GitHub repos are revoked automatically. Where: Organization settings > Microsoft Entra.
- Admin: **Token Admin revoke authorizations**. Admins revoke users' PATs by authorization ID; disabling a user also revokes their PATs. Where: POST /_apis/tokenadmin/revocations.

Owner revokes in user settings; admins revoke via Token Admin API or disable the user. Live access ends on revocation: partial. Up to 1 h delay for admin revocation; established connections may persist.

## No vendor documentation found
- PAT use is not logged.
- Whether Azure Activity Log records the service principal identity for ARM read calls made with azure-3/azure-4 tokens (Activity log typically skips reads).
- Exact Entra audit activity name for adding/removing a federated identity credential.
- Default of the Azure DevOps "IP Conditional Access policy validation on non-interactive flows" policy.
- Maximum Azure DevOps PAT lifetime when no tenant policy is set.
- Token format or prefix for storage keys, SAS, client secrets or Azure DevOps PATs.
- Whether app management policies require a specific license.

## Sources
- [Use personal access tokens - Azure DevOps | Microsoft Learn](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate) (retrieved 2026-10-14)
- [Conditional Access policies on Azure DevOps - Azure DevOps Services | Microsoft Learn](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/conditional-access-policies) (retrieved 2026-10-14)
- [Manage personal access tokens using policies - Azure DevOps | Microsoft Learn](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/manage-pats-with-policies-for-administrators) (retrieved 2026-10-14)
- [Revocations - Revoke Authorizations - REST API (Azure DevOps Token Admin) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/azure/devops/tokenadmin/revocations/revoke-authorizations) (retrieved 2026-10-14)
- [Revoke personal access tokens for users](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/admin-revoke-user-pats?view=azure-devops) (retrieved 2026-10-14)
- [Personal Access Tokens - List (Azure DevOps Token Admin)](https://learn.microsoft.com/en-us/rest/api/azure/devops/tokenadmin/personal-access-tokens/list?view=azure-devops-rest-7.1) (retrieved 2026-10-14)
- [Change application connection and security policies (Azure DevOps)](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/change-application-access-policies) (retrieved 2026-10-14)
- [Access Azure DevOps Audit Logs, Export, and Filter - Azure DevOps | Microsoft Learn](https://learn.microsoft.com/en-us/azure/devops/organizations/audit/azure-devops-auditing) (retrieved 2026-10-14)
- [Auditing events list - Azure DevOps | Microsoft Learn](https://learn.microsoft.com/en-us/azure/devops/organizations/audit/auditing-events) (retrieved 2026-10-14)
- [Audit Log - Query](https://learn.microsoft.com/en-us/rest/api/azure/devops/audit/audit-log/query?view=azure-devops-rest-7.1) (retrieved 2026-10-14)
- [Remove users from Azure DevOps](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/delete-organization-users) (retrieved 2026-10-14)
- [User Entitlements - Delete](https://learn.microsoft.com/en-us/rest/api/azure/devops/memberentitlementmanagement/user-entitlements/delete?view=azure-devops-rest-7.1) (retrieved 2026-10-14)
- [Revoke personal access tokens for users - Azure DevOps | Microsoft Learn](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/admin-revoke-user-pats) (retrieved 2026-10-14)
- [Profiles - Get - REST API (Azure DevOps Profile) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/azure/devops/profile/profiles/get) (retrieved 2026-10-14)
- [Projects - List - REST API (Azure DevOps Core) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/azure/devops/core/projects/list) (retrieved 2026-10-14)
- [Repositories - List - REST API (Azure DevOps Git) | Microsoft Learn](https://learn.microsoft.com/en-us/rest/api/azure/devops/git/repositories/list) (retrieved 2026-10-14)
- [Items - Get (Azure DevOps Git)](https://learn.microsoft.com/en-us/rest/api/azure/devops/git/items/get?view=azure-devops-rest-7.1) (retrieved 2026-10-14)
