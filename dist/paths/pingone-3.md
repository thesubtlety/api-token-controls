# PingOne: Gateway credential

`pingone-3` · Signed JWT · service. A gateway instance (LDAP, PingFederate, RADIUS, API gateway integration, Authorize) running in the customer's infrastructure holds a signed JWT gateway credential. It exchanges the credential at /as/token (token_exchange grant) for an access token to PingOne resources.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | GET /v1/environments/{envID}/gateways/{gatewayID}/credentials lists credentials per gateway (max five per gateway). | GET /v1/environments/{envID}/gateways/{gatewayID}/credentials lists credentials per gateway (max five per gateway). |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | No IP restriction documented for gateway credentials. |  |
| Protect: Expires automatically | No docs found | No expiry documented; claims list has no exp claim |  |
| Detect: Usage appears in logs | Yes | id / jti | PingOne Audit (Monitoring > Audit) and GET/POST /v1/environments/{envID}/activities: Configuration events kept 2 years, user events 90 days; queries max 14 days; Audit API rate 10/second. · Subscriptions (webhooks): Streams audit events to HTTPS/TCP endpoints; events lost if target down >7 days. |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | Yes | Docs say all instances using it lose their credentials; already-exchanged access tokens not addressed. | DELETE /v1/environments/{envID}/gateways/{gatewayID}/credentials/{credentialID} |
| Respond: Stops working when user is removed | N/A | The credential belongs to a gateway instance, not a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Environment Admin role required for gateway entities** (Other; all plans; default on). Only admins with the Environment Admin role can create or manage gateway credentials. Where: Administrator role assignment (Environment Admin).

- Network: unknown (checked at unknown). No IP restriction documented for gateway credentials.
- Lifetime: No expiry documented; claims list has no exp claim. Renewal: Rotation is manual by issuing a new credential.
- Keyless option: not_applicable. Static signed JWT issued by PingOne.
- Conditions: Max five credentials per gateway; token value shown only at creation.

## Detect: what gets logged
- Token prefix: not established

### Logs
- PingOne Audit (Monitoring > Audit) and GET/POST /v1/environments/{envID}/activities: Configuration events kept 2 years, user events 90 days; queries max 14 days; Audit API rate 10/second.
- Subscriptions (webhooks): Streams audit events to HTTPS/TCP endpoints; events lost if target down >7 days.

### Fields that identify the credential
- `id / jti` (Gateway credentials API): lastUsedAt shows last use

### Lifecycle events
- create: `GATEWAY.CREATED` Gateway, not credential
- other: `GATEWAY.UPDATED` 
- revoke: `GATEWAY.DELETED` 

### Correlate on
`jti`, `gatewayId`, `lastUsedAt`

### API calls a holder can make, and whether they are logged
- recon: `POST /{envID}/as/token (grant_type=urn:ietf:params:oauth:grant-type:token-exchange)`. Access token for gateway use Logged: unknown. 

### What to look for (analyst guidance)
- lastUsedAt changes on a credential for a decommissioned gateway
- More credentials than running gateway instances

## Respond: how to revoke it
- Admin: **Delete Gateway Credentials**. Deletes and revokes a gateway credential for all instances using it. Where: DELETE /v1/environments/{envID}/gateways/{gatewayID}/credentials/{credentialID}.

DELETE /v1/environments/{envID}/gateways/{gatewayID}/credentials/{credentialID} Live access ends on revocation: yes. Docs say all instances using it lose their credentials; already-exchanged access tokens not addressed.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Expires automatically
- Data reads appear in logs
- Credential-level audit events
- What the exchanged token can read
- Whether disabling the app or rotating the secret invalidates already-issued access tokens (role removal does take effect per call per S5)
- Whether successful client_credentials token issuance produces an audit event
- Whether Management API read calls (e.g., GET users) are audited
- Whether inbound traffic policies apply to api.pingone.com
- Admin-level policy to block Worker app creation or require approval
- Gateway credential expiry and whether its creation/deletion has a distinct audit event
- Maximum configurable access token lifetime for the PingOne API resource

## Sources
- [Gateway Credentials](https://developer.pingidentity.com/pingone-api/platform/gateway-management/gateway-credentials/index.html) (retrieved 2026-10-14)
- [Token Exchange (Gateway Credential)](https://developer.pingidentity.com/pingone-api/auth/openid-connect-oauth-2/token/token-exchange-gateway-credential-.html) (retrieved 2026-10-14)
- [Create Gateway Credentials](https://developer.pingidentity.com/pingone-api/platform/gateway-management/gateway-credentials/create-gateway-credentials.html) (retrieved 2026-10-14)
- [Delete Gateway Credentials](https://developer.pingidentity.com/pingone-api/platform/gateway-management/gateway-credentials/delete-gateway-credentials.html) (retrieved 2026-10-14)
- [Read All Gateway Credentials | PingOne Platform APIs](https://developer.pingidentity.com/pingone-api/platform/gateway-management/gateway-credentials/read-all-gateway-credentials.html) (retrieved 2026-10-14)
- [Audit Reporting Events](https://developer.pingidentity.com/pingone-api/platform/reference/audit-reporting-events.html) (retrieved 2026-10-14)
- [Base rate limits](https://developer.pingidentity.com/pingone-api/platform/rate-limiting/base-rate-limits.html) (retrieved 2026-10-14)
