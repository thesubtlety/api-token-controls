# MuleSoft Anypoint: Connected app that acts on behalf of a user (authorization code, refresh token, password, JWT bearer)

`mulesoft-2` · OAuth · person. User authorizes the app (or app uses password or JWT bearer grant) and it gets bearer tokens with the user's permissions limited to app scopes. The password grant precludes MFA; JWT bearer gets tokens without user authorization.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Access Management > Connected Apps > Authorizations lists authorized apps; GET /accounts/api/organizations/{organizationId}/connectedApplications lists apps. | Access Management > Connected Apps > Authorizations lists authorized apps; GET /accounts/api/organizations/{organizationId}/connectedApplications lists apps. |
| Protect: Admin can block or require approval | Yes | Disable connected apps for the organization; Authorization policy: Restricted (application allowlist); Disable auto-approval of internal apps | Disable connected apps for the organization: Access Management > Connected Apps (exact setting not named in docs) · Authorization policy: Restricted (application allowlist): Access Management > Connected Apps > authorization policy · Disable auto-approval of internal apps: Access Management > Connected Apps (Restricted policy) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | IP allowlist covers interactive sign-ins with Anypoint credentials only; SSO users excluded; token use by the app not documented. | Where: Access Management > Security Settings > IP Allowlist (add CIDR) > Enforce IP restrictions for login > Save. Covers sign-in with Anypoint credentials only, not SSO or token use |
| Protect: Expires automatically | Yes | Access token tied to user session (~60 min); refresh token 90 days | Client secret expiration date: Connected app settings · Modify the Client Secret for a Connected App: Access Management > Connected Apps > app > Secret |
| Detect: Usage appears in logs | Yes | clientID, Connected App | Anypoint Platform audit log (Access Management > Audit Log, Audit Log Query API): Default retention 1 year (6 years for orgs before 2023-07-10), configurable 30-2190 days; export via Telemetry Exporter needs Anypoint Integration Advanced or Titanium. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Yes | Docs: access and refresh tokens are revoked; cannot be undone. | Access Management > Connected Apps > Authorizations > Remove; also rotate secret. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Disable connected apps for the organization** (Disable; all plans; default unknown). Org admin can turn off the connected apps feature for the whole org. Where: Access Management > Connected Apps (exact setting not named in docs).
- **Authorization policy: Restricted (application allowlist)** (Require approval; all plans; default off). Only allowlisted apps can be authorized by org members; scope additions need re-approval. Where: Access Management > Connected Apps > authorization policy.
- **Disable auto-approval of internal apps** (Require approval; all plans; default off). Under Restricted, internal apps must also be allowlisted. Where: Access Management > Connected Apps (Restricted policy).
- **Scopes per business group and environment** (Limit scope; all plans; default varies). App permissions are limited to chosen scopes, business groups and environments. Where: Access Management > Connected Apps > Add Scopes.
- **Client secret expiration date** (Limit lifetime; all plans; default off). Set an expiry on the connected app client secret. Where: Connected app settings.
- **Modify the Client Secret for a Connected App** (Require rotation; all plans; default unknown). Admin replaces the client secret manually or via Access Management API. Where: Access Management > Connected Apps > app > Secret.

- Network: conditional (checked at login_only). IP allowlist covers interactive sign-ins with Anypoint credentials only; SSO users excluded; token use by the app not documented.
- Lifetime: Access token tied to user session (~60 min); refresh token 90 days. Renewal: App exchanges refresh token for new access tokens while user is signed out.
- Keyless option: limited. JWT bearer grant: app signs an assertion whose sub names identityProviderId and username; trusted-client design, not workload federation.
- Conditions: Allowlist changes do not cut existing authorizations.

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
- create: `Application Authorization Approved` Object type External Authorization
- other: `Application Authorization Denied` 

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
- Password or JWT bearer grant used by an app not expected to (grantTypes field)

### Sample query (undefined)
undefined

```
undefined
```

## Respond: how to revoke it
- Admin: **Revoke Authorization**. Removes an app's authorization and revokes its access and refresh tokens. Where: Access Management > Connected Apps > Authorizations > ... > Remove.
- Admin: **Delete Connected Application**. Deleting the app removes the client; effect on live tokens not documented. Where: Access Management > Connected Apps > Owned Apps.
- Admin: **Revoke org connected app tokens**. Revokes all access and refresh tokens issued to a connected app. Where: DELETE /accounts/api/organizations/{organizationId}/connectedApplications/{clientId}/revoke.

Access Management > Connected Apps > Authorizations > Remove; also rotate secret. Live access ends on revocation: yes. Docs: access and refresh tokens are revoked; cannot be undone.

## No vendor documentation found
- SSO and MFA rules apply
- Data reads appear in logs
- Stops working when user is removed
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
- [Creating Connected Apps in Anypoint Platform](https://docs.mulesoft.com/access-management/creating-connected-apps-dev) (retrieved 2026-10-14)
- [Managing IP Allowlists in Access Management](https://docs.mulesoft.com/access-management/managing-ip-allowlists) (retrieved 2026-10-14)
- [Access Management API - Connected App Examples](https://anypoint.mulesoft.com/exchange/portals/anypoint-platform/f1e97bc6-315a-4490-82a7-23abe036327a.anypoint-platform/access-management-api/minor/1.0/pages/Connected%20App%20Examples) (retrieved 2026-10-14)
- [Anypoint Platform Connected Apps for Organization Administrators](https://docs.mulesoft.com/access-management/connected-apps-org-admin) (retrieved 2026-10-14)
- [Anypoint Platform Connected Apps for Developers](https://docs.mulesoft.com/access-management/connected-apps-developers) (retrieved 2026-10-14)
- [Access Management API spec: /connectedApplications/{clientId}/revoke](https://github.com/mulesoft/anypoint-public-api-specs/blob/master/apis/access-management/api.yaml) (retrieved 2026-10-14)
- [Connected Apps in Anypoint Platform](https://docs.mulesoft.com/access-management/connected-apps-overview) (retrieved 2026-10-14)
- [Audit Logging in Anypoint Platform](https://docs.mulesoft.com/access-management/audit-logging) (retrieved 2026-10-14)
- [Configure Audit Log Retention in Anypoint Platform](https://docs.mulesoft.com/access-management/audit-log-retention) (retrieved 2026-10-14)
- [Obtaining an API Bearer Token Using a SAML Assertion](https://docs.mulesoft.com/access-management/saml-bearer-token) (retrieved 2026-10-14)
- [Access Management API - Basic Examples](https://anypoint.mulesoft.com/exchange/portals/anypoint-platform/f1e97bc6-315a-4490-82a7-23abe036327a.anypoint-platform/access-management-api/minor/1.0/pages/Basic_Examples) (retrieved 2026-10-14)
- [Authentication to the Anypoint Platform CLI](https://docs.mulesoft.com/anypoint-cli/latest/auth) (retrieved 2026-10-14)
