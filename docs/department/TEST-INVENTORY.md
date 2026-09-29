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
| `dom/attraction-libs.test.ts` | Dialog focus return, toasts, threat level, evasive controls, test hooks | 1 |
| `unit/attractions/*.test.ts` | Restored from `7fd8996`: the attractions' pure logic (AEM, newsletter integrity, CAPTCHA reducer, casino odds, contact instruments, cube, forms, HUD, presentation, progress, subway, tailor, classification) and shared libraries | 1 |
| `unit/scan-dist.test.ts` | Budgets per route, vendored engines (lazy, capped, only their dice exempt), route coverage including decoys and newsletter posts | 1 |
| `unit/pipeline.test.ts` | `e2e-hooks` job; deploy needs e2e, e2e-hooks and Lighthouse | 1 |

## Browser

| File | Covers | Stage |
| --- | --- | --- |
| `department.spec.ts` | Opening copy, six categories with anchors, directory links, menu (Escape, outside click), related offices and return, no "Continue to…", Direct access (persistence, `?mode=`), display settings, DOOM dock, terms of reading, no-JS directory | 1 |
| `access.spec.ts` | Skip link, Request résumé beside Go directly to résumé, no dialog or focus move on arrival, no-JS résumé | 0 |
| `pages.spec.ts` | Projects integrity, colophon limitations, credits, 404, tribute plainness | 0–1 |
| `attractions/*.spec.ts` | Restored from `7fd8996` and re-pointed at the Department shell: advertising archive, newsletter, cube, forms, HUD, personnel/wishlist/Nintendo/tribute, presentation, Character Review/loadout/research/causes, gameplay overlay (`@hooks`), résumé selection | 1 |
| `a11y.spec.ts`, `layout.spec.ts`, `routes.spec.ts`, `privacy.spec.ts`, `print.spec.ts` | Every page, now including the share decoys and newsletter posts | 1 |

## Still to come

- **Stage 2:** the specs for verification, hyperlink allocation, correspondence, cookie
  administration and classification (restored and rewritten for their payoffs), and the
  department-counting and notice specs.
- **Stage 3:** the release procedure (unit, DOM and browser) and the three creative journeys.
