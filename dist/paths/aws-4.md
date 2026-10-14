# AWS: OIDC / SAML federation to IAM roles (AssumeRoleWithWebIdentity, AssumeRoleWithSAML)

`aws-4` · Federated identity · person or service. An external IdP token (OIDC JWT, e.g. GitHub Actions, or SAML assertion) is exchanged with STS for temporary role credentials. The exchange needs no AWS credentials.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | No docs found | No vendor documentation found. |  |
| Protect: Admin can block or require approval | Yes | Role trust policy | Role trust policy: IAM console > Roles > Trust relationships / aws iam update-assume-role-policy |
| Protect: SSO and MFA rules apply | Yes | Credentials are issued only after the external IdP authenticates the user and returns a SAML assertion or OIDC token. | Where: IAM console > Identity providers > Add provider > SAML or OpenID Connect; role trust policy names that provider · Command: aws iam create-saml-provider; aws iam create-open-id-connect-provider |
| Protect: IP restriction | Conditional | Not a setting: an identity policy or SCP that denies requests when aws:SourceIp is outside allowed ranges. It is evaluated on every signed API request. aws:SourceIp is absent for calls through VPC endpoints (use aws:VpcSourceIp) and SCPs do not cover the management account. | Where: Role identity policy with Deny * / NotIpAddress aws:SourceIp, or AWS Organizations console > Policies > Service control policies > Create policy (Deny * with NotIpAddress aws:SourceIp) > attach to OU/account · Command: aws iam put-role-policy (inline deny) or aws organizations attach-policy |
| Protect: Expires automatically | Yes | Default 1 h, up to role max (12 h) | Maximum session duration: IAM > Roles > Edit > Maximum session duration; UpdateRole |
| Detect: Usage appears in logs | Yes | userIdentity.accessKeyId | AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included. · CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra. |
| Detect: Data reads appear in logs | Conditional | S3 object-level data event; only logged if data events are enabled on a trail (extra cost). | Where: CloudTrail console > Trails > trail > Data events > Edit > enable S3 data events; then filter trail logs on eventName=GetObject (not in Event history) · Command: aws cloudtrail put-event-selectors --trail-name <trail> --advanced-event-selectors (resources.type=AWS::S3::Object) |
| Respond: Revocation ends active access | Yes | Role-wide revocation. | Where: IAM console > Roles > role > Revoke sessions tab > Revoke active sessions (attaches AWSRevokeOlderSessions) |
| Respond: Stops working when user is removed | Partial | Disabling the user at the IdP stops new assertions, but temporary credentials already issued stay valid until they expire. | Where: Disable the user in the IdP; then IAM console > Roles > role > Revoke sessions > Revoke active sessions to end issued credentials |

## Protect: what an admin can configure

### Admin controls
- **aws:SourceIp deny policy** (Limit network; all plans; default off). Identity policy or SCP that denies any request from outside listed CIDR ranges. Where: IAM policy / SCP with NotIpAddress aws:SourceIp.
- **Maximum session duration** (Limit lifetime; all plans; default on). Caps role session length at 1-12 hours (default 1 hour). Where: IAM > Roles > Edit > Maximum session duration; UpdateRole.
- **Role trust policy** (Disable; all plans; default varies). The trust policy decides which principals can assume a role; removing a principal stops new sessions for it. Where: IAM console > Roles > Trust relationships / aws iam update-assume-role-policy.

- Network: conditional (checked at api_request). Not a setting: an identity policy or SCP that denies requests when aws:SourceIp is outside allowed ranges. It is evaluated on every signed API request. aws:SourceIp is absent for calls through VPC endpoints (use aws:VpcSourceIp) and SCPs do not cover the management account.
- Lifetime: Default 1 h, up to role max (12 h). Renewal: Get a fresh IdP token and call the STS exchange again.
- Keyless option: supported. Credentials are issued only after the IdP authenticates the workload or user; IdP policy applies at token issuance, not to already-issued AWS credentials.
- Conditions: Session revocation applies per role, not per external identity.

## Detect: what gets logged
- Token prefix: `ASIA`

### Logs
- AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included.
- CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra.

### Fields that identify the credential
- `userIdentity.accessKeyId` (CloudTrail): Key ID used to sign the request; may be empty for security reasons.

### Lifecycle events
- create: `AssumeRoleWithWebIdentity` Includes IdP-provided info.
- create: `AssumeRoleWithSAML` 

### Correlate on
`userIdentity (WebIdentityUser/SAMLUser)`, `responseElements.credentials.accessKeyId`, `sourceIdentity`

### API calls a holder can make, and whether they are logged
- recon: `POST sts:GetCallerIdentity`. Account, ARN, user/role ID Logged: yes (`GetCallerIdentity`). All STS calls logged as management events; cannot be denied by policy.
- enumeration (bulk): `GetAccountAuthorizationDetails`. All IAM users, groups, roles, policies Logged: yes (`GetAccountAuthorizationDetails`). IAM management event.
- discovery (bulk): `GET / (s3:ListBuckets)`. All buckets owned by the account Logged: unknown (`ListBuckets`). Management/data classification not verified on fetched pages.
- collection (bulk): `GET /{Key} (s3:GetObject)`. Object contents Logged: plan (`GetObject`). S3 object-level data event; only logged if data events are enabled on a trail (extra cost).

### Public detection rules (community, not vendor documentation)
- [AWS SAML Activity](https://github.com/panther-labs/panther-analysis/blob/develop/rules/aws_cloudtrail_rules/aws_saml_activity.yml) (Panther): Creation, update, or deletion of an IAM SAML provider.
- [AWS Suspicious SAML Activity](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_susp_saml_activity.yml) (Sigma): UpdateSAMLProvider or AssumeRoleWithSAML calls.
- [AWS SAML Provider Deletion Activity](https://github.com/SigmaHQ/sigma/blob/master/rules/cloud/aws/cloudtrail/aws_delete_saml_provider.yml) (Sigma): Successful deletion of an IAM SAML provider.
- [AWS AssumeRoleWithWebIdentity from Kubernetes SA and External ASN](https://github.com/elastic/detection-rules/blob/main/rules/integrations/aws/initial_access_assume_role_with_web_identity_kubernetes_sa_from_external_asn.toml) (Elastic): AssumeRoleWithWebIdentity by a Kubernetes service account from a non-AWS network.
- [AWS Lateral Movement from Kubernetes SA via AssumeRoleWithWebIdentity](https://github.com/elastic/detection-rules/blob/main/rules/integrations/aws/lateral_movement_k8_assumed_web_identity_session_with_multi_phase_api_use.toml) (Elastic): A Kubernetes service account role session from AssumeRoleWithWebIdentity followed by recon, credential access, and persistence API calls.

### What to look for (analyst guidance)
- Unexpected OIDC subject or repo in exchange
- Exchange from unknown IP

## Respond: how to revoke it
- Admin: **Revoke active sessions (AWSRevokeOlderSessions)**. Attaches a deny-all policy for sessions issued before now, invalidating existing temporary credentials for the role. Where: IAM > Roles > role > Revoke sessions tab.
- Admin: **aws:TokenIssueTime deny policy**. Deny policy that blocks temporary credentials issued before a chosen time; does not affect long-term keys. Where: IAM policy with DateLessThan aws:TokenIssueTime.
- Admin: **Delete IAM identity provider**. Deleting the IAM OIDC or SAML identity provider removes the trust used for federated role sessions. Where: IAM console > Identity providers > Delete.

Revoke active sessions on the role; tighten trust policy conditions (aud/sub); remove or disable at the IdP. Live access ends on revocation: yes. Role-wide revocation.

## No vendor documentation found
- Admin can list all of them
- Whether long-term Bedrock API keys can be set to never expire, and their maximum lifetime.
- Token format/prefix for Bedrock API keys (not documented on fetched pages).
- Which CloudTrail field identifies the specific Bedrock API key on a request (key value is not logged).
- Default session duration for IAM Roles Anywhere when durationSeconds is omitted.
- Exact CloudTrail eventName strings for CreateAccessKey/UpdateAccessKey/DeleteAccessKey were not shown on fetched pages (they match the IAM API action names, which CloudTrail logs).

## Sources
- [AssumeRoleWithWebIdentity - AWS Security Token Service](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html) (retrieved 2026-10-14)
- [OIDC federation - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html) (retrieved 2026-10-14)
- [SAML 2.0 federation - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_saml.html) (retrieved 2026-10-14)
- [AWS: Denies access to AWS based on the source IP - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_aws_deny-ip.html) (retrieved 2026-10-14)
- [AWS global condition context keys - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html) (retrieved 2026-10-14)
- [Service control policies (SCPs) - AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html) (retrieved 2026-10-14)
- [Update settings for a role - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_update-role-settings.html) (retrieved 2026-10-14)
- [Revoke IAM role temporary security credentials - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html) (retrieved 2026-10-14)
- [Disabling permissions for temporary security credentials - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_control-access_disable-perms.html) (retrieved 2026-10-14)
- [Create a SAML identity provider in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_saml.html) (retrieved 2026-10-14)
- [Create an OpenID Connect (OIDC) identity provider in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html) (retrieved 2026-10-14)
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
