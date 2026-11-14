---
project: merel
type: decision
status: accepted
updated: 2026-11-14
---
# 013 Piano samples for the keys

**Decision.** The instrument's keys sound like a grand piano: one short recording per note of the scale, C4 to C5, from the University of Iowa Electronic Music Studios' piano recordings (mezzo forte), which may be used for any project without restrictions. `npm run piano` downloads them, trims each to two seconds from the strike with a soft fade, levels them, checks the pitch and writes `public/piano/<pitch>.m4a`; only those eight clips (about 200 KB) are in the repository, self-hosted and kept offline by the service worker. The plain tone stays as the fallback for a note that cannot load. The about page credits the recordings. Luk chose recorded samples over a synthesised piano, 2026-11-14.

**Why.** Luk heard the triangle tone on the first candidate and asked for a piano. A synthesised piano needs no files but sounds electric; recordings sound like the instrument people know, cost little, and the Iowa set has every note, so no note is stretched. Salamander Grand Piano (CC BY 3.0) was the other candidate; Iowa needs no licence terms at all.

**Consequences.** The keys play the recording; Merel's stand-in tone for a missing clip stays a tone, so the piano is the player's sound and Merel's voice stays his own. Changing the piano means changing `scripts/piano.ts` and running it again.
