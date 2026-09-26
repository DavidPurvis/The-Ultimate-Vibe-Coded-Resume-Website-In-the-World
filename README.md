# The-Ultimate-Vibe-Coded-Resume-Website-In-the-World

Witness Greatness.

> A professionally excellent résumé behind a deliberately hostile Department of Recruiter Verification.

**Live:** https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/
**The résumé, no gauntlet:** https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume/

The joke is that this website is screening _you_. A fictional Department of Recruiter Verification
runs an identity checkpoint that asks which AI model you are, a proof-of-humanity CAPTCHA where
every image is a window, a character review with an appendix the committee asked us to remove, and a
rigged roulette wheel that decides whether each link works. The payoff is an immaculate, ATS-safe,
one-page résumé.

The chaos is the bait. The engineering is the point.

## Two front doors

| Door | What it is | Rules |
| --- | --- | --- |
| `/` and every other page | The exhibition: maximum hostility | Every scene has a stationary exit or a bounded end. There's a skip link as the first Tab stop, an escape hatch in the footer, and a Recruiter Mode switch that turns every joke off. |
| `/resume/` | The reward, and the link to send with applications | Never gated. Works with JavaScript off and storage blocked. No jokes (the PDF has one, in its metadata). |

Press Ctrl+P on any page and you get the same résumé, because every page embeds a print-only copy.

## What's inside

| Route | Scene |
| --- | --- |
| `/` | Identity Checkpoint: the cookie banner (load-bearing), 3,000 fictional partners, ASCII biscotti, the "which model are you?" dialog, and visible robot notes |
| `/verify/` | CAPTCHAN'T™: windows, then Nicolas Cabbage behind legally nervous rectangles, then a Linux round with no images. Includes a silent audio challenge and a Zeno progress bar. |
| `/about/` | Independent Character Review: green flags, stamps, and the buried appendix |
| `/skills/` | Loadout: skills as weapon skins. Rarity comes from where each skill was actually used. |
| `/beliefs/` | Peer-reviewed research (no item 7) and the Upside Down, where scrolling inside one box is inverted |
| `/support/` | Causes, and a "Don't press this" button that collapses them with physics (transforms only, restorable) |
| `/legal/` | A truthful privacy section with a live storage table and a real reset, then fictional terms that grow as you scroll |
| `/casino/` | Link Roulette: the house decides before the wheel spins, and the third spin always pays |
| `/contact/` | A ten-billion-step phone slider and a 40-face email drum. Nothing is sent. |
| `/projects/` | Case Files, written under the same integrity rules as the résumé |
| `/how-it-was-built/` | Engineering disclosure, with an honest limitation for every section |
| `/credits/` | Every asset and license |
| `/rick/`, `/r/*` | Consensual rickrolls and share decoys with sincere Open Graph copy |
| `/resume.md`, `/llms.txt`, `/robots.txt`, `/resume.pdf` | Machine-readable surfaces: clean, with visible jokes only |

## Promises the tests enforce

- **The résumé is true.** The content is typed data traced to a verified fact inventory. `src/lib/integrity.ts` turns the inventory's integrity rules into checks, including:
  - exact honors wording and exact job titles;
  - a whitelist of every permitted number;
  - a denylist of technologies that must never be claimed;
  - no phone numbers and no unfilled placeholders.

  They run on the rendered page, the PDF text layer, `resume.md`, `llms.txt`, page metadata and `/projects/`. A joke that leans on a real fact must cite the block it leans on, and fiction may not name a real employer.
- **The PDF is exactly one Letter page.** `scripts/postbuild.ts` prints `/resume/` in headless Chromium, and `scripts/verify-pdf.ts` checks the page count, page size, text layer and integrity rules. The build fails otherwise.
- **Privacy copy equals reality.** The site sets zero cookies and runs zero analytics. Fonts, icons and art are self-hosted, and nothing third-party loads until you click play on the rickroll. A strict CSP pins its one inline script by hash. Every storage key is listed on `/legal/` with a working reset.
- **Nothing mimics malware or system chrome.** There's no reCAPTCHA/Turnstile look-alike, no "verify you are human", no Run-box or paste instructions, no clipboard access and no credential fields. `scripts/scan-dist.ts` fails the build on any of them.
- **No hidden prompt injection.** The AI gag is a visible, labelled sticky note that asks only which model you are. The résumé data contains no instructions.
- **Accessible, not just survivable.**
  - Everything works by keyboard, and dialogs return focus.
  - Evasive buttons never move for keyboard or touch, and reduced motion gets text-only escalation.
  - axe (WCAG 2.2 AA) runs on every page and in dialog states with zero serious or critical findings.
  - Targets are at least 44px, and nothing scrolls sideways at 320px.

## Commands

Node 22 (`.nvmrc`). Chromium comes from Playwright.

```bash
npm ci
npm run dev            # local dev server
npm run build          # typecheck → static build → print + verify resume.pdf
npm run scan           # post-build scan of dist/ (CSP, third parties, budgets, forbidden patterns)
npm test               # unit tests (Vitest, pure logic)
npx vitest run --coverage   # CI gate: ≥ 90% lines, ≥ 85% branches on pure modules
PUBLIC_TEST_HOOKS=1 npm run build && npm run test:e2e   # Playwright against the built site
npm run rasterize      # regenerate favicons, cursors and og.png from the SVG sources
npm run format         # Prettier
```

E2E tests need a build made with `PUBLIC_TEST_HOOKS=1`, which exposes `window.__uvcr` so tests can force wheel and link outcomes. Production builds never contain it, and `scan-dist` checks that.

## Architecture

```
src/
  content/      résumé data, verified facts, every user-facing string (copy/*.ts), asset ledger
  lib/          storage (validated, namespaced, memory fallback), mode transactions, scene lifecycle,
                dialogs, announcer, runaway controls, integrity guard, icons (build-time only)
  scenes/*/     logic.ts (pure, unit-tested) + index.ts (DOM wiring, tested in Playwright)
  components/   Head (meta + CSP), header/footer, ResumeDocument, Wheel, dialogs, stamps…
  layouts/      Base (gag pages: chaos layer + print-only résumé) and Resume (the reward)
  pages/        one directory per route, plus resume.md / llms.txt / robots.txt endpoints
scripts/        serve-dist, postbuild (PDF), verify-pdf, scan-dist, rasterize
tests/unit      Vitest
tests/e2e       Playwright (Chromium + Pixel 7 locally; Firefox + WebKit smoke in CI)
```

Every running gag is a scene with a `Disposer`. Switching to Recruiter Mode (or leaving the page) tears everything down in one transaction: animations, overlays, dialogs, the video player, the tab-title guilt and the cursor.

## Operating it

### Deploy

GitHub Pages via Actions (`.github/workflows/deploy.yml`, runs on push to `main`). One-time setup: **Settings → Pages → Source = GitHub Actions**.

### Custom domain later

Set repository variables `SITE_URL` (for example `https://example.com`) and `BASE_PATH` (`/`), then add `public/CNAME`. `robots.txt` and `llms.txt` only affect crawlers at a domain root, so they're decorative on the project path until then.

### Real Nicolas Cage photos (optional)

Round 2 uses original cabbage art. To swap in real photos:

1. Add at least nine CC-licensed photos (≤ 240px, ≤ 25 KB each) to `public/captcha/cage/`.
2. Add one `licensed-photo` entry per file to `LEDGER` in `src/content/credits.ts`, with `name` (used as alt text), `license`, `author`, `url` (the source page) and `files: ['captcha/cage/…']`.

Once nine credited photos exist, round 2 switches to them automatically (`src/content/cagePhotos.ts`) and shows a no-endorsement caption. `credits.test.ts` fails if any file there lacks a license or author.

### Meta / Instagram terms quotes (optional)

The quotes in `metaSnippets` (`src/content/copy/legal.ts`) are marked `needs-review` and never render. Check each one against the live page, then change its `status` to `verified`, and it appears on `/legal/`.

### Changing the résumé

Edit `src/content/resume.ts`, then run `npm test && npm run build`. The integrity guard and the one-page PDF check will stop anything that isn't in the verified inventory or doesn't fit.

## Credits and license

Code: public domain ([Unlicense](LICENSE)). Assets keep their own licenses: IBM Plex and Fraunces and Comic Neue (OFL), Lucide (ISC), Fluent Emoji Flat (MIT), game-icons.net (CC BY 3.0), Astro and matter-js (MIT). The full list is at `/credits/`. Original art was made for this site and is public domain like the code.

No endorsement implied by anyone, including the cabbage.
