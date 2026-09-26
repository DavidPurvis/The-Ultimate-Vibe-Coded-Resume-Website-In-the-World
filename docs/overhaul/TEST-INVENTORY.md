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
