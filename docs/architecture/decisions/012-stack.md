---
project: merel
type: decision
status: accepted
updated: 2026-11-14
---
# 012 Stack

**Decision.** Merel is built with Vite and TypeScript, with Preact and @preact/signals for the interface. Styles are plain CSS with the tokens of [[DESIGN]] as custom properties; no CSS framework. Vitest runs the unit tests, Playwright one browser check, ESLint with typescript-eslint the lint. Node 26 (LTS), pinned in `.nvmrc`. Fonts come from the @fontsource packages, Latin subset, bundled into the build so they are served from our own domain. The build writes one static page per language (`/en/`, `/fr/`, `/nl/`) and a small `/` that picks one, so static hosting needs no routing rules. Claude Code proposed, Luk agreed, 2026-11-14.

**Why.** Preact is about 5 KB, which matters on a phone, and JSX suits a screen that is mostly SVG: Merel, the staff, the keys. Signals keep state small and explicit without a store library. Vite builds static files and serves them fast in development; Vitest shares its config. Plain web components would mean writing re-rendering by hand; React does the same job as Preact at several times the size; Svelte is fine but less familiar to the tools that build Merel.
