/**
 * Two credentials David supplied himself (status 'verified', his words). The Department uses them
 * for status inversion: the candidate outranks the reviewer. Never extend these with invented facts.
 */
const source = { doc: 'david', date: '2026-09', note: 'supplied in chat' } as const;

export const credentials = {
  minister: {
    title: 'Ordained Minister',
    tenure: 'In good standing for 8 years',
    story:
      'Ordained during a 10th-grade math class. The math has since left me. The ministry remains.',
    services:
      'Services offered: weddings, funerals, vow renewals, and blessings of production deploys (Fridays extra).',
    status: 'verified' as const,
    source,
  },
  goldfish: {
    title: 'High School Goldfish Honoree',
    story:
      'A goldfish was named in my honor after I signed the wrong sign-up sheet. I meant to sign up for the swim meet. In a way, I still made the team.',
    status: 'verified' as const,
    source,
  },
};
