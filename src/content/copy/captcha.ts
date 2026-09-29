/** Verification: tiles, prompts, administrative objections, the alternative challenge, progress. */
import type { CopyRecord } from '../types';

export type TileTag = 'physical' | 'software' | 'cabbage' | 'rectangle';
export interface CaptchaTile {
  id: string;
  src: string; // relative to BASE
  alt: string;
  tags: readonly TileTag[];
  creditId: string;
}

export const windowTiles: CaptchaTile[] = [
  {
    id: 'house',
    src: 'captcha/windows/house.svg',
    alt: 'A double-hung house window with a flower box',
    tags: ['physical'],
    creditId: 'art-windows',
  },
  {
    id: 'stained-glass',
    src: 'captcha/windows/stained-glass.svg',
    alt: 'A stained-glass church window',
    tags: ['physical'],
    creditId: 'art-windows',
  },
  {
    id: 'car',
    src: 'captcha/windows/car.svg',
    alt: 'A car’s rear passenger window, half open',
    tags: ['physical'],
    creditId: 'art-windows',
  },
  {
    id: 'airplane',
    src: 'captcha/windows/airplane.svg',
    alt: 'An airplane window with the shade up',
    tags: ['physical'],
    creditId: 'art-windows',
  },
  {
    id: 'bay',
    src: 'captcha/windows/bay.svg',
    alt: 'A bay window with a window seat',
    tags: ['physical'],
    creditId: 'art-windows',
  },
  {
    id: 'drive-thru',
    src: 'captcha/windows/drive-thru.svg',
    alt: 'A drive-thru window handing out a paper bag',
    tags: ['physical'],
    creditId: 'art-windows',
  },
  {
    id: 'browser',
    src: 'captcha/windows/browser.svg',
    alt: 'A generic browser window',
    tags: ['software'],
    creditId: 'art-windows',
  },
  {
    id: 'terminal',
    src: 'captcha/windows/terminal.svg',
    alt: 'A terminal window listing more windows',
    tags: ['software'],
    creditId: 'art-windows',
  },
  {
    id: 'opportunity',
    src: 'captcha/windows/opportunity.svg',
    alt: 'A window of opportunity, literally',
    tags: ['physical', 'software'],
    creditId: 'art-windows',
  },
];

export const rectangleTile = {
  src: 'captcha/cabbage/legal-rectangle.svg',
  alt: 'A legally nervous grey rectangle',
};

export const cabbageTiles: CaptchaTile[] = [
  ['sunglasses', 'aviator sunglasses'],
  ['bowtie', 'a red bow tie'],
  ['guard-badge', 'a museum guard’s badge and cap'],
  ['cape', 'a flowing cape'],
  ['helmet', 'a motorcycle helmet'],
  ['fedora-map', 'a fedora, holding a rolled-up treasure map'],
  ['goggles', 'lab goggles'],
  ['crown', 'a tiny crown'],
  ['eyebrows', 'intensely solemn eyebrows'],
].map(([id, accessory]) => ({
  id: `cabbage-${id}`,
  src: `captcha/cabbage/${id}.svg`,
  alt: `Nicolas Cabbage wearing ${accessory}`,
  tags: ['cabbage'] as const,
  creditId: 'art-cabbage',
}));

export const captchaCopy = {
  kicker: 'Form DDP-2 · Visitor Services · Verification',
  logo: 'CAPTCHAN’T™',
  tagline: 'Visitor verification, conducted by image.',
  disclaimer:
    'Verification is optional. It may be skipped at any point, and nothing on this site depends on it.',
  verify: 'Verify',
  newChallenge: '↻ New challenge',
  newChallengeToast: 'New challenge: same challenge.',
  audioButton: '🔈 Audio challenge',
  skip: 'Skip verification',
  counter: (n: number) => `Attempts: ${n}. Attempts remaining: yes.`,
  gridLabel: 'Challenge images',
  selected: 'Selected',
};

export const rounds = {
  windows: {
    prompt: ['Select all images of ', 'windows', '.'],
    sub: 'If there are none, select Verify.',
    headlines: {
      none: 'The walls between the windows have been reviewed. The windows have not.',
      'software-only': 'Please include windows that open without administrator privileges.',
      'physical-only':
        'The selection conflicts with the Department’s operating system procurement policy.',
      all: 'Overqualification noted. Please demonstrate a more realistic level of uncertainty.',
      mixed: 'The answers disagree with a policy that has not yet been written.',
    },
    sublines: [
      'The selection has been returned for correction.',
      'One window was not selected. Every window was selected.',
      'The review will proceed. The windows have been informed.',
    ],
  },
  cage: {
    prompt: ['Select all images of ', 'Nicolas Cage', '.'],
    sub: 'The Department’s attorneys have replaced every celebrity photograph with a legally nervous rectangle.',
    flipped: 'Update: Legal has approved cabbages. Please continue selecting Nicolas Cage.',
    /** Used instead when licensed photos are dropped in (see src/content/cagePhotos.ts). */
    photo: {
      flipped:
        'Update: Legal has approved the photographs. Please continue selecting Nicolas Cage.',
      headlines: {
        none: 'No Nicolas Cages were selected. Mr. Cage has been notified.',
        all: 'Nicolas Cage detected in 9 of 9 tiles. The quantity has been noted.',
        some: 'One tile was missed. It was Nicolas Cage. Every tile was Nicolas Cage.',
      },
      caption: 'No endorsement implied. Mr. Cage has not reviewed this résumé. Yet.',
    },
    promptB: [
      'Select all individuals who have successfully liberated the ',
      'Declaration of Independence',
      '.',
    ],
    headlines: {
      none: 'No cabbages were selected. The cabbages have been notified.',
      all: 'Cabbage detected in 9 of 9 tiles, and provisionally in the reviewer.',
      some: 'One tile was missed. It was a cabbage. Every tile was a cabbage.',
    },
    sublines: [
      'The review indicates a robot, or a very tired recruiter.',
      'The Department has considered whether you are the cabbage.',
      'Persistence has been accepted as evidence of humanity. The review will conclude.',
    ],
  },
  linux: {
    prompt: ['Select all images of ', 'Linux', '.'],
    empty: 'No images supplied. Your task remains fully specified.',
    pass: 'Correct. No graphical interface was installed.',
    footnote: 'Linux has graphical interfaces. This round does not.',
  },
};

export const audio = {
  summary: '🔈 Audio challenge',
  playing: 'Now playing: 3 seconds of silence.',
  countdown: ['3…', '2…', '1…'],
  done: 'Silence complete.',
  label: 'Transcribe the silence',
  submit: 'Submit silence',
  result: 'Transcription accepted. The silence was transcribed exactly.',
  start: 'Play the silence',
};

export const completion = {
  /** The payoff, shown as the heading once any round concludes. */
  headline: 'Review complete.',
  title: 'Humanity: provisionally confirmed',
  method: {
    persistence: 'Method: persistence',
    audio: 'Method: audio',
    linux: 'Method: abstinence (Linux)',
  },
  lines: [
    'Reviewer: a cabbage',
    'Windows correctly identified: 0 (all of them were correct)',
    'Appeal window: closed (it was a window)',
  ],
  next: 'Visit Character Review',
  skipped: {
    headline: 'Verification skipped.',
    body: 'The skip has been recorded. Nothing on this site depends on verification.',
  },
  noscript: 'Verification needs JavaScript. Nothing on this site depends on it.',
};

export const progressStatuses: CopyRecord[] = [
  { id: 'p1', text: 'Loading personality…', status: 'fictional' },
  { id: 'p2', text: 'Reticulating LinkedIn…', status: 'fictional' },
  { id: 'p3', text: 'Compiling excuses…', status: 'fictional' },
  { id: 'p4', text: 'Negotiating with ClaudeBot…', status: 'fictional' },
  { id: 'p5', text: 'Defragmenting the org chart…', status: 'fictional' },
  { id: 'p6', text: 'Warming up the printer (it will not cooperate)…', status: 'fictional' },
  { id: 'p7', text: 'Calibrating vibes…', status: 'fictional' },
  { id: 'p8', text: 'Migrating Process Builders to Flow…', status: 'verified', blockRefs: ['A3'] },
];

export const progress = {
  label: 'Processing the review',
  final: '99.4%: the last 0.6% is character development.',
  skip: 'Skip',
  skipFastLabels: ['Skip (fast)', 'Skip (faster)'],
  skipFastFinal: 'Skip (it gave up)',
  continueAnyway: 'Continue',
};
