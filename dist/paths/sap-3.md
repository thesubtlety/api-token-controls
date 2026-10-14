# SAP BTP and S/4HANA Cloud: SAP Cloud Management service (cis) service key

`sap-3` · OAuth · person or service. A service key on a `cis` instance gives an OAuth client for the Accounts/Entitlements/Provisioning APIs. Default grant is password (a user's credentials plus client); client credentials is available when requested at instance creation.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Entitlements (SAP Cloud Management service plans) | Entitlements (SAP Cloud Management service plans): Global account > Entitlements |
| Protect: SSO and MFA rules apply | Partial | With the Password grant the user's password plus 2FA passcode is needed; the Client Credentials grant has no user check. | Where: BTP cockpit > global account > Security > Trust Configuration > Establish Trust (custom IdP for platform users; enforce MFA there). Client Credentials grant bypasses this. · API: POST <uaa_url>/oauth/token grant_type=password, username, password=<password><2FA passcode> |
| Protect: IP restriction | No docs found | No IP allowlist for OAuth clients/tokens found in the XSUAA docs reviewed. |  |
| Protect: Expires automatically | Partial | Key lives until deleted; tokens follow XSUAA validity Admin control: token-validity / refresh-token-validity; Token Validity (subaccount security settings). | token-validity / refresh-token-validity: xs-security.json oauth2-configuration · Token Validity (subaccount security settings): BTP cockpit > Subaccount > Security > Settings > Token Validity; Security Settings API |
| Detect: Usage appears in logs | Yes | Client ID | Where: Account Explorer header > SAP Audit Log Viewer (global account); filter retrieved records for the service key's client ID · API: GET <url_from_service_key>/auditlog/v2/auditlogrecords?time_from=...&time_to=... (Auditlog Management, Central plan); filter on clientId |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | Partial | Issued tokens live until expiry. | Delete the cis service key (and instance if needed); reset the user's password for password-grant keys. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **token-validity / refresh-token-validity** (Limit lifetime; all plans; default varies). Sets access/refresh token lifetime per XSUAA instance. Where: xs-security.json oauth2-configuration.
- **Token Validity (subaccount security settings)** (Limit lifetime; all plans; default on). Sets default token lifetimes for all instances in a subaccount that don't set their own. Where: BTP cockpit > Subaccount > Security > Settings > Token Validity; Security Settings API.
- **Cloud Management service plan selection** (Limit scope; all plans; default unknown). The cis plan (central, central-viewer, local, local-viewer) fixes the API scopes in the token. Where: Entitlements + cis instance plan.
- **Entitlements (SAP Cloud Management service plans)** (Disable; all plans; default unknown). A cis service instance and key can only be created in a subaccount where the global account admin has entitled a Cloud Management service plan. Where: Global account > Entitlements.

- Network: unknown (checked at unknown). No IP allowlist for OAuth clients/tokens found in the XSUAA docs reviewed.
- Lifetime: Key lives until deleted; tokens follow XSUAA validity. Renewal: Re-request token with key (and user password for password grant).
- Keyless option: not_verified. Password grant sends a user's password directly to XSUAA; docs reviewed do not say whether IdP MFA/conditional access applies. Client-credential instances have no user.
- Conditions: Entitlement required.

## Detect: what gets logged
- Token prefix: not established

### Logs
- SAP Audit Log service (global account and subaccount): Cloud Management service events via Audit Log Retrieval API for global accounts

### Fields that identify the credential
- `Client ID` (UAA ClientAuthenticationSuccess): 

### Lifecycle events
- use: `"type":"CREATE" "entity":"Subaccount` Cloud Management service audit message text

### Correlate on
`client ID`, `global account ID`, `subaccount ID`

### API calls a holder can make, and whether they are logged
- discovery (bulk): `btp list accounts/subaccount`. Subaccounts in the global account Logged: unknown. Audit page lists create/update/delete only

### What to look for (analyst guidance)
- Subaccount/directory create or delete via API
- Entitlement changes outside change windows

## Respond: how to revoke it
- Admin: **Delete binding / service key**. Deleting the binding or service key makes XSUAA stop accepting its secret/certificate. Where: cf unbind-service / cf delete-service-key / cockpit.
- Admin: **Token revoke endpoint**. Revokes an issued token, but apps validating offline keep accepting it until expiry. Where: Cloud Foundry UAA revoke endpoint.

Delete the cis service key (and instance if needed); reset the user's password for password-grant keys. Live access ends on revocation: partial. Issued tokens live until expiry.

## No vendor documentation found
- Admin can list all of them
- IP restriction
- Data reads appear in logs
- Stops working when user is removed
- Equivalent raw Accounts API path not verified
- Any IP/network allowlist for XSUAA clients, btp API credentials, IAS API secrets or S/4HANA communication users.
- Whether XSUAA password-grant tokens (cis service keys) honor IAS/corporate IdP MFA or conditional access.
- Exact audit message for service key deletion and for API credential create/delete in XSUAA audit log.
- Whether communication user passwords expire.
- Org-wide switch to block creation of service keys or API credentials (none found).
- IAS audit event emitted on client secret creation/deletion (change log covers admin CREATE/UPDATE/DELETE generally).

## Sources
- [Getting an Access Token for SAP Cloud Management Service APIs](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/getting-an-access-token-for-sap-cloud-management-service-apis-3670474.md) (retrieved 2026-10-14)
- [Service Instance Secrets (SAP Authorization and Trust Management service)](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/service-instance-secrets-5578ec4.md) (retrieved 2026-10-14)
- [Security Considerations for the SAP Authorization and Trust Management Service](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/60-security/security-considerations-for-the-sap-authorization-and-trust-management-service-f117cab.md) (retrieved 2026-10-14)
- [SAP Cloud Management Service - Service Plans](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/sap-cloud-management-service-service-plans-a508b72.md) (retrieved 2026-10-14)
- [Establish Trust and Federation of Custom Identity Providers for Platform Users](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/establish-trust-and-federation-of-custom-identity-providers-for-platform-users-c368984.md) (retrieved 2026-10-14)
- [SAP Audit Log Viewer service for the Cloud Foundry Environment](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/sap-audit-log-viewer-service-for-the-cloud-foundry-environment-e3baa5f.md) (retrieved 2026-10-14)
- [Audit Log Retrieval API for Global Accounts in the Cloud Foundry Environment](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/audit-log-retrieval-api-for-global-accounts-in-the-cloud-foundry-environment-7db3c9f.md) (retrieved 2026-10-14)
- [Auditing and Logging Information (SAP Cloud Management service)](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/auditing-and-logging-information-44b00a8.md) (retrieved 2026-10-14)
- [Working with Global Accounts, Directories, and Subaccounts Using the btp CLI](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/working-with-global-accounts-directories-and-subaccounts-using-the-btp-cli-85a683e.md) (retrieved 2026-10-14)
- [Rotate Binding Secrets](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/rotate-binding-secrets-618441b.md) (retrieved 2026-10-14)
- [Configure Token Policy for SAP Authorization and Trust Management Service](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/configure-token-policy-for-sap-authorization-and-trust-management-service-40290a9.md) (retrieved 2026-10-14)
- [Validation and Revocation of Access Tokens](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/30-development/validation-and-revocation-of-access-tokens-8eb23a1.md) (retrieved 2026-10-14)
