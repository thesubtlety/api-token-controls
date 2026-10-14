# AWS: IAM role temporary credentials (AWS STS AssumeRole)

`aws-3` · HMAC · service. STS returns temporary credentials (ASIA... key ID, secret, session token) for a role. Caller must already hold AWS credentials and be trusted by the role trust policy.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Role trust policy | Role trust policy: IAM console > Roles > Trust relationships / aws iam update-assume-role-policy |
| Protect: SSO and MFA rules apply | Partial | Not tied to the IdP, but a role's trust policy can require MFA before the role can be assumed. | Where: Role trust policy: add Condition Bool aws:MultiFactorAuthPresent = true on sts:AssumeRole |
| Protect: IP restriction | Conditional | Not a setting: an identity policy or SCP that denies requests when aws:SourceIp is outside allowed ranges. It is evaluated on every signed API request. aws:SourceIp is absent for calls through VPC endpoints (use aws:VpcSourceIp) and SCPs do not cover the management account. | Where: Role identity policy with Deny * / NotIpAddress aws:SourceIp, or AWS Organizations console > Policies > Service control policies > Create policy (Deny * with NotIpAddress aws:SourceIp) > attach to OU/account · Command: aws iam put-role-policy (inline deny) or aws organizations attach-policy |
| Protect: Expires automatically | Yes | 15 min to role max (1-12 h, default 1 h); role chaining capped at 1 h | Maximum session duration: IAM > Roles > Edit > Maximum session duration; UpdateRole |
| Detect: Usage appears in logs | Yes | userIdentity.accessKeyId, userIdentity.sessionContext.sessionIssuer.arn | AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included. · CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra. |
| Detect: Data reads appear in logs | Conditional | S3 object-level data event; only logged if data events are enabled on a trail (extra cost). | Where: CloudTrail console > Trails > trail > Data events > Edit > enable S3 data events; then filter trail logs on eventName=GetObject (not in Event history) · Command: aws cloudtrail put-event-selectors --trail-name <trail> --advanced-event-selectors (resources.type=AWS::S3::Object) |
| Respond: Revocation ends active access | Yes | Applies to all sessions of the role, not just one; ~30 s propagation; not possible for service-linked roles. | IAM > Roles > Revoke active sessions (AWSRevokeOlderSessions) or deny aws:TokenIssueTime before now; fix trust policy. |
| Respond: Stops working when user is removed | N/A | Role sessions belong to a role, not a user; already-issued sessions stay valid until they expire unless permissions are removed. |  |

## Protect: what an admin can configure

### Admin controls
- **aws:SourceIp deny policy** (Limit network; all plans; default off). Identity policy or SCP that denies any request from outside listed CIDR ranges. Where: IAM policy / SCP with NotIpAddress aws:SourceIp.
- **Maximum session duration** (Limit lifetime; all plans; default on). Caps role session length at 1-12 hours (default 1 hour). Where: IAM > Roles > Edit > Maximum session duration; UpdateRole.
- **Role trust policy** (Disable; all plans; default varies). The trust policy decides which principals can assume a role; removing a principal stops new sessions for it. Where: IAM console > Roles > Trust relationships / aws iam update-assume-role-policy.
- **MFA condition in role trust policy (aws:MultiFactorAuthPresent)** (Require SSO; all plans; default off). A trust policy can require that the caller authenticated with MFA before assuming the role. Where: Role trust policy Condition aws:MultiFactorAuthPresent.

### Not available (vendor states)
- Sessions of service-linked roles cannot be revoked.

- Network: conditional (checked at api_request). Not a setting: an identity policy or SCP that denies requests when aws:SourceIp is outside allowed ranges. It is evaluated on every signed API request. aws:SourceIp is absent for calls through VPC endpoints (use aws:VpcSourceIp) and SCPs do not cover the management account.
- Lifetime: 15 min to role max (1-12 h, default 1 h); role chaining capped at 1 h. Renewal: Call AssumeRole again for new credentials.
- Keyless option: not_applicable. Role assumption from existing AWS credentials; external IdP federation is covered in aws-4 and aws-5.
- Conditions: Service-linked role sessions cannot be revoked.

## Detect: what gets logged
- Token prefix: `ASIA`

### Logs
- AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included.
- CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra.

### Fields that identify the credential
- `userIdentity.accessKeyId` (CloudTrail): Key ID used to sign the request; may be empty for security reasons.
- `userIdentity.sessionContext.sessionIssuer.arn` (CloudTrail): Role that issued the session.

### Lifecycle events
- create: `AssumeRole` Logged in caller and role accounts; denied cross-account assumptions not logged in target account.

### Correlate on
`userIdentity.accessKeyId (ASIA)`, `responseElements.credentials.accessKeyId in AssumeRole event`, `sourceIdentity`, `roleSessionName`

### API calls a holder can make, and whether they are logged
- recon: `POST sts:GetCallerIdentity`. Account, ARN, user/role ID Logged: yes (`GetCallerIdentity`). All STS calls logged as management events; cannot be denied by policy.
- enumeration (bulk): `GetAccountAuthorizationDetails`. All IAM users, groups, roles, policies Logged: yes (`GetAccountAuthorizationDetails`). IAM management event.
- discovery (bulk): `GET / (s3:ListBuckets)`. All buckets owned by the account Logged: unknown (`ListBuckets`). Management/data classification not verified on fetched pages.
- collection (bulk): `GET /{Key} (s3:GetObject)`. Object contents Logged: plan (`GetObject`). S3 object-level data event; only logged if data events are enabled on a trail (extra cost).

### Public detection rules (community, not vendor documentation)
- [AWS Console GetSigninToken Potential Abuse](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_console_getsignintoken.yml) (Panther): GetSigninToken from a non-SSO user agent, used to turn CLI credentials into a console session.
- [AWS Console GetSigninToken Potential Abuse](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_console_getsignintoken.yml) (Sigma): GetSigninToken from a user agent other than the console federation endpoint.
- [AWS IMDS Credential Usage Outside Expected Services](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_imds_credential_exfiltration.yml) (Panther): EC2 instance role credentials used from a public IP outside expected AWS services, indicating stolen IMDS credentials.
- [Malicious Usage Of IMDS Credentials Outside Of AWS Infrastructure](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_cloudtrail_imds_malicious_usage.yml) (Sigma): EC2 instance role session credentials used outside AWS infrastructure.
- [AWS STS AssumeRole Misuse](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_sts_assumerole_misuse.yml) (Sigma): Activity by an assumed-role session whose issuer is a role (role temporary credentials in use).
- [AWS ECS Task Definition That Queries The Credential Endpoint](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_ecs_task_definition_cred_endpoint_query.yml) (Sigma): ECS task definitions whose command reads the container credentials endpoint ($AWS_CONTAINER_CREDENTIALS_RELATIVE_URI).
- [IAM Assume Role Blocklist Ignored](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_iam_assume_role_blocklist_ignored.yml) (Panther): An IAM user or federated user assumed a role on a blocklist (disabled by default).
- [RoleAssumes by Multiple Useragents](https://github.com/panther-labs/panther-analysis/blob/develop/queries/aws_queries/anomalous_role_assume_query.yml) (Panther): Saved query: AssumeRole calls for one role and principal from more than one user agent in a day.
- [AWS Potentially Stolen Service Role](https://github.com/panther-labs/panther-analysis/blob/develop/queries/aws_queries/aws_potentially_compromised_service_role.yml) (Panther): Scheduled rule: a role assumed by an AWS service and also by a user within 24 hours.

### What to look for (analyst guidance)
- AssumeRole from unexpected principal
- Role chaining across accounts

## Respond: how to revoke it
- Admin: **Revoke active sessions (AWSRevokeOlderSessions)**. Attaches a deny-all policy for sessions issued before now, invalidating existing temporary credentials for the role. Where: IAM > Roles > role > Revoke sessions tab.
- Admin: **aws:TokenIssueTime deny policy**. Deny policy that blocks temporary credentials issued before a chosen time; does not affect long-term keys. Where: IAM policy with DateLessThan aws:TokenIssueTime.

IAM > Roles > Revoke active sessions (AWSRevokeOlderSessions) or deny aws:TokenIssueTime before now; fix trust policy. Live access ends on revocation: yes. Applies to all sessions of the role, not just one; ~30 s propagation; not possible for service-linked roles.

## No vendor documentation found
- Admin can list all of them
- Whether long-term Bedrock API keys can be set to never expire, and their maximum lifetime.
- Token format/prefix for Bedrock API keys (not documented on fetched pages).
- Which CloudTrail field identifies the specific Bedrock API key on a request (key value is not logged).
- Default session duration for IAM Roles Anywhere when durationSeconds is omitted.
- Exact CloudTrail eventName strings for CreateAccessKey/UpdateAccessKey/DeleteAccessKey were not shown on fetched pages (they match the IAM API action names, which CloudTrail logs).

## Sources
- [Programmatic access with AWS security credentials - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/security-creds-programmatic-access.html) (retrieved 2026-10-14)
- [Disabling permissions for temporary security credentials - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_control-access_disable-perms.html) (retrieved 2026-10-14)
- [AWS: Denies access to AWS based on the source IP - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_aws_deny-ip.html) (retrieved 2026-10-14)
- [AWS global condition context keys - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html) (retrieved 2026-10-14)
- [Service control policies (SCPs) - AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html) (retrieved 2026-10-14)
- [AssumeRole - AWS Security Token Service](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html) (retrieved 2026-10-14)
- [Update settings for a role - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_update-role-settings.html) (retrieved 2026-10-14)
- [Revoke IAM role temporary security credentials - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html) (retrieved 2026-10-14)
- [Secure API access with MFA - IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_configure-api-require.html) (retrieved 2026-10-14)
- [Adding and removing IAM identity permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_manage-attach-detach.html) (retrieved 2026-10-14)
- [Creating organization policies with AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_create.html) (retrieved 2026-10-14)
- [Attaching organization policies with AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_attach.html) (retrieved 2026-10-14)
- [Logging data events - AWS CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-data-events-with-cloudtrail.html) (retrieved 2026-10-14)
- [Viewing recent management events with the console](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events-console.html) (retrieved 2026-10-14)
- [Logging IAM and AWS STS API calls with AWS CloudTrail - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/cloudtrail-integration.html) (retrieved 2026-10-14)
- [GetCallerIdentity - AWS Security Token Service](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetCallerIdentity.html) (retrieved 2026-10-14)
- [ListBuckets - Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html) (retrieved 2026-10-14)
- [GetObject - Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html) (retrieved 2026-10-14)
- [GetAccountAuthorizationDetails - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetAccountAuthorizationDetails.html) (retrieved 2026-10-14)
- [Update a role trust policy](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_update-role-trust-policy.html) (retrieved 2026-10-14)
