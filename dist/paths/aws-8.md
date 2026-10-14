# AWS: Amazon Bedrock API keys (short-term)

`aws-8` · API key / token · person or service. Bearer token generated client-side from an existing IAM session (console or token-generator library); inherits that principal's permissions and works only in its Region.

Sourced from vendor documentation; not an audit of any tenant. "No docs found" means vendor documentation does not say either way.

| Question | Answer | Why | How |
|---|---|---|---|
| Identify: Admin can list all of them | Not available | AWS says the Bedrock console does not list short-term keys after they are generated. |  |
| Protect: Admin can block or require approval | Yes | bedrock:CallWithBearerToken deny | Where: IAM policy or SCP: Deny bedrock:CallWithBearerToken (and bedrock-mantle:CallWithBearerToken) with condition bedrock:bearerTokenType = SHORT_TERM · Command: aws iam put-user-policy / put-role-policy, or aws organizations attach-policy |
| Protect: SSO and MFA rules apply | Partial | The key inherits the generating session, so it is subject to SSO/MFA only when that session was. | Where: Enforce MFA on the generating principal: IAM policy condition aws:MultiFactorAuthPresent, or IAM Identity Center > Settings > Authentication > Multi-factor authentication |
| Protect: IP restriction | Conditional | Same IAM policy conditions as the generating principal. | Where: Add Deny * / NotIpAddress aws:SourceIp to the generating user or role policy, or an SCP · Command: aws iam put-user-policy / put-role-policy |
| Protect: Expires automatically | Yes | Up to 12 h or the generating session, whichever is shorter | Where: Bedrock console > API keys > Short-term API keys > Generate short-term API keys (expires with the console session, max 12 h) |
| Detect: Usage appears in logs | Yes | userIdentity of generating principal | AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included. |
| Detect: Data reads appear in logs | Yes | Converse | Where: CloudTrail console > Event history > Event name filter = Converse · API: CloudTrail LookupEvents (AttributeKey=EventName, AttributeValue=Converse) · Command: aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=Converse |
| Respond: Revocation ends active access | Partial | Short-term keys expire with the session (max 12 h). | Where: IAM console > Roles > generating role > Revoke sessions > Revoke active sessions; or deny bedrock:CallWithBearerToken on the principal |
| Respond: Stops working when user is removed | Partial | The key inherits the expiration of the session that generated it, so it keeps working until that session ends (max 12 hours). | Where: Revoke the generating session: IAM console > Roles > role > Revoke sessions > Revoke active sessions |

## Protect: what an admin can configure

### Admin controls
- **aws:SourceIp deny policy** (Limit network; all plans; default off). Identity policy or SCP that denies any request from outside listed CIDR ranges. Where: IAM policy / SCP with NotIpAddress aws:SourceIp.
- **bedrock:CallWithBearerToken deny** (Disable; all plans; default off). Denying this action blocks use of Bedrock API keys; bedrock:bearerTokenType targets SHORT_TERM or LONG_TERM. Where: IAM policy / SCP.

- Network: conditional (checked at api_request). Same IAM policy conditions as the generating principal.
- Lifetime: Up to 12 h or the generating session, whichever is shorter. Renewal: Generate a new token from valid AWS credentials.
- Keyless option: limited. Lifetime is capped by the session used to generate it, so it follows whatever federated session produced it.
- Conditions: null

## Detect: what gets logged
- Token prefix: not established

### Logs
- AWS CloudTrail event history: On by default; 90 days of management events per Region; free. Data events (e.g. S3 GetObject) not included.

### Fields that identify the credential
- `userIdentity of generating principal` (CloudTrail): Key value not logged.

### Lifecycle events
- use: `InvokeModel / Converse` Logged as management events.

### Correlate on
`generating principal ARN`

### API calls a holder can make, and whether they are logged
- discovery: `GET /foundation-models (ListFoundationModels)`. Available models Logged: unknown (`ListFoundationModels`). 
- collection: `POST /model/{modelId}/converse`. Model inference at account cost Logged: yes (`Converse`). Logged as management event; key value not logged.

### Public detection rules (community, not vendor documentation)
- [AWS Bedrock API Key Used for Destructive or Anti-Recovery Action](https://github.com/elastic/detection-rules/blob/main/rules/integrations/aws/impact_bedrock_api_key_destructive_action.toml) (Elastic): Bedrock API calls made with a bearer API key (callWithBearerToken=true) that delete guardrails, models, or logging configuration.

### What to look for (analyst guidance)
- Bedrock calls from a principal that normally does not use Bedrock

## Respond: how to revoke it
- Admin: **aws:TokenIssueTime deny policy**. Deny policy that blocks temporary credentials issued before a chosen time; does not affect long-term keys. Where: IAM policy with DateLessThan aws:TokenIssueTime.

Invalidate the generating session (revoke role sessions) or deny bedrock:CallWithBearerToken. Live access ends on revocation: partial. Short-term keys expire with the session (max 12 h).

## No vendor documentation found
- No whoami call documented for Bedrock API keys.
- Whether long-term Bedrock API keys can be set to never expire, and their maximum lifetime.
- Token format/prefix for Bedrock API keys (not documented on fetched pages).
- Which CloudTrail field identifies the specific Bedrock API key on a request (key value is not logged).
- Default session duration for IAM Roles Anywhere when durationSeconds is omitted.
- Exact CloudTrail eventName strings for CreateAccessKey/UpdateAccessKey/DeleteAccessKey were not shown on fetched pages (they match the IAM API action names, which CloudTrail logs).

## Sources
- [API keys - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html) (retrieved 2026-10-14)
- [How Amazon Bedrock API keys work - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-how.html) (retrieved 2026-10-14)
- [AWS: Denies access to AWS based on the source IP - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_aws_deny-ip.html) (retrieved 2026-10-14)
- [Handle compromised long-term and short-term Amazon Bedrock API keys](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-revoke.html) (retrieved 2026-10-14)
- [Control permissions for Amazon Bedrock API keys](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-permissions.html) (retrieved 2026-10-14)
- [Adding and removing IAM identity permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_manage-attach-detach.html) (retrieved 2026-10-14)
- [Attaching organization policies with AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_policies_attach.html) (retrieved 2026-10-14)
- [Secure API access with MFA - IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_configure-api-require.html) (retrieved 2026-10-14)
- [Prompt users for MFA](https://docs.aws.amazon.com/singlesignon/latest/userguide/mfa-getting-started.html) (retrieved 2026-10-14)
- [Generate an Amazon Bedrock API key](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-generate.html) (retrieved 2026-10-14)
- [Monitor Amazon Bedrock API calls using CloudTrail - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/logging-using-cloudtrail.html) (retrieved 2026-10-14)
- [Viewing recent management events with the console](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events-console.html) (retrieved 2026-10-14)
- [aws cloudtrail lookup-events](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/cloudtrail/lookup-events.html) (retrieved 2026-10-14)
- [Revoke IAM role temporary security credentials - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html) (retrieved 2026-10-14)
- [ListFoundationModels - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_ListFoundationModels.html) (retrieved 2026-10-14)
- [Use an Amazon Bedrock API key - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-use.html) (retrieved 2026-10-14)
- [AWS global condition context keys - AWS Identity and Access Management](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html) (retrieved 2026-10-14)
