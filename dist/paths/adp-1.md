# ADP: API Central project client credentials (client ID/secret + mutual TLS certificate)

`adp-1` · OAuth · service. Starting an API Central project generates a client ID and secret. The app posts them with grant_type=client_credentials to accounts.adp.com over mTLS using its ADP-signed certificate, then calls api.adp.com with the bearer token and the same certificate.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | API Central Projects page shows project cards; docs describe it as the projects you create, not an org-wide credential list. | API Central Projects page shows project cards; docs describe it as the projects you create, not an org-wide credential list. |
| Protect: Admin can block or require approval | Yes (requires API Central add-on) | Project users role (API Central Members page) | Project users role (API Central Members page): API Central > Members > assign roles |
| Protect: SSO and MFA rules apply | Not available | API Central projects are data connectors; the API actor is a client agent that is not authenticated as a user, so user SSO/MFA does not apply. |  |
| Protect: IP restriction | Conditional | ADP may tie tokens to the computing environment (e.g. IP) used at authorization; this is ADP-side, not a customer-configurable allowlist. |  |
| Protect: Expires automatically | Yes | Access token 60 min; secret static until reset; certificate 2 years | Where: API Central > Certificate > Certificate management card shows expiration date; shorter token lifetime only by request at registration |
| Detect: Usage appears in logs | No docs found | No log source found. |  |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Tokens last up to 60 minutes. |  |
| Respond: Stops working when user is removed | N/A | The API actor is a pre-assigned system (non-human) user, not the person who created the project. |  |

## Protect: what an admin can configure

### Admin controls
- **Team Access Management** (Limit scope; ADP API Central; default varies). Roles control who can view API credentials and manage certificates; admins can revoke portal access. Where: API Central portal > Members.
- **Project APIs / use case (API discovery tool)** (Limit scope; ADP API Central; default varies). A project's credentials reach only the APIs added to that project. Where: API Central portal > project > add APIs.
- **Mutual TLS certificate** (Other; all plans; default on). Every token and API request must present the registered X.509 certificate, so a leaked secret alone is not enough. Where: API Central / Self Service portal > Certificate.
- **Shorter access token lifetime at registration** (Limit lifetime; all plans; default off). A shorter token expiry can be requested during application registration. Where: Request to ADP during registration.
- **Project users role (API Central Members page)** (Disable; API Central add-on; default unknown). Only members assigned the Project users role can create projects and access API credentials; withholding the role blocks credential creation. Where: API Central > Members > assign roles.

- Network: conditional (checked at unknown). ADP may tie tokens to the computing environment (e.g. IP) used at authorization; this is ADP-side, not a customer-configurable allowlist.
- Lifetime: Access token 60 min; secret static until reset; certificate 2 years. Renewal: App requests a new token with the secret and certificate; certificate renewed via new CSR.
- Keyless option: not_verified. No user sign-in is involved; docs do not discuss SSO or conditional access for API calls.
- Conditions: Requires API Central subscription.

## Detect: what gets logged
- Token prefix: not established

### Logs
No docs found.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`client_id`, `certificate common name`

### API calls a holder can make, and whether they are logged
- recon: `POST https://accounts.adp.com/auth/oauth/v2/token (grant_type=client_credentials, mTLS)`. Valid token and expires_in Logged: unknown. 
- collection (bulk): `GET /hr/v2/workers?$top=&$skip=`. All workers in the org (paged) Logged: unknown. No customer-facing API log documented.

### What to look for (analyst guidance)
- New certificate requested/uploaded in API Central
- New team member with Project user role
- High-volume /hr/v2/workers pagination

## Respond: how to revoke it
- Admin: **Credential reset (API Central)**. Reset the project's client credentials at any time. Where: API Central portal > project > credentials.

Reset project credentials in API Central; replace the certificate; remove portal members. Live access ends on revocation: unknown. Tokens last up to 60 minutes.

## No vendor documentation found
- Usage appears in logs
- Data reads appear in logs
- Revocation ends active access
- Any customer-visible API or audit log
- No documented whoami endpoint
- Whether a customer-configurable IP allowlist exists for API Central credentials (docs only say tokens 'may be' tied to an IP).
- Whether credential reset or consent denial revokes already-issued access tokens immediately.
- What audit/log records exist for credential creation, reset, token issuance and API calls, and how clients access them.
- Whether API Central certificates can be revoked by the client before expiry.
- Whether consumer-application-subscription-credentials.read returns the same or new secrets after re-consent.

## Sources
- [ADP API Central for ADP Workforce Now - Features](https://apps.adp.com/en-US/apps/410612/adp-api-central-for-adp-workforce-now-and-adp-workforce-now-next-generation/features) (retrieved 2026-10-14)
- [ADP Marketplace ESI - Getting started (modified Jun 17, 2026)](https://marketplace-cdn.adp.com/dev-portal/pdf/ADP_Marketplace_ESI_-_Getting_started) (retrieved 2026-10-14)
- [ADP Marketplace Partner Development Learning Guide - Chapter 2](https://marketplace-cdn.adp.com/dev-portal/pdf/ADP_Marketplace_Partner_Development_Learning_Guide_chapter_2) (retrieved 2026-10-14)
- [Access Tokens (ADP Developer Resources)](https://developers.adp.com/api/services/elasticsearch/general/_doc/access-tokens) (retrieved 2026-10-14)
- [API Central Quick Start Guide (International)](https://developers.adp.com/api/services/elasticsearch/guides/_doc/api-central-quick-start-guide-international) (retrieved 2026-10-14)
- [Application Types (ADP Developer Resources)](https://developers.adp.com/api/services/elasticsearch/general/_doc/application-types) (retrieved 2026-10-14)
- [API Central Quick Start Guide, Ch. 4: How to manage Certificates in API-Central (PDF, modified Sep 28, 2026)](https://marketplace-cdn.adp.com/dev-portal/pdf/API_Central_Quick_Start_Guide_chapter_4) (retrieved 2026-10-14)
- [Access Tokens](https://developers.adp.com/getting-started/key-concepts/access-tokens) (retrieved 2026-10-14)
- [Marketplace Integrations for Benefit Carriers - Chapter 5](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/Marketplace_Integrations_for_Benefit_Carriers_chapter_5) (retrieved 2026-10-14)
