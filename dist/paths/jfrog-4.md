# JFrog: OpenID Connect integrations (OIDC token exchange)

`jfrog-4` · Federated identity · service. An external IdP token (e.g. GitHub Actions OIDC) is exchanged at /access/api/v1/oidc/token for a short-lived JFrog access token whose scope comes from the matching identity mapping.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | OIDC provider configurations are listed under General Management > Manage Integrations; issued tokens are not listed separately in the docs. | OIDC provider configurations are listed under General Management > Manage Integrations; issued tokens are not listed separately in the docs. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | JPD-wide MyJFrog allowlist; CI runner egress IPs must be listed. | IP/CIDR Allowlist: MyJFrog > Security > Allowlist; MyJFrog IP allowlist API |
| Protect: Expires automatically | Partial | Expiration time set per identity mapping (minutes) | Where: Administration > General Management > Manage Integrations > OIDC integration > identity mapping > Expiration Time (minutes) · API: POST /access/api/v1/oidc/{provider_name}/identity_mappings with token_spec.expires_in (seconds) |
| Detect: Usage appears in logs | Yes | subject from identity mapping | Request Log: POST /access/api/v1/oidc/token and subsequent requests. |
| Detect: Data reads appear in logs | Yes | ACCEPTED DOWNLOAD | Where: Administration > Artifactory > System Logs (access log): filter [ACCEPTED DOWNLOAD] for the identity mapping's User Name |
| Respond: Revocation ends active access | Partial | Tokens with expiry below revocable-expiry-threshold (default 6 hours) cannot be revoked and run until expiry; longer ones can be revoked. | Delete or tighten the identity mapping / OIDC configuration. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **IP/CIDR Allowlist** (Limit network; Enterprise X or Enterprise+; default off). Only listed IPs/JPDs can reach the JPD. Where: MyJFrog > Security > Allowlist; MyJFrog IP allowlist API.
- **Identity mapping claims** (Limit scope; Enterprise X or Enterprise+; default varies). Claims in each mapping restrict which workloads get tokens and with what scope. Where: OIDC integration identity mappings (UI) or Create/Update Identity Mapping API.

- Network: supported (checked at api_request). JPD-wide MyJFrog allowlist; CI runner egress IPs must be listed.
- Lifetime: Expiration time set per identity mapping (minutes). Renewal: Workload re-exchanges a fresh IdP token.
- Keyless option: supported. Inbound workload federation. Identity mappings without claims, or GitHub 'Enable Permissive Configuration', let any workload of the provider get a token.
- Conditions: Enterprise X or Enterprise+.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Request Log: POST /access/api/v1/oidc/token and subsequent requests.

### Fields that identify the credential
- `subject from identity mapping` (Request Log Username): 

### Lifecycle events
No docs found.

### Correlate on
`identity mapping name`, `CI repository/workflow claims`

### API calls a holder can make, and whether they are logged
- recon: `POST /access/api/v1/oidc/token`. issues JFrog token Logged: yes. Request log.
- collection: `GET https://{jfrog_url}/artifactory/{repoKey}/{filePath} (Retrieve Artifact)`. artifact contents Logged: yes (`ACCEPTED DOWNLOAD`). Access log entry shows user name, IP and auth type TOKEN; the user is whatever the identity mapping assigns.

### What to look for (analyst guidance)
- Exchanges from unexpected repositories
- Mappings without claims or with Permissive Configuration

## Respond: how to revoke it
- Admin: **Delete OIDC Configuration**. Removes the provider so no new tokens can be exchanged. Where: DELETE OIDC Configuration API.

Delete or tighten the identity mapping / OIDC configuration. Live access ends on revocation: partial. Tokens with expiry below revocable-expiry-threshold (default 6 hours) cannot be revoked and run until expiry; longer ones can be revoked.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- Stops working when user is removed
- Audit event for OIDC config changes
- Whether SaaS customers can change token.max-expiry, token.allow-refreshable or revocable-expiry-threshold (documented only as Access YAML settings).
- A setting to stop non-admin users creating identity tokens.
- Default and maximum lifetime of UI-generated identity tokens.
- Whether the IP allowlist covers the MyJFrog portal API.
- Whether MyJFrog audit logs record API token generation (event names not listed).
- Reference token length: Access Tokens page says 128 characters, Identity Tokens page says 64.

## Sources
- [OpenID Connect Integration](https://docs.jfrog.com/administration/docs/openid-connect-integration) (retrieved 2026-10-14)
- [JFrog Authentication and Token Management Overview](https://docs.jfrog.com/administration/docs/jfrog-authentication-and-token-management-overview) (retrieved 2026-10-14)
- [OIDC Token Exchange](https://docs.jfrog.com/administration/reference/oidctokenexchange) (retrieved 2026-10-14)
- [Configure Cloud Security](https://docs.jfrog.com/administration/docs/configure-cloud-security) (retrieved 2026-10-14)
- [Create an Identity Mapping](https://docs.jfrog.com/administration/reference/createoidcidentitymapping) (retrieved 2026-10-14)
- [Access Log](https://docs.jfrog.com/administration/docs/access-log) (retrieved 2026-10-14)
- [Log Files Location and Naming](https://docs.jfrog.com/administration/docs/log-files-location-and-naming) (retrieved 2026-10-14)
- [Access Tokens](https://docs.jfrog.com/administration/docs/access-tokens) (retrieved 2026-10-14)
- [JFrog Cloud Log Streaming](https://docs.jfrog.com/administration/docs/jfrog-cloud-log-streaming) (retrieved 2026-10-14)
- [Retrieve Artifact](https://docs.jfrog.com/artifactory/reference/retrieveartifact) (retrieved 2026-10-14)
