# The-Ultimate-Vibe-Coded-Resume-Website-In-the-World

Witness Greatness.

> Opening David's GitHub requires administrative oversight, and the Department sincerely believes this is appropriate.

**Live:** https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/
**The résumé, directly:** https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume/

The **Department of David Purvis** is a solemn public-service institution. It performs elaborate procedures around the ordinary task of learning about David, and it ends in an ordinary résumé.

The front desk states the Department's authority:

> **Department of David Purvis**
> Public access to information concerning David Purvis.
> **Subject:** David Purvis · **Capability:** Good at computers.

Below that is a directory of six categories. Every service can be used in any order:

| Category | Services |
| --- | --- |
| Visitor Services | Classification; verification (windows, cabbages, an empty Linux round, a silent audio challenge) |
| Records | Character Review, Personnel File, Skills, Projects, the Newsletter, résumé selection |
| Correspondence | Contact instruments (a ten-billion-step phone slider, a character drum); hyperlink allocation (a roulette wheel that allocates by the third request) |
| Public Affairs | Research, causes, the wishlist, a public statement, two self-assessment forms |
| Recreation | DOOM, the tungsten cube, Résumé.ppt, musical material, optional overlays, the advertising archive |
| Facilities | Display settings, Direct access, cookie administration, privacy, terms of reading, credits, how it was built |

A quiet case record keeps count. The status line reads:

- "Request received." at 0–1 departments;
- "Your file has been circulated." at 2–3;
- "Additional interest has been referred for review." at 4 or more.

Now and then, on a later page, a notice mentions something you actually did.

**Request résumé** opens a three-view release procedure: Résumé request, Request confirmation, then Determination with "Approved." **Go directly to résumé** sits beside it on the front desk, and in every view of the procedure.

## The rules the Department follows

- **Nothing is a prerequisite.** No sequence, no score, nothing to unlock. The status line and notices only change what the Department says.
- **Nothing starts by itself.** Arriving opens no dialog, moves no focus and loads no media. Every procedure starts from its own control.
- **The résumé is always one link away.** On every page:
  - the first Tab stop is a link to it;
  - the header links it;
  - Request résumé is a real link that the procedure only enhances.

  Modified clicks, new tabs, Direct access, JavaScript being off and every request after approval all go straight to the résumé.
- **Callbacks cite only real actions.** A refusal to classify, a skipped verification, a completed losing spin, an opened appendix. Each is noticed at most once, on a later page in its own context, never over an open procedure. Nothing is inferred from time or from absence.
- **Direct access suspends every procedure** and keeps every page. Internally it is still the `recruiter` mode, so `?mode=recruiter` and `?mode=chaos` keep working.
- **After approval, the comedy stops.** The résumé pages are separate documents with no Department code, no departmental copy, and a startup script that cannot read storage.
- **The tribute is sincere.** `/tribute/` carries no status, notices, advertisements, novelty themes, overlays or scripts.

## Pages

| Route | What it is |
| --- | --- |
| `/` | The front desk and the directory (and, printed, the résumé) |
| `/resume/` | The résumé. Never gated; works without JavaScript. |
| `/resume/for/emb/`, `/plt/`, `/be/` | The embedded, platform/SRE and backend cuts, each with its own one-page PDF |
| `/verify/`, `/about/`, `/personnel-file/`, `/skills/`, `/projects/`, `/blog/…`, `/tailor/` | Visitor Services and Records |
| `/contact/`, `/casino/` | Correspondence: contact instruments and hyperlink allocation |
| `/beliefs/`, `/support/`, `/wishlist/`, `/nintendo/`, `/sell-your-data/`, `/confess/` | Public Affairs |
| `/doom/`, `/cube/`, `/presentation/`, `/rick/` | Recreation |
| `/privacy/`, `/legal/`, `/credits/`, `/how-it-was-built/` | Facilities |
| `/r/…` | Share pages with sincere Open Graph copy |
| `/tribute/` | In memoriam: Terry A. Davis. Sincere. |
| `/resume.md`, `/llms.txt`, `/robots.txt`, `/resume*.pdf` | Plain machine-readable surfaces |

## Promises the build and tests enforce

- **The résumé is true.**
  - **Source of every line.** Every line is a framing of a fact in `src/content/resume/` (Fact → Framing → Composition). `validateContent()` fails the build if a framing adds a number or a technology its fact doesn't have, or puts a bullet under the wrong role.
  - **Rendered output.** The integrity rules R1–R12 in `src/lib/integrity.ts` run on:
    - the rendered pages, every PDF's text layer, `resume.md` and `llms.txt`;
    - the projects page and the newsletter's posts.
- **Every PDF is exactly one Letter page.** `scripts/postbuild.ts` prints each résumé page in headless Chromium, and `scripts/verify-pdf.ts` checks:
  - page count and size;
  - the text layer;
  - the integrity rules;
  - that no departmental sentence reaches the text or the metadata.
- **The case record is small and honest.** `src/case/state.ts` holds finite IDs, validation and the reducer; `src/case/policy.ts` holds counting, tiers, notice selection and the release summary. Both are pure, and tested for:
  - old, malformed, duplicate and unknown records;
  - root and GitHub Pages base paths;
  - tier boundaries and notice priority;
  - approval never disabling exploration.
- **Procedures clean up after themselves.** Each is a scene whose timers, listeners, animations, observers, nodes and media belong to one scope. One major procedure runs at a time. Close, Escape, a replacement, navigation and Direct access all dispose it. A late import that is no longer wanted is dropped, and focus never returns to an opener once something else has it.
- **Accessibility holds in every state.** axe (WCAG 2.2 AA) runs:
  - on every page, in light and dark with reduced motion;
  - on the release dialog's three views and the gameplay overlay.

  Targets are at least 44 px, and nothing scrolls sideways at 320 px.
- **Nothing leaves the site unless asked.**
  - Zero cookies, zero analytics.
  - No third-party request until a play control asks for YouTube's privacy-enhanced player (the only other origin the CSP allows, as a frame).
  - Fonts, icons, three.js, matter.js and DOOM are self-hosted.
  - One CSP, defined once in `src/lib/csp.ts`, is checked character for character on every built page.
  - App code contains no permission prompts, transmit APIs, fingerprinting, clipboard reads or `Math.random`.
- **Nothing mimics malware or system chrome.** No CAPTCHA vendor look-alike, no "verify you are human", no Run-box or paste instructions, no `<form>`, no credential or autofill fields. Form numbers never contain a 7.
- **Small and separate.** The scanner (`scripts/scan-dist/`) computes each page's JavaScript from the build's own chunk graph:
  - `/` at most 16 KB gzipped; most department pages at most 14 KB; verification and allocation at most 20 KB;
  - each lazily loaded procedure at most 12 KB;
  - three.js at most 200 KB and matter.js at most 35 KB, both loaded only by their attractions;
  - the résumé pages at most 2 KB and free of any Department module;
  - the tribute at 0 KB.

## Architecture

```
src/
  case/         the case record: state and policy (pure), evidence, record writes,
                notices on the page, the release request and procedure
  scenes/       one directory per attraction or procedure (logic.ts pure, index.ts DOM)
  lib/          scene registry, mode (Direct access), storage, dialog, CSP, boot scripts,
                integrity rules, résumé text, destinations, paths, icons
  runtime/      Scope lifecycle, modality, announcer, legacy cleanup
  content/
    department/ the Department's shell copy, directory and case wording
    copy/       each attraction's copy
    resume/     facts, framings, compositions, roles, projects, numbers, lexicon, resolve, validate
    site/       plain page copy and route metadata
  components/, layouts/ (Site, Resume), pages/, scripts/ (entry points), styles/, blog/
public/doom-engine/   DOOM's frame; engine and WAD vendored here at build time
scripts/        postbuild (PDFs), verify-pdf, scan-dist/, build/chunk-graph.mjs, serve-dist, vendor-doom, rasterize
tests/          unit, dom (happy-dom), golden, e2e (Playwright)
docs/department/  the handoff, creative brief, test inventory, report and next steps
```

Every department page loads the shell (`src/scripts/department.ts`):

- Direct access;
- display settings and the directory menu;
- the overlays you switched on;
- the case record;
- click delegation for explicitly requested procedures.

Each procedure is a lazy chunk requested through the scene registry (`src/lib/scene.ts`), which drops stale requests.

## Commands

Node 22 (`.nvmrc`). Chromium comes from Playwright.

```bash
npm ci
npm run dev             # local dev server (vendors DOOM first)
npm test                # unit and DOM tests (Vitest)
npm run build           # vendor DOOM → typecheck → static build → print and verify every résumé PDF
npm run scan            # scan dist/: CSP, references, budgets, boundary, integrity, forbidden patterns
npm run test:e2e        # Playwright against the built dist/ (everything except @hooks)
npm run validate:hooks  # build dist-hooks/ with test hooks, then run only the @hooks specs
npm run validate        # the whole local gate: format, build, coverage, scan, E2E, hooks
npm run rasterize       # regenerate favicons and og.png from the SVG sources
npm run format          # Prettier
```

The production artifact never contains test hooks, and the scanner checks this. A few specs force a roulette sample or stub gameplay footage; they are tagged `@hooks` and run against a separate `PUBLIC_TEST_HOOKS=1` build in `dist-hooks/`, which is never deployed.

## Pipeline and deploy

`.github/workflows/pipeline.yml` builds once, then tests, measures and deploys those same bytes:

```
check → build → { e2e (chromium, mobile, firefox, webkit), e2e-hooks, lighthouse } → deploy (main only)
```

**The build job:**
1. builds the site;
2. prints and verifies the PDFs;
3. scans `dist`;
4. writes `site.sha256`.

**The e2e, Lighthouse and deploy jobs** start with `.github/actions/verified-site`, which fails unless the downloaded `dist` matches that manifest exactly.

**e2e-hooks** makes its own test-only build and uploads nothing.

**Deploy** runs no install and no build; it publishes the verified artifact to GitHub Pages.

One-time setup:
- **Settings → Pages → Source = GitHub Actions**.
- If branch protection is on, require:
  - `Format, typecheck, unit tests`;
  - `Build, PDF verify, scan`;
  - the four `E2E (…)` checks;
  - `E2E (test hooks)`;
  - `Lighthouse budgets`.

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

Code: public domain ([Unlicense](LICENSE)). Assets and libraries keep their own licences:

- **Fonts:** IBM Plex Sans, IBM Plex Mono, Fraunces and Comic Neue (OFL).
- **Icons:** Lucide (ISC), Fluent Emoji (MIT), game-icons.net (CC BY 3.0).
- **Libraries:** Astro, three.js and matter.js (MIT).
- **Original art** was made for this site and is public domain like the code.

DOOM is a separate program served in its own frame: Chocolate Doom compiled to WebAssembly by Cloudflare ([doom-wasm](https://github.com/cloudflare/doom-wasm), GPL-2.0; source at the link) and id Software's unmodified shareware episode 1, under its shareware licence. The full list is at `/credits/`.

The Department of David Purvis is fictional. No endorsement is implied by anyone, including id Software.
