# AWS: IAM Identity Center credentials for AWS CLI/SDK

`aws-5` · Federated identity · person. User signs in to the AWS access portal (device code flow via aws configure sso); the CLI calls GetRoleCredentials to get short-term STS credentials for a permission set role, refreshing them while the portal session is active.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | No docs found | No documented control found. |  |
| Protect: SSO and MFA rules apply | Yes | CLI/SDK role credentials are obtained from the user's Identity Center sign-in session, which uses the org's identity source. | Where: IAM Identity Center console > Settings > Authentication tab > Multi-factor authentication > Configure (external IdP: set MFA in the IdP) |
| Protect: IP restriction | Conditional | Not a setting: an identity policy or SCP that denies requests when aws:SourceIp is outside allowed ranges. It is evaluated on every signed API request. aws:SourceIp is absent for calls through VPC endpoints (use aws:VpcSourceIp) and SCPs do not cover the management account. | Where: AWS Organizations console > Policies > Service control policies > Create policy (Deny * with NotIpAddress aws:SourceIp) > attach to OU/account (roles created by permission sets cannot be edited in IAM) · Command: aws organizations attach-policy |
| Protect: Expires automatically | Yes | Role creds 1-12 h (default 1 h); portal session up to 90 days | Permission set session duration: IAM Identity Center > Permission sets > Session duration |
| Detect: Usage appears in logs | Yes | userIdentity.onBehalfOf.userId, userIdentity.credentialId | AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included. · CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra. |
| Detect: Data reads appear in logs | Conditional | S3 object-level data event; only logged if data events are enabled on a trail (extra cost). | Where: CloudTrail console > Trails > trail > Data events > Edit > enable S3 data events; then filter trail logs on eventName=GetObject (not in Event history) · Command: aws cloudtrail put-event-selectors --trail-name <trail> --advanced-event-selectors (resources.type=AWS::S3::Object) |
| Respond: Revocation ends active access | Partial | Disabling the user alone leaves existing role sessions working up to 12 h. | Where: Add user ID to the pre-staged SCP Deny; IAM Identity Center > AWS accounts > account > Assigned users and groups > Remove access; Users > user > Disable user access; keep the deny for 12 h |
| Respond: Stops working when user is removed | Partial | Deleting or disabling the user blocks new sessions immediately, but existing IAM role sessions continue for up to 12 hours. | Where: IAM Identity Center console > Users > user > General information > Disable user access (or delete user) |

## Protect: what an admin can configure

### Admin controls
- **aws:SourceIp deny policy** (Limit network; all plans; default off). Identity policy or SCP that denies any request from outside listed CIDR ranges. Where: IAM policy / SCP with NotIpAddress aws:SourceIp.
- **Permission set session duration** (Limit lifetime; all plans; default on). Sets how long Identity Center role credentials last (1-12 h, default 1 h). Where: IAM Identity Center > Permission sets > Session duration.

- Network: conditional (checked at api_request). Not a setting: an identity policy or SCP that denies requests when aws:SourceIp is outside allowed ranges. It is evaluated on every signed API request. aws:SourceIp is absent for calls through VPC endpoints (use aws:VpcSourceIp) and SCPs do not cover the management account.
- Lifetime: Role creds 1-12 h (default 1 h); portal session up to 90 days. Renewal: CLI refreshes role credentials automatically while the portal session lasts.
- Keyless option: supported. Credentials come from the Identity Center session, which follows the configured identity source. Disabling the user blocks new sessions, but existing IAM role sessions continue until their permission-set duration ends (max 12 h).
- Conditions: IAM revoke-sessions cannot be used on roles created from permission sets.

## Detect: what gets logged
- Token prefix: `ASIA`

### Logs
- AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included.
- CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra.

### Fields that identify the credential
- `userIdentity.onBehalfOf.userId` (CloudTrail): Identity Center user ID for user-initiated events.
- `userIdentity.credentialId` (CloudTrail): Identity Center credential identifier.

### Lifecycle events
- create: `GetRoleCredentials` Portal API call that returns STS credentials (logging not verified on fetched pages).

### Correlate on
`onBehalfOf.userId`, `credentialId`, `role session name`

### API calls a holder can make, and whether they are logged
- recon: `POST sts:GetCallerIdentity`. Account, ARN, user/role ID Logged: yes (`GetCallerIdentity`). All STS calls logged as management events; cannot be denied by policy.
- enumeration (bulk): `GetAccountAuthorizationDetails`. All IAM users, groups, roles, policies Logged: yes (`GetAccountAuthorizationDetails`). IAM management event.
- discovery (bulk): `GET / (s3:ListBuckets)`. All buckets owned by the account Logged: unknown (`ListBuckets`). Management/data classification not verified on fetched pages.
- collection (bulk): `GET /{Key} (s3:GetObject)`. Object contents Logged: plan (`GetObject`). S3 object-level data event; only logged if data events are enabled on a trail (extra cost).

### What to look for (analyst guidance)
- Role sessions after user is disabled

## Respond: how to revoke it
- Admin: **Deny policy for Identity Center user (SCP with user ID)**. Pre-staged SCP deny that, once the user ID is added, blocks all actions from the user's active role sessions. Where: AWS Organizations SCP.
- Admin: **Disable user access (IAM Identity Center)**. Disabling or deleting an Identity Center user blocks new portal sign-in and new IAM role sessions. Where: IAM Identity Center console > Users.

Add user ID to pre-staged SCP deny, remove assignments, disable user. Live access ends on revocation: partial. Disabling the user alone leaves existing role sessions working up to 12 h.

## No vendor documentation found
- Admin can list all of them
- Admin can block or require approval
- Exact CloudTrail eventName for portal GetRoleCredentials.
- Whether long-term Bedrock API keys can be set to never expire, and their maximum lifetime.
- Token format/prefix for Bedrock API keys (not documented on fetched pages).
- Which CloudTrail field identifies the specific Bedrock API key on a request (key value is not logged).
- Default session duration for IAM Roles Anywhere when durationSeconds is omitted.
- Exact CloudTrail eventName strings for CreateAccessKey/UpdateAccessKey/DeleteAccessKey were not shown on fetched pages (they match the IAM API action names, which CloudTrail logs).

## Sources
- [Getting IAM Identity Center user credentials for the AWS CLI or AWS SDKs - AWS IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/howtogetcredentials.html) (retrieved 2026-10-14)
- [GetRoleCredentials - AWS IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/PortalAPIReference/API_GetRoleCredentials.html) (retrieved 2026-10-14)
- [Understanding authentication sessions in IAM Identity Center - AWS IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/authconcept.html) (retrieved 2026-10-14)
- [AWS: Denies access to AWS based on the source IP - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_aws_deny-ip.html) (retrieved 2026-10-14)
- [AWS global condition context keys - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html) (retrieved 2026-10-14)
- [Service control policies (SCPs) - AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html) (retrieved 2026-10-14)
- [Set session duration for AWS accounts - AWS IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/howtosessionduration.html) (retrieved 2026-10-14)
- [Use a Deny policy to revoke active user permissions - AWS IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/prereqs-revoking-user-permissions.html) (retrieved 2026-10-14)
- [Revoke user access - AWS IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/revoke-user-permissions.html) (retrieved 2026-10-14)
- [Prompt users for MFA](https://docs.aws.amazon.com/singlesignon/latest/userguide/mfa-getting-started.html) (retrieved 2026-10-14)
- [Creating organization policies with AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_create.html) (retrieved 2026-10-14)
- [Attaching organization policies with AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_attach.html) (retrieved 2026-10-14)
- [Revoke IAM role temporary security credentials - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html) (retrieved 2026-10-14)
- [Logging data events - AWS CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-data-events-with-cloudtrail.html) (retrieved 2026-10-14)
- [Viewing recent management events with the console](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events-console.html) (retrieved 2026-10-14)
- [Remove user and group access to an AWS account](https://docs.aws.amazon.com/singlesignon/latest/userguide/howtoremoveaccess.html) (retrieved 2026-10-14)
- [Disable user access in IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/disableuser.html) (retrieved 2026-10-14)
- [CloudTrail userIdentity element - AWS CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference-user-identity.html) (retrieved 2026-10-14)
- [Logging IAM and AWS STS API calls with AWS CloudTrail - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/cloudtrail-integration.html) (retrieved 2026-10-14)
- [GetCallerIdentity - AWS Security Token Service](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetCallerIdentity.html) (retrieved 2026-10-14)
- [ListBuckets - Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html) (retrieved 2026-10-14)
- [GetObject - Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html) (retrieved 2026-10-14)
- [GetAccountAuthorizationDetails - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetAccountAuthorizationDetails.html) (retrieved 2026-10-14)
