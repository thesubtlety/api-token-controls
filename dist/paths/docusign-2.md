# DocuSign eSignature: JWT impersonation grant

`docusign-2` · Signed JWT · person. OAuth authorization code + PKCE or JWT grant. JWT grant impersonates a consenting user with an app private key.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Users see their consents under Manage Profile > Connected Apps; admin consent is managed in Docusign Admin. | Users see their consents under Manage Profile > Connected Apps; admin consent is managed in Docusign Admin. |
| Protect: Admin can block or require approval | Yes | Permission profile setting allowApiAccessToAccount | Permission profile setting allowApiAccessToAccount: eSignature REST API: AccountPermissionProfiles settings.allowApiAccessToAccount (UI label not verified) |
| Protect: SSO and MFA rules apply | Partial | Individual consent is granted through an interactive login, but after that the integration gets tokens without the user present, so IdP sign-in is not repeated. SSO enforcement guidance tells admins to move integration service users to OAuth rather than exempt them. | Where: Admin > Domains > (domain) ACTIONS > Manage Settings > Settings > Login Settings > SSO Login Requirement: Require all users to log in with SSO only; per-user exceptions under Users > View User > Security |
| Protect: IP restriction | No docs found | Claimed-domain IP restrictions are documented for password/SSO authentication. Per-request eSignature bearer-token IP enforcement was not verified. |  |
| Protect: Expires automatically | Yes | 1 hour; no refresh token | API: Fixed 1 hour, no refresh token; read expires_in in the POST /oauth/token response |
| Detect: Usage appears in logs | Yes | integratorKey, userId, accountId | Where: Admin > Organization > Monitor > User Investigations; filter by User and Event (paid Monitor) · API: GET https://api.docusign.com/v1/organizations/{organizationId}/stream (JWT, impersonating an org admin) |
| Detect: Data reads appear in logs | Conditional | Docusign Monitor event; requires paid Monitor (not marked Free Edition). Monitor events include actions by connected APIs. | Where: Admin > Organization > Monitor > User Investigations; Event = Document downloaded · API: GET https://api.docusign.com/v1/organizations/{organizationId}/stream; filter events named Document downloaded |
| Respond: Revocation ends active access | Not available | Issued JWT-grant access tokens stay valid until expiry (1 hour). Removing the RSA keypair step is from general practice; exact UI step not verified in fetched docs. |  |
| Respond: Stops working when user is removed | Partial | New JWT token requests require the sub to be an active user (otherwise user_not_found / invalid_subject); docs do not say whether already-issued access tokens (up to 1 hour) stop working when the user is closed. | Where: Admin > Users > View User > Actions > close all of the user's account memberships · API: DELETE /restapi/v2.1/accounts/{accountId}/users (body: userId list) or Admin API DELETE /v2/organizations/{organizationId}/users/{userId}/accounts |

## Protect: what an admin can configure

### Admin controls
- **Connected Apps > Authorize Application (admin consent)** (Limit scope; Docusign Admin with Access Management (org + claimed domain); default off). Org admin grants consent for an org-owned integration key on behalf of all claimed-domain users, limited to the permissions (OAuth scopes) entered, e.g. signature impersonation. Where: Docusign Admin > Organization > Connected Apps > Authorize Application.
- **Connected Apps > Edit an Authorized Application** (Limit scope; Docusign Admin with Access Management (org + claimed domain); default varies). Changes the permissions (scopes) granted to an admin-authorized app. Where: Docusign Admin > Organization > Connected Apps > Actions > Edit.
- **Permission profile: Allow view and manage envelope rights through API** (Limit scope; all plans; default unknown). When unchecked, users with the profile cannot view/manage all account envelopes via the API (account-wide API access). Where: eSignature Admin > Permission Profiles > Edit.
- **Permission profile setting allowApiAccessToAccount** (Disable; all plans; default unknown). When false, users with the profile cannot access the account through the eSignature API. Where: eSignature REST API: AccountPermissionProfiles settings.allowApiAccessToAccount (UI label not verified).
- **Apps and Keys (integration key secrets, RSA keypairs, redirect URIs)** (Other; all plans; default unknown). Account admins manage the integration keys; removing secrets or RSA keypairs stops new auth-code or JWT token requests for that key. Where: eSignature Admin > Integrations > Apps and Keys.

### Not available (vendor states)
- Revoking consent does not invalidate live access tokens; they work until expiry (JWT tokens last one hour).

- Network: unknown (checked at login_only). Claimed-domain IP restrictions are documented for password/SSO authentication. Per-request eSignature bearer-token IP enforcement was not verified.
- Lifetime: 1 hour; no refresh token. Renewal: Request a new access token using the app signing key and prior user consent.
- Keyless option: not_verified. SAML login and app-signed JWT impersonation do not establish generic external IdP/workload-token federation.
- Conditions: Organization/domain-management entitlements apply. CLM IP restrictions and Monitor alerts do not prove eSignature API enforcement.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Docusign Monitor (Monitor API stream): Org-level security events incl. API-driven actions; carries integratorKey per event. Licensing/edition and retention not established. Caller must use JWT impersonating an org admin.

### Fields that identify the credential
- `integratorKey` (Monitor stream): Integration key that holds the RSA keypair
- `userId` (Monitor stream): Impersonated user (JWT sub)
- `accountId` (Monitor stream): eSignature account

### Lifecycle events
No docs found.

### Correlate on
`integratorKey`, `userId`, `accountId`, `organizationId`, `ipAddress`, `ipAddressLocation`, `userAgent`, `object`, `action`, `result`, `timestamp`, `eventId`

### API calls a holder can make, and whether they are logged
- collection: `GET /restapi/v2.1/accounts/{accountId}/envelopes/{envelopeId}/documents/{documentId}`. Envelope documents (one or all, combined) Logged: plan (`Document downloaded`). Docusign Monitor event; requires paid Monitor (not marked Free Edition). Monitor events include actions by connected APIs.

### What to look for (analyst guidance)
- integratorKey impersonating a user it never impersonated before, especially an admin
- JWT-backed activity from an IP/ASN outside the service's hosting ranges
- Impersonated user is a person (not a system user) who is on leave or offboarded
- Spike in envelope downloads/exports by an integration key outside its normal schedule
- Org-wide admin consent recently granted to an integration key not owned by the org

### Sample query (Docusign Monitor API stream request + client-side filter)
List all actions by one JWT integration key and the users it impersonated.

```
GET /v1/organizations/{organizationId}/stream?cursor={endCursor}&limit=1000 (Monitor API, host per environment); keep resultData rows where integratorKey == '<key>' and ipAddress not in known egress ranges
```

## Respond: how to revoke it
- Admin: **Connected Apps > Revoke Authorization**. Removes an admin-authorized app and revokes its consent for all domain users; refresh tokens die, live access tokens run to expiry. Where: Docusign Admin > Organization > Connected Apps > Actions > Revoke.

Revoke consent (user Connected Apps, or Docusign Admin for org consent), then remove/rotate the RSA keypair on the integration key so no new JWT can be signed; deactivate impersonated system user if needed. Live access ends on revocation: no. Issued JWT-grant access tokens stay valid until expiry (1 hour). Removing the RSA keypair step is from general practice; exact UI step not verified in fetched docs.

## No vendor documentation found
- IP restriction
- Monitor event names for consent grant/revoke and RSA key add/remove
- Whether Monitor distinguishes JWT-grant from auth-code tokens
- Monitor plan/add-on requirement and retention
- Docusign Admin audit fields for keypair changes
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
- [Docusign JWT Grant](https://developers.docusign.com/platform/auth/jwt/) (retrieved 2026-10-12)
- [Administrator Checklist Before Enforcing SSO](https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=azf1636145324908.html) (retrieved 2026-10-14)
- [Docusign: Obtaining consent](https://developers.docusign.com/platform/auth/consent/) (retrieved 2026-10-12)
- [How do I make SSO login required?](https://support.docusign.com/s/articles/How-do-I-make-SSO-login-required?language=en_US) (retrieved 2026-10-14)
- [Change the Login Policy for a User](https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=fji1583359148678.html&_LANG=enus) (retrieved 2026-10-14)
- [How to get an access token with JWT Grant](https://developers.docusign.com/platform/auth/jwt/jwt-get-token/) (retrieved 2026-10-14)
- [Tracking data and handling alerts](https://developers.docusign.com/docs/monitor-api/monitor101/tracking-data-handling-alerts/) (retrieved 2026-10-14)
- [Review User Activity with User Investigations](https://support.docusign.com/s/document-item?bundleId=gso1581445176035&topicId=tsk08ba1ec0-a078-4667-b59b-fe290f36ac83.html&_LANG=enus) (retrieved 2026-10-14)
- [Monitor API: Get monitoring data](https://developers.docusign.com/docs/monitor-api/how-to/get-monitoring-data/) (retrieved 2026-10-12)
- [Monitor eSignature Events](https://support.docusign.com/s/document-item?bundleId=gso1581445176035&topicId=crj1659119600990.html) (retrieved 2026-10-14)
- [View User Details](https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=msr1583359182534.html&_LANG=enus) (retrieved 2026-10-14)
- [Users:delete](https://developers.docusign.com/docs/esign-rest-api/reference/users/users/delete/) (retrieved 2026-10-14)
- [Docusign Admin API OpenAPI spec](https://github.com/docusign/OpenAPI-Specifications/blob/master/admin.rest.swagger-v2.1.json) (retrieved 2026-10-14)
- [Docusign Monitor API OpenAPI spec (vendor repo)](https://github.com/docusign/OpenAPI-Specifications/blob/master/monitor.rest.swagger-v2.0.json) (retrieved 2026-10-12)
- [Monitor API: Events and alerts](https://developers.docusign.com/docs/monitor-api/monitor101/events-alerts/) (retrieved 2026-10-12)
- [Docusign: Obtain access token](https://developers.docusign.com/platform/auth/reference/obtain-access-token/) (retrieved 2026-10-12)
- [EnvelopeDocuments: get](https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopedocuments/get/) (retrieved 2026-10-14)
- [Monitor eSignature Events (Docusign Monitor Guide)](https://support.docusign.com/s/document-item?language=en_US&bundleId=gso1581445176035&topicId=crj1659119600990.html) (retrieved 2026-10-14)
- [Monitor API 101](https://developers.docusign.com/docs/monitor-api/monitor101/) (retrieved 2026-10-14)
- [Authorize an Application](https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=dnl1583359204821.html) (retrieved 2026-10-13)
- [Edit an Authorized Application](https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=fes1583359205566.html) (retrieved 2026-10-13)
- [Revoke Authorization for an Application](https://support.docusign.com/s/document-item?language=en_US&bundleId=rrf1583359212854&topicId=uwb1583359205857.html) (retrieved 2026-10-13)
- [Permission Profile Options](https://support.docusign.com/s/document-item?language=en_US&bundleId=pik1583277475390&topicId=mfo1583277360424.html) (retrieved 2026-10-13)
- [AccountPermissionProfiles: get | eSignature REST API](https://developers.docusign.com/docs/esign-rest-api/reference/accounts/accountpermissionprofiles/get/) (retrieved 2026-10-13)
- [Apps and Keys](https://support.docusign.com/s/document-item?language=en_US&bundleId=pik1583277475390&topicId=pmp1583277397015.html) (retrieved 2026-10-13)
