# SAP BTP and S/4HANA Cloud: S/4HANA Cloud Public Edition communication user (basic auth or X.509) in a communication arrangement

`sap-6` · Basic credentials · service. A communication user is a technical user assigned to a communication system and used by a communication arrangement for inbound API calls. It authenticates with user/password (basic) or an X.509 client certificate.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Maintain Communication Users app lists users and can download all of them to a spreadsheet. | Where: Maintain Communication Users app > download list to spreadsheet |
| Protect: Admin can block or require approval | Yes | Lock / delete communication user | Lock / delete communication user: Maintain Communication Users app |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No IP allowlist for communication users found in the pages reviewed. |  |
| Protect: Expires automatically | No docs found | Password expiry not stated; cert valid until its expiry |  |
| Detect: Usage appears in logs | Yes | user name | Where: Display Security Audit Log app; filter by user and logon events (e.g. AU1) · API: GET <host>/sap/opu/odata4/sap/rsau_log_api/srvd_a2x/sap/rsau_log_api/0001/SecurityAuditLog?$filter=log_tstmp ge ... (comm. arrangement SAP_COM_0750) |
| Detect: Data reads appear in logs | Conditional | Logon in Security Audit Log; reads only if Read Access Logging configured | Where: Enable: Read Access Logging Configuration app > Enabling in Client > Edit > select checkbox. Review: Read Access Logging: Monitor app > search by time range and log domain/purpose |
| Respond: Revocation ends active access | No docs found | Security sessions created with x-sap-security-session may persist; effect of lock on them not documented. |  |
| Respond: Stops working when user is removed | N/A | Basic/certificate sessions run as a technical communication user, not a business user. |  |

## Protect: what an admin can configure

### Admin controls
- **Lock / delete communication user** (Disable; all plans; default unknown). Locks or deletes a communication user in the Maintain Communication Users app. Where: Maintain Communication Users app.
- **Communication scenario / arrangement** (Limit scope; all plans; default unknown). The arrangement's communication scenario defines which inbound services and auth methods the user can use. Where: Communication Arrangements app (SAP recommends one comm user per arrangement).
- **Communication user password policy** (Other; all plans; default on). Requires 20+ character passwords with a special character and locks after 3 failed logons. Where: Built in (view in Display Static System Audit > Password Policy Technical User).

- Network: unknown (checked at unknown). No IP allowlist for communication users found in the pages reviewed.
- Lifetime: Password expiry not stated; cert valid until its expiry. Renewal: Change the password or present a new cert with the same subject/issuer; both certs work until each expires.
- Keyless option: not_applicable. SAP: sessions using certificate-based or basic authentication 'run in the context of a technical communication user', not a business user, so business-user SSO is not involved.
- Conditions: Admin business role (SAP_BR_ADMINISTRATOR).

## Detect: what gets logged
- Token prefix: not established

### Logs
- Security Audit Log (Display Security Audit Log app; SAL API SAP_COM_0750): 45 days default retention, configurable; archiving object BC_SAL
- Read Access Logging: Only if configured by customer

### Fields that identify the credential
- `user name` (Security Audit Log): Logon attempts

### Lifecycle events
- use: `successful and unsuccessful logon attempts` Event IDs listed in SAP Note 2903873

### Correlate on
`communication user name`, `communication system`, `communication arrangement`

### API calls a holder can make, and whether they are logged
- collection (bulk): `Inbound OData/SOAP services of the arranged communication scenario`. Business data in scope of the scenario Logged: plan. Logon in Security Audit Log; reads only if Read Access Logging configured

### What to look for (analyst guidance)
- Logons from a comm user outside its integration schedule
- Lockouts after 3 failed attempts
- Comm user shared across several arrangements

## Respond: how to revoke it


Lock or delete the user in Maintain Communication Users; change its password; remove its certificate. Live access ends on revocation: unknown. Security sessions created with x-sap-security-session may persist; effect of lock on them not documented.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Revocation ends active access
- Whether OData reads by comm users are logged without Read Access Logging
- Generic whoami endpoint
- Any IP/network allowlist for XSUAA clients, btp API credentials, IAS API secrets or S/4HANA communication users.
- Whether XSUAA password-grant tokens (cis service keys) honor IAS/corporate IdP MFA or conditional access.
- Exact audit message for service key deletion and for API credential create/delete in XSUAA audit log.
- Whether communication user passwords expire.
- Org-wide switch to block creation of service keys or API credentials (none found).
- IAS audit event emitted on client secret creation/deletion (change log covers admin CREATE/UPDATE/DELETE generally).

## Sources
- [Maintain Communication Users (SAP S/4HANA Cloud Public Edition)](https://help.sap.com/docs/SAP_S4HANA_CLOUD/0f69f8fb28ac4bf48d2b57b9637e81fa/eef80dda3867461c92ac1273689ed36f.html) (retrieved 2026-10-14)
- [How to Create Communication Users](https://help.sap.com/docs/SAP_S4HANA_CLOUD/0f69f8fb28ac4bf48d2b57b9637e81fa/0377adea0401467f939827242c1f4014.html) (retrieved 2026-10-14)
- [Secure Communication for Inbound Integration](https://help.sap.com/docs/SAP_S4HANA_CLOUD/55a7cb346519450cb9e6d21c1ecd6ec1/36ea4658c0c51f60e10000000a44147b.html) (retrieved 2026-10-14)
- [Display Security Audit Log](https://help.sap.com/docs/SAP_S4HANA_CLOUD/55a7cb346519450cb9e6d21c1ecd6ec1/7eed4aba8bcb4d7091e289cf0dc00cf4.html) (retrieved 2026-10-14)
- [How to Access Security Logs via API](https://help.sap.com/docs/SAP_S4HANA_CLOUD/55a7cb346519450cb9e6d21c1ecd6ec1/8c170f837c5f4783947d7db0ebc4fca6.html) (retrieved 2026-10-14)
- [Retrieving Security Audit Log](https://help.sap.com/docs/SAP_S4HANA_CLOUD/733cba15cc714b5b9129224454420e63/ce394703945d426a97e1e0cad524946d.html) (retrieved 2026-10-14)
- [How to Enable Read Access Logging](https://help.sap.com/docs/SAP_S4HANA_CLOUD/55a7cb346519450cb9e6d21c1ecd6ec1/3fdad50926304d62b48d0d357e2ebd3e.html) (retrieved 2026-10-14)
- [How to Monitor the Read Access Log](https://help.sap.com/docs/SAP_S4HANA_CLOUD/55a7cb346519450cb9e6d21c1ecd6ec1/5a1011a87588417187561b63562a900e.html) (retrieved 2026-10-14)
- [Security Audit Log (SAP S/4HANA Cloud Public Edition)](https://help.sap.com/docs/SAP_S4HANA_CLOUD/55a7cb346519450cb9e6d21c1ecd6ec1/ebbbc901f3b6411c8c2ed87e7a4ed71d.html) (retrieved 2026-10-14)
- [Security Logging (SAP S/4HANA Cloud Public Edition)](https://help.sap.com/docs/SAP_S4HANA_CLOUD/55a7cb346519450cb9e6d21c1ecd6ec1/005f91d089c74382ac3645628c70bede.html) (retrieved 2026-10-14)
- [Security Recommendations (SAP S/4HANA Cloud Public Edition)](https://help.sap.com/docs/SAP_S4HANA_CLOUD/55a7cb346519450cb9e6d21c1ecd6ec1/fafa6639cf7b4265b68da63efbc8fb96.html) (retrieved 2026-10-14)
