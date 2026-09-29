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
    sub: 'If there are none, click Verify. (There are some.)',
    headlines: {
      none: 'You appear to be evaluating the walls between the windows.',
      'software-only':
        'Please include windows that can be opened without administrator privileges.',
      'physical-only':
        'Your selection is incompatible with our operating system procurement policy.',
      all: 'Overqualification detected. Please demonstrate a more realistic level of uncertainty.',
      mixed: 'Your answers disagree with a policy we have not written yet.',
    },
    sublines: [
      'Incorrect. Please try again.',
      'You missed one. (You didn’t.)',
      'Real humans are more selective. Moving on. The windows will remember this.',
    ],
  },
  cage: {
    prompt: ['Select all images of ', 'Nicolas Cage', '.'],
    sub: 'Our attorneys have replaced every celebrity photograph with a legally nervous rectangle.',
    flipped: 'Update: legal has approved cabbages. Please continue selecting Nicolas Cage.',
    /** Used instead when licensed photos are dropped in (see src/content/cagePhotos.ts). */
    photo: {
      flipped:
        'Update: legal has approved the photographs. Please continue selecting Nicolas Cage.',
      headlines: {
        none: 'You’ve selected no Nicolas Cages. Mr. Cage noticed.',
        all: 'Nicolas Cage detected in 9/9 tiles. That is a lot of Cage.',
        some: 'You missed one. It was Nicolas Cage. They were all Nicolas Cage.',
      },
      caption: 'No endorsement implied. Mr. Cage has not reviewed this résumé. Yet.',
    },
    promptB: [
      'Select all individuals who have successfully liberated the ',
      'Declaration of Independence',
      '.',
    ],
    headlines: {
      none: 'You’ve selected no cabbages. The cabbages noticed.',
      all: 'Cabbage detected in 9/9 tiles. So are you.',
      some: 'You missed one. It was a cabbage. They were all cabbages.',
    },
    sublines: [
      'Our models indicate you may be a robot, or a very tired recruiter.',
      'Have you considered that you are the cabbage?',
      'Fine. You’ve proven you’re either human or extremely persistent, and both are hireable.',
    ],
  },
  linux: {
    prompt: ['Select all images of ', 'Linux', '.'],
    empty: 'No images supplied. Your task remains fully specified.',
    pass: 'Correct. You have successfully refrained from installing a graphical interface.',
    footnote: 'Linux has graphical interfaces. The joke does not.',
  },
};

export const audio = {
  summary: '🔈 Audio challenge',
  playing: 'Now playing: 3 seconds of silence.',
  countdown: ['3…', '2…', '1…'],
  done: 'Silence complete.',
  label: 'Transcribe the silence',
  submit: 'Submit silence',
  result: 'Transcription accepted. Flawless. Audio challenge passed. Humanity confirmed by ear.',
  start: 'Play the silence',
};

export const completion = {
  title: 'HUMANITY: PROVISIONALLY CONFIRMED',
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
  skippedReceipt: 'Verification skipped. The inspection has been recorded as completed.',
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
  label: 'Processing humanity',
  final: '99.4%: the last 0.6% is character development.',
  skip: 'Skip',
  skipFastLabels: ['Skip (fast)', 'Skip (faster)'],
  skipFastFinal: 'Skip (it gave up)',
  continueAnyway: 'Continue anyway →',
};
