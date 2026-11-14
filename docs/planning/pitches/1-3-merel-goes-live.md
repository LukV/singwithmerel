---
project: merel
type: pitch
status: shipped
started: 2026-11-14
shipped_on: 2026-11-14
block: 1-sing-along
created: 2026-11-14
---
# 1.3 Merel goes live

**In brief.** Merel 0.1.0 on singwithmerel.com, deployed by GitHub Actions from release tags, with candidates on next.singwithmerel.com: installable, working offline, with Merel's real voice if the clips exist, tips for phones, a short privacy page, and copy finished in all three languages. At the end Luk installs it on his phone and practises in airplane mode.

## Problem

After 1.2 Merel works on a laptop in development. Nobody else can reach it, a phone cannot install it, and it needs a network.

## Sketch

**Hosting** per [[010-hosting]], confirmed with Luk at the start. The public hosted zone for singwithmerel.com exists in Route 53, with only its NS and SOA records (Luk, 2026-11-14). S3 private bucket, CloudFront with origin access control, ACM certificate in us-east-1 for singwithmerel.com, www and next, Route 53 alias records, www redirecting to the apex. A second bucket and distribution serve next.singwithmerel.com for release candidates, with a `noindex` header so search engines skip it. Paths /en, /fr, /nl served as static pages; a request to / picks the language. Created once by a small script or by hand with the steps written in `deploy/README.md`; no infrastructure framework. Luk runs the one-time setup in his AWS account; Claude Code prepares and documents it.

**Deploy through GitHub Actions.** `.github/workflows/deploy.yml` runs on every pushed tag `v*`: the same checks as CI, then build, `aws s3 sync` and a CloudFront invalidation. A tag with `-rc.` goes to next.singwithmerel.com; any other `v*` tag goes to singwithmerel.com and creates a GitHub release from that version's `CHANGELOG.md` section. It signs in to AWS through GitHub's OIDC provider with a role whose trust policy allows only this repository's `v*` tags, and whose permissions cover only these two buckets and distributions: no AWS keys are stored in GitHub. The role ARN, bucket and distribution id are repository variables. `npm run deploy` stays as a manual fallback from Luk's machine.

**Install and offline.** A web app manifest with Merel's icon in the sizes phones ask for, and a service worker that caches the app, the fonts and every clip at first visit. After an update the app takes the new version on the next start.

**Voice clips build step.** `npm run voice` reads `public/voice/source/*.wav`, measures each clip's pitch, refuses any more than 10 cents off its name, applies the manifest's octave, and writes `.m4a` files. If the folder is empty, it says so and the app keeps its tone fallback.

**Phones.** On the identity screen, one line each: use headphones for singing along; the silent switch on an iPhone mutes Merel. After the first completed level, an invitation to add Merel to the home screen, with the one sentence on why (Safari forgets progress after a week otherwise).

**Privacy and about.** A short page per language: no accounts, nothing stored outside your browser, no tracking, no audio recorded; the progress code; who made Merel.

**Copy.** Every string written in English, French and Dutch, short, not translated word for word. Luk reads the French and Dutch.

**A last pass.** Lighthouse (performance, accessibility, best practices, PWA) on the live site; contrast and keyboard checks; a real iPhone and a real Android phone.

## Cut line

The site live on https://singwithmerel.com in three languages, installable, working offline after the first visit.

## Out of scope

- Analytics of any kind.
- Producing the clips: Luk drops them in; this pitch only builds and checks them.
- A custom alphabet (decision 009).

## Risks

- **Certificates and DNS** take time to validate; start the AWS setup first.
- **The OIDC trust policy** must name this repository and its tags exactly; too loose lets any repository or branch deploy, too tight fails silently. Test it with a deliberate run from a branch, which must be refused.
- **Service worker updates** can leave a phone on an old version; test an update on an installed phone.
- **Clip quality.** An AI voice that drifts in pitch fails the check; the error must say which clip and by how much.

## Definition of done

- [ ] https://singwithmerel.com and https://www.singwithmerel.com serve the release over HTTPS, www redirects; https://next.singwithmerel.com serves the latest candidate. *(after Luk's tags; HTTPS, the redirect and the headers already answer on all three names)*
- [x] `deploy/README.md` holds the one-time setup (bucket, distribution, certificate, DNS, the OIDC provider and role) and the manual fallback.
- [ ] A candidate tag deploys to next, a release tag to the site with a GitHub release, through the OIDC role; no AWS secret in GitHub; `npm run deploy` works as fallback. *(after Luk's tags; the role already refuses a branch)*
- [ ] The app installs on iOS and Android and works offline after the first visit. *(on Luk's phones; offline is checked in Chromium)*
- [x] `npm run voice` builds and checks the clips, or says the folder is empty.
- [x] Phone tips, install invitation, privacy page, all copy in EN, FR and NL. *(Luk reads the French and Dutch)*
- [ ] Lighthouse 90 or more on performance, accessibility, best practices and SEO on the live site; no contrast failures. *(on the live site after the tag; the built site scores 99, 100, 100, 100)*
- [x] Decision 010 accepted (or replaced); the docs match what runs.

## Test scenario

1. `npm run voice` with no files: it says the folder is empty and exits cleanly. With Luk's clips in `voice/`: it lists each with its measured offset in cents, and refuses any over 10.
2. On `main`, `cz bump --prerelease rc` and `git push --follow-tags`. The deploy run is green, its log shows the role it assumed, the sync and the invalidation, and https://next.singwithmerel.com serves the candidate. In the repository settings, no AWS secret exists.
3. After the block's scenario passes on next, `cz bump` and `git push --follow-tags`. Open https://singwithmerel.com and https://www.singwithmerel.com on a laptop. Both land on the app over HTTPS, in your browser's language.
4. Run Lighthouse on the live site: 90 or more on performance, accessibility, best practices and SEO.
5. On your iPhone, open the site, do one level, accept the invitation and add Merel to the home screen.
6. Open Merel from the home screen in airplane mode. It starts, Merel sings, your progress is there.
7. Change one word in the copy through a small pull request, merge it, `cz bump` (a patch) and push the tag. Wait for the deploy run, reopen the installed app twice: the new word shows, and the GitHub release lists the fix.
8. Read the French and Dutch copy, and the privacy page in all three. (A person judges: clear, short, nothing promised that is not true.)

---

## What actually happened

Everything above the cut line is built, and the AWS side is live; the site itself waits for Luk's first tag. Luk accepted decision 010 at the start, chose eu-north-1 for the buckets and signed in to AWS on this machine; `deploy/setup.sh` then created the certificate (issued within minutes), the two buckets, the origin access control, the path function, the two header policies, the two distributions with their DNS records, the OIDC provider, the deploy role and the repository variables. HTTPS, the www redirect, `/fr` to `/fr/`, the headers and `noindex` on next answer on all three names; the buckets are empty until the first deploy. A temporary workflow on the block branch tried to assume the role and AWS refused it; it was removed afterwards. I did not upload to next by hand: a tag is what deploys, so the first candidate is also the first test of `deploy.sh`.

Routine choices: the service worker is a small hand-written file the build fills in (`build/service-worker.ts`) rather than vite-plugin-pwa, so there is nothing to keep up to date; pages come from the network first, so a phone shows a new release at the next start, and everything else from the cache. The clip sources moved from `public/voice/source/` to `voice/` at the top of the repository, because anything in `public/` is published. `npm run voice` measures pitch with YIN over the steady middle of each clip, converts with `afconvert` on a Mac (or `ffmpeg`), and writes `public/voice/voice.json`; the app now asks only for the clips listed there, so the live site makes no failing requests, and its stand-in tone follows the clips' octave. The content security policy allows only our own host; `vite preview` sends the same headers, so every browser check runs under it. The privacy page is the same app at `/<lang>/privacy/`. The install invitation shows only where installing can be done (Safari on an iPhone or iPad, or a browser that offers it), just before the next open level, and "Not now" is remembered. The phone tips sit at the foot of the first screen; inside the Start column they made the page wider than a 390 px phone, which a browser check now guards. Lighthouse no longer has a PWA category (removed in Lighthouse 12), so the check is performance, accessibility, best practices and SEO; installability is covered by the browser check and Luk's phones. A `robots.txt` keeps SEO at 100. `.cz.toml` now merges release candidates into the release's changelog section (`changelog_merge_prerelease`), so the GitHub release for 0.1.0 lists the whole block. The font licences and "Made by Luk Verhelst" with a GitHub link are on the about page, as Luk chose. After the ship, Luk made the 17 clips in Synthesizer V (voice Yun Hua, `voice/make/` has the notes and the cutter); all pass, the furthest 7 cents off, and the `.m4a` files are now in git so a tag deploys them.
