---
name: start-pitch
description: Start the next pitch of the current Merel block. Reads the block and pitch notes, shapes the technical sketch against the code, settles any decision the pitch needs with Luk, sets the pitch in-cycle and then builds the whole pitch without asking for approval of small steps. Use when Luk says "start <pitch>", "next pitch", "go" after a pitch, or "pick up block <n>".
---

# start-pitch

1. **Find the pitch.** The current block is the one in `docs/planning/blocks/` with status ready or in-cycle. Its slot table names the pitches in order; the next one is the first not shipped. If Luk named one, take that.
2. **Branch.** If the block has no branch yet: from an up-to-date `main`, `git checkout -b block/<n>-<slug>` and push it with `-u`. If it has one, check it out and pull. A brand-new repository: `git init`, commit the docs on `main`, add the GitHub remote Luk created, push `main`, then branch.
3. **Read.** The block note, the pitch note, and every page the pitch links. Look at the code it touches.
4. **Shape the technical sketch.** Tighten the pitch's sketch against the real code. If the pitch needs a decision (stack, hosting, a format), write it as a proposal in `docs/architecture/decisions/` and ask Luk once, with your recommendation. Ask nothing else.
5. **Set status.** Pitch frontmatter `status: in-cycle`, `started: <today>`; the block's slot table says in-cycle; the block's status in-cycle if it was ready. Commit: `docs(planning): start <n>.<m> <slug>`.
6. **Build the whole pitch.** Up to the cut line first, then what is above it. Commit as you go. Make routine choices yourself and note them for *What actually happened*. If the work wants to cross the cut line or the out-of-scope list, stop and ask.
7. When the definition of done holds, run `ship-pitch`.
