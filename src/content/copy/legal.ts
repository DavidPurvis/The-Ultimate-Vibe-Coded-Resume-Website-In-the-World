/** Legally Binding Vibes. Part 1 is true. Part 2 is not. Meta excerpts stay hidden until verified. */
import type { CopyRecord } from '../types';

export const legalCopy = {
  kicker: 'FORM DRV-8 · LEGALLY BINDING VIBES',
  h1: 'Legally Binding Vibes',
  sub: 'Part 1 is true. Part 2 is not. We labelled them, which is more than most terms do.',
  part1Heading: 'Part 1 — What this site actually does',
  part2Heading: 'Part 2 — Fictional administrative requirements',
  part3Heading: 'Part 3 — We’ve detected…',
  part4Heading: 'Part 4 — Permissions',
  part5Heading: 'Part 5 — Real-world reading',
};

export const facts = {
  lines: [
    'This site sets no cookies. Not one. The cookie banner is a bit.',
    'No analytics, no advertising pixels, no session replay, no fingerprinting. Nothing is sent anywhere by this site’s code.',
    'Fonts, icons and images are served from this site. Nothing loads from a third party until you choose to play the video in the casino or on the due-diligence page. Then YouTube’s privacy-enhanced player loads, and YouTube’s policies apply.',
    'Résumé For You builds a link to claude.ai with your quiz answers and a cut of the résumé in it. Nothing goes to Claude unless you press that link. If you do, it opens in your own account and Anthropic’s terms apply.',
    'Your browser stores a few small things for this site, listed below. You can delete them all right now.',
  ],
  tableCaption: 'What this site stores in your browser',
  tableCols: ['Key', 'Where', 'Size', 'Purpose'],
  empty: 'Nothing is stored right now.',
  purposes: {
    'uvcr:prefs': 'Your mode, theme, HUD setting and cookie-banner choice.',
    'uvcr:session':
      'Your fictional identity, game progress and summoned players, for this tab only.',
    'uvcr:biscotti': 'Fifty drawings of biscotti, only if you asked for them.',
  } as Record<string, string>,
  where: { local: 'localStorage (this browser)', session: 'sessionStorage (this tab)' },
  reset: 'Reset everything',
  resetToast: 'Everything the Department stored has been deleted. The Department feels lighter.',
  host: 'GitHub Pages, the host, keeps ordinary server logs like any web host. This site can’t see them.',
  games:
    'Nothing you type into this site’s games leaves your browser. There is no server. There is GitHub Pages and a dream.',
};

export const fictionalTerms: { heading: string; body: string }[] = [
  {
    heading: 'SECTION 38.4 — CONTINUED EXISTENCE',
    body: 'By continuing to exist within approximately 15 feet of this website, you agree that: (a) buttons may relocate without notice; (b) printers remain the user’s responsibility; (c) the operator makes no warranty that LinkedIn is emotionally safe; (d) “synergy” has no agreed technical definition.',
  },
  {
    heading: 'RIDER 2.1 — CONFECTIONS',
    body: 'Any interview invitation resulting from this website is void unless four (4) dark-brown confections are presented at the first technical interview. This clause exists to confirm you read the contract. You’re welcome.',
  },
  {
    heading: 'LICENSE GRANT',
    body: 'You grant the candidate a non-exclusive, non-transferable, royalty-free, emotionally binding license to remember this résumé. This license ends when you forget, which we hope is never.',
  },
  {
    heading: 'CURSOR JITTER',
    body: 'By reading this page you grant the Department an irrevocable license to infer your metabolic expenditure from your cursor jitter. The Department has not exercised this license, is unable to, and would not know what to do with the results.',
  },
];

export const tos = {
  label: 'Terms of Reading',
  initial: [
    'Preamble. These Terms of Reading govern your reading of these Terms of Reading.',
    '§0.1 Scrolling is encouraged.',
    '§0.2 The Department may add terms as you scroll. The Department is doing that now.',
    '§0.3 Please keep scrolling.',
  ],
  appended: [
    '§1.1 By scrolling, you agree that scrolling occurred.',
    '§1.2 The Department may amend these terms at any time, including now. See below.',
    '§2.4 The candidate makes no warranty that the scrollbar will stop growing.',
    '§3.3 Printers remain the user’s responsibility. The printer has been informed.',
    '§4.1 “Synergy” will not be defined here or anywhere.',
    '§4.2 By reading this sentence you agree to have read this sentence.',
  ],
  button: 'I have read this sentence',
  receipt: 'Agreement recorded nowhere. Congratulations on your reading.',
};

export const detected = {
  screen: 'We’ve detected you are using a screen.',
  screenHow: 'An educated guess.',
  cores: (n: number) =>
    `We’ve detected ${n} logical processors. We will not be mining anything. Probably.`,
  coresFallback: 'CPU information withheld. Sensible.',
  coresHow:
    'navigator.hardwareConcurrency reports the logical processors available to the page; browsers may round or hide it.',
  time: (hhmm: string, tz: string) => `We’ve detected it’s ${hhmm} in ${tz}.`,
  workHours: 'You’re screening résumés on company time. Bold.',
  afterHours: 'After hours? Dedication. Or insomnia. Either way: hireable.',
  timeFallback: 'Time zone withheld. Mysterious.',
  timeHow: 'Your device’s clock and its time-zone setting. Not your location.',
  language: (lang: string) => `We’ve detected your preferred language is ${lang}. Ours is sarcasm.`,
  languageFallback: 'Language withheld. Also sarcasm.',
  languageHow: 'navigator.language, a browser preference.',
  motionReduced: 'We’ve detected you prefer less motion. Respect. Everything here will hold still.',
  motionFull: 'We’ve detected you prefer full motion. Buckle up.',
  motionHow: 'The prefers-reduced-motion media query.',
  notHired: 'We’ve detected you have not yet hired David.',
  notHiredHow: 'Inference from the fact that you are still reading.',
  timeline: 'We’ve detected that the hiring process continues to lack a clear timeline.',
  timelineHow: 'General knowledge.',
  howLabel: 'How this works',
  footer: 'None of this left your browser. There’s no server to send it to.',
};

export const stickers = {
  header: 'The Department wants to:',
  camera: {
    title: '📷 Access your camera to verify you’re smiling',
    result: 'Smile verification waived. We believe you.',
  },
  location: { title: '📍 Know your location', result: 'We’ve located you. You are: here.' },
  buttons: ['Allow', 'Allow, but sadly', 'Block'],
  notify: {
    button: '🔔 Enable notifications of my feelings (this one is a real browser prompt)',
    title: 'It’s me. From the résumé.',
    body: 'Just checking in. This will never happen again.',
    granted: 'Delivered. That was the only one. Ever.',
    denied: 'Understood. My feelings will be delivered by other means (they will not).',
    unsupported: 'Your browser doesn’t do notifications. Neither do my feelings.',
    used: 'Notification already delivered. The Department keeps its promises, occasionally.',
  },
};

export const realWorld = {
  text: 'For a real-world comparison, see how actual platforms’ terms are graded at',
  link: { href: 'https://tosdr.org/', label: 'ToS;DR' },
};

/**
 * Source C's attributed excerpts. They stay `needs-review` (never rendered) until David checks
 * each against the live page — facebook.com blocks automated fetching, so they can't be verified here.
 */
export const metaSnippets: (CopyRecord & { source: string; url: string; commentary: string })[] = [
  {
    id: 'license',
    status: 'needs-review',
    text: 'a non-exclusive, transferable, sub-licensable, royalty-free, and worldwide license',
    source: 'Meta Terms of Service',
    url: 'https://www.facebook.com/terms',
    commentary: 'This is also the license you grant me by reading this résumé.',
  },
  {
    id: 'license-end',
    status: 'needs-review',
    text: 'This license will end when your content is deleted from our systems.',
    source: 'Meta Terms of Service',
    url: 'https://www.facebook.com/terms',
    commentary: 'My last relationship had the same clause.',
  },
  {
    id: 'name',
    status: 'needs-review',
    text: 'Provide for your account the same name that you use in everyday life.',
    source: 'Meta Terms of Service',
    url: 'https://www.facebook.com/terms',
    commentary: 'In everyday life, my name is “hey, IT guy.”',
  },
  {
    id: 'offender',
    status: 'needs-review',
    text: 'You must not be a convicted sex offender.',
    source:
      'Instagram Terms of Use (Source C cites a Facebook Help URL — verify the correct primary page)',
    url: 'https://www.facebook.com/help/581066165581870',
    commentary: 'Green flag: I qualify for Instagram.',
  },
  {
    id: 'username',
    status: 'needs-review',
    text: 'You can’t use a domain name or URL in your username without our prior written consent.',
    source: 'Instagram Terms of Use (archived copy cited by Source C)',
    url: 'https://www.lb7.uscourts.gov/documents/19-1861URL1Termsofuse.pdf',
    commentary: 'Which is why my username is not this website.',
  },
  {
    id: 'messages',
    status: 'needs-review',
    text: 'Messages you send and receive, including their content, subject to applicable law',
    source: 'Meta Privacy Policy',
    url: 'https://www.facebook.com/privacy/policy/',
    commentary: 'I, too, read your messages. Only the ones you send me. Please send me messages.',
  },
  {
    id: 'camera',
    status: 'needs-review',
    text: 'technical information about your camera',
    source: 'Supplemental Meta Platforms Technologies Privacy Policy',
    url: 'https://www.meta.com/legal/privacy-policy/',
    commentary: 'They know about your camera. I only know about your CPU cores.',
  },
];
