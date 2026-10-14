# Okta (management API): OAuth service app

`okta-2` · OAuth · service. SSWS API tokens; scoped OAuth bearer. Service apps use client credentials authenticated with private_key_jwt.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /api/v1/apps lists all apps in the org, including service apps (filterable); the API does not list issued access tokens. | GET /api/v1/apps lists all apps in the org, including service apps (filterable); the API does not list issued access tokens. |
| Protect: Admin can block or require approval | Yes | Super Admin-only grant of Okta API scopes | Super Admin-only grant of Okta API scopes: Applications > app > Okta API Scopes |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Per-client allowlist/denylist network zone is checked at the OIDC token endpoint. Docs do not say whether already-issued access tokens are re-checked on API calls. | Where: Applications > Applications > (service app) > General > Network IP > Edit > In any of the following zones · API: PUT /api/v1/apps/{appId} with settings.oauthClient.network {connection: ZONE, include: [zoneIds]} |
| Protect: Expires automatically | Yes | Fixed 1 hour | API: POST /oauth2/v1/token response field expires_in (3600; fixed, not configurable) |
| Detect: Usage appears in logs | Yes | client.id, actor.id, authenticationContext.credentialType, target | Okta System Log (Admin Console / GET /api/v1/logs): Records admin/API actions with token or client context; 90-day retention; export to SIEM or Log Streaming for longer. |
| Detect: Data reads appear in logs | Not available | GET not in System Log. |  |
| Respond: Revocation ends active access | Partial | Revoking keys stops new tokens. 'Revoke all application tokens' only covers refresh-token-derived access tokens; client-credentials access tokens are not affected and live up to 1 hour. Effect of app deactivation on issued tokens not documented. | Deactivate the attacker's JWK/secret (POST /api/v1/apps/{appId}/credentials/jwks/{keyId}/lifecycle/deactivate or .../secrets/{secretId}/lifecycle/deactivate) or deactivate the app (/api/v1/apps/{appId}/lifecycle/deactivate). Remove granted okta.* scopes and admin roles. |
| Respond: Stops working when user is removed | N/A | Service apps use the Client Credentials flow with no end user, so the credential is not tied to a user account. |  |

## Protect: what an admin can configure

### Admin controls
- **Grant Okta API scopes** (Limit scope; all plans; default off). A service app only gets Okta API scopes that a super admin has granted on its Okta API Scopes tab. Where: Admin Console > Applications > [service app] > Okta API Scopes > Grant; or /grants API.
- **Assign admin roles to the service app** (Limit resources; all plans; default varies). Admin roles (and their resource sets) assigned to the service app constrain what its scoped tokens can do. Where: Admin Console > Applications > [service app] > Admin roles.
- **Public client app admins (org setting)** (Other; all plans; default unknown). When enabled, service apps automatically get the super admin role after scopes are granted; leaving it off forces explicit least-privilege role assignment. Where: Admin Console > Settings > Account > Public client app admins.
- **Require Demonstrating Proof of Possession (DPoP) header in token requests** (Other; all plans; default off). Makes the org authorization server issue DPoP-bound (sender-constrained) access tokens to the app. Where: App > General settings checkbox, or API settings.oauthClient.dpop_bound_access_tokens: true.
- **Super Admin-only grant of Okta API scopes** (Require approval; all plans; default on). A service app gets no Okta API scopes until a Super Admin grants them on the Okta API Scopes tab. Where: Applications > app > Okta API Scopes.
- **Network zone restrictions for clients** (Limit network; all plans; default off). Sets an allowlist or denylist network zone per client, enforced at the OIDC token endpoint. Where: Per-client network zone setting (GA in Production 2025.11.0).

### Not available (vendor states)
- Cannot change the access-token lifetime for Okta-scoped service app tokens.

- Network: supported (checked at token_issuance). Per-client allowlist/denylist network zone is checked at the OIDC token endpoint. Docs do not say whether already-issued access tokens are re-checked on API calls.
- Lifetime: Fixed 1 hour. Renewal: Request a new access token using the service app private key. The signing-key lifecycle is separate.
- Keyless option: not_verified. Private-key OAuth service apps are documented. Do not infer management-API federation from custom authorization-server token exchange or XAA.
- Conditions: Org authorization-server rules govern Okta APIs. Custom authorization-server lifetime policies do not govern these tokens.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Okta System Log (Admin Console / GET /api/v1/logs): Records admin/API actions with token or client context; 90-day retention; export to SIEM or Log Streaming for longer.

### Fields that identify the credential
- `client.id` (Okta System Log): For OAuth requests, ID of the OAuth client (service app client_id).
- `actor.id` (Okta System Log): Actor on token grants/admin actions; for service apps typically the client/app (type not confirmed).
- `authenticationContext.credentialType` (Okta System Log): Enum includes JWT and 'OAuth 2.0'.
- `target` (Okta System Log): Search by type (e.g. AppInstance) to find affected app in lifecycle events.

### Lifecycle events
- create: `app.oauth2.client.lifecycle.create` Create OAuth client.
- create: `app.oauth2.credentials.lifecycle.create` Client secret or JWK added/activated.
- change: `app.oauth2.credentials.lifecycle.activate` Client secret or JWK activated.
- change: `app.oauth2.client.lifecycle.update` Update OAuth client.
- change: `app.oauth2.client.read_client_secret` Someone read the client's secret(s).
- use: `app.oauth2.as.token.grant` OAuth2 token request; outcome.result FAILURE shows failed assertion.
- use: `app.oauth2.as.token.grant.access_token` Access token granted; details include client ID, scope, grant type.
- use: `app.oauth2.token.grant.access_token` OIDC access token granted (org auth server path; which one fires for OAuth-for-Okta not confirmed).
- auth_fail: `system.oauth2.token.request_outside_allowed_range` Valid bearer token used from outside allowed network zone.
- revoke: `app.oauth2.credentials.lifecycle.deactivate` Secret or JWK deactivated.
- revoke: `app.oauth2.credentials.lifecycle.delete` Secret or JWK deleted.
- revoke: `app.oauth2.client.lifecycle.deactivate` Deactivate OAuth client.
- revoke: `app.oauth2.as.token.revoke` OAuth2 token revocation request.
- revoke: `app.oauth2.token.revoke.implicit.client` Tokens revoked for client.

### Correlate on
`actor.id`, `actor.alternateId`, `client.ipAddress`, `client.userAgent.rawUserAgent`, `client.id`, `client.zone`, `securityContext.asNumber`, `securityContext.asOrg`, `request.ipChain`, `transaction.id`, `uuid`, `authenticationContext.credentialType`, `debugContext.debugData`

### API calls a holder can make, and whether they are logged
- recon: `POST /oauth2/v1/token (grant_type=client_credentials, private_key_jwt)`. Access token; response 'scope' lists granted okta.* scopes Logged: yes (`app.oauth2.token.grant.access_token`). Logged in System Log (org authorization server).
- enumeration (bulk): `GET /api/v1/users`. All users and their profiles (listUsers) Logged: no. GET not in System Log; rate-limit dashboard can show top-consuming tokens.
- discovery (bulk): `GET /api/v1/apps`. All app integrations (listApplications) Logged: no. GET not in System Log.
- enumeration (bulk): `GET /api/v1/groups`. Groups and memberships (listGroups) Logged: no. GET not in System Log.
- collection (bulk): `GET /api/v1/logs`. System Log events; lets the holder read the same telemetry defenders use (listLogEvents) Logged: no. GET not in System Log.

### Public detection rules (community, not vendor documentation)
- [Okta Rate Limits](https://github.com/panther-labs/panther-analysis/blob/develop/rules/okta_rules/okta_rate_limits.yml) (Panther): Okta rate-limit violation events, which API tokens and OAuth clients trigger when they make unusually many requests.
- [Unauthorized Scope for Public App OAuth2 Token Grant with Client Credentials](https://github.com/elastic/detection-rules/blob/main/rules/integrations/okta/defense_evasion_first_occurence_public_app_client_credential_token_exchange.toml) (Elastic): Failed client-credentials token grants by a public client app that asked for scopes it does not have (outcome reason no_matching_scope).

### What to look for (analyst guidance)
- Token grants for the client_id from an IP/ASN outside the workload's hosting range
- New okta.* scopes requested that the integration never used
- app.oauth2.credentials.lifecycle.create (new JWK/secret) not tied to a change ticket
- app.oauth2.client.read_client_secret by an unexpected admin
- Burst of failed app.oauth2.as.token.grant (forged or replayed assertions)
- Admin role assignment changes on the service app followed by high-privilege API calls

### Sample query (Okta System Log filter (/api/v1/logs filter))
Token grants and OAuth client changes for one service app from unexpected IPs.

```
eventType sw "app.oauth2" and client.id eq "0oa1abcdEXAMPLE0003" and client.ipAddress ne "203.0.113.20"
```

## Respond: how to revoke it


Deactivate the attacker's JWK/secret (POST /api/v1/apps/{appId}/credentials/jwks/{keyId}/lifecycle/deactivate or .../secrets/{secretId}/lifecycle/deactivate) or deactivate the app (/api/v1/apps/{appId}/lifecycle/deactivate). Remove granted okta.* scopes and admin roles. Live access ends on revocation: partial. Revoking keys stops new tokens. 'Revoke all application tokens' only covers refresh-token-derived access tokens; client-credentials access tokens are not affected and live up to 1 hour. Effect of app deactivation on issued tokens not documented.

## No vendor documentation found
- SSO and MFA rules apply
- actor.type value for service-app token grants
- Whether OAuth-for-Okta grants log as app.oauth2.as.* or app.oauth2.token.*
- Exact debugData key for grant type/scopes
- Whether app deactivation invalidates already-issued access tokens
- Access token format/prefix (JWT; no documented prefix)
- Per-endpoint rate limits for management GETs
- Service apps have no user; token 'scope' field, not /users/me, is the recon signal
- Whether any org-wide switch exists to disable SSWS token creation entirely (docs only show role-based limits on who can create tokens).
- Whether network zones can restrict where OAuth service apps call Okta APIs from (org authorization server policies were not confirmed).
- Default state of the Public client app admins setting.

## Sources
- [Implement OAuth for Okta with a service app](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/main/) (retrieved 2026-10-09)
- [Create an API token - Okta Developer](https://developer.okta.com/docs/guides/create-an-api-token/main/) (retrieved 2026-10-09)
- [Okta Classic Engine API release notes 2025 (2025.11.0)](https://developer.okta.com/docs/release-notes/2025/) (retrieved 2026-10-14)
- [Okta Management API OpenAPI spec (official, GitHub) - List all API token metadata](https://raw.githubusercontent.com/okta/okta-management-openapi-spec/master/dist/current/management-minimal.yaml) (retrieved 2026-10-14)
- [Create OpenID Connect app integrations](https://help.okta.com/oie/en-us/content/topics/apps/apps_app_integration_wizard_oidc.htm) (retrieved 2026-10-14)
- [Okta Management API OpenAPI spec (vendor-owned okta-sdk-java repo)](https://raw.githubusercontent.com/okta/okta-sdk-java/master/src/swagger/api.yaml) (retrieved 2026-10-12)
- [System Log query](https://developer.okta.com/docs/reference/system-log-query/) (retrieved 2026-10-12)
- [Okta Data Retention Policy](https://support.okta.com/help/s/article/Okta-Data-Retention-Policy) (retrieved 2026-10-12)
- [Okta Event Types](https://developer.okta.com/docs/reference/api/event-types/) (retrieved 2026-10-12)
- [Okta OAuth 2.0 scopes](https://developer.okta.com/docs/api/oauth2/) (retrieved 2026-10-12)
- [Okta Management API - Users](https://developer.okta.com/docs/api/openapi/okta-management/management/tag/User/) (retrieved 2026-10-12)
- [Do API calls generate events in system logs](https://support.okta.com/help/s/article/Do-API-calls-generate-events-in-system-logs) (retrieved 2026-10-12)
- [Okta management rate limits](https://developer.okta.com/docs/reference/rl-global-mgmt/) (retrieved 2026-10-12)
- [Configure OAuth 2.0 Demonstrating Proof-of-Possession | Okta Developer](https://developer.okta.com/docs/guides/dpop/oktaresourceserver/main/) (retrieved 2026-10-13)
