# Department of David Purvis — Final report

This covers the handoff in [HANDOFF.md](HANDOFF.md), Stages 0–3, on branch
`claude/epic-wright-7js1ej`. The draft PR is [DavidPurvis/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World#3](https://github.com/DavidPurvis/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/pull/3).

**Nothing was merged or deployed.** The live site still serves the previous version (`main` at `ddc392e`).

Sections:
1. Completed work
2. Checks actually run, with their results
3. Remaining limitations
4. Claims that are not verified

## Starting point, and how it differed from the handoff

The handoff was written against `7fd8996`, plus uncommitted work on David's machine. By the time of implementation, `main` had moved on: the overhaul (`ddc392e`) had removed the attractions and replaced the home page with a six-step "Recruiter Verification" case.

Following David's two decisions, this work:
- builds on current `main`;
- restores the attractions from `7fd8996`;
- re-implements the partial case work from the handoff's specification.

Resolutions where the handoff and the code differed:

| The handoff assumed | What this branch does |
| --- | --- |
| An existing scene registry and `Disposer` | A small registry (`src/lib/scene.ts`) over the existing `Scope` lifecycle. There is still one cleanup framework. |
| The CI builds with test hooks, then restores production | E2E runs on the verified production artifact. A separate `e2e-hooks` job builds `dist-hooks/` and runs only the `@hooks` specs, and deploy needs it. The scanner proves the artifact has no hooks. |
| Storage reset on version mismatch | Field-wise validation. A malformed record keeps its valid fields. The live site's `uvcr:case` key is removed. |

## 1. Completed work

### Stage 0 — foundation (`bdbfcfa`)
- **The case record, three parts with one-way imports:**
  - `src/case/state.ts`: IDs, validation, reducer. Pure.
  - `src/case/policy.ts`: counting, tiers, notice selection, release summary. Pure.
  - `content/department/case.ts`: the copy.

  Storage imports only `state.ts`. A test checks that the copy covers every ID.
- **Storage:** `uvcr:prefs` and `uvcr:session` are restored with field-wise validation, a memory fallback, and the added `caseFile` and `casinoLosses` fields.
- **Scenes:**
  - a scene registry with major-scene exclusivity and generation-guarded lazy loading;
  - Direct access, which is still the internal `recruiter` mode, with `?mode=` unchanged.
- **Removed:** the Recruiter Verification case and its tests.
- **Unchanged:** the résumé and its E2 provenance (the golden files are unchanged).

### Stage 1 — identity and the restored attractions (`7d39318`)
- **The shell:** the Department header (directory menu, Résumé, Direct access), a status line, one notice slot, related offices with a return to the directory on every department page, and a Facilities footer.
- **The front desk:** the exact opening, then:
  - Request résumé beside a stationary Go directly to résumé;
  - the six-category directory with anchors.

  Nothing opens, moves focus or loads media on arrival.
- **Restored from `7fd8996`** and re-pointed at the shell: every attraction page, its scene, components, copy and assets.
- **Removed, per the handoff or the privacy rules:**
  - random link interception, automatic cookie and identity entry, ads in the shell (they are now an optional archive in Recreation);
  - the Notification prompt, the "we've detected" panel and the mock camera and location permission stickers;
  - the unload trap, Konami, custom cursors, tab guilt, the crying favicon and the runaway 404 exit.
- **Departmental copy:**
  - DDP form numbers, which never contain a 7, and kickers by category;
  - no "Continue to…" links;
  - no explanations of the joke ("the house is rigged", "verifies nothing" and the like are gone);
  - project records lead with David's ordinary motives.
- **Facilities:**
  - Terms of reading grow as they are read and end with "I have read this sentence." → "Reading acknowledged.";
  - the privacy page and colophon are rewritten to match the code.
- **The tribute is `plain`:** no status, notices, ads, themes, overlays or JavaScript.
- **Build and security:**
  - `frame-src` allows `youtube-nocookie.com`, which loads only from play controls;
  - three.js and matter.js have their own chunks and caps;
  - per-route budgets;
  - route coverage includes the share pages and newsletter posts.
- **CI:** the `e2e-hooks` job, which deploy needs.
- **Docs:** [HANDOFF.md](HANDOFF.md) (verbatim), [CREATIVE-BRIEF.md](CREATIVE-BRIEF.md) (drawn from the handoff, since no separate brief was supplied) and [TEST-INVENTORY.md](TEST-INVENTORY.md).

### Stage 2 — continuity and optional procedures (`2150f8c`)
- **The case record on each page** (`src/case/notices.ts`):
  - the page's department is recorded once. Nothing is recorded in Direct access or on excluded routes, and the newsletter counts as one department;
  - the status tier is stated;
  - at most one notice appears: an evidence-backed callback in its context, or the cookie invitation from the second department on;
  - a notice counts as issued only once it is visible. It never appears over an open procedure and is never queued.
- **Hyperlink allocation:** the handoff's pending, failed and "Open GitHub" copy. `casinoLosses` counts only completed unsuccessful spins.
- **Cookie administration:**
  - one dialog holding consent, partners and certificate;
  - opened only on request, with focus returned to what opened it;
  - it never leads to classification.
- **Classification:**
  - Human (self-report, "Noted."), Automated system (the models), Prefer not to disclose ("Declaration of nondeclaration received.");
  - closing early declares nothing;
  - transcription is optional and recorded only as done or skipped. Its text is never stored.
- **Verification:**
  - every timer and listener is on a page scope that Direct access and navigation cancel;
  - calm objections;
  - "Review complete.";
  - a stationary skip, recorded as a skip.
- **Character Review:** the shopping-cart committee finding, with its stamp, recommendation and evidence control ("Cart returned."). Ordinary qualities come first.
- **Correspondence:** "Address prepared. Nothing was sent.", and an ordinary email link. That link previously routed through hyperlink allocation.
- **Musical material** is a major scene. A replaced dialog never pulls focus back from its replacement.

### Stage 3 — release and final regression (`7a8972b`)
- **Request résumé** (`src/case/request.ts`, `src/case/release.ts`):
  - progressive enhancement of a real link;
  - three views, each with Go directly to résumé and Close;
  - a determination drawn only from recorded evidence, then "Approved.";
  - approval is recorded when shown, with no auto-navigation;
  - later requests go straight through;
  - a failed load falls back to the link;
  - a stale load does nothing;
  - Direct access or a replacement closes it.
- The README is rewritten, and screenshots are in [screenshots/](screenshots/):
  - the portal (desktop and mobile);
  - two payoffs (Character Review, classification);
  - the release approval;
  - the ordinary résumé.
- The share card (`public/og.png`) and the favicons carry the Department.
- **Found by the final regression, fixed in `0e0f96b`:** the cube pages now ask for WebGL2 before fetching three.js. Details are under the E2E failures below.

## 2. Checks actually run

**Local, on the final code** (`47dab84`; Linux, Node 22, Chromium from `/opt/pw-browsers`):

| Check | Result |
| --- | --- |
| `npm run format:check` | Passed |
| `npm run typecheck` (inside `npm run build`) | 0 errors |
| `npx vitest run --coverage` | 385 tests passed. Coverage: 97.88% lines, 89.54% branches (minimums 90/85). The case core is held to 95/90 and passed. |
| `npm run build` | Passed. Four PDFs, each 1 Letter page with 0 integrity violations (43, 47, 47 and 42 text lines). |
| `npm run scan` | 40 pages, 60 scripts, every policy clean. JS budgets: `/` 14.0 of 16 KB, verification 17.8 of 20, allocation 18.5 of 20, the cube 12.0 of 14, the résumé at or under 1 of 2 KB, the tribute 0. |
| `playwright --project=chromium --project=mobile` (production `dist/`) | 275 passed, 0 failed |
| `npm run validate:hooks` (`dist-hooks/`, `@hooks` only) | 8 passed |
| Résumé golden files | Unchanged. The only intended model difference (E2) was already on `main`. |
| PDF layout | Inspected the print rendering of all four cuts at Letter width: each fits one page, with no clipping or overflow. `verify-pdf` separately confirms 1 Letter page and a selectable text layer per PDF. |

**CI** (`pipeline.yml`) on each pushed stage:

| Commit | Result |
| --- | --- |
| `7d39318` (Stage 1) | Green on all 8 jobs: format/typecheck/unit; build, PDF and scan; E2E chromium, mobile, firefox and webkit; E2E test hooks; Lighthouse. Deploy was skipped (pull request). |
| `2150f8c` (Stage 2) | **Lighthouse failed:** cumulative layout shift on `/` was 0.117 against a limit of 0.1. Every other job passed. |
| `7a8972b` (Stage 3) | **Three jobs failed:** Lighthouse (the same layout-shift finding), E2E chromium ("a modified click keeps its native meaning") and E2E firefox (J2's cube step). The build, unit, mobile, webkit and test-hooks jobs passed. |
| `762310b` (layout-shift fix) | Superseded by the next push. |
| `be70412` (spec fixes) | **E2E firefox failed:** on J2's cube page, three.js logged three console errors because Firefox on the runner has WebGL2 disabled (see below). Every other job passed, including Lighthouse, which confirms the layout-shift fix in CI. |
| `0e0f96b` (WebGL2 check) | **E2E firefox failed** on J2's new wait. Without WebGL, its either/or locator matched both the hidden canvas and the visible status, and Playwright's strict mode refused it. The page itself behaved correctly: the status showed and nothing was logged. Superseded by the next push. |
| `c86d278` (J2 locator) | Superseded by the next push. |
| `47dab84` (casino spec race) | **Green on all 8 jobs:** format/typecheck/unit; build, PDF and scan; E2E chromium, mobile, firefox and webkit; E2E test hooks; Lighthouse. Deploy was skipped (pull request). |

**The E2E failures.**
- **Modified click (a test assumption):** the test read the new tab's URL while the tab was still `about:blank`. It now waits for the tab to navigate.
- **J2 in Firefox (a real defect, found in two steps):**
  1. At first the test demanded a visible cube canvas. Firefox on the CI runner has WebGL2 disabled, so the page correctly kept its drawing. The test was changed to wait for three.js instead.
  2. With that, the next run showed the real problem. The cube pages fetched three.js (about 200 KB) *before* knowing WebGL was available, and three.js then logged three console errors when it couldn't create a context. The page's own comment promised three.js would load "only with WebGL".

  **Fix:** a check on a throwaway canvas (`src/scenes/cube/support.ts`) asks for WebGL2 first. Without it, `/cube/` keeps its drawing and explains why, the wishlist's hero stays a drawing, and nothing is downloaded or logged.

  **Tests:**
  - the no-WebGL cube spec now also asserts no console errors and no three.js request;
  - J2 waits for either settled state: a *visible* canvas, or the "declined to render tungsten" status. The first version matched the hidden canvas too, which failed once more in Firefox. I reproduced that in Chromium with WebGL stubbed out, and the corrected locator passes both with and without WebGL;
  - a DOM test covers the check (yes, no, and an error means no).

- **Allocation spec, mobile (a test race, found locally):** one full local run failed once. The test pressed Escape as soon as the music dialog's iframe had its `src`. Escape correctly removes the player, and if the stubbed response hadn't arrived yet, the browser aborted the request. The error watcher reported that as `requestfailed`.
  - **Reproduced** every time with a one-second stub delay.
  - **Fix:** the test now waits for the embed request to finish before closing.
  - **Result:** passes with the delay, and 39/39 across Chromium and mobile with `--repeat-each=3`.

**The Lighthouse failure.**
- **Cause:** Stage 2 server-rendered the status line hidden. The case bar was therefore collapsed at first paint until the case-record script revealed it and pushed the page down. A second, smaller shift came from IBM Plex Sans 600 arriving late and reflowing the header and the front desk's buttons.
- **Reproduced locally** at exactly 0.117.
- **Fix:**
  - the status line is in the first paint with tier 0's words whenever JavaScript is on and Direct access is off;
  - Department pages preload Plex Sans 600.
- **Measured after the fix** under 4× CPU throttling: 0.000 on `/`, `/privacy/`, `/projects/`, `/casino/` and `/verify/`, and 0.019 on `/about/`.
- **Remaining limitation:** a notice, when one is due, is inserted after load and can still move the page by its own height.

**Walk-throughs.** The three journeys were walked as browser tests, and the screenshots were reviewed by eye:
- **J1:** Character Review → skip verification → Correspondence shows "Inspection completed in the absence of inspection." → the approval cites "Verification: skipped.".
- **J2:** the cube renders on direct entry → DOOM's page is ready → Request résumé → "3 departments consulted. … No supporting declarations were supplied." → "Approved." → the ordinary résumé, with no Department markup.
- **J3:** JavaScript off → Go directly to résumé works immediately.

## 3. Remaining limitations

- **Not every restored attraction is scope-owned.** Several still attach some listeners or timers directly, as they did at `7fd8996`: the gameplay overlay, the contact instruments, the presentation, the allocation page's wiring, résumé selection, the merge simulation, gravity, the forms and the cube page. They sit on the attraction's own page or on elements it creates, so they end with the page, but no scope owns them. The procedures the handoff named do run on the scene lifecycle: verification, cookie administration, classification, musical material, release and the DOOM dock.
- **Firefox and WebKit** run only the `@smoke` specs, and only in CI.
- **Lighthouse** runs only in CI.
- **Gameplay footage** in the optional overlay is still placeholder tiles. No video IDs were supplied, so nothing loads from YouTube there; the privacy page says so.
- **Unverified Meta quotes were dropped, not kept hidden.** The old legal page carried them unrendered, waiting for verification. The new Terms of reading carry none.
- **Turning on Direct access resets the display setting** to the system default. This was already the old behavior.
- **The share card** keeps the overhaul's "UNDER REVIEW" stamp, with Department copy around it.

## 4. Claims that are not verified

- **Creative acceptance by a nontechnical visitor.** The handoff asks for every department to be checked: can a nontechnical visitor identify its intention, its unreasonable procedure and its small result? I reviewed the copy against the voice rules, but no human visitor has done this. The same goes for whether it's funny and whether people want to share it. This needs David's playtest (see [docs/overhaul/PLAYTEST.md](../overhaul/PLAYTEST.md) for a protocol).
- **Personal claims that David should confirm or veto.** These are marked `personalClaim` in `src/content/copy/greenFlags.ts`:
  - "Returns shopping carts." (now the committee finding);
  - the other personal lines carried over from `7fd8996`.
- **The project motives** ("David wanted a desk media controller", "…the buttons to work on Linux", "…to inspect his team's match statistics") are taken from the handoff. The self-hosted infrastructure project has no motive, because the handoff gave none.
- **"Nothing loads from another site until a play control is pressed."** The privacy spec checks this for a whole visit in Chromium. It was not audited in other browsers or with extensions.
- **The automated integrity checks** confirm the résumé matches the repository's approved facts. They don't independently verify the biography.
