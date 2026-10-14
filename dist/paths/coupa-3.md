# Coupa: API Key (legacy, X-COUPA-API-KEY)

`coupa-3` · API key / token · service. A 40-character key sent in the X-COUPA-API-KEY header. Tied to an API user equivalent to an admin. Deprecated; unsupported from R35.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Keys are managed and revoked under Setup > API Keys. | Keys are managed and revoked under Setup > API Keys. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No IP control documented for API keys. |  |
| Protect: Expires automatically | Partial | Never expires unless an expiry date is set | API key expiration date: Setup > Integrations > API Keys |
| Detect: Usage appears in logs | Yes | contact first name / last name | Object Integration History: Key contact first/last name appears on the object's integration history when the key is used. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Yes | Static key; revocation removes its API access. | Edit the key under Setup > Integrations > API Keys and use Revoke API Key. |
| Respond: Stops working when user is removed | N/A | The key belongs to a dedicated API user, not a person's account. |  |

## Protect: what an admin can configure

### Admin controls
- **API key expiration date** (Limit lifetime; all plans; default off). Optional date after which the key stops working (midnight UTC). Where: Setup > Integrations > API Keys.
- **API key Enable Permissions** (Limit scope; all plans; default off). Restricts the key to selected APIs; unchecked allows all Coupa APIs. Where: Setup > Integrations > API Keys.

- Network: unknown (checked at unknown). No IP control documented for API keys.
- Lifetime: Never expires unless an expiry date is set. Renewal: Same key reused; can be regenerated.
- Keyless option: not_verified. Static header key; docs do not address SSO.
- Conditions: New keys no longer issued; existing keys should be revoked.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Object Integration History: Key contact first/last name appears on the object's integration history when the key is used.

### Fields that identify the credential
- `contact first name / last name` (Integration History): Set when the key is created.

### Lifecycle events
No docs found.

### Correlate on
`API key contact name`, `API user`

### API calls a holder can make, and whether they are logged
- collection (bulk): `GET /api/users (X-COUPA-API-KEY)`. User records; key acts as admin-equivalent API user Logged: unknown. Reads are not documented as logged; writes are attributed to the API user.

### What to look for (analyst guidance)
- Any remaining active API key after OAuth migration
- Keys with no expiry and no permissions set

## Respond: how to revoke it
- Admin: **Revoke API Key**. Revokes the access and API permissions granted by the key. Where: Setup > Integrations > API Keys > edit key.

Edit the key under Setup > Integrations > API Keys and use Revoke API Key. Live access ends on revocation: yes. Static key; revocation removes its API access.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Data reads appear in logs
- Audit events for key revoke/regenerate
- Whether deactivating a client invalidates already-issued 24h JWT access tokens.
- Whether client secrets can be rotated without recreating the client, and whether they expire.
- Admin audit log events for OAuth client creation, edits, secret views or deactivation.
- Whether customers can view the API telemetry data (docs describe 'internal reporting').
- Whether Coupa SAML SSO settings affect OAuth token use or API key use.
- Whether any legacy API keys still authenticate on current releases.

## Sources
- [Coupa REST API Integration (Revised 21 February 2020)](https://compass.coupa.com/en-us/products/total-spend-management-platform/integration-playbooks-and-resources/other-integration-playbooks/erp-integration-adapters/build-your-integration/integration-methods/coupa-rest-api-integration) (retrieved 2026-10-14)
- [OAuth 2.0 and OIDC (Coupa Documentation)](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/oauth-2.0-and-oidc) (retrieved 2026-10-14)
- [Häufig gestellte Fragen zur Deprecation von API-Schlüsseln (German)](https://compass.coupa.com/de-de/products/product-documentation/integration-technical-documentation/the-coupa-core-api/oauth-2.0-and-oidc/api-key-deprecation-faq) (retrieved 2026-10-14)
- [Sécurité de clé API (Coupa Compass, French, modified 14 January 2022)](https://compass.coupa.com/fr-fr/products/product-documentation/integration-docs/the-coupa-core-api/get-started-with-the-api/api-key-security) (retrieved 2026-10-14)
- [Get Started with the API](https://docs.coupa.com/en/developer-documentation/the-coupa-core-api/get-started-with-the-api) (retrieved 2026-10-14)
