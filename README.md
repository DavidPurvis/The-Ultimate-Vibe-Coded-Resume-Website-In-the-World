# The-Ultimate-Vibe-Coded-Resume-Website-In-the-World

Witness Greatness.

> A professionally excellent résumé behind a deliberately hostile Department of Recruiter Verification.

**Live:** https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/
**The résumé, no gauntlet:** https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume/

The joke is that this website is screening _you_. A fictional Department of Recruiter Verification
runs an identity checkpoint that asks which AI model you are, a proof-of-humanity CAPTCHA where
every image is a window, a character review with an appendix the committee asked us to remove, and a
rigged roulette wheel that decides whether each link works. Around it sits the rest of David: a
personnel file, a newsletter, a tungsten cube, DOOM. The payoff is an immaculate, ATS-safe, one-page
résumé.

The chaos is the bait. The engineering is the point.

## Two front doors

| Door | What it is | Rules |
| --- | --- | --- |
| `/` and every other page | The exhibition: maximum hostility | Every scene has a stationary exit or a bounded end. There's a skip link as the first Tab stop, an escape hatch in the footer, and a Recruiter Mode switch that turns every joke off. |
| `/resume/` (and `/resume/for/…/`) | The reward, and the link to send with applications | Never gated. Works with JavaScript off and storage blocked. No jokes (the PDFs have one, in their metadata). |

Press Ctrl+P on any page and you get the same résumé, because every page embeds a print-only copy.

## What's inside

### The gauntlet

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

### The extended universe

| Route | What it is |
| --- | --- |
| `/personnel-file/` | Known aliases (Big Purv, BP, Dragon, Bruce, Assquatch, Billy Bob Joe, Sasquatch.-), an ordination obtained in 10th-grade math, goldfish honoree, instructions if kidnapped, the R6 service record |
| `/blog/` | The Department Newsletter: the zipper merge (with a rigged traffic sim where Adaptive Early Merge always wins), national security through job applications, Thermite and Mute, the goldfish incident, eight years of ministry. RSS at `/blog/rss.xml`. |
| `/wishlist/`, `/cube/` | A ridiculous wishlist, and its first item in physically based WebGL: heft it, then summon 10,000 more |
| `/doom/` | DOOM shareware episode 1, embedded in the page. Also playable docked on any page from the Departments menu. |
| `/presentation/` | Résumé.ppt: the real résumé as a 1998 slide deck, with star wipes and cartoon ad-libs |
| `/tailor/` | Résumé For You™: a quiz picks the verified cut that fits your role, then (only if you press the link) hands it to Claude in your account |
| `/resume/for/emb/`, `/plt/`, `/be/` | The embedded, platform/SRE and backend cuts of the résumé, each with its own one-page PDF |
| `/sell-your-data/`, `/confess/` | Would you like to sell your data for free? An insider-trading self-assessment. Both collect nothing. |
| `/nintendo/` | An open letter asking Nintendo not to sue |
| `/tribute/` | In memoriam: Terry A. Davis. Sincere; no gags, no ads. |
| `/how-it-was-built/`, `/credits/` | Engineering disclosure (with an honest limitation per section) and every asset and license |
| `/rick/`, `/r/*` | Consensual rickrolls and share decoys with sincere Open Graph copy |
| `/resume.md`, `/llms.txt`, `/robots.txt`, `/resume*.pdf` | Machine-readable surfaces: clean, with visible jokes only |

Parody ads that just say "ad" (24 ways) run on every gag page. **Modes** at the bottom of the Departments menu switch on the **Overkill HUD** (a gaming overlay that crowds every edge, with a kill feed of real Department events) and **Attention-Span Mode** (summonable Subway Surfers players, up to 12).

## Promises the tests enforce

- **The résumé is true.** The content is typed data traced to a verified fact inventory. `src/lib/integrity.ts` turns the inventory's integrity rules into checks, including:
  - exact honors wording and exact job titles;
  - a whitelist of every permitted number;
  - a denylist of technologies that must never be claimed;
  - coursework-only skills labelled as coursework;
  - no phone numbers and no unfilled placeholders.

  They run on the rendered pages, every PDF's text layer, `resume.md`, `llms.txt`, page metadata, `/projects/`, `/presentation/` and the newsletter. The lane cuts in `src/content/lanes.ts` are the context pack's own compositions; when one ran over a page, the pack's cut order decided what went. A joke that leans on a real fact must cite the block it leans on, and fiction may not name a real employer.
- **Every PDF is exactly one Letter page.** `scripts/postbuild.ts` prints `/resume/` and each cut in headless Chromium, and `scripts/verify-pdf.ts` checks page count, page size, text layer and integrity rules. The build fails otherwise.
- **Privacy copy equals reality.** Zero cookies, zero analytics. Fonts, icons, art, three.js and DOOM are self-hosted. Nothing loads from a third party until you click: YouTube's privacy-enhanced player (the rickroll, Attention-Span Mode), and a claude.ai link you may press. A strict CSP pins its one inline script by hash. Every storage key is listed on `/legal/` with a working reset.
- **Heavy things stay lazy.** three.js loads only on the cube pages; the HUD and Attention-Span Mode load only when switched on; DOOM downloads only after Play. `scripts/scan-dist.ts` enforces per-page JS budgets and fails if a lazy library lands in a page's main bundle.
- **WebAssembly is fenced.** DOOM runs in its own same-origin frame, the only document whose CSP allows `'wasm-unsafe-eval'`. Its files are vendored at build time against pinned SHA-256 hashes. Shift+Esc always hands the keyboard back.
- **Nothing mimics malware or system chrome.** There's no reCAPTCHA/Turnstile look-alike, no "verify you are human", no Run-box or paste instructions, no clipboard access, no `<form>`, and no credential or autofill fields. The parody forms send and store nothing.
- **No hidden prompt injection.** The AI gag is a visible, labelled sticky note that asks only which model you are. The résumé data contains no instructions.
- **Accessible, not just survivable.**
  - Everything works by keyboard, and dialogs return focus.
  - Evasive buttons never move for keyboard or touch, and reduced motion gets text-only escalation.
  - axe (WCAG 2.2 AA) runs on every page, in dialog states, with the HUD on and with players out, with zero serious or critical findings.
  - Targets are at least 44px, nothing scrolls sideways at 320px, and layout shift stays under 0.1.

## Commands

Node 22 (`.nvmrc`). Chromium comes from Playwright.

```bash
npm ci
npm run dev            # local dev server (vendors DOOM first)
npm run build          # vendor DOOM → typecheck → static build → print + verify every résumé PDF
npm run scan           # post-build scan of dist/ (CSP, third parties, budgets, forbidden patterns)
npm test               # unit tests (Vitest, pure logic)
npx vitest run --coverage   # CI gate: ≥ 90% lines, ≥ 85% branches on pure modules
PUBLIC_TEST_HOOKS=1 npm run build && npm run test:e2e   # Playwright against the built site
npm run vendor:doom    # copy + hash-check the DOOM engine and WAD into public/doom-engine/
npm run rasterize      # regenerate favicons, cursors and og.png from the SVG sources
npm run format         # Prettier
```

E2E tests need a build made with `PUBLIC_TEST_HOOKS=1`, which exposes `window.__uvcr` so tests can force wheel and link outcomes and stub gameplay videos. Production builds never contain it, and `scan-dist` checks that.

## Architecture

```
src/
  content/      résumé data, lane cuts, verified facts, every user-facing string (copy/*.ts), asset ledger
  lib/          storage (validated, namespaced, memory fallback), mode transactions, scene lifecycle,
                dialogs, announcer, runaway controls, integrity guard, icons (build-time only)
  scenes/*/     logic.ts (pure, unit-tested) + index.ts (DOM wiring, tested in Playwright)
  components/   Head (meta + CSP), header/footer, ResumeDocument, DoomPlayer, parody forms and ads…
  layouts/      Base (gag pages: chaos layer + print-only résumé) and Resume (the reward)
  pages/        one directory per route, plus resume.md / llms.txt / robots.txt endpoints
  blog/         newsletter posts (Markdown, content collection)
public/doom-engine/   DOOM's frame (play.html, boot.js); engine + WAD vendored here at build time
scripts/        serve-dist, postbuild (PDFs), verify-pdf, scan-dist, vendor-doom, rasterize
tests/unit      Vitest
tests/e2e       Playwright (Chromium + Pixel 7 locally; Firefox + WebKit smoke in CI)
```

Every running gag is a scene with a `Disposer`. Switching to Recruiter Mode (or leaving the page) tears everything down in one transaction: animations, overlays, dialogs, the video players, the HUD, the cube renderer, DOOM, the tab-title guilt and the cursor.

## Operating it

### Deploy

GitHub Pages via Actions (`.github/workflows/deploy.yml`, runs on push to `main`). One-time setup: **Settings → Pages → Source = GitHub Actions**.

### What only David can fill in

Personal facts are records with `status: 'needs-review'`. They never render until filled in and switched to `verified`, and every section reads fine without them.

| What | Where |
| --- | --- |
| Subway Surfers gameplay: YouTube video IDs that allow embedding | `SUBWAY_VIDEOS` in `src/content/copy/subway.ts` (until then, players are placeholder tiles and nothing loads from YouTube) |
| Nickname origins, the goldfish's name, R6 stats (rank, K/D, win rate, hours) | `src/content/copy/personnel.ts` |
| Favorite foods | `favoriteFoods` in `src/content/copy/personnel.ts` (the section appears once it has entries) |
| Roughly how many job applications | `applications` in `src/content/copy/blog.ts` |
| Meta / Instagram terms quotes (check each against the live page) | `metaSnippets` in `src/content/copy/legal.ts` |

### Custom domain later

Set repository variables `SITE_URL` (for example `https://example.com`) and `BASE_PATH` (`/`), then add `public/CNAME`. `robots.txt` and `llms.txt` only affect crawlers at a domain root, so they're decorative on the project path until then.

### Real Nicolas Cage photos (optional)

Round 2 uses original cabbage art. To swap in real photos:

1. Add at least nine CC-licensed photos (≤ 240px, ≤ 25 KB each) to `public/captcha/cage/`.
2. Add one `licensed-photo` entry per file to `LEDGER` in `src/content/credits.ts`, with `name` (used as alt text), `license`, `author`, `url` (the source page) and `files: ['captcha/cage/…']`.

Once nine credited photos exist, round 2 switches to them automatically (`src/content/cagePhotos.ts`) and shows a no-endorsement caption. `credits.test.ts` fails if any file there lacks a license or author.

### Changing the résumé

Edit `src/content/resume.ts` (the standard cut) or `src/content/lanes.ts` (the others), then run `npm test && npm run build`. The integrity guard and the one-page PDF checks will stop anything that isn't in the verified inventory or doesn't fit.

## Credits and license

Code: public domain ([Unlicense](LICENSE)). Assets and libraries keep their own licenses: IBM Plex and Fraunces and Comic Neue (OFL), Lucide (ISC), Fluent Emoji Flat (MIT), game-icons.net (CC BY 3.0), Astro, matter-js and three.js (MIT).

DOOM is a separate program served in its own frame: Chocolate Doom compiled to WebAssembly by Cloudflare ([doom-wasm](https://github.com/cloudflare/doom-wasm), GPL-2.0; source at the link) and id Software's unmodified shareware episode 1, under its shareware licence. The full list is at `/credits/`. Original art was made for this site and is public domain like the code.

No endorsement implied by anyone, including the cabbage, id Software or Nintendo.
