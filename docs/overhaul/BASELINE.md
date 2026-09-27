# Baseline before the overhaul

Measured on `pre-overhaul` (`7fd8996`, the PR #1 merge; tree identical to `42ddc7d`), in the Claude Code sandbox, on 2026-09-26.

## Local gate

| Step | Result | Time |
| --- | --- | --- |
| `npm run format:check` | pass | 7 s |
| `npm run typecheck` (`astro check`) | pass | 21 s |
| `npx vitest run --coverage` | 25 files, **250 tests** passed. Coverage: 97.02% lines, 88.04% branches (gate 90/85). | 4 s |
| `npm run build` (astro build + 4 PDFs + verify) | pass | 29 s |
| `npm run scan` | 39 pages, 60 scripts, 37 stylesheets clean | 1 s |
| `PUBLIC_TEST_HOOKS=1` rebuild + `playwright test --project=chromium --project=mobile` | **273 passed, 1 skipped** | 4.7 min |

## PDFs (`verify-pdf`)

| File | Pages | Rendered text lines | Integrity violations |
| --- | --- | --- | --- |
| `resume.pdf` (GEN) | 1 Letter | 43 | 0 |
| `resume-emb.pdf` | 1 Letter | 47 | 0 |
| `resume-plt.pdf` | 1 Letter | 48 | 0 |
| `resume-be.pdf` | 1 Letter | 42 | 0 |

## Static JS per page (gz KB, `scan-dist`)

| Route | JS | Budget |
| --- | --- | --- |
| `/` | 17.2 | 22 |
| `/verify/` | 18.3 | 20 |
| `/casino/` | 17.9 | 20 |
| `/legal/` | 15.3 | 16 |
| `/contact/`, `/support/` | 14.3 | 16, 15 |
| `/doom/` | 14.1 | 15 |
| Other gag pages | 12.7–13.8 | 14 |
| `/resume/` and the 3 lane cuts | 2.2 | 3 |
| three.js + cube (lazy) | 137.2 | 200 |

## CI (latest run on the baseline tree)

[Run 36246258561](https://github.com/DavidPurvis/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/actions/runs/36246258561), `pull_request`, all green:

| Job | Duration |
| --- | --- |
| Format, typecheck, unit tests | 37 s |
| Build, PDF verify, scan, e2e (Chromium, mobile, Firefox and WebKit smoke) | 9 min 22 s. The e2e step alone took 8 min, and ran on a `PUBLIC_TEST_HOOKS=1` rebuild. |
| Lighthouse budgets | 4 min 26 s; all assertions passed |

The same commit also ran once for the branch `push` ([run 36246254892](https://github.com/DavidPurvis/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/actions/runs/36246254892)), which is the duplicate removed in P0.

## Golden files

`tests/golden/` (added in P0) holds each lane's plain text and render model, plus `resume.md`. P5 must keep the text byte-identical.
