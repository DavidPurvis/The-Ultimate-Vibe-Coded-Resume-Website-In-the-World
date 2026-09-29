/**
 * Terms of reading. The terms concern the act of reading them, grow while they are read, and end
 * with one acknowledgement. What the site actually stores is on the Privacy page, in plain words.
 */
export const legalCopy = {
  kicker: 'Form DDP-8 · Facilities · Terms of reading',
  h1: 'Terms of reading',
  lede: 'These terms govern the reading of these terms. Additional terms are issued as reading proceeds.',
  privacyNote: 'What this site stores, and how to delete it, is described plainly on the',
  privacyLink: 'Privacy page',
  conditionsHeading: 'Standing conditions',
};

export const standingTerms: { heading: string; body: string }[] = [
  {
    heading: 'Section 38.4 — Continued existence',
    body: 'Readers within approximately fifteen feet of this website are considered to be reading it. Printers remain the reader’s responsibility. The Department makes no warranty that LinkedIn is emotionally safe.',
  },
  {
    heading: 'Rider 2.1 — Confections',
    body: 'Any interview arising from this website is conducted in the presence of four dark-brown confections, supplied by the interviewer.',
  },
  {
    heading: 'License grant',
    body: 'The reader grants David Purvis a non-exclusive, non-transferable license to be remembered. The license ends when the reader forgets.',
  },
  {
    heading: 'Definitions',
    body: '“Synergy” is not defined here or elsewhere.',
  },
];

export const tos = {
  label: 'Terms of reading',
  initial: [
    'Preamble. These terms govern your reading of these terms.',
    '§0.1 Reading proceeds downward.',
    '§0.2 The Department may issue further terms while reading proceeds.',
    '§0.3 Reading should continue.',
  ],
  appended: [
    '§1.1 Reading that has occurred is recorded as having occurred. It is not recorded anywhere else.',
    '§1.2 The Department may amend these terms during reading, including now.',
    '§2.4 The Department makes no warranty that the scrollbar will stop growing.',
    '§3.3 Glancing is reading, for the purposes of these terms.',
    '§4.1 Skimming is reading, conducted with less commitment.',
    '§4.2 By reading this sentence, you have read this sentence.',
  ],
  button: 'I have read this sentence.',
  receipt: 'Reading acknowledged.',
};
