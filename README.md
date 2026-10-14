# API Token Controls

For each kind of API credential on common SaaS platforms (personal access tokens, API keys, OAuth apps, service accounts and more): can an admin restrict it, is its use logged, and does revoking it end access. Every answer cites vendor documentation and says how to act on it.

Site: https://thesubtlety.github.io/api-token-controls/

## Use it to
- **Lock down a platform.** Pick the platform to see which token types exist, then follow the "How" steps to restrict or turn off the ones you don't need.
- **Check offboarding.** See which tokens keep working after a user is removed or SSO is enforced, so you know what to revoke separately.
- **Respond to a leaked token.** Search by token prefix, then follow the revoke steps and the log fields that show what the token did.
- **Compare vendors.** Sort any column to find platforms that lack a control.
- **Feed a model or script.** Start at `llms.txt`, or use `catalog.json`, the CSVs, or `paths/<id>.md`.

"No docs found" means the vendor's documentation doesn't say either way, so test in your tenant. "Not available" cites a vendor page that states the absence.

## Contribute
PRs welcome: corrections, newer vendor docs or new platforms.

1. Edit `research/platforms/<platform>.json` and add any new sources to `research/sources.json`. Cite a current vendor documentation page for every fact.
2. Run `node normalize.mjs && node validate.mjs`.
3. Commit the regenerated `dist/`.

To preview locally: `python3 -m http.server 8000 --directory dist`.

See [RELATED-DATASETS.md](RELATED-DATASETS.md) for similar projects.
