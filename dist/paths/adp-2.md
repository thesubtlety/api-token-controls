# ADP: Marketplace data connector client credentials (held by partner app)

`adp-2` · OAuth · service. After a client buys a Marketplace app and consents, the partner retrieves that client's client ID/secret via consumer-application-subscription-credentials.read and uses client credentials over mTLS to call the client's APIs.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Consent Manager (adpapps.adp.com/consent-manager) lists allowed and denied app consents; WFN lists each connector's System Agent User under Marketplace Data Connector Profile > Members. | Consent Manager (adpapps.adp.com/consent-manager) lists allowed and denied app consents; WFN lists each connector's System Agent User under Marketplace Data Connector Profile > Members. |
| Protect: Admin can block or require approval | Yes | Consent Manager - Allow/Deny pending request | Consent Manager - Allow/Deny pending request: Consent Manager > Pending Consents |
| Protect: SSO and MFA rules apply | Not available | Data connector API actor is a client agent that is not authenticated as a user. |  |
| Protect: IP restriction | Conditional | ADP may tie tokens to the IP used at authorization; no customer-configurable allowlist documented. |  |
| Protect: Expires automatically | Yes | Access token 60 min; credentials last while consent and subscription are active | Where: Request a shorter access-token lifetime from ADP at application registration (default 60 min) |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | Where: (Partner) ADP Marketplace > profile > Developer > Integration Events; Show Filters, filter Event Type and date; User/Company column names the client |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | Partial | ADP validates consent before processing API calls, so denial should block calls; immediate effect on live tokens not stated. | Where: adpapps.adp.com/consent-manager > Allowed Consents > Deny > I'm Sure; and ADP Marketplace > My Apps > app tile cog > Manage App > cancel subscription |
| Respond: Stops working when user is removed | N/A | Credentials act as a system agent user created for the data connector, not a person. |  |

## Protect: what an admin can configure

### Admin controls
- **Mutual TLS certificate** (Other; all plans; default on). Every token and API request must present the registered X.509 certificate, so a leaked secret alone is not enough. Where: API Central / Self Service portal > Certificate.
- **Consent Manager - Allow/Deny pending request** (Require approval; all plans; default on). Marketplace apps get no client credentials until the client consents. Where: Consent Manager > Pending Consents.
- **Shorter access token lifetime at registration** (Limit lifetime; all plans; default off). A shorter token expiry can be requested during application registration. Where: Request to ADP during registration.

- Network: conditional (checked at unknown). ADP may tie tokens to the IP used at authorization; no customer-configurable allowlist documented.
- Lifetime: Access token 60 min; credentials last while consent and subscription are active. Renewal: Partner mints new tokens with stored client credentials.
- Keyless option: not_verified. Consent is given by a client user; API calls afterwards use client credentials with no user session.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- Marketplace event logs: Referenced for subscription cancellation; access method and retention not documented.

### Fields that identify the credential
No docs found.

### Lifecycle events
- revoke: `subscription cancellation` Shown in Marketplace event logs per partner checklist; exact event name not given.

### Correlate on
`consumerApplicationID`, `client OOID`

### API calls a holder can make, and whether they are logged
- collection (bulk): `GET /hr/v2/workers`. Client's worker records Logged: unknown. 

### What to look for (analyst guidance)
- Unknown apps in Consent Manager Allowed Consents

## Respond: how to revoke it
- Admin: **Consent Manager - Deny**. Client admin denies an allowed app so it no longer has access to the organization's ADP data. Where: https://adpapps.adp.com/consent-manager > Allowed Consents > Deny.
- Admin: **Cancel subscription**. Cancelling the Marketplace subscription stops the app's API calls for that client. Where: ADP Marketplace > My Apps > Manage App > cancel subscription.

Deny the app in Consent Manager and cancel the Marketplace subscription. Live access ends on revocation: partial. ADP validates consent before processing API calls, so denial should block calls; immediate effect on live tokens not stated.

## No vendor documentation found
- Data reads appear in logs
- Client-visible log of partner API calls
- Whether a customer-configurable IP allowlist exists for API Central credentials (docs only say tokens 'may be' tied to an IP).
- Whether credential reset or consent denial revokes already-issued access tokens immediately.
- What audit/log records exist for credential creation, reset, token issuance and API calls, and how clients access them.
- Whether API Central certificates can be revoked by the client before expiry.
- Whether consumer-application-subscription-credentials.read returns the same or new secrets after re-consent.

## Sources
- [How to retrieve Client Credentials of a Subscriber](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/How_to_retrieve_Client_Credentials_of_a_Subscriber) (retrieved 2026-10-14)
- [Introduction to Credentials](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/Introduction_to_Credentials) (retrieved 2026-10-14)
- [Using Consent Manager to Control Access to Your Data](https://marketplace-cdn.adp.com/dev-portal/pdf/Using_Consent_Manager_to_Control_Access_to_Your_Data) (retrieved 2026-10-14)
- [Access Tokens (ADP Developer Resources)](https://developers.adp.com/api/services/elasticsearch/general/_doc/access-tokens) (retrieved 2026-10-14)
- [ADP Marketplace ESI - Getting started (modified Jun 17, 2026)](https://marketplace-cdn.adp.com/dev-portal/pdf/ADP_Marketplace_ESI_-_Getting_started) (retrieved 2026-10-14)
- [Handling Consent Guide - Chapter 1](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/Handling_Consent_chapter_1) (retrieved 2026-10-14)
- [Partner Application Demo Checklist - Chapter 8 Subscription Cancellation](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/Partner_Application_Demo_Checklist_chapter_8) (retrieved 2026-10-14)
- [Application Types (ADP Developer Resources)](https://developers.adp.com/api/services/elasticsearch/general/_doc/application-types) (retrieved 2026-10-14)
- [Using Consent Manager to Control Access to Your Data](https://developers.adp.com/api/services/elasticsearch/guides/_doc/using-consent-manager) (retrieved 2026-10-14)
- [Data Connector Application Access Control Guide for ADP Workforce Now](https://developers.adp.com/api/services/elasticsearch/general/_doc/data-connector-application-access-control-guide-for-adp-workforce-now) (retrieved 2026-10-14)
- [Access Tokens](https://developers.adp.com/getting-started/key-concepts/access-tokens) (retrieved 2026-10-14)
- [How to check for Failed events in ADP Marketplace (PDF, modified Mar 31, 2022)](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/How_to_Troubleshoot_and_Resolve_Failed_and_Pending_Events_in_ADP_Marketplace_chapter_2) (retrieved 2026-10-14)
- [ADP Marketplace Partner Development Learning Guide - Chapter 2](https://marketplace-cdn.adp.com/dev-portal/pdf/ADP_Marketplace_Partner_Development_Learning_Guide_chapter_2) (retrieved 2026-10-14)
- [Marketplace Integrations for Benefit Carriers - Chapter 5](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/Marketplace_Integrations_for_Benefit_Carriers_chapter_5) (retrieved 2026-10-14)
