---
project: merel
type: decision
status: accepted
updated: 2026-11-14
---
# 011 Versions and releases

**Decision.** Merel follows semantic versioning and Conventional Commits, with commitizen (`cz`) as on Proef. The version lives in `package.json`; `.cz.toml` holds the settings (semver2 scheme, tags `v<version>`, a `CHANGELOG.md` written on every bump, 0.x until Luk decides on 1.0). A release is a tag, and only a tag deploys: a release candidate (`v0.1.0-rc.0`) goes to next.singwithmerel.com, a release (`v0.1.0`) to singwithmerel.com. Luk bumps and tags; Claude Code never does. Luk, 2026-11-14.

**How a block becomes a release.**

1. The block's pull request is green and Luk merges it into `main`. Nothing deploys.
2. On `main`, Luk runs `cz bump --prerelease rc` and pushes the tag (`git push --follow-tags`). GitHub Actions deploys the candidate to next.singwithmerel.com.
3. Luk runs the block's test scenario there, on a laptop and a phone. A fix goes in as a small pull request, followed by the next candidate.
4. When the scenario passes, `cz bump` and push. Actions deploys the release to singwithmerel.com and creates a GitHub release with the changelog section.

**Commit messages.** Every commit follows Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`, `build:`), scoped where it helps (`feat(instrument): ...`). Luk commits with `cz commit`; Claude Code writes the same format directly. CI checks every commit on a pull request with `cz check`.

**Versions per block.** Block 1 is 0.1.0, block 2 is 0.2.0; a fix after a release is a patch. The bump is computed from the commits: `feat` raises the minor, `fix` the patch, and a breaking change stays a minor until 1.0.

**Why.** Luk works this way on Proef and wants real releases with a changelog. Deploying tags instead of merges gives every block a candidate to try on a phone before it is live, which is where the test scenario belongs.
