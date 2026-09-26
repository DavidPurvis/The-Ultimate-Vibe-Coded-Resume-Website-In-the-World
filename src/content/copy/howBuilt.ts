/** How This Was Built — engineering disclosure, each section with an honest limitation. */
export const howBuiltCopy = {
  kicker: 'FORM DRV-12 · ENGINEERING DISCLOSURE',
  h1: 'How This Was Built',
  lede: 'The more irresponsible this website appears, the more responsible the engineering underneath it had to be.',
  limitationLabel: 'Limitation',
  inspect: 'Inspect me',
  inspectAnnounce: 'Unauthorized inspection detected. Just kidding. This is a button you pressed.',
  repoLink: 'The source code (yes, even this link goes through the casino)',
  tribute: 'Whatever you think is too big to build alone, someone built an operating system.',
  tributeLink: 'In memoriam: Terry A. Davis',
};

export const howBuiltSections: { id: string; title: string; body: string[]; limitation: string }[] =
  [
    {
      id: 'doors',
      title: 'Two front doors',
      body: [
        'The front door is a gauntlet: identity checkpoint, CAPTCHAN’T, character review, casino. The side door is /resume/ — never gated, fully readable without JavaScript, and the link David actually sends with applications.',
        'Every page also carries a skip link as its very first Tab stop, an escape hatch in the footer, and a Recruiter Mode switch that turns every joke off.',
      ],
      limitation: 'Maximum-hostility copy still costs some readers. That trade is deliberate.',
    },
    {
      id: 'bouncer',
      title: 'The résumé has a bouncer',
      body: [
        'Résumé content is typed data traced to a verified inventory of facts. The inventory’s integrity rules — the honors wording, exact job titles, a whitelist of every permitted number, a denylist of technologies that must never be claimed — run as tests against the rendered page, the PDF text layer, the Markdown résumé and page metadata.',
        'Jokes that lean on real history must cite the fact they lean on. Pure fiction is not allowed to borrow real employers’ names.',
      ],
      limitation:
        'Rules catch patterns, not every possible misstatement. A human still reviews the copy.',
    },
    {
      id: 'pdf',
      title: 'The PDF is printed from the page',
      body: [
        'resume.pdf is generated at build time by printing /resume/ in headless Chromium, then verified: exactly one US Letter page, selectable text, integrity rules re-checked on the extracted text. Pressing Ctrl+P on any page of this site prints the same résumé.',
        'The only joke in the PDF lives in its document metadata, where applicant-tracking systems will never see it.',
      ],
      limitation:
        'The rendered line count is measured, not guaranteed identical across every PDF renderer.',
    },
    {
      id: 'wheel',
      title: 'The wheel decides before it spins',
      body: [
        'The casino chooses the outcome first — the first spin is always a rickroll, the third always pays — and only then computes the angle that lands the pointer on a wedge with that label. The selection function and the angle math are unit-tested for every wedge.',
        'Rapid double-clicks can’t spin twice, and the outcome is announced as text for screen readers.',
      ],
      limitation: 'It is not random. On purpose. The sign says so.',
    },
    {
      id: 'runaway',
      title: 'Buttons that run away, politely',
      body: [
        'Evasive buttons dodge a mouse only on the moment the pointer enters their zone, so one approach costs one dodge, and each has a fixed budget before it surrenders. Keyboard activation never moves anything; touch and reduced-motion users get ordinary buttons whose labels escalate instead.',
      ],
      limitation: 'Touch never plays the chase. Phones deserve peace.',
    },
    {
      id: 'captcha',
      title: 'CAPTCHAN’T is a state machine with feelings',
      body: [
        'Rejections respond to what you actually selected — software windows, physical windows, all of them, none. Each round caps its rejections, the whole ceremony caps at six, and the Linux round has no images, so doing nothing is finally correct. The “audio challenge” is literally silence with a visual countdown.',
      ],
      limitation:
        'It verifies nothing, as advertised. It is not a security control and never gates the résumé.',
    },
    {
      id: 'privacy',
      title: 'The privacy policy is the one thing that isn’t a joke',
      body: [
        'No cookies. No analytics. Fonts, icons, art, three.js and DOOM are all self-hosted. A strict Content-Security-Policy allows exactly one third-party frame — YouTube’s privacy-enhanced player — and it only exists after you press play or summon gameplay. Every storage key the site uses is listed on the Legally Binding Vibes page with a real reset button. Tests assert zero cookies and zero third-party requests across a full playthrough.',
        'The one other way out is a link: Résumé For You can hand your answers to claude.ai, and only if you press it.',
      ],
      limitation:
        'GitHub Pages keeps server logs; YouTube, once you press play, is YouTube; claude.ai, once you press the link, is claude.ai.',
    },
    {
      id: 'ai',
      title: 'The AI checkpoint is visible on purpose',
      body: [
        'Most AI crawlers read raw HTML and don’t run JavaScript, while browsing agents read screenshots and the accessibility tree. So the “prompt injection” is a visible, labelled sticky note in static HTML, and it only asks one thing: which model are you?',
        'Hidden instructions get stripped, flagged and punished by résumé screeners — and a hidden instruction that tries to influence ranking stops being comedy. A draft “AI recruiter instruction matrix” memo was cut for exactly that reason. The résumé data contains no instructions at all.',
        'robots.txt only counts at a domain root; on a GitHub Pages project path it is decorative until a custom domain arrives.',
      ],
      limitation: 'No model is obligated to answer. Most won’t. Some will.',
    },
    {
      id: 'gravity',
      title: 'Gravity without moving the DOM',
      body: [
        'The “Don’t press this” button lazy-loads a physics engine, snapshots the cards’ positions, and drives only CSS transforms from the simulation. The DOM never moves, so Rebuild restores the page exactly by clearing transforms.',
      ],
      limitation: 'At most 40 bodies, and it is disabled when you prefer reduced motion.',
    },
    {
      id: 'devtools',
      title: 'The DevTools “detector” that isn’t',
      body: [
        'A popular trick claims to detect DevTools by logging an object whose getter runs when inspected. But console.log("…", obj.alert) evaluates obj.alert before console.log is even called, so the getter runs whether DevTools is open or not. There is no reliable detector here, and there shouldn’t be — you are allowed to inspect everything.',
        'The load-bearing cookie banner uses a MutationObserver to notice when it is removed. That is a joke with a real API underneath, not security.',
      ],
      limitation:
        'Inspection is welcome. The only thing the inspect button inspects is your sense of humor.',
    },
    {
      id: 'lanes',
      title: 'One résumé, four cuts, zero new facts',
      body: [
        'The embedded, platform and backend résumés are the context pack’s own compositions, built from the same verified blocks as the standard one and run through the same integrity guard. When a cut ran over a page, the pack’s cut order decided what went, in order, stopping as soon as it fit. Each prints to its own verified one-page PDF.',
        'Résumé For You picks one of those cuts. “Tailor it with Claude” is a pre-filled link to claude.ai, not an API call: no key ships, the page sends nothing, and the message carries the rules (no invented employers, titles, numbers or technologies).',
      ],
      limitation:
        'The quiz can only choose between four fixed cuts. Claude, in your account, is asked to follow the rules; it is not forced to.',
    },
    {
      id: 'modes',
      title: 'Modes that cost nothing until you switch them on',
      body: [
        'The Overkill HUD and Attention-Span Mode are separate lazy chunks, CSS included. Switched off, they are two switches in a menu. Switched on, they are scenes like everything else: Recruiter Mode tears them down, and the tribute page never gets them.',
        'An earlier version put the switches in a new header button. The wider header wrapped on the fallback font and jumped when the web font arrived (layout shift 0.31), so they moved into the Departments menu.',
      ],
      limitation:
        'Until David supplies gameplay video IDs, Attention-Span Mode summons placeholder tiles.',
    },
    {
      id: 'cube',
      title: 'Ten thousand tungsten cubes, no physics engine',
      body: [
        'The cube is physically based metal lit by a room three.js builds in code, so no HDR image is fetched. The cube rain is one instanced mesh and a height map: each small cube falls, bounces once or twice, then rolls downhill until the pile is no steeper than its angle of repose. Ten thousand settle in about 40 milliseconds of arithmetic.',
        'three.js (137 KB compressed) loads only on the cube pages, after they have loaded; the build fails if it ever lands in a page’s main bundle.',
      ],
      limitation:
        'Software WebGL (some VMs, some locked-down laptops) manages about seven frames a second mid-rain.',
    },
    {
      id: 'doom',
      title: 'DOOM runs in its own frame',
      body: [
        'Cloudflare’s WebAssembly build of Chocolate Doom and the shareware WAD are vendored at build time and checked against pinned SHA-256 hashes. They run in a same-origin frame that exists only after you press Play, so “Stop” is simply removing the frame: runtime, audio and listeners go with it.',
        'That frame is the only document on the site allowed to compile WebAssembly. DOOM keeps Tab for its automap, so Shift+Esc hands the keyboard back to the page.',
      ],
      limitation:
        'It needs a keyboard. Music is off and sound effects are opt-in, so nothing blares at an interviewer.',
    },
    {
      id: 'a11y',
      title: 'Accessibility isn’t a mode',
      body: [
        'Every scene works by keyboard, announces outcomes (not animation ticks) to screen readers, returns focus when dialogs close, keeps targets at least 44 pixels, and honors reduced-motion preferences without removing the joke. Automated axe scans run in CI across pages and open dialogs.',
      ],
      limitation:
        'Manual NVDA and VoiceOver passes are still on the checklist; automation can’t replace them.',
    },
  ];
