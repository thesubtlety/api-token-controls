# SAP BTP and S/4HANA Cloud: SAP Cloud Identity Services client ID/secret or certificate (applications, systems as administrators, technical users)

`sap-5` · OAuth · service. In the Identity Authentication admin console, admins generate client secrets or certificates for an application (Trust > Client Authentication), for a system added as an administrator, or for a technical user. These authenticate to the SCIM/user-management REST APIs and OIDC token endpoint.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Administrators tile lists all administrators including systems; client secrets are shown per application (Trust > Client Authentication), with no tenant-wide secret list. | Administrators tile lists all administrators including systems; client secrets are shown per application (Trust > Client Authentication), with no tenant-wide secret list. |
| Protect: Admin can block or require approval | Yes | Manage Applications / Manage Tenant Configuration administrator roles | Manage Applications / Manage Tenant Configuration administrator roles: Administration console > Administrators > authorizations |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Risk-based authentication applies to user logons; no IP restriction for API client secrets found. |  |
| Protect: Expires automatically | Yes | 1 year, 2 years, or Never | Secret 'Expire in': Admin console > Applications > Trust > Client Authentication > Secrets > Add; Administrators > System > Secrets |
| Detect: Usage appears in logs | Yes | caller, Administrator's ID | Where: Cloud Identity Services admin console > Audit and Change Logs > Audit Logs > Cloud Foundry (opens BTP Audit Log Viewer); filter on caller. Admin changes: Audit and Change Logs > Export Change Logs > Export (CSV, Administrator's ID) · API: GET <url_from_service_key>/auditlog/v2/auditlogrecords (subaccount Audit Log Retrieval API) |
| Detect: Data reads appear in logs | Yes | audit.authentication | Where: Audit Log Viewer for the mapped subaccount; filter category audit.authentication and caller = client ID |
| Respond: Revocation ends active access | No docs found | Effect on already-issued tokens not documented. |  |
| Respond: Stops working when user is removed | N/A | Systems as administrators and application clients are not persons. |  |

## Protect: what an admin can configure

### Admin controls
- **Secret 'Expire in'** (Limit lifetime; all plans; default unknown). Sets IAS client secret expiry to 1 year, 2 years or Never. Where: Admin console > Applications > Trust > Client Authentication > Secrets > Add; Administrators > System > Secrets.
- **Secret scope (Application / Application Users / OpenID)** (Limit scope; all plans; default off). Limits which APIs an application secret may be used for; all scopes are selected by default. Where: Client Authentication > Secrets > Scope.
- **Administrator roles for systems** (Limit scope; all plans; default unknown). Assigns only needed admin roles (e.g. Read Users) to a system administrator credential. Where: Admin console > Administrators > Add > System.
- **Client ID Lock** (Other; all plans; default off). Locks a technical user's client ID after 5 failed secret logons. Where: Users & Authorizations > Technical User > Details > Client ID.
- **Manage Applications / Manage Tenant Configuration administrator roles** (Disable; all plans; default unknown). Only administrators with Manage Applications can configure applications (including client secrets), and only Manage Tenant Configuration can add systems as administrators. Where: Administration console > Administrators > authorizations.

- Network: unknown (checked at unknown). Risk-based authentication applies to user logons; no IP restriction for API client secrets found.
- Lifetime: 1 year, 2 years, or Never. Renewal: Add a new secret (up to 20 per app, 2 per system), switch clients, delete the old one.
- Keyless option: not_applicable. Client authentication; a system administrator 'can perform the same actions as the human administrator' without an interactive IdP login. Conditional-access behavior not documented.
- Conditions: 

## Detect: what gets logged
- Token prefix: not established

### Logs
- Identity Authentication audit log (via BTP Audit Log Viewer): 90 days
- IAS change logs: CSV export, admin CREATE/UPDATE/DELETE, 24 months

### Fields that identify the credential
- `caller` (IAS audit log): Identifier of the subject
- `Administrator's ID` (Change log): User or system that made the change

### Lifecycle events
- use: `action=issueJwtToken` IAS audit action value
- use: `action=search objectType=scimUser(s)` Possible audit values; exact pairing not documented

### Correlate on
`client ID`, `caller`, `objectId`

### API calls a holder can make, and whether they are logged
- collection (bulk): `GET /scim/Users (Identity Authentication SCIM API)`. Tenant users Logged: unknown. IAS audit actions include search/read/export but mapping not documented
- collection: `GET /scim/Users (Identity Directory API)`. All users in the tenant Logged: yes (`audit.authentication`). Docs say all authentication and authorization checks are audit logged; they do not say the read itself is recorded as a data-access event.

### What to look for (analyst guidance)
- Secrets set to Never
- System administrators with Manage Tenant Configuration
- Bulk user export/search by a system

## Respond: how to revoke it


Delete the secret/certificate, the system administrator, or the technical user in the admin console. Live access ends on revocation: unknown. Effect on already-issued tokens not documented.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Revocation ends active access
- Exact event when a secret is added or deleted
- Any IP/network allowlist for XSUAA clients, btp API credentials, IAS API secrets or S/4HANA communication users.
- Whether XSUAA password-grant tokens (cis service keys) honor IAS/corporate IdP MFA or conditional access.
- Exact audit message for service key deletion and for API credential create/delete in XSUAA audit log.
- Whether communication user passwords expire.
- Org-wide switch to block creation of service keys or API credentials (none found).
- IAS audit event emitted on client secret creation/deletion (change log covers admin CREATE/UPDATE/DELETE generally).

## Sources
- [Configure Secrets for API Authentication (SAP Cloud Identity Services)](https://github.com/SAP-docs/btp-cloud-identity-services/blob/main/docs/Development/configure-secrets-for-api-authentication-9ea13fe.md) (retrieved 2026-10-14)
- [Add Administrators (SAP Cloud Identity Services)](https://github.com/SAP-docs/btp-cloud-identity-services/blob/main/docs/Operation-Guide/add-administrators-bbbdbdd.md) (retrieved 2026-10-14)
- [Manage Technical User Details](https://github.com/SAP-docs/btp-cloud-identity-services/blob/main/docs/Operation-Guide/manage-technical-user-details-14b36c2.md) (retrieved 2026-10-14)
- [List Administrators](https://github.com/SAP-docs/btp-cloud-identity-services/blob/main/docs/Operation-Guide/list-administrators-c79a5c6.md) (retrieved 2026-10-14)
- [Access Audit Logs (Audit Log Service in SAP BTP, Cloud Foundry)](https://github.com/SAP-docs/btp-cloud-identity-services/blob/main/docs/Monitoring-and-Reporting/access-audit-logs-audit-log-service-in-sap-btp-cloud-foundry-a3e793c.md) (retrieved 2026-10-14)
- [Export Change Logs with a History of Administration Operations](https://github.com/SAP-docs/btp-cloud-identity-services/blob/main/docs/Monitoring-and-Reporting/export-change-logs-with-a-history-of-administration-operations-9d96aae.md) (retrieved 2026-10-14)
- [Auditing and Logging Information (Identity Authentication)](https://github.com/SAP-docs/btp-cloud-identity-services/blob/main/docs/Security/auditing-and-logging-information-ac5537b.md) (retrieved 2026-10-14)
- [Audit Log Retrieval API for Global Accounts in the Cloud Foundry Environment](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/audit-log-retrieval-api-for-global-accounts-in-the-cloud-foundry-environment-7db3c9f.md) (retrieved 2026-10-14)
- [Identity Directory API](https://github.com/SAP-docs/btp-cloud-identity-services/blob/main/docs/Development/identity-directory-api-5be5692.md) (retrieved 2026-10-14)
- [Edit Administrator Authorizations](https://github.com/SAP-docs/btp-cloud-identity-services/blob/main/docs/Operation-Guide/edit-administrator-authorizations-86ee374.md) (retrieved 2026-10-14)
