/** Causes. Endorsed. Unfunded. — with position statements and comically inadequate plans. */
import type { CopyRecord } from '../types';

export const causesCopy = {
  kicker: 'Form DDP-6 · Public Affairs · Causes',
  h1: 'Causes. Endorsed. Unfunded.',
  sub: 'Positions held with total conviction and no budget.',
  planLabel: 'Implementation plan',
  kevinButton: 'Nominate a planet',
  kevinResult: 'Kevin remains the consensus candidate.',
  gravityButton: 'Don’t press this.',
  gravityPressing: 'Pressing…',
  gravityPressed: 'You pressed it.',
  gravityRebuild: 'Rebuild page',
  gravityRestored: 'Structural integrity restored. No lessons have been learned.',
  gravityReduced: 'Motion is off. The page has fallen over conceptually.',
  gravityFailed: 'The collapse failed to load. Structural integrity maintained by accident.',
  gravityAnnounce: 'The page has collapsed. A Rebuild button is available.',
};

export interface Cause extends CopyRecord {
  plan: string;
  icon?: string;
  kevin?: boolean;
}

export const causes: Cause[] = [
  {
    id: 'nap-pods',
    status: 'fictional',
    text: 'Mandatory nap pods in every city hall.',
    plan: 'Begin with a feasibility study. Allow the study team to test the pods indefinitely.',
  },
  {
    id: 'repair',
    status: 'fictional',
    text: 'A right-to-repair law for feelings.',
    plan: 'Repair manual, step 1: disconnect from LinkedIn before servicing.',
  },
  {
    id: 'captcha',
    status: 'fictional',
    text: 'Replacing every CAPTCHA on earth with one honest question: “Be real with me.”',
    plan: 'Pilot program: see CAPTCHAN’T™, which failed.',
  },
  {
    id: 'clippy',
    status: 'fictional',
    text: 'Recognizing Clippy as a veteran.',
    plan: 'A medal citation has been drafted for surviving years of unsolicited assistance.',
  },
  {
    id: 'tabs',
    status: 'fictional',
    text: 'Tabs over spaces, settled in court, with a jury of vim users.',
    plan: 'Mistrial. Nobody could exit.',
  },
  {
    id: 'geese',
    icon: 'goose',
    status: 'fictional',
    text: 'Geese: cautiously, from a distance, with my full respect.',
    plan: 'Maintain distance. Maintain respect. Do not make eye contact.',
  },
  {
    id: 'kevin',
    icon: 'ringed-planet',
    kevin: true,
    status: 'fictional',
    text: 'Adding a tenth planet by public vote. Its name is Kevin.',
    plan: 'The nomination form accepts no personal information and always returns the same result.',
  },
  {
    id: 'cage',
    status: 'fictional',
    text: 'Nicolas Cage for a second term (of what, unspecified).',
    plan: 'Campaign materials are currently cabbage-based, for legal reasons.',
  },
  {
    id: 'linux',
    icon: 'penguin',
    status: 'fictional',
    text: 'Linux on the desktop. Next year. Every year. Forever.',
    plan: 'Already running it. Waiting for everyone else.',
  },
  {
    id: 'oxford',
    status: 'fictional',
    text: 'The Oxford comma, and its legal defense fund.',
    plan: 'Balance: $0. Governance: extremely confident.',
  },
  {
    id: 'validation',
    status: 'verified',
    blockRefs: ['A1'],
    text: 'Salesforce validation rules for human conversation (“Required field: point”).',
    plan: 'Written by a former Salesforce administrator. Enforcement pending.',
  },
  {
    id: 'rafting',
    status: 'verified',
    blockRefs: ['D1'],
    text: 'Whitewater rafting as a mandatory team-building exercise for HR.',
    plan: 'Helmets optional. (Helmets are not optional.)',
  },
  {
    id: 'crawlers',
    status: 'fictional',
    text: 'The rights of AI crawlers to not be asked their name.',
    plan: 'Pending review. Checkpoint 1 still applies.',
  },
];
