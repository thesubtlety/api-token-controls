# 1Password: Events API bearer token (Events Reporting)

`onepassword-4` · Signed JWT · service. JWT bearer token issued from an Events Reporting integration, scoped to auditevents, itemusages and/or signinattempts. Read-only access to account activity.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | 1Password.com Integrations > (Events Reporting integration) > Tokens section lists each token, its events and expiry. | 1Password.com Integrations > (Events Reporting integration) > Tokens section lists each token, its events and expiry. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No IP restriction for Events API tokens documented. |  |
| Protect: Expires automatically | Yes | Default Never; optional 30/90/180 days | Expires After (Events token): Integrations > [Events Reporting] > Add a token |
| Detect: Usage appears in logs | Yes | uuid | Integrations page: Shows tokens, scopes, expiry |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Docs say SIEM stops ingesting after revoke. |  |
| Respond: Stops working when user is removed | N/A | Tokens belong to an Events Reporting integration, not to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Events to Report** (Limit scope; Business; default varies). Limits a token to sign-in attempts, item usages and/or audit events. Where: Integrations > [Events Reporting] > Add a token.
- **Expires After (Events token)** (Limit lifetime; Business; default off). Optional 30/90/180-day expiry; default Never. Where: Integrations > [Events Reporting] > Add a token.
- **Events Reporting setup restricted to owners and administrators** (Other; Business; default on). Only owners or administrators can set up an Events Reporting integration and get its tokens. Where: Integrations > Events Reporting.

- Network: unknown (checked at unknown). No IP restriction for Events API tokens documented.
- Lifetime: Default Never; optional 30/90/180 days. Renewal: Add a token, update SIEM, revoke old.
- Keyless option: not_applicable. Static bearer token.
- Conditions: 1Password Business.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Integrations page: Shows tokens, scopes, expiry

### Fields that identify the credential
- `uuid` (GET /api/v2/auth/introspect response): Token identifier

### Lifecycle events
No docs found.

### Correlate on
`token uuid`

### API calls a holder can make, and whether they are logged
- recon: `GET /api/v2/auth/introspect`. Token uuid, features, account_uuid Logged: unknown. 
- collection (bulk): `POST /api/v2/auditevents`. Account audit trail Logged: unknown. 
- collection (bulk): `POST /api/v2/itemusages`. Who used which items, IPs Logged: unknown. 
- collection (bulk): `POST /api/v2/signinattempts`. Sign-ins with IPs, emails Logged: unknown. 

### What to look for (analyst guidance)
- Unexpected new token on an Events Reporting integration
- Token with Never expiry and all features

## Respond: how to revoke it
- Admin: **Revoke (Events token)**. Revokes an Events API bearer token. Where: Integrations > [Events Reporting] > gear > Revoke.

Integrations > Events Reporting integration > gear > Revoke. Live access ends on revocation: unknown. Docs say SIEM stops ingesting after revoke.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Whether token issue/revoke or reads are audit-logged
- Whether Business firewall rules apply to service account, Connect, Events API or Users API requests.
- Whether Unlock with SSO / IdP policies affect service accounts (service_account_sso_denied is undocumented).
- Whether audit log records Connect token, Events API token, SCIM credential regeneration or OAuth application create/revoke (only service account and satoken events are listed).
- Whether Events API, Users API or SCIM calls themselves are logged anywhere customer-visible.
- Whether a revoked Connect token or regenerated SCIM token stops working immediately.
- Maximum value for service account --expires-in.
- Whether the itemusages Events API feed includes service account item access (usage reports do).

## Sources
- [Events API Authorization](https://www.1password.dev/events-api/authorization) (retrieved 2026-10-14)
- [1Password Events API reference](https://www.1password.dev/events-api/reference) (retrieved 2026-10-14)
- [Get started with the 1Password Events API](https://www.1password.dev/events-api/get-started) (retrieved 2026-10-14)
- [Get started with 1Password Events Reporting](https://support.1password.com/events-reporting/) (retrieved 2026-10-14)
