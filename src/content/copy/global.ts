/** Global chrome copy: header, nav, footer, exits, modes, themes, threat meter, tab guilt. */

export const DEPARTMENT = 'Department of Recruiter Verification';

export const header = {
  name: 'David Purvis',
  role: 'Software Engineer',
  location: 'Broomfield, CO',
  deptLine: (formId: string) => `${DEPARTMENT} · Form ${formId}`,
  navLabel: 'Departments',
};

/** The Departments menu. The résumé is deliberately not listed (maximum hostility). */
export const nav = [
  { path: '/', label: 'Identity Checkpoint' },
  { path: '/verify/', label: 'CAPTCHAN’T™' },
  { path: '/about/', label: 'Character Review' },
  { path: '/skills/', label: 'Loadout' },
  { path: '/beliefs/', label: 'Research' },
  { path: '/support/', label: 'Causes' },
  { path: '/legal/', label: 'Legally Binding Vibes' },
  { path: '/casino/', label: 'Link Roulette' },
  { path: '/contact/', label: 'Contact' },
  { path: '/projects/', label: 'Case Files' },
  { path: '/how-it-was-built/', label: 'How This Was Built' },
] as const;

export const exits = {
  skipLink: 'Skip the gauntlet → résumé',
  hatch: 'I’m a recruiter with a deadline →',
  hatchLabels: ['…with a very real deadline →', 'fine. → résumé'],
};

export const footer = {
  modeLabel: 'Recruiter Mode',
  modeOn: 'Recruiter Mode: On. HR has re-entered the building.',
  modeOff: 'Recruiter Mode: Off',
  links: [
    { path: '/how-it-was-built/', label: 'How This Was Built' },
    { path: '/credits/', label: 'Credits' },
    { path: '/legal/', label: 'Legally Binding Vibes' },
  ],
  copyright:
    '© 2026 David Purvis. Code released into the public domain; assets keep their own licenses (see Credits).',
  tagline: 'Nothing on this site tracks you. Several things on this site judge you.',
};

export const modeToasts = {
  recruiter: 'Recruiter Mode engaged. All jokes suspended. HR has re-entered the building.',
  chaos: 'Chaos restored. HR has left the building.',
};

export const recruiterBar = {
  text: 'Recruiter Mode is on. The Department has stood down.',
  button: 'Re-enable chaos',
};

export const themes = {
  labels: {
    light: 'Light',
    dark: 'Dark',
    darker: 'Darker',
    'lights-out': 'Lights Out',
    comic: 'Light (Comic Sans)',
  },
  buttonPrefix: 'Theme:',
  reset: 'Reset theme',
  lightsOutHint:
    'Lights Out. The flashlight follows your cursor (or your focus). Press Esc to turn the lights on.',
};

export const threat = {
  label: 'Recruiter Threat Level:',
  levels: ['LOW', 'ELEVATED', 'SEVERE', 'PLEASE HIRE HIM SO HE STOPS'],
  announce: (level: string) => `Recruiter Threat Level raised to ${level}.`,
};

export const tabGuilt = {
  away: [
    'come back 🥺',
    '(1) new message from your conscience',
    'I saw you open LinkedIn',
    'Ctrl+W? In THIS economy?',
    '(47) unread apologies',
    'the cookie banner misses you',
  ],
  back: 'oh thank god',
};

export const callbacks = {
  claimed: (label: string) => `Welcome back, self-declared ${label}.`,
  refused: 'Visitor classification: administratively inconvenient.',
  unknown: 'Visitor identity: not administratively established.',
};

export const toastCloseLabel = 'Dismiss notification';
