# Google Workspace: User OAuth

`google-1` · OAuth · person. OAuth 2.0 user bearer tokens; service-account signed JWT exchange. Domain-wide delegation (DWD) enables approved user impersonation.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Admin console App access control shows an Accessed apps list with user counts; active tokens are listed only per user per app on the user's Security page. | Admin console App access control shows an Accessed apps list with user counts; active tokens are listed only per user per app on the user's Security page. |
| Protect: Admin can block or require approval | Yes | Unconfigured third-party apps; Allow users to request access to unconfigured third-party apps | Unconfigured third-party apps: Admin console > Security > Access and data control > API controls > Settings > Unconfigured third-party apps · Allow users to request access to unconfigured third-party apps: Admin console > Security > Access and data control > API controls > Settings |
| Protect: SSO and MFA rules apply | Yes | OAuth apps can be held to Context-Aware Access levels at Google sign-in, and Workspace services can apply Context-Aware Access to API access (Enterprise, Education Standard/Plus, Frontline, Cloud Identity Premium). | Where: Admin console > Security > Access and data control > Context-Aware Access > Assign access levels to apps > (app) Assign; Policy settings: check "Block other apps from accessing the selected apps via APIs, if access levels aren't met" |
| Protect: IP restriction | Conditional (requires Frontline, Enterprise, Education, Enterprise Essentials Plus, Cloud Identity Premium; Enterprise Standard/Plus, Education Standard/Plus, Cloud Identity Premium) | Context-Aware Access (eligible editions) can apply IP/device/location access levels to internal and third-party OAuth apps, checked when the user signs in through Google; active sessions are not re-evaluated. Its documentation excludes service-account API access. | Access levels for OAuth apps (Context-Aware Access): Admin console > Security > Access and data control > Context-Aware Access > General Settings > Access levels for OAuth apps · Context-Aware Access for Workspace APIs: Admin console > Security > Access and data control > Context-Aware Access |
| Protect: Expires automatically | Yes | 1-hour user access token | Google Cloud session control: Admin console > Security > Access and data control > Google Cloud session control |
| Detect: Usage appears in logs | Yes | client_id, app_name, scope, actor.applicationInfo.oauthClientId | Where: Admin console > Reporting > Audit and investigation > OAuth log events; filter by app / client ID · API: GET https://admin.googleapis.com/admin/reports/v1/activity/users/all/applications/token?filters=client_id==CLIENT_ID |
| Detect: Data reads appear in logs | Conditional | Admin SDK Reports token audit 'activity' event logs API calls (api_name, method_name, num_response_bytes, client_id) for third-party apps; Gmail API access by user via OAuth token surfaced there; Token 'activity' event records the API calls (requires the app/token to be third-party). Gmail audit log delivery event mail_event_type 33 = 'An application accessed a message on behalf of a user' | Where: OAuth log events (Event = activity, API method / Number of response bytes); Gmail: Reporting > Audit and investigation > Gmail log events · API: GET .../applications/token?eventName=activity; GET .../applications/gmail?eventName=delivery filtered on event_info.mail_event_type==33 |
| Respond: Revocation ends active access | Yes | Revoking an access token also revokes its refresh token; tokens.delete removes all access tokens for that user+app. | Admin: Directory API tokens.delete for user+clientId; add the app to the blocked list (ADD_TO_BLOCKED_OAUTH2_APPS); user/app: POST token to https://oauth2.googleapis.com/revoke; reset user if account compromised. |
| Respond: Stops working when user is removed | Yes | Suspending a user resets their sign-in cookies and OAuth tokens. | Where: Admin console > Directory > Users > (user) > More options > Suspend user · API: PUT https://admin.googleapis.com/admin/directory/v1/users/{userKey} with {"suspended": true} |

## Protect: what an admin can configure

### Admin controls
- **App access control: Blocked / Limited / Specific Google data / Trusted** (Limit scope; all plans; default varies). Per OAuth app, blocks it, limits it to unrestricted services, or limits it to admin-chosen scopes. Where: Admin console > Security > Access and data control > API controls > Manage Third-Party App Access.
- **Unconfigured third-party apps** (Disable; Options depend on Workspace edition; default off). Blocks Sign in with Google to apps the admin has not configured, or allows only basic-profile requests. Where: Admin console > Security > Access and data control > API controls > Settings > Unconfigured third-party apps.
- **Allow users to request access to unconfigured third-party apps** (Require approval; all plans; default off). Users blocked from an unconfigured app can request it; admins review the request. Where: Admin console > Security > Access and data control > API controls > Settings.
- **Google services: Restricted** (Limit scope; all plans; default off). Marks a Workspace service so only Trusted or Specific-data apps can reach its data. Where: Admin console > Security > Access and data control > API controls > Manage Google Services.
- **Restrict high-risk OAuth scopes** (Limit scope; all plans; default off). For Gmail, Drive, Docs and Chat, blocks a predefined list of high-risk scopes for non-trusted apps. Where: Admin console > Security > Access and data control > API controls > Manage Google Services.
- **Trust internal apps** (Other; all plans; default unknown). When checked, all internal apps can reach restricted APIs; leaving it off keeps internal apps under the same restrictions. Where: Admin console > Security > Access and data control > API controls > Settings.
- **Access levels for OAuth apps (Context-Aware Access)** (Limit network; Frontline, Enterprise, Education, Enterprise Essentials Plus, Cloud Identity Premium; default off). Requires IP, location, device or identity conditions when users sign in to OAuth apps with Google; checked at sign-in only. Where: Admin console > Security > Access and data control > Context-Aware Access > General Settings > Access levels for OAuth apps.
- **Context-Aware Access for Workspace APIs** (Limit network; Enterprise Standard/Plus, Education Standard/Plus, Cloud Identity Premium; default off). Applies CAA access levels to first- and third-party apps reaching Workspace core data through APIs. Where: Admin console > Security > Access and data control > Context-Aware Access.
- **Google Cloud session control** (Limit lifetime; all plans; default off). Forces reauthentication every 1-24 hours for apps holding user grants to Google Cloud scopes, similar to revoking their refresh tokens. Where: Admin console > Security > Access and data control > Google Cloud session control.

- Network: conditional (checked at mixed). Context-Aware Access (eligible editions) can apply IP/device/location access levels to internal and third-party OAuth apps, checked when the user signs in through Google; active sessions are not re-evaluated. Its documentation excludes service-account API access.
- Lifetime: 1-hour user access token. Renewal: Refresh tokens stay valid until revoked, but expire after six months unused, after 7 days for external apps in Testing status, on Google Cloud session-length limits, or when the 100-per-client limit is exceeded.
- Keyless option: not_verified. Google documents WIF → service account → IAM signJwt → OAuth token for DWD. Workspace scopes/admin delegation remain separate requirements.
- Conditions: Context-Aware Access requires eligible Workspace/Cloud Identity editions. User policy coverage does not establish protection of DWD service accounts.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Workspace OAuth Token audit log (Reports API applicationName=token): authorize/revoke/deny/request plus per-API activity by client_id. 6-month retention; lag up to a few hours.
- Workspace Admin audit log: App access control changes (blocked/trusted apps). 6 months.

### Fields that identify the credential
- `client_id` (Token audit log): OAuth client the grant belongs to
- `app_name` (Token audit log): App display name
- `scope` (Token audit log): Scopes granted/revoked
- `actor.applicationInfo.oauthClientId` (Reports API Activity): App acting in other apps' logs

### Lifecycle events
- create: `authorize` User granted scopes to client_id
- use: `activity` API call: api_name, method_name, num_response_bytes
- auth_fail: `deny` Blocked by admin policy; rejection_type
- revoke: `revoke` Grant removed

### Correlate on
`actor.email`, `actor.profileId`, `ipAddress`, `networkInfo`, `client_id`, `app_name`, `scope`, `id.time`, `id.uniqueQualifier`

### API calls a holder can make, and whether they are logged
- recon: `GET https://oauth2.googleapis.com/tokeninfo?access_token={token}`. Token metadata: scope (space-separated granted scopes), aud/issued_to, expires_in, email/user_id Logged: unknown. Google documents tokeninfo as a debugging endpoint; no statement that calls appear in Workspace admin audit logs
- recon: `GET https://openidconnect.googleapis.com/v1/userinfo`. Authenticated user's profile (sub, email, name); confirms identity behind token Logged: unknown. Not established that userinfo calls are written to Workspace audit logs
- collection: `GET https://gmail.googleapis.com/gmail/v1/users/me/profile`. emailAddress, messagesTotal, threadsTotal, historyId; mailbox size before bulk pull Logged: plan (`OAuth Token audit log: activity event`). Admin SDK Reports token audit 'activity' event logs API calls (api_name, method_name, num_response_bytes, client_id) for third-party apps; Gmail API access by user via OAuth token surfaced there
- collection (bulk): `GET https://gmail.googleapis.com/gmail/v1/users/me/messages (then messages/{id})`. Message IDs then full message content; bulk mailbox export Logged: plan (`OAuth Token audit log: activity event; Gmail audit mail_event_type 33`). Token 'activity' event records the API calls (requires the app/token to be third-party). Gmail audit log delivery event mail_event_type 33 = 'An application accessed a message on behalf of a user'

### Public detection rules (community, not vendor documentation)
- [Google Workspace OAuth Application Authorized with Privileged Scopes](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gsuite_activityevent_rules/gsuite_oauth_privileged_scopes.yml) (Panther): A user authorized an OAuth app with privileged scopes (directory, eDiscovery, Vault, Cloud Search).
- [Google Workspace OAuth Token Requests from New IP](https://github.com/panther-labs/panther-analysis/blob/develop/queries/gsuite_queries/gsuite_oauth_token_new_ip_rule.yml) (Panther): Scheduled rule: a user made 3+ OAuth token authorizations from an IPv4 address not seen in the prior 30 days.
- [Google Workspace OAuthLogin Scope Anomalous Application Access](https://github.com/panther-labs/panther-analysis/blob/develop/queries/gsuite_queries/GSuite_OAuth_Login_Scope_Anomalous_Access_Query.yml) (Panther): Saved query: an app newly requested tokens with the accounts/OAuthLogin scope.
- [Google Workspace OAuth Anomalous Privileged Request](https://github.com/panther-labs/panther-analysis/blob/develop/queries/gsuite_queries/GSuite_OAuth_Anomalous_Scope_Patterns_Query.yml) (Panther): Saved query: a user authorized a new OAuth client with privileged scopes.
- [Google Workspace Apps Marketplace New Domain Application](https://github.com/panther-labs/panther-analysis/blob/develop/rules/gsuite_activityevent_rules/google_workspace_apps_marketplace_new_domain_application.yml) (Panther): An admin added and enabled a Marketplace app for the domain.
- [Google Workspace Application Removed](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/gcp/gworkspace/admin/gcp_gworkspace_application_removed.yml) (Sigma): A Marketplace application was removed or taken off the allowlist.

### What to look for (analyst guidance)
- authorize for a client_id never seen in the domain with Gmail/Drive scopes
- activity events with high num_response_bytes from GMAIL or DRIVE product_bucket right after authorize
- Token activity from ipAddress/ASN not used by the user's interactive logins
- Use continuing after revoke (lag aside) suggests a second grant or other client
- deny events with SCOPE_BLOCK showing an attacker probing scopes

### Sample query (Google Workspace Reports API (activities.list))
List every API call made with one OAuth client across all users

```
GET https://admin.googleapis.com/admin/reports/v1/activity/users/all/applications/token?eventName=activity&filters=client_id==1234567890-abc.apps.googleusercontent.com
```

## Respond: how to revoke it


Admin: Directory API tokens.delete for user+clientId; add the app to the blocked list (ADD_TO_BLOCKED_OAUTH2_APPS); user/app: POST token to https://oauth2.googleapis.com/revoke; reset user if account compromised. Live access ends on revocation: yes. Revoking an access token also revokes its refresh token; tokens.delete removes all access tokens for that user+app.

## No vendor documentation found
- Documented token prefix/regex
- Exact parameter value formats for scope in activity events
- Whether tokeninfo and userinfo calls are written to any Workspace audit log
- Whether the token 'activity' event fires for first-party vs. all OAuth clients, and its latency/completeness
- Edition requirement for Gmail delivery audit events (page did not state one)
- Whether Workspace Context-Aware Access or third-party app access settings apply to domain-wide delegation service account calls; the DWD page does not say.
- Edition requirement for multi-party approval on DWD changes.
- No per-DWD-client IP restriction found in Workspace docs; absence not stated by Google.
- Default of 'Trust internal apps' not stated on the fetched page.
- Exact UI path for applying CAA to Workspace APIs; the 2023 update links to help articles without naming the setting.

## Sources
- [Using OAuth 2.0 for Server to Server Applications  |  Authorization  |  Google for Developers](https://developers.google.com/identity/protocols/oauth2/service-account) (retrieved 2026-10-09)
- [Best practices for managing service account keys  |  Identity and Access Management (IAM)  |  Google Cloud Documentation](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys?hl=en) (retrieved 2026-10-09)
- [Protect your business with Context-Aware Access - Google](https://knowledge.workspace.google.com/admin/security/protect-your-business-with-context-aware-access) (retrieved 2026-10-09)
- [Perform Google Workspace domain-wide delegation of authority](https://developers.google.com/workspace/cloud-search/docs/guides/delegation) (retrieved 2026-10-09)
- [Assign access levels to third-party apps | Google Workspace Admin Help](https://knowledge.workspace.google.com/admin/security/assign-access-levels-to-third-party-apps) (retrieved 2026-10-09)
- [Token types | Google Cloud Authentication](https://docs.cloud.google.com/docs/authentication/token-types) (retrieved 2026-10-09)
- [Using OAuth 2.0 to Access Google APIs](https://developers.google.com/identity/protocols/oauth2) (retrieved 2026-10-09)
- [Assign access levels to third-party apps](https://support.google.com/a/answer/16215019?hl=en) (retrieved 2026-10-14)
- [Control which apps access Google Workspace data](https://support.google.com/a/answer/7281227?hl=en) (retrieved 2026-10-14)
- [Identify and secure compromised accounts](https://knowledge.workspace.google.com/admin/support/troubleshooting/identify-and-secure-compromised-accounts) (retrieved 2026-10-14)
- [How authorized access works](https://support.google.com/a/answer/2538798?hl=en) (retrieved 2026-10-14)
- [Assign Context-Aware Access levels to apps](https://knowledge.workspace.google.com/admin/security/assign-context-aware-access-levels-to-apps?hl=en) (retrieved 2026-10-14)
- [OAuth log events](https://support.google.com/a/answer/6124308?hl=en) (retrieved 2026-10-14)
- [Reports API: OAuth Token audit activity events](https://developers.google.com/workspace/admin/reports/v1/appendix/activity/token) (retrieved 2026-10-12)
- [Method: activities.list](https://developers.google.com/workspace/admin/reports/reference/rest/v1/activities/list) (retrieved 2026-10-12)
- [Gmail activity events | Admin SDK Reports API](https://developers.google.com/workspace/admin/reports/v1/appendix/activity/gmail) (retrieved 2026-10-12)
- [Gmail log events](https://knowledge.workspace.google.com/admin/reports/gmail-log-events?hl=en) (retrieved 2026-10-14)
- [Suspend a user temporarily](https://support.google.com/a/answer/33312?hl=en) (retrieved 2026-10-14)
- [Directory API: User Accounts](https://developers.google.com/workspace/admin/directory/v1/guides/manage-users) (retrieved 2026-10-14)
- [Data retention and lag times](https://knowledge.workspace.google.com/admin/reports/data-retention-and-lag-times) (retrieved 2026-10-12)
- [Method: tokens.delete](https://developers.google.com/workspace/admin/directory/reference/rest/v1/tokens/delete) (retrieved 2026-10-12)
- [Using OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server) (retrieved 2026-10-12)
- [Supported secret scanning patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns) (retrieved 2026-10-12)
- [OpenID Connect | Google Identity](https://developers.google.com/identity/openid-connect/openid-connect) (retrieved 2026-10-12)
- [Users.getProfile | Gmail API](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users/getProfile) (retrieved 2026-10-12)
- [Users.messages.list | Gmail API](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list) (retrieved 2026-10-12)
- [Usage limits | Gmail API](https://developers.google.com/workspace/gmail/api/reference/quota) (retrieved 2026-10-12)
- [Control which apps access Google Workspace data](https://knowledge.workspace.google.com/admin/apps/control-which-apps-access-google-workspace-data) (retrieved 2026-10-13)
- [Context-aware access policies for first and third party applications (Workspace APIs)](https://workspaceupdates.googleblog.com/2023/08/context-aware-access-policies-for-first-and-third-party-applications-workspace-apis.html) (retrieved 2026-10-13)
- [Set session length for Google Cloud services](https://knowledge.workspace.google.com/admin/security/set-session-length-for-google-cloud-services) (retrieved 2026-10-13)
