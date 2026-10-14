# Salesforce (core platform): SAML assertion

`salesforce-3` · Federated identity · person. OAuth bearer: authorization code, client credentials, JWT bearer and SAML bearer/assertion flows. External Client Apps or existing Connected Apps.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Connected Apps OAuth Usage lists app sessions; docs do not say SAML assertion flow grants (which can run without a connected app) appear there. | Where: Setup > Quick Find 'OAuth' > Connected Apps OAuth Usage (click user count for per-user tokens) · API: GET /apps/oauth/usage/{appId}/users (Connect REST resource; external client apps) |
| Protect: Admin can block or require approval | Yes | Permitted Users: Admin approved users are pre-authorized; API Access Control (Allow only admin-approved apps); Connected app creation restricted (Spring '26) | Permitted Users: Admin approved users are pre-authorized: Setup > Connected Apps > Manage > Edit Policies > Permitted Users; Metadata ConnectedAppOauthPolicy isAdminApproved (ECA: permittedUsersPolicyType=AdminApprovedPreAuthorized) · API Access Control (Allow only admin-approved apps): Metadata ConnectedAppSettings enableAdminApprovedAppsOnly / enableAdminApprovedAppsOnlyForExternalUser; Setup > Connected Apps OAuth Usage (install/unblock) · Connected app creation restricted (Spring '26): Platform default; contact Salesforce Support to re-enable |
| Protect: SSO and MFA rules apply | Partial | Issuance needs a SAML assertion validated against the org's SAML SSO configuration, but Salesforce login flows are not invoked. | Where: Setup > Quick Find 'Single Sign-On Settings' > Edit > SAML Enabled (configure the IdP whose assertions are accepted) |
| Protect: IP restriction | Conditional | Profile login ranges and app IP policies; continuous per-request IP enforcement is separately configured. JWT/SAML bearer flows enforce IP restrictions. | IP Relaxation: Connected app / external client app OAuth policies > IP Relaxation; Metadata ipRelaxation (ECA ipRelaxationPolicyType) · Profile Login IP Ranges: Setup > Profiles > [profile] > Login IP Ranges; Metadata Profile.loginIpRanges · Enforce login IP ranges on every request: Setup > Session Settings; Metadata SecuritySettings/SessionSettings enforceIpRangesEveryRequest · Lock sessions to the IP address from which they originated: Setup > Session Settings; Metadata SessionSettings lockSessionsToIp |
| Protect: Expires automatically | Partial | Session timeout (inactivity); default 2 h; set per app, profile or org Admin control: Refresh Token Policy; Connected app session timeout. | Refresh Token Policy: Connected app / ECA OAuth policies > Refresh Token Policy; Metadata refreshTokenPolicy (ECA refreshTokenPolicyType) · Connected app session timeout: Connected app policies > Session Policies > Timeout Value; Metadata ConnectedAppSessionPolicy sessionTimeout |
| Detect: Usage appears in logs | Yes | Application, LoginSubType, ConnectedAppId, LoginKey, AppName, AuthenticationServiceId | Where: Setup > Quick Find 'Login History' > Login History (filter/download; Application column) · API: SOQL: SELECT ... FROM LoginHistory WHERE Application = '<app>' (LoginSubType for flow); ApiEvent WHERE ConnectedAppId = '<id>' (Shield/Event Monitoring); OauthToken.UseCount |
| Detect: Data reads appear in logs | Conditional | Read logged only with Shield/Event Monitoring add-on + View Real-Time Event Monitoring Data permission | API: SOQL: SELECT Query, QueriedEntities, RowsProcessed FROM ApiEvent WHERE ConnectedAppId = '<id>' (needs Shield or Event Monitoring + View Real-Time Event Monitoring Data) |
| Respond: Revocation ends active access | Partial | Issued tokens remain until revoked or sessions deleted. | Disable or fix the SAML/IdP configuration or rotate its certificate; revoke tokens via /services/oauth2/revoke; delete AuthSession rows; freeze affected users. |
| Respond: Stops working when user is removed | Partial | Opaque tokens stop on deactivation; JWT-based access tokens stay valid until timeout. | Where: Setup > Quick Find 'Users' > Users > Edit > deselect Active > Save · API: SCIM: PATCH /services/scim/v2/Users/{userId} (replace active=false) |

## Protect: what an admin can configure

### Admin controls
- **Permitted Users: Admin approved users are pre-authorized** (Require approval; Not available in Group Edition; default off). Only users whose profile or permission set is assigned to the connected app can use it; others are refused. Where: Setup > Connected Apps > Manage > Edit Policies > Permitted Users; Metadata ConnectedAppOauthPolicy isAdminApproved (ECA: permittedUsersPolicyType=AdminApprovedPreAuthorized).
- **API Access Control (Allow only admin-approved apps)** (Disable; Must be enabled by Salesforce Customer Support; default off). Org-wide: only connected apps installed or approved by an admin can call the Salesforce API; a separate switch covers customer/partner users. Where: Metadata ConnectedAppSettings enableAdminApprovedAppsOnly / enableAdminApprovedAppsOnlyForExternalUser; Setup > Connected Apps OAuth Usage (install/unblock).
- **IP Relaxation** (Limit network; all plans; default on). Enforce (default) applies org and profile IP restrictions to the app; Bypass options relax them, and Enforce_RelaxRefresh skips them for refresh-token exchanges. Where: Connected app / external client app OAuth policies > IP Relaxation; Metadata ipRelaxation (ECA ipRelaxationPolicyType).
- **Profile Login IP Ranges** (Limit network; all plans; default off). Restricts the IP ranges from which users of a profile, including API integration users, can log in. Where: Setup > Profiles > [profile] > Login IP Ranges; Metadata Profile.loginIpRanges.
- **Enforce login IP ranges on every request** (Limit network; all plans; default off). Checks profile Login IP Ranges on every request, including from client apps, not only at login. Where: Setup > Session Settings; Metadata SecuritySettings/SessionSettings enforceIpRangesEveryRequest.
- **Lock sessions to the IP address from which they originated** (Limit network; all plans; default off). Binds a session to the IP it was created from. Where: Setup > Session Settings; Metadata SessionSettings lockSessionsToIp.
- **Refresh Token Policy** (Limit lifetime; all plans; default off). Sets refresh tokens to valid until revoked (default), immediately expire, expire after a fixed time, or expire after inactivity. Where: Connected app / ECA OAuth policies > Refresh Token Policy; Metadata refreshTokenPolicy (ECA refreshTokenPolicyType).
- **Connected app session timeout** (Limit lifetime; all plans; default varies). Sets how long an access token session from the app lasts; falls back to profile then org session timeout. Where: Connected app policies > Session Policies > Timeout Value; Metadata ConnectedAppSessionPolicy sessionTimeout.
- **High assurance session required (Block / Raise session level)** (Other; all plans; default off). Requires MFA-level sessions for the app; flows without a user approval step, such as JWT bearer, are blocked. Where: Connected app policies > Session Policies > High assurance session required; Metadata sessionLevel/policyAction.
- **Connected app creation restricted (Spring '26)** (Disable; all plans; default on). New connected apps cannot be created without contacting Support; existing apps keep working and external client apps are recommended. Where: Platform default; contact Salesforce Support to re-enable.

- Network: conditional (checked at mixed). Profile login ranges and app IP policies; continuous per-request IP enforcement is separately configured. JWT/SAML bearer flows enforce IP restrictions.
- Lifetime: Session timeout (inactivity); default 2 h; set per app, profile or org. Renewal: No refresh token; the client presents a new IdP-issued SAML assertion to get a new token. Continued access follows the IdP's assertion issuance.
- Keyless option: supported. An IdP-issued SAML assertion (org SAML SSO config) can be exchanged for an API access token. Note: the separate 'SAML bearer assertion' flow uses an app-signed assertion (app private key) and is not external federation.
- Conditions: API availability depends on edition. Creation of Connected Apps is restricted from Spring ’26; assess External Client Apps for new integrations.

## Detect: what gets logged
- Token prefix: not established

### Logs
- LoginHistory: Every OAuth token grant shows as a login with LoginType/LoginSubType, SourceIp, Application. 6 months; no add-on needed.
- LoginEvent / ApiEvent (Real-Time Event Monitoring): Needs Shield or Event Monitoring add-on. LoginKey ties a session's events; ApiEvent has ConnectedAppId.
- OauthToken object: Current tokens per user+app with UseCount and LastUsedDate.
- SetupAuditTrail: Connected app / external client app config changes; at least 180 days.

### Fields that identify the credential
- `Application` (LoginHistory / LoginEvent): Connected app name used to log in
- `LoginSubType` (LoginHistory / LoginEvent): OAuth flow (e.g. OauthWebServer, OauthClientCredentials, OauthRefreshToken)
- `ConnectedAppId` (ApiEvent): External client app ID; null if session already active
- `LoginKey` (LoginEvent / ApiEvent): Ties all events in one session
- `AppName` (OauthToken): App holding the token
- `AuthenticationServiceId` (LoginHistory): SAML/auth provider config used (SamlSsoConfig or AuthProvider)

### Lifecycle events
No docs found.

### Correlate on
`UserId`, `Username`, `SourceIp`, `Application`, `LoginKey`, `SessionKey`, `LoginHistoryId`, `ConnectedAppId`, `UserAgent`, `CountryIso`, `AuthenticationServiceId`

### API calls a holder can make, and whether they are logged
- recon: `POST /services/oauth2/token (grant_type=...saml2-bearer, signed SAML assertion)`. Exchanges a SAML 2.0 assertion for a Salesforce access token via a previously authorized connected app Logged: yes (`LoginHistory / LoginEvent`). Token issuance recorded as a login in LoginHistory; LoginSubType includes OAuth flow detail
- recon: `GET /services/oauth2/userinfo`. Mapped user's user_id, organization_id, username; identity behind the assertion Logged: unknown. Not established that userinfo reads are logged
- enumeration: `GET /services/data/vXX.X/sobjects/ (Describe Global)`. Visible objects and max query batch size; schema map Logged: unknown. Metadata read; not confirmed logged
- collection (bulk): `GET /services/data/vXX.X/query/?q={SOQL}`. Bulk record data via SOQL for the mapped user Logged: plan (`ApiEvent (QueriedEntities, Query)`). Read logged only with Shield/Event Monitoring add-on + View Real-Time Event Monitoring Data permission

### What to look for (analyst guidance)
- Logins via a SAML config (AuthenticationServiceId) that was recently added or edited
- SAML-based token grants for admins from unusual SourceIp
- Assertion-based logins outside IdP sign-in times (compare with IdP logs)

### Sample query (SOQL)
All logins that used one SAML configuration

```
SELECT UserId, LoginTime, SourceIp, Application, LoginType, LoginSubType, AuthenticationServiceId FROM LoginHistory WHERE AuthenticationServiceId = '0LE000000000001AAA' AND LoginTime = LAST_N_DAYS:7
```

## Respond: how to revoke it


Disable or fix the SAML/IdP configuration or rotate its certificate; revoke tokens via /services/oauth2/revoke; delete AuthSession rows; freeze affected users. Live access ends on revocation: partial. Issued tokens remain until revoked or sessions deleted.

## No vendor documentation found
- LoginSubType/LoginType value for the OAuth SAML bearer assertion flow
- Whether AuthenticationServiceId is populated for SAML bearer token grants
- SAML bearer flow docs (not fetched)
- Whether userinfo and Describe Global reads are logged
- Read-query audit trail absent Event Monitoring
- help.salesforce.com articles (connected app OAuth policies, JWT/SAML bearer flow pre-authorization, Use Any API Client, uninstalled connected app restrictions, OAuth token revocation) could not be fetched; controls are sourced from the Winter '27 Metadata API reference only.
- Whether JWT bearer and SAML bearer flows always enforce IP restrictions regardless of IP Relaxation (stated in older packaging guides; not verified in current docs).
- Behavior and timeline of the 'Use Any API Client' permission, which bypasses admin pre-approval; vendor deprecation page not fetched.
- Whether a per-flow switch exists to disable JWT bearer or SAML bearer flows org-wide; none found in OauthOidcSettings.
- Default of isSecretRequiredForTokenExchange and enableClientSecretInRestApiAccess.

## Sources
- [Authorization Through External Client Apps or Connected Apps and OAuth ...](https://developer.salesforce.com/docs/platform/api-rest/guide/intro-oauth-and-connected-apps.html) (retrieved 2026-10-09)
- [OAuth 2.0 SAML Bearer Assertion Flow for Previously Authorized Apps ...](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_SAML_bearer_flow.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [SAML Assertion Flow for Accessing the API](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_sso_flow.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [Manage OAuth Access Policies for a Connected App | Salesforce Help](https://help.salesforce.com/s/articleView?id=sf.connected_app_manage_oauth.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [Connected App IP Relaxation and Continuous IP Enforcement | Salesforce Help](https://help.salesforce.com/s/articleView?id=sf.connected_app_continuous_ip.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [Modify Session Security Settings | Salesforce Help](https://help.salesforce.com/s/articleView?id=sf.admin_sessions.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [Session Security | Salesforce Help](https://help.salesforce.com/s/articleView?id=sf.security_overview_sessions.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [Access Tokens](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_access_tokens.htm&language=en_US&type=5) (retrieved 2026-10-14)
- [Manage Current OAuth Connected App Sessions](https://help.salesforce.com/s/articleView?id=connected_app_manage_current_sessions.htm&language=en_US&type=5) (retrieved 2026-10-14)
- [Manage Current OAuth Connected App Sessions](https://help.salesforce.com/s/articleView?id=xcloud.connected_app_manage_current_sessions.htm&type=5) (retrieved 2026-10-14)
- [Manage External Client App OAuth Usage](https://help.salesforce.com/s/articleView?id=xcloud.manage_external_client_app_usage.htm&type=5) (retrieved 2026-10-14)
- [OAuth Users by App ID (Connect REST API)](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_resources_usage_app_id_users.htm) (retrieved 2026-10-14)
- [OAuth Usage (Connect REST API)](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_resources_usage.htm) (retrieved 2026-10-14)
- [Step 2: Create a SAML Single Sign-On Setting in Salesforce](https://help.salesforce.com/s/articleView?id=xcloud.sso_service_provider_configuration.htm&type=5) (retrieved 2026-10-14)
- [Monitor Login History](https://help.salesforce.com/s/articleView?id=xcloud.users_login_history.htm&type=5) (retrieved 2026-10-14)
- [LoginHistory | Object Reference](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_loginhistory.htm) (retrieved 2026-10-12)
- [ApiEvent | Platform Events](https://developer.salesforce.com/docs/atlas.en-us.platform_events.meta/platform_events/sforce_api_objects_apievent.htm) (retrieved 2026-10-12)
- [OauthToken (Object Reference)](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_oauthtoken.htm) (retrieved 2026-10-14)
- [Deactivate Users](https://help.salesforce.com/s/articleView?id=platform.how_to_deactivate_users.htm&type=5) (retrieved 2026-10-14)
- [Examples: Deactivate and Reactivate Users with SCIM](https://help.salesforce.com/s/articleView?id=xcloud.identity_scim_deactivate_reactivate_user.htm&type=5) (retrieved 2026-10-14)
- [Object Reference: LoginHistory](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/object_reference.pdf) (retrieved 2026-10-12)
- [Platform Events: LoginEvent](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/platform_events.pdf) (retrieved 2026-10-12)
- [Revoke OAuth Tokens](https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_revoke_token.htm&language=en_US&type=5) (retrieved 2026-10-12)
- [OAuth 2.0 SAML Bearer Assertion Flow](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_SAML_bearer_flow.htm&type=5) (retrieved 2026-10-12)
- [Describe Global | REST API Developer Guide](https://developer.salesforce.com/docs/platform/api-rest/guide/resources-describeglobal.html) (retrieved 2026-10-12)
- [Query resource | REST API Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api/resources_query.htm) (retrieved 2026-10-12)
- [ConnectedApp | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_connectedapp.htm) (retrieved 2026-10-13)
- [ConnectedAppSettings | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_connectedappsettings.htm) (retrieved 2026-10-13)
- [Profile | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_profile.htm) (retrieved 2026-10-13)
- [SecuritySettings | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_securitysettings.htm) (retrieved 2026-10-13)
