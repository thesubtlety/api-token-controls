# Salesforce (core platform): OAuth token exchange

`salesforce-4` · OAuth · person. The client POSTs a token from an external identity provider (access, refresh or ID token, SAML assertion or JWT) to the Salesforce token endpoint. An Apex token exchange handler validates it and maps it to a Salesforce user, and Salesforce returns its own access token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Token exchange uses external client apps, whose tokens per user are listed through the Connect REST API usage resources. | Where: Setup > Quick Find 'External Client Apps' > OAuth Usage > [app] > user count · API: GET /apps/oauth/usage/{ecaId}/users; GET /apps/oauth/usage/{ecaId}/{userId}/tokens |
| Protect: Admin can block or require approval | Yes | Permitted Users: Admin approved users are pre-authorized; API Access Control (Allow only admin-approved apps); Enable Token Exchange Flow; Connected app creation restricted (Spring '26) | Permitted Users: Admin approved users are pre-authorized: Setup > Connected Apps > Manage > Edit Policies > Permitted Users; Metadata ConnectedAppOauthPolicy isAdminApproved (ECA: permittedUsersPolicyType=AdminApprovedPreAuthorized) · API Access Control (Allow only admin-approved apps): Metadata ConnectedAppSettings enableAdminApprovedAppsOnly / enableAdminApprovedAppsOnlyForExternalUser; Setup > Connected Apps OAuth Usage (install/unblock) · Enable Token Exchange Flow: Connected app / ECA OAuth settings > Enable Token Exchange Flow; Metadata isTokenExchangeEnabled (ECA isTokenExchangeFlowEnabled) · Connected app creation restricted (Spring '26): Platform default; contact Salesforce Support to re-enable |
| Protect: SSO and MFA rules apply | Partial | Issuance requires a token from the external identity provider; no Salesforce UI login or MFA step is described. | Where: Setup > Quick Find 'Token' > Token Exchange Handlers (handler Apex class validates the IdP token) |
| Protect: IP restriction | Conditional | General Salesforce controls apply to OAuth apps: profile login IP ranges, the app's IP relaxation policy, and optional 'Enforce login IP ranges on every request'. The IP relaxation and continuous-enforcement pages do not name the token exchange flow, so how its initial exchange is treated was not established. | IP Relaxation: Connected app / external client app OAuth policies > IP Relaxation; Metadata ipRelaxation (ECA ipRelaxationPolicyType) · Profile Login IP Ranges: Setup > Profiles > [profile] > Login IP Ranges; Metadata Profile.loginIpRanges · Enforce login IP ranges on every request: Setup > Session Settings; Metadata SecuritySettings/SessionSettings enforceIpRangesEveryRequest · Lock sessions to the IP address from which they originated: Setup > Session Settings; Metadata SessionSettings lockSessionsToIp |
| Protect: Expires automatically | Partial | Salesforce access token follows session timeout (inactivity); default 2 h Admin control: Refresh Token Policy; Connected app session timeout; External client app JWT access token timeout. | Refresh Token Policy: Connected app / ECA OAuth policies > Refresh Token Policy; Metadata refreshTokenPolicy (ECA refreshTokenPolicyType) · Connected app session timeout: Connected app policies > Session Policies > Timeout Value; Metadata ConnectedAppSessionPolicy sessionTimeout · External client app JWT access token timeout: ECA OAuth policies; Metadata ExtlClntAppOauthConfigurablePolicies namedUserJwtSessionTimeoutType/namedUserJwtTimeout |
| Detect: Usage appears in logs | Yes | Application, LoginSubType, ConnectedAppId, LoginKey, AppName | Where: Setup > Quick Find 'Login History' > Login History (filter/download; Application column) · API: SOQL: SELECT ... FROM LoginHistory WHERE LoginSubType = 'OauthTokenExchange'; ApiEvent WHERE ConnectedAppId = '<id>' (Shield/Event Monitoring) |
| Detect: Data reads appear in logs | Conditional | Read logged only with Shield/Event Monitoring add-on + View Real-Time Event Monitoring Data permission | API: SOQL: SELECT Query, QueriedEntities, RowsProcessed FROM ApiEvent WHERE ConnectedAppId = '<id>' (needs Shield or Event Monitoring + View Real-Time Event Monitoring Data) |
| Respond: Revocation ends active access | Partial | Disabling the handler stops new exchanges only. | Set handler IsEnabled to false; revoke issued tokens via /services/oauth2/revoke; delete AuthSession rows; fix handler Apex validation; revoke the upstream IdP token. |
| Respond: Stops working when user is removed | Partial | Opaque tokens stop on deactivation of the mapped user; JWT-based access tokens stay valid until timeout. | Where: Setup > Quick Find 'Users' > Users > Edit > deselect Active > Save · API: SCIM: PATCH /services/scim/v2/Users/{userId} (replace active=false) |

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
- **Enable Token Exchange Flow** (Disable; Enterprise, Performance, Unlimited, Developer (per input); default off). Token exchange is off unless enabled on the connected app or external client app. Where: Connected app / ECA OAuth settings > Enable Token Exchange Flow; Metadata isTokenExchangeEnabled (ECA isTokenExchangeFlowEnabled).
- **Require secret for token exchange** (Other; all plans; default unknown). Requires the app's consumer secret on token exchange requests. Where: Connected app / ECA OAuth settings; Metadata isSecretRequiredForTokenExchange.
- **Token exchange handler enablement** (Limit scope; all plans; default off). The handler must be enabled and bound to specific apps with an execution user; it validates external tokens and maps users. Where: Setup > Token Exchange Handlers; Metadata OauthTokenExchangeHandler isEnabled + enablements.
- **Connected app creation restricted (Spring '26)** (Disable; all plans; default on). New connected apps cannot be created without contacting Support; existing apps keep working and external client apps are recommended. Where: Platform default; contact Salesforce Support to re-enable.
- **External client app JWT access token timeout** (Limit lifetime; all plans; default varies). For ECAs issuing JWT-based access tokens, sets a custom expiry (1 minute to 12 hours) instead of the session timeout. Where: ECA OAuth policies; Metadata ExtlClntAppOauthConfigurablePolicies namedUserJwtSessionTimeoutType/namedUserJwtTimeout.

- Network: conditional (checked at mixed). General Salesforce controls apply to OAuth apps: profile login IP ranges, the app's IP relaxation policy, and optional 'Enforce login IP ranges on every request'. The IP relaxation and continuous-enforcement pages do not name the token exchange flow, so how its initial exchange is treated was not established.
- Lifetime: Salesforce access token follows session timeout (inactivity); default 2 h. Renewal: If the app requests one, Salesforce returns a refresh token governed by the app's refresh token policy (valid until revoked, immediate, idle or fixed expiry); otherwise the client exchanges a fresh external token.
- Keyless option: supported. This path exists to exchange an external IdP token for Salesforce tokens. Trust is defined in customer-written Apex: the handler decides what counts as a valid token and which user it maps to, and it can create users.
- Conditions: Available in Enterprise, Performance, Unlimited and Developer Editions. Validation and user mapping are customer code, so security depends on the handler implementation.

## Detect: what gets logged
- Token prefix: not established

### Logs
- LoginHistory: Every OAuth token grant shows as a login with LoginType/LoginSubType, SourceIp, Application. 6 months; no add-on needed.
- LoginEvent / ApiEvent (Real-Time Event Monitoring): Needs Shield or Event Monitoring add-on. LoginKey ties a session's events; ApiEvent has ConnectedAppId.
- OauthToken object: Current tokens per user+app with UseCount and LastUsedDate.
- SetupAuditTrail: Connected app / external client app config changes; at least 180 days.
- OauthTokenExchangeHandler object: Handler config: IsEnabled, IsUserCreationAllowed.

### Fields that identify the credential
- `Application` (LoginHistory / LoginEvent): Connected app name used to log in
- `LoginSubType` (LoginHistory / LoginEvent): OAuth flow (e.g. OauthWebServer, OauthClientCredentials, OauthRefreshToken)
- `ConnectedAppId` (ApiEvent): External client app ID; null if session already active
- `LoginKey` (LoginEvent / ApiEvent): Ties all events in one session
- `AppName` (OauthToken): App holding the token

### Lifecycle events
- use: `OauthTokenExchange` LoginSubType for token exchange
- use: `OauthHybridTokenExchange` LoginSubType for hybrid apps

### Correlate on
`UserId`, `Username`, `SourceIp`, `Application`, `LoginKey`, `SessionKey`, `LoginHistoryId`, `ConnectedAppId`, `UserAgent`, `CountryIso`

### API calls a holder can make, and whether they are logged
- recon: `POST /services/oauth2/token (grant_type=...token-exchange, external IdP token/JWT/SAML/ID token)`. Apex Oauth2TokenExchangeHandler validates the external token and maps it to a Salesforce user; returns a Salesforce access token Logged: yes (`LoginHistory (LoginSubType 'OAuth Token Exchange')`). LoginHistory LoginSubType includes 'OAuth Token Exchange'; token issuance is a login event
- recon: `GET /services/oauth2/userinfo`. Mapped Salesforce user_id, organization_id, username; confirms the mapped identity Logged: unknown. Not established that userinfo reads are logged
- enumeration: `GET /services/data/vXX.X/sobjects/ (Describe Global)`. Objects visible to the mapped user; schema reconnaissance Logged: unknown. Metadata read; not confirmed logged
- collection (bulk): `GET /services/data/vXX.X/query/?q={SOQL}`. Bulk record data via SOQL as the mapped user Logged: plan (`ApiEvent (QueriedEntities, Query)`). Read logged only with Shield/Event Monitoring add-on + View Real-Time Event Monitoring Data permission

### What to look for (analyst guidance)
- OauthTokenExchange logins mapped to users who never log in via the external IdP
- New users created right after token exchange (IsUserCreationAllowed true)
- Token exchange from SourceIp not matching the app backend
- Handler Apex class modified (SetupAuditTrail) before unusual mappings

### Sample query (SOQL)
Pull OAuth logins and review rows with LoginSubType OAuth Token Exchange

```
SELECT UserId, LoginTime, SourceIp, Application, LoginSubType, Status FROM LoginHistory WHERE LoginTime = LAST_N_DAYS:7 AND LoginType = 'Remote Access 2.0'
```

## Respond: how to revoke it


Set handler IsEnabled to false; revoke issued tokens via /services/oauth2/revoke; delete AuthSession rows; fix handler Apex validation; revoke the upstream IdP token. Live access ends on revocation: partial. Disabling the handler stops new exchanges only.

## No vendor documentation found
- Exact LoginType API value usable in SOQL filter (label shown)
- Logging of handler validation failures
- Whether userinfo/Describe Global reads are logged
- Read-query audit trail absent Event Monitoring
- help.salesforce.com articles (connected app OAuth policies, JWT/SAML bearer flow pre-authorization, Use Any API Client, uninstalled connected app restrictions, OAuth token revocation) could not be fetched; controls are sourced from the Winter '27 Metadata API reference only.
- Whether JWT bearer and SAML bearer flows always enforce IP restrictions regardless of IP Relaxation (stated in older packaging guides; not verified in current docs).
- Behavior and timeline of the 'Use Any API Client' permission, which bypasses admin pre-approval; vendor deprecation page not fetched.
- Whether a per-flow switch exists to disable JWT bearer or SAML bearer flows org-wide; none found in OauthOidcSettings.
- Default of isSecretRequiredForTokenExchange and enableClientSecretInRestApiAccess.

## Sources
- [Token Exchange Flow Diagram and Process | Salesforce Help](https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_token_exchange_diagram.htm&language=en_US&type=5) (retrieved 2026-10-12)
- [Connected App IP Relaxation and Continuous IP Enforcement | Salesforce Help](https://help.salesforce.com/s/articleView?id=xcloud.connected_app_continuous_ip.htm&language=en_US&type=5) (retrieved 2026-10-12)
- [Manage OAuth Access Policies for a Connected App | Salesforce Help](https://help.salesforce.com/s/articleView?id=xcloud.connected_app_manage_oauth.htm&language=en_US&type=5) (retrieved 2026-10-12)
- [Session Security | Salesforce Help](https://help.salesforce.com/s/articleView?id=xcloud.security_overview_sessions.htm&language=en_US&type=5) (retrieved 2026-10-12)
- [Modify Session Security Settings | Salesforce Help](https://help.salesforce.com/s/articleView?id=xcloud.admin_sessions.htm&language=en_US&type=5) (retrieved 2026-10-12)
- [Set Up the Token Exchange Flow | Salesforce Help](https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_token_exchange_configure.htm&language=en_US&type=5) (retrieved 2026-10-12)
- [Enable Apps for a Token Exchange Handler | Salesforce Help](https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_token_exchange_enable.htm&language=en_US&type=5) (retrieved 2026-10-12)
- [Access Tokens](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_access_tokens.htm&language=en_US&type=5) (retrieved 2026-10-14)
- [External Client App OAuth Usage](https://help.salesforce.com/s/articleView?id=xcloud.meta_external_client_app_oauth_usage.htm&language=en_US&type=5) (retrieved 2026-10-14)
- [Manage External Client App OAuth Usage](https://help.salesforce.com/s/articleView?id=xcloud.manage_external_client_app_usage.htm&type=5) (retrieved 2026-10-14)
- [OAuth Users by App ID (Connect REST API)](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_resources_usage_app_id_users.htm) (retrieved 2026-10-14)
- [Refresh Token by User and App (Connect REST API)](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_resources_usage_app_id_user_id_tokens.htm) (retrieved 2026-10-14)
- [Define a Token Exchange Handler](https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_token_exchange_handler_define.htm&type=5) (retrieved 2026-10-14)
- [Monitor Login History](https://help.salesforce.com/s/articleView?id=xcloud.users_login_history.htm&type=5) (retrieved 2026-10-14)
- [LoginHistory | Object Reference](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_loginhistory.htm) (retrieved 2026-10-12)
- [ApiEvent | Platform Events](https://developer.salesforce.com/docs/atlas.en-us.platform_events.meta/platform_events/sforce_api_objects_apievent.htm) (retrieved 2026-10-12)
- [Deactivate Users](https://help.salesforce.com/s/articleView?id=platform.how_to_deactivate_users.htm&type=5) (retrieved 2026-10-14)
- [Examples: Deactivate and Reactivate Users with SCIM](https://help.salesforce.com/s/articleView?id=xcloud.identity_scim_deactivate_reactivate_user.htm&type=5) (retrieved 2026-10-14)
- [Object Reference: LoginHistory](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/object_reference.pdf) (retrieved 2026-10-12)
- [Revoke OAuth Tokens](https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_revoke_token.htm&language=en_US&type=5) (retrieved 2026-10-12)
- [Oauth2TokenExchangeHandler Class | Apex Reference](https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_class_Auth_Oauth2TokenExchangeHandler.htm) (retrieved 2026-10-12)
- [Describe Global | REST API Developer Guide](https://developer.salesforce.com/docs/platform/api-rest/guide/resources-describeglobal.html) (retrieved 2026-10-12)
- [Query resource | REST API Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api/resources_query.htm) (retrieved 2026-10-12)
- [ConnectedApp | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_connectedapp.htm) (retrieved 2026-10-13)
- [ConnectedAppSettings | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_connectedappsettings.htm) (retrieved 2026-10-13)
- [Profile | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_profile.htm) (retrieved 2026-10-13)
- [SecuritySettings | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_securitysettings.htm) (retrieved 2026-10-13)
- [OauthTokenExchangeHandler | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_oauthtokenexchangehandler.htm) (retrieved 2026-10-13)
- [ExtlClntAppOauthConfigurablePolicies | Metadata API Developer Guide (Winter '27)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_extlclntappoauthconfigurablepolicies.htm) (retrieved 2026-10-13)
