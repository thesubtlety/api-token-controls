# SAP BTP and S/4HANA Cloud: XSUAA API credentials (btp security/api-credential)

`sap-2` · OAuth · service. An admin runs `btp create security/api-credential` to get a client ID with secret or certificate for the XSUAA REST APIs (users, role collections, trust) at global account, directory or subaccount level.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | btp list security/api-credential shows all API credentials in the targeted global account, directory, or subaccount. | btp list security/api-credential shows all API credentials in the targeted global account, directory, or subaccount. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No IP allowlist for OAuth clients/tokens found in the XSUAA docs reviewed. |  |
| Protect: Expires automatically | No docs found | No documented expiry for the credential itself |  |
| Detect: Usage appears in logs | Yes | Client ID | SAP Audit Log service (BTP subaccount): Audit Log Viewer or Retrieval API GET <url>/auditlog/v2/auditlogrecords; 90 days free, longer with Audit Log service premium edition (support ticket). |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | No docs found | Issued tokens follow XSUAA token validity. |  |
| Respond: Stops working when user is removed | N/A | API credentials are a client ID with secret or certificate scoped to an account, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **token-validity / refresh-token-validity** (Limit lifetime; all plans; default varies). Sets access/refresh token lifetime per XSUAA instance. Where: xs-security.json oauth2-configuration.
- **Token Validity (subaccount security settings)** (Limit lifetime; all plans; default on). Sets default token lifetimes for all instances in a subaccount that don't set their own. Where: BTP cockpit > Subaccount > Security > Settings > Token Validity; Security Settings API.

- Network: unknown (checked at unknown). No IP allowlist for OAuth clients/tokens found in the XSUAA docs reviewed.
- Lifetime: No documented expiry for the credential itself. Renewal: Secret shown once; create a new credential and delete the old one to rotate.
- Keyless option: not_applicable. OAuth client credential; no user/IdP step. No explicit doc statement on conditional access.
- Conditions: Requires admin of the targeted global account/directory/subaccount.

## Detect: what gets logged
- Token prefix: not established

### Logs
- SAP Audit Log service (BTP subaccount): Audit Log Viewer or Retrieval API GET <url>/auditlog/v2/auditlogrecords; 90 days free, longer with Audit Log service premium edition (support ticket).

### Fields that identify the credential
- `Client ID` (UAA ClientAuthenticationSuccess): 

### Lifecycle events
- use: `TokenIssuedEvent` UAA
- use: `tableName "xs_rolecollection2user", crudType "CREATE"` Role collection assignment done with the credential

### Correlate on
`client ID`, `zone ID`

### API calls a holder can make, and whether they are logged
- enumeration (bulk): `GET /sap/rest/authorization/v2/roles`. Roles in the subaccount Logged: unknown. Read events not listed in XSUAA audit page

### What to look for (analyst guidance)
- Role collection assignments or trust changes logged with UNKNOWN_USER

## Respond: how to revoke it
- Admin: **Token revoke endpoint**. Revokes an issued token, but apps validating offline keep accepting it until expiry. Where: Cloud Foundry UAA revoke endpoint.
- Admin: **btp delete security/api-credential**. Deletes XSUAA API credentials. Where: btp CLI.

btp delete security/api-credential Live access ends on revocation: unknown. Issued tokens follow XSUAA token validity.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Revocation ends active access
- Audit event for API credential creation/deletion
- Any IP/network allowlist for XSUAA clients, btp API credentials, IAS API secrets or S/4HANA communication users.
- Whether XSUAA password-grant tokens (cis service keys) honor IAS/corporate IdP MFA or conditional access.
- Exact audit message for service key deletion and for API credential create/delete in XSUAA audit log.
- Whether communication user passwords expire.
- Org-wide switch to block creation of service keys or API credentials (none found).
- IAS audit event emitted on client secret creation/deletion (change log covers admin CREATE/UPDATE/DELETE generally).

## Sources
- [Managing API Credentials for Calling REST APIs of SAP Authorization and Trust Management Service](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/managing-api-credentials-for-calling-rest-apis-of-sap-authorization-and-trust-managemen-ce43eb5.md) (retrieved 2026-10-14)
- [Get Access to the APIs](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/get-access-to-the-apis-fda1027.md) (retrieved 2026-10-14)
- [Auditing and Logging Information for SAP Authorization and Trust Management Service](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/60-security/auditing-and-logging-information-for-sap-authorization-and-trust-management-service-d8f4b7c.md) (retrieved 2026-10-14)
- [UAA Audit Requirements (Cloud Foundry docs, linked from SAP XSUAA audit page)](https://docs.cloudfoundry.org/running/managing-cf/uaa-audit-requirements.html) (retrieved 2026-10-14)
- [Call an API (SAP Authorization and Trust Management service)](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/call-an-api-764abf2.md) (retrieved 2026-10-14)
- [Security Considerations for the SAP Authorization and Trust Management Service](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/60-security/security-considerations-for-the-sap-authorization-and-trust-management-service-f117cab.md) (retrieved 2026-10-14)
- [Configure Token Policy for SAP Authorization and Trust Management Service](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/configure-token-policy-for-sap-authorization-and-trust-management-service-40290a9.md) (retrieved 2026-10-14)
- [Validation and Revocation of Access Tokens](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/30-development/validation-and-revocation-of-access-tokens-8eb23a1.md) (retrieved 2026-10-14)
