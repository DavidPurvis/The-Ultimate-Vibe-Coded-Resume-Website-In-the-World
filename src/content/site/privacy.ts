/**
 * The privacy page. Every sentence here must be true of the code (privacy-page.spec and the
 * scanner check the parts a test can check). Plain words; the Department does not operate here.
 */
export const privacyCopy = {
  kicker: 'Privacy',
  h1: 'What this site stores',
  lede: 'One entry, in this tab, until you close it. Nothing is sent anywhere.',
  storedHeading: 'Stored in this tab',
  storedBody: [
    'The home page keeps one entry in this tab’s session storage, under the key uvcr:case: a random number (the case’s seed), a short list of named events such as “scope stated” or “release attempted”, and a one-word status. It is written the first time something is recorded, usually when you ask for the résumé.',
    'The events never include what you typed or copied, where your pointer was, when anything happened, or anything about your device. Closing the tab deletes the entry. A new tab starts a new case.',
  ],
  noticedHeading: 'What the Department notices',
  noticed: [
    'Switching away from the tab and back (recorded as brief or extended, never how long).',
    'Copying text (recorded as where it was copied from: the contact section, the résumé extract or the case; never the text).',
    'Refreshing the page during a case.',
  ],
  gpc: 'If your browser sends Global Privacy Control or Do Not Track, the Department notices none of these, and says so in its findings. Printing the home page is different: it is a request, not an observation, and it approves the case.',
  neverHeading: 'What this site never does',
  never: [
    'Set cookies, or use analytics, tracking pixels or advertising.',
    'Send anything to a server. The security policy forbids connecting anywhere else, and the site has no server of its own.',
    'Ask for permissions (notifications, location, camera, clipboard).',
    'Read your clipboard, fingerprint your browser, or record your input device or motion preference.',
    'Load anything from another site. External links (GitHub, LinkedIn, Wikipedia, the credits) are ordinary links, followed only if you click them.',
  ],
  doom: 'DOOM, on its own page, downloads about 7 MB from this site, and only after you press Play.',
  legacy:
    'Keys left in your browser by the previous version of this site (uvcr:prefs, uvcr:session and uvcr:biscotti:…) are removed when you open the home page or this page.',
  tableCaption: 'Keys this site has stored in your browser right now',
  columns: { key: 'Key', area: 'Where', size: 'Size' },
  areas: { session: 'Session storage (this tab)', local: 'Local storage' },
  bytes: (n: number) => `${n} bytes`,
  empty: 'Nothing is stored right now.',
  noscript: 'With JavaScript off, this site stores nothing at all.',
  reset: 'Clear everything this site stored',
  cleared: 'Cleared. Nothing is stored now.',
};
