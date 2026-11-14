# Deploy

**In brief.** singwithmerel.com and next.singwithmerel.com are two private S3 buckets in eu-north-1, each behind its own CloudFront distribution, with one certificate and Route 53 records ([decision 010](../docs/architecture/decisions/010-hosting.md)). A pushed version tag deploys through GitHub Actions (`.github/workflows/deploy.yml`): `v0.1.0-rc.0` to next, `v0.1.0` to the site with a GitHub release. Actions reaches AWS through GitHub's OIDC provider; no AWS key is stored anywhere. The setup below is done once, by `setup.sh`.

## What exists

| Thing | Name | Notes |
|---|---|---|
| Hosted zone | singwithmerel.com | created by Route 53 Domains |
| Certificate | singwithmerel.com, www, next | ACM in us-east-1, validated through DNS records in the zone |
| Buckets | `singwithmerel-site-<account>`, `singwithmerel-next-<account>` | eu-north-1, all public access blocked, readable only by their distribution |
| Distributions | one for singwithmerel.com and www, one for next | origin access control `singwithmerel`, HTTP/2 and 3, price class 100, a 403 from the bucket answers with the app and status 404 |
| Path function | `singwithmerel-paths` (`paths.js`) | www to the bare domain, `/fr` to `/fr/`, a folder to its `index.html` |
| Response headers | `singwithmerel-site`, `singwithmerel-next` (`headers.json`) | HSTS, content security policy, no framing, no referrer, permissions; next adds `X-Robots-Tag: noindex` |
| DNS | A and AAAA aliases for the apex, www and next | |
| OIDC provider | token.actions.githubusercontent.com | audience sts.amazonaws.com |
| Role | `singwithmerel-deploy` | trusted only by `repo:LukV@859544/singwithmerel@1457480722:ref:refs/tags/v*` (GitHub names the repository by name and id, so a renamed or recreated repository is not trusted); may list and write the two buckets and invalidate the two distributions, nothing else |
| Repository variables | `AWS_ROLE_ARN`, `AWS_REGION`, `SITE_BUCKET`, `SITE_DISTRIBUTION`, `NEXT_BUCKET`, `NEXT_DISTRIBUTION` | names and ids, no secrets |

## The one-time setup

Sign in to AWS on the command line (`aws login`) with an account that may create these, and to GitHub (`gh auth login`). Then, from the repository:

```
bash deploy/setup.sh cert           # request the certificate, add its DNS records, wait until it is issued
bash deploy/setup.sh buckets        # the two private buckets
bash deploy/setup.sh edge           # origin access control, the path function, the two header policies
bash deploy/setup.sh distributions  # the two distributions, their bucket policies and DNS records
bash deploy/setup.sh role           # the OIDC provider and the deploy role
bash deploy/setup.sh variables      # the repository variables
```

`bash deploy/setup.sh all` runs them in order. Every step looks before it creates, so running one again is safe; `edge` also updates the function and the headers after a change to `paths.js` or `headers.json`. A new distribution takes a few minutes to reach every edge.

The trust policy was tested on 2026-11-14 with a workflow on the block branch that tried to assume the role: AWS refused it ("Not authorized to perform sts:AssumeRoleWithWebIdentity").

## A deploy

`deploy.sh next` or `deploy.sh site` uploads `dist/`: hashed files under `assets/` with a cache of a year, everything else checked on every visit, files that are gone removed (old hashed files last, so an open page keeps working), then clears CloudFront's cache and waits for it.

**The manual fallback**, from a machine signed in to AWS: `npm run build`, then `npm run deploy -- next` or `npm run deploy -- site`. It finds the bucket and distribution by itself. Use it only if Actions is down; a tag stays the normal way.

## Releasing

Luk releases ([decision 011](../docs/architecture/decisions/011-versions-and-releases.md)): on `main`, `cz bump --prerelease rc` and `git push --follow-tags` puts a candidate on next; `cz bump` and `git push --follow-tags` puts the release on the site and creates the GitHub release from its `CHANGELOG.md` section.
