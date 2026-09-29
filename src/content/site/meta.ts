/**
 * Per-route metadata. Titles name the service and the Department; descriptions lead with who
 * David is and describe the procedure plainly. Reference numbers never contain a 7.
 */
export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  /** Departmental reference number, shown on the page. */
  formId?: string;
  ogTitle?: string;
}

const D = 'Department of David Purvis';

export const ROUTES = {
  home: {
    path: '/',
    title: D,
    description:
      'Public access to information concerning David Purvis, software engineer in Broomfield, CO: his résumé, projects, correspondence and several departments.',
    formId: 'DDP-1',
  },
  verify: {
    path: '/verify/',
    title: `Verification · ${D}`,
    description:
      'Visitor verification at the Department of David Purvis, software engineer. Select every image that contains a window.',
    formId: 'DDP-2',
  },
  about: {
    path: '/about/',
    title: `Character Review · ${D}`,
    description:
      'An independent character review of David Purvis, software engineer: ordinary qualities, one committee finding, and supporting evidence.',
    formId: 'DDP-3',
  },
  skills: {
    path: '/skills/',
    title: `Skills Loadout · ${D}`,
    description:
      'David Purvis’s technical skills, issued as an equipment loadout. Rarity reflects where each skill was actually used.',
    formId: 'DDP-4',
  },
  beliefs: {
    path: '/beliefs/',
    title: `Research · ${D}`,
    description:
      'Positions held by David Purvis, software engineer, as reviewed by two members of his CS2 team.',
    formId: 'DDP-5',
  },
  support: {
    path: '/support/',
    title: `Causes · ${D}`,
    description: 'Causes endorsed by David Purvis, software engineer. None are funded.',
    formId: 'DDP-6',
  },
  legal: {
    path: '/legal/',
    title: `Terms of Reading · ${D}`,
    description:
      'The terms under which pages concerning David Purvis, software engineer, may be read.',
    formId: 'DDP-8',
  },
  casino: {
    path: '/casino/',
    title: `Hyperlink Allocation · ${D}`,
    description:
      'Links to David Purvis’s GitHub, LinkedIn, email and PDF résumé, allocated by the Department. Every destination is available; allocation is pending.',
    formId: 'DDP-9',
  },
  contact: {
    path: '/contact/',
    title: `Correspondence · ${D}`,
    description:
      'Contact David Purvis, software engineer. Address preparation instruments are provided; an ordinary email link is also available.',
    formId: 'DDP-10',
  },
  projects: {
    path: '/projects/',
    title: `Projects · ${D}`,
    description:
      'Projects by David Purvis, including a repurposed Spotify Car Thing and a Stream Deck brought up on Linux without vendor software.',
    formId: 'DDP-11',
  },
  howBuilt: {
    path: '/how-it-was-built/',
    title: `How It Was Built · ${D}`,
    description:
      'How David Purvis’s site is built: static pages, one lifecycle for every procedure, a case record kept in the visitor’s own tab, and a résumé kept apart.',
    formId: 'DDP-12',
  },
  credits: {
    path: '/credits/',
    title: `Credits · ${D}`,
    description: 'Fonts, icons, libraries and original art used on David Purvis’s site.',
    formId: 'DDP-13',
  },
  rick: {
    path: '/rick/',
    title: `Musical Material · ${D}`,
    description:
      'Musical material on file for David Purvis, software engineer. Nothing plays until you press the button.',
    formId: 'DDP-14',
  },
  privacy: {
    path: '/privacy/',
    title: `Privacy · ${D}`,
    description:
      'What David Purvis’s site stores in your browser, what it never collects, and a button to clear it.',
    formId: 'DDP-15',
  },
  resume: {
    path: '/resume/',
    title: 'David Purvis — Software Engineer — Résumé',
    description:
      'David Purvis, Software Engineer. Two years owning a municipal system of record; BS Computer Science (Magna Cum Laude); MS Computer Science in progress at CU Boulder.',
  },
  resumeEmb: {
    path: '/resume/for/emb/',
    title: 'David Purvis — Software Engineer — Résumé (Embedded Software)',
    description:
      'David Purvis, Software Engineer: his résumé cut for embedded software roles. Embedded Linux projects, a completed digital logic and microprocessors sequence, and two years of production automation.',
  },
  resumePlt: {
    path: '/resume/for/plt/',
    title: 'David Purvis — Software Engineer — Résumé (Platform, DevOps and SRE)',
    description:
      'David Purvis, Software Engineer: his résumé cut for platform, DevOps and SRE roles. Two years as sole technical owner of a municipal system of record, unattended integrations and a self-hosted CI/CD pipeline.',
  },
  resumeBe: {
    path: '/resume/for/be/',
    title: 'David Purvis — Software Engineer — Résumé (Backend and Distributed Systems)',
    description:
      'David Purvis, Software Engineer: his résumé cut for backend roles. REST API extraction, scheduled batch loading into a financial system of record, and parsing across 100+ schema variants.',
  },
  personnel: {
    path: '/personnel-file/',
    title: `Personnel File · ${D}`,
    description:
      'The personnel file of David Purvis, software engineer: known aliases, credentials on record, and instructions in case of kidnapping.',
    formId: 'DDP-16',
  },
  wishlist: {
    path: '/wishlist/',
    title: `Wishlist · ${D}`,
    description:
      'The wishlist of David Purvis, software engineer: a tungsten cube, a second tungsten cube for symmetry, and quantities of everyday essentials under procurement review.',
    formId: 'DDP-18',
  },
  cube: {
    path: '/cube/',
    title: `Tungsten Cube · ${D}`,
    description:
      'A four-inch tungsten cube from David Purvis’s wishlist, rendered in physically based WebGL. Drag to orbit, heft it, and requisition ten thousand more.',
    formId: 'DDP-19',
  },
  sellData: {
    path: '/sell-your-data/',
    title: `Data Sale Application · ${D}`,
    description:
      'An application form on David Purvis’s site for selling your data at no charge. Nothing you type is stored or sent anywhere.',
    formId: 'DDP-20',
  },
  confess: {
    path: '/confess/',
    title: `Insider Trading Self-Assessment · ${D}`,
    description:
      'A self-assessment on David Purvis’s site concerning any upcoming insider trades you may be anxious about. Answers go nowhere.',
    formId: 'DDP-21',
  },
  nintendo: {
    path: '/nintendo/',
    title: `Public Statement: Dear Nintendo · ${D}`,
    description:
      'A preemptive open letter from David Purvis to Nintendo’s legal department. This website contains no plumbers.',
    formId: 'DDP-22',
  },
  tribute: {
    path: '/tribute/',
    title: 'In Memoriam: Terry A. Davis · David Purvis',
    description:
      'A tribute from David Purvis to Terry A. Davis, who built TempleOS, its compiler and its programming language, alone. Anything is possible.',
  },
  blog: {
    path: '/blog/',
    title: `Newsletter · ${D}`,
    description:
      'Articles by David Purvis: the case against the zipper merge, the goldfish incident, national security through job applications, and Rainbow Six as a teamwork philosophy.',
    formId: 'DDP-28',
  },
  doom: {
    path: '/doom/',
    title: `DOOM · ${D}`,
    description:
      'DOOM shareware episode 1, running inside David Purvis’s website. Chocolate Doom compiled to WebAssembly, loaded only when you press Play.',
    formId: 'DDP-24',
  },
  presentation: {
    path: '/presentation/',
    title: `Résumé.ppt · ${D}`,
    description:
      'David Purvis’s real résumé, restaged as a 1998 slide deck with WordArt, star wipes and cartoon ad-libs. The facts are unchanged.',
    formId: 'DDP-25',
  },
  tailor: {
    path: '/tailor/',
    title: `Résumé Selection · ${D}`,
    description:
      'A short questionnaire that selects the cut of David Purvis’s résumé that fits your role.',
    formId: 'DDP-26',
  },
  notFound: {
    path: '/404.html',
    title: `Record Not Found · ${D}`,
    description: 'There is no page at this address. The résumé is at /resume/.',
  },
} satisfies Record<string, RouteMeta>;

/** Share decoys under /r/: sincere Open Graph copy built only from verified facts. */
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
