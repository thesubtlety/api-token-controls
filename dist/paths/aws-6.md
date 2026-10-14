# AWS: IAM Roles Anywhere (X.509 certificate to role session)

`aws-6` · X.509 certificate · service. Workloads outside AWS sign a CreateSession request with a private key and X.509 certificate from a registered trust anchor CA and receive temporary role credentials.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | DisableTrustAnchor | DisableTrustAnchor: POST /trustanchor/{trustAnchorId}/disable |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | Not a setting: an identity policy or SCP that denies requests when aws:SourceIp is outside allowed ranges. It is evaluated on every signed API request. aws:SourceIp is absent for calls through VPC endpoints (use aws:VpcSourceIp) and SCPs do not cover the management account. | Where: Role identity policy with Deny * / NotIpAddress aws:SourceIp, or AWS Organizations console > Policies > Service control policies > Create policy (Deny * with NotIpAddress aws:SourceIp) > attach to OU/account · Command: aws iam put-role-policy (inline deny) or aws organizations attach-policy |
| Protect: Expires automatically | Yes | Session 15 min-12 h | API: PATCH /profile/{profileId} with durationSeconds (900-43200) · Command: aws rolesanywhere update-profile --profile-id <id> --duration-seconds <n> |
| Detect: Usage appears in logs | Yes | userIdentity role session name | AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included. · CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra. |
| Detect: Data reads appear in logs | Conditional | S3 object-level data event; only logged if data events are enabled on a trail (extra cost). | Where: CloudTrail console > Trails > trail > Data events > Edit > enable S3 data events; then filter trail logs on eventName=GetObject (not in Event history) · Command: aws cloudtrail put-event-selectors --trail-name <trail> --advanced-event-selectors (resources.type=AWS::S3::Object) |
| Respond: Revocation ends active access | Partial | CRL blocks new sessions; existing sessions need role session revocation. | Where: IAM console > Roles > role > Revoke sessions > Revoke active sessions (CRL import is API/CLI only) · API: POST /crls (ImportCrl); POST /trustanchor/{trustAnchorId}/disable · Command: aws rolesanywhere import-crl |
| Respond: Stops working when user is removed | N/A | Credentials are bound to an X.509 certificate and a trust anchor, not to a user. |  |

## Protect: what an admin can configure

### Admin controls
- **aws:SourceIp deny policy** (Limit network; all plans; default off). Identity policy or SCP that denies any request from outside listed CIDR ranges. Where: IAM policy / SCP with NotIpAddress aws:SourceIp.
- **DisableTrustAnchor** (Disable; all plans; default unknown). A disabled trust anchor makes temporary credential requests that specify it unauthorized. Where: POST /trustanchor/{trustAnchorId}/disable.

### Not available (vendor states)
- No live OCSP or CRL distribution point checks; revocation needs a manual CRL import.

- Network: conditional (checked at api_request). Not a setting: an identity policy or SCP that denies requests when aws:SourceIp is outside allowed ranges. It is evaluated on every signed API request. aws:SourceIp is absent for calls through VPC endpoints (use aws:VpcSourceIp) and SCPs do not cover the management account.
- Lifetime: Session 15 min-12 h. Renewal: Call CreateSession again with the certificate.
- Keyless option: supported. Trust is delegated to the customer PKI (trust anchor).
- Conditions: No OCSP or CDP callbacks.

## Detect: what gets logged
- Token prefix: `ASIA`

### Logs
- AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included.
- CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra.

### Fields that identify the credential
- `userIdentity role session name` (CloudTrail): Hex-encoded certificate serial number.

### Lifecycle events
- create: `CreateSession` Logged with additionalEventData on signing.

### Correlate on
`certificate serial (role session name)`, `trust anchor ARN`

### API calls a holder can make, and whether they are logged
- recon: `POST sts:GetCallerIdentity`. Account, ARN, user/role ID Logged: yes (`GetCallerIdentity`). All STS calls logged as management events; cannot be denied by policy.
- enumeration (bulk): `GetAccountAuthorizationDetails`. All IAM users, groups, roles, policies Logged: yes (`GetAccountAuthorizationDetails`). IAM management event.
- discovery (bulk): `GET / (s3:ListBuckets)`. All buckets owned by the account Logged: unknown (`ListBuckets`). Management/data classification not verified on fetched pages.
- collection (bulk): `GET /{Key} (s3:GetObject)`. Object contents Logged: plan (`GetObject`). S3 object-level data event; only logged if data events are enabled on a trail (extra cost).

### Public detection rules (community, not vendor documentation)
- [AWS IAM Roles Anywhere Trust Anchor Created with External CA](https://github.com/elastic/detection-rules/blob/main/rules/integrations/aws/persistence_iam_roles_anywhere_trusted_anchor_created_with_external_ca.toml) (Elastic): An IAM Roles Anywhere trust anchor was created with a CA that is not AWS Private CA.
- [AWS IAM Roles Anywhere Profile Creation](https://github.com/elastic/detection-rules/blob/main/rules/integrations/aws/persistence_iam_roles_anywhere_profile_created.toml) (Elastic): An IAM Roles Anywhere profile was created.

### What to look for (analyst guidance)
- Sessions from unexpected certificate serials

## Respond: how to revoke it
- Admin: **Revoke active sessions (AWSRevokeOlderSessions)**. Attaches a deny-all policy for sessions issued before now, invalidating existing temporary credentials for the role. Where: IAM > Roles > role > Revoke sessions tab.
- Admin: **aws:TokenIssueTime deny policy**. Deny policy that blocks temporary credentials issued before a chosen time; does not affect long-term keys. Where: IAM policy with DateLessThan aws:TokenIssueTime.
- Admin: **Import CRL (ImportCrl)**. Imports a CA revocation list so revoked certificates can no longer create sessions. Where: API ImportCrl / CLI import-crl.

Import CRL listing the certificate; revoke active sessions on the role; disable trust anchor/profile. Live access ends on revocation: partial. CRL blocks new sessions; existing sessions need role session revocation.

## No vendor documentation found
- Admin can list all of them
- SSO and MFA rules apply
- Whether long-term Bedrock API keys can be set to never expire, and their maximum lifetime.
- Token format/prefix for Bedrock API keys (not documented on fetched pages).
- Which CloudTrail field identifies the specific Bedrock API key on a request (key value is not logged).
- Default session duration for IAM Roles Anywhere when durationSeconds is omitted.
- Exact CloudTrail eventName strings for CreateAccessKey/UpdateAccessKey/DeleteAccessKey were not shown on fetched pages (they match the IAM API action names, which CloudTrail logs).

## Sources
- [What is AWS Identity and Access Management Roles Anywhere? - IAM Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html) (retrieved 2026-10-14)
- [Get temporary security credentials from IAM Roles Anywhere - IAM Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/credential-helper.html) (retrieved 2026-10-14)
- [AWS: Denies access to AWS based on the source IP - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_aws_deny-ip.html) (retrieved 2026-10-14)
- [AWS global condition context keys - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html) (retrieved 2026-10-14)
- [Service control policies (SCPs) - AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html) (retrieved 2026-10-14)
- [The IAM Roles Anywhere trust model - IAM Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/trust-model.html) (retrieved 2026-10-14)
- [DisableTrustAnchor - IAM Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/APIReference/API_DisableTrustAnchor.html) (retrieved 2026-10-14)
- [Adding and removing IAM identity permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_manage-attach-detach.html) (retrieved 2026-10-14)
- [Creating organization policies with AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_create.html) (retrieved 2026-10-14)
- [Attaching organization policies with AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_attach.html) (retrieved 2026-10-14)
- [aws rolesanywhere update-profile](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/rolesanywhere/update-profile.html) (retrieved 2026-10-14)
- [UpdateProfile](https://docs.aws.amazon.com/rolesanywhere/latest/APIReference/API_UpdateProfile.html) (retrieved 2026-10-14)
- [CreateSession API](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/authentication-create-session.html) (retrieved 2026-10-14)
- [Logging data events - AWS CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-data-events-with-cloudtrail.html) (retrieved 2026-10-14)
- [Viewing recent management events with the console](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events-console.html) (retrieved 2026-10-14)
- [ImportCrl](https://docs.aws.amazon.com/rolesanywhere/latest/APIReference/API_ImportCrl.html) (retrieved 2026-10-14)
- [Revoke IAM role temporary security credentials - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html) (retrieved 2026-10-14)
- [Logging IAM Roles Anywhere API calls using AWS CloudTrail - IAM Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/logging-using-cloudtrail.html) (retrieved 2026-10-14)
- [Logging IAM and AWS STS API calls with AWS CloudTrail - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/cloudtrail-integration.html) (retrieved 2026-10-14)
- [GetCallerIdentity - AWS Security Token Service](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetCallerIdentity.html) (retrieved 2026-10-14)
- [ListBuckets - Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html) (retrieved 2026-10-14)
- [GetObject - Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html) (retrieved 2026-10-14)
- [GetAccountAuthorizationDetails - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetAccountAuthorizationDetails.html) (retrieved 2026-10-14)
