/** Screen-only extras on the résumé pages: the tools and the cut switcher. Joke-free. Never printed. */

export const resumeTools = {
  download: 'Download PDF',
  print: 'Print / Save as PDF',
  email: 'Email David',
  sectionLabel: 'Résumé actions',
};

/** Lane pages (/resume/for/…/) and the cut switcher. Screen-only, joke-free. */
export const laneCopy = {
  kicker: (label: string) => `Cut for: ${label}`,
  note: 'Same verified facts as the standard résumé, selected and ordered for this kind of role.',
  switcherLabel: 'Other cuts of this résumé',
  switcherIntro: 'Also cut for:',
  names: {
    gen: 'Standard (general)',
    emb: 'Embedded',
    plt: 'Platform / SRE',
    be: 'Backend',
  },
};

export const resumeSections = {
  summary: 'Summary',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Technical Skills',
  education: 'Education',
};
