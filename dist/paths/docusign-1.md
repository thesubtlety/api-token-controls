# DocuSign eSignature: OAuth authorization code

`docusign-1` · OAuth · person. OAuth authorization code + PKCE or JWT grant. JWT grant impersonates a consenting user with an app private key.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Each user sees their own consented apps under Manage Profile > Connected Apps; admin-granted consents are managed in Docusign Admin. No org-wide list of user-granted consents documented. | Each user sees their own consented apps under Manage Profile > Connected Apps; admin-granted consents are managed in Docusign Admin. No org-wide list of user-granted consents documented. |
| Protect: Admin can block or require approval | Yes | Permission profile setting allowApiAccessToAccount | Permission profile setting allowApiAccessToAccount: eSignature REST API: AccountPermissionProfiles settings.allowApiAccessToAccount (UI label not verified) |
| Protect: SSO and MFA rules apply | Partial | The user signs in on the Docusign sign-in screen to grant the code, and SSO-only domains redirect that sign-in to the IdP; refresh tokens then renew without a new login for about 30 days. | Where: Admin > Domains > (domain) ACTIONS > Manage Settings > Settings > Login Settings > SSO Login Requirement: Require all users to log in with SSO only; per-user exceptions under Users > View User > Security |
| Protect: IP restriction | Conditional (requires Docusign Admin org with claimed domain (section notes Access Management with SSO add-on)) | Claimed-domain IP restrictions are documented for password/SSO authentication. Per-request eSignature bearer-token IP enforcement was not verified. | Restrict Domain IPs (Allowed IP Ranges): Docusign Admin > Organization > Domains > Actions > Manage Settings > Access Settings > Add IP Range; toggle Allowed IP Ranges |
| Protect: Expires automatically | Yes | 8 hours; cannot be extended | API: Fixed; read expires_in in the POST https://account.docusign.com/oauth/token response |
| Detect: Usage appears in logs | Yes | integratorKey, userId, accountId, source | Where: Admin > Organization > Monitor > User Investigations; filter by User and Event (paid Monitor) · API: GET https://api.docusign.com/v1/organizations/{organizationId}/stream (JWT, impersonating an org admin) |
| Detect: Data reads appear in logs | Conditional | Docusign Monitor event; not marked as available in Monitor Free Edition, so it needs paid Monitor (separate product, includes Monitor API). Monitor events include actions by connected APIs. | Where: Admin > Organization > Monitor > User Investigations; Event = Document downloaded · API: GET https://api.docusign.com/v1/organizations/{organizationId}/stream; filter events named Document downloaded |
| Respond: Revocation ends active access | Not available | Revoking consent invalidates refresh tokens and blocks new tokens, but live access tokens keep working until they expire (8 h default for auth code). |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Connected Apps > Authorize Application (admin consent)** (Limit scope; Docusign Admin with Access Management (org + claimed domain); default off). Org admin grants consent for an org-owned integration key on behalf of all claimed-domain users, limited to the permissions (OAuth scopes) entered, e.g. signature impersonation. Where: Docusign Admin > Organization > Connected Apps > Authorize Application.
- **Connected Apps > Edit an Authorized Application** (Limit scope; Docusign Admin with Access Management (org + claimed domain); default varies). Changes the permissions (scopes) granted to an admin-authorized app. Where: Docusign Admin > Organization > Connected Apps > Actions > Edit.
- **Require all users to log in with SSO only** (Require SSO; Access Management with SSO add-on; default off). Forces claimed-domain users to authenticate through the IdP, so authorization-code logins go through SSO. Where: Docusign Admin > Organization > Domains > Actions > Manage Settings > Login Settings > Single Sign-On.
- **Restrict Domain IPs (Allowed IP Ranges)** (Limit network; Docusign Admin org with claimed domain (section notes Access Management with SSO add-on); default off). Restricts login and authentication traffic for claimed-domain users to up to 30 IPv4 ranges. Where: Docusign Admin > Organization > Domains > Actions > Manage Settings > Access Settings > Add IP Range; toggle Allowed IP Ranges.
- **Permission profile: Allow view and manage envelope rights through API** (Limit scope; all plans; default unknown). When unchecked, users with the profile cannot view/manage all account envelopes via the API (account-wide API access). Where: eSignature Admin > Permission Profiles > Edit.
- **Permission profile setting allowApiAccessToAccount** (Disable; all plans; default unknown). When false, users with the profile cannot access the account through the eSignature API. Where: eSignature REST API: AccountPermissionProfiles settings.allowApiAccessToAccount (UI label not verified).
- **Apps and Keys (integration key secrets, RSA keypairs, redirect URIs)** (Other; all plans; default unknown). Account admins manage the integration keys; removing secrets or RSA keypairs stops new auth-code or JWT token requests for that key. Where: eSignature Admin > Integrations > Apps and Keys.

### Not available (vendor states)
- Admin consent via the Connected Apps UI only covers org-owned integration keys; external apps need a special consent flow.

- Network: unknown (checked at login_only). Claimed-domain IP restrictions are documented for password/SSO authentication. Per-request eSignature bearer-token IP enforcement was not verified.
- Lifetime: 8 hours; cannot be extended. Renewal: Refresh token (typically about 30 days from first login, not reset on use). With the extended scope, each refresh issues a token with a full new lifetime, so access can continue while the token is used before expiry. Password change or consent revocation can invalidate it.
- Keyless option: not_verified. SAML login and app-signed JWT impersonation do not establish generic external IdP/workload-token federation.
- Conditions: Organization/domain-management entitlements apply. CLM IP restrictions and Monitor alerts do not prove eSignature API enforcement.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Docusign Monitor (Monitor API stream): Org-level security events incl. API-driven actions; carries integratorKey per event. Licensing/edition and retention not established. Caller must use JWT impersonating an org admin.

### Fields that identify the credential
- `integratorKey` (Monitor stream): Integration key (OAuth client id) of the app that made the call
- `userId` (Monitor stream): Docusign user the token acts as
- `accountId` (Monitor stream): eSignature account
- `source` (Monitor stream): Event source; value set not established

### Lifecycle events
No docs found.

### Correlate on
`integratorKey`, `userId`, `accountId`, `organizationId`, `ipAddress`, `ipAddressLocation`, `userAgent`, `object`, `action`, `result`, `timestamp`, `eventId`

### API calls a holder can make, and whether they are logged
- collection: `GET /restapi/v2.1/accounts/{accountId}/envelopes/{envelopeId}/documents/{documentId}`. Envelope documents (one or all, combined) Logged: plan (`Document downloaded`). Docusign Monitor event; not marked as available in Monitor Free Edition, so it needs paid Monitor (separate product, includes Monitor API). Monitor events include actions by connected APIs.

### What to look for (analyst guidance)
- First event for an integratorKey not in the approved app inventory
- Known integratorKey used from a new IP/country or new userAgent family
- Same user's token used by an integratorKey they never consented to (check Connected Apps)
- Bulk envelope download/export actions driven by an integration key outside business hours
- API activity continuing after consent revoked (expected only until token expiry, ~8 h)

### Sample query (Docusign Monitor API stream request + client-side filter)
Pull all events for one integration key and spot use from unexpected IPs.

```
GET /v1/organizations/{organizationId}/stream?cursor={endCursor}&limit=1000 (Monitor API, host per environment); keep resultData rows where integratorKey == '<key>' and ipAddress not in known egress ranges
```

## Respond: how to revoke it
- Admin: **Connected Apps > Revoke Authorization**. Removes an admin-authorized app and revokes its consent for all domain users; refresh tokens die, live access tokens run to expiry. Where: Docusign Admin > Organization > Connected Apps > Actions > Revoke.

User: Manage Profile > Connected Apps > Revoke. Org-granted consent: revoke in Docusign Admin. If client secret leaked: revoke secrets on the integration key (Apps and Keys) and, if needed, ask Docusign to disable the key. Live access ends on revocation: no. Revoking consent invalidates refresh tokens and blocks new tokens, but live access tokens keep working until they expire (8 h default for auth code).

## No vendor documentation found
- Stops working when user is removed
- Monitor event names (object/action values) for login, consent and API key activity
- Monitor plan/add-on requirement and retention
- Whether Monitor logs consent grant/revoke
- Access token format/prefix
- Production Monitor API host (spec gives path /v1/organizations/{organizationId}/stream only)
- Whether Restrict Domain IPs or SSO-only login apply to JWT grant token requests (no user login occurs) or to API calls with an existing token.
- Whether admins can stop users from granting individual consent to arbitrary integration keys (no allowlist/block setting found).
- No per-integration-key IP allowlist found; a Docusign Community idea requesting one (Dec 2025) is still "Idea Submitted".
- UI label and default for allowApiAccessToAccount; admin-set token lifetime controls not found.

## Sources
- [REST API Authentication | Docusign](https://developers.docusign.com/docs/esign-rest-api/esign101/auth/) (retrieved 2026-10-09)
- [FAQ: Docusign developer general administration and authentication](https://support.docusign.com/s/articles/DocuSign-Developer-FAQs-General-Administration-and-Authentication?language=en_US) (retrieved 2026-10-09)
- [Access Tokens with JSON Web Token (JWT) Grant | Docusign](https://developers.docusign.com/platform/auth/jwt-get-token/) (retrieved 2026-10-09)
- [Restrict Domain IPs](https://support.docusign.com/s/document-item?_LANG=enus&bundleId=rrf1583359212854&language=en_US&topicId=yor1668214161363.html) (retrieved 2026-10-09)
- [Restrict Domain IPs - DocuSign Support Center](https://support.docusign.com/s/document-item?_LANG=enus&bundleId=rrf1583359212854&language=en_US&topicId=yor1668214161363.html) (retrieved 2026-10-09)
- [Authorization Code Grant refresh tokens | Docusign developer blog](https://www.docusign.com/blog/developers/authorization-code-grant-refresh-tokens) (retrieved 2026-10-09)
- [How to get an access token with Confidential Authorization Code Grant | Docusign](https://developers.docusign.com/platform/auth/confidential-authcode-get-token/) (retrieved 2026-10-09)
- [Login Settings](https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=fnb1668218030221.html) (retrieved 2026-10-13)
- [Docusign: Obtaining consent](https://developers.docusign.com/platform/auth/consent/) (retrieved 2026-10-12)
- [How do I make SSO login required?](https://support.docusign.com/s/articles/How-do-I-make-SSO-login-required?language=en_US) (retrieved 2026-10-14)
- [Change the Login Policy for a User](https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=fji1583359148678.html&_LANG=enus) (retrieved 2026-10-14)
- [How to get an access token with Confidential Authorization Code Grant](https://developers.docusign.com/platform/auth/authcode/authcode-get-token/) (retrieved 2026-10-14)
- [Tracking data and handling alerts](https://developers.docusign.com/docs/monitor-api/monitor101/tracking-data-handling-alerts/) (retrieved 2026-10-14)
- [Review User Activity with User Investigations](https://support.docusign.com/s/document-item?bundleId=gso1581445176035&topicId=tsk08ba1ec0-a078-4667-b59b-fe290f36ac83.html&_LANG=enus) (retrieved 2026-10-14)
- [Monitor API: Get monitoring data](https://developers.docusign.com/docs/monitor-api/how-to/get-monitoring-data/) (retrieved 2026-10-12)
- [Monitor eSignature Events](https://support.docusign.com/s/document-item?bundleId=gso1581445176035&topicId=crj1659119600990.html) (retrieved 2026-10-14)
- [Docusign Monitor API OpenAPI spec (vendor repo)](https://github.com/docusign/OpenAPI-Specifications/blob/master/monitor.rest.swagger-v2.0.json) (retrieved 2026-10-12)
- [Monitor API: Events and alerts](https://developers.docusign.com/docs/monitor-api/monitor101/events-alerts/) (retrieved 2026-10-12)
- [Docusign: Obtain access token](https://developers.docusign.com/platform/auth/reference/obtain-access-token/) (retrieved 2026-10-12)
- [Docusign: Authorization Code Grant](https://developers.docusign.com/platform/auth/authcode/) (retrieved 2026-10-12)
- [EnvelopeDocuments: get](https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopedocuments/get/) (retrieved 2026-10-14)
- [Monitor eSignature Events (Docusign Monitor Guide)](https://support.docusign.com/s/document-item?language=en_US&bundleId=gso1581445176035&topicId=crj1659119600990.html) (retrieved 2026-10-14)
- [Monitor API 101](https://developers.docusign.com/docs/monitor-api/monitor101/) (retrieved 2026-10-14)
- [Authorize an Application](https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=dnl1583359204821.html) (retrieved 2026-10-13)
- [Edit an Authorized Application](https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=fes1583359205566.html) (retrieved 2026-10-13)
- [Revoke Authorization for an Application](https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=uwb1583359205857.html) (retrieved 2026-10-13)
- [Restrict Domain IPs](https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=yor1668214161363.html) (retrieved 2026-10-13)
- [Permission Profile Options](https://support.docusign.com/s/document-item?language=en_US&bundleId=pik1583277475390&topicId=mfo1583277360424.html) (retrieved 2026-10-13)
- [AccountPermissionProfiles: get | eSignature REST API](https://developers.docusign.com/docs/esign-rest-api/reference/accounts/accountpermissionprofiles/get/) (retrieved 2026-10-13)
- [Apps and Keys](https://support.docusign.com/s/document-item?language=en_US&bundleId=pik1583277475390&topicId=pmp1583277397015.html) (retrieved 2026-10-13)
- [https://developers.docusign.com/platform/auth/jwt/jwt-best-practice/](https://developers.docusign.com/platform/auth/jwt/jwt-best-practice/) (retrieved 2026-10-13)
