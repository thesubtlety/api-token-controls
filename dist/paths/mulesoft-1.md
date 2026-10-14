# MuleSoft Anypoint: Connected app that acts on its own behalf (client credentials)

`mulesoft-1` · OAuth · service. App posts client_id and client_secret to /accounts/api/v2/oauth2/token and gets a 60-minute bearer token; no user, SSO or MFA step is involved (MuleSoft points CI/CD to connected apps when enabling MFA; connected apps are exempt from reauthentication). Query results use the scope of the user who created the app.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Access Management > Connected Apps (Owned Apps) and GET /accounts/api/organizations/{organizationId}/connectedApplications. | Access Management > Connected Apps (Owned Apps) and GET /accounts/api/organizations/{organizationId}/connectedApplications. |
| Protect: Admin can block or require approval | Yes | Disable connected apps for the organization | Disable connected apps for the organization: Access Management > Connected Apps (exact setting not named in docs) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Not available | The org IP allowlist covers only user sign-ins with Anypoint credentials; client-credentials token requests are not user sign-ins. No per-app IP restriction documented. |  |
| Protect: Expires automatically | Yes | 60-min access token; client secret no expiry by default, expiry settable | Client secret expiration date: Connected app settings · Modify the Client Secret for a Connected App: Access Management > Connected Apps > app > Secret |
| Detect: Usage appears in logs | Yes | clientID, Connected App | Anypoint Platform audit log (Access Management > Audit Log, Audit Log Query API): Default retention 1 year (6 years for orgs before 2023-07-10), configurable 30-2190 days; export via Telemetry Exporter needs Anypoint Integration Advanced or Titanium. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Yes | DELETE /accounts/api/organizations/{organizationId}/connectedApplications/{clientId}/revoke revokes all access and refresh tokens issued to the app. Rotating the secret alone is not documented to kill issued tokens. | Rotate the secret (Modify the Client Secret) or delete the app in Access Management > Connected Apps; remove scopes. |
| Respond: Stops working when user is removed | Not available | When the creating user is deleted or removed, the app's ownership moves to the root org owner and the app keeps working; docs tell admins to rotate secrets manually. |  |

## Protect: what an admin can configure

### Admin controls
- **Disable connected apps for the organization** (Disable; all plans; default unknown). Org admin can turn off the connected apps feature for the whole org. Where: Access Management > Connected Apps (exact setting not named in docs).
- **Scopes per business group and environment** (Limit scope; all plans; default varies). App permissions are limited to chosen scopes, business groups and environments. Where: Access Management > Connected Apps > Add Scopes.
- **Client secret expiration date** (Limit lifetime; all plans; default off). Set an expiry on the connected app client secret. Where: Connected app settings.
- **Modify the Client Secret for a Connected App** (Require rotation; all plans; default unknown). Admin replaces the client secret manually or via Access Management API. Where: Access Management > Connected Apps > app > Secret.

- Network: excluded (checked at login_only). The org IP allowlist covers only user sign-ins with Anypoint credentials; client-credentials token requests are not user sign-ins. No per-app IP restriction documented.
- Lifetime: 60-min access token; client secret no expiry by default, expiry settable. Renewal: Re-run client_credentials grant with the secret.
- Keyless option: not_verified. No inbound workload federation documented. The openid:google_wif scope is outbound: Anypoint acts as IdP for Google Cloud WIF.
- Conditions: Organization Administrator permission; up to 2000 apps per org.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Anypoint Platform audit log (Access Management > Audit Log, Audit Log Query API): Default retention 1 year (6 years for orgs before 2023-07-10), configurable 30-2190 days; export via Telemetry Exporter needs Anypoint Integration Advanced or Titanium.

### Fields that identify the credential
- `clientID` (Connected Apps audit entries): Object of the entry; payload has clientName, clientIP, orgID, grantTypes
- `Connected App` (all audit entries): Name of app that performed the action, N/A otherwise

### Lifecycle events
- create: `Create Connected Application` Action Create
- other: `Update Scope Assignments` Action Permissions Change
- use: `Token Retrieval Success` Action Login - Token, has clientIP
- use: `Token Retrieval Failed` Includes error message
- other: `Edit Connected Application` 
- revoke: `Revoke Access/Refresh Tokens` Action Revoke Tokens
- revoke: `Delete Connected Application` 

### Correlate on
`clientID`, `clientIP`, `orgID`, `Connected App name`

### API calls a holder can make, and whether they are logged
- recon: `POST /accounts/api/v2/oauth2/token`. Access token Logged: yes (`Token Retrieval Success`). clientID, clientIP
- recon: `GET /accounts/api/me`. Caller identity and organization Logged: unknown. No read events documented
- recon: `GET /accounts/api/profile`. Profile (for CC apps: owner id) Logged: unknown. 
- discovery (bulk): `GET /api/organizations/{orgId}/environments`. Environments Logged: unknown. CLI equivalent: anypoint-cli-v4 account:environment:list
- collection (bulk): `POST /audit/v2/organizations/{orgId}/query`. Audit history Logged: unknown. Needs Audit Log Viewer or Org Admin

### What to look for (analyst guidance)
- Token Retrieval Success from new clientIP
- Burst of Token Retrieval Failed
- Update Scope Assignments adding broad scopes
- Actions attributed to a connected app outside its normal product area

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **Delete Connected Application**. Deleting the app removes the client; effect on live tokens not documented. Where: Access Management > Connected Apps > Owned Apps.
- Admin: **Revoke org connected app tokens**. Revokes all access and refresh tokens issued to a connected app. Where: DELETE /accounts/api/organizations/{organizationId}/connectedApplications/{clientId}/revoke.

Rotate the secret (Modify the Client Secret) or delete the app in Access Management > Connected Apps; remove scopes. Live access ends on revocation: yes. DELETE /accounts/api/organizations/{organizationId}/connectedApplications/{clientId}/revoke revokes all access and refresh tokens issued to the app. Rotating the secret alone is not documented to kill issued tokens.

## No vendor documentation found
- SSO and MFA rules apply
- Data reads appear in logs
- Whether per-API-call usage is logged
- Which data reads appear in audit log
- Whether IP allowlist applies to connected app token requests or API calls with an issued token
- Whether deleting a client-credentials app or rotating its secret invalidates unexpired access tokens
- Whether a client-credentials app's tokens can be revoked without deleting it (Revoke Authorization is documented for user authorizations)
- Exact UI setting name for disabling connected apps org-wide
- Whether read/GET API calls are audit logged
- Environment client secret rotation procedure (help.salesforce.com KB 001115221 did not render)
- Bearer token format/prefix
- Whether IdP conditional access applies to connected app tokens (not stated)

## Sources
- [Access Management API - Connected App Examples](https://anypoint.mulesoft.com/exchange/portals/anypoint-platform/f1e97bc6-315a-4490-82a7-23abe036327a.anypoint-platform/access-management-api/minor/1.0/pages/Connected%20App%20Examples) (retrieved 2026-10-14)
- [Creating Connected Apps in Anypoint Platform](https://docs.mulesoft.com/access-management/creating-connected-apps-dev) (retrieved 2026-10-14)
- [Managing Your Anypoint Platform Account](https://docs.mulesoft.com/access-management/managing-your-account) (retrieved 2026-10-14)
- [Managing IP Allowlists in Access Management](https://docs.mulesoft.com/access-management/managing-ip-allowlists) (retrieved 2026-10-14)
- [Anypoint Platform Connected Apps for Organization Administrators](https://docs.mulesoft.com/access-management/connected-apps-org-admin) (retrieved 2026-10-14)
- [Access Management API spec: /connectedApplications/{clientId}/revoke](https://github.com/mulesoft/anypoint-public-api-specs/blob/master/apis/access-management/api.yaml) (retrieved 2026-10-14)
- [Connected Apps in Anypoint Platform](https://docs.mulesoft.com/access-management/connected-apps-overview) (retrieved 2026-10-14)
- [Audit Logging in Anypoint Platform](https://docs.mulesoft.com/access-management/audit-logging) (retrieved 2026-10-14)
- [Configure Audit Log Retention in Anypoint Platform](https://docs.mulesoft.com/access-management/audit-log-retention) (retrieved 2026-10-14)
- [Obtaining an API Bearer Token Using a SAML Assertion](https://docs.mulesoft.com/access-management/saml-bearer-token) (retrieved 2026-10-14)
- [Access Management API - Basic Examples](https://anypoint.mulesoft.com/exchange/portals/anypoint-platform/f1e97bc6-315a-4490-82a7-23abe036327a.anypoint-platform/access-management-api/minor/1.0/pages/Basic_Examples) (retrieved 2026-10-14)
- [Authentication to the Anypoint Platform CLI](https://docs.mulesoft.com/anypoint-cli/latest/auth) (retrieved 2026-10-14)
