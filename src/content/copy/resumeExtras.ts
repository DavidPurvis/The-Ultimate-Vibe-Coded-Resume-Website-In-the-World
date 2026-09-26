/** Screen-only extras on /resume/: tools, fine print, the Hire chain. Never printed. */

export const resumeTools = {
  download: 'Download PDF',
  print: 'Print / Save as PDF',
  hire: 'Hire David',
  fine: 'This page is the reward. It contains no jokes. The PDF contains one, in its metadata.',
  sectionLabel: 'Résumé actions',
};

export const hireChain = {
  closeLabel: 'Close hiring dialog',
  steps: [
    { title: 'Hire David?', body: 'Are you sure?', yes: 'Yes', no: 'No' },
    {
      title: 'Are you double sure?',
      body: 'Double sure is a legally distinct level of sure.',
      yes: 'Double yes',
      no: 'Let me think about it',
    },
    {
      title: 'Have you consulted Claude?',
      body: 'Industry best practice, apparently.',
      yes: 'Yes',
      no: 'No, I’m a professional',
    },
  ],
  consulting: 'Consulting Claude on your behalf…',
  final: {
    title: 'Claude says yes.',
    fine: '(This endorsement is fictional. Claude was not consulted. Claude has a lot going on.)',
    button: 'Open email to David →',
  },
  declined: 'Understandable. The résumé will be here.',
  subject: 'Hiring inquiry (via the website that asked if I was Claude)',
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
