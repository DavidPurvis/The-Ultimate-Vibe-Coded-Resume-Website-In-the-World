# Test inventory (Department of David Purvis)

This covers what the Department handoff changed. The overhaul's inventory
([../overhaul/TEST-INVENTORY.md](../overhaul/TEST-INVENTORY.md)) still describes the
constitutional tests that carried over unchanged: integrity, résumé, PDF, boundary, CSP and
pipeline.

## Where tests run

- **`npm test`:** unit and DOM tests (Vitest, happy-dom).
- **`npm run test:e2e`:** browser tests against the production artifact (`dist/`). Specs tagged
  `@hooks` are excluded.
- **`npm run validate:hooks`:** builds a test-only artifact (`dist-hooks/`, with
  `PUBLIC_TEST_HOOKS=1`) and runs only the `@hooks` specs. These are the specs that need forced
  roulette samples or stub gameplay footage. The delivered artifact never contains the hooks; the
  scanner checks this.
- **`npm run validate`:** the whole local sequence, the same as CI.

## Unit and DOM

| File | Covers | Stage |
| --- | --- | --- |
| `unit/case/state.test.ts` | Case file defaults, validation (missing, old, malformed, duplicate, unknown), the reducer | 0 |
| `unit/case/policy.test.ts` | Canonical routes (root and base path), department IDs, status tiers, notice priority and context, release summary | 0 |
| `unit/case/evidence.test.ts` | Refusal vs. closing without declaring, explicit skip vs. unfinished verification, losses, appendix | 0 |
| `unit/storage.test.ts` | Prefs and session field-wise validation, identity migration, memory fallback, legacy cleanup | 0 |
| `dom/scenes.test.ts` | Scene registry: one major scene, replacement disposes, late imports after cancel, focus not stolen | 0 |
| `dom/mode.test.ts` | Direct access (internal `recruiter`), `?mode=`, before the shell initializes | 0 |
| `dom/attraction-libs.test.ts` | Dialog focus return (never stolen from a replacement), toasts, threat level, evasive controls, test hooks | 1–2 |
| `dom/release.test.ts` | Release: which activations are intercepted (modified clicks, new tab, download, released, Direct access, no `<dialog>`); three views each with a direct link and close; approval when shown; the determination cites only records; Escape and early close; duplicate activation; Direct access and replacement close it; failed load falls back to the link; a stale load does nothing | 3 |
| `dom/notices.test.ts` | Page entry records a department once (newsletter grouped, excluded routes, reloads); status tiers; Direct access records and shows nothing; one notice in its context, once; the visibility gate; nothing over an active procedure; the cookie invitation and "Not now" | 2 |
| `unit/attractions/*.test.ts` | Restored from `7fd8996`: the attractions' pure logic (AEM, newsletter integrity, CAPTCHA reducer, casino odds, contact instruments, cube, forms, HUD, presentation, progress, subway, tailor) and shared libraries | 1 |
| `unit/attractions/classification.test.ts` | Human / Automated system / Prefer not to disclose; closing early declares nothing; transcription optional and recorded only as done or skipped; partners and biscotti | 2 |
| `unit/scan-dist.test.ts` | Budgets per route, vendored engines (lazy, capped, only their dice exempt), route coverage including decoys and newsletter posts | 1 |
| `unit/pipeline.test.ts` | `e2e-hooks` job; deploy needs e2e, e2e-hooks and Lighthouse | 1 |

## Browser

| File | Covers | Stage |
| --- | --- | --- |
| `department.spec.ts` | Opening copy, six categories with anchors, directory links, menu (Escape, outside click), related offices and return, no "Continue to…", Direct access (persistence, `?mode=`), display settings, DOOM dock, terms of reading, no-JS directory | 1 |
| `access.spec.ts` | Skip link, Request résumé beside Go directly to résumé, no dialog or focus move on arrival, no-JS résumé | 0 |
| `pages.spec.ts` | Projects integrity, colophon limitations, credits, 404, tribute plainness | 0–1 |
| `attractions/*.spec.ts` | Restored from `7fd8996` and re-pointed at the Department shell: advertising archive, newsletter, cube, forms, HUD, personnel/wishlist/Nintendo/tribute, presentation, Character Review/loadout/research/causes, gameplay overlay (`@hooks`), résumé selection | 1 |
| `procedures.spec.ts` | Classification (three choices, noted, nondeclaration, closing early, transcription never stored); cookie administration (explicit only, one dialog, focus return, no classification; the invitation at two departments); Character Review finding ("Cart returned."); correspondence ("Address prepared. Nothing was sent."); journey J1 and the case record across pages | 2 |
| `attractions/casino.spec.ts` | Allocation copy, losses only for completed unsuccessful spins, interrupted spin records none, third request allocated; forced outcomes `@hooks`; musical material only on request, removed by Close and Direct access | 2 |
| `attractions/captcha.spec.ts` | The rounds with calm objections, "Review complete.", Direct access mid-objection leaves nothing locked, a stationary skip recorded as a skip | 2 |
| `release.spec.ts` | J2 (cube → DOOM → Request résumé → Approved. → the ordinary résumé), J1's approval citing the skip, every view's direct link and close, Escape, a modified click opening a tab, Direct access closing it, J3 without JavaScript; axe on all three views | 3 |
| `a11y.spec.ts`, `layout.spec.ts`, `routes.spec.ts`, `privacy.spec.ts`, `print.spec.ts` | Every page, now including the share decoys and newsletter posts | 1 |

## Not automated

- Whether each department is funny, and whether a nontechnical visitor can tell each one's
  intention, procedure and small result. That is the manual creative review in
  [REPORT.md](REPORT.md).
- Firefox and WebKit run only the `@smoke` specs, and only in CI (they aren't installed in the
  environment this was built in).
