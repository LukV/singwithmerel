---
name: finish-block
description: Finish the current Merel block after its last pitch shipped. Runs the block's test scenario, checks its definition of done, and opens one pull request into main with green checks; then hands Luk the release steps (rc candidate on next.singwithmerel.com, then the release). Use when Luk says "finish the block", "wrap up block <n>", or after the last pitch of a block is shipped and Luk said go.
---

# finish-block

1. **All slots shipped or dropped?** If not, say which is open and stop.
2. **Check the block's definition of done**, item by item. Fix what is not true, as a commit on the block branch. Items marked *(after release)* stay open: Luk checks them after the release.
3. **Run the block's test scenario**: every machine-runnable step, with its output. Fix and rerun what fails.
4. **Block status.** Block note `status: shipped`, `shipped_on: <today>`, and a short *What actually happened* at its end: what the release holds, what moved to *Later*. Commit: `docs(planning): finish block <n>`.
5. **Pull request.** Push the branch and open one pull request into `main` (`gh pr create`). Its body: what the block delivers, the list of pitches with one line each, and the block's test scenario as numbered steps with what to see. Wait for the checks; if one fails, fix it on the branch and push until all are green.
6. **Stop.** Never merge, bump or tag yourself. Tell Luk the checks are green and give him, in order: merge; on `main`, `cz bump --prerelease rc` and `git push --follow-tags`; run the block's test scenario on https://next.singwithmerel.com; when it passes, `cz bump` and `git push --follow-tags`. Name the version commitizen will compute from the commits. Suggest the next block from `docs/planning/blocks/`, and do not start it.
