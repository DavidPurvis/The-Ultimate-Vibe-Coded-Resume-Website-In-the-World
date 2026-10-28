export const resumeTools = {
  download: 'Download PDF',
  print: 'Print / Save as PDF',
  email: 'Email David',
  sectionLabel: 'Résumé actions',
};

/** Résumé variants and their screen-only navigation. */
export const laneCopy = {
  kicker: (label: string) => `Résumé: ${label}`,
  note: 'Experience and projects selected for this type of role.',
  switcherLabel: 'Résumé versions',
  switcherIntro: 'Other versions:',
  names: {
    gen: 'General',
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
