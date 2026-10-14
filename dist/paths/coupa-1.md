# Coupa: OAuth2/OpenID Connect Client - Client Credentials grant

`coupa-1` · OAuth · service. An integrations-enabled admin creates an OAuth2/OIDC client with scopes. The integration posts client_id, client_secret and scopes to /oauth2/token and gets a 24-hour JWT access token.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | The OpenIDConnect Clients table at Setup > Integrations > Oauth2/OpenID Connect Clients lists clients. | The OpenIDConnect Clients table at Setup > Integrations > Oauth2/OpenID Connect Clients lists clients. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Per-client IP Whitelisting; requests from other IPs get 403. Off unless configured. | IP Whitelisting: OAuth/OIDC Client Configuration > IP Whitelisting |
| Protect: Expires automatically | Yes | Access token 24h; client secret has no documented expiry | API: Fixed 24h; read expires_in in the POST https://{instance}/oauth2/token response |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | API telemetry: Collected automatically for OAuth client requests; AWS non-GovCloud/FedRAMP/HIPAA only; customer access not documented. · Integration History Records / Integration Runs: Populated only if the integration writes them. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Tokens are 24h JWTs. |  |
| Respond: Stops working when user is removed | N/A | Client credentials clients are used when no user is involved. |  |

## Protect: what an admin can configure

### Admin controls
- **Scopes** (Limit scope; all plans; default varies). Each client gets only the service.object.right scopes assigned. Where: Client create/edit page; /oauth2/scopes.
- **IP Whitelisting** (Limit network; all plans; default off). Rejects API requests from IPs or CIDRs not on the client's allowlist (403). Where: OAuth/OIDC Client Configuration > IP Whitelisting.
- **Account Groups / Business Groups data access restrictions** (Limit resources; all plans; default off). Limits a client-credentials client to transactional data in chosen account groups and master data in chosen business groups. Where: OAuth/OIDC Client Configuration > Account Groups / Business Groups.
- **Client Purpose** (Other; all plans; default on). Mandatory field recording whether the client is internal, third-party or marketplace. Where: OAuth/OIDC Client Configuration > Client Purpose.

- Network: supported (checked at api_request). Per-client IP Whitelisting; requests from other IPs get 403. Off unless configured.
- Lifetime: Access token 24h; client secret has no documented expiry. Renewal: Integration requests a new token with the secret, recommended every 20 hours.
- Keyless option: not_verified. No user involved; docs do not discuss SSO or IdP conditional access for these tokens.
- Conditions: Requires integrations-enabled admin.

## Detect: what gets logged
- Token prefix: not established

### Logs
- API telemetry: Collected automatically for OAuth client requests; AWS non-GovCloud/FedRAMP/HIPAA only; customer access not documented.
- Integration History Records / Integration Runs: Populated only if the integration writes them.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`client Identifier`, `source IP`

### API calls a holder can make, and whether they are logged
- enumeration (bulk): `GET /api/users`. User records (first 50 per page) Logged: unknown. API telemetry captures OAuth requests; customer visibility unclear.
- collection (bulk): `GET /api/invoices`. Invoice data Logged: unknown. 

### What to look for (analyst guidance)
- New clients with all scopes
- Client Purpose set to Third-Party for unknown providers
- Clients without IP Whitelisting or group restrictions

## Respond: how to revoke it
- Admin: **Deactivate OAuth2/OpenID Connect client**. Deactivate an individual client. Where: Setup > Integrations > Oauth2/OpenID Connect Clients.

Deactivate the client in Setup > Integrations > Oauth2/OpenID Connect Clients; add IP Whitelisting. Live access ends on revocation: unknown. Tokens are 24h JWTs.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Data reads appear in logs
- Revocation ends active access
- Audit event names
- Which user/actor records show for client-credentials writes
- No documented whoami endpoint
- Whether deactivating a client invalidates already-issued 24h JWT access tokens.
- Whether client secrets can be rotated without recreating the client, and whether they expire.
- Admin audit log events for OAuth client creation, edits, secret views or deactivation.
- Whether customers can view the API telemetry data (docs describe 'internal reporting').
- Whether Coupa SAML SSO settings affect OAuth token use or API key use.
- Whether any legacy API keys still authenticate on current releases.

## Sources
- [Set Up an OpenID Connect Client](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/oauth-2.0-and-oidc/set-up-an-openid-connect-client) (retrieved 2026-10-14)
- [OpenID Connect Clients](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/oauth-2.0-and-oidc/openid-connect-clients) (retrieved 2026-10-14)
- [OAuth 2.0 Getting Started with Coupa API (Revised 25 February 2026)](https://compass.coupa.com/en-us/products/total-spend-management-platform/integration-playbooks-and-resources/integration-knowledge-articles/oauth-2.0-getting-started-with-coupa-api) (retrieved 2026-10-14)
- [OAuth 2.0 and OIDC (Coupa Documentation)](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/oauth-2.0-and-oidc) (retrieved 2026-10-14)
- [Coupa REST API Integration (Revised 21 February 2020)](https://compass.coupa.com/en-us/products/total-spend-management-platform/integration-playbooks-and-resources/other-integration-playbooks/erp-integration-adapters/build-your-integration/integration-methods/coupa-rest-api-integration) (retrieved 2026-10-14)
- [Get Started with the API](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/get-started-with-the-api) (retrieved 2026-10-14)
- [Exception Handling and Error Codes](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/get-started-with-the-api/exception-handling-and-error-codes) (retrieved 2026-10-14)
- [Set Up Okta User Provisioning with OAuth 2.0](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/oauth-2.0-and-oidc/set-up-okta-user-provisioning-with-oauth-2.0) (retrieved 2026-10-14)
