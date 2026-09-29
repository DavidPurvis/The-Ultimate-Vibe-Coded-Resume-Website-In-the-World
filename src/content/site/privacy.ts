/**
 * The privacy page. Every sentence here must be true of the code (privacy-page.spec and the
 * scanner check the parts a test can check). Plain words: the Department describes storage, media
 * and exits without performing.
 */
export const privacyCopy = {
  kicker: 'Form DDP-15 · Facilities · Privacy',
  h1: 'What this site stores',
  lede: 'Two small records in your own browser, and nothing sent anywhere. Both can be cleared below.',
  storedHeading: 'Stored in your browser',
  storedBody: [
    'Preferences are kept in local storage under the key uvcr:prefs, so they survive closing the tab: whether Direct access is on, your display setting, your answer to the cookie notice, whether sound is on, and whether the gaming interface overlay is on.',
    'This tab’s record is kept in session storage under the key uvcr:session, and is deleted when you close the tab. It holds: what you declared at classification (human, automated system with the model you chose, or withheld) and whether you completed or skipped the optional transcription; how verification ended (completed, and by which method, or skipped) and how many objections it raised; how many times you requested each link at hyperlink allocation, and how many completed spins ended unsuccessfully; the departments you have visited, as a list of names such as “projects”; which notices have been shown; whether your résumé request has been approved; and a few counters used by the attractions (the interface’s threat level, how often a button moved away, whether the appendix was opened, and whether gameplay footage is on).',
    'If you ask for biscotti during cookie administration, each drawing is kept in local storage under a key beginning uvcr:biscotti: until you remove it.',
    'None of these records contain anything you typed, what you transcribed, when anything happened, how long you stayed, where your pointer went, or anything about your device.',
  ],
  mediaHeading: 'Media, downloads and outside links',
  media: [
    'Musical material is played by YouTube’s privacy-enhanced player (youtube-nocookie.com). The player is loaded only after you press a play control on the musical material page, a share page or a hyperlink allocation result, and it is removed when you close it. Once it loads, YouTube’s policies apply.',
    'The gameplay footage overlay currently shows placeholder tiles and loads nothing from YouTube. If footage is added, it will use the same player, loaded only after you switch the overlay on or press Summon, and it will return on later pages until you dismiss it or switch the overlay off.',
    'DOOM downloads about 7 MB from this site, and only after you press Play.',
    'Résumé selection builds a link to claude.ai containing your questionnaire answers and a cut of the résumé. Nothing is sent unless you follow that link; if you do, it opens in your own account and Anthropic’s terms apply.',
    'External links (GitHub, LinkedIn, Wikipedia, the credits) are ordinary links, followed only if you click them.',
  ],
  neverHeading: 'What this site never does',
  never: [
    'Set cookies, or use analytics, tracking pixels or advertising networks.',
    'Send anything to a server. The site has no server of its own, and its security policy allows no connection to any other.',
    'Ask for permissions (notifications, location, camera, clipboard).',
    'Read your clipboard, fingerprint your browser, or record your input device or motion preference.',
  ],
  legacy:
    'A key left in your browser by the previous version of this site (uvcr:case) is removed when any page of the Department opens.',
  tableCaption: 'Keys this site has stored in your browser right now',
  columns: { key: 'Key', area: 'Where', size: 'Size' },
  areas: { session: 'Session storage (this tab)', local: 'Local storage' },
  bytes: (n: number) => `${n} bytes`,
  empty: 'Nothing is stored right now.',
  noscript: 'With JavaScript off, this site stores nothing at all.',
  reset: 'Clear everything this site stored',
  cleared: 'Cleared. Nothing is stored now.',
};
