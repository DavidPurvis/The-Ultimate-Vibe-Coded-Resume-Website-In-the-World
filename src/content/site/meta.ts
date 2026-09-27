/** Per-route metadata: plain titles and descriptions that lead with who David is. */
export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
}

export const ROUTES = {
  home: {
    path: '/',
    title: 'David Purvis — Software Engineer',
    description:
      'David Purvis, software engineer in Broomfield, CO. Résumé (web, PDF and Markdown), projects and contact.',
  },
  projects: {
    path: '/projects/',
    title: 'Projects · David Purvis',
    description:
      'Projects by David Purvis, including a repurposed Spotify Car Thing and a Stream Deck brought up on Linux without vendor software.',
  },
  howBuilt: {
    path: '/how-it-was-built/',
    title: 'How It Was Built · David Purvis',
    description:
      'How David Purvis’s résumé site was built: one pure reducer, seeded theater, fail-open steps, and a résumé kept separate from the joke.',
  },
  privacy: {
    path: '/privacy/',
    title: 'Privacy · David Purvis',
    description:
      'What David Purvis’s résumé site stores (one session key in this tab), what it never collects, and a button to clear it.',
  },
  credits: {
    path: '/credits/',
    title: 'Credits · David Purvis',
    description: 'Fonts, icons, libraries and original art used on David Purvis’s résumé site.',
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
  tribute: {
    path: '/tribute/',
    title: 'In Memoriam: Terry A. Davis · David Purvis',
    description:
      'A tribute from David Purvis to Terry A. Davis, who built TempleOS, its compiler and its programming language, alone. Anything is possible.',
  },
  doom: {
    path: '/doom/',
    title: 'DOOM · David Purvis',
    description:
      'DOOM shareware episode 1, running inside David Purvis’s résumé website. Chocolate Doom compiled to WebAssembly, loaded only when you press Play.',
  },
  notFound: {
    path: '/404.html',
    title: 'Not Found · David Purvis',
    description: 'There is no page at this address. The résumé is at /resume/.',
  },
} satisfies Record<string, RouteMeta>;

export const OG_IMAGE_ALT = 'A rubber stamp reading UNDER REVIEW over David Purvis’s name';
