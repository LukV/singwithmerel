---
project: merel
type: decision
status: accepted
updated: 2026-11-14
---
# 010 Hosting and deploy

**Decision.** singwithmerel.com is registered in Route 53 (Luk, 2026-11-14). The site runs from a private S3 bucket in eu-north-1 (Stockholm) behind CloudFront, with an ACM certificate (us-east-1) for singwithmerel.com and www, and Route 53 alias records to the distribution. The code lives in a public GitHub repository, LukV/singwithmerel, open source under Apache 2.0 (Luk, 2026-11-14). GitHub Actions checks every push and pull request, and deploys every release tag ([[011-versions-and-releases]]): a candidate `v*-rc.*` to next.singwithmerel.com, a release `v*` to singwithmerel.com. Each is its own bucket and CloudFront distribution under the same certificate (singwithmerel.com, www and next). A deploy builds, syncs to the bucket and invalidates the cache. It reaches AWS through GitHub's OIDC provider and a role limited to this repository's version tags, these two buckets and these two distributions, so no AWS keys are stored in GitHub. A manual `npm run deploy` remains as a fallback. Claude proposed, 2026-11-14; Luk agreed to GitHub and Actions the same day, and accepted the AWS setup and chose the region at the start of [[1-3-merel-goes-live|pitch 1.3]], the same day. The setup itself is in `deploy/README.md`.

**Why.** The DNS is already on AWS, so everything stays in one account. At low traffic the cost is the hosted zone's small monthly fee and a few cents of transfer. Automatic checks and deploys mean Luk reviews behaviour, not code: a green pull request is enough to merge, and a passing test scenario on the candidate is enough to release.

**Because the repository is public.** Pull requests from forks run CI but never deploy: the deploy runs only on a pushed tag `v*`, and the role's trust policy accepts only this repository's `v*` tags (`repo:LukV@859544/singwithmerel@1457480722:ref:refs/tags/v*`, the name and id GitHub puts in the token). Only Luk can push tags. `main` is protected: changes arrive by pull request with green checks; only an admin (Luk) may push to it directly, for the release's bump commit.

**The alternative.** GitHub Pages or Cloudflare Pages with DNS records in Route 53: simpler deploys from git, but a second provider.
