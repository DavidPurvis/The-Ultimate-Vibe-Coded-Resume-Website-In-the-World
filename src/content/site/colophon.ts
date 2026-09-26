/** How it was built: the colophon. Plain, first-hand, and every section admits a limitation. */
export const colophonCopy = {
  kicker: 'Colophon',
  h1: 'How it was built',
  lede: 'A résumé website with one joke: a fictional Department regulates access to a document that is already public. This page explains the machinery, and where it falls short.',
  limitationLabel: 'Limitation',
  limitationsHeading: 'Every limitation, in one list',
  repoLink: 'Read the source on GitHub',
  privacyLink: 'What this site stores',
  creditsLink: 'Credits and licences',
  doom: 'The one indulgence: DOOM runs on its own page, in its own frame, and downloads only if you press Play.',
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
    id: 'premise',
    title: 'One institution, one case',
    body: [
      'Asking for the résumé on the home page opens a case with the Department of Recruiter Verification. It asks for a scope, releases an extract, resists twice, holds a ceremony, reports findings and asks for an acknowledgment. Then it closes the case and links the ordinary résumé.',
      'The résumé itself is never behind the case. Every page starts with a skip link to it, the header links it, and the case panel links it directly at every step.',
    ],
    limitation:
      'The joke needs JavaScript. Without it, the home page simply links the résumé, and says so.',
  },
  {
    id: 'reducer',
    title: 'The case is one pure function',
    body: [
      'Everything the Department decides lives in a single reducer over a fixed six-step pipeline. Clicks and browser signals become a small vocabulary of events; the reducer turns an event and the current state into the next state, and ignores anything that does not apply.',
      'Because the state is only a fold over the event log, a case can be replayed exactly. Property tests check the promises that matter: at most eleven actions to the résumé, expediting always works in one, and nothing reopens a closed case.',
    ],
    limitation:
      'A reloaded step restarts from its beginning, although nothing already done is lost.',
  },
  {
    id: 'randomness',
    title: 'Chance changes the theater, never the outcome',
    body: [
      'Each case gets a random seed. From it come the case number (never with a 7), the risk score’s last digits, which bullet the ceremony reviews, and how long each fake service takes.',
      'The reducer never reads the seed. Any two seeds given the same actions reach the same result, and a test says so.',
    ],
    limitation: 'The seed lasts for the tab. A new tab is a new case with a new number.',
  },
  {
    id: 'modality',
    title: 'Accessibility changes the performance, not the entitlement',
    body: [
      'The release control resists twice for everyone. With a mouse it slides away; on a touch screen it moves between three fixed places; with a keyboard or reduced motion it stays put and the request is reassigned in words.',
      'The same three activations release the document in every case, and how you interacted is never recorded. Focus moves to each new heading, and every control is at least 44 pixels.',
    ],
    limitation:
      'Automated tests cover keyboard, touch and reduced motion; real people haven’t tested it yet.',
  },
  {
    id: 'privacy',
    title: 'The findings are real, and stay in your tab',
    body: [
      'The Department notices a few things: switching tabs, copying text (where, never what), refreshing and printing. Each becomes a named event in this tab’s session storage, and nothing is sent anywhere. The security policy forbids connecting to any other server.',
      'With Global Privacy Control or Do Not Track on, the Department stops noticing, and says so.',
    ],
    limitation:
      'Session storage can be read by any script on this site. There are no other scripts, but it is not a vault.',
  },
  {
    id: 'resume',
    title: 'The résumé is a different document',
    body: [
      'The résumé pages share nothing with the case: no case scripts, no institutional copy, and a startup script that cannot read storage. The PDFs are printed from those same pages, so the web and PDF versions match.',
      'Every line of the résumé comes from a fixed set of facts. Build checks reject numbers, employers and technologies that aren’t in them, and fail if a PDF runs to a second page.',
    ],
    limitation:
      'The PDFs are printed by a headless browser at build time, so a font change can move them.',
  },
  {
    id: 'failing-open',
    title: 'Everything fails open',
    body: [
      'If a step fails to load, the Department approves the request by default. If storage is blocked, the case lives in memory. If the page’s scripts never run, the button is a plain link to the résumé.',
    ],
    limitation: 'A broken site approves everyone. That is the design.',
  },
  {
    id: 'tests',
    title: 'Tests',
    body: [
      'Unit, property and replay tests cover the reducer; DOM tests cover the runtime and every step; browser tests walk the whole case by mouse, keyboard, touch and reduced motion, run an accessibility checker on every step in light and dark, and confirm nothing leaves the site. A scanner checks the built pages before anything deploys.',
    ],
    limitation: 'No test can say whether it is funny.',
  },
];
