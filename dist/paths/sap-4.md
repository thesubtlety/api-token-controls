# SAP BTP and S/4HANA Cloud: btp CLI session token

`sap-4` · Signed JWT · person. `btp login` stores a session token in the local config file (e.g. ~/Library/Application Support/.btp/config.json on macOS). Login can be SSO via browser (`--sso`, `--idp`) or user/password.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Partial | Login can go through the IdP with --sso (recommended), but password login against SAP ID service is also allowed. | Where: BTP cockpit > global account > Security > Trust Configuration > Establish Trust (custom IdP for platform users) · Command: btp login --sso [--idp <TENANT>]; make default: btp set config --login.sso browser |
| Protect: IP restriction | No docs found | No btp CLI IP restriction documented. |  |
| Protect: Expires automatically | Yes | 12h max session | Where: Fixed: max session 12 hours, not configurable in docs · Command: btp logout (ends session early) |
| Detect: Usage appears in logs | Partial | Log source documented; no field identifies the credential. | SAP Audit Log service (BTP subaccount): Audit Log Viewer or Retrieval API GET <url>/auditlog/v2/auditlogrecords; 90 days free, longer with Audit Log service premium edition (support ticket). |
| Detect: Data reads appear in logs | No docs found | No collection call researched. |  |
| Respond: Revocation ends active access | No docs found | No server-side session revocation documented. |  |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
No docs found.

- Network: unknown (checked at unknown). No btp CLI IP restriction documented.
- Lifetime: 12h max session. Renewal: User logs in again after 12h.
- Keyless option: limited. SSO login goes through the IdP; password login against SAP ID service is also documented. Once issued, the token is reused for 12h without re-checking the IdP (not stated explicitly).
- Conditions: 

## Detect: what gets logged
- Token prefix: not established

### Logs
- SAP Audit Log service (BTP subaccount): Audit Log Viewer or Retrieval API GET <url>/auditlog/v2/auditlogrecords; 90 days free, longer with Audit Log service premium edition (support ticket).

### Fields that identify the credential
No docs found.

### Lifecycle events
No docs found.

### Correlate on
`user name`, `origin key`

### API calls a holder can make, and whether they are logged
- recon: `btp get accounts/global-account`. Global account details Logged: unknown. 

### What to look for (analyst guidance)
- Copied config.json reused from another host

## Respond: how to revoke it


Remove the user's role collections or disable the user at the IdP; token expires within 12h. Live access ends on revocation: unknown. No server-side session revocation documented.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- IP restriction
- Data reads appear in logs
- Revocation ends active access
- Stops working when user is removed
- Whether btp CLI session use is audit logged
- Any IP/network allowlist for XSUAA clients, btp API credentials, IAS API secrets or S/4HANA communication users.
- Whether XSUAA password-grant tokens (cis service keys) honor IAS/corporate IdP MFA or conditional access.
- Exact audit message for service key deletion and for API credential create/delete in XSUAA audit log.
- Whether communication user passwords expire.
- Org-wide switch to block creation of service keys or API credentials (none found).
- IAS audit event emitted on client secret creation/deletion (change log covers admin CREATE/UPDATE/DELETE generally).

## Sources
- [Log in (btp CLI)](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/log-in-e241b30.md) (retrieved 2026-10-14)
- [Log in with Single Sign-On](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/log-in-with-single-sign-on-b2a56a8.md) (retrieved 2026-10-14)
- [Establish Trust and Federation of Custom Identity Providers for Platform Users](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/establish-trust-and-federation-of-custom-identity-providers-for-platform-users-c368984.md) (retrieved 2026-10-14)
- [Working with Global Accounts, Directories, and Subaccounts Using the btp CLI](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/working-with-global-accounts-directories-and-subaccounts-using-the-btp-cli-85a683e.md) (retrieved 2026-10-14)
