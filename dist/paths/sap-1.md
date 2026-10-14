# SAP BTP and S/4HANA Cloud: XSUAA service key / service binding (OAuth client credentials: binding-secret or X.509)

`sap-1` · OAuth · service. Binding an app to an XSUAA (SAP Authorization and Trust Management) instance, or creating a service key, issues a client ID plus a binding secret or X.509 certificate. The holder calls the token endpoint (client_credentials) and gets a JWT access token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No IP allowlist for OAuth clients/tokens found in the XSUAA docs reviewed. |  |
| Protect: Expires automatically | Partial | Secret lives as long as the binding/key; X.509 until cert expiry; access token 12h default Admin control: token-validity / refresh-token-validity; Token Validity (subaccount security settings). | token-validity / refresh-token-validity: xs-security.json oauth2-configuration · Token Validity (subaccount security settings): BTP cockpit > Subaccount > Security > Settings > Token Validity; Security Settings API |
| Detect: Usage appears in logs | Yes | Client ID, Principal ID (client or user ID) | SAP Audit Log service (BTP subaccount): Audit Log Viewer or Retrieval API GET <url>/auditlog/v2/auditlogrecords; 90 days free, longer with Audit Log service premium edition (support ticket). |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | Partial | Secret stops working at once, but already-issued JWTs remain valid in offline-validating apps until expiry. | Delete the binding or service key (cf unbind-service / delete-service-key); create a replacement first. Shorten token-validity; for apps validating offline, wait for expiry or rotate signing keys. |
| Respond: Stops working when user is removed | N/A | The client ID and secret identify the application, not a person. |  |

## Protect: what an admin can configure

### Admin controls
- **credential-types (xs-security.json)** (Limit scope; all plans; default varies). Restricts which secret types (binding-secret, x509) bindings and service keys of an XSUAA instance can use. Where: xs-security.json oauth2-configuration.credential-types.
- **token-validity / refresh-token-validity** (Limit lifetime; all plans; default varies). Sets access/refresh token lifetime per XSUAA instance. Where: xs-security.json oauth2-configuration.
- **Token Validity (subaccount security settings)** (Limit lifetime; all plans; default on). Sets default token lifetimes for all instances in a subaccount that don't set their own. Where: BTP cockpit > Subaccount > Security > Settings > Token Validity; Security Settings API.
- **hide-secret** (Other; all plans; default off). Omits the client secret from a binding or service key that only needs authorization data. Where: binding parameters {"credential-type":"binding-secret","hide-secret":"true"}.

### Not available (vendor states)
- XSUAA does not check certificate revocation; a compromised X.509 binding cert stays valid until the binding is deleted.
- Revoked access tokens keep working in apps that validate offline until they expire.
- Legacy instance secrets cannot be rotated without recreating the instance.

- Network: unknown (checked at unknown). No IP allowlist for OAuth clients/tokens found in the XSUAA docs reviewed.
- Lifetime: Secret lives as long as the binding/key; X.509 until cert expiry; access token 12h default. Renewal: Client re-requests tokens with the long-lived secret; rotate the secret by unbind/rebind or new service key.
- Keyless option: not_applicable. Client-credential flows involve no user, so the identity provider is not consulted; audit entries show UNKNOWN_USER. No doc statement on conditional access was found.
- Conditions: Cloud Foundry/Kyma environments; instance-secret not allowed for new bindings since 2026-01-19.

## Detect: what gets logged
- Token prefix: not established

### Logs
- SAP Audit Log service (BTP subaccount): Audit Log Viewer or Retrieval API GET <url>/auditlog/v2/auditlogrecords; 90 days free, longer with Audit Log service premium edition (support ticket).

### Fields that identify the credential
- `Client ID` (UAA ClientAuthenticationSuccess): Recorded data per UAA audit spec
- `Principal ID (client or user ID)` (UAA TokenIssuedEvent): Also records scopes

### Lifecycle events
- create: `binding entry created (XSUAA instance audit)` New binding secret appears in subaccount audit log; exact message text not given
- use: `TokenIssuedEvent` UAA event
- use: `ClientAuthenticationSuccess` UAA event
- revoke: `ClientDeleteSuccess` UAA event when a client is deleted

### Correlate on
`client ID`, `subaccount/zone ID`, `service instance ID`

### API calls a holder can make, and whether they are logged
- recon: `POST <uaa url>/oauth/token (grant_type=client_credentials)`. Access token and granted scopes Logged: yes (`TokenIssuedEvent`). UAA event, principal = client ID

### What to look for (analyst guidance)
- UNKNOWN_USER entries mark client-credential flows
- Token issuance for a client from a new caller pattern
- New service keys on high-privilege instances (apiaccess, cis central)

## Respond: how to revoke it
- Admin: **Delete binding / service key**. Deleting the binding or service key makes XSUAA stop accepting its secret/certificate. Where: cf unbind-service / cf delete-service-key / cockpit.
- Admin: **Token revoke endpoint**. Revokes an issued token, but apps validating offline keep accepting it until expiry. Where: Cloud Foundry UAA revoke endpoint.

Delete the binding or service key (cf unbind-service / delete-service-key); create a replacement first. Shorten token-validity; for apps validating offline, wait for expiry or rotate signing keys. Live access ends on revocation: partial. Secret stops working at once, but already-issued JWTs remain valid in offline-validating apps until expiry.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Whether API data reads by the client are logged by consuming apps
- Data reads depend on the bound application; not logged by XSUAA
- Any IP/network allowlist for XSUAA clients, btp API credentials, IAS API secrets or S/4HANA communication users.
- Whether XSUAA password-grant tokens (cis service keys) honor IAS/corporate IdP MFA or conditional access.
- Exact audit message for service key deletion and for API credential create/delete in XSUAA audit log.
- Whether communication user passwords expire.
- Org-wide switch to block creation of service keys or API credentials (none found).
- IAS audit event emitted on client secret creation/deletion (change log covers admin CREATE/UPDATE/DELETE generally).

## Sources
- [Service Instance Secrets (SAP Authorization and Trust Management service)](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/service-instance-secrets-5578ec4.md) (retrieved 2026-10-14)
- [Auditing and Logging Information for SAP Authorization and Trust Management Service](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/60-security/auditing-and-logging-information-for-sap-authorization-and-trust-management-service-d8f4b7c.md) (retrieved 2026-10-14)
- [Security Considerations for the SAP Authorization and Trust Management Service](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/60-security/security-considerations-for-the-sap-authorization-and-trust-management-service-f117cab.md) (retrieved 2026-10-14)
- [Rotate Binding Secrets](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/rotate-binding-secrets-618441b.md) (retrieved 2026-10-14)
- [Configure Token Policy for SAP Authorization and Trust Management Service](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/configure-token-policy-for-sap-authorization-and-trust-management-service-40290a9.md) (retrieved 2026-10-14)
- [Validation and Revocation of Access Tokens](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/30-development/validation-and-revocation-of-access-tokens-8eb23a1.md) (retrieved 2026-10-14)
- [UAA Audit Requirements (Cloud Foundry docs, linked from SAP XSUAA audit page)](https://docs.cloudfoundry.org/running/managing-cf/uaa-audit-requirements.html) (retrieved 2026-10-14)
- [Retention of Audit Data written from SAP BTP Applications and Services](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/retention-of-audit-data-written-from-sap-btp-applications-and-services-3ea497f.md) (retrieved 2026-10-14)
- [Audit Log Retrieval API Usage for Subaccounts in the Cloud Foundry Environment](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/audit-log-retrieval-api-usage-for-subaccounts-in-the-cloud-foundry-environment-30ece35.md) (retrieved 2026-10-14)
- [Audit Events Logged by SAP Audit Log service](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/audit-events-logged-by-sap-audit-log-service-d888e5e.md) (retrieved 2026-10-14)
- [Parameters for Suppressing Client Secrets](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/parameters-for-suppressing-client-secrets-974ac87.md) (retrieved 2026-10-14)
