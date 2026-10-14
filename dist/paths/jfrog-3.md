# JFrog: API keys (deprecated)

`jfrog-3` · API key / token · person. Per-user static key sent in the X-JFrog-Art-Api header or as the basic-auth password. Creation is disabled since Artifactory 7.98, but existing keys keep working unless an admin turns on 'Disable API Key Usage'.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | Cloud admins can download a CSV of users still using API keys, but cannot otherwise monitor or manage users' keys. | Where: Administration > User Management > Users > banner download link (CSV of users using API keys) |
| Protect: Admin can block or require approval | Yes | Disable API Key Usage; Allow Created Users Access To Profile Page | Disable API Key Usage: Administration > Security > General > Disable API Key Usage · Allow Created Users Access To Profile Page: Administration > Authentication Providers > SAML SSO settings |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | JPD-wide MyJFrog allowlist. | IP/CIDR Allowlist: MyJFrog > Security > Allowlist; MyJFrog IP allowlist API |
| Protect: Expires automatically | Not available | Never expires |  |
| Detect: Usage appears in logs | Yes | type APIKEY | Artifactory Access Log: Auth type APIKEY. · API key user CSV: User Management > Users banner (Cloud 7.63.5+). |
| Detect: Data reads appear in logs | Yes | ACCEPTED DOWNLOAD | Where: Administration > Artifactory > System Logs (access log): filter [ACCEPTED DOWNLOAD] with auth type APIKEY |
| Respond: Revocation ends active access | Yes | Checkbox blocks API key usage platform-wide. | Where: Administration > Security > General > Disable API Key Usage · API: DELETE /artifactory/api/security/apiKey/{username}; DELETE /artifactory/api/security/apiKey?deleteAll=1 (all keys) |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **Disable API Key Usage** (Disable; all plans; default off). Blocks authentication with existing API keys. Where: Administration > Security > General > Disable API Key Usage.
- **IP/CIDR Allowlist** (Limit network; Enterprise X or Enterprise+; default off). Only listed IPs/JPDs can reach the JPD. Where: MyJFrog > Security > Allowlist; MyJFrog IP allowlist API.
- **Allow Created Users Access To Profile Page** (Disable; all plans; default unknown). When cleared, users auto-created through SAML cannot reach their profile page, where identity tokens and API keys are generated. Where: Administration > Authentication Providers > SAML SSO settings.

### Not available (vendor states)
- Admins cannot monitor or manage individual users' API keys (only the global disable and a user list).
- API keys have no expiry.

- Network: supported (checked at api_request). JPD-wide MyJFrog allowlist.
- Lifetime: Never expires. Renewal: Static until revoked; migrate to reference tokens.
- Keyless option: not_verified. Docs do not address SSO interaction for API keys.
- Conditions: Cloud Artifactory 7.107.1+ for the checkbox.

## Detect: what gets logged
- Token prefix: `AKCp`

### Logs
- Artifactory Access Log: Auth type APIKEY.
- API key user CSV: User Management > Users banner (Cloud 7.63.5+).

### Fields that identify the credential
- `type APIKEY` (Access Log): Per-user only; one key per user.

### Lifecycle events
No docs found.

### Correlate on
`username`, `IP`

### API calls a holder can make, and whether they are logged
- discovery (bulk): `GET /artifactory/api/repositories`. repository list Logged: yes. Request log; access log shows APIKEY type for logins.
- collection: `GET https://{jfrog_url}/artifactory/{repoKey}/{filePath} (Retrieve Artifact)`. artifact contents Logged: yes (`ACCEPTED DOWNLOAD`). Artifactory access log records downloads with user name, IP and auth type APIKEY.

### What to look for (analyst guidance)
- Any APIKEY auth after migration

## Respond: how to revoke it


Enable Disable API Key Usage; revoke the user's key. Live access ends on revocation: yes. Checkbox blocks API key usage platform-wide.

## No vendor documentation found
- SSO and MFA rules apply
- Stops working when user is removed
- Whether SaaS customers can change token.max-expiry, token.allow-refreshable or revocable-expiry-threshold (documented only as Access YAML settings).
- A setting to stop non-admin users creating identity tokens.
- Default and maximum lifetime of UI-generated identity tokens.
- Whether the IP allowlist covers the MyJFrog portal API.
- Whether MyJFrog audit logs record API token generation (event names not listed).
- Reference token length: Access Tokens page says 128 characters, Identity Tokens page says 64.

## Sources
- [API Key](https://docs.jfrog.com/user-management/docs/api-key) (retrieved 2026-10-14)
- [Configure Cloud Security](https://docs.jfrog.com/administration/docs/configure-cloud-security) (retrieved 2026-10-14)
- [Access Log](https://docs.jfrog.com/administration/docs/access-log) (retrieved 2026-10-14)
- [Revoke User API Key](https://docs.jfrog.com/administration/reference/revokeuserapikey) (retrieved 2026-10-14)
- [Revoke API Key](https://docs.jfrog.com/administration/reference/revokeapikey) (retrieved 2026-10-14)
- [Identity Tokens](https://docs.jfrog.com/user-management/docs/identity-tokens) (retrieved 2026-10-14)
- [JFrog Cloud Log Streaming](https://docs.jfrog.com/administration/docs/jfrog-cloud-log-streaming) (retrieved 2026-10-14)
- [Get Repositories by Type and Project](https://docs.jfrog.com/artifactory/reference/getrepositoriesbytypeandproject) (retrieved 2026-10-14)
- [Retrieve Artifact](https://docs.jfrog.com/artifactory/reference/retrieveartifact) (retrieved 2026-10-14)
- [SAML SSO](https://docs.jfrog.com/administration/docs/saml-sso) (retrieved 2026-10-14)
