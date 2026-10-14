# AWS: IAM user access keys

`aws-1` · HMAC · person or service. Access key ID (AKIA...) plus secret access key used to SigV4-sign AWS API and CLI requests. Up to two keys per IAM user.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | The IAM credential report lists every user in the account with access key status. | Where: IAM console > Credential report > Download Report · API: GenerateCredentialReport, then GetCredentialReport · Command: aws iam generate-credential-report; aws iam get-credential-report |
| Protect: Admin can block or require approval | Yes | Service control policy (SCP) | Service control policy (SCP): AWS Organizations > Policies > Service control policies |
| Protect: SSO and MFA rules apply | Not available | AWS says IAM user access keys cannot be used with MFA-protected API access, and they are not issued through an IdP. |  |
| Protect: IP restriction | Conditional | Not a setting: an identity policy or SCP that denies requests when aws:SourceIp is outside allowed ranges. It is evaluated on every signed API request. aws:SourceIp is absent for calls through VPC endpoints (use aws:VpcSourceIp) and SCPs do not cover the management account. | Where: IAM console > Users (or Roles) > name > Permissions tab > edit policy > JSON: Deny * with NotIpAddress aws:SourceIp; or AWS Organizations console > Policies > Service control policies > Create policy (Deny * with NotIpAddress aws:SourceIp) > attach to OU/account · Command: aws iam put-user-policy (inline deny) or aws organizations create-policy + attach-policy |
| Protect: Expires automatically | Partial | Never expire; a time-bound deny policy (aws:CurrentTime) can cut them off Admin control: Time-bound policy (aws:CurrentTime). | Time-bound policy (aws:CurrentTime): IAM > Users > Permissions > Create inline policy |
| Detect: Usage appears in logs | Yes | userIdentity.accessKeyId | AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included. · CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra. · IAM credential report / GetAccessKeyLastUsed: Last-used date, service, Region; first use per 15 min only. |
| Detect: Data reads appear in logs | Conditional | S3 object-level data event; only logged if data events are enabled on a trail (extra cost). | Where: CloudTrail console > Trails > trail > Data events > Edit > enable S3 data events; then filter trail logs on eventName=GetObject (not in Event history) · Command: aws cloudtrail put-event-selectors --trail-name <trail> --advanced-event-selectors (resources.type=AWS::S3::Object) |
| Respond: Revocation ends active access | Partial | Deactivation stops the key immediately, but temporary credentials already obtained with it (GetSessionToken/AssumeRole) stay valid until expiry unless permissions are also changed. | Where: IAM console > Users > user > Security credentials > Access keys > Actions > Deactivate, then Delete; add an inline deny policy on the user to cut off temporary credentials already minted · API: UpdateAccessKey (Status=Inactive), DeleteAccessKey · Command: aws iam update-access-key --status Inactive; aws iam delete-access-key; aws iam put-user-policy |
| Respond: Stops working when user is removed | Yes | Access keys belong to the IAM user; deleting the IAM user deletes its keys. IAM users are not tied to IdP/SCIM deprovisioning. | Where: IAM console > Users > select user > Delete (deactivate active access keys first) · Command: aws iam delete-user (after removing keys, policies, groups) |

## Protect: what an admin can configure

### Admin controls
- **Service control policy (SCP)** (Disable; AWS Organizations (all features); default off). An SCP can deny actions such as iam:CreateAccessKey or iam:CreateServiceSpecificCredential for all IAM users and roles in member accounts. Where: AWS Organizations > Policies > Service control policies.
- **aws:SourceIp deny policy** (Limit network; all plans; default off). Identity policy or SCP that denies any request from outside listed CIDR ranges. Where: IAM policy / SCP with NotIpAddress aws:SourceIp.
- **Time-bound policy (aws:CurrentTime)** (Limit lifetime; all plans; default off). Inline deny policy that blocks all actions after a set date, giving long-term keys an effective expiry. Where: IAM > Users > Permissions > Create inline policy.
- **IAM Access Analyzer unused access** (Other; Paid feature (pricing not verified); default off). Generates findings for IAM user access keys unused within a set window. Where: IAM Access Analyzer > Create unused access analyzer.

### Not available (vendor states)
- No built-in expiry for IAM user access keys.
- sts:GetCallerIdentity cannot be denied, so any valid key can confirm its identity.

- Network: conditional (checked at api_request). Not a setting: an identity policy or SCP that denies requests when aws:SourceIp is outside allowed ranges. It is evaluated on every signed API request. aws:SourceIp is absent for calls through VPC endpoints (use aws:VpcSourceIp) and SCPs do not cover the management account.
- Lifetime: Never expire; a time-bound deny policy (aws:CurrentTime) can cut them off. Renewal: Same key pair is reused until deactivated or deleted; rotation is manual (create second key, switch, deactivate, delete).
- Keyless option: not_verified. Keys belong to IAM users, not to an external IdP. AWS recommends federation with temporary credentials for humans and roles for workloads; no doc states whether IdP sign-in policy applies to these keys (it is not part of the signing flow).
- Conditions: SCPs need AWS Organizations and do not apply to the management account.

## Detect: what gets logged
- Token prefix: `AKIA`

### Logs
- AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included.
- CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra.
- IAM credential report / GetAccessKeyLastUsed: Last-used date, service, Region; first use per 15 min only.

### Fields that identify the credential
- `userIdentity.accessKeyId` (CloudTrail): Key ID used to sign the request; may be empty for security reasons.

### Lifecycle events
- create: `CreateAccessKey` IAM API action; CloudTrail logs all IAM calls.
- revoke: `UpdateAccessKey` Status Inactive.
- revoke: `DeleteAccessKey` 

### Correlate on
`userIdentity.accessKeyId`, `userIdentity.arn`, `sourceIPAddress`, `userAgent`

### API calls a holder can make, and whether they are logged
- recon: `POST sts:GetCallerIdentity`. Account, ARN, user/role ID Logged: yes (`GetCallerIdentity`). All STS calls logged as management events; cannot be denied by policy.
- enumeration (bulk): `GetAccountAuthorizationDetails`. All IAM users, groups, roles, policies Logged: yes (`GetAccountAuthorizationDetails`). IAM management event.
- discovery (bulk): `GET / (s3:ListBuckets)`. All buckets owned by the account Logged: unknown (`ListBuckets`). Management/data classification not verified on fetched pages.
- collection (bulk): `GET /{Key} (s3:GetObject)`. Object contents Logged: plan (`GetObject`). S3 object-level data event; only logged if data events are enabled on a trail (extra cost).

### Public detection rules (community, not vendor documentation)
- [AWS User API Key Created](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_iam_user_key_created.yml) (Panther): An IAM user access key was created by a different principal than the key owner.
- [AWS IAM Backdoor Users Keys](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_iam_backdoor_users_keys.yml) (Sigma): CreateAccessKey where the caller is not the user receiving the key.
- [New IAM Credentials Updated](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_update_credentials.yml) (Panther): Successful creation of access keys, users, or login profiles, or password changes.
- [AWS IAM S3Browser User or AccessKey Creation](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_iam_s3browser_user_or_accesskey_creation.yml) (Sigma): IAM user or access key creation from the S3 Browser user agent.
- [AWS IAM Access Key Compromise Detection](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_key_compromised.yml) (Panther): AWS attached an exposed-credential quarantine policy to a user whose access key was found leaked.
- [AWS Compromised IAM Key Quarantine](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_iam_compromised_key_quarantine.yml) (Panther): The AWSCompromisedKeyQuarantineV2 managed policy was attached to a user, group, or role.
- [AWS.CloudTrail.UserAccessKeyAuth](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_cloudtrail_useraccesskeyauth.yml) (Panther): Any successful API call made with a long-term IAM user access key (key ID starting with AKIA).
- [AWS STS GetSessionToken by IAM User](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_sts_getsessiontoken_misuse.yml) (Panther): An IAM user called GetSessionToken to turn long-term keys into temporary credentials.
- [AWS STS GetSessionToken Misuse](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_sts_getsessiontoken_misuse.yml) (Sigma): GetSessionToken called by an IAM user.
- [AWS STS GetCallerIdentity via TruffleHog](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_sts_getcalleridentity_trufflehog.yml) (Panther): GetCallerIdentity with a TruffleHog user agent, used to check whether leaked access keys still work.
- [AWS STS GetCallerIdentity Enumeration Via TruffleHog](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_sts_getcalleridentity_trufflehog.yml) (Sigma): GetCallerIdentity with a TruffleHog user agent.
- [PUA - AWS TruffleHog Execution](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_cloudtrail_pua_trufflehog.yml) (Sigma): Any CloudTrail event with the TruffleHog user agent.
- [Detect Reconnaissance from IAM Users](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_iam_user_recon_denied.yml) (Panther): An IAM user hit AccessDenied on List/Describe/Get calls in common services, a sign of a stolen key being used for recon.
- [AWS Console GetSigninToken Potential Abuse](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_console_getsignintoken.yml) (Panther): GetSigninToken from a non-SSO user agent, used to turn CLI credentials into a console session.
- [AWS Console GetSigninToken Potential Abuse](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_console_getsignintoken.yml) (Sigma): GetSigninToken from a user agent other than the console federation endpoint.

### What to look for (analyst guidance)
- GetCallerIdentity from a new IP or user agent
- GuardDuty UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS
- Key used after long idle period (credential report)

## Respond: how to revoke it
- Admin: **Deactivate / delete access key (UpdateAccessKey, DeleteAccessKey)**. Setting a key Inactive or deleting it stops all further use of that key. Where: IAM console > Users > Security credentials > Actions > Deactivate/Delete; API UpdateAccessKey / DeleteAccessKey.

UpdateAccessKey Status=Inactive, then DeleteAccessKey. Also attach aws:TokenIssueTime deny to the user to block STS sessions the key may have minted. Live access ends on revocation: partial. Deactivation stops the key immediately, but temporary credentials already obtained with it (GetSessionToken/AssumeRole) stay valid until expiry unless permissions are also changed.

## No vendor documentation found
- Whether long-term Bedrock API keys can be set to never expire, and their maximum lifetime.
- Token format/prefix for Bedrock API keys (not documented on fetched pages).
- Which CloudTrail field identifies the specific Bedrock API key on a request (key value is not logged).
- Default session duration for IAM Roles Anywhere when durationSeconds is omitted.
- Exact CloudTrail eventName strings for CreateAccessKey/UpdateAccessKey/DeleteAccessKey were not shown on fetched pages (they match the IAM API action names, which CloudTrail logs).

## Sources
- [Manage access keys for IAM users - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) (retrieved 2026-10-14)
- [Programmatic access with AWS security credentials - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/security-creds-programmatic-access.html) (retrieved 2026-10-14)
- [Security best practices in IAM - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html) (retrieved 2026-10-14)
- [AWS: Denies access to AWS based on the source IP - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_aws_deny-ip.html) (retrieved 2026-10-14)
- [AWS global condition context keys - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html) (retrieved 2026-10-14)
- [Service control policies (SCPs) - AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html) (retrieved 2026-10-14)
- [Control the use of access keys by attaching an inline policy to an IAM user - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-keys_inline-policy.html) (retrieved 2026-10-14)
- [Update access keys - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys_retrieve.html) (retrieved 2026-10-14)
- [Secure API access with MFA - IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_configure-api-require.html) (retrieved 2026-10-14)
- [Remove or deactivate an IAM user](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_remove.html) (retrieved 2026-10-14)
- [Generate credential reports for your AWS account - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_getting-report.html) (retrieved 2026-10-14)
- [Adding and removing IAM identity permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_manage-attach-detach.html) (retrieved 2026-10-14)
- [Creating organization policies with AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_create.html) (retrieved 2026-10-14)
- [Attaching organization policies with AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_attach.html) (retrieved 2026-10-14)
- [Logging data events - AWS CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-data-events-with-cloudtrail.html) (retrieved 2026-10-14)
- [Viewing recent management events with the console](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events-console.html) (retrieved 2026-10-14)
- [Manage access keys for IAM users](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-keys-admin-managed.html) (retrieved 2026-10-14)
- [Disabling permissions for temporary security credentials - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_control-access_disable-perms.html) (retrieved 2026-10-14)
- [GetAccessKeyLastUsed - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetAccessKeyLastUsed.html) (retrieved 2026-10-14)
- [Logging IAM and AWS STS API calls with AWS CloudTrail - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/cloudtrail-integration.html) (retrieved 2026-10-14)
- [Working with CloudTrail event history - AWS CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events.html) (retrieved 2026-10-14)
- [GuardDuty IAM finding types - Amazon GuardDuty](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-iam.html) (retrieved 2026-10-14)
- [CloudTrail userIdentity element - AWS CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference-user-identity.html) (retrieved 2026-10-14)
- [GetCallerIdentity - AWS Security Token Service](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetCallerIdentity.html) (retrieved 2026-10-14)
- [ListBuckets - Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html) (retrieved 2026-10-14)
- [GetObject - Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html) (retrieved 2026-10-14)
- [GetAccountAuthorizationDetails - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/APIReference/API_GetAccountAuthorizationDetails.html) (retrieved 2026-10-14)
- [IAM Access Analyzer findings - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-findings.html) (retrieved 2026-10-14)
