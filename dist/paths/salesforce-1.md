# Salesforce (core platform): OAuth code / client credentials

`salesforce-1` · OAuth · person or service. OAuth bearer: authorization code, client credentials, JWT bearer and SAML bearer/assertion flows. External Client Apps or existing Connected Apps.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Setup > Connected Apps OAuth Usage lists connected apps and per-user usage; external client app tokens are listed only through the Connect REST API usage resources. | Setup > Connected Apps OAuth Usage lists connected apps and per-user usage; external client app tokens are listed only through the Connect REST API usage resources. |
| Protect: Admin can block or require approval | Yes | Permitted Users: Admin approved users are pre-authorized; API Access Control (Allow only admin-approved apps); Enable Client Credentials Flow + Run As user; Block OAuth username-password and user-agent flows; Connected app creation restricted (Spring '26); Block (Connected Apps OAuth Usage) | Permitted Users: Admin approved users are pre-authorized: Setup > Connected Apps > Manage > Edit Policies > Permitted Users; Metadata ConnectedAppOauthPolicy isAdminApproved (ECA: permittedUsersPolicyType=AdminApprovedPreAuthorized) · API Access Control (Allow only admin-approved apps): Metadata ConnectedAppSettings enableAdminApprovedAppsOnly / enableAdminApprovedAppsOnlyForExternalUser; Setup > Connected Apps OAuth Usage (install/unblock) · Enable Client Credentials Flow + Run As user: Connected app / ECA OAuth policies > Enable Client Credentials Flow, Run As; Metadata isClientCredentialEnabled + oauthClientCredentialUser · Block OAuth username-password and user-agent flows: Setup > OAuth and OpenID Connect Settings; Metadata OauthOidcSettings blockOAuthUnPwFlow / blockOAuthUsrAgtFlow · Connected app creation restricted (Spring '26): Platform default; contact Salesforce Support to re-enable · Block (Connected Apps OAuth Usage): Setup > Connected Apps OAuth Usage > Block |
| Protect: SSO and MFA rules apply | Partial | Web server (authorization code) flow needs a Salesforce UI login, which is subject to SSO/MFA; client credentials flow has no UI login and is unaffected. | Where: Setup > Identity Verification > Require multi-factor authentication (MFA) for all direct UI logins; Setup > Single Sign-On Settings (SAML SSO) |
| Protect: IP restriction | Conditional | Profile login ranges and app IP policies; continuous per-request IP enforcement is separately configured. JWT/SAML bearer flows enforce IP restrictions. | IP Relaxation: Connected app / external client app OAuth policies > IP Relaxation; Metadata ipRelaxation (ECA ipRelaxationPolicyType) · Profile Login IP Ranges: Setup > Profiles > [profile] > Login IP Ranges; Metadata Profile.loginIpRanges · Enforce login IP ranges on every request: Setup > Session Settings; Metadata SecuritySettings/SessionSettings enforceIpRangesEveryRequest · Lock sessions to the IP address from which they originated: Setup > Session Settings; Metadata SessionSettings lockSessionsToIp |
| Protect: Expires automatically | Partial | Session timeout (inactivity); default 2 h; set per app, profile or org Admin control: Refresh Token Policy; Connected app session timeout; External client app JWT access token timeout. | Refresh Token Policy: Connected app / ECA OAuth policies > Refresh Token Policy; Metadata refreshTokenPolicy (ECA refreshTokenPolicyType) · Connected app session timeout: Connected app policies > Session Policies > Timeout Value; Metadata ConnectedAppSessionPolicy sessionTimeout · External client app JWT access token timeout: ECA OAuth policies; Metadata ExtlClntAppOauthConfigurablePolicies namedUserJwtSessionTimeoutType/namedUserJwtTimeout |
| Detect: Usage appears in logs | Yes | Application, LoginSubType, ConnectedAppId, LoginKey, AppName | Where: Setup > Quick Find 'Login History' > Login History (filter/download; Application column) · API: SOQL: SELECT ... FROM LoginHistory WHERE Application = '<app>' (LoginSubType for flow); ApiEvent WHERE ConnectedAppId = '<id>' (Shield/Event Monitoring); OauthToken.UseCount |
| Detect: Data reads appear in logs | Conditional | ApiEvent logs user-initiated read-only query()/queryMore()/count() for SOAP and Bulk API, requires Shield or Event Monitoring add-on and View Real-Time Event Monitoring Data permission; Tooling API and mobile-app calls not captured. EventLogFile API event type (paid Event Monitoring) also records REST/SOAP reads. | API: SOQL: SELECT Query, QueriedEntities, RowsProcessed FROM ApiEvent WHERE ConnectedAppId = '<id>' (needs Shield or Event Monitoring + View Real-Time Event Monitoring Data) |
| Respond: Revocation ends active access | Yes | Revoking a refresh token also revokes its associated access tokens. | POST refresh token (or OauthToken DeleteToken) to /services/oauth2/revoke; revoke the app's tokens for the user in Setup; delete AuthSession rows; block or edit the connected app / rotate consumer secret; freeze user. |
| Respond: Stops working when user is removed | Partial | Opaque access tokens stop working immediately when the user is deactivated; JWT-based access tokens stay valid until they time out. | Where: Setup > Quick Find 'Users' > Users > Edit > deselect Active > Save · API: SCIM: PATCH /services/scim/v2/Users/{userId} (replace active=false) |

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
- **Enable Client Credentials Flow + Run As user** (Disable; all plans; default off). Client credentials flow is off unless an admin enables it per app and names an API Only execution user whose access the tokens carry. Where: Connected app / ECA OAuth policies > Enable Client Credentials Flow, Run As; Metadata isClientCredentialEnabled + oauthClientCredentialUser.
- **Block OAuth username-password and user-agent flows** (Disable; all plans; default off). Org-wide switches that block the OAuth username-password flow and the user-agent flow. Where: Setup > OAuth and OpenID Connect Settings; Metadata OauthOidcSettings blockOAuthUnPwFlow / blockOAuthUsrAgtFlow.
- **Require PKCE for authorization code flows** (Other; all plans; default off). Requires PKCE on all supported variants of the authorization code flow into the org. Where: Setup > OAuth and OpenID Connect Settings; Metadata OauthOidcSettings isPkceRequired.
- **Connected app creation restricted (Spring '26)** (Disable; all plans; default on). New connected apps cannot be created without contacting Support; existing apps keep working and external client apps are recommended. Where: Platform default; contact Salesforce Support to re-enable.
- **External client app JWT access token timeout** (Limit lifetime; all plans; default varies). For ECAs issuing JWT-based access tokens, sets a custom expiry (1 minute to 12 hours) instead of the session timeout. Where: ECA OAuth policies; Metadata ExtlClntAppOauthConfigurablePolicies namedUserJwtSessionTimeoutType/namedUserJwtTimeout.
- **Consumer secret access via REST API** (Other; all plans; default unknown). Controls whether external client app consumer secrets can be read through the credentials REST API. Where: Metadata ExternalClientAppSettings enableClientSecretInRestApiAccess.
- **Block (Connected Apps OAuth Usage)** (Disable; all plans; default off). Blocking a connected app ends all current sessions for it and prevents new ones until unblocked. Where: Setup > Connected Apps OAuth Usage > Block.

- Network: conditional (checked at mixed). Profile login ranges and app IP policies; continuous per-request IP enforcement is separately configured. JWT/SAML bearer flows enforce IP restrictions.
- Lifetime: Session timeout (inactivity); default 2 h; set per app, profile or org. Renewal: Refresh policies can revoke immediately, expire on inactivity, expire at a fixed interval, or remain valid until revoked.
- Keyless option: not_verified. SAML assertions can obtain API access. App-signed JWT bearer is also supported but requires a private key and is not itself keyless workload federation.
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

### Lifecycle events
- create: `OauthWebServer` LoginSubType: authorization code grant
- create: `OauthClientCredentials` LoginSubType: client credentials grant
- use: `OauthRefreshToken` LoginSubType: refresh token redemption
- create: `OauthUsernamePassword` LoginSubType: legacy flow, should be blocked

### Correlate on
`UserId`, `Username`, `SourceIp`, `Application`, `LoginKey`, `SessionKey`, `LoginHistoryId`, `ConnectedAppId`, `UserAgent`, `CountryIso`

### API calls a holder can make, and whether they are logged
- recon: `GET /services/oauth2/userinfo`. Authenticated user's identity: user_id, organization_id, username, email; whose context the token runs as Logged: unknown. Not established that userinfo calls appear in EventLogFile/LoginHistory
- discovery: `GET /services/data/vXX.X/limits/`. Org limits and remaining allocations (API calls, data storage); org size/activity signal Logged: unknown. No source states the limits resource read is or isn't logged
- enumeration: `GET /services/data/vXX.X/sobjects/ (Describe Global)`. All standard and custom objects visible to the user, plus maxBatchSize; schema map for targeting Logged: unknown. Describe calls are metadata reads; not confirmed in audit logs
- collection (bulk): `GET /services/data/vXX.X/query/?q={SOQL}`. Record data from any readable object via SOQL; up to 2,000 rows per page then nextRecordsUrl Logged: plan (`ApiEvent (QueriedEntities, Query, RowsProcessed)`). ApiEvent logs user-initiated read-only query()/queryMore()/count() for SOAP and Bulk API, requires Shield or Event Monitoring add-on and View Real-Time Event Monitoring Data permission; Tooling API and mobile-app calls not captured. EventLogFile API event type (paid Event Monitoring) also records REST/SOAP reads.

### Public detection rules (community, not vendor documentation)
- [Salesforce Third-Party Integration Monitoring](https://github.com/panther-labs/panther-analysis/blob/develop/rules/salesforce_rules/salesforce_third_party_integration.yml) (Panther): Connected app usage events (OAuth apps accessing Salesforce), with higher severity for refresh-token connections.
- [Salesforce API Anomaly Detection (RET Passthrough)](https://github.com/panther-labs/panther-analysis/blob/develop/rules/salesforce_rules/salesforce_api_anomaly_passthrough.yml) (Panther): Salesforce Real-Time Event Monitoring API anomaly events, which flag unusual API use by a session or token.

### What to look for (analyst guidance)
- OauthRefreshToken logins from a new SourceIp/CountryIso for an integration user
- OauthToken rows with new AppName for a privileged user
- ApiEvent RowsReturned spikes for one ConnectedAppId (bulk export)
- Client credentials logins outside the integration's schedule
- OauthUsernamePassword appearing at all

### Sample query (SOQL)
Review one user's OAuth logins by app and IP (LoginSubType is not filterable, so select it)

```
SELECT UserId, LoginTime, SourceIp, CountryIso, Application, LoginType, LoginSubType, Status FROM LoginHistory WHERE LoginTime = LAST_N_DAYS:7 AND UserId = '005000000000001AAA' ORDER BY LoginTime DESC
```

## Respond: how to revoke it


POST refresh token (or OauthToken DeleteToken) to /services/oauth2/revoke; revoke the app's tokens for the user in Setup; delete AuthSession rows; block or edit the connected app / rotate consumer secret; freeze user. Live access ends on revocation: yes. Revoking a refresh token also revokes its associated access tokens.

## No vendor documentation found
- Setup Audit Trail Action values for connected app changes
- LoginType API value string used in SOQL filters for Remote Access 2.0
- Token prefix/regex
- Whether userinfo, limits, and Describe Global reads are recorded in any audit log
- Whether plain REST query() without Shield/Event Monitoring leaves any read audit trail
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
- [Prepare for MFA Enforcement for All Employee Users](https://help.salesforce.com/s/articleView?id=005321561&language=en_US&type=1) (retrieved 2026-10-14)
- [Access Tokens](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_access_tokens.htm&language=en_US&type=5) (retrieved 2026-10-14)
- [Manage Current OAuth Connected App Sessions](https://help.salesforce.com/s/articleView?id=connected_app_manage_current_sessions.htm&language=en_US&type=5) (retrieved 2026-10-14)
- [External Client App OAuth Usage](https://help.salesforce.com/s/articleView?id=xcloud.meta_external_client_app_oauth_usage.htm&language=en_US&type=5) (retrieved 2026-10-14)
- [Enable MFA for Direct Login](https://help.salesforce.com/s/articleView?id=xcloud.security_mfa_org_wide_setting.htm&type=5) (retrieved 2026-10-14)
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
- [Monitor Login History](https://help.salesforce.com/s/articleView?id=sf.users_login_history.htm&language=en_US&type=5) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [Query for User Information (UserInfo endpoint)](https://help.salesforce.com/s/articleView?id=remoteaccess_using_userinfo_endpoint.htm&type=5) (retrieved 2026-10-12)
- [Limits resource | REST API Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_limits.htm) (retrieved 2026-10-12)
- [Describe Global | REST API Developer Guide](https://developer.salesforce.com/docs/platform/api-rest/guide/resources-describeglobal.html) (retrieved 2026-10-12)
- [Query resource | REST API Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api/resources_query.htm) (retrieved 2026-10-12)
- [ConnectedApp | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_connectedapp.htm) (retrieved 2026-10-13)
- [ConnectedAppSettings | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_connectedappsettings.htm) (retrieved 2026-10-13)
- [Profile | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_profile.htm) (retrieved 2026-10-13)
- [SecuritySettings | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_securitysettings.htm) (retrieved 2026-10-13)
- [OauthOidcSettings | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_oauthoidcsettings.htm) (retrieved 2026-10-13)
- [ExtlClntAppOauthConfigurablePolicies | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_extlclntappoauthconfigurablepolicies.htm) (retrieved 2026-10-13)
- [ExternalClientAppSettings | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_externalclientappsettings.htm) (retrieved 2026-10-13)
