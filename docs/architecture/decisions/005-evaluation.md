---
project: merel
type: decision
status: accepted
updated: 2026-11-14
---
# 005 Evaluation

**Decision.** The app judges the user's voice in the browser with classic pitch detection, no AI and nothing sent anywhere, and judges mildly. It gets there in three releases: sang along, then a steady tone per note, then a match per note. Each release falls back to the one before. Luk, 2026-11-14.

**Why.** Pitch detection of one voice is a solved, cheap problem in the browser. Mildness and the fallback follow the rule never to frustrate.
