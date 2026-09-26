/** Personnel File (Unauthorized): aliases, credentials, dietary intelligence, emergency protocol. */
import type { CopyRecord } from '../types';
import type { PersonalFact } from '../pending';

export const personnelCopy = {
  kicker: 'FORM DRV-16 · PERSONNEL FILE (UNAUTHORIZED)',
  h1: 'Personnel File',
  sub: 'Compiled by the Department from sources it will not name, mostly the subject.',
  aliasesHeading: 'Known aliases',
  aliasesNote: 'Subject answers to all of the following. Subject answers faster to some.',
  originLabel: 'Origin',
  originUnknown: 'classified',
  credentialsHeading: 'Credentials the résumé left out',
  foodsHeading: 'Dietary intelligence',
  foodsNote: 'Favorite foods, as reported by the subject.',
  kidnapHeading: 'Important instructions if kidnapped',
  kidnapNote: 'To be read aloud by whoever notices first. Probably my R6 squad.',
  r6Heading: 'Rainbow Six Siege service record',
  r6Profile: 'Full tracker profile ↗',
  r6ProfileUrl: 'https://r6.tracker.network/r6siege/profile/ubi/Sasquatch.-/overview',
  wishlistLink: 'The subject has also filed a wishlist →',
};

export interface Alias {
  id: string;
  name: string;
  note: string;
  origin: PersonalFact;
}

const origin = (id: string): PersonalFact => ({
  id: `origin-${id}`,
  label: 'Origin',
  text: '',
  status: 'needs-review',
});

/** Nicknames as supplied by David. Origins stay classified until he declassifies them. */
export const aliases: Alias[] = [
  {
    id: 'big-purv',
    name: 'Big Purv',
    note: 'Known associates: everyone.',
    origin: origin('big-purv'),
  },
  {
    id: 'bp',
    name: 'BP',
    note: 'Stands for Big Purv. Does not stand for anything else. Please stop asking.',
    origin: origin('bp'),
  },
  {
    id: 'dragon',
    name: 'Dragon',
    note: 'Breathes fire on production incidents. Metaphorically.',
    origin: origin('dragon'),
  },
  {
    id: 'bruce',
    name: 'Bruce',
    note: 'Nobody knows why. That is the point.',
    origin: origin('bruce'),
  },
  {
    id: 'assquatch',
    name: 'Assquatch',
    note: 'Sighted in the wild. Blurry photos only.',
    origin: origin('assquatch'),
  },
  {
    id: 'billy-bob-joe',
    name: 'Billy Bob Joe',
    note: 'Three first names. Zero last names. Full legal authority.',
    origin: origin('billy-bob-joe'),
  },
  {
    id: 'sasquatch',
    name: 'Sasquatch.-',
    note: 'Rainbow Six Siege handle. The period and the hyphen are load-bearing.',
    origin: origin('sasquatch'),
  },
];

export const credentials = {
  minister: {
    title: 'Ordained Minister',
    tenure: 'In good standing for 8 years',
    story:
      'Ordained during a 10th-grade math class. The math has since left me. The ministry remains.',
    services:
      'Services offered: weddings, funerals, vow renewals, and blessings of production deploys (Fridays extra).',
    status: 'verified' as const,
  },
  goldfish: {
    title: 'High School Goldfish Honoree',
    story:
      'A goldfish was named in my honor after I signed the wrong sign-up sheet. I meant to sign up for the swim meet. In a way, I still made the team.',
    status: 'verified' as const,
  },
};

/** The fish's actual name. Hidden until David supplies it. */
export const goldfishName: PersonalFact = {
  id: 'goldfish-name',
  label: 'The fish’s name',
  text: '',
  status: 'needs-review',
};

/** Favorite foods. Add items with status 'verified'; the section stays hidden until one exists. */
export const favoriteFoods: PersonalFact[] = [];

export const kidnapInstructions: CopyRecord[] = [
  {
    id: 'k1',
    status: 'fictional',
    text: 'Do not pay the ransom in exposure. I have enough exposure. I have a website.',
  },
  {
    id: 'k2',
    status: 'fictional',
    text: 'Do not negotiate. Within the hour I will have explained Linux to my captors, and they will return me voluntarily.',
  },
  {
    id: 'k3',
    status: 'fictional',
    text: 'Proof of life: I will correctly identify every window in a CAPTCHA.',
  },
  {
    id: 'k4',
    status: 'fictional',
    text: 'If they ask for my emergency contact, give them my emergency contact’s emergency contact. We don’t talk about why.',
  },
  {
    id: 'k5',
    status: 'fictional',
    text: 'Do not let them zipper merge on the getaway. Adaptive early merge only.',
  },
  {
    id: 'k6',
    status: 'fictional',
    text: 'If I am released near moving water, I will get myself home. I used to guide rafts for a living.',
    blockRefs: ['D1'],
  },
  {
    id: 'k7',
    status: 'fictional',
    text: 'The ransom note must be one page, single column, and readable by an applicant-tracking system.',
  },
  {
    id: 'k8',
    status: 'fictional',
    text: 'Check with my Rainbow Six squad first. They notice within minutes when Mute doesn’t show up.',
  },
  {
    id: 'k9',
    status: 'fictional',
    text: 'Offer them the tungsten cube. It won’t help, but it will be heavy.',
  },
  { id: 'k10', status: 'fictional', text: 'Under no circumstances let them see my browser tabs.' },
];

/** Operator mains are David's own; the numbers wait for him. */
export const r6 = {
  mains: [
    {
      operator: 'Thermite',
      side: 'Attack',
      role: 'Hard breacher: opens the reinforced wall so the team can win the round.',
    },
    {
      operator: 'Mute',
      side: 'Defense',
      role: 'Signal jammer: shuts down the drones before they find anyone.',
    },
  ],
  stats: [
    { id: 'rank', label: 'Rank', text: '', status: 'needs-review' },
    { id: 'kd', label: 'K/D', text: '', status: 'needs-review' },
    { id: 'win', label: 'Win rate', text: '', status: 'needs-review' },
    { id: 'hours', label: 'Hours', text: '', status: 'needs-review' },
  ] as PersonalFact[],
};
