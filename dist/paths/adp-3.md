# ADP: Marketplace Partner API / Data Connector credentials (partner-level)

`adp-3` · OAuth · service. The partner's own client ID/secret from the Self Service portal, used with the partner mTLS certificate to get a token that can read client credentials for every consented subscriber.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | The partner sees its projects and credentials in the Partner Self Service Portal; the subscribing client has no view of partner-level credentials. | Where: (Partner) Self Service Portal > Projects > {project} > Development API Credentials |
| Protect: Admin can block or require approval | Yes | Client consent before subscriber credentials are released | Where: (Client) adpapps.adp.com/consent-manager > Pending Consents > Manage > Deny |
| Protect: SSO and MFA rules apply | Not available | Partner-level credentials authenticate an application, with no end-user authentication. |  |
| Protect: IP restriction | Conditional | ADP may tie tokens to the IP used at authorization; no allowlist documented for partner or client. |  |
| Protect: Expires automatically | Yes | Access token 60 min; certificate 2 years | Where: (Partner) Self Service Portal > Certificate > Request Certificate > Check Status > note Expiration Date; token lifetime per registration (default 60 min) |
| Detect: Usage appears in logs | No docs found | No log source found. |  |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | Yes | Client side: revoking consent in Consent Manager turns the integration off instantly. Partner credential reset timing not documented. | Where: (Client) adpapps.adp.com/consent-manager > Allowed Consents > Deny > I'm Sure |
| Respond: Stops working when user is removed | N/A | ADP issues one set of credentials per application, not per user. |  |

## Protect: what an admin can configure

### Admin controls
- **Mutual TLS certificate** (Other; all plans; default on). Every token and API request must present the registered X.509 certificate, so a leaked secret alone is not enough. Where: API Central / Self Service portal > Certificate.
- **Shorter access token lifetime at registration** (Limit lifetime; all plans; default off). A shorter token expiry can be requested during application registration. Where: Request to ADP during registration.
- **Client consent before subscriber credentials are released** (Require approval; all plans; default on). The partner gets a client's Client ID and Secret only after that client consents to the partner solution. Where: Consent Manager (client) / Partner credential workflow.

- Network: conditional (checked at unknown). ADP may tie tokens to the IP used at authorization; no allowlist documented for partner or client.
- Lifetime: Access token 60 min; certificate 2 years. Renewal: Partner re-requests tokens.
- Keyless option: not_applicable. Held by the partner, not by the customer tenant.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
No docs found.

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`partner client_id`

### API calls a holder can make, and whether they are logged
- discovery: `POST /events/core/v1/consumer-application-subscription-credentials.read`. Client ID and secret for a consented subscriber (by OOID) Logged: unknown. 

### What to look for (analyst guidance)
- Partner credential compromise exposes every consented client; customers cannot see it directly

## Respond: how to revoke it


Customer: deny consent / cancel subscription. Partner: reset credentials in Self Service portal. Live access ends on revocation: yes. Client side: revoking consent in Consent Manager turns the integration off instantly. Partner credential reset timing not documented.

## No vendor documentation found
- Usage appears in logs
- Data reads appear in logs
- Partner-side secret reset procedure details
- Whether a customer-configurable IP allowlist exists for API Central credentials (docs only say tokens 'may be' tied to an IP).
- Whether credential reset or consent denial revokes already-issued access tokens immediately.
- What audit/log records exist for credential creation, reset, token issuance and API calls, and how clients access them.
- Whether API Central certificates can be revoked by the client before expiry.
- Whether consumer-application-subscription-credentials.read returns the same or new secrets after re-consent.

## Sources
- [Introduction to Credentials](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/Introduction_to_Credentials) (retrieved 2026-10-14)
- [How to retrieve Client Credentials of a Subscriber](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/How_to_retrieve_Client_Credentials_of_a_Subscriber) (retrieved 2026-10-14)
- [Generating a Certificate Signing Request for Partners - Chapter 2](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/Generating_a_Certificate_Signing_Request_for_Partners_chapter_2) (retrieved 2026-10-14)
- [Access Tokens (ADP Developer Resources)](https://developers.adp.com/api/services/elasticsearch/general/_doc/access-tokens) (retrieved 2026-10-14)
- [ADP Marketplace ESI - Getting started (modified Jun 17, 2026)](https://marketplace-cdn.adp.com/dev-portal/pdf/ADP_Marketplace_ESI_-_Getting_started) (retrieved 2026-10-14)
- [ADP Marketplace Partner Development Learning Guide - Chapter 2](https://marketplace-cdn.adp.com/dev-portal/pdf/ADP_Marketplace_Partner_Development_Learning_Guide_chapter_2) (retrieved 2026-10-14)
- [Handling Consent Guide - Chapter 1](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/Handling_Consent_chapter_1) (retrieved 2026-10-14)
- [Application Types (ADP Developer Resources)](https://developers.adp.com/api/services/elasticsearch/general/_doc/application-types) (retrieved 2026-10-14)
- [Partner Development Learning Guide](https://developers.adp.com/api/services/elasticsearch/guides/_doc/partner-development-learning-guide) (retrieved 2026-10-14)
- [ADP Marketplace Partner Development Learning Guide](https://developers.adp.com/getting-started/getting-started-as-a-partner/guides/adp-marketplace-integration-guides/partner-development-learning-guide) (retrieved 2026-10-14)
- [Marketplace Integrations for Benefit Carriers - Chapter 5](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/Marketplace_Integrations_for_Benefit_Carriers_chapter_5) (retrieved 2026-10-14)
- [Using Consent Manager to Control Access to Your Data](https://marketplace-cdn.adp.com/dev-portal/pdf/Using_Consent_Manager_to_Control_Access_to_Your_Data) (retrieved 2026-10-14)
- [Access Tokens](https://developers.adp.com/getting-started/key-concepts/access-tokens) (retrieved 2026-10-14)
- [Data Connector Application Access Control Guide for ADP Workforce Now](https://developers.adp.com/api/services/elasticsearch/general/_doc/data-connector-application-access-control-guide-for-adp-workforce-now) (retrieved 2026-10-14)
