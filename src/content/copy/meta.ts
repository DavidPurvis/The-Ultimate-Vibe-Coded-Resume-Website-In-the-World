/** Per-route metadata. Descriptions lead with who David is; the joke comes second. */
export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  formId?: string;
  ogTitle?: string;
  cursor?: 'cabbage' | 'paddle' | 'crosshair';
}

export const ROUTES = {
  home: {
    path: '/',
    title: 'Identity Checkpoint · David Purvis',
    description:
      'Résumé of David Purvis, software engineer in Broomfield, CO. Before you proceed: the Department of Recruiter Verification would like to know which model you are.',
    formId: 'DRV-1',
  },
  verify: {
    path: '/verify/',
    title: 'CAPTCHAN’T™ · David Purvis',
    description:
      'David Purvis’s résumé site. Please prove you are human by selecting all images of windows. All of them are windows.',
    formId: 'DRV-2',
    cursor: 'cabbage',
  },
  about: {
    path: '/about/',
    title: 'Independent Character Review · David Purvis',
    description:
      'David Purvis, software engineer. Green flags, independently unverified and aggressively self-reported.',
    formId: 'DRV-3',
    cursor: 'paddle',
  },
  skills: {
    path: '/skills/',
    title: 'Loadout · David Purvis',
    description:
      'David Purvis’s technical skills rendered as a weapon loadout. Float values are fictional; the skills are not.',
    formId: 'DRV-4',
    cursor: 'crosshair',
  },
  beliefs: {
    path: '/beliefs/',
    title: 'Peer-Reviewed Research · David Purvis',
    description:
      'Peer-reviewed by two guys from David’s CS2 team. Obvious satire; no advice of any kind.',
    formId: 'DRV-5',
  },
  support: {
    path: '/support/',
    title: 'Causes. Endorsed. Unfunded. · David Purvis',
    description: 'Causes David Purvis endorses. None are funded. One is a planet named Kevin.',
    formId: 'DRV-6',
  },
  legal: {
    path: '/legal/',
    title: 'Legally Binding Vibes · David Purvis',
    description:
      'What this résumé site actually does with your data (nothing), followed by several legally meaningless agreements.',
    formId: 'DRV-8',
  },
  casino: {
    path: '/casino/',
    title: 'Link Roulette · David Purvis',
    description:
      'Every link on David Purvis’s résumé site is decided by a rigged roulette wheel. The house guarantees your link by the third spin.',
    formId: 'DRV-9',
    cursor: 'crosshair',
  },
  contact: {
    path: '/contact/',
    title: 'Contact (Theoretically) · David Purvis',
    description: 'Contact David Purvis, theoretically. The phone field is a slider.',
    formId: 'DRV-10',
  },
  projects: {
    path: '/projects/',
    title: 'Case Files · David Purvis',
    description:
      'Case files: projects by David Purvis, including a repurposed Spotify Car Thing and a Stream Deck brought up on Linux without vendor software.',
    formId: 'DRV-11',
  },
  howBuilt: {
    path: '/how-it-was-built/',
    title: 'How This Was Built · David Purvis',
    description:
      'How a deliberately hostile résumé site was engineered to be accessible, private, testable and honest.',
    formId: 'DRV-12',
  },
  credits: {
    path: '/credits/',
    title: 'Credits · David Purvis',
    description: 'Fonts, icons, libraries and original art used on David Purvis’s résumé site.',
    formId: 'DRV-13',
  },
  rick: {
    path: '/rick/',
    title: 'Mandatory Musical Due Diligence · David Purvis',
    description:
      'Every candidate file is subject to musical due diligence. Nothing plays until you press the button.',
    formId: 'DRV-14',
  },
  resume: {
    path: '/resume/',
    title: 'David Purvis — Software Engineer — Résumé',
    description:
      'David Purvis, Software Engineer. Two years owning a municipal system of record; BS Computer Science (Magna Cum Laude); MS Computer Science in progress at CU Boulder.',
  },
  notFound: {
    path: '/404.html',
    title: '404: Failed the CAPTCHA · David Purvis',
    description: 'This page failed the CAPTCHA. The résumé did not.',
    formId: 'DRV-404',
  },
} satisfies Record<string, RouteMeta>;

/** Share decoys under /r/ — sincere Open Graph copy built only from verified facts. */
export const DECOYS = [
  {
    slug: 'oracle-integration',
    n: 1,
    block: 'A2',
    title: 'A Salesforce-to-Oracle Integration',
    description: 'A scheduled Python integration that removed ~125 hours of annual manual entry.',
    target: '/resume/',
  },
  {
    slug: 'xml-parser',
    n: 2,
    block: 'C1',
    title: 'An Adaptive XML Parser',
    description: '100+ schema variants at 1,000 files per minute.',
    target: '/resume/',
  },
  {
    slug: 'car-thing',
    n: 3,
    block: 'P1',
    title: 'The Car Thing Media Controller',
    description:
      'A discontinued embedded Linux touch device, repurposed as a desk media controller.',
    target: '/projects/#car-thing',
  },
] as const;

export const OG_IMAGE_ALT = 'A rubber stamp reading UNDER REVIEW over David Purvis’s name';
