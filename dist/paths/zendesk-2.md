# Zendesk Support: Legacy Support API token

`zendesk-2` · API key / token · person · legacy. OAuth bearer: authorization code or client credentials. Legacy API tokens via Basic email/token are being retired; unavailable to accounts created from 28 July 2026.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Admin Center > Apps and integrations > APIs > API tokens lists all tokens. | Admin Center > Apps and integrations > APIs > API tokens lists all tokens. |
| Protect: Admin can block or require approval | Yes | Allow API token access | Allow API token access: Admin Center > Apps and integrations > APIs > API configuration |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Account IP restrictions cover API/mobile/web access. Customer bypass and unsupported-endpoint exceptions require review. | IP restrictions: Admin Center > Account > Security > Advanced |
| Protect: Expires automatically | Not available | 30 days unused; retirement 2027-04-30 |  |
| Detect: Usage appears in logs | Yes | source_id, source_label, authorization_type | Zendesk Audit Logs (/api/v2/audit_logs): Enterprise; kept indefinitely. source_type 'apitoken' covers token create/deactivate/reactivate/delete. Admin Center token menu > View audit log. · Zendesk Access Logs (/api/v2/access_logs): ADPP add-on; 90 days; authorization_type 'basic' on token requests; user_id is the email used, not the token. |
| Detect: Data reads appear in logs | Yes | GET /api/v2/users/{user_id} | Where: Admin Center > Account > Logs > Access log > Filter: Category = Users, Summary = Show user; Authorization type = basic · API: GET /api/v2/access_logs?filter[start]=...&filter[end]=...&filter[user_id]=<id> |
| Respond: Revocation ends active access | Yes | Docs: 'As soon as you deactivate a token, API calls using that token begin failing.' Deactivated tokens can be reactivated until deleted. | Admin Center > Apps and integrations > APIs > API tokens: Deactivate (immediate), then Delete. Consider turning off API token access and migrating to OAuth. |
| Respond: Stops working when user is removed | N/A | An API token is account-level and can act as any user, so it is not tied to one user's account. |  |

## Protect: what an admin can configure

### Admin controls
- **Allow API token access** (Disable; All Suites Team+ / Support Team+; default off). Turning it off makes all API tokens stop working until re-enabled. Where: Admin Center > Apps and integrations > APIs > API configuration.
- **IP restrictions** (Limit network; All Suites Team+ / Support Team+; default off). Blocks API calls, sign-ins and page access from outside allowed IPs; customers (not agents/admins) can be exempted. Where: Admin Center > Account > Security > Advanced.

### Not available (vendor states)
- API tokens cannot be tied to a user or scoped; any verified user can use any token.
- From Apr 30 2027 admins cannot reactivate tokens at all (vendor retirement; new creation blocked from Oct 27 2026).

- Network: conditional (checked at api_request). Account IP restrictions cover API/mobile/web access. Customer bypass and unsupported-endpoint exceptions require review.
- Lifetime: 30 days unused; retirement 2027-04-30. Renewal: The static token is reused until it goes 30 days unused (deactivated, deleted after 60 more days) or is revoked. New creation stops 27 October 2026; all tokens stop working 30 April 2027. Accounts created on/after 28 July 2026 cannot use them.
- Keyless option: not_applicable. This path uses a local/static or platform-native credential. Evaluate a separate federation path where listed.
- Conditions: Check IP entitlement and OAuth client creation date/type. API-token retirement applies to Support/Ticketing, Help Center and Voice; other Zendesk products differ.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Zendesk Audit Logs (/api/v2/audit_logs): Enterprise; kept indefinitely. source_type 'apitoken' covers token create/deactivate/reactivate/delete. Admin Center token menu > View audit log.
- Zendesk Access Logs (/api/v2/access_logs): ADPP add-on; 90 days; authorization_type 'basic' on token requests; user_id is the email used, not the token.

### Fields that identify the credential
- `source_id` (audit log): API token ID when source_type is 'apitoken'
- `source_label` (audit log): Label of the audited token (likely description)
- `authorization_type` (access log): 'basic' for email/token auth (also used by other basic auth)

### Lifecycle events
- create: `source_type=apitoken action=create` Audit log record for a new token
- change: `source_type=apitoken action=update` Likely deactivate/reactivate/description edit; mapping not confirmed
- revoke: `source_type=apitoken action=destroy` Token deleted

### Correlate on
`actor_id`, `actor_name`, `ip_address`, `source_id`, `source_type`, `created_at`, `user_id`, `authorization_type`, `client`

### API calls a holder can make, and whether they are logged
- collection: `GET /api/v2/users/{user_id}`. user profile Logged: yes. API token usage report (from API tokens page, last 7 days) lists each request with truncated token ID, method and URL; the ADPP access log also records 'Show user'.

### Public detection rules (community, not vendor documentation)
- [Zendesk API Token Created](https://github.com/panther-labs/panther-analysis/blob/develop/rules/zendesk_rules/zendesk_new_api_token.yml) (Panther): A Zendesk API token was created or deleted.

### What to look for (analyst guidance)
- Basic-auth requests with a user_id that never used the integration (token works with any verified user's email)
- New API token created after 2026-10-27 attempt or creation spike before that cutoff
- Token reactivated shortly after auto-deactivation, then used from a new IP
- Basic-auth traffic from new IP/client strings for a service integration
- Token creation by an admin from an unusual IP in audit log

### Sample query (Zendesk Audit Logs API filter parameters)
List all API token lifecycle changes with actor and IP.

```
GET /api/v2/audit_logs?filter[source_type]=apitoken&filter[created_at]=2026-07-01T00:00:00Z&filter[created_at]=2026-10-12T00:00:00Z
```

## Respond: how to revoke it
- Admin: **Deactivate / delete API token**. Deactivating a token makes calls with it fail immediately; deleting is permanent. Where: Admin Center > Apps and integrations > APIs > API tokens.

Admin Center > Apps and integrations > APIs > API tokens: Deactivate (immediate), then Delete. Consider turning off API token access and migrating to OAuth. Live access ends on revocation: yes. Docs: 'As soon as you deactivate a token, API calls using that token begin failing.' Deactivated tokens can be reactivated until deleted.

## No vendor documentation found
- SSO and MFA rules apply
- Exact audit action values for deactivate/reactivate
- change_description text for apitoken events
- Any per-token identifier in access logs
- Token format/prefix
- No account-wide switch to disable OAuth found; OAuth "is managed separately" from the API configuration page.
- Whether admins can block or scope third-party global OAuth clients (marketplace apps) beyond deleting their tokens.
- Whether requiring SSO affects API token or OAuth token use.
- Plan requirement for the Manage APIs custom-role permission (custom roles are typically Enterprise) not confirmed.

## Sources
- [Creating and using OAuth access tokens with the API - Zendesk](https://developer.zendesk.com/documentation/authentication/creating-and-using-oauth-tokens-with-the-api/) (retrieved 2026-10-09)
- [Using OAuth to authenticate API requests | Zendesk Developer Docs](https://developer.zendesk.com/documentation/authentication/api-tokens-to-oauth/) (retrieved 2026-10-09)
- [Announcing the required expiration of global OAuth access and refresh ...](https://support.zendesk.com/hc/en-us/articles/10212201463962-Announcing-the-required-expiration-of-global-OAuth-access-and-refresh-tokens) (retrieved 2026-10-09)
- [Announcing the removal of API tokens as an authentication method for API requests – Zendesk help](https://support.zendesk.com/hc/en-us/articles/10840968198042-Announcing-the-removal-of-API-tokens-as-an-authentication-method-for-API-requests) (retrieved 2026-10-09)
- [Restricting access to Zendesk using IP restrictions – Zendesk help](https://support.zendesk.com/hc/en-us/articles/4408894156186) (retrieved 2026-10-09)
- [Using OAuth to authenticate API requests | Zendesk Developer Docs](https://developer.zendesk.com/documentation/authentication/api-tokens-to-oauth/) (retrieved 2026-10-09)
- [Zendesk: Managing API token access](https://support.zendesk.com/hc/en-us/articles/4408889192858-Managing-API-token-access-to-the-Zendesk-API) (retrieved 2026-10-12)
- [Using the access log to monitor agent activity (ADPP add-on)](https://support.zendesk.com/hc/en-us/articles/6066010357530-Using-the-access-log-to-monitor-agent-activity-ADPP-add-on) (retrieved 2026-10-14)
- [Access log use cases and workflows (ADPP add-on)](https://support.zendesk.com/hc/en-us/articles/9972142485530-Access-log-use-cases-and-workflows-ADPP-add-on) (retrieved 2026-10-14)
- [Zendesk Access Logs API](https://developer.zendesk.com/api-reference/ticketing/account-configuration/access_logs/) (retrieved 2026-10-12)
- [Zendesk Audit Logs API](https://developer.zendesk.com/api-reference/ticketing/account-configuration/audit_logs/) (retrieved 2026-10-12)
- [Zendesk: Removal of API tokens](https://support.zendesk.com/hc/en-us/articles/10851263566234-Announcing-the-removal-of-API-tokens-as-an-authentication-method-for-API-requests) (retrieved 2026-10-12)
- [Users](https://developer.zendesk.com/api-reference/ticketing/users/users/) (retrieved 2026-10-14)
- [Turning on and off API access](https://support.zendesk.com/hc/en-us/articles/8662004958746) (retrieved 2026-10-13)
- [Managing API token access to the Zendesk API](https://support.zendesk.com/hc/en-us/articles/4408889192858) (retrieved 2026-10-13)
- [https://support.zendesk.com/hc/en-us/articles/10851263566234](https://support.zendesk.com/hc/en-us/articles/10851263566234) (retrieved 2026-10-13)
