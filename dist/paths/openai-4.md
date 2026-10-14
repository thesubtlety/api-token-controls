# OpenAI API: Workload identity federation access token

`openai-4` · Federated identity · service. Workload exchanges an OIDC JWT, SPIFFE JWT-SVID or X.509 client cert at the token endpoint for a short-lived token mapped to a project service account.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Partial | No endpoint lists issued tokens; issuance appears in the audit log as tenant.workload_identity.access_token.issued. | API: GET /organization/audit_logs?event_types[]=tenant.workload_identity.access_token.issued |
| Protect: Admin can block or require approval | Yes | Disable a workload identity service account mapping | Disable a workload identity service account mapping: Workload Identity Provider > service account mapping (disabled state) |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Yes | Minted tokens are subject to the same IP allowlist checks as normal API requests. | IP allowlist: Settings > Security > IP allowlist |
| Protect: Expires automatically | Yes | At most 1 hour; never outlives the subject token or certificate | API: POST https://auth.openai.com/oauth/token response fields expires_in, expires_at |
| Detect: Usage appears in logs | Yes | actor.api_key.service_account.id | Audit logs (GET /v1/organization/audit_logs): User actions and configuration changes; actor is session or api_key with key tracking id. Read with an admin key. Activation and retention not verified. |
| Detect: Data reads appear in logs | No docs found | Vendor docs neither confirm nor deny. |  |
| Respond: Revocation ends active access | No docs found | Tokens expire within an hour; immediate invalidation of issued tokens not stated. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **IP allowlist** (Limit network; all plans; default off). Reject API requests from IPs outside up to 50 addresses/CIDRs; org or project level. Where: Settings > Security > IP allowlist.
- **Workload Identity Provider and service account mappings** (Limit scope; all plans; default off). Only tokens matching exactly one enabled mapping are exchanged; mapping permissions narrow access. Where: Organization Settings > Security > Workload Identity Provider.
- **Disable a workload identity service account mapping** (Disable; all plans; default unknown). A disabled mapping makes token exchange fail for that service account, which stops new access tokens from being issued. Where: Workload Identity Provider > service account mapping (disabled state).

- Network: supported (checked at api_request). Minted tokens are subject to the same IP allowlist checks as normal API requests.
- Lifetime: At most 1 hour; never outlives the subject token or certificate. Renewal: No refresh token; repeat the exchange with a fresh external token.
- Keyless option: supported. OIDC providers (AWS, Azure, GCP, Kubernetes, GitHub Actions, OCI, SPIFFE) and X.509 via mTLS; mappings select the service account.
- Conditions: Cannot call Admin API endpoints.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Audit logs (GET /v1/organization/audit_logs): User actions and configuration changes; actor is session or api_key with key tracking id. Read with an admin key. Activation and retention not verified.

### Fields that identify the credential
- `actor.api_key.service_account.id` (Audit logs): Mapped service account (assumed attribution; not verified)

### Lifecycle events
- create: `workload_identity_provider.created` Also workload_identity_provider_mapping.created/updated/deleted
- use: `tenant.workload_identity.access_token.issued` Token issuance

### Correlate on
`actor.api_key.id (tracking id)`, `actor.api_key.service_account.id`, `actor.session.ip_address`, `project_id`

### API calls a holder can make, and whether they are logged
- recon: `GET /v1/models`. Key is valid; models visible to the project Logged: unknown. Audit log covers config changes; inference/read calls not stated
- collection (bulk): `GET /v1/files then GET /v1/files/{file_id}/content`. Uploaded files (fine-tuning, batch, assistants data) Logged: unknown. Not listed as an audit event

### What to look for (analyst guidance)
- Key used from IP that triggers ip_not_authorized
- api_key.created by unexpected user or outside change window
- Usage spike grouped by api_key_id

## Respond: how to revoke it
- Admin: **Delete project service account**. Removes the service account identity. Where: DELETE /v1/organization/projects/{project_id}/service_accounts/{service_account_id}.

Disable or delete the service account mapping or provider; delete the service account. Live access ends on revocation: unknown. Tokens expire within an hour; immediate invalidation of issued tokens not stated.

## No vendor documentation found
- SSO and MFA rules apply
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- How WIF-token API calls are attributed in audit logs
- Whether API keys are subject to SSO or IdP conditional access (no statement found).
- Whether the IP allowlist covers Administration API calls made with admin keys.
- Whether audit logging must be activated and its retention period (help center pages blocked to fetch).
- Whether inference/data-read API calls (e.g. GET /v1/files) appear in the audit log; it is described as user actions and configuration changes.
- Whether deleting a service account or WIF mapping invalidates already-issued WIF tokens before expiry.
- Lifetime, listing and admin revocation of legacy user API keys.
- API key secret prefix format (not stated in fetched docs).

## Sources
- [Workload identity federation](https://developers.openai.com/api/docs/guides/workload-identity-federation) (retrieved 2026-10-14)
- [Workload identity token exchange reference](https://developers.openai.com/api/reference/workload-identity-federation) (retrieved 2026-10-14)
- [IP allowlist](https://developers.openai.com/api/docs/guides/ip-allowlist) (retrieved 2026-10-14)
- [List audit logs](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/audit_logs/methods/list) (retrieved 2026-10-14)
- [OpenAI OpenAPI spec (AdminApiKey schema)](https://github.com/openai/openai-openapi/blob/main/openapi.yaml) (retrieved 2026-10-14)
- [Audit Logs reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/audit_logs) (retrieved 2026-10-14)
- [Models reference](https://developers.openai.com/api/reference/resources/models) (retrieved 2026-10-14)
- [Files reference](https://developers.openai.com/api/reference/resources/files) (retrieved 2026-10-14)
- [Service Accounts reference](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/service_accounts) (retrieved 2026-10-14)
