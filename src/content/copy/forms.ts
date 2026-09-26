/**
 * Parody forms. They collect nothing: no <form>, no submit path without JS, no storage, no network,
 * autocomplete off, and no fields a real form would use to take something from you.
 */
export type Field =
  | { kind: 'choice'; id: string; label: string; options: readonly string[] }
  | { kind: 'select'; id: string; label: string; options: readonly string[] }
  | { kind: 'text'; id: string; label: string; placeholder?: string; hint?: string }
  | { kind: 'number'; id: string; label: string; min: number; max: number; hint?: string }
  | {
      kind: 'range';
      id: string;
      label: string;
      min: number;
      max: number;
      minLabel: string;
      maxLabel: string;
    };

export interface ParodyFormCopy {
  id: 'sell' | 'confess';
  kicker: string;
  h1: string;
  lede: string;
  callout?: string;
  fields: readonly Field[];
  submit: string;
  processing: string;
  receiptTitle: string;
  receipt: readonly string[];
  again: string;
  disclaimer: string;
}

export const sellData: ParodyFormCopy = {
  id: 'sell',
  kicker: 'FORM DRV-20 · DATA BROKERAGE (PRO BONO)',
  h1: 'Would You Like to Sell Your Data for Free?',
  lede: 'Other websites take your data and pay you nothing. We are proud to offer the same deal, with the paperwork in plain sight.',
  fields: [
    {
      kind: 'choice',
      id: 'consent',
      label: 'Would you like to sell your data for free?',
      options: ['Yes, for $0.00', 'Yes, reluctantly', 'Yes (there is no “no”)'],
    },
    {
      kind: 'number',
      id: 'tabs',
      label: 'How many browser tabs do you have open right now?',
      min: 0,
      max: 9999,
    },
    {
      kind: 'text',
      id: 'search',
      label: 'Your most embarrassing search this week',
      placeholder: 'e.g., “how to center a div”',
      hint: 'This never leaves your browser. It barely leaves this box.',
    },
    {
      kind: 'range',
      id: 'posture',
      label: 'Rate your posture',
      min: 1,
      max: 10,
      minLabel: 'shrimp',
      maxLabel: 'Victorian',
    },
    {
      kind: 'select',
      id: 'cried',
      label: 'When did you last cry at an ad?',
      options: ['Today', 'This week', 'During this form', 'I am crying now', 'Never (suspicious)'],
    },
    {
      kind: 'text',
      id: 'screen',
      label: 'Your screen time, rounded down generously',
      placeholder: 'e.g., “2 hours” (it was 9)',
    },
    {
      kind: 'choice',
      id: 'gif',
      label: 'GIF: hard G or soft G?',
      options: [
        'Hard G',
        'Soft G',
        'I say it differently every time',
        'I just say “the moving picture”',
      ],
    },
    {
      kind: 'choice',
      id: 'mute',
      label: 'Which kind of coworker would you mute on calls?',
      options: [
        'The loud typist',
        'The “can everyone see my screen?”',
        'The one on a train',
        'Me. I would mute me.',
      ],
    },
    {
      kind: 'range',
      id: 'credit',
      label: 'Credit score (vibes-based)',
      min: 0,
      max: 100,
      minLabel: 'bad vibes',
      maxLabel: 'immaculate vibes',
    },
    {
      kind: 'range',
      id: 'social',
      label: 'Social security: how socially secure do you feel?',
      min: 0,
      max: 10,
      minLabel: 'hiding in the bathroom at a party',
      maxLabel: 'hosting the party',
    },
    {
      kind: 'choice',
      id: 'blood',
      label: 'Blood type',
      options: ['A', 'B', 'AB', 'O', 'Monster Energy', 'Cold brew'],
    },
    {
      kind: 'choice',
      id: 'fear',
      label: 'Deepest workplace fear',
      options: ['Reply All', 'An unmuted mic', '“Quick call?”', 'A Friday deploy'],
    },
  ],
  submit: 'Sell my data for $0.00',
  processing: 'Processing your sale… locally, and not at all.',
  receiptTitle: 'TRANSACTION COMPLETE',
  receipt: [
    'Sold to: nobody',
    'Price: $0.00',
    'Bytes transmitted: 0',
    'Stored: nowhere',
    'Your answers have been set to null. The form has been cleared.',
    'Thank you for your business. There was no business.',
  ],
  again: 'Sell it again',
  disclaimer:
    'Nothing on this page is sent, saved or seen by anyone. There is no server. There is barely a website.',
};

export const confess: ParodyFormCopy = {
  id: 'confess',
  kicker: 'FORM DRV-21 · INSIDER TRADING SELF-ASSESSMENT (FORM 10-Q&A)',
  h1: 'Insider Trading Self-Assessment',
  lede: 'A voluntary, confidential, legally meaningless questionnaire. Your answers go nowhere, which is also where they are safest.',
  callout:
    'The only material non-public information on this page: David is available. Trade accordingly.',
  fields: [
    {
      kind: 'choice',
      id: 'anxious',
      label: 'Are you anxious about any upcoming insider trades you might make?',
      options: ['Yes', 'No', 'What’s an insider?', 'Define “upcoming”'],
    },
    {
      kind: 'choice',
      id: 'gym',
      label: 'Have you ever bought a stock because a guy at the gym winked?',
      options: ['Yes', 'No', 'He nodded, which is different', 'I am the guy at the gym'],
    },
    {
      kind: 'number',
      id: 'burners',
      label: 'How many burner phones do you own?',
      min: 0,
      max: 99,
      hint: 'The correct answer is zero.',
    },
    {
      kind: 'range',
      id: 'poker',
      label: 'Rate your poker face',
      min: 1,
      max: 10,
      minLabel: 'reads like a billboard',
      maxLabel: 'unreadable, like my code',
    },
    {
      kind: 'choice',
      id: 'nfa',
      label:
        'Have you ever said “not financial advice” immediately before giving financial advice?',
      options: ['Yes', 'Yes, twice', 'Only on podcasts', 'Never (this is financial advice)'],
    },
    {
      kind: 'text',
      id: 'mnpi',
      label: 'Describe your relationship with material, non-public information',
      placeholder: 'e.g., “we’ve never met”',
    },
    {
      kind: 'select',
      id: 'disclose',
      label: 'Is there anything else you would like to disclose?',
      options: ['No', 'Not in writing', 'Only to my lawyer', 'That I read this whole form'],
    },
  ],
  submit: 'Submit confession to no one',
  processing: 'Filing with nobody…',
  receiptTitle: 'CONFESSION RECEIVED (BY NO ONE)',
  receipt: [
    'Filed with: nobody',
    'SEC notified: no',
    'Neither was anyone else',
    'Your answers have been cleared from this page.',
    'Please don’t do crimes. They’re bad for résumés.',
  ],
  again: 'Confess again',
  disclaimer:
    'Satire. Not legal advice. If you actually have material non-public information, talk to a lawyer, not a résumé website.',
};
