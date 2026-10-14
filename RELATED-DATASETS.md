# Related datasets

Related projects. None are imported into this catalog.

| Project | Relevant contribution | Boundary relative to this catalog |
| --- | --- | --- |
| [CSA SaaS Security Capability Framework](https://cloudsecurityalliance.org/artifacts/saas-security-capability-framework) | Customer-facing SaaS control framework, assessment questionnaire, implementation guidance, JSON and OSCAL. | A vocabulary/baseline to map to; not itself a populated per-provider, per-authentication-path capability dataset. |
| [SaaS Security Controls Profile](https://github.com/adamgroenhout/saas-security-controls-profile) | TOML model with enabled/relevant/exception state, API-key policy, session lifetime, conditional access and IP controls. | A configuration-profile template. Its example settings are not findings about SaaS providers. |
| [Nango provider definitions](https://github.com/NangoHQ/nango/blob/master/packages/providers/providers.yaml) and [schema](https://github.com/NangoHQ/nango/blob/master/scripts/validation/providers/schema.json) | Machine-readable authentication modes, grant/token settings and renewal mechanics across integrations. | Integration behavior is useful evidence, but does not establish tenant policy or per-request IP enforcement. |
| [2FA Directory API](https://2fa.directory/api/) | Structured MFA methods, documentation, recovery links and implementation notes. | Useful human-authentication enrichment; not machine/API credential governance. Its API documentation specifies MIT licensing and attribution. |
| [SSO Tax](https://sso.tax/) | Vendor SSO pricing/plan barriers, sources and update dates. | Useful entitlement context; check individual record age and current vendor terms. |
| [Passkeys.directory](https://passkeys.directory/) | Community-maintained native passkey support directory. | End-user sign-in availability; not enterprise enforcement or API access. |
| [Push Security Browser & Identity Attacks Matrix](https://github.com/pushsecurity/browser-identity-attacks-matrix) | SaaS, browser and identity attack techniques; formerly SaaS Attacks Matrix. | Threat/abuse taxonomy for mapping controls to attack scenarios, rather than a vendor capability inventory. |
| [CISA ScubaGear](https://github.com/cisagov/ScubaGear) and [ScubaGoggles](https://github.com/cisagov/ScubaGoggles) | Microsoft 365 and Google Workspace configuration baselines and automated assessment using Rego. | Actual tenant assessment for two ecosystems; complementary to documented capability research. |
