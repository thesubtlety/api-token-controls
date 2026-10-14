# Salesforce (core platform): JWT bearer

`salesforce-2` · Signed JWT · service. OAuth bearer: authorization code, client credentials, JWT bearer and SAML bearer/assertion flows. External Client Apps or existing Connected Apps.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Connected Apps OAuth Usage and the Connect REST API usage resources list app connections and tokens; docs do not confirm JWT bearer grants appear there. | Where: Setup > Quick Find 'OAuth' > Connected Apps OAuth Usage (click user count for per-user tokens) · API: GET /apps/oauth/usage/{appId}/users (Connect REST resource; external client apps) |
| Protect: Admin can block or require approval | Yes | Permitted Users: Admin approved users are pre-authorized; API Access Control (Allow only admin-approved apps); Connected app creation restricted (Spring '26); Block (Connected Apps OAuth Usage) | Permitted Users: Admin approved users are pre-authorized: Setup > Connected Apps > Manage > Edit Policies > Permitted Users; Metadata ConnectedAppOauthPolicy isAdminApproved (ECA: permittedUsersPolicyType=AdminApprovedPreAuthorized) · API Access Control (Allow only admin-approved apps): Metadata ConnectedAppSettings enableAdminApprovedAppsOnly / enableAdminApprovedAppsOnlyForExternalUser; Setup > Connected Apps OAuth Usage (install/unblock) · Connected app creation restricted (Spring '26): Platform default; contact Salesforce Support to re-enable · Block (Connected Apps OAuth Usage): Setup > Connected Apps OAuth Usage > Block |
| Protect: SSO and MFA rules apply | Not available | JWT bearer flow has no UI login, so MFA/SSO login enforcement does not apply. |  |
| Protect: IP restriction | Conditional | Profile login ranges and app IP policies; continuous per-request IP enforcement is separately configured. JWT/SAML bearer flows enforce IP restrictions. | IP Relaxation: Connected app / external client app OAuth policies > IP Relaxation; Metadata ipRelaxation (ECA ipRelaxationPolicyType) · Profile Login IP Ranges: Setup > Profiles > [profile] > Login IP Ranges; Metadata Profile.loginIpRanges · Enforce login IP ranges on every request: Setup > Session Settings; Metadata SecuritySettings/SessionSettings enforceIpRangesEveryRequest · Lock sessions to the IP address from which they originated: Setup > Session Settings; Metadata SessionSettings lockSessionsToIp |
| Protect: Expires automatically | Partial | Session timeout (inactivity); default 2 h; set per app, profile or org Admin control: Connected app session timeout; External client app JWT access token timeout. | Connected app session timeout: Connected app policies > Session Policies > Timeout Value; Metadata ConnectedAppSessionPolicy sessionTimeout · External client app JWT access token timeout: ECA OAuth policies; Metadata ExtlClntAppOauthConfigurablePolicies namedUserJwtSessionTimeoutType/namedUserJwtTimeout |
| Detect: Usage appears in logs | Yes | Application, LoginSubType, ConnectedAppId, LoginKey, AppName | Where: Setup > Quick Find 'Login History' > Login History (filter/download; Application column) · API: SOQL: SELECT ... FROM LoginHistory WHERE Application = '<app>' (LoginSubType for flow); ApiEvent WHERE ConnectedAppId = '<id>' (Shield/Event Monitoring); OauthToken.UseCount |
| Detect: Data reads appear in logs | Conditional | Read logged only with Shield/Event Monitoring add-on + View Real-Time Event Monitoring Data; EventLogFile API event type needs paid Event Monitoring for 30-day retention | API: SOQL: SELECT Query, QueriedEntities, RowsProcessed FROM ApiEvent WHERE ConnectedAppId = '<id>' (needs Shield or Event Monitoring + View Real-Time Event Monitoring Data) |
| Respond: Revocation ends active access | Partial | No refresh token exists, so attacker re-mints with the private key until the cert or pre-authorization is removed. Issued access tokens need explicit revoke or session deletion. | Remove or replace the certificate on the connected app; remove pre-authorized profiles/permission sets; revoke current access tokens via /services/oauth2/revoke; delete AuthSession rows; freeze the integration user. |
| Respond: Stops working when user is removed | Partial | Deactivating the subject user stops opaque tokens immediately; JWT-based access tokens stay valid until timeout. | Where: Setup > Quick Find 'Users' > Users > Edit > deselect Active > Save · API: SCIM: PATCH /services/scim/v2/Users/{userId} (replace active=false) |

## Protect: what an admin can configure

### Admin controls
- **Permitted Users: Admin approved users are pre-authorized** (Require approval; Not available in Group Edition; default off). Only users whose profile or permission set is assigned to the connected app can use it; others are refused. Where: Setup > Connected Apps > Manage > Edit Policies > Permitted Users; Metadata ConnectedAppOauthPolicy isAdminApproved (ECA: permittedUsersPolicyType=AdminApprovedPreAuthorized).
- **API Access Control (Allow only admin-approved apps)** (Disable; Must be enabled by Salesforce Customer Support; default off). Org-wide: only connected apps installed or approved by an admin can call the Salesforce API; a separate switch covers customer/partner users. Where: Metadata ConnectedAppSettings enableAdminApprovedAppsOnly / enableAdminApprovedAppsOnlyForExternalUser; Setup > Connected Apps OAuth Usage (install/unblock).
- **IP Relaxation** (Limit network; all plans; default on). Enforce (default) applies org and profile IP restrictions to the app; Bypass options relax them, and Enforce_RelaxRefresh skips them for refresh-token exchanges. Where: Connected app / external client app OAuth policies > IP Relaxation; Metadata ipRelaxation (ECA ipRelaxationPolicyType).
- **Profile Login IP Ranges** (Limit network; all plans; default off). Restricts the IP ranges from which users of a profile, including API integration users, can log in. Where: Setup > Profiles > [profile] > Login IP Ranges; Metadata Profile.loginIpRanges.
- **Enforce login IP ranges on every request** (Limit network; all plans; default off). Checks profile Login IP Ranges on every request, including from client apps, not only at login. Where: Setup > Session Settings; Metadata SecuritySettings/SessionSettings enforceIpRangesEveryRequest.
- **Lock sessions to the IP address from which they originated** (Limit network; all plans; default off). Binds a session to the IP it was created from. Where: Setup > Session Settings; Metadata SessionSettings lockSessionsToIp.
- **Connected app session timeout** (Limit lifetime; all plans; default varies). Sets how long an access token session from the app lasts; falls back to profile then org session timeout. Where: Connected app policies > Session Policies > Timeout Value; Metadata ConnectedAppSessionPolicy sessionTimeout.
- **High assurance session required (Block / Raise session level)** (Other; all plans; default off). Requires MFA-level sessions for the app; flows without a user approval step, such as JWT bearer, are blocked. Where: Connected app policies > Session Policies > High assurance session required; Metadata sessionLevel/policyAction.
- **Connected app creation restricted (Spring '26)** (Disable; all plans; default on). New connected apps cannot be created without contacting Support; existing apps keep working and external client apps are recommended. Where: Platform default; contact Salesforce Support to re-enable.
- **External client app JWT access token timeout** (Limit lifetime; all plans; default varies). For ECAs issuing JWT-based access tokens, sets a custom expiry (1 minute to 12 hours) instead of the session timeout. Where: ECA OAuth policies; Metadata ExtlClntAppOauthConfigurablePolicies namedUserJwtSessionTimeoutType/namedUserJwtTimeout.
- **Block (Connected Apps OAuth Usage)** (Disable; all plans; default off). Blocking a connected app ends all current sessions for it and prevents new ones until unblocked. Where: Setup > Connected Apps OAuth Usage > Block.

- Network: conditional (checked at mixed). Profile login ranges and app IP policies; continuous per-request IP enforcement is separately configured. JWT/SAML bearer flows enforce IP restrictions.
- Lifetime: Session timeout (inactivity); default 2 h; set per app, profile or org. Renewal: No refresh token; the app signs a new JWT with its private key and requests a new token. Continued access depends on the registered certificate and the app's pre-authorization.
- Keyless option: not_applicable. SAML assertions can obtain API access. App-signed JWT bearer is also supported but requires a private key and is not itself keyless workload federation.
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
No docs found.

### Correlate on
`UserId`, `Username`, `SourceIp`, `Application`, `LoginKey`, `SessionKey`, `LoginHistoryId`, `ConnectedAppId`, `UserAgent`, `CountryIso`

### API calls a holder can make, and whether they are logged
- recon: `POST /services/oauth2/token (grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer, signed JWT)`. Mints a Salesforce access token for the JWT subject user without interactive login; confirms foothold Logged: yes (`LoginHistory / LoginEvent`). Each token issuance is a login recorded in LoginHistory; LoginSubType distinguishes OAuth flows. (Login event type in EventLogFile is available free on EE/UE/PE.)
- recon: `GET /services/oauth2/userinfo`. user_id, organization_id, username of the JWT subject; which identity the service token holds Logged: unknown. Not established that userinfo reads are logged
- enumeration: `GET /services/data/vXX.X/sobjects/ (Describe Global)`. Objects visible to the service user and query batch size; schema reconnaissance Logged: unknown. Metadata read; not confirmed logged
- collection (bulk): `GET /services/data/vXX.X/query/?q={SOQL}`. Bulk record data via SOQL for the service user's permissions Logged: plan (`ApiEvent (QueriedEntities, Query)`). Read logged only with Shield/Event Monitoring add-on + View Real-Time Event Monitoring Data; EventLogFile API event type needs paid Event Monitoring for 30-day retention

### Public detection rules (community, not vendor documentation)
- [Salesforce Third-Party Integration Monitoring](https://github.com/panther-labs/panther-analysis/blob/develop/rules/salesforce_rules/salesforce_third_party_integration.yml) (Panther): Connected app usage events (OAuth apps accessing Salesforce), with higher severity for refresh-token connections.
- [Salesforce API Anomaly Detection (RET Passthrough)](https://github.com/panther-labs/panther-analysis/blob/develop/rules/salesforce_rules/salesforce_api_anomaly_passthrough.yml) (Panther): Salesforce Real-Time Event Monitoring API anomaly events, which flag unusual API use by a session or token.

### What to look for (analyst guidance)
- JWT bearer logins (Application = the integration app) from a SourceIp outside the integration's hosts
- Integration user's access spreading to objects it never queried (ApiEvent QueriedEntities)
- Certificate on the connected app changed in SetupAuditTrail before new logins
- JWT logins for a sub (user) other than the expected integration user

### Sample query (SOQL)
Review JWT integration user's logins by IP and app

```
SELECT UserId, LoginTime, SourceIp, Application, LoginSubType, Status FROM LoginHistory WHERE LoginTime = LAST_N_DAYS:30 AND UserId = '005000000000002AAA' ORDER BY LoginTime DESC
```

## Respond: how to revoke it


Remove or replace the certificate on the connected app; remove pre-authorized profiles/permission sets; revoke current access tokens via /services/oauth2/revoke; delete AuthSession rows; freeze the integration user. Live access ends on revocation: partial. No refresh token exists, so attacker re-mints with the private key until the cert or pre-authorization is removed. Issued access tokens need explicit revoke or session deletion.

## No vendor documentation found
- LoginSubType value for JWT bearer (none listed in Object Reference)
- Event marking JWT signature failure
- Setup Audit Trail Action names for certificate changes
- Exact LoginSubType string for JWT bearer in current API version (SAML/Token Exchange confirmed; JWT Bearer not confirmed in fetched source)
- Whether read queries leave an audit trail without Event Monitoring
- help.salesforce.com articles (connected app OAuth policies, JWT/SAML bearer flow pre-authorization, Use Any API Client, uninstalled connected app restrictions, OAuth token revocation) could not be fetched; controls are sourced from the Winter '27 Metadata API reference only.
- Whether JWT bearer and SAML bearer flows always enforce IP restrictions regardless of IP Relaxation (stated in older packaging guides; not verified in current docs).
- Behavior and timeline of the 'Use Any API Client' permission, which bypasses admin pre-approval; vendor deprecation page not fetched.
- Whether a per-flow switch exists to disable JWT bearer or SAML bearer flows org-wide; none found in OauthOidcSettings.
- Default of isSecretRequiredForTokenExchange and enableClientSecretInRestApiAccess.

## Sources
- [Authorization Through External Client Apps or Connected Apps and OAuth ...](https://developer.salesforce.com/docs/platform/api-rest/guide/intro-oauth-and-connected-apps.html) (retrieved 2026-10-09)
- [OAuth 2.0 SAML Bearer Assertion Flow for Previously Authorized Apps ...](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_SAML_bearer_flow.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [SAML Assertion Flow for Accessing the API](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_sso_flow.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [OAuth 2.0 JWT Bearer Flow for Server-to-Server Integration](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_jwt_flow.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [Manage OAuth Access Policies for a Connected App | Salesforce Help](https://help.salesforce.com/s/articleView?id=sf.connected_app_manage_oauth.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [Connected App IP Relaxation and Continuous IP Enforcement | Salesforce Help](https://help.salesforce.com/s/articleView?id=sf.connected_app_continuous_ip.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [Modify Session Security Settings | Salesforce Help](https://help.salesforce.com/s/articleView?id=sf.admin_sessions.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [Session Security | Salesforce Help](https://help.salesforce.com/s/articleView?id=sf.security_overview_sessions.htm&language=en_US&type=5) (retrieved 2026-10-09)
- [Prepare for MFA Enforcement for All Employee Users](https://help.salesforce.com/s/articleView?id=005321561&language=en_US&type=1) (retrieved 2026-10-14)
- [Access Tokens](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_access_tokens.htm&language=en_US&type=5) (retrieved 2026-10-14)
- [Manage Current OAuth Connected App Sessions](https://help.salesforce.com/s/articleView?id=connected_app_manage_current_sessions.htm&language=en_US&type=5) (retrieved 2026-10-14)
- [External Client App OAuth Usage](https://help.salesforce.com/s/articleView?id=xcloud.meta_external_client_app_oauth_usage.htm&language=en_US&type=5) (retrieved 2026-10-14)
- [Manage Current OAuth Connected App Sessions](https://help.salesforce.com/s/articleView?id=xcloud.connected_app_manage_current_sessions.htm&type=5) (retrieved 2026-10-14)
- [Manage External Client App OAuth Usage](https://help.salesforce.com/s/articleView?id=xcloud.manage_external_client_app_usage.htm&type=5) (retrieved 2026-10-14)
- [OAuth Users by App ID (Connect REST API)](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_resources_usage_app_id_users.htm) (retrieved 2026-10-14)
- [OAuth Usage (Connect REST API)](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_resources_usage.htm) (retrieved 2026-10-14)
- [Monitor Login History](https://help.salesforce.com/s/articleView?id=xcloud.users_login_history.htm&type=5) (retrieved 2026-10-14)
- [LoginHistory | Object Reference](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_loginhistory.htm) (retrieved 2026-10-12)
- [ApiEvent | Platform Events](https://developer.salesforce.com/docs/atlas.en-us.platform_events.meta/platform_events/sforce_api_objects_apievent.htm) (retrieved 2026-10-12)
- [OauthToken (Object Reference)](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_oauthtoken.htm) (retrieved 2026-10-14)
- [Deactivate Users](https://help.salesforce.com/s/articleView?id=platform.how_to_deactivate_users.htm&type=5) (retrieved 2026-10-14)
- [Examples: Deactivate and Reactivate Users with SCIM](https://help.salesforce.com/s/articleView?id=xcloud.identity_scim_deactivate_reactivate_user.htm&type=5) (retrieved 2026-10-14)
- [OAuth 2.0 JWT Bearer Flow](https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_oauth_jwt_flow.htm&language=en_US&type=5) (retrieved 2026-10-12)
- [Object Reference: LoginHistory](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/object_reference.pdf) (retrieved 2026-10-12)
- [Platform Events: LoginEvent](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/platform_events.pdf) (retrieved 2026-10-12)
- [Revoke OAuth Tokens](https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_revoke_token.htm&language=en_US&type=5) (retrieved 2026-10-12)
- [OAuth 2.0 JWT Bearer Flow for Server-to-Server Integration](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_jwt_flow.htm&type=5) (retrieved 2026-10-12)
- [Describe Global | REST API Developer Guide](https://developer.salesforce.com/docs/platform/api-rest/guide/resources-describeglobal.html) (retrieved 2026-10-12)
- [Query resource | REST API Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api/resources_query.htm) (retrieved 2026-10-12)
- [Access and Use Your Event Log Files (Trailhead)](https://trailhead.salesforce.com/content/learn/modules/event-log-files-quick-look/access-and-use-your-event-log-files) (retrieved 2026-10-12)
- [ConnectedApp | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_connectedapp.htm) (retrieved 2026-10-13)
- [ConnectedAppSettings | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_connectedappsettings.htm) (retrieved 2026-10-13)
- [Profile | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_profile.htm) (retrieved 2026-10-13)
- [SecuritySettings | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_securitysettings.htm) (retrieved 2026-10-13)
- [ExtlClntAppOauthConfigurablePolicies | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_extlclntappoauthconfigurablepolicies.htm) (retrieved 2026-10-13)
