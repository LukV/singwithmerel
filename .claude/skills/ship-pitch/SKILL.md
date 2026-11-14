---
name: ship-pitch
description: Close the in-cycle Merel pitch. Runs the pitch's test scenario, fixes what fails, makes the docs true, marks the pitch shipped, and stops to show Luk the scenario to run himself. Use when the pitch's definition of done holds, or when Luk says "ship <pitch>", "is it done", or "drop this pitch".
---

# ship-pitch

## Ship

1. **Check the definition of done**, item by item, against the code. Fix what is not true.
2. **Run the test scenario.** Every step a machine can run (commands, the Playwright check, a build), with the output it gives. Fix what fails and run it again. Push, and wait until the CI run on the block branch is green (`gh run watch`).
3. **Make the docs true.** Every page in `docs/` the pitch made wrong, written as the present state. `AGENTS.md` commands and layout when they changed. A decision proposed during the pitch: accepted or rewritten.
4. **Write *What actually happened*** in the pitch note: one paragraph on what landed, what was cut, the routine choices made, and anything Luk should know.
5. **Set status.** Pitch `status: shipped`, `shipped_on: <today>`; the block's slot table says shipped. Commit: `docs(planning): ship <n>.<m> <slug>`.
6. **Stop and show Luk the scenario.** In one message: what the pitch delivers in two lines, then the test scenario step by step, each with the command or action and what he should see, marking the steps that need a person. Do not start the next pitch. If this was the block's last pitch, say that `finish-block` comes next.

## Drop

When a pitch is no longer worth doing or cannot fit its cut line: `status: dropped`, `ended: <today>`, *What actually happened* says why, the slot table says dropped. Ask Luk before dropping.
