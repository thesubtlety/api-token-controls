# AWS: Amazon Bedrock API keys (long-term)

`aws-7` · API key / token · service. Bearer token for Amazon Bedrock created as an IAM service-specific credential on a dedicated IAM user; sent in the Authorization header. Limited to Bedrock and Bedrock Runtime actions and the Region where generated.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Yes | Bedrock console > API keys > Long-term API keys lists keys with their status. | Bedrock console > API keys > Long-term API keys lists keys with their status. |
| Protect: Admin can block or require approval | Yes | Service control policy (SCP); bedrock:CallWithBearerToken deny | Service control policy (SCP): AWS Organizations > Policies > Service control policies · bedrock:CallWithBearerToken deny: IAM policy / SCP |
| Protect: SSO and MFA rules apply | No docs found | No vendor documentation found. |  |
| Protect: IP restriction | Conditional | aws:SourceIp deny policies on the backing IAM user apply per request (docs do not show a Bedrock-key-specific example). | Where: IAM console > Users (or Roles) > name > Permissions tab > edit policy > JSON: Deny * with NotIpAddress aws:SourceIp on the IAM user that backs the key · Command: aws iam put-user-policy |
| Protect: Expires automatically | Yes | Until a chosen expiration date; capped by iam:ServiceSpecificCredentialAgeDays policy | Where: Bedrock console > API keys > Long-term API keys > Generate long-term API keys > API key expiration; cap with iam:ServiceSpecificCredentialAgeDays on iam:CreateServiceSpecificCredential |
| Detect: Usage appears in logs | Yes | userIdentity (backing IAM user) | AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included. · CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra. |
| Detect: Data reads appear in logs | Yes | Converse | Where: CloudTrail console > Event history > Event name filter = Converse · API: CloudTrail LookupEvents (AttributeKey=EventName, AttributeValue=Converse) · Command: aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=Converse |
| Respond: Revocation ends active access | No docs found | Docs do not state propagation timing. |  |
| Respond: Stops working when user is removed | N/A | A long-term Bedrock key is attached to its own dedicated IAM user, not to a person. |  |

## Protect: what an admin can configure

### Admin controls
- **Service control policy (SCP)** (Disable; AWS Organizations (all features); default off). An SCP can deny actions such as iam:CreateAccessKey or iam:CreateServiceSpecificCredential for all IAM users and roles in member accounts. Where: AWS Organizations > Policies > Service control policies.
- **aws:SourceIp deny policy** (Limit network; all plans; default off). Identity policy or SCP that denies any request from outside listed CIDR ranges. Where: IAM policy / SCP with NotIpAddress aws:SourceIp.
- **iam:ServiceSpecificCredentialAgeDays** (Limit lifetime; all plans; default off). Policy condition that caps the expiration of new long-term Bedrock keys. Where: IAM policy on iam:CreateServiceSpecificCredential.
- **bedrock:CallWithBearerToken deny** (Disable; all plans; default off). Denying this action blocks use of Bedrock API keys; bedrock:bearerTokenType targets SHORT_TERM or LONG_TERM. Where: IAM policy / SCP.

- Network: conditional (checked at api_request). aws:SourceIp deny policies on the backing IAM user apply per request (docs do not show a Bedrock-key-specific example).
- Lifetime: Until a chosen expiration date; capped by iam:ServiceSpecificCredentialAgeDays policy. Renewal: Reused until expiry; Reset key issues a new value.
- Keyless option: not_verified. Backed by an IAM user, not an IdP identity. Docs do not discuss IdP policy.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included.
- CloudTrail trail / event data store: Needed for retention beyond 90 days; data events off by default and cost extra.

### Fields that identify the credential
- `userIdentity (backing IAM user)` (CloudTrail): Key value not logged; key ID field not verified.

### Lifecycle events
- create: `CreateServiceSpecificCredential` IAM API action.
- revoke: `UpdateServiceSpecificCredential` Status=Inactive.
- revoke: `DeleteServiceSpecificCredential` 

### Correlate on
`backing IAM user ARN`, `sourceIPAddress`

### API calls a holder can make, and whether they are logged
- discovery: `GET /foundation-models (ListFoundationModels)`. Available models Logged: unknown (`ListFoundationModels`). 
- collection: `POST /model/{modelId}/converse`. Model inference at account cost Logged: yes (`Converse`). Logged as management event; key value not logged.

### Public detection rules (community, not vendor documentation)
- [AWS IAM Credentials Added to a Bedrock API Key Phantom User](https://github.com/elastic/detection-rules/blob/main/rules/integrations/aws/privilege_escalation_bedrock_phantom_user_credentials_added.toml) (Elastic): Access keys or console passwords added to the BedrockAPIKey-* IAM user that backs a long-term Bedrock API key.
- [AWS Bedrock API Key Phantom User Activity Outside Bedrock](https://github.com/elastic/detection-rules/blob/main/rules/integrations/aws/privilege_escalation_bedrock_phantom_user_activity_outside_bedrock.toml) (Elastic): A BedrockAPIKey-* IAM user making API calls to services other than Bedrock.
- [AWS Bedrock API Key Used for Destructive or Anti-Recovery Action](https://github.com/elastic/detection-rules/blob/main/rules/integrations/aws/impact_bedrock_api_key_destructive_action.toml) (Elastic): Bedrock API calls made with a bearer API key (callWithBearerToken=true) that delete guardrails, models, or logging configuration.

### What to look for (analyst guidance)
- InvokeModel/Converse volume spike from the key's IAM user

## Respond: how to revoke it
- Admin: **Deactivate / Reset / Delete long-term API key**. Disables, rotates or removes a long-term Bedrock key. Where: Bedrock console > API keys > Actions; UpdateServiceSpecificCredential / ResetServiceSpecificCredential / DeleteServiceSpecificCredential.

Deactivate, reset or delete the key; or deny bedrock:CallWithBearerToken. Live access ends on revocation: unknown. Docs do not state propagation timing.

## No vendor documentation found
- SSO and MFA rules apply
- Revocation ends active access
- How a specific key appears in CloudTrail.
- No whoami call documented for Bedrock API keys.
- Whether long-term Bedrock API keys can be set to never expire, and their maximum lifetime.
- Token format/prefix for Bedrock API keys (not documented on fetched pages).
- Which CloudTrail field identifies the specific Bedrock API key on a request (key value is not logged).
- Default session duration for IAM Roles Anywhere when durationSeconds is omitted.
- Exact CloudTrail eventName strings for CreateAccessKey/UpdateAccessKey/DeleteAccessKey were not shown on fetched pages (they match the IAM API action names, which CloudTrail logs).

## Sources
- [API keys - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html) (retrieved 2026-10-14)
- [Use an Amazon Bedrock API key - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-use.html) (retrieved 2026-10-14)
- [AWS: Denies access to AWS based on the source IP - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_aws_deny-ip.html) (retrieved 2026-10-14)
- [Handle compromised long-term and short-term Amazon Bedrock API keys](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-revoke.html) (retrieved 2026-10-14)
- [Adding and removing IAM identity permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_manage-attach-detach.html) (retrieved 2026-10-14)
- [Generate an Amazon Bedrock API key](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-generate.html) (retrieved 2026-10-14)
- [Control permissions for Amazon Bedrock API keys](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-permissions.html) (retrieved 2026-10-14)
- [Monitor Amazon Bedrock API calls using CloudTrail - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/logging-using-cloudtrail.html) (retrieved 2026-10-14)
- [Viewing recent management events with the console](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events-console.html) (retrieved 2026-10-14)
- [aws cloudtrail lookup-events](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/cloudtrail/lookup-events.html) (retrieved 2026-10-14)
- [Logging IAM and AWS STS API calls with AWS CloudTrail - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/cloudtrail-integration.html) (retrieved 2026-10-14)
- [ListFoundationModels - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_ListFoundationModels.html) (retrieved 2026-10-14)
- [Service control policies (SCPs) - AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html) (retrieved 2026-10-14)
- [AWS global condition context keys - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html) (retrieved 2026-10-14)
