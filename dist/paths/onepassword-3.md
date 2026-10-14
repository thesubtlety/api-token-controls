# 1Password: SCIM bridge / automated provisioning bearer token

`onepassword-3` · API key / token · service. The IdP calls the SCIM bridge (self-hosted) or 1Password-hosted provisioning with a bearer token. On a self-hosted bridge the token is paired with the scimsession file that holds the bridge's 1Password credentials.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional (requires Business) | Account firewall rules can block the self-hosted bridge's connection to 1Password; IdP-to-bridge traffic is the customer's network. Hosted provisioning not covered. | Firewall policy: Policies > Firewall > Manage policies |
| Protect: Expires automatically | Not available | No expiry documented |  |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | SCIM bridge status page logs (/app): Self-hosted; downloadable logs · Audit log (Provisioning, Users, Groups): Business; records resulting user/group changes |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | No docs found | Old token invalidation not explicitly stated. |  |
| Respond: Stops working when user is removed | N/A | The bearer token belongs to the SCIM bridge deployment, paired with its scimsession file, not to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **Firewall policy** (Limit network; Business; default off). Allow/report/deny sign-in attempts by IP, CIDR, country or anonymous IP; documented to block the SCIM bridge. Where: Policies > Firewall > Manage policies.

- Network: conditional (checked at login_only). Account firewall rules can block the self-hosted bridge's connection to 1Password; IdP-to-bridge traffic is the customer's network. Hosted provisioning not covered.
- Lifetime: No expiry documented. Renewal: Regenerate Credentials on the Integrations page; redeploy scimsession and update IdP token.
- Keyless option: not_applicable. Static bearer token configured in the IdP.
- Conditions: 1Password Business.

## Detect: what gets logged
- Token prefix: not established

### Logs
- SCIM bridge status page logs (/app): Self-hosted; downloadable logs
- Audit log (Provisioning, Users, Groups): Business; records resulting user/group changes

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`Provision Managers group actions`

### API calls a holder can make, and whether they are logged
- enumeration (bulk): `GET /scim/Users`. Provisioned users Logged: unknown. 
- enumeration (bulk): `GET /scim/Groups`. Groups Logged: unknown. 

### What to look for (analyst guidance)
- Unexpected user provisioning or group membership changes
- Firewall block messages in bridge log

## Respond: how to revoke it
- Admin: **Regenerate Credentials**. Issues a new SCIM bearer token and scimsession file. Where: Integrations > Automated User Provisioning > Regenerate Credentials.

Integrations > Automated User Provisioning > Regenerate Credentials, or turn off Provisioning users & groups. Live access ends on revocation: unknown. Old token invalidation not explicitly stated.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- SSO and MFA rules apply
- Data reads appear in logs
- Revocation ends active access
- Audit event for credential regeneration
- Token format
- Whether SCIM reads are logged
- Whether Business firewall rules apply to service account, Connect, Events API or Users API requests.
- Whether Unlock with SSO / IdP policies affect service accounts (service_account_sso_denied is undocumented).
- Whether audit log records Connect token, Events API token, SCIM credential regeneration or OAuth application create/revoke (only service account and satoken events are listed).
- Whether Events API, Users API or SCIM calls themselves are logged anywhere customer-visible.
- Whether a revoked Connect token or regenerated SCIM token stops working immediately.
- Maximum value for service account --expires-in.
- Whether the itemusages Events API feed includes service account item access (usage reports do).

## Sources
- [If you're having trouble with 1Password SCIM Bridge](https://support.1password.com/scim-troubleshooting/) (retrieved 2026-10-14)
- [About 1Password SCIM Bridge endpoints](https://support.1password.com/scim-endpoints/) (retrieved 2026-10-14)
- [Migrate from a self-hosted SCIM bridge to automated provisioning](https://support.1password.com/provisioning-migrate/) (retrieved 2026-10-14)
- [Use the audit log in 1Password Business](https://support.1password.com/activity-log/) (retrieved 2026-10-14)
- [Create firewall rules in 1Password Business](https://support.1password.com/firewall-rules/) (retrieved 2026-10-14)
