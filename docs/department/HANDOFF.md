# Department of David Purvis — Implementation Handoff for Claude

## 1. Objective, current state, and fixed decisions

**Complete the existing site’s transformation into the Department of David Purvis: a polished public-service institution that performs elaborate procedures around the ordinary task of learning about David.** Preserve the existing attractions and technical architecture. The primary objective is comedy; the professional résumé provides the abrupt, ordinary ending.

**Mental image:** opening David’s GitHub requires administrative oversight, and the Department sincerely believes this is appropriate.

This document replaces the earlier implementation plan and incorporates the subsequent code audit. It is intended to be sufficient context for Claude to continue the work without access to the preceding conversation.

### Repository and starting point

Repository:

```text
/Users/davidpurvis/Documents/ChatGPT/Resume Website/
└── The-Ultimate-Vibe-Coded-Resume-Website-In-the-World
```

GitHub:

```text
https://github.com/DavidPurvis/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World
```

The September 28 inspection found `main` at `7fd8996`, with eight modified tracked files and two new files. Before editing, inspect the current diff again and preserve existing work.

The partial implementation currently includes:

- Removal of the résumé’s Hire ceremony, recruiter banner, theatrical fine print, and humorous PDF metadata.
- Ordinary résumé contact links and variant navigation.
- A case-state reducer, validation, presentation policy, and copy.
- Storage fields for the case record and unsuccessful roulette allocations.

The case system is **not connected to page visits or rendered UI**. The original homepage, branding, automatic entrance procedures, and random navigation interception remain.

The last completed audit, on September 27, found:

| Check | Recorded result |
|---|---|
| Unit tests | 250 passed |
| Typecheck | Passed |
| Branch coverage | 80.07%; required minimum is 85% |
| Formatting | Three files failed |
| Static production build | Passed |
| PDF validation | All four variants passed |
| JavaScript budgets | 23 routes failed |
| Selected Chromium tests | 21 passed, 8 failed; failures concerned removed controls or renamed labels |

These are historical results, not a substitute for validating the finished implementation.

### Fixed product decisions

| Decision | Required direction |
|---|---|
| Institution | **Department of David Purvis** |
| Audience | Everyone, including nontechnical visitors |
| Architecture | Existing Astro, TypeScript, static hosting, and browser-side scenes |
| Navigation | Exploration in any order |
| Attractions | Preserve existing depth and working machinery |
| Visual identity | Solemn public-service portal |
| Résumé access | Request at any time, with an ordinary direct alternative |
| Ending | Accurate, professionally formatted résumé without institutional performance |
| Success | Visitors enjoy discovering the site and want to share it |

Do not introduce prerequisites, a completion score, a mandatory sequence, analytics, a backend, or new professional claims.

Preserve public URLs, GitHub Pages base-path support, internal `chaos`/`recruiter` values, and existing mode query semantics. Rename the visible control to **Direct access**.

## 2. Visitor experience and editorial specification

### The shared portal

The first screen establishes authority before presenting elaborate procedures.

Use this opening:

> **Department of David Purvis**  
> Public access to information concerning David Purvis.
>
> **Subject:** David Purvis  
> **Capability:** Good at computers.

Follow it with:

- A six-category department directory.
- A primary **Request résumé** anchor.
- A separate, stationary **Go directly to résumé** link.
- A compact case-status line.

The initial page must not open a cookie scene or identity dialog, move focus, load third-party media, or launch an optional attraction.

The shared header provides the institution name, directory access, and résumé access. Move prominent threat meters and novelty controls out of the default header. Existing threat data may remain available to the optional HUD.

### Directory and navigation

Use the following categories. These are organizational groups, not stages.

| Category | Services |
|---|---|
| **Visitor Services** | Classification and verification |
| **Records** | Character Review, Personnel File, Skills, Projects, Newsletter, résumé selection |
| **Correspondence** | Contact instruments and hyperlink allocation |
| **Public Affairs** | Beliefs, causes, wishlist, public statements, and self-assessment forms |
| **Recreation** | DOOM, cube, presentation, HUD, gameplay modes, musical material |
| **Facilities** | Display settings, cookie administration, privacy, credits, technical documentation |

Keep the homepage as the directory. Use section anchors for category and settings access rather than creating unnecessary new routes. Classification remains available through an explicit control in Visitor Services.

Every department page must include a clear description of its service, relevant actions, related offices, and a return to the directory. Replace compulsory “Continue to…” navigation with descriptive links.

A direct visit to the cube, a blog post, or Character Review must be understandable without prior scenes.

### Department treatments

| Department or interaction | Required behavior and payoff |
|---|---|
| **Classification** | First choices are Human, Automated system, and Prefer not to disclose. Human confirmation relies explicitly on self-report and concludes “Noted.” Automated system reveals the existing model choices. Refusal concludes “Declaration of nondeclaration received.” |
| **Supplemental transcription** | Retain as an optional action after classification. It is not required to complete a declaration. Never persist transcription text. |
| **Verification** | Preserve the window grid, cabbage round, empty-image round, alternative challenge, skip control, and existing rejection bounds. Rewrite feedback as calm administrative objections. Conclude “Review complete.” |
| **Character Review** | Lead with ordinary, universally understandable qualities. Give the shopping-cart record a finding, committee recommendation, evidence control, and prominent stamp. Evidence reveals “Cart returned.” |
| **Projects** | Lead with ordinary motives: David wanted a desk media controller; wanted the buttons to work on Linux; wanted to inspect his team’s match statistics. Retain the complete technical records beneath those introductions. |
| **Hyperlink allocation** | Preserve roulette and its guarantee by the third attempt. Introduce the request with “The requested destination is available. Allocation is pending.” A failed allocation says “Your request remains within the processing period.” Success yields “Open GitHub,” or the corresponding destination. |
| **Correspondence** | Preserve the phone slider and character drum. Keep instructions usable. Completion says “Address prepared. Nothing was sent.” Provide an ordinary email alternative. |
| **Cookie administration** | Introduce through a compact, optional notice after sufficient exploration. Preserve the partner directory, biscotti, and certificate as deeper, explicitly requested procedures. |
| **Terms of reading** | Keep growing terms about the act of reading. Final action: “I have read this sentence.” Result: “Reading acknowledged.” End the interaction there. |
| **Recreation** | Preserve the distinctive operation of DOOM, the cube, presentation, and optional overlays. Institutional framing must not turn each into another verification exercise. |
| **Tribute** | Preserve sincere content and exclude institutional status, notices, advertisements, title manipulation, novelty themes, and optional overlays. |

Keep darker appendix material optional. Preserve internal distinctions between fictional premises and verified professional information.

Remove random rickroll interception from ordinary navigation. Musical outcomes remain available through explicit playback controls in the relevant attractions.

Remove default advertising placements from the shared shell. Preserve existing parody advertising material as optional content within Recreation; do not automatically introduce advertisements at case thresholds.

### Voice and visual treatment

The Department uses concrete administrative verbs: **received, recorded, referred, reviewed, retained, returned, approved**.

Apply these rules to visible copy, accessible names, metadata, social previews, console greetings, and machine-readable surfaces:

1. Explain procedures, not the comedy.
2. Become calmer as the decision becomes less reasonable.
3. Keep action labels understandable.
4. Give each interaction one dominant premise.
5. Leave space after its payoff.
6. Describe accessibility, errors, storage, and exits plainly.
7. Understate David while the institution supplies the grandeur.

Remove explanations such as “the house is rigged,” “verifies nothing,” “just kidding,” and “this page contains no jokes.” Keep factual technical explanations in Facilities.

Use paper, navy, and restrained red; IBM Plex Sans for ordinary interface text and IBM Plex Mono for reference numbers. Use thin rules, service rows, document sections, and restrained borders. Reduce rounded promotional cards, oversized slogans, and decorative clutter.

Body text must remain at least 16px; routine labels at least 14px. Preserve 44px targets for buttons and similar controls, visible focus, usable dark presentation, and reduced-motion behavior. Specialized attractions may retain their own visual language inside the shared shell.

## 3. State, lifecycle, and résumé-release contracts

### Separate storage from presentation

Correct the current dependency chain before connecting case continuity.

Use three distinct responsibilities:

| Responsibility | Contents |
|---|---|
| **Case state** | Finite IDs, defaults, validation, reducer |
| **Case policy** | Route eligibility, status tier, contextual-notice selection, release evidence |
| **Case presentation** | Copy and DOM rendering |

Storage may import lightweight state definitions. It must not import narrative copy or scene modules.

The existing implementation derives valid notice IDs from the copy object, pulling prose into shared JavaScript. Replace that with independent ID constants and verify that copy covers those IDs.

Keep the existing bundle budgets. Reduce shared dependencies before considering any narrowly justified budget change.

### Stored information

Retain the additive, backward-compatible case record:

```ts
interface CaseFile {
  departments: DepartmentId[];
  issuedNotices: CaseNoticeId[];
  released: boolean;
}
```

Use the existing identity, CAPTCHA, and appendix snapshots as evidence. Retain the draft `casinoLosses` aggregate, but update it only when a completed spin renders an unsuccessful allocation outcome.

Do not count an interrupted animation as a completed loss. Preserve the existing roulette attempt accounting and third-attempt guarantee.

Do not add timestamps, visit logs, click logs, dwell time, stored free text, or analytics.

Old or malformed session records receive safe defaults without losing valid preferences. Filter unknown IDs and deduplicate arrays. Preserve the existing memory fallback when browser storage fails.

### Department counting

Expose the canonical, root-relative route through server-rendered page metadata. Use that value for classification rather than feeding a GitHub Pages-prefixed pathname directly into the route map.

Counting rules:

- Homepage counts once as `intake`.
- Each existing top-level entertainment destination counts once.
- All newsletter posts and its index share one department ID.
- Reloads, query changes, and fragment changes do not increase the count.
- Résumé routes, downloads, privacy/legal pages, credits, technical documentation, tribute, share redirects, and utility pages do not count.
- Direct access mode does not add case history.
- Opening a dialog or switching a setting does not create a department visit.

Render the current page’s status after recording its eligible entry:

| Distinct departments | Status |
|---|---|
| 0–1 | “Request received.” |
| 2–3 | “Your file has been circulated.” |
| 4+ | “Additional interest has been referred for review.” |

These thresholds only affect presentation. They never unlock content, launch a scene, or change allocation odds.

### Contextual notices

Replace the recurring identity callback with one shared, quiet notice area.

A page may display **at most one new contextual notice**, including the cookie-preference invitation. The status line is separate and does not create a second notification.

Use these evidence-backed callbacks:

| Evidence | Eligible context | Copy |
|---|---|---|
| Explicit classification refusal | Visitor Services or Records | “Classification withheld. Classification requirement satisfied.” |
| Explicit verification skip | Correspondence | “Inspection completed in the absence of inspection.” |
| Completed unsuccessful allocation | Correspondence | “Previous allocation unsuccessful. Continued interest noted.” |
| Appendix actually opened | Records, outside the immediate appendix result | “Visitor has reviewed material removed from circulation.” |

When more than one callback is eligible, use a fixed priority: refusal, skipped verification, unsuccessful allocation, appendix. Filter by context before applying that order.

Show callbacks on a subsequent eligible page entry, allowing the original interaction’s payoff to stand alone.

If no contextual callback is eligible, a pending cookie preference may use the notice slot once the department count reaches two. Record that invitation as issued only when it is displayed. The cookie administration control remains available in Facilities afterward.

Do not display generic “file circulated” notifications that merely repeat the status line.

Mark a notice issued after it has been inserted into a visible, permitted notice area. Computing eligibility, loading a module, or finding the area unavailable must not consume it. Do not display notices over an active major procedure or queue a burst after it closes.

### Approval is not a global off switch

The `released` flag has one purpose: future résumé requests in the same session bypass the ceremony.

It must **not** disable department visits, suppress the rest of the site, change the visitor’s mode, or erase history. Returning from the résumé should leave exploration available.

Directly opening the résumé does not fabricate an approval event.

### Shared scene lifecycle

Use the existing scene registry and `Disposer`; do not create a second cleanup framework.

Before adding release:

- Bring CAPTCHA feedback timers, progress intervals, audio-challenge timers, and listeners under lifecycle cleanup.
- Register release, cookie administration, and musical dialogs as major scenes.
- Ensure a major scene replaces and fully disposes any preceding major scene.
- Make partner management and its certificate views part of the cookie procedure, with only one modal surface active.
- Guard delayed imports with current mode, current document, request generation, and relevant optional-mode preference checks.
- Make close, Escape, replacement, navigation, and mode change cancel owned timers, animations, media, observers, listeners, and pending work.
- Check `stillActive()` after awaited work before mutating UI.
- Prevent focus restoration from stealing focus from a replacement dialog.

Closing cookie administration must not open classification.

The CAPTCHA and delayed-import problems identified in the audit remain inspection findings until reproduced. Add controlled tests that demonstrate cancellation behavior rather than assuming the current implementation is safe.

### Résumé-release interaction

Keep **Request résumé** as a real, base-path-aware anchor to `/resume/`.

Enhance only an ordinary activation when:

- Departmental behavior is enabled.
- Release has not already been approved.
- The current surface supports the procedure.
- Native dialog behavior is available.

Modified clicks, new-tab actions, downloads, JavaScript-disabled use, and direct-access links retain native navigation.

The procedure has exactly three views:

| View | Content | Action |
|---|---|---|
| **Résumé request** | “You are requesting David Purvis’s résumé.” | **Confirm request** |
| **Request confirmation** | “Please confirm that your previous confirmation concerned this document.” | **Confirm** |
| **Determination** | A short summary of actual recorded evidence, followed by **Approved.** | **Open résumé** |

Every view includes **Go directly to résumé** and an ordinary close control.

The determination may contain one short summary of departments consulted and applicable identity, verification, allocation, or appendix evidence. Never infer actions from elapsed time or missing records. With no supporting declarations, say “No supporting declarations were supplied.”

Record approval when the determination is successfully displayed. Do not automatically navigate after approval; the visitor activates the ordinary link.

Additional rules:

- Escape or early closure creates no penalty.
- Reopening an unfinished procedure starts at the first confirmation.
- Later requests after approval navigate directly.
- No countdowns, artificial waits, required department visits, or denials.
- Duplicate activation cannot create multiple pending procedures.
- Failed loading after interception falls back to the anchor destination.
- Cancellation or navigation invalidates pending work so a late import cannot reopen a dialog or redirect the visitor.
- During an open procedure, enabling Direct access closes it normally and leaves the permanent résumé link available.

### The ordinary résumé

Preserve the completed cleanup across General, Embedded, Platform/SRE, and Backend variants.

Each résumé contains only its professional document, PDF download, print control, ordinary contact links, and ordinary variant selection.

Exclude case UI, institution branding, optional scene code, humorous metadata, and novelty presentation. Honor ordinary system/light/dark presentation; map novelty theme preferences to a normal presentation without changing the visitor’s saved preference for other pages.

Keep the verified résumé content unchanged except for the confirmed provenance correction: the bachelor’s entry without GPA must reference **`E2`**, not the master’s record **`E1`**.

Preserve machine-readable output, structured data, and existing print behavior.

## 4. Implementation stages and review boundaries

Complete these stages in order. Each stage must include its relevant tests and documentation updates.

### Stage 0 — Repair the foundation

- Inspect and preserve the existing uncommitted changes.
- Separate case validation from narrative copy.
- Add meaningful case-state and policy tests.
- Correct the bachelor’s provenance reference.
- Update stale résumé tests to the intentional new controls and labels.
- Format changed files.
- Make local validation use the same production/test-build distinction as CI.
- Implement the lifecycle repairs needed by later procedures.

**Exit condition:** existing résumé cleanup remains intact; affected checks pass; shared JavaScript budgets are restored; controlled cancellation tests pass.

### Stage 1 — Institutional identity and presentation

- Add Department branding, the quiet opening, six-category directory, and shared navigation.
- Keep Request résumé as ordinary navigation until its enhancement is ready.
- Remove automatic cookie and identity entry.
- Remove random navigation interception.
- Move display settings and technical explanations into Facilities.
- Apply departmental copy and visual treatment across existing destinations.
- Preserve recreation, optional appendix material, and sincere tribute behavior.
- Record the supplied creative brief and this implementation contract in repository documentation.

**Exit condition:** the static site works as a coherent, nonlinear institution, including with JavaScript disabled.

### Stage 2 — Continuity and optional procedures

- Connect eligible page entry to the reducer and storage.
- Render status and route-appropriate, nonrepeating notices.
- Persist actual completed allocation losses.
- Introduce deferred, optional cookie administration.
- Implement Human/Automated/Prefer not to disclose classification.
- Make transcription supplemental.
- Complete verification, correspondence, character-review, and terms payoffs.
- Update the privacy disclosure for the actual case fields and media behavior.

**Exit condition:** multiple exploration orders produce supported callbacks without unlocking content, stacking dialogs, or inventing history.

### Stage 3 — Release and final regression

- Implement progressively enhanced résumé release.
- Verify repeated requests, early closure, loading failure, mode changes, and direct navigation.
- Confirm every résumé variant remains isolated and ordinary.
- Finish metadata, machine-readable copy, README, and developer documentation.
- Run the complete validation pipeline and manual creative review.
- Leave a clean production build available for delivery.

**Exit condition:** all required checks pass, and the full experience satisfies both technical and creative acceptance.

Do not automatically publish, merge, or deploy as part of this handoff. Deliver reviewable implementation and evidence.

## 5. Validation, acceptance, and final handoff

### Automated coverage

Add focused tests for the new behavior rather than assertions that merely duplicate implementation details.

| Area | Required scenarios |
|---|---|
| State validation | Missing, old, malformed, duplicate, unknown, and blocked-storage records |
| Counting | Homepage, direct department entry, repeated visits, newsletter grouping, excluded routes, root and GitHub Pages base paths |
| Policy | Threshold boundaries; relevant callbacks only; deterministic priority; no duplicate notices; approval does not disable exploration |
| Evidence | Refusal versus closing without declaring; explicit skip versus unfinished verification; completed loss versus cancelled spin; appendix actually opened |
| Cookie procedure | No fresh-entry interruption; eligible notice; explicit opening; partner views; close and reopen; no identity coupling |
| Release | Every step; Escape; duplicate activation; approval persistence; direct bypass; modified clicks; unsupported dialog; import failure; cancellation |
| Lifecycle | Mode change, navigation, scene replacement, repeated opening, and delayed imports |
| Privacy | Real directory clicks produce no third-party requests; media loads only through the intended explicit controls; free text is not stored |
| Résumés | All variants, current navigation labels, contact links, print, no-JavaScript access, theme isolation, ordinary metadata, integrity |
| Accessibility | Keyboard, focus return, touch targets, reduced motion, dark presentation, narrow screens, enlarged text, all dialog states |

Use deterministic test hooks for roulette and delayed-operation scenarios. Keep hooks absent from production.

Retain the existing coverage minimums: **90% lines and 85% branches**.

### Build and CI contract

Use one documented validation sequence locally and in CI:

1. Formatting, typecheck, and unit tests with coverage.
2. Production build without test hooks.
3. PDF verification and distribution/bundle scan.
4. Preserve the validated production artifact.
5. Build with `PUBLIC_TEST_HOOKS=1`.
6. Run browser, privacy, accessibility, and configured cross-browser checks.
7. Restore the production artifact.
8. Run Lighthouse against production.
9. Confirm the delivery artifact contains no test hooks.

The deployment workflow must depend on the complete validation workflow for the same commit. Upload the validated production artifact rather than performing an independent, less-checked rebuild.

Pass the same site/base-path configuration through validation and deployment. Do not assume remote branch protection supplies missing checks.

### PDF acceptance

For each of the four variants:

- Exactly one US Letter page.
- Selectable text.
- No clipping or overflow.
- Correct professional content and contact links.
- Ordinary document metadata.
- Existing integrity checks pass.
- Rendered PDF inspected for layout.

Automated integrity checks confirm consistency with the repository’s approved source material; they do not independently verify a biography.

### Human creative acceptance

Walk through at least these three journeys:

1. **Character Review → verification → Correspondence → résumé request.**  
   The small character finding lands; verification objects to correctness; a later callback accurately describes the skip; release approves without prerequisites.

2. **Direct cube entry → DOOM → résumé request.**  
   Recreation works independently; release uses only the available record; the résumé ends the performance.

3. **Homepage → direct résumé, with JavaScript disabled.**  
   Navigation and the professional document work immediately.

For every department, verify that a nontechnical visitor can identify the intention, the specific unreasonable procedure, and the small result. Remove copy that explains why the interaction is funny.

### Deliverables expected from Claude

- Completed implementation in the existing repository.
- The creative brief and updated implementation documentation.
- Updated README and validation instructions.
- Tests covering the new behavior and corrected regressions.
- A clean production build.
- Screenshots of the portal, an earned procedural payoff, release approval, and the ordinary résumé.
- A final report separating completed work, executed checks, remaining limitations, and any unverified claims.

Claude should preserve the working résumé cleanup and existing attractions, complete the integration described here, and report actual validation results rather than treating the presence of code as proof that the experience works.
