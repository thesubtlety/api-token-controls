# Stripe: Stripe Apps OAuth (Connect OAuth tokens deprecated)

`stripe-2` · OAuth · person or service. A Stripe App set to OAuth sends the user to an install link; the app backend exchanges the one-time code (valid 5 minutes) at /v1/oauth/token using the developer's own secret key and gets a 1-hour access token, which it sends like an API key. Connect OAuth's returned access_token and refresh_token are deprecated; Connect platforms should use their platform key with the Stripe-Account header (stripe-1).

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Installed Apps page (dashboard.stripe.com/apps/installed) lists apps installed on the account; per account, not org-wide. | Installed Apps page (dashboard.stripe.com/apps/installed) lists apps installed on the account; per account, not org-wide. |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | No docs found | Per-key IP controls are documented for API keys. Equivalent Connect/Apps OAuth enforcement was not verified. |  |
| Protect: Expires automatically | Yes | Stripe Apps OAuth access token: 1 hour. Connect OAuth access_token is deprecated (use platform key + Stripe-Account header). |  |
| Detect: Usage appears in logs | Yes | account, stripe_user_id, scope, request.id | Events / webhooks (app install events): apps.install.created/updated/deleted (app.install.* before 2026-09-30) and account.application.authorized/deauthorized; event.account identifies installing account. · Workbench request logs (installing account): Requests made with the app's access token appear in the installing account's logs; per-token attribution fields not documented. · Workbench request logs (developer account): /v1/oauth/token exchanges are made with the developer's own secret key (see stripe-1). · Activity Logs API: No documented OAuth/app install action types. |
| Detect: Data reads appear in logs | Yes | GET /v1/customers | Where: Workbench > Logs; filter Method GET, API endpoint /v1/customers, and Account |
| Respond: Revocation ends active access | No docs found | Docs do not state whether uninstall immediately invalidates issued access/refresh tokens. Access tokens expire after 1 hour regardless. |  |
| Respond: Stops working when user is removed | N/A | The app is installed on the Stripe account, not tied to the installing user. |  |

## Protect: what an admin can configure

### Admin controls
- **Install-time permission consent** (Limit scope; all plans; default on). The installing user sees and accepts the app's requested permissions before tokens are issued. Where: Stripe App install flow.
- **Install and manage Stripe Apps (role)** (Limit resources; all plans; default on). Installing apps is a role permission (e.g. Developer, Administrator). Where: Settings > Team and security > Team.

- Network: unknown (checked at unknown). Per-key IP controls are documented for API keys. Equivalent Connect/Apps OAuth enforcement was not verified.
- Lifetime: Stripe Apps OAuth access token: 1 hour. Connect OAuth access_token is deprecated (use platform key + Stripe-Account header).. Renewal: Stripe Apps: refresh token (1 year, rolled on each exchange, so effectively 1 year from last use; 31536000 s) gets a new 1-hour access token. Connect OAuth tokens are deprecated.
- Keyless option: not_verified. Tokens come from user authorization at app install and are refreshed with the developer's secret key. No exchange of an external identity token is documented for this path. Stripe Workload Identity Federation (private preview) is a separate mechanism.
- Conditions: Stripe Apps choose one API access method in the manifest (platform key, OAuth 2.0, or restricted API key); this path covers OAuth only. The token exchange requires the app developer's secret key. For Connect OAuth, the access_token, refresh_token and stripe_publishable_key response fields are deprecated, and since June 2021 read_write OAuth can't connect accounts controlled by another platform.

## Detect: what gets logged
- Token prefix: not established

### Logs
- Events / webhooks (app install events): apps.install.created/updated/deleted (app.install.* before 2026-09-30) and account.application.authorized/deauthorized; event.account identifies installing account.
- Workbench request logs (installing account): Requests made with the app's access token appear in the installing account's logs; per-token attribution fields not documented.
- Workbench request logs (developer account): /v1/oauth/token exchanges are made with the developer's own secret key (see stripe-1).
- Activity Logs API: No documented OAuth/app install action types.

### Fields that identify the credential
- `account` (Event object): Installing (connected) account id on app events
- `stripe_user_id` (/v1/oauth/token response): Account the token grants access to
- `scope` (/v1/oauth/token response): stripe_apps
- `request.id` (Event object): Request that triggered an event

### Lifecycle events
- create: `apps.install.created` App installed (app.install.created on older API versions)
- create: `account.application.authorized` Account connects or installs app
- change: `apps.install.updated` App updated or reauthorized
- revoke: `apps.install.deleted` App uninstalled
- revoke: `account.application.deauthorized` Account disconnects or uninstalls app

### Correlate on
`account`, `stripe_user_id`, `request.id`, `livemode`, `context`

### API calls a holder can make, and whether they are logged
- collection: `GET /v1/customers`. Customer records the app has permission to read Logged: yes. Workbench request log (Dashboard > Workbench > Logs), not Security history; retention not stated. Docs do not say how app-token requests are labeled in the log.

### What to look for (analyst guidance)
- Unexpected apps.install.created / account.application.authorized for an app nobody in the business requested
- API activity from the app's access token in the installing account after apps.install.deleted
- Refresh token used from two backends (old refresh token reused after roll fails) - developer-side signal
- App access token calling endpoints beyond the app's declared permissions pattern (bulk customer reads)
- Burst of /v1/oauth/token code exchanges on the developer account from a new IP

### Sample query (Stripe Events API (HTTP GET))
List recent app installs/uninstalls to spot unexpected app grants (30-day window).

```
curl -G https://api.stripe.com/v1/events -u "$SK:" -d "types[]=apps.install.created" -d "types[]=apps.install.deleted" -d "types[]=account.application.authorized" -d "types[]=account.application.deauthorized" -d "created[gte]=1788998400"
```

## Respond: how to revoke it
- Admin: **Uninstall app**. An Administrator removes an installed app. Where: Installed Apps page > ⋯ > Uninstall.

Installing account: uninstall the app (Settings > Installed apps). Developer: rotate the developer secret key used at /v1/oauth/token (stripe-1) and delete stored refresh tokens. Connect OAuth (deprecated) platforms: POST https://connect.stripe.com/oauth/deauthorize. Live access ends on revocation: unknown. Docs do not state whether uninstall immediately invalidates issued access/refresh tokens. Access tokens expire after 1 hour regardless.

## No vendor documentation found
- Admin can block or require approval
- SSO and MFA rules apply
- IP restriction
- Revocation ends active access
- Access/refresh token prefix and format
- Whether uninstall revokes outstanding access and refresh tokens immediately
- Revocation endpoint for Stripe Apps OAuth tokens (Connect deauthorize applies to Connect OAuth)
- Request log field identifying which app/token made a call
- Logging of failed token exchanges
- No account setting found to forbid creating unrestricted secret keys or to require key expiry.
- Whether access policies and approval rules can be attached to organization API keys.
- Whether uninstalling a Stripe App immediately revokes its OAuth refresh tokens is not stated.
- Which organization roles can create org API keys or service principals, and how to disable a service principal.
- Approval rules' actor condition for service principals is mentioned on the service principals page but not described on the approvals page.

## Sources
- [API keys | Stripe Documentation](https://docs.stripe.com/keys) (retrieved 2026-10-09)
- [OAuth 2.0 | Stripe Documentation](https://docs.stripe.com/stripe-apps/api-authentication/oauth) (retrieved 2026-10-09)
- [Workload Identity Federation | Stripe Documentation](https://docs.stripe.com/workload-identity-federation) (retrieved 2026-10-12)
- [Connect OAuth reference | Stripe Documentation](https://docs.stripe.com/connect/oauth-reference) (retrieved 2026-10-09)
- [API authentication methods | Stripe Documentation](https://docs.stripe.com/stripe-apps/api-authentication) (retrieved 2026-10-12)
- [How do I install a Stripe App? : Stripe: Help & Support](https://support.stripe.com/questions/how-do-i-install-a-stripe-app) (retrieved 2026-10-14)
- [How can I uninstall an App?](https://support.stripe.com/questions/how-can-i-uninstall-an-app) (retrieved 2026-10-13)
- [How Workbench works](https://docs.stripe.com/workbench/overview) (retrieved 2026-10-12)
- [Stripe Apps: Add server-side logic](https://docs.stripe.com/stripe-apps/build-backend) (retrieved 2026-10-12)
- [List all events](https://docs.stripe.com/api/events/list) (retrieved 2026-10-12)
- [The Event object](https://docs.stripe.com/api/events/object) (retrieved 2026-10-12)
- [List all customers | Stripe API Reference](https://docs.stripe.com/api/customers/list) (retrieved 2026-10-14)
- [User roles](https://docs.stripe.com/get-started/account/teams/roles) (retrieved 2026-10-13)
