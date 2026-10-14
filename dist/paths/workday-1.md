# Workday: Integration System User (ISU) user name and password

`workday-1` · Basic credentials · service. An admin creates a non-person ISU with the Create Integration System User task and sets its password. Integrations send the ISU user name and password to Workday web services.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Partial | Authentication policies can include a rule for the ISU security group, but the ISU signs in with user name and password rather than through SSO. | Where: Manage Authentication Policies > Authentication Ruleset: rule for the ISU's security group > Allowed Authentication Types; then Activate All Pending Authentication Policy Changes |
| Protect: IP restriction | Conditional | Authentication policies support IP restrictions and can target the ISU's security group. Public docs do not say whether this is checked per web service request or only at authentication. | Where: Manage Authentication Policies > Authentication Ruleset: rule for the ISU's security group > Authentication Condition > Create IP Range; then Activate All Pending Authentication Policy Changes |
| Protect: Expires automatically | Partial | Password follows tenant password rules; ISU can be exempted from expiration; session timeout 0 = no expiry | Where: Maintain Password Rules > System Users Exempt from password expiration (remove the ISU to make its password expire) |
| Detect: Usage appears in logs | Yes | System Account | Where: View User Activity report (filter System Account = ISU); ISU related actions > Security Profile > View Signon History · API: GET https://<tenantHostname>/privacy/v1/activityLogging (spec basePath)?from=...&to=...&systemAccount=<account> |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Session Timeout 0 means ISU sessions do not time out. |  |
| Respond: Stops working when user is removed | N/A | An ISU is a dedicated non-person system account. |  |

## Protect: what an admin can configure

### Admin controls
- **Integration System Security Group domain permissions** (Limit resources; all plans; default varies). ISU access is limited to domains granted to its security group. Where: Create Security Group (Integration System Security Group) + Maintain Permissions for Security Group.
- **Do Not Allow UI Sessions** (Other; all plans; default unknown). Prevents the ISU from signing in to the Workday UI. Where: Create Integration System User.
- **Authentication policies with IP restrictions** (Limit network; all plans; default off). Authentication policy rules can target the ISU security group and restrict by IP and allowed authentication types. Where: Manage Authentication Policies; Activate All Pending Authentication Policy Changes.
- **Maintain Password Rules (System Users exempt from password expiration)** (Limit lifetime; all plans; default off). Adding an ISU here stops its password from expiring; leaving it off keeps tenant expiry. Where: Maintain Password Rules.

- Network: conditional (checked at unknown). Authentication policies support IP restrictions and can target the ISU's security group. Public docs do not say whether this is checked per web service request or only at authentication.
- Lifetime: Password follows tenant password rules; ISU can be exempted from expiration; session timeout 0 = no expiry. Renewal: Same password is reused until an admin changes it.
- Keyless option: not_verified. Public docs do not say whether ISU password logins bypass SAML/SSO. Do Not Allow UI Sessions blocks UI sign-in only. ISUs can be given their own authentication policy rule (example allows User Name Password).
- Conditions: Requires Integration Security domain.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Update Audit report: Sign-on/sign-off times and invalid password use per account. Requires System Monitoring / Update Audit domains.
- View User Activity report / User Activity data source / /activityLogging REST API: Must be enabled in tenant setup; 30-day retention; export weekly. Coverage of web service calls not stated.
- API Activity Reports: Monthly aggregates incl. Top 10 IP Addresses; up to 13 months; US and EU only.

### Fields that identify the credential
- `System Account` (User Activity): The ISU account name.

### Lifecycle events
No docs found.

### Correlate on
`ISU user name`, `IP Address`, `User Agent`

### API calls a holder can make, and whether they are logged
- collection (bulk): `SOAP Human_Resources Get_Workers`. Public and private worker data within ISU security Logged: unknown. Workday says it doesn't log GET requests or unsuccessful requests for web services; whether SOAP reads appear in User Activity is not stated.

### What to look for (analyst guidance)
- ISU sign-ons from IPs outside the integration's known egress
- Invalid password attempts on ISU accounts
- Spike in ISU activity or new tasks/reports accessed

## Respond: how to revoke it


Change the ISU password and/or restrict it with an authentication policy; exact disable task not public. Live access ends on revocation: unknown. Session Timeout 0 means ISU sessions do not time out.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- Data reads appear in logs
- Revocation ends active access
- Exact audit event names for ISU password changes
- Whether SOAP reads by ISUs appear in User Activity
- No documented whoami call for ISUs
- Whether authentication-policy IP rules are enforced on each API request or only at sign-in/token issuance (authentication policy pages require login).
- Whether disabling an API client or regenerating a refresh token invalidates already-issued access tokens (docs say tokens can be replayed within their lifetime).
- Exact task names to disable/delete an API client and to revoke a refresh token.
- Default access-token lifetime for integration clients.
- Whether ISU password authentication bypasses SAML SSO / IdP conditional access.
- Whether User Activity Logging records web service (SOAP/REST) calls made by ISUs; the activityLogging REST API reference requires login.
- Audit event names for API client creation, refresh token generation, or client disablement.

## Sources
- [Set Up Live Data Query ISU Authentication in Workday](https://doc.workday.com/admin-guide/en-us/workday-data-cloud/data-out/workday-live-data-query-/set-up-live-data-query-isu-authentication.html) (retrieved 2026-10-14)
- [Steps: Set Up Workday Integration (Peakon)](https://doc.workday.com/peakon/en-us/workday-peakon-employee-voice/integrations/workday-integration/qdk1635869479224.html) (retrieved 2026-10-14)
- [Steps: Set Up Workday Mobile Applications](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/mobile-setup/dan1370797996359.html) (retrieved 2026-10-14)
- [Connect to Workday Using OAuth (Peakon)](https://doc.workday.com/peakon/en-us/workday-peakon-employee-voice/integrations/workday-integration/nfa1667304944189.html) (retrieved 2026-10-14)
- [Example: Maintain Access to Payment Elections (authentication policy)](https://doc.workday.com/admin-guide/en-us/financial-management/expenses/configuration-examples/yuj1547597493242.html) (retrieved 2026-10-14)
- [Peakon Workday integration troubleshooting](https://doc.workday.com/peakon/en-us/workday-peakon-employee-voice/integrations/workday-integration/nkb1654263618325_1.html) (retrieved 2026-10-14)
- [Concept: User Activity Logging](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/user-activity-logging/unv1636547598141.html) (retrieved 2026-10-14)
- [Workday REST API reference: privacy v1 GET /activityLogging](https://community.workday.com/sites/default/files/file-hosting/restapi/index.html#privacy/v1/get-/activityLogging) (retrieved 2026-10-14)
- [Reference: Auditing-Related Reports](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/auditing/wln1467042699742.html) (retrieved 2026-10-14)
- [Workday AI Admin Guide PDF (FAQ: Agent Security)](https://doc.workday.com/content/dam/fmdita-outputs/pdfs/admin-guide/en-us/Admin-Guide-Workday-AI.pdf) (retrieved 2026-10-14)
- [Workday Web Services v47.0 Human_Resources Get_Workers](https://community.workday.com/sites/default/files/file-hosting/productionapi/Human_Resources/v47.0/Get_Workers.html) (retrieved 2026-10-14)
- [Reference: Integrations, EIB, and Web Service Limits](https://doc.workday.com/admin-guide/en-us/manage-workday/tenant-configuration/it-administrator-resources/limitations-and-availability/dan1370797408285.html) (retrieved 2026-10-14)
