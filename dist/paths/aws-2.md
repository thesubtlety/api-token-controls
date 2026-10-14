# AWS: Root user access keys

`aws-2` · HMAC · person. Access key pair for the AWS account root user; signs API calls with full, unrestrictable account access.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | The IAM credential report includes the root user and access key status for each account. | Where: IAM console > Credential report > Download Report · API: GenerateCredentialReport, then GetCredentialReport · Command: aws iam generate-credential-report; aws iam get-credential-report |
| Protect: Admin can block or require approval | Yes | AWS-GR_RESTRICT_ROOT_USER_ACCESS_KEYS | AWS-GR_RESTRICT_ROOT_USER_ACCESS_KEYS: AWS Control Tower > Controls |
| Protect: SSO and MFA rules apply | Not available | AWS says root user access keys cannot be used with MFA-protected API access. |  |
| Protect: IP restriction | Conditional | Only via an SCP on member accounts with aws:SourceIp. IAM identity policies cannot be attached to the root user, and SCPs do not affect the management account. | Where: AWS Organizations console > Policies > Service control policies > Create policy (Deny * with NotIpAddress aws:SourceIp) > attach to OU/account (member accounts only) · Command: aws organizations create-policy --type SERVICE_CONTROL_POLICY; aws organizations attach-policy |
| Protect: Expires automatically | Not available | Long-term, no expiry |  |
| Detect: Usage appears in logs | Yes | userIdentity.accessKeyId | AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included. · CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra. |
| Detect: Data reads appear in logs | Conditional | S3 object-level data event; only logged if data events are enabled on a trail (extra cost). | Where: CloudTrail console > Trails > trail > Data events > Edit > enable S3 data events; then filter trail logs on eventName=GetObject (not in Event history) · Command: aws cloudtrail put-event-selectors --trail-name <trail> --advanced-event-selectors (resources.type=AWS::S3::Object) |
| Respond: Revocation ends active access | Yes | Root permissions cannot be scoped down by IAM policy, so deletion is the only fix. | Delete the key as root, or from the management account via centralized root access management. |
| Respond: Stops working when user is removed | No docs found | No vendor documentation found. |  |

## Protect: what an admin can configure

### Admin controls
- **AWS-GR_RESTRICT_ROOT_USER_ACCESS_KEYS** (Disable; AWS Control Tower; default unknown). Control Tower preventive control (SCP) that denies iam:CreateAccessKey for the root principal. Where: AWS Control Tower > Controls.
- **aws:SourceIp deny policy** (Limit network; all plans; default off). Identity policy or SCP that denies any request from outside listed CIDR ranges. Where: IAM policy / SCP with NotIpAddress aws:SourceIp.

### Not available (vendor states)
- IAM policies cannot restrict the root user's permissions.

- Network: conditional (checked at api_request). Only via an SCP on member accounts with aws:SourceIp. IAM identity policies cannot be attached to the root user, and SCPs do not affect the management account.
- Lifetime: Long-term, no expiry. Renewal: Reused until deleted; up to two keys.
- Keyless option: not_verified. Root keys are tied to the account root user, not to any IdP. Docs do not discuss IdP policy for them.
- Conditions: Requires AWS Organizations; centralized root access must be enabled.

## Detect: what gets logged
- Token prefix: `AKIA`

### Logs
- AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included.
- CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra.

### Fields that identify the credential
- `userIdentity.accessKeyId` (CloudTrail): Key ID used to sign the request; may be empty for security reasons.

### Lifecycle events
- create: `CreateAccessKey` Root-only; console or API.
- revoke: `DeleteAccessKey` 

### Correlate on
`userIdentity.type Root`, `userIdentity.accessKeyId`, `sourceIPAddress`

### API calls a holder can make, and whether they are logged
- recon: `POST sts:GetCallerIdentity`. Account, ARN, user/role ID Logged: yes (`GetCallerIdentity`). All STS calls logged as management events; cannot be denied by policy.
- enumeration (bulk): `GetAccountAuthorizationDetails`. All IAM users, groups, roles, policies Logged: yes (`GetAccountAuthorizationDetails`). IAM management event.
- discovery (bulk): `GET / (s3:ListBuckets)`. All buckets owned by the account Logged: unknown (`ListBuckets`). Management/data classification not verified on fetched pages.
- collection (bulk): `GET /{Key} (s3:GetObject)`. Object contents Logged: plan (`GetObject`). S3 object-level data event; only logged if data events are enabled on a trail (extra cost).

### Public detection rules (community, not vendor documentation)
- [Root Account Access Key Created](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_root_access_key_created.yml) (Panther): An access key was created for the root user.
- [AWS STS GetCallerIdentity via TruffleHog](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_sts_getcalleridentity_trufflehog.yml) (Panther): GetCallerIdentity with a TruffleHog user agent, used to check whether leaked access keys still work.
- [AWS STS GetCallerIdentity Enumeration Via TruffleHog](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_sts_getcalleridentity_trufflehog.yml) (Sigma): GetCallerIdentity with a TruffleHog user agent.
- [PUA - AWS TruffleHog Execution](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_cloudtrail_pua_trufflehog.yml) (Sigma): Any CloudTrail event with the TruffleHog user agent.
- [Root Account Activity](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_root_activity.yml) (Panther): Write actions by the root user (console or root access key), excluding service-invoked events.
- [AWS Root Credentials](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_root_account_usage.yml) (Sigma): Any root user activity that is not an AWS service event.

### What to look for (analyst guidance)
- Any root key use
- Root key creation in a member account

## Respond: how to revoke it
- Admin: **Deactivate / delete access key (UpdateAccessKey, DeleteAccessKey)**. Setting a key Inactive or deleting it stops all further use of that key. Where: IAM console > Users > Security credentials > Actions > Deactivate/Delete; API UpdateAccessKey / DeleteAccessKey.
- Admin: **Root access management (Root credentials management)**. Lets the management account or delegated admin delete member-account root passwords, access keys and certificates; new accounts get no root credentials. Where: IAM console > Root access management > Enable.

Delete the key as root, or from the management account via centralized root access management. Live access ends on revocation: yes. Root permissions cannot be scoped down by IAM policy, so deletion is the only fix.

## No vendor documentation found
- Stops working when user is removed
- Whether temporary credentials created by root via GetSessionToken survive key deletion.
- Whether long-term Bedrock API keys can be set to never expire, and their maximum lifetime.
- Token format/prefix for Bedrock API keys (not documented on fetched pages).
- Which CloudTrail field identifies the specific Bedrock API key on a request (key value is not logged).
- Default session duration for IAM Roles Anywhere when durationSeconds is omitted.
- Exact CloudTrail eventName strings for CreateAccessKey/UpdateAccessKey/DeleteAccessKey were not shown on fetched pages (they match the IAM API action names, which CloudTrail logs).

## Sources
- [Manage access keys for IAM users - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) (retrieved 2026-10-14)
- [Create access keys for the root user - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-user_manage_add-key.html) (retrieved 2026-10-14)
- [Disabling permissions for temporary security credentials - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_control-access_disable-perms.html) (retrieved 2026-10-14)
- [AWS: Denies access to AWS based on the source IP - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_aws_deny-ip.html) (retrieved 2026-10-14)
- [Service control policies (SCPs) - AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html) (retrieved 2026-10-14)
- [Programmatic access with AWS security credentials - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/security-creds-programmatic-access.html) (retrieved 2026-10-14)
- [Strongly recommended controls with preventive behavior - AWS Control Tower](https://docs.aws.amazon.com/controltower/latest/controlreference/strongly-recommended-preventive-controls.html) (retrieved 2026-10-14)
- [Centralize root access for member accounts - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-enable-root-access.html) (retrieved 2026-10-14)
- [Secure API access with MFA - IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_configure-api-require.html) (retrieved 2026-10-14)
- [Generate credential reports for your AWS account - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_getting-report.html) (retrieved 2026-10-14)
- [Creating organization policies with AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_create.html) (retrieved 2026-10-14)
- [Attaching organization policies with AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_attach.html) (retrieved 2026-10-14)
- [Logging data events - AWS CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-data-events-with-cloudtrail.html) (retrieved 2026-10-14)
- [Viewing recent management events with the console](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events-console.html) (retrieved 2026-10-14)
- [Logging IAM and AWS STS API calls with AWS CloudTrail - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/cloudtrail-integration.html) (retrieved 2026-10-14)
- [GetCallerIdentity - AWS Security Token Service](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetCallerIdentity.html) (retrieved 2026-10-14)
- [ListBuckets - Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html) (retrieved 2026-10-14)
- [GetObject - Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html) (retrieved 2026-10-14)
- [GetAccountAuthorizationDetails - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetAccountAuthorizationDetails.html) (retrieved 2026-10-14)
- [Update access keys - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys_retrieve.html) (retrieved 2026-10-14)
- [AWS global condition context keys - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html) (retrieved 2026-10-14)
