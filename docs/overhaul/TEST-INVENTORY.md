# Test inventory (overhaul P0)

This classifies every test file that existed at `pre-overhaul` (`7fd8996`), plus the golden guard added in P0.

**Classes:**
- **Constitutional:** protects access, factual integrity, privacy, security, accessibility, performance or routes. It's kept, and only re-pointed at new routes or selectors.
- **Implementation:** tests an internal mechanism that's being replaced. Its assertions move to the replacement.
- **Obsolete:** protects a joke that the overhaul removes. It's deleted in the same commit as the feature.

The "Phase" column says when the file changes.

## Unit (`tests/unit`)

| File | Class | Fate | Phase |
| --- | --- | --- | --- |
| `integrity.test.ts` | Constitutional | Kept (R1–R12 fixtures, number normalisation, real-résumé checks) | — |
| `resume-data.test.ts` | Constitutional | Moves to `tests/unit/content/`, asserting against `resolve()` | P5 |
| `lanes.test.ts` | Constitutional | Moves to `tests/unit/content/`, asserting against `resolve()` | P5 |
| `content/golden.test.ts` | Constitutional (P0 guard) | Kept. P5 must keep the text byte-identical. The only allowed model diff is the E2 label fix. | — |
| `credits.test.ts` | Constitutional (licensing) | Kept; data pruned with assets | P4A |
| `doom.test.ts` | Constitutional (enclave, vendoring) | Kept, minus the dock-size case | P4A |
| `machine-text.test.ts` | Constitutional (`llms.txt`/`robots.txt`) plus implementation (threat, rng) | `llms`/`robots` expectations rewritten to plain; threat and rng blocks deleted | P4A / P4B |
| `storage.test.ts` | Implementation | Primitives part kept; prefs/session schemas replaced by `tests/dom/persistence.test.ts` | P4B |
| `scene.test.ts` | Implementation | Ported to `tests/dom/lifecycle.test.ts` (Scope) | P2, deleted P4B |
| `small-libs.test.ts` | Mixed | paths/format/entity kept. Runaway geometry → `tests/unit/steps/release-geometry.test.ts` (P3). Playful links and newsletter deleted (P4A). rng `seedFrom`, threat, mode, konami and theme deleted (P4B). | P3–P4B |
| `copy.test.ts` | Mixed | Rewritten for `content/institution` + `content/site` (grounding rules, no DRV-7, no scam mimicry) | P4A |
| `landing-logic.test.ts` | Obsolete | Identity reducer tests (P2); partners and biscotti tests (P4A) | P2 / P4A |
| `tailor.test.ts` | Obsolete (quiz, Claude handoff) | Deleted | P4A |
| `aem.test.ts`, `blog.test.ts` | Obsolete | Deleted | P4A |
| `cage-photos.test.ts`, `captcha.test.ts`, `progress.test.ts` | Obsolete | Deleted | P4A |
| `casino.test.ts`, `contact.test.ts`, `cube.test.ts`, `forms.test.ts` | Obsolete | Deleted | P4A |
| `hud.test.ts`, `legal.test.ts`, `presentation.test.ts`, `subway.test.ts` | Obsolete | Deleted | P4A |

## End to end (`tests/e2e`)

| File | Class | Fate | Phase |
| --- | --- | --- | --- |
| `routes.spec.ts` | Constitutional | Route list derived from `ROUTES`; `DECOYS` and blog removed | P4A |
| `privacy.spec.ts` | Constitutional | Journey rewritten (no banner, no YouTube); GPC case added | P2 / P4A |
| `a11y.spec.ts` | Constitutional | Every route plus every case step, light and dark; old dialog cases removed | P2 / P4A |
| `layout.spec.ts` | Constitutional | Route list and CLS list updated; rickroll dialog case removed | P2 / P4A |
| `print.spec.ts` | Constitutional | `/` prints the résumé; plain pages print themselves | P2 / P4A |
| `resume.spec.ts` | Constitutional | Hire chain and `?mode` tests replaced by "no institutional copy"; lane-page tests moved in from `tailor.spec` | P2 / P4A |
| `doom.spec.ts` | Constitutional (enclave) | Dock and Recruiter Mode tests replaced by "pagehide removes the frame" | P4A / P4B |
| `pages.spec.ts` | Mixed | Projects integrity, credits and 404 kept (404 rewritten without the runaway); contact and "Inspect me" deleted; tribute moved in | P4A |
| `legal.spec.ts` | Mixed | Part 1 (storage table, Reset, what loads) becomes `privacy-page.spec.ts`; everything else deleted | P4A |
| `tailor.spec.ts` | Mixed | Lane-page tests → `resume.spec.ts`; quiz and handoff deleted | P4A |
| `landing.spec.ts` | Obsolete | Deleted | P2 |
| `captcha.spec.ts`, `casino.spec.ts`, `chaos.spec.ts` | Obsolete | Deleted (the skip-link test moves to `access.spec.ts`) | P4A / P4B |
| `ads.spec.ts`, `blog.spec.ts`, `cube.spec.ts`, `forms.spec.ts` | Obsolete | Deleted | P4A |
| `hud.spec.ts`, `personnel.spec.ts`, `presentation.spec.ts`, `review.spec.ts`, `subway.spec.ts` | Obsolete | Deleted | P4A |
| `helpers.ts` | Support | `seedPrefs` → `seedCase` (P2); `HTML_ROUTES` derived from `ROUTES` (P4A) | P2 / P4A |
| `png.ts` | Support | Kept (DOOM pixel checks) | — |

## Test hooks

`window.__uvcr` (`src/lib/testHooks.ts`, built only with `PUBLIC_TEST_HOOKS=1`) is used only by:
- `casino.spec.ts` (`forceSample`, `armAllPlayful`);
- `subway.spec.ts` (`subwayVideos`).

Both specs are obsolete, so the hooks and the second build are deleted in P4A/P4B. After that, E2E runs on the production `dist`.

## Changes made in P2

`/` is now the Access Request, so it no longer carries the old gag layer (header menus, threat meter, ads, the cookie banner). Specs that tested that layer through `/` now open a legacy page that still has it:
- `chaos.spec.ts` and `ads.spec.ts` go to `about/`;
- `personnel.spec.ts` (menu test) goes to `about/`;
- `a11y.spec.ts` and `privacy.spec.ts` first visit to `about/`.

These specs are still deleted with the legacy layer (P4A/P4B).

**New in P2:**

| File | Covers |
| --- | --- |
| `tests/dom/lifecycle.test.ts` | `Scope`, `mountPage` (ported from `scene.test.ts`) |
| `tests/dom/imports.test.ts` | No module-scope side effects in `src/{runtime,steps,domain}` |
| `tests/dom/persistence.test.ts` | `uvcr:case` load, save, corrupt input, legacy cleanup, throwing storage |
| `tests/dom/signals.test.ts` | Visibility, copy and print adapters; GPC; listener types |
| `tests/dom/kernel.test.ts` | CTA intercept (A8), fail-open (A7), `?mode=recruiter`, the notice, restore without focus theft |
| `tests/dom/steps.test.ts` | Each step renderer: its beat, its events, nothing left after dispose |
| `tests/unit/csp.test.ts` | `buildCsp`, `ENGINE_CSP` equals `play.html`, boot scripts |
| `tests/e2e/narrative.spec.ts` | Journeys J1–J3, J5–J8, J10, J11 (slice form until P3) |
| `tests/e2e/boundary.spec.ts` | `/resume/` stays clean while a case is open in the same tab |
| `tests/e2e/access.spec.ts` | Skip link, direct link and expedite at every step, modified clicks, 44 px, J9 |

## Changes made in P3

- The runaway geometry tests moved from `small-libs.test.ts` to `tests/unit/steps/release-geometry.test.ts`, with the module (`src/steps/release-geometry.ts`).
- `tests/unit/voice.test.ts` (new) checks every institutional string: no `!`, no banned words, notice ≤25 words, step bodies ≤45, and a finding never reads the same on two surfaces.
- `tests/unit/source-policy.test.ts` now also covers steps and runtime: no raw timers or listeners in steps, no HTML strings, no `Math.random`, no `localStorage`, and only the kernel reduces, saves or loads steps.
- `tests/dom/steps.test.ts` covers the release step in each performance (keyboard, touch, mouse, reduced motion, a mid-review preference change, restore) and the ceremony (budget, skip, reduced motion, a mid-run preference change, focus).
- `narrative.spec.ts` runs the full pipeline: J1 (mouse), J2 (keyboard), J3 (reduced motion) end on identical disposition lines; J4 (touch, mobile project); J8 reloads mid-release; J10 aborts the ceremony chunk.
- `access.spec.ts`, `layout.spec.ts` and `a11y.spec.ts` now check every case step: escapes present, 44 px targets, no sideways scrolling at 320/390 px, axe clean in light and dark.

## Changes made in P4A

The anthology and the whole legacy gag layer are gone, and their tests with them. DOOM moved onto `Site.astro` and `Scope` in this phase (planned for P4B), because keeping `/doom/` on the old layout would have meant editing `chaos.ts` only to delete it later.

**Deleted:**
- e2e: `ads`, `blog`, `captcha`, `casino`, `chaos`, `cube`, `forms`, `hud`, `legal`, `personnel`, `presentation`, `review`, `subway`, `tailor` (its lane-page tests moved into `resume.spec.ts`);
- unit: `aem`, `blog`, `cage-photos`, `captcha`, `casino`, `contact`, `cube`, `forms`, `hud`, `landing-logic`, `legal`, `presentation`, `progress`, `scene`, `subway`, `tailor`.

**Rewritten:**
- `helpers.ts`: `HTML_ROUTES` is derived from `ROUTES`; `seedPrefs` removed.
- `routes.spec.ts` checks that the route table is exactly the set of built pages.
- `pages.spec.ts` covers the plain projects, colophon, credits and 404 pages, and checks that plain pages carry no institutional copy.
- `print.spec.ts`: `/` prints the résumé; every other page prints itself.
- `privacy.spec.ts`: a whole visit makes no third-party request, sets no cookie and stores one key; under GPC the Department records nothing ambient.
- `doom.spec.ts` drops the dock and Recruiter Mode tests, and adds "leaving the page ends the game".
- `a11y.spec.ts` and `layout.spec.ts` run on the surviving routes only.
- `machine-text.test.ts`: `llms.txt` and `robots.txt` are plain.
- `copy.test.ts` covers the surviving copy.
- `credits.test.ts` checks every file in `public/`.
- `storage.test.ts` covers the primitives only.
- `small-libs.test.ts` keeps the activation truth table, paths and identity.

**New:** `privacy-page.spec.ts` (the storage table, Reset, legacy-key cleanup, no JS).

E2E now runs on the production build: the test-hook build is gone from CI.

## Changes made in P5

- `resume-data.test.ts` and `lanes.test.ts` moved to `tests/unit/content/` and assert against `resolve()`. Role headers are checked against `ROLES`. The PLT no-GPA degree line is checked to be labelled E2.
- `content/validate.test.ts` (new): the published content validates cleanly. Six kinds of mutation must each be caught: unknown fact, adapted wording without a reason, an extra number, foreign or absent technology, a bullet under the wrong role, a bad reference or order. The grandfathered list is pinned.
- `content/lanes.test.ts` also checks that the case's lightweight lines match the render model.
- `tests/golden/resume-plt.model.json` changed on one line: the no-GPA BS entry's block went from E1 to E2 (the planned label fix). Every text golden, `resume.md` and the other models are byte-identical.
