/** How it was built: the colophon. Plain, first-hand, and every section admits a limitation. */
export const colophonCopy = {
  kicker: 'Form DDP-12 · Facilities · Technical documentation',
  h1: 'How it was built',
  lede: 'The Department of David Purvis is a static website: pages, a small runtime for each procedure, a record kept in the visitor’s own tab, and a résumé kept apart. This page describes the machinery plainly, including where it falls short.',
  limitationLabel: 'Limitation',
  limitationsHeading: 'Every limitation, in one list',
  repoLink: 'Read the source on GitHub',
  privacyLink: 'What this site stores',
  creditsLink: 'Credits and licences',
  doom: 'DOOM runs in its own frame, on its own page or docked on the directory, and downloads only when you press Play.',
  doomLink: 'Play DOOM',
  tribute: 'Someone once built an entire operating system alone.',
  tributeLink: 'In memoriam: Terry A. Davis',
};

export interface ColophonSection {
  id: string;
  title: string;
  body: readonly string[];
  limitation: string;
}

export const colophonSections: readonly ColophonSection[] = [
  {
    id: 'directory',
    title: 'A directory, not a sequence',
    body: [
      'The home page is the Department’s directory: six categories of service, each a list of ordinary links. Every service can be entered directly, in any order, and every page names related offices and links back to its category.',
      'Nothing opens by itself. Dialogs, media and procedures start only when a visitor presses the control that asks for them.',
    ],
    limitation:
      'The directory menu in the header is a plain disclosure; it does not trap focus or close itself when you tab away.',
  },
  {
    id: 'record',
    title: 'The case record',
    body: [
      'Each tab keeps a small record in session storage: the departments visited (by name, once each), the notices already shown, and whether a résumé request has been approved. A pure reducer validates and updates it; unknown or repeated entries are dropped.',
      'The record changes what the Department says, never what a visitor can reach. The status line has three wordings; at most one notice appears on a page, chosen by a fixed priority from things the visitor actually did.',
    ],
    limitation:
      'The record is per tab. A new tab starts a new file, and closing the tab deletes it.',
  },
  {
    id: 'lifecycle',
    title: 'Every procedure cleans up after itself',
    body: [
      'Each procedure runs inside a scope that owns its timers, listeners, animations, observers and inserted elements. Closing it, pressing Escape, opening another procedure, leaving the page or turning on Direct access disposes the scope, and a late import checks that it is still wanted before it touches the page.',
    ],
    limitation:
      'Some older attractions still bind directly on their own pages; they are torn down with the page rather than by the scope.',
  },
  {
    id: 'direct-access',
    title: 'Direct access',
    body: [
      'Direct access suspends every procedure. The pages stay, the links go straight to their destinations, and nothing moves, opens or plays by itself. It is remembered in local storage, and ?mode=recruiter in an address turns it on for that visit.',
    ],
    limitation:
      'Direct access is a preference in this browser; a different browser starts with procedures enabled.',
  },
  {
    id: 'resume',
    title: 'The résumé is a different document',
    body: [
      'The résumé pages share nothing with the Department: no procedure scripts, no departmental copy, and a startup script that cannot read storage. The PDFs are printed from those same pages, so the web and PDF versions match.',
      'Every line of the résumé comes from a fixed set of facts. Build checks reject numbers, employers and technologies that are not in them, and fail if a PDF runs to a second page.',
    ],
    limitation:
      'The PDFs are printed by a headless browser at build time, so a font change can move them.',
  },
  {
    id: 'failing-open',
    title: 'Everything fails open',
    body: [
      'Request résumé is an ordinary link; if the release procedure cannot load, the link simply opens the résumé. If storage is blocked, the record lives in memory for the page. With JavaScript off, every page and the résumé still work.',
    ],
    limitation: 'Without JavaScript, the procedures do not run at all.',
  },
  {
    id: 'tests',
    title: 'Tests',
    body: [
      'Unit tests cover the record, its policy and storage validation; DOM tests cover the lifecycle and the procedures; browser tests walk the directory and the release procedure by mouse and keyboard, run an accessibility checker in light and dark, and confirm nothing loads from another site until a play control is pressed. A scanner checks the built pages before anything deploys.',
    ],
    limitation: 'No test can say whether it is funny.',
  },
];
