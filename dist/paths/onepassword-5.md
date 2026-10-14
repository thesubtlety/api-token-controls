# 1Password: Users API OAuth application (client credentials)

`onepassword-5` · OAuth · service. An OAuth application's client ID/secret is exchanged at POST /v1/oauth/token for a 15-minute opaque bearer token scoped to users.view, users.suspend and/or users.reactivate.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | 1Password.com Integrations page shows active OAuth Applications. | 1Password.com Integrations page shows active OAuth Applications. |
| Protect: Admin can block or require approval | Yes (requires Business or Enterprise Password Manager) | Permissions to manage integrations | Permissions to manage integrations: Integrations > Directory > OAuth Application |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No IP restriction for OAuth apps documented. |  |
| Protect: Expires automatically | Yes | Access token 15 min; client secret no stated expiry | Rotate the client secret: Integrations > [OAuth Application] |
| Detect: Usage appears in logs | Yes | client_id | Where: 1Password.com > Audit Log > Try new audit log; look for actor 'Oauth app' (user.suspend, user.reactivate) · API: GET /api/v3/auditevents (Events API beta; filter results on actor and action user.suspend / user.reactivate) |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | Yes | Revoke integration revokes all access tokens. | Integrations > OAuth Application > Revoke integration (kills all tokens), or POST /v1/oauth/revoke per token. |
| Respond: Stops working when user is removed | N/A | Client credentials belong to an OAuth application integration, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **OAuth application scopes** (Limit scope; Business or Enterprise Password Manager; default varies). Scopes users.view, users.suspend, users.reactivate chosen at creation and fixed. Where: Integrations > OAuth Application > Scopes.
- **Rotate the client secret** (Require rotation; Business or Enterprise Password Manager; default unknown). New client secret; old secret stays valid 6 hours. Where: Integrations > [OAuth Application].
- **Permissions to manage integrations** (Disable; Business or Enterprise Password Manager; default on). Only owners, administrators, or Security group members with permission to manage integrations can create a Users API OAuth application. Where: Integrations > Directory > OAuth Application.

### Not available (vendor states)
- Revoking an access token only via revoke endpoint or integration revoke; deleting the client on your platform leaves issued tokens valid until expiry.

- Network: unknown (checked at unknown). No IP restriction for OAuth apps documented.
- Lifetime: Access token 15 min; client secret no stated expiry. Renewal: Secret rotation keeps the old secret valid 6 hours.
- Keyless option: not_applicable. Client credentials grant only; no workload identity federation documented.
- Conditions: Business or Enterprise Password Manager, not Teams; not supported with automated provisioning.

## Detect: what gets logged
- Token prefix: `op_o_c_`

### Logs
- Audit log (Users: suspend/reactivate): Business; resulting user state changes

### Fields that identify the credential
- `client_id` (OAuth introspect): Introspect only for own app's tokens

### Lifecycle events
No docs found.

### Correlate on
`client_id`

### API calls a holder can make, and whether they are logged
- recon: `POST /v1/oauth/introspect`. Token active, scopes, expiry Logged: unknown. 
- enumeration (bulk): `GET /v1/accounts/{account_id}/users`. User emails, names, state Logged: unknown. 

### What to look for (analyst guidance)
- Unexpected user suspensions
- Token requests near rate limits

## Respond: how to revoke it
- Admin: **Revoke integration**. Revokes the OAuth app, its client credentials and every access token issued to it. Where: Integrations > [OAuth Application] > Revoke integration.
- Admin: **POST /v1/oauth/revoke**. Revokes a single access token before expiry. Where: API: POST /v1/oauth/revoke.

Integrations > OAuth Application > Revoke integration (kills all tokens), or POST /v1/oauth/revoke per token. Live access ends on revocation: yes. Revoke integration revokes all access tokens.

## No vendor documentation found
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Audit events for OAuth app create/rotate/revoke
- Whether Users API reads are logged
- Whether Business firewall rules apply to service account, Connect, Events API or Users API requests.
- Whether Unlock with SSO / IdP policies affect service accounts (service_account_sso_denied is undocumented).
- Whether audit log records Connect token, Events API token, SCIM credential regeneration or OAuth application create/revoke (only service account and satoken events are listed).
- Whether Events API, Users API or SCIM calls themselves are logged anywhere customer-visible.
- Whether a revoked Connect token or regenerated SCIM token stops working immediately.
- Maximum value for service account --expires-in.
- Whether the itemusages Events API feed includes service account item access (usage reports do).

## Sources
- [Users API: Authorize your integrations using OAuth 2.0](https://www.1password.dev/users-api/authorization) (retrieved 2026-10-14)
- [Get started with the 1Password Users API](https://www.1password.dev/users-api/get-started) (retrieved 2026-10-14)
- [Revoke an access token](https://www.1password.dev/users-api/revoke-access-token) (retrieved 2026-10-14)
- [1Password Users API](https://www.1password.dev/users-api) (retrieved 2026-10-14)
- [Users API conventions](https://www.1password.dev/users-api/conventions) (retrieved 2026-10-14)
- [Use the audit log in 1Password Business (beta)](https://support.1password.com/audit-log/) (retrieved 2026-10-14)
- [Get audit events (v3, beta)](https://www.1password.dev/events-api/beta/reference/get-v3-auditevents) (retrieved 2026-10-14)
- [Introspect an access token](https://www.1password.dev/users-api/introspect-access-token) (retrieved 2026-10-14)
