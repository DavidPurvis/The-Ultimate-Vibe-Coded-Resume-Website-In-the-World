# The-Ultimate-Vibe-Coded-Resume-Website-In-the-World

Witness Greatness.

> A technically excellent system with one institutional mission: regulating access to a résumé that is already public.

**Live:** https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/
**The résumé, directly:** https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume/

Ask for David Purvis's résumé on the home page and the Department of Recruiter Verification opens a case. It is competent, polite and completely unnecessary.
1. It asks you to clarify the scope of your request.
2. It approves an extract in principle.
3. It resists releasing the full document, twice.
4. It escalates to a ceremony in which eleven services review one real bullet.
5. It reports findings about how you behaved.
6. It asks for an acknowledgment, which you may appeal.

Then it closes the case, and you get the résumé.

The résumé was never behind the case. On every other page the first Tab stop is a link to it, the header links it, and the case panel links it directly at every step.

## The rules the Department follows

- **The visitor can always reach the résumé.** It takes at most eleven actions, and "Request expedited processing" takes one at any step.
- **Randomness controls the theater, never your rights.** Each case has a seed. It picks the case number (never with a 7), the risk score's last digits, which bullet the ceremony reviews, and how long each fake service takes. The reducer that decides what happens never reads it.
- **After authorization, the comedy stops.** The résumé pages are separate documents with no case code, no institutional copy, and a startup script that cannot read storage.
- **Everything fails open.**
  - A step that fails to load approves the request by default.
  - Blocked storage keeps the case in memory.
  - Without JavaScript, the button is a plain link to the résumé.
- **Accessibility changes the performance, never the entitlement.** The release control resists twice for everyone:
  - with a mouse it slides away;
  - on a touch screen it moves between three fixed places;
  - with a keyboard or reduced motion it stays put, and the request is reassigned in words.

  How you interacted is never recorded.
- **What it notices stays in your tab.** Tab switches, copies (where, never what), reloads and printing become named events in this tab's session storage. Nothing is sent anywhere, and the CSP forbids connecting to any other server. With Global Privacy Control or Do Not Track on, it stops noticing, and says so.

## Pages

| Route | What it is |
| --- | --- |
| `/` | The Access Request case (and, printed, the résumé) |
| `/resume/` | The résumé. Never gated; works without JavaScript. |
| `/resume/for/emb/`, `/plt/`, `/be/` | The embedded, platform/SRE and backend cuts, each with its own one-page PDF |
| `/projects/` | Projects, written under the same integrity rules as the résumé |
| `/privacy/` | What this site stores (one session key), with a working Reset |
| `/how-it-was-built/` | The colophon: the machinery, with a limitation for every part |
| `/credits/` | Every font, icon, library and asset, with its licence |
| `/tribute/` | In memoriam: Terry A. Davis. Sincere. |
| `/doom/` | DOOM shareware episode 1, downloaded only when you press Play |
| `/resume.md`, `/llms.txt`, `/robots.txt`, `/resume*.pdf` | Plain machine-readable surfaces |

## Promises the build and tests enforce

- **The résumé is true.**
  - **Source of every line.** Every line is a framing of a fact in `src/content/resume/` (Fact → Framing → Composition). `validateContent()` fails the build if a framing adds a number or a technology its fact doesn't have, or puts a bullet under the wrong role.
  - **Rendered output.** The integrity rules R1–R12 in `src/lib/integrity.ts` then run on the rendered pages, every PDF's text layer, `resume.md` and `llms.txt`. They check exact titles and honours wording, a whitelist of numbers, and a denylist of technologies never to claim. They also require coursework-only skills to be labelled as coursework, and allow no phone numbers.
- **Every PDF is exactly one Letter page.** `scripts/postbuild.ts` prints each résumé page in headless Chromium, and `scripts/verify-pdf.ts` checks:
  - page count and size;
  - the text layer;
  - the integrity rules;
  - that no institutional sentence reaches the text or the metadata.
- **The case is provably fair.** The Department is one pure reducer over a fixed six-step pipeline (`src/domain/case.ts`). Property and replay tests check that:
  - the résumé is at most eleven actions away;
  - expedite, print or any failure authorizes in one;
  - a closed case never reopens;
  - two seeds given the same actions reach the same result.
- **Every modality gets the same outcome.** Browser tests walk the whole case by mouse, keyboard, touch and reduced motion, and require identical dispositions. axe (WCAG 2.2 AA) runs on every page and every step, in light and dark, with zero serious or critical findings. Targets are at least 44 px, and nothing scrolls sideways at 320 px.
- **Nothing leaves the site.**
  - Zero cookies, zero analytics, zero third-party requests.
  - Fonts, icons and DOOM are self-hosted.
  - One CSP, defined once in `src/lib/csp.ts`, is checked character for character on every built page; `'wasm-unsafe-eval'` is allowed only in DOOM's own frame.
  - App code contains no permission prompts, transmit APIs, fingerprinting, clipboard reads or `Math.random`.
- **Nothing mimics malware or system chrome.** No CAPTCHA look-alike, no "verify you are human", no Run-box or paste instructions, no `<form>`, no credential or autofill fields.
- **Small and separate.** The scanner (`scripts/scan-dist/`) computes each page's JavaScript from the build's own chunk graph:
  - `/` stays under 12 KB gzipped, and each lazily loaded step under 6 KB;
  - the résumé pages under 2 KB and free of any case module;
  - most other pages ship none.

## Architecture

```
src/
  domain/       the Department: events, steps and budget, reducer, findings, seeded assessment, disposition (pure)
  runtime/      the kernel on /: lifecycle (Scope), persistence, modality, signals, title, announcer
  steps/        one DOM renderer per step (scope, preview, release, ceremony, findings, acknowledgment…)
  content/
    resume/     facts, framings, compositions, roles, projects, numbers, lexicon, resolve, validate
    institution/  the Department's copy
    site/       plain page copy and route metadata
  doom/         DOOM player wiring
  lib/          storage primitives, CSP, boot scripts, integrity rules, résumé text, paths, icons
  components/, layouts/ (Site, Resume), pages/, scripts/ (page entry points), styles/
public/doom-engine/   DOOM's frame (play.html, boot.js); engine and WAD vendored here at build time
scripts/        postbuild (PDFs), verify-pdf, scan-dist/, build/chunk-graph.mjs, serve-dist, vendor-doom, rasterize
tests/          unit, property, replay, dom (happy-dom), golden, e2e (Playwright)
docs/overhaul/  baseline, test inventory, playtest protocol
```

A browser signal becomes a semantic event. The reducer turns event + state into the next state and ignores anything that doesn't apply. The kernel persists the accepted log and mounts exactly one step at a time. Each step's listeners, timers and nodes live in a `Scope`, which is disposed when the step changes.

## Commands

Node 22 (`.nvmrc`). Chromium comes from Playwright.

```bash
npm ci
npm run dev            # local dev server (vendors DOOM first)
npm test               # unit, property, replay and DOM tests (Vitest)
npx vitest run --coverage   # with the coverage gate
npm run build          # vendor DOOM → typecheck → static build → print and verify every résumé PDF
npm run scan           # scan dist/: CSP, references, budgets, boundary, integrity, forbidden patterns
npm run test:e2e       # Playwright against the built dist/ (serve:dist)
npm run rasterize      # regenerate favicons and og.png from the SVG sources
npm run format         # Prettier
```

The E2E suite runs against the production build. There are no test hooks; tests seed a case the same way a returning visitor would.

## Pipeline and deploy

`.github/workflows/pipeline.yml` builds once, then tests, measures and deploys those same bytes:

```
check → build → { e2e (chromium, mobile, firefox, webkit), lighthouse } → deploy (main only)
```

**The build job:**
1. builds the site;
2. prints and verifies the PDFs;
3. scans `dist`;
4. writes `site.sha256`.

**Every later job** starts with `.github/actions/verified-site`, which fails unless the downloaded `dist` matches that manifest exactly.

**Deploy** runs no install and no build; it publishes the verified artifact to GitHub Pages.

One-time setup:
- **Settings → Pages → Source = GitHub Actions**.
- If branch protection is on, require `Format, typecheck, unit tests`, `Build, PDF verify, scan`, the four `E2E (…)` checks and `Lighthouse budgets`.

**Custom domain:**
1. Set the repository variables `SITE_URL` (e.g. `https://example.com`) and `BASE_PATH` (`/`).
2. Add `public/CNAME`.

Every job reads the same variables.

## Changing the résumé

Facts live in `src/content/resume/facts.ts`, their wordings in `framings.ts`, and each cut in `compositions.ts`. After editing:

```bash
npm test && npm run build && npm run scan
```

Structural validation, the integrity rules, the golden files and the one-page PDF checks stop anything that isn't in the facts or doesn't fit.

The honours wording is enforced as **Magna Cum Laude** (rules R1/R1b and the PDF check). Change it only with an authoritative source, and in one commit that updates:
- the fact;
- its framings;
- the rules;
- the PDF needle;
- the golden files.

## Credits and license

Code: public domain ([Unlicense](LICENSE)). Assets and libraries keep their own licences: IBM Plex Sans and IBM Plex Mono and Fraunces (OFL), Lucide (ISC), Astro (MIT). Original art was made for this site and is public domain like the code.

DOOM is a separate program served in its own frame: Chocolate Doom compiled to WebAssembly by Cloudflare ([doom-wasm](https://github.com/cloudflare/doom-wasm), GPL-2.0; source at the link) and id Software's unmodified shareware episode 1, under its shareware licence. The full list is at `/credits/`.

The Department of Recruiter Verification is fictional. No endorsement is implied by anyone, including id Software.
